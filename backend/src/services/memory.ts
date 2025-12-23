// AI Arena - Memory Service
// Handles persistent memory for users and teams

import { prisma } from '../utils/prisma.js';
import { redis } from '../utils/redis.js';
import { encryptionService } from './encryption.js';
import { embeddingService } from './embeddings.js';
import { logger } from '../utils/logger.js';
import { MemoryScope, MemoryType } from '@prisma/client';

interface MemoryEntry {
  id: string;
  scope: MemoryScope;
  type: MemoryType;
  content: string;
  importance: number;
  createdAt: Date;
}

interface SaveMemoryParams {
  userId?: string;
  teamId?: string;
  content: string;
  type?: MemoryType;
  sourceConversationId?: string;
  sourceModelId?: string;
  importance?: number;
}

class MemoryService {
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly MAX_CONTEXT_MEMORIES = 20;

  /**
   * Save a conversation memory
   */
  async saveConversationMemory(params: SaveMemoryParams): Promise<MemoryEntry> {
    return this.saveMemory({
      ...params,
      type: 'CONVERSATION',
    });
  }

  /**
   * Save a preference memory
   */
  async savePreference(params: SaveMemoryParams): Promise<MemoryEntry> {
    return this.saveMemory({
      ...params,
      type: 'PREFERENCE',
      importance: 0.9, // Preferences are highly important
    });
  }

  /**
   * Save a fact memory
   */
  async saveFact(params: SaveMemoryParams): Promise<MemoryEntry> {
    return this.saveMemory({
      ...params,
      type: 'FACT',
      importance: 0.8,
    });
  }

  /**
   * Save a context memory
   */
  async saveContext(params: SaveMemoryParams): Promise<MemoryEntry> {
    return this.saveMemory({
      ...params,
      type: 'CONTEXT',
      importance: 0.6,
    });
  }

  /**
   * Save a project memory
   */
  async saveProjectMemory(params: SaveMemoryParams): Promise<MemoryEntry> {
    return this.saveMemory({
      ...params,
      type: 'PROJECT',
      importance: 0.85,
    });
  }

  /**
   * Core save memory function
   */
  private async saveMemory(params: SaveMemoryParams): Promise<MemoryEntry> {
    const {
      userId,
      teamId,
      content,
      type = 'CONVERSATION',
      sourceConversationId,
      sourceModelId,
      importance = 0.5,
    } = params;

    // Determine scope
    const scope: MemoryScope = teamId ? 'TEAM' : userId ? 'USER' : 'GLOBAL';
    const scopeId = teamId || userId;

    if (!scopeId && scope !== 'GLOBAL') {
      throw new Error('Either userId or teamId must be provided');
    }

    // Generate embedding for semantic search
    const embedding = await embeddingService.createEmbedding(content);

    // Encrypt content if user/team scoped
    let encryptedContent: Buffer | null = null;
    let encryptionIV: string | null = null;

    if (scope !== 'GLOBAL' && scopeId) {
      const encrypted = await encryptionService.encrypt(content, scopeId);
      encryptedContent = encrypted.encrypted;
      encryptionIV = encrypted.iv;
    }

    // Save to database
    const memory = await prisma.memory.create({
      data: {
        scope,
        userId: scope === 'USER' ? userId : null,
        teamId: scope === 'TEAM' ? teamId : null,
        type,
        content: scope === 'GLOBAL' ? content : '', // Only store plain content for global
        contentEncrypted: encryptedContent,
        encryptionIV,
        // Note: embedding stored as raw SQL due to pgvector
        sourceConversationId,
        sourceModelId,
        importance,
      },
    });

    // Store embedding separately (Prisma doesn't support vector type directly)
    await prisma.$executeRaw`
      UPDATE memories 
      SET embedding = ${embedding}::vector 
      WHERE id = ${memory.id}
    `;

    // Invalidate cache
    await this.invalidateCache(userId, teamId);

    logger.debug(`Memory saved: ${memory.id} (${type})`);

    return {
      id: memory.id,
      scope: memory.scope,
      type: memory.type,
      content,
      importance: memory.importance,
      createdAt: memory.createdAt,
    };
  }

  /**
   * Get relevant memories for a query
   */
  async getRelevantMemories(
    userId: string,
    teamId?: string,
    query: string,
    limit = 10
  ): Promise<MemoryEntry[]> {
    // Try cache first
    const cacheKey = `memory:relevant:${userId}:${teamId || 'none'}:${Buffer.from(query).toString('base64').slice(0, 20)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Generate query embedding
    const queryEmbedding = await embeddingService.createEmbedding(query);

    // Search by vector similarity
    const memories = await prisma.$queryRaw<Array<{
      id: string;
      scope: MemoryScope;
      type: MemoryType;
      content: string;
      content_encrypted: Buffer | null;
      encryption_iv: string | null;
      importance: number;
      created_at: Date;
      user_id: string | null;
      team_id: string | null;
      similarity: number;
    }>>`
      SELECT 
        id, 
        scope, 
        type, 
        content,
        "contentEncrypted" as content_encrypted,
        "encryptionIV" as encryption_iv,
        importance, 
        "createdAt" as created_at,
        "userId" as user_id,
        "teamId" as team_id,
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM memories
      WHERE (
        ("userId" = ${userId} AND scope = 'USER')
        OR ("teamId" = ${teamId || ''} AND scope = 'TEAM')
        OR scope = 'GLOBAL'
      )
      ORDER BY similarity DESC, importance DESC
      LIMIT ${limit}
    `;

    // Decrypt and process
    const result: MemoryEntry[] = await Promise.all(
      memories.map(async (m) => {
        let content = m.content;

        if (m.content_encrypted && m.encryption_iv) {
          const scopeId = m.scope === 'TEAM' ? m.team_id : m.user_id;
          if (scopeId) {
            content = await encryptionService.decrypt(
              m.content_encrypted,
              m.encryption_iv,
              scopeId
            );
          }
        }

        return {
          id: m.id,
          scope: m.scope,
          type: m.type,
          content,
          importance: m.importance,
          createdAt: m.created_at,
        };
      })
    );

    // Update access counts
    await prisma.memory.updateMany({
      where: { id: { in: result.map(m => m.id) } },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    // Cache result
    await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 min cache

    return result;
  }

  /**
   * Get all memories for a user/team (for context building)
   */
  async getContextMemories(
    userId: string,
    teamId?: string,
    types?: MemoryType[]
  ): Promise<MemoryEntry[]> {
    const cacheKey = `memory:context:${userId}:${teamId || 'none'}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const memories = await prisma.memory.findMany({
      where: {
        OR: [
          { userId, scope: 'USER' },
          { teamId: teamId || undefined, scope: 'TEAM' },
          { scope: 'GLOBAL' },
        ],
        type: types?.length ? { in: types } : undefined,
      },
      orderBy: [
        { importance: 'desc' },
        { lastAccessedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      take: this.MAX_CONTEXT_MEMORIES,
    });

    // Decrypt
    const result: MemoryEntry[] = await Promise.all(
      memories.map(async (m) => {
        let content = m.content;

        if (m.contentEncrypted && m.encryptionIV) {
          const scopeId = m.scope === 'TEAM' ? m.teamId : m.userId;
          if (scopeId) {
            content = await encryptionService.decrypt(
              m.contentEncrypted,
              m.encryptionIV,
              scopeId
            );
          }
        }

        return {
          id: m.id,
          scope: m.scope,
          type: m.type,
          content,
          importance: m.importance,
          createdAt: m.createdAt,
        };
      })
    );

    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

    return result;
  }

  /**
   * Search memories by content
   */
  async searchMemories(
    userId: string,
    teamId: string | undefined,
    query: string,
    options: {
      types?: MemoryType[];
      limit?: number;
      minImportance?: number;
    } = {}
  ): Promise<MemoryEntry[]> {
    const { types, limit = 20, minImportance = 0 } = options;

    const queryEmbedding = await embeddingService.createEmbedding(query);

    const typeFilter = types?.length
      ? `AND type IN (${types.map(t => `'${t}'`).join(',')})`
      : '';

    const memories = await prisma.$queryRaw<Array<{
      id: string;
      scope: MemoryScope;
      type: MemoryType;
      content: string;
      content_encrypted: Buffer | null;
      encryption_iv: string | null;
      importance: number;
      created_at: Date;
      user_id: string | null;
      team_id: string | null;
    }>>`
      SELECT 
        id, 
        scope, 
        type, 
        content,
        "contentEncrypted" as content_encrypted,
        "encryptionIV" as encryption_iv,
        importance, 
        "createdAt" as created_at,
        "userId" as user_id,
        "teamId" as team_id
      FROM memories
      WHERE (
        ("userId" = ${userId} AND scope = 'USER')
        OR ("teamId" = ${teamId || ''} AND scope = 'TEAM')
        OR scope = 'GLOBAL'
      )
      AND importance >= ${minImportance}
      ${Prisma.raw(typeFilter)}
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `;

    // Decrypt
    return Promise.all(
      memories.map(async (m) => {
        let content = m.content;

        if (m.content_encrypted && m.encryption_iv) {
          const scopeId = m.scope === 'TEAM' ? m.team_id : m.user_id;
          if (scopeId) {
            content = await encryptionService.decrypt(
              m.content_encrypted,
              m.encryption_iv,
              scopeId
            );
          }
        }

        return {
          id: m.id,
          scope: m.scope,
          type: m.type,
          content,
          importance: m.importance,
          createdAt: m.created_at,
        };
      })
    );
  }

  /**
   * Update memory importance
   */
  async updateImportance(memoryId: string, importance: number): Promise<void> {
    await prisma.memory.update({
      where: { id: memoryId },
      data: { importance: Math.max(0, Math.min(1, importance)) },
    });
  }

  /**
   * Delete a memory
   */
  async deleteMemory(memoryId: string, userId: string): Promise<void> {
    const memory = await prisma.memory.findFirst({
      where: {
        id: memoryId,
        userId,
      },
    });

    if (!memory) {
      throw new Error('Memory not found or unauthorized');
    }

    await prisma.memory.delete({
      where: { id: memoryId },
    });

    await this.invalidateCache(userId, memory.teamId || undefined);
  }

  /**
   * Delete all memories for a user
   */
  async deleteAllUserMemories(userId: string): Promise<number> {
    const result = await prisma.memory.deleteMany({
      where: { userId },
    });

    await this.invalidateCache(userId);

    return result.count;
  }

  /**
   * Get memory statistics
   */
  async getStats(userId: string, teamId?: string): Promise<{
    totalMemories: number;
    byType: Record<MemoryType, number>;
    byScope: Record<MemoryScope, number>;
    avgImportance: number;
    oldestMemory: Date | null;
    newestMemory: Date | null;
  }> {
    const [total, byType, byScope, importance, dates] = await Promise.all([
      // Total count
      prisma.memory.count({
        where: {
          OR: [
            { userId },
            { teamId: teamId || undefined },
          ],
        },
      }),
      
      // By type
      prisma.memory.groupBy({
        by: ['type'],
        where: {
          OR: [
            { userId },
            { teamId: teamId || undefined },
          ],
        },
        _count: true,
      }),
      
      // By scope
      prisma.memory.groupBy({
        by: ['scope'],
        where: {
          OR: [
            { userId },
            { teamId: teamId || undefined },
          ],
        },
        _count: true,
      }),
      
      // Average importance
      prisma.memory.aggregate({
        where: {
          OR: [
            { userId },
            { teamId: teamId || undefined },
          ],
        },
        _avg: { importance: true },
      }),
      
      // Date range
      prisma.memory.aggregate({
        where: {
          OR: [
            { userId },
            { teamId: teamId || undefined },
          ],
        },
        _min: { createdAt: true },
        _max: { createdAt: true },
      }),
    ]);

    const typeMap: Record<MemoryType, number> = {
      CONVERSATION: 0,
      PREFERENCE: 0,
      FACT: 0,
      CONTEXT: 0,
      PROJECT: 0,
    };
    byType.forEach(t => {
      typeMap[t.type] = t._count;
    });

    const scopeMap: Record<MemoryScope, number> = {
      USER: 0,
      TEAM: 0,
      GLOBAL: 0,
    };
    byScope.forEach(s => {
      scopeMap[s.scope] = s._count;
    });

    return {
      totalMemories: total,
      byType: typeMap,
      byScope: scopeMap,
      avgImportance: importance._avg.importance || 0,
      oldestMemory: dates._min.createdAt,
      newestMemory: dates._max.createdAt,
    };
  }

  /**
   * Compress old memories (summarize and consolidate)
   */
  async compressOldMemories(userId: string, olderThanDays = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Get old conversation memories
    const oldMemories = await prisma.memory.findMany({
      where: {
        userId,
        type: 'CONVERSATION',
        createdAt: { lt: cutoffDate },
        importance: { lt: 0.7 }, // Only compress less important ones
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    if (oldMemories.length < 10) {
      return 0; // Not enough to compress
    }

    // TODO: Implement actual compression using an LLM to summarize
    // For now, just mark them as compressed
    logger.info(`Would compress ${oldMemories.length} memories for user ${userId}`);

    return oldMemories.length;
  }

  /**
   * Invalidate cache for a user/team
   */
  private async invalidateCache(userId?: string, teamId?: string): Promise<void> {
    const patterns = [
      `memory:*:${userId}:*`,
      `memory:*:${userId}:${teamId || 'none'}:*`,
    ];

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  }
}

// Need this import for raw SQL
import { Prisma } from '@prisma/client';

export const memoryService = new MemoryService();

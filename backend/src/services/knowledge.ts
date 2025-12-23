// AI Arena - Knowledge Base Service
// Handles the dual KB system (Beta & Verified)

import { prisma } from '../utils/prisma.js';
import { redis } from '../utils/redis.js';
import { embeddingService } from './embeddings.js';
import { openRouterService } from './openrouter.js';
import { logger } from '../utils/logger.js';
import { KBStatus, Prisma } from '@prisma/client';

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string[];
  status: KBStatus;
  reliability: number;
  verificationCount: number;
  createdAt: Date;
}

interface ExtractParams {
  content: string;
  userId?: string;
  teamId?: string;
  sourceConversationId?: string;
  sourceModelId?: string;
}

interface SearchOptions {
  status?: KBStatus[];
  category?: string[];
  minReliability?: number;
  limit?: number;
  userId?: string;
  teamId?: string;
}

// Models used for verification (must be different)
const VERIFICATION_MODELS = [
  'anthropic/claude-3.5-sonnet',
  'openai/gpt-4o',
  'google/gemini-1.5-pro',
  'mistralai/mistral-large',
] as const;

class KnowledgeService {
  private readonly VERIFICATION_THRESHOLD = 3;
  private readonly CACHE_TTL = 3600;

  /**
   * Extract knowledge from content and save to KB Beta
   */
  async extractAndSave(params: ExtractParams): Promise<KnowledgeEntry[]> {
    const { content, userId, teamId, sourceConversationId, sourceModelId } = params;

    // Use LLM to extract knowledge
    const extractionPrompt = `Analysiere den folgenden Text und extrahiere alle wichtigen Fakten, Definitionen und Erkenntnisse.

Text:
${content}

Antworte NUR mit einem JSON-Array:
[
  {
    "title": "Kurzer Titel des Wissens",
    "content": "Detaillierte Beschreibung des Wissens",
    "category": ["kategorie1", "kategorie2"],
    "isFactual": true/false,
    "confidence": 0.0-1.0
  }
]

Extrahiere nur verifizierbare Fakten und wichtige Informationen. Ignoriere Meinungen und Spekulationen.
Wenn keine wichtigen Fakten vorhanden sind, antworte mit einem leeren Array: []`;

    try {
      const response = await openRouterService.createCompletion({
        model: 'anthropic/claude-3.5-haiku',
        messages: [
          { role: 'user', content: extractionPrompt },
        ],
        maxTokens: 2000,
      });

      const extracted = this.parseExtraction(response.content);
      
      if (extracted.length === 0) {
        return [];
      }

      // Save each extracted piece of knowledge
      const saved: KnowledgeEntry[] = [];

      for (const item of extracted) {
        if (!item.isFactual || item.confidence < 0.7) {
          continue; // Skip non-factual or low confidence items
        }

        // Check for duplicates
        const isDuplicate = await this.checkDuplicate(item.content);
        if (isDuplicate) {
          logger.debug(`Skipping duplicate knowledge: ${item.title}`);
          continue;
        }

        // Generate embedding
        const embedding = await embeddingService.createEmbedding(item.content);

        // Save to database
        const entry = await prisma.knowledgeEntry.create({
          data: {
            title: item.title,
            content: item.content,
            category: item.category,
            userId,
            teamId,
            sourceConversationId,
            sourceModelId,
            status: 'BETA',
            reliability: item.confidence * 0.5, // Start at half the extraction confidence
          },
        });

        // Store embedding
        await prisma.$executeRaw`
          UPDATE knowledge_entries 
          SET embedding = ${embedding}::vector 
          WHERE id = ${entry.id}
        `;

        saved.push({
          id: entry.id,
          title: entry.title,
          content: entry.content,
          category: entry.category,
          status: entry.status,
          reliability: entry.reliability,
          verificationCount: 0,
          createdAt: entry.createdAt,
        });

        logger.debug(`Knowledge saved to Beta: ${entry.title}`);
      }

      // Trigger background verification for new entries
      if (saved.length > 0) {
        this.scheduleVerification(saved.map(s => s.id));
      }

      return saved;
    } catch (error) {
      logger.error('Knowledge extraction failed:', error);
      return [];
    }
  }

  /**
   * Search the knowledge base
   */
  async search(query: string, options: SearchOptions = {}): Promise<KnowledgeEntry[]> {
    const {
      status = ['VERIFIED'],
      category,
      minReliability = 0,
      limit = 10,
      userId,
      teamId,
    } = options;

    // Generate query embedding
    const queryEmbedding = await embeddingService.createEmbedding(query);

    // Build where clause
    const statusFilter = status.length > 0
      ? `AND status IN (${status.map(s => `'${s}'`).join(',')})`
      : '';

    const categoryFilter = category?.length
      ? `AND category && ARRAY[${category.map(c => `'${c}'`).join(',')}]`
      : '';

    const scopeFilter = userId || teamId
      ? `AND ("userId" = '${userId}' OR "teamId" = '${teamId}' OR ("userId" IS NULL AND "teamId" IS NULL))`
      : '';

    const entries = await prisma.$queryRaw<Array<{
      id: string;
      title: string;
      content: string;
      category: string[];
      status: KBStatus;
      reliability: number;
      created_at: Date;
      similarity: number;
    }>>`
      SELECT 
        id, 
        title, 
        content, 
        category, 
        status, 
        reliability,
        "createdAt" as created_at,
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM knowledge_entries
      WHERE reliability >= ${minReliability}
      ${Prisma.raw(statusFilter)}
      ${Prisma.raw(categoryFilter)}
      ${Prisma.raw(scopeFilter)}
      ORDER BY similarity DESC, reliability DESC
      LIMIT ${limit}
    `;

    // Update access counts
    if (entries.length > 0) {
      await prisma.knowledgeEntry.updateMany({
        where: { id: { in: entries.map(e => e.id) } },
        data: {
          accessCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      });
    }

    // Get verification counts
    const verificationCounts = await prisma.kBVerification.groupBy({
      by: ['entryId'],
      where: { entryId: { in: entries.map(e => e.id) } },
      _count: true,
    });

    const countMap = new Map(verificationCounts.map(v => [v.entryId, v._count]));

    return entries.map(e => ({
      id: e.id,
      title: e.title,
      content: e.content,
      category: e.category,
      status: e.status,
      reliability: e.reliability,
      verificationCount: countMap.get(e.id) || 0,
      createdAt: e.created_at,
    }));
  }

  /**
   * Search Beta KB (unverified knowledge)
   */
  async searchBeta(query: string, options: Omit<SearchOptions, 'status'> = {}): Promise<KnowledgeEntry[]> {
    return this.search(query, { ...options, status: ['BETA', 'PENDING'] });
  }

  /**
   * Search Verified KB (production knowledge)
   */
  async searchVerified(query: string, options: Omit<SearchOptions, 'status'> = {}): Promise<KnowledgeEntry[]> {
    return this.search(query, { ...options, status: ['VERIFIED'] });
  }

  /**
   * Verify a knowledge entry
   */
  async verify(entryId: string, modelId: string): Promise<{
    verified: boolean;
    confidence: number;
    promoted: boolean;
  }> {
    const entry = await prisma.knowledgeEntry.findUnique({
      where: { id: entryId },
      include: {
        verifications: true,
      },
    });

    if (!entry) {
      throw new Error('Knowledge entry not found');
    }

    // Check if this model already verified
    const alreadyVerified = entry.verifications.some(v => v.modelId === modelId);
    if (alreadyVerified) {
      logger.debug(`Model ${modelId} already verified entry ${entryId}`);
      return { verified: false, confidence: 0, promoted: false };
    }

    // Verify using the model
    const verificationPrompt = `Verifiziere die folgende Aussage auf faktische Korrektheit.

Titel: ${entry.title}
Inhalt: ${entry.content}
Kategorien: ${entry.category.join(', ')}

Bewerte:
1. Ist diese Aussage faktisch korrekt?
2. Wie sicher bist du? (0-100%)
3. Gibt es Einschränkungen oder Korrekturen?

Antworte NUR mit JSON:
{
  "verified": true/false,
  "confidence": 0-100,
  "notes": "Optionale Anmerkungen"
}`;

    const response = await openRouterService.createCompletion({
      model: modelId as any,
      messages: [
        { role: 'user', content: verificationPrompt },
      ],
      maxTokens: 500,
    });

    let result: { verified: boolean; confidence: number; notes?: string };
    try {
      result = JSON.parse(response.content);
    } catch {
      result = { verified: false, confidence: 0, notes: 'Parsing failed' };
    }

    // Save verification
    await prisma.kBVerification.create({
      data: {
        entryId,
        modelId,
        verified: result.verified,
        confidence: result.confidence / 100,
        notes: result.notes,
      },
    });

    // Check if should be promoted to verified
    const allVerifications = await prisma.kBVerification.findMany({
      where: { entryId },
    });

    const positiveVerifications = allVerifications.filter(v => v.verified);
    const uniqueModels = new Set(allVerifications.map(v => v.modelId));

    const shouldPromote = 
      positiveVerifications.length >= this.VERIFICATION_THRESHOLD &&
      uniqueModels.size >= this.VERIFICATION_THRESHOLD;

    if (shouldPromote && entry.status !== 'VERIFIED') {
      // Calculate new reliability
      const avgConfidence = positiveVerifications.reduce((sum, v) => sum + v.confidence, 0) / positiveVerifications.length;
      
      await prisma.knowledgeEntry.update({
        where: { id: entryId },
        data: {
          status: 'VERIFIED',
          reliability: avgConfidence,
        },
      });

      logger.info(`Knowledge entry ${entryId} promoted to VERIFIED`);
    } else if (entry.status === 'BETA') {
      await prisma.knowledgeEntry.update({
        where: { id: entryId },
        data: { status: 'PENDING' },
      });
    }

    return {
      verified: result.verified,
      confidence: result.confidence / 100,
      promoted: shouldPromote,
    };
  }

  /**
   * Manually add knowledge (goes to Beta)
   */
  async addManual(params: {
    title: string;
    content: string;
    category: string[];
    userId: string;
    teamId?: string;
  }): Promise<KnowledgeEntry> {
    const { title, content, category, userId, teamId } = params;

    const embedding = await embeddingService.createEmbedding(content);

    const entry = await prisma.knowledgeEntry.create({
      data: {
        title,
        content,
        category,
        userId,
        teamId,
        status: 'BETA',
        reliability: 0.6, // Manual entries start with moderate reliability
      },
    });

    await prisma.$executeRaw`
      UPDATE knowledge_entries 
      SET embedding = ${embedding}::vector 
      WHERE id = ${entry.id}
    `;

    this.scheduleVerification([entry.id]);

    return {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      category: entry.category,
      status: entry.status,
      reliability: entry.reliability,
      verificationCount: 0,
      createdAt: entry.createdAt,
    };
  }

  /**
   * Get pending verifications
   */
  async getPendingVerifications(limit = 20): Promise<KnowledgeEntry[]> {
    const entries = await prisma.knowledgeEntry.findMany({
      where: {
        status: { in: ['BETA', 'PENDING'] },
      },
      orderBy: [
        { reliability: 'desc' },
        { createdAt: 'asc' },
      ],
      take: limit,
      include: {
        verifications: true,
      },
    });

    return entries.map(e => ({
      id: e.id,
      title: e.title,
      content: e.content,
      category: e.category,
      status: e.status,
      reliability: e.reliability,
      verificationCount: e.verifications.length,
      createdAt: e.createdAt,
    }));
  }

  /**
   * Get KB statistics
   */
  async getStats(userId?: string, teamId?: string): Promise<{
    totalEntries: number;
    betaEntries: number;
    pendingEntries: number;
    verifiedEntries: number;
    avgReliability: number;
    topCategories: Array<{ category: string; count: number }>;
  }> {
    const whereClause = userId || teamId
      ? {
          OR: [
            { userId },
            { teamId },
            { userId: null, teamId: null },
          ],
        }
      : {};

    const [total, byStatus, reliability] = await Promise.all([
      prisma.knowledgeEntry.count({ where: whereClause }),
      prisma.knowledgeEntry.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true,
      }),
      prisma.knowledgeEntry.aggregate({
        where: { ...whereClause, status: 'VERIFIED' },
        _avg: { reliability: true },
      }),
    ]);

    const statusMap = new Map(byStatus.map(s => [s.status, s._count]));

    // Get top categories (simplified - would need raw SQL for proper array aggregation)
    const entries = await prisma.knowledgeEntry.findMany({
      where: whereClause,
      select: { category: true },
    });

    const categoryCounts = new Map<string, number>();
    entries.forEach(e => {
      e.category.forEach(c => {
        categoryCounts.set(c, (categoryCounts.get(c) || 0) + 1);
      });
    });

    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, count]) => ({ category, count }));

    return {
      totalEntries: total,
      betaEntries: statusMap.get('BETA') || 0,
      pendingEntries: statusMap.get('PENDING') || 0,
      verifiedEntries: statusMap.get('VERIFIED') || 0,
      avgReliability: reliability._avg.reliability || 0,
      topCategories,
    };
  }

  /**
   * Delete a knowledge entry
   */
  async delete(entryId: string, userId: string): Promise<void> {
    const entry = await prisma.knowledgeEntry.findFirst({
      where: {
        id: entryId,
        userId,
      },
    });

    if (!entry) {
      throw new Error('Entry not found or unauthorized');
    }

    await prisma.knowledgeEntry.delete({
      where: { id: entryId },
    });
  }

  /**
   * Check for duplicate knowledge
   */
  private async checkDuplicate(content: string): Promise<boolean> {
    const embedding = await embeddingService.createEmbedding(content);

    const similar = await prisma.$queryRaw<Array<{ id: string; similarity: number }>>`
      SELECT id, 1 - (embedding <=> ${embedding}::vector) as similarity
      FROM knowledge_entries
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT 1
    `;

    return similar.length > 0 && similar[0].similarity > 0.95;
  }

  /**
   * Parse extraction response
   */
  private parseExtraction(content: string): Array<{
    title: string;
    content: string;
    category: string[];
    isFactual: boolean;
    confidence: number;
  }> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }
      return JSON.parse(jsonMatch[0]);
    } catch {
      return [];
    }
  }

  /**
   * Schedule background verification
   */
  private async scheduleVerification(entryIds: string[]): Promise<void> {
    // In production, this would use a job queue (Bull/BullMQ)
    // For now, we'll do async verification
    setTimeout(async () => {
      for (const entryId of entryIds) {
        // Use random models for verification diversity
        const shuffledModels = [...VERIFICATION_MODELS].sort(() => Math.random() - 0.5);
        
        for (const modelId of shuffledModels.slice(0, 2)) {
          try {
            await this.verify(entryId, modelId);
          } catch (error) {
            logger.error(`Verification failed for ${entryId} with ${modelId}:`, error);
          }
        }
      }
    }, 5000); // Start after 5 seconds
  }
}

export const knowledgeService = new KnowledgeService();

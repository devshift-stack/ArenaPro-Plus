// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY API ROUTES
// REST Endpoints für das Memory System
// ═══════════════════════════════════════════════════════════════════════════════

import { FastifyInstance, FastifyRequest } from 'fastify';
import { memoryService } from '../services/memory.js';
import { memorySettingsService } from '../services/memorySettings.js';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: string;
    email: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

export async function memoryRoutes(fastify: FastifyInstance) {
  
  // ─────────────────────────────────────────────────────────────────────────────
  // GET /api/memory - Alle Memories abrufen
  // ─────────────────────────────────────────────────────────────────────────────
  
  fastify.get<{
    Querystring: { type?: string; limit?: string; offset?: string }
  }>('/memory', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const req = request as AuthenticatedRequest;
    const { userId } = req.user;
    const { type, limit = '50', offset = '0' } = request.query;
    
    try {
      const whereClause = type 
        ? `WHERE user_id = '${userId}' AND type = '${type}'`
        : `WHERE user_id = '${userId}'`;
      
      const memories = await prisma.$queryRawUnsafe(`
        SELECT id, type, content, importance, access_count, created_at, last_accessed_at
        FROM memories
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${parseInt(limit)}
        OFFSET ${parseInt(offset)}
      `);
      
      return { memories };
    } catch (error) {
      logger.error('Failed to get memories:', error);
      return reply.status(500).send({ error: 'Failed to get memories' });
    }
  });
  
  // ─────────────────────────────────────────────────────────────────────────────
  // POST /api/memory/recall - Semantische Suche
  // ─────────────────────────────────────────────────────────────────────────────
  
  fastify.post<{
    Body: {
      query: string;
      types?: string[];
      limit?: number;
      minSimilarity?: number;
    }
  }>('/memory/recall', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', minLength: 1 },
          types: { type: 'array', items: { type: 'string' } },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 10 },
          minSimilarity: { type: 'number', minimum: 0, maximum: 1, default: 0.7 },
        }
      }
    }
  }, async (request, reply) => {
    const req = request as AuthenticatedRequest;
    const { userId } = req.user;
    const { query, types, limit = 10, minSimilarity = 0.7 } = request.body;
    
    try {
      const memories = await memoryService.recall({
        userId,
        query,
        types,
        limit,
        minSimilarity,
      });
      
      return { memories };
    } catch (error) {
      logger.error('Failed to recall memories:', error);
      return reply.status(500).send({ error: 'Failed to recall memories' });
    }
  });
  
  // ─────────────────────────────────────────────────────────────────────────────
  // GET /api/memory/context/:chatId - Kontext für Chat
  // ─────────────────────────────────────────────────────────────────────────────
  
  fastify.get<{
    Params: { chatId: string }
  }>('/memory/context/:chatId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const req = request as AuthenticatedRequest;
    const { userId } = req.user;
    const { chatId } = request.params;
    
    try {
      // Letzte User-Nachricht holen
      const lastMessage = await prisma.$queryRawUnsafe<any[]>(`
        SELECT content FROM messages
        WHERE chat_id = '${chatId}' AND role = 'USER'
        ORDER BY created_at DESC
        LIMIT 1
      `);
      
      if (!lastMessage || lastMessage.length === 0) {
        return { context: [] };
      }
      
      const context = await memoryService.getContextForChat(
        userId,
        lastMessage[0].content
      );
      
      return { context };
    } catch (error) {
      logger.error('Failed to get context:', error);
      return reply.status(500).send({ error: 'Failed to get context' });
    }
  });
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE /api/memory/:id - Einzelnes Memory löschen
  // ─────────────────────────────────────────────────────────────────────────────
  
  fastify.delete<{
    Params: { id: string }
  }>('/memory/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const req = request as AuthenticatedRequest;
    const { userId } = req.user;
    const { id } = request.params;
    
    try {
      // Prüfen ob Memory dem User gehört
      const memory = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id FROM memories WHERE id = '${id}' AND user_id = '${userId}'
      `);
      
      if (!memory || memory.length === 0) {
        return reply.status(404).send({ error: 'Memory not found' });
      }
      
      await prisma.$executeRawUnsafe(`DELETE FROM memories WHERE id = '${id}'`);
      
      return { deleted: true };
    } catch (error) {
      logger.error('Failed to delete memory:', error);
      return reply.status(500).send({ error: 'Failed to delete memory' });
    }
  });
  
  // ─────────────────────────────────────────────────────────────────────────────
  // GET /api/memory/settings - Einstellungen abrufen
  // ─────────────────────────────────────────────────────────────────────────────
  
  fastify.get('/memory/settings', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const req = request as AuthenticatedRequest;
    const { userId } = req.user;
    
    try {
      const settings = await memorySettingsService.getSettings(userId);
      return { settings };
    } catch (error) {
      logger.error('Failed to get settings:', error);
      return reply.status(500).send({ error: 'Failed to get settings' });
    }
  });
  
  // ─────────────────────────────────────────────────────────────────────────────
  // PUT /api/memory/settings - Einstellungen aktualisieren
  // ─────────────────────────────────────────────────────────────────────────────
  
  fastify.put<{
    Body: {
      enabled?: boolean;
      conversationMemory?: boolean;
      factMemory?: boolean;
      preferenceMemory?: boolean;
      crossChatMemory?: boolean;
      retentionDays?: number;
      maxMemories?: number;
      autoConsolidate?: boolean;
      shareWithTeam?: boolean;
      anonymizeExports?: boolean;
      excludePatterns?: string[];
      autoExtract?: boolean;
      extractionFrequency?: 'per_chat' | 'per_message' | 'manual';
      minConfidence?: number;
    }
  }>('/memory/settings', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          conversationMemory: { type: 'boolean' },
          factMemory: { type: 'boolean' },
          preferenceMemory: { type: 'boolean' },
          crossChatMemory: { type: 'boolean' },
          retentionDays: { type: 'number', minimum: 1, maximum: 9999 },
          maxMemories: { type: 'number', minimum: 100, maximum: 10000 },
          autoConsolidate: { type: 'boolean' },
          shareWithTeam: { type: 'boolean' },
          anonymizeExports: { type: 'boolean' },
          excludePatterns: { type: 'array', items: { type: 'string' } },
          autoExtract: { type: 'boolean' },
          extractionFrequency: { 
            type: 'string', 
            enum: ['per_chat', 'per_message', 'manual'] 
          },
          minConfidence: { type: 'number', minimum: 0, maximum: 1 },
        }
      }
    }
  }, async (request, reply) => {
    const req = request as AuthenticatedRequest;
    const { userId } = req.user;
    const updates = request.body;
    
    try {
      const settings = await memorySettingsService.updateSettings(userId, updates);
      return { settings };
    } catch (error) {
      logger.error('Failed to update settings:', error);
      
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      
      return reply.status(500).send({ error: 'Failed to update settings' });
    }
  });
  
  // ─────────────────────────────────────────────────────────────────────────────
  // POST /api/memory/export - Memories exportieren
  // ─────────────────────────────────────────────────────────────────────────────
  
  fastify.post('/memory/export', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const req = request as AuthenticatedRequest;
    const { userId } = req.user;
    
    try {
      const exportData = await memorySettingsService.exportMemories(userId);
      
      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', 'attachment; filename=memories-export.json');
      
      return exportData;
    } catch (error) {
      logger.error('Failed to export memories:', error);
      return reply.status(500).send({ error: 'Failed to export memories' });
    }
  });
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE /api/memory/all - Alle Memories löschen
  // ─────────────────────────────────────────────────────────────────────────────
  
  fastify.delete('/memory/all', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const req = request as AuthenticatedRequest;
    const { userId } = req.user;
    
    try {
      const result = await memorySettingsService.deleteAllMemories(userId);
      return result;
    } catch (error) {
      logger.error('Failed to delete all memories:', error);
      return reply.status(500).send({ error: 'Failed to delete memories' });
    }
  });
  
  // ─────────────────────────────────────────────────────────────────────────────
  // GET /api/memory/stats - Memory Statistiken
  // ─────────────────────────────────────────────────────────────────────────────
  
  fastify.get('/memory/stats', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const req = request as AuthenticatedRequest;
    const { userId } = req.user;
    
    try {
      const stats = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE type = 'CONVERSATION') as conversations,
          COUNT(*) FILTER (WHERE type = 'FACT') as facts,
          COUNT(*) FILTER (WHERE type = 'PREFERENCE') as preferences,
          AVG(importance) as avg_importance,
          MAX(created_at) as latest_memory
        FROM memories
        WHERE user_id = '${userId}'
      `);
      
      return { stats: stats[0] };
    } catch (error) {
      logger.error('Failed to get stats:', error);
      return reply.status(500).send({ error: 'Failed to get stats' });
    }
  });
}

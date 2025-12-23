import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

// ════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ════════════════════════════════════════════════════════════════════════════

const recallSchema = z.object({
  query: z.string().min(1),
  limit: z.number().optional().default(10),
  types: z.array(z.string()).optional(),
});

const updateSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  retentionDays: z.number().optional(),
  autoExtract: z.boolean().optional(),
  excludePatterns: z.array(z.string()).optional(),
});

// ════════════════════════════════════════════════════════════════════════════
// MEMORY ROUTES
// ════════════════════════════════════════════════════════════════════════════

export async function memoryRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // ══════════════════════════════════════════════════════════════════════════
  // GET ALL MEMORIES
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { type, limit = '50' } = request.query as { type?: string; limit?: string };

      const memories = await prisma.memory.findMany({
        where: {
          userId,
          ...(type ? { type: type as any } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
      });

      return reply.send({ memories });
    } catch (error) {
      logger.error('Get memories error:', error);
      return reply.status(500).send({ error: 'Failed to get memories' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SEMANTIC RECALL
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/recall', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const body = recallSchema.parse(request.body);

      // TODO: Implement vector similarity search with pgvector
      // For now, simple text search
      const memories = await prisma.memory.findMany({
        where: {
          userId,
          content: {
            contains: body.query,
            mode: 'insensitive',
          },
          ...(body.types ? { type: { in: body.types as any[] } } : {}),
        },
        orderBy: { importance: 'desc' },
        take: body.limit,
      });

      // Update access count
      const memoryIds = memories.map(m => m.id);
      await prisma.memory.updateMany({
        where: { id: { in: memoryIds } },
        data: {
          accessCount: { increment: 1 },
          lastAccessed: new Date(),
        },
      });

      return reply.send({ memories });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Recall error:', error);
      return reply.status(500).send({ error: 'Failed to recall memories' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET CONTEXT FOR CHAT
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/context/:chatId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { chatId } = request.params as { chatId: string };

      // Get chat-specific memories
      const chatMemories = await prisma.memory.findMany({
        where: {
          userId,
          chatId,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      // Get user preferences
      const preferences = await prisma.memory.findMany({
        where: {
          userId,
          type: 'SEMANTIC',
        },
        orderBy: { importance: 'desc' },
        take: 10,
      });

      // Get recent memories
      const recent = await prisma.memory.findMany({
        where: {
          userId,
          type: 'SHORT_TERM',
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      return reply.send({
        context: {
          chatMemories,
          preferences,
          recent,
        },
      });
    } catch (error) {
      logger.error('Get context error:', error);
      return reply.status(500).send({ error: 'Failed to get context' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET MEMORY SETTINGS
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/settings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };

      let settings = await prisma.memorySettings.findUnique({
        where: { userId },
      });

      if (!settings) {
        // Create default settings
        settings = await prisma.memorySettings.create({
          data: {
            userId,
            enabled: true,
            retentionDays: 365,
            autoExtract: true,
          },
        });
      }

      return reply.send({ settings });
    } catch (error) {
      logger.error('Get settings error:', error);
      return reply.status(500).send({ error: 'Failed to get settings' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // UPDATE MEMORY SETTINGS
  // ══════════════════════════════════════════════════════════════════════════
  
  app.put('/settings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const body = updateSettingsSchema.parse(request.body);

      const settings = await prisma.memorySettings.upsert({
        where: { userId },
        create: {
          userId,
          ...body,
        },
        update: body,
      });

      return reply.send({ settings });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Update settings error:', error);
      return reply.status(500).send({ error: 'Failed to update settings' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // EXPORT MEMORIES
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/export', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };

      const memories = await prisma.memory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({
        data: {
          exportedAt: new Date().toISOString(),
          totalMemories: memories.length,
          memories,
        },
      });
    } catch (error) {
      logger.error('Export error:', error);
      return reply.status(500).send({ error: 'Failed to export memories' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // DELETE ALL MEMORIES
  // ══════════════════════════════════════════════════════════════════════════
  
  app.delete('/all', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };

      await prisma.memory.deleteMany({
        where: { userId },
      });

      return reply.send({ message: 'All memories deleted' });
    } catch (error) {
      logger.error('Delete all error:', error);
      return reply.status(500).send({ error: 'Failed to delete memories' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET MEMORY STATS
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };

      const [facts, preferences, context] = await Promise.all([
        prisma.memory.count({
          where: { userId, type: 'SEMANTIC' },
        }),
        prisma.memory.count({
          where: { userId, type: 'SHORT_TERM' },
        }),
        prisma.memory.count({
          where: { userId, type: 'LONG_TERM' },
        }),
      ]);

      return reply.send({
        stats: {
          facts,
          preferences,
          context,
        },
      });
    } catch (error) {
      logger.error('Get memory stats error:', error);
      return reply.status(500).send({ error: 'Failed to get memory stats' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // DELETE SINGLE MEMORY
  // ══════════════════════════════════════════════════════════════════════════

  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };

      await prisma.memory.deleteMany({
        where: { id, userId },
      });

      return reply.send({ message: 'Memory deleted' });
    } catch (error) {
      logger.error('Delete memory error:', error);
      return reply.status(500).send({ error: 'Failed to delete memory' });
    }
  });
}

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { embeddingService } from '../services/embeddingService.js';

// ════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ════════════════════════════════════════════════════════════════════════════

const createEntrySchema = z.object({
  content: z.string().min(1),
  source: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.any()).optional(),
});

const searchSchema = z.object({
  query: z.string().min(1),
  status: z.enum(['BETA', 'VERIFIED', 'PENDING']).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().optional().default(20),
});

// ════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE ROUTES
// ════════════════════════════════════════════════════════════════════════════

export async function knowledgeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // ══════════════════════════════════════════════════════════════════════════
  // GET ALL ENTRIES
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { status, tags, limit = '50' } = request.query as {
        status?: string;
        tags?: string;
        limit?: string;
      };

      const tagArray = tags ? tags.split(',') : undefined;

      const entries = await prisma.knowledgeEntry.findMany({
        where: {
          OR: [
            { userId },
            { team: { members: { some: { userId } } } },
          ],
          ...(status ? { status: status as any } : {}),
          ...(tagArray ? { tags: { hasSome: tagArray } } : {}),
        },
        include: {
          verifications: {
            include: {
              verifiedBy: {
                select: { id: true, name: true },
              },
            },
          },
          _count: {
            select: { verifications: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
      });

      return reply.send({ entries });
    } catch (error) {
      logger.error('Get entries error:', error);
      return reply.status(500).send({ error: 'Failed to get entries' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CREATE ENTRY
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const body = createEntrySchema.parse(request.body);

      // Generate embedding for the content
      const embedding = await embeddingService.generateEmbedding(body.content);

      const entry = await prisma.knowledgeEntry.create({
        data: {
          content: body.content,
          source: body.source,
          tags: body.tags,
          metadata: body.metadata || {},
          embedding: embedding,
          userId,
          status: 'BETA', // New entries start in beta
        },
      });

      return reply.status(201).send({ entry });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Create entry error:', error);
      return reply.status(500).send({ error: 'Failed to create entry' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // VERIFY ENTRY
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/:id/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };
      const { modelId, isCorrect = true, notes } = request.body as {
        modelId?: string;
        isCorrect?: boolean;
        notes?: string;
      };

      // Check if already verified by this user/model
      const existingVerification = await prisma.knowledgeVerification.findFirst({
        where: {
          entryId: id,
          OR: [
            { verifiedById: userId },
            ...(modelId ? [{ modelId }] : []),
          ],
        },
      });

      if (existingVerification) {
        return reply.status(400).send({ error: 'Already verified' });
      }

      // Create verification
      const verification = await prisma.knowledgeVerification.create({
        data: {
          entryId: id,
          verifiedById: userId,
          modelId,
          isCorrect,
          notes,
        },
      });

      // Check if entry should be promoted to VERIFIED (3+ verifications)
      const verificationCount = await prisma.knowledgeVerification.count({
        where: {
          entryId: id,
          isCorrect: true,
        },
      });

      if (verificationCount >= 3) {
        await prisma.knowledgeEntry.update({
          where: { id },
          data: { status: 'VERIFIED' },
        });
      }

      return reply.send({ 
        verification,
        newStatus: verificationCount >= 3 ? 'VERIFIED' : 'BETA',
        verificationCount,
      });
    } catch (error) {
      logger.error('Verify entry error:', error);
      return reply.status(500).send({ error: 'Failed to verify entry' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SEARCH ENTRIES
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const body = searchSchema.parse(request.body);

      // Try vector similarity search first
      const vectorResults = await embeddingService.searchKnowledgeBySimilarity(
        body.query,
        {
          userId,
          limit: body.limit,
          minSimilarity: 0.5, // Lower threshold for broader results
        }
      );

      // If vector search returned results, use them
      if (vectorResults.length > 0) {
        // Filter by status and tags if provided
        let filteredResults = vectorResults;
        if (body.status) {
          filteredResults = filteredResults.filter(r => r.status === body.status);
        }
        if (body.tags && body.tags.length > 0) {
          filteredResults = filteredResults.filter(r =>
            body.tags!.some(tag => r.tags.includes(tag))
          );
        }
        return reply.send({ results: filteredResults, searchType: 'vector' });
      }

      // Fallback to text search if vector search failed or returned nothing
      const entries = await prisma.knowledgeEntry.findMany({
        where: {
          OR: [
            { userId },
            { team: { members: { some: { userId } } } },
          ],
          content: {
            contains: body.query,
            mode: 'insensitive',
          },
          ...(body.status ? { status: body.status } : {}),
          ...(body.tags ? { tags: { hasSome: body.tags } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: body.limit,
      });

      return reply.send({ results: entries, searchType: 'text' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Search error:', error);
      return reply.status(500).send({ error: 'Failed to search' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET ENTRY BY ID
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };

      const entry = await prisma.knowledgeEntry.findFirst({
        where: {
          id,
          OR: [
            { userId },
            { team: { members: { some: { userId } } } },
          ],
        },
        include: {
          verifications: {
            include: {
              verifiedBy: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (!entry) {
        return reply.status(404).send({ error: 'Entry not found' });
      }

      return reply.send({ entry });
    } catch (error) {
      logger.error('Get entry error:', error);
      return reply.status(500).send({ error: 'Failed to get entry' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // UPDATE ENTRY
  // ══════════════════════════════════════════════════════════════════════════
  
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };
      const updates = request.body as { content?: string; tags?: string[] };

      const entry = await prisma.knowledgeEntry.findFirst({
        where: { id, userId },
      });

      if (!entry) {
        return reply.status(404).send({ error: 'Entry not found' });
      }

      // Regenerate embedding if content changed
      let newEmbedding: number[] | undefined;
      if (updates.content && updates.content !== entry.content) {
        newEmbedding = await embeddingService.generateEmbedding(updates.content);
      }

      const updatedEntry = await prisma.knowledgeEntry.update({
        where: { id },
        data: {
          content: updates.content,
          tags: updates.tags,
          // Reset to beta and update embedding if content changed
          ...(updates.content ? {
            status: 'BETA',
            embedding: newEmbedding,
          } : {}),
        },
      });

      return reply.send({ entry: updatedEntry });
    } catch (error) {
      logger.error('Update entry error:', error);
      return reply.status(500).send({ error: 'Failed to update entry' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // DELETE ENTRY
  // ══════════════════════════════════════════════════════════════════════════
  
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };

      await prisma.knowledgeEntry.deleteMany({
        where: { id, userId },
      });

      return reply.send({ message: 'Entry deleted' });
    } catch (error) {
      logger.error('Delete entry error:', error);
      return reply.status(500).send({ error: 'Failed to delete entry' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET STATS
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/stats/overview', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };

      const [total, verified, beta, pending] = await Promise.all([
        prisma.knowledgeEntry.count({
          where: { OR: [{ userId }, { team: { members: { some: { userId } } } }] },
        }),
        prisma.knowledgeEntry.count({
          where: { status: 'VERIFIED', OR: [{ userId }, { team: { members: { some: { userId } } } }] },
        }),
        prisma.knowledgeEntry.count({
          where: { status: 'BETA', OR: [{ userId }, { team: { members: { some: { userId } } } }] },
        }),
        prisma.knowledgeEntry.count({
          where: { status: 'PENDING', OR: [{ userId }, { team: { members: { some: { userId } } } }] },
        }),
      ]);

      return reply.send({
        stats: { total, verified, beta, pending },
      });
    } catch (error) {
      logger.error('Get stats error:', error);
      return reply.status(500).send({ error: 'Failed to get stats' });
    }
  });
}

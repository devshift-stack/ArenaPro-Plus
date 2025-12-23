import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

// ════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ════════════════════════════════════════════════════════════════════════════

const recordEventSchema = z.object({
  type: z.enum(['ERROR', 'CORRECTION', 'FEEDBACK', 'IMPROVEMENT']),
  modelId: z.string(),
  chatId: z.string().optional(),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
});

const recordCorrectionSchema = z.object({
  messageId: z.string(),
  originalContent: z.string(),
  correctedContent: z.string(),
});

const recordFeedbackSchema = z.object({
  messageId: z.string(),
  isPositive: z.boolean(),
  reason: z.string().optional(),
});

const rejectRuleSchema = z.object({
  reason: z.string().min(1),
});

// ════════════════════════════════════════════════════════════════════════════
// LEARNING ROUTES
// ════════════════════════════════════════════════════════════════════════════

export async function learningRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // ══════════════════════════════════════════════════════════════════════════
  // RECORD LEARNING EVENT
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/events', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const body = recordEventSchema.parse(request.body);

      const event = await prisma.learningEvent.create({
        data: {
          type: body.type,
          modelId: body.modelId,
          chatId: body.chatId,
          content: body.content,
          metadata: body.metadata || {},
          userId,
        },
      });

      return reply.status(201).send({ event });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Record event error:', error);
      return reply.status(500).send({ error: 'Failed to record event' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // RECORD CORRECTION
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/corrections', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const body = recordCorrectionSchema.parse(request.body);

      // Get the message to find model info
      const message = await prisma.message.findUnique({
        where: { id: body.messageId },
        include: { chat: true },
      });

      if (!message) {
        return reply.status(404).send({ error: 'Message not found' });
      }

      // Create learning event
      const event = await prisma.learningEvent.create({
        data: {
          type: 'CORRECTION',
          modelId: message.modelId || 'unknown',
          chatId: message.chatId,
          content: JSON.stringify({
            original: body.originalContent,
            corrected: body.correctedContent,
          }),
          userId,
        },
      });

      // TODO: Analyze pattern and potentially propose rule

      return reply.status(201).send({ event });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Record correction error:', error);
      return reply.status(500).send({ error: 'Failed to record correction' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // RECORD FEEDBACK
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/feedback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const body = recordFeedbackSchema.parse(request.body);

      const message = await prisma.message.findUnique({
        where: { id: body.messageId },
      });

      if (!message) {
        return reply.status(404).send({ error: 'Message not found' });
      }

      const event = await prisma.learningEvent.create({
        data: {
          type: 'FEEDBACK',
          modelId: message.modelId || 'unknown',
          chatId: message.chatId,
          content: JSON.stringify({
            isPositive: body.isPositive,
            reason: body.reason,
            messageContent: message.content.substring(0, 500),
          }),
          userId,
        },
      });

      return reply.status(201).send({ event });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Record feedback error:', error);
      return reply.status(500).send({ error: 'Failed to record feedback' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET PROPOSED RULES
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/rules/proposed', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rules = await prisma.proposedRule.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ rules });
    } catch (error) {
      logger.error('Get proposed rules error:', error);
      return reply.status(500).send({ error: 'Failed to get proposed rules' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET ACTIVE RULES
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/rules/active', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rules = await prisma.activeRule.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ rules });
    } catch (error) {
      logger.error('Get active rules error:', error);
      return reply.status(500).send({ error: 'Failed to get active rules' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // APPROVE RULE
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/rules/:id/approve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };

      // Get proposed rule
      const proposedRule = await prisma.proposedRule.findUnique({
        where: { id },
      });

      if (!proposedRule) {
        return reply.status(404).send({ error: 'Rule not found' });
      }

      // Create active rule
      const activeRule = await prisma.activeRule.create({
        data: {
          title: proposedRule.title,
          description: proposedRule.description,
          instruction: proposedRule.instruction,
          category: proposedRule.category,
          severity: proposedRule.severity,
          examples: proposedRule.examples as any,
          approvedById: userId,
        },
      });

      // Update proposed rule status
      await prisma.proposedRule.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      return reply.send({ activeRule });
    } catch (error) {
      logger.error('Approve rule error:', error);
      return reply.status(500).send({ error: 'Failed to approve rule' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // REJECT RULE
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/rules/:id/reject', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const body = rejectRuleSchema.parse(request.body);

      await prisma.proposedRule.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: body.reason,
        },
      });

      return reply.send({ message: 'Rule rejected' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Reject rule error:', error);
      return reply.status(500).send({ error: 'Failed to reject rule' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // DELETE ACTIVE RULE
  // ══════════════════════════════════════════════════════════════════════════
  
  app.delete('/rules/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      await prisma.activeRule.update({
        where: { id },
        data: { isActive: false },
      });

      return reply.send({ message: 'Rule deactivated' });
    } catch (error) {
      logger.error('Delete rule error:', error);
      return reply.status(500).send({ error: 'Failed to delete rule' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET STATISTICS
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/statistics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [
        totalEvents,
        proposedRules,
        activeRules,
        rejectedRules,
        eventsByType,
        eventsByModel,
      ] = await Promise.all([
        prisma.learningEvent.count(),
        prisma.proposedRule.count({ where: { status: 'PENDING' } }),
        prisma.activeRule.count({ where: { isActive: true } }),
        prisma.proposedRule.count({ where: { status: 'REJECTED' } }),
        prisma.learningEvent.groupBy({
          by: ['type'],
          _count: true,
        }),
        prisma.learningEvent.groupBy({
          by: ['modelId'],
          _count: true,
          orderBy: { _count: { modelId: 'desc' } },
          take: 5,
        }),
      ]);

      return reply.send({
        statistics: {
          totalEvents,
          proposedRules,
          activeRules,
          rejectedRules,
          eventsByType: eventsByType.map(e => ({
            type: e.type,
            count: e._count,
          })),
          eventsByModel: eventsByModel.map(e => ({
            modelId: e.modelId,
            count: e._count,
          })),
        },
      });
    } catch (error) {
      logger.error('Get statistics error:', error);
      return reply.status(500).send({ error: 'Failed to get statistics' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET GENERATED INSTRUCTIONS
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/instructions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rules = await prisma.activeRule.findMany({
        where: { isActive: true },
        orderBy: { severity: 'desc' },
      });

      // Generate system prompt from rules
      const instructions = rules.map(rule => 
        `- ${rule.instruction}`
      ).join('\n');

      return reply.send({
        instructions: `## Gelernte Regeln\n\n${instructions}`,
        ruleCount: rules.length,
      });
    } catch (error) {
      logger.error('Get instructions error:', error);
      return reply.status(500).send({ error: 'Failed to get instructions' });
    }
  });
}

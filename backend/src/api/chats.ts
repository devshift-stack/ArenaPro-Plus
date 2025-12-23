import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { orchestrator } from '../services/orchestrator.js';

// ════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ════════════════════════════════════════════════════════════════════════════

const createChatSchema = z.object({
  title: z.string().optional(),
  mode: z.enum(['AUTO_SELECT', 'COLLABORATIVE', 'DIVIDE_CONQUER', 'PROJECT', 'TESTER']).optional().default('AUTO_SELECT'),
  modelIds: z.array(z.string()).optional(),
  teamId: z.string().optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  attachments: z.array(z.string()).optional(),
});

// ════════════════════════════════════════════════════════════════════════════
// CHATS ROUTES
// ════════════════════════════════════════════════════════════════════════════

export async function chatsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // ══════════════════════════════════════════════════════════════════════════
  // GET ALL CHATS
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { teamId, limit = '20', offset = '0' } = request.query as { 
        teamId?: string; 
        limit?: string; 
        offset?: string;
      };

      const where = teamId 
        ? { teamId }
        : { userId, teamId: null };

      const chats = await prisma.chat.findMany({
        where,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      });

      return reply.send({ chats });
    } catch (error) {
      logger.error('Get chats error:', error);
      return reply.status(500).send({ error: 'Failed to get chats' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CREATE CHAT
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const body = createChatSchema.parse(request.body);

      const chat = await prisma.chat.create({
        data: {
          title: body.title || 'New Chat',
          mode: body.mode,
          userId,
          teamId: body.teamId,
          selectedModels: body.modelIds || [],
        },
      });

      return reply.status(201).send({ chat });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Create chat error:', error);
      return reply.status(500).send({ error: 'Failed to create chat' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET CHAT BY ID
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };

      const chat = await prisma.chat.findFirst({
        where: {
          id,
          OR: [
            { userId },
            { team: { members: { some: { userId } } } },
          ],
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!chat) {
        return reply.status(404).send({ error: 'Chat not found' });
      }

      return reply.send({ chat });
    } catch (error) {
      logger.error('Get chat error:', error);
      return reply.status(500).send({ error: 'Failed to get chat' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET CHAT MESSAGES
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/:id/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };
      const { limit = '50', before } = request.query as { limit?: string; before?: string };

      // Verify access
      const chat = await prisma.chat.findFirst({
        where: {
          id,
          OR: [
            { userId },
            { team: { members: { some: { userId } } } },
          ],
        },
      });

      if (!chat) {
        return reply.status(404).send({ error: 'Chat not found' });
      }

      const messages = await prisma.message.findMany({
        where: {
          chatId: id,
          ...(before ? { createdAt: { lt: new Date(before) } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
      });

      return reply.send({ messages: messages.reverse() });
    } catch (error) {
      logger.error('Get messages error:', error);
      return reply.status(500).send({ error: 'Failed to get messages' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SEND MESSAGE
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/:id/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };
      const body = sendMessageSchema.parse(request.body);

      // Verify access
      const chat = await prisma.chat.findFirst({
        where: {
          id,
          OR: [
            { userId },
            { team: { members: { some: { userId } } } },
          ],
        },
      });

      if (!chat) {
        return reply.status(404).send({ error: 'Chat not found' });
      }

      // Create user message
      const userMessage = await prisma.message.create({
        data: {
          chatId: id,
          role: 'USER',
          content: body.content,
          userId,
        },
      });

      // Update chat
      await prisma.chat.update({
        where: { id },
        data: { 
          updatedAt: new Date(),
          // Auto-generate title from first message if not set
          ...(chat.title === 'New Chat' ? {
            title: body.content.substring(0, 50) + (body.content.length > 50 ? '...' : ''),
          } : {}),
        },
      });

      // Call Arena Orchestrator for AI response
      const result = await orchestrator.processMessage({
        userId,
        chatId: id,
        content: body.content,
        mode: chat.mode as 'AUTO_SELECT' | 'COLLABORATIVE' | 'DIVIDE_CONQUER' | 'PROJECT' | 'TESTER',
        selectedModels: chat.selectedModels,
      });

      // Save assistant message
      const assistantMessage = await prisma.message.create({
        data: {
          chatId: id,
          role: 'ASSISTANT',
          content: result.response,
          modelId: result.modelId,
          tokens: result.tokens.input + result.tokens.output,
          cost: result.cost,
          metadata: result.metadata || {},
        },
      });

      return reply.send({
        userMessage,
        assistantMessage,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Send message error:', error);
      return reply.status(500).send({ error: 'Failed to send message' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // UPDATE CHAT
  // ══════════════════════════════════════════════════════════════════════════
  
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };
      const updates = request.body as { title?: string; mode?: string; selectedModels?: string[] };

      const chat = await prisma.chat.findFirst({
        where: { id, userId },
      });

      if (!chat) {
        return reply.status(404).send({ error: 'Chat not found' });
      }

      const updatedChat = await prisma.chat.update({
        where: { id },
        data: {
          title: updates.title,
          mode: updates.mode as any,
          selectedModels: updates.selectedModels,
        },
      });

      return reply.send({ chat: updatedChat });
    } catch (error) {
      logger.error('Update chat error:', error);
      return reply.status(500).send({ error: 'Failed to update chat' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // DELETE CHAT
  // ══════════════════════════════════════════════════════════════════════════
  
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };

      const chat = await prisma.chat.findFirst({
        where: { id, userId },
      });

      if (!chat) {
        return reply.status(404).send({ error: 'Chat not found' });
      }

      await prisma.chat.delete({
        where: { id },
      });

      return reply.send({ message: 'Chat deleted' });
    } catch (error) {
      logger.error('Delete chat error:', error);
      return reply.status(500).send({ error: 'Failed to delete chat' });
    }
  });
}

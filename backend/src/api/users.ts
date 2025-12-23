import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

// ════════════════════════════════════════════════════════════════════════════
// USERS ROUTES
// ════════════════════════════════════════════════════════════════════════════

export async function usersRoutes(app: FastifyInstance) {
  // Auth required for all routes
  app.addHook('preHandler', app.authenticate);

  // ══════════════════════════════════════════════════════════════════════════
  // GET ALL USERS (Admin only)
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      
      // Check if admin
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (currentUser?.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ users });
    } catch (error) {
      logger.error('Get users error:', error);
      return reply.status(500).send({ error: 'Failed to get users' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET USER BY ID
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return reply.send({ user });
    } catch (error) {
      logger.error('Get user error:', error);
      return reply.status(500).send({ error: 'Failed to get user' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SEARCH USERS
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { q } = request.query as { q?: string };

      if (!q || q.length < 2) {
        return reply.send({ users: [] });
      }

      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        },
        take: 10,
      });

      return reply.send({ users });
    } catch (error) {
      logger.error('Search users error:', error);
      return reply.status(500).send({ error: 'Failed to search users' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // UPDATE USER SETTINGS
  // ══════════════════════════════════════════════════════════════════════════
  
  app.put('/settings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const settings = request.body as Record<string, any>;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          settings: settings,
        },
        select: {
          id: true,
          settings: true,
        },
      });

      return reply.send({ settings: user.settings });
    } catch (error) {
      logger.error('Update settings error:', error);
      return reply.status(500).send({ error: 'Failed to update settings' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // DELETE USER (Self or Admin)
  // ══════════════════════════════════════════════════════════════════════════
  
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };

      // Check permission
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (userId !== id && currentUser?.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Not authorized' });
      }

      await prisma.user.delete({
        where: { id },
      });

      return reply.send({ message: 'User deleted' });
    } catch (error) {
      logger.error('Delete user error:', error);
      return reply.status(500).send({ error: 'Failed to delete user' });
    }
  });
}

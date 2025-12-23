import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

// ════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ════════════════════════════════════════════════════════════════════════════

const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']).optional().default('MEMBER'),
});

// ════════════════════════════════════════════════════════════════════════════
// TEAMS ROUTES
// ════════════════════════════════════════════════════════════════════════════

export async function teamsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // ══════════════════════════════════════════════════════════════════════════
  // GET ALL TEAMS (for current user)
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };

      const teams = await prisma.team.findMany({
        where: {
          members: {
            some: { userId },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: { chats: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ teams });
    } catch (error) {
      logger.error('Get teams error:', error);
      return reply.status(500).send({ error: 'Failed to get teams' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CREATE TEAM
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const body = createTeamSchema.parse(request.body);

      const team = await prisma.team.create({
        data: {
          name: body.name,
          description: body.description,
          ownerId: userId,
          members: {
            create: {
              userId,
              role: 'OWNER',
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      return reply.status(201).send({ team });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Create team error:', error);
      return reply.status(500).send({ error: 'Failed to create team' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET TEAM BY ID
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };

      const team = await prisma.team.findFirst({
        where: {
          id,
          members: {
            some: { userId },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      if (!team) {
        return reply.status(404).send({ error: 'Team not found' });
      }

      return reply.send({ team });
    } catch (error) {
      logger.error('Get team error:', error);
      return reply.status(500).send({ error: 'Failed to get team' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // INVITE MEMBER
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/:id/invite', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };
      const body = inviteMemberSchema.parse(request.body);

      // Check if user is owner/admin
      const membership = await prisma.teamMember.findFirst({
        where: {
          teamId: id,
          userId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!membership) {
        return reply.status(403).send({ error: 'Not authorized to invite members' });
      }

      // Find user to invite
      const userToInvite = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!userToInvite) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Check if already member
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          teamId: id,
          userId: userToInvite.id,
        },
      });

      if (existingMember) {
        return reply.status(400).send({ error: 'User is already a member' });
      }

      // Add member
      const member = await prisma.teamMember.create({
        data: {
          teamId: id,
          userId: userToInvite.id,
          role: body.role,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      return reply.status(201).send({ member });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Invite member error:', error);
      return reply.status(500).send({ error: 'Failed to invite member' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // REMOVE MEMBER
  // ══════════════════════════════════════════════════════════════════════════
  
  app.delete('/:id/members/:memberId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id, memberId } = request.params as { id: string; memberId: string };

      // Check if user is owner/admin
      const membership = await prisma.teamMember.findFirst({
        where: {
          teamId: id,
          userId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!membership) {
        return reply.status(403).send({ error: 'Not authorized' });
      }

      await prisma.teamMember.delete({
        where: {
          id: memberId,
        },
      });

      return reply.send({ message: 'Member removed' });
    } catch (error) {
      logger.error('Remove member error:', error);
      return reply.status(500).send({ error: 'Failed to remove member' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // UPDATE TEAM SETTINGS
  // ══════════════════════════════════════════════════════════════════════════
  
  app.put('/:id/settings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };
      const settings = request.body as Record<string, any>;

      // Check if user is owner
      const team = await prisma.team.findFirst({
        where: {
          id,
          ownerId: userId,
        },
      });

      if (!team) {
        return reply.status(403).send({ error: 'Not authorized' });
      }

      const updatedTeam = await prisma.team.update({
        where: { id },
        data: {
          name: settings.name,
          description: settings.description,
          settings: settings.settings,
        },
      });

      return reply.send({ team: updatedTeam });
    } catch (error) {
      logger.error('Update team settings error:', error);
      return reply.status(500).send({ error: 'Failed to update settings' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // DELETE TEAM
  // ══════════════════════════════════════════════════════════════════════════
  
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };

      // Check if user is owner
      const team = await prisma.team.findFirst({
        where: {
          id,
          ownerId: userId,
        },
      });

      if (!team) {
        return reply.status(403).send({ error: 'Only owner can delete team' });
      }

      await prisma.team.delete({
        where: { id },
      });

      return reply.send({ message: 'Team deleted' });
    } catch (error) {
      logger.error('Delete team error:', error);
      return reply.status(500).send({ error: 'Failed to delete team' });
    }
  });
}

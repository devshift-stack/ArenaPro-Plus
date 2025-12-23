// ════════════════════════════════════════════════════════════════════════════
// ADMIN API ROUTES
// ════════════════════════════════════════════════════════════════════════════

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { AdminService, ALL_MODELS } from '../services/adminService.js';
import { learningEngine } from '../services/learningEngine.js';

// ════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ════════════════════════════════════════════════════════════════════════════

const grantAccessSchema = z.object({
  userId: z.string(),
  modelIds: z.array(z.string()),
});

const setTierSchema = z.object({
  userId: z.string(),
  tier: z.enum(['FREE', 'STANDARD', 'PREMIUM']),
});

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const rejectRuleSchema = z.object({
  reason: z.string().min(1),
});

// ════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE: Check if Admin
// ════════════════════════════════════════════════════════════════════════════

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const { userId } = request.user as { userId: string };
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user?.role !== 'ADMIN') {
    return reply.status(403).send({ 
      error: 'Zugriff verweigert. Admin-Rechte erforderlich.' 
    });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ════════════════════════════════════════════════════════════════════════════

export async function adminRoutes(app: FastifyInstance) {
  // Alle Routen erfordern Auth
  app.addHook('preHandler', app.authenticate);

  // ══════════════════════════════════════════════════════════════════════════
  // GET ALL MODELS (mit Tier-Info)
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/models', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const availableModels = await AdminService.getAvailableModelsForUser(userId);
      
      return reply.send({ 
        models: availableModels,
        allModels: ALL_MODELS, // Zeigt alle Modelle, aber welche verfügbar sind
      });
    } catch (error) {
      logger.error('Get models error:', error);
      return reply.status(500).send({ error: 'Fehler beim Laden der Modelle' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET SYSTEM DASHBOARD (Admin only)
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/dashboard', {
    preHandler: [requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [systemStats, learningStats] = await Promise.all([
        AdminService.getSystemStats(),
        learningEngine.getStatistics(),
      ]);

      return reply.send({
        system: systemStats,
        learning: learningStats,
      });
    } catch (error) {
      logger.error('Dashboard error:', error);
      return reply.status(500).send({ error: 'Fehler beim Laden des Dashboards' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET ALL USERS WITH ACCESS INFO (Admin only)
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/users', {
    preHandler: [requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await AdminService.getAllUsersWithAccess();
      return reply.send({ users });
    } catch (error) {
      logger.error('Get users error:', error);
      return reply.status(500).send({ error: 'Fehler beim Laden der Benutzer' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GRANT MODEL ACCESS (Admin only)
  // ══════════════════════════════════════════════════════════════════════════

  app.post('/users/grant-access', {
    preHandler: [requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: adminId } = request.user as { userId: string };
      const body = grantAccessSchema.parse(request.body);

      await AdminService.grantModelAccess(adminId, body.userId, body.modelIds);

      return reply.send({ 
        message: 'Modell-Zugriff gewährt',
        grantedModels: body.modelIds,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Grant access error:', error);
      return reply.status(500).send({ error: 'Fehler beim Gewähren des Zugriffs' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SET USER TIER (Admin only)
  // ══════════════════════════════════════════════════════════════════════════

  app.post('/users/set-tier', {
    preHandler: [requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: adminId } = request.user as { userId: string };
      const body = setTierSchema.parse(request.body);

      await AdminService.setUserTier(adminId, body.userId, body.tier);

      return reply.send({ 
        message: `Tier auf ${body.tier} gesetzt`,
        userId: body.userId,
        tier: body.tier,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Set tier error:', error);
      return reply.status(500).send({ error: 'Fehler beim Setzen des Tiers' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // REVOKE MODEL ACCESS (Admin only)
  // ══════════════════════════════════════════════════════════════════════════

  app.post('/users/revoke-access', {
    preHandler: [requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: adminId } = request.user as { userId: string };
      const body = grantAccessSchema.parse(request.body);

      await AdminService.revokeModelAccess(adminId, body.userId, body.modelIds);

      return reply.send({ 
        message: 'Modell-Zugriff entzogen',
        revokedModels: body.modelIds,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Revoke access error:', error);
      return reply.status(500).send({ error: 'Fehler beim Entziehen des Zugriffs' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PROMOTE USER TO ADMIN (Admin only)
  // ══════════════════════════════════════════════════════════════════════════

  app.post('/users/:id/promote', {
    preHandler: [requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: adminId } = request.user as { userId: string };
      const { id } = request.params as { id: string };

      await AdminService.promoteToAdmin(adminId, id);

      return reply.send({ 
        message: 'Benutzer zum Admin befördert',
        userId: id,
      });
    } catch (error) {
      logger.error('Promote error:', error);
      return reply.status(500).send({ error: 'Fehler beim Befördern' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CREATE ADMIN USER (Admin only)
  // ══════════════════════════════════════════════════════════════════════════

  app.post('/users/create-admin', {
    preHandler: [requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: adminId } = request.user as { userId: string };
      const body = createAdminSchema.parse(request.body);

      const newAdmin = await AdminService.createAdminUser(
        body.email,
        body.password,
        body.name,
        adminId
      );

      return reply.status(201).send({ 
        message: 'Admin-Benutzer erstellt',
        admin: newAdmin,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Create admin error:', error);
      return reply.status(500).send({ error: 'Fehler beim Erstellen des Admins' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET PROPOSED RULES (Admin only)
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/rules/proposed', {
    preHandler: [requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rules = await prisma.proposedRule.findMany({
        where: { status: 'PENDING' },
        orderBy: [
          { confidence: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return reply.send({ rules });
    } catch (error) {
      logger.error('Get proposed rules error:', error);
      return reply.status(500).send({ error: 'Fehler beim Laden der Regeln' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET ACTIVE RULES (Admin only)
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/rules/active', {
    preHandler: [requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rules = await prisma.activeRule.findMany({
        where: { isActive: true },
        orderBy: [
          { severity: 'desc' },
          { usageCount: 'desc' },
        ],
        include: {
          approvedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return reply.send({ rules });
    } catch (error) {
      logger.error('Get active rules error:', error);
      return reply.status(500).send({ error: 'Fehler beim Laden der Regeln' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // APPROVE RULE (Admin only)
  // ══════════════════════════════════════════════════════════════════════════

  app.post('/rules/:id/approve', {
    preHandler: [requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: adminId } = request.user as { userId: string };
      const { id } = request.params as { id: string };

      await AdminService.approveRule(adminId, id);

      return reply.send({ 
        message: 'Regel genehmigt und aktiviert',
        ruleId: id,
      });
    } catch (error) {
      logger.error('Approve rule error:', error);
      return reply.status(500).send({ error: 'Fehler beim Genehmigen der Regel' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // REJECT RULE (Admin only)
  // ══════════════════════════════════════════════════════════════════════════

  app.post('/rules/:id/reject', {
    preHandler: [requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: adminId } = request.user as { userId: string };
      const { id } = request.params as { id: string };
      const body = rejectRuleSchema.parse(request.body);

      await AdminService.rejectRule(adminId, id, body.reason);

      return reply.send({ 
        message: 'Regel abgelehnt',
        ruleId: id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Reject rule error:', error);
      return reply.status(500).send({ error: 'Fehler beim Ablehnen der Regel' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // DEACTIVATE RULE (Admin only)
  // ══════════════════════════════════════════════════════════════════════════

  app.delete('/rules/:id', {
    preHandler: [requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      await prisma.activeRule.update({
        where: { id },
        data: { isActive: false },
      });

      return reply.send({ 
        message: 'Regel deaktiviert',
        ruleId: id,
      });
    } catch (error) {
      logger.error('Deactivate rule error:', error);
      return reply.status(500).send({ error: 'Fehler beim Deaktivieren der Regel' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET ERROR PATTERNS (Admin only)
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/patterns', {
    preHandler: [requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const patterns = await prisma.errorPattern.findMany({
        orderBy: { occurrences: 'desc' },
        take: 50,
      });

      return reply.send({ patterns });
    } catch (error) {
      logger.error('Get patterns error:', error);
      return reply.status(500).send({ error: 'Fehler beim Laden der Patterns' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET LEARNING EVENTS (Admin only)
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/events', {
    preHandler: [requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { limit = '50', type, modelId } = request.query as {
        limit?: string;
        type?: string;
        modelId?: string;
      };

      const events = await prisma.learningEvent.findMany({
        where: {
          ...(type ? { type: type as any } : {}),
          ...(modelId ? { modelId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return reply.send({ events });
    } catch (error) {
      logger.error('Get events error:', error);
      return reply.status(500).send({ error: 'Fehler beim Laden der Events' });
    }
  });
}

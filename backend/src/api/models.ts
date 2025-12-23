import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import {
  ALL_MODELS,
  BASIC_MODELS,
  STANDARD_MODELS,
  PREMIUM_MODELS,
  MODELS_BY_TIER,
  getModelById,
  getModelsByTier,
  PREMIUM_ACCESS_DURATIONS,
  ModelConfig,
  ModelTier
} from '../config/models.js';

// ════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

interface ModelWithAccess extends ModelConfig {
  hasAccess: boolean;
  accessExpiresAt?: Date;
  requestStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}

interface AccessRequestBody {
  modelId: string;
  duration: 1 | 3 | 7;
  reason?: string;
}

interface ApproveRejectBody {
  requestId: string;
  rejectionNote?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

async function getUserModelAccess(userId: string, modelId: string) {
  const access = await prisma.modelAccess.findUnique({
    where: {
      userId_modelId: { userId, modelId }
    }
  });

  // Check if access is still valid
  if (access && access.expiresAt > new Date()) {
    return access;
  }

  return null;
}

async function getPendingRequest(userId: string, modelId: string) {
  return prisma.modelAccessRequest.findFirst({
    where: {
      userId,
      modelId,
      status: 'PENDING'
    }
  });
}

async function getModelsWithAccessInfo(userId: string, models: ModelConfig[]): Promise<ModelWithAccess[]> {
  const result: ModelWithAccess[] = [];

  for (const model of models) {
    const access = await getUserModelAccess(userId, model.id);
    const pendingRequest = await getPendingRequest(userId, model.id);

    // Basic models are always accessible
    const hasAccess = model.tier === 'basic' || !!access;

    result.push({
      ...model,
      hasAccess,
      accessExpiresAt: access?.expiresAt,
      requestStatus: pendingRequest?.status || null
    });
  }

  return result;
}

// ════════════════════════════════════════════════════════════════════════════
// MODELS ROUTES
// ════════════════════════════════════════════════════════════════════════════

export async function modelsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // ══════════════════════════════════════════════════════════════════════════
  // GET ALL MODELS (with user access info)
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const models = await getModelsWithAccessInfo(userId, ALL_MODELS);

      return reply.send({
        models,
        tiers: {
          basic: { count: BASIC_MODELS.length, description: 'Kostenlos für alle' },
          standard: { count: STANDARD_MODELS.length, description: 'Anfrage erforderlich' },
          premium: { count: PREMIUM_MODELS.length, description: 'Admin-Freigabe erforderlich' }
        }
      });
    } catch (error) {
      logger.error('Get models error:', error);
      return reply.status(500).send({ error: 'Failed to get models' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET MODELS BY TIER
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/tier/:tier', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { tier } = request.params as { tier: ModelTier };
      const userId = request.user.id;

      if (!['basic', 'standard', 'premium'].includes(tier)) {
        return reply.status(400).send({ error: 'Invalid tier. Use: basic, standard, or premium' });
      }

      const tierModels = getModelsByTier(tier);
      const models = await getModelsWithAccessInfo(userId, tierModels);

      return reply.send({
        tier,
        models,
        accessInfo: {
          basic: 'Immer verfügbar',
          standard: 'Anfrage erforderlich, schnelle Freigabe',
          premium: 'Admin-Freigabe für 1, 3 oder 7 Tage'
        }[tier]
      });
    } catch (error) {
      logger.error('Get models by tier error:', error);
      return reply.status(500).send({ error: 'Failed to get models' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET MODEL BY ID
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = request.user.id;
      const decodedId = decodeURIComponent(id);

      const model = getModelById(decodedId);

      if (!model) {
        return reply.status(404).send({ error: 'Model not found' });
      }

      const access = await getUserModelAccess(userId, model.id);
      const pendingRequest = await getPendingRequest(userId, model.id);
      const hasAccess = model.tier === 'basic' || !!access;

      return reply.send({
        model: {
          ...model,
          hasAccess,
          accessExpiresAt: access?.expiresAt,
          requestStatus: pendingRequest?.status || null
        }
      });
    } catch (error) {
      logger.error('Get model error:', error);
      return reply.status(500).send({ error: 'Failed to get model' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CHECK MODEL ACCESS
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/access/check/:modelId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { modelId } = request.params as { modelId: string };
      const userId = request.user.id;
      const decodedId = decodeURIComponent(modelId);

      const model = getModelById(decodedId);

      if (!model) {
        return reply.status(404).send({ error: 'Model not found' });
      }

      // Basic tier is always accessible
      if (model.tier === 'basic') {
        return reply.send({
          hasAccess: true,
          tier: 'basic',
          message: 'Basic-Modelle sind immer verfügbar'
        });
      }

      const access = await getUserModelAccess(userId, model.id);

      if (access) {
        return reply.send({
          hasAccess: true,
          tier: model.tier,
          expiresAt: access.expiresAt,
          message: `Zugriff bis ${access.expiresAt.toLocaleDateString('de-DE')}`
        });
      }

      const pendingRequest = await getPendingRequest(userId, model.id);

      return reply.send({
        hasAccess: false,
        tier: model.tier,
        pendingRequest: pendingRequest ? {
          id: pendingRequest.id,
          status: pendingRequest.status,
          createdAt: pendingRequest.createdAt
        } : null,
        message: pendingRequest
          ? 'Anfrage wird bearbeitet'
          : 'Zugriff muss angefragt werden'
      });
    } catch (error) {
      logger.error('Check access error:', error);
      return reply.status(500).send({ error: 'Failed to check access' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // REQUEST MODEL ACCESS
  // ══════════════════════════════════════════════════════════════════════════

  app.post('/access/request', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { modelId, duration, reason } = request.body as AccessRequestBody;
      const userId = request.user.id;

      const model = getModelById(modelId);

      if (!model) {
        return reply.status(404).send({ error: 'Model not found' });
      }

      // Basic models don't need access request
      if (model.tier === 'basic') {
        return reply.status(400).send({
          error: 'Basic-Modelle benötigen keine Freigabe'
        });
      }

      // Check if user already has active access
      const existingAccess = await getUserModelAccess(userId, modelId);
      if (existingAccess) {
        return reply.status(400).send({
          error: 'Du hast bereits Zugriff auf dieses Modell',
          expiresAt: existingAccess.expiresAt
        });
      }

      // Check for pending request
      const pendingRequest = await getPendingRequest(userId, modelId);
      if (pendingRequest) {
        return reply.status(400).send({
          error: 'Du hast bereits eine ausstehende Anfrage für dieses Modell',
          requestId: pendingRequest.id
        });
      }

      // Validate duration for premium models
      if (model.tier === 'premium' && !PREMIUM_ACCESS_DURATIONS.includes(duration)) {
        return reply.status(400).send({
          error: 'Ungültige Dauer. Erlaubt: 1, 3 oder 7 Tage'
        });
      }

      // Create access request
      const accessRequest = await prisma.modelAccessRequest.create({
        data: {
          modelId,
          tier: model.tier.toUpperCase() as 'BASIC' | 'STANDARD' | 'PREMIUM',
          duration: duration || 7,
          reason,
          userId,
          status: 'PENDING'
        }
      });

      // For standard tier, auto-approve immediately
      if (model.tier === 'standard') {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (duration || 30)); // 30 days default for standard

        await prisma.modelAccess.create({
          data: {
            modelId,
            tier: 'STANDARD',
            expiresAt,
            userId
          }
        });

        await prisma.modelAccessRequest.update({
          where: { id: accessRequest.id },
          data: { status: 'APPROVED' }
        });

        return reply.send({
          success: true,
          message: 'Standard-Zugriff wurde automatisch gewährt',
          expiresAt,
          autoApproved: true
        });
      }

      // Premium requires admin approval
      logger.info(`Premium access request created: ${accessRequest.id} for model ${modelId} by user ${userId}`);

      return reply.send({
        success: true,
        message: 'Anfrage wurde eingereicht und wartet auf Admin-Freigabe',
        requestId: accessRequest.id,
        autoApproved: false
      });
    } catch (error) {
      logger.error('Request access error:', error);
      return reply.status(500).send({ error: 'Failed to request access' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET USER'S ACCESS REQUESTS
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/access/my-requests', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user.id;

      const requests = await prisma.modelAccessRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      const requestsWithModelInfo = requests.map(req => {
        const model = getModelById(req.modelId);
        return {
          ...req,
          modelName: model?.name || 'Unknown',
          modelProvider: model?.provider || 'Unknown'
        };
      });

      return reply.send({ requests: requestsWithModelInfo });
    } catch (error) {
      logger.error('Get my requests error:', error);
      return reply.status(500).send({ error: 'Failed to get requests' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET USER'S ACTIVE ACCESSES
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/access/my-accesses', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user.id;

      const accesses = await prisma.modelAccess.findMany({
        where: {
          userId,
          expiresAt: { gt: new Date() }
        },
        orderBy: { expiresAt: 'asc' }
      });

      const accessesWithModelInfo = accesses.map(access => {
        const model = getModelById(access.modelId);
        return {
          ...access,
          modelName: model?.name || 'Unknown',
          modelProvider: model?.provider || 'Unknown'
        };
      });

      return reply.send({ accesses: accessesWithModelInfo });
    } catch (error) {
      logger.error('Get my accesses error:', error);
      return reply.status(500).send({ error: 'Failed to get accesses' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN: GET ALL PENDING REQUESTS
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/admin/requests/pending', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id }
      });

      if (user?.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Nur Admins können Anfragen verwalten' });
      }

      const requests = await prisma.modelAccessRequest.findMany({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      const requestsWithModelInfo = requests.map(req => {
        const model = getModelById(req.modelId);
        return {
          ...req,
          modelName: model?.name || 'Unknown',
          modelProvider: model?.provider || 'Unknown',
          modelTier: model?.tier || 'Unknown'
        };
      });

      return reply.send({ requests: requestsWithModelInfo });
    } catch (error) {
      logger.error('Get pending requests error:', error);
      return reply.status(500).send({ error: 'Failed to get requests' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN: APPROVE ACCESS REQUEST
  // ══════════════════════════════════════════════════════════════════════════

  app.post('/admin/requests/approve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { requestId } = request.body as ApproveRejectBody;
      const adminId = request.user.id;

      const admin = await prisma.user.findUnique({
        where: { id: adminId }
      });

      if (admin?.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Nur Admins können Anfragen genehmigen' });
      }

      const accessRequest = await prisma.modelAccessRequest.findUnique({
        where: { id: requestId }
      });

      if (!accessRequest) {
        return reply.status(404).send({ error: 'Anfrage nicht gefunden' });
      }

      if (accessRequest.status !== 'PENDING') {
        return reply.status(400).send({ error: 'Anfrage wurde bereits bearbeitet' });
      }

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + accessRequest.duration);

      // Create access
      await prisma.modelAccess.upsert({
        where: {
          userId_modelId: {
            userId: accessRequest.userId,
            modelId: accessRequest.modelId
          }
        },
        update: {
          expiresAt,
          tier: accessRequest.tier
        },
        create: {
          modelId: accessRequest.modelId,
          tier: accessRequest.tier,
          expiresAt,
          userId: accessRequest.userId
        }
      });

      // Update request status
      await prisma.modelAccessRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          approvedById: adminId
        }
      });

      const model = getModelById(accessRequest.modelId);
      logger.info(`Access approved: ${accessRequest.modelId} for user ${accessRequest.userId} until ${expiresAt}`);

      return reply.send({
        success: true,
        message: `Zugriff auf ${model?.name || accessRequest.modelId} für ${accessRequest.duration} Tage genehmigt`,
        expiresAt
      });
    } catch (error) {
      logger.error('Approve request error:', error);
      return reply.status(500).send({ error: 'Failed to approve request' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN: REJECT ACCESS REQUEST
  // ══════════════════════════════════════════════════════════════════════════

  app.post('/admin/requests/reject', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { requestId, rejectionNote } = request.body as ApproveRejectBody;
      const adminId = request.user.id;

      const admin = await prisma.user.findUnique({
        where: { id: adminId }
      });

      if (admin?.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Nur Admins können Anfragen ablehnen' });
      }

      const accessRequest = await prisma.modelAccessRequest.findUnique({
        where: { id: requestId }
      });

      if (!accessRequest) {
        return reply.status(404).send({ error: 'Anfrage nicht gefunden' });
      }

      if (accessRequest.status !== 'PENDING') {
        return reply.status(400).send({ error: 'Anfrage wurde bereits bearbeitet' });
      }

      // Update request status
      await prisma.modelAccessRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          rejectionNote,
          approvedById: adminId
        }
      });

      const model = getModelById(accessRequest.modelId);
      logger.info(`Access rejected: ${accessRequest.modelId} for user ${accessRequest.userId}`);

      return reply.send({
        success: true,
        message: `Anfrage für ${model?.name || accessRequest.modelId} wurde abgelehnt`
      });
    } catch (error) {
      logger.error('Reject request error:', error);
      return reply.status(500).send({ error: 'Failed to reject request' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN: GET ALL ACCESSES
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/admin/accesses', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id }
      });

      if (user?.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Nur Admins können alle Zugriffe sehen' });
      }

      const accesses = await prisma.modelAccess.findMany({
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        },
        orderBy: { expiresAt: 'asc' }
      });

      const accessesWithModelInfo = accesses.map(access => {
        const model = getModelById(access.modelId);
        return {
          ...access,
          modelName: model?.name || 'Unknown',
          modelProvider: model?.provider || 'Unknown',
          isExpired: access.expiresAt < new Date()
        };
      });

      return reply.send({ accesses: accessesWithModelInfo });
    } catch (error) {
      logger.error('Get all accesses error:', error);
      return reply.status(500).send({ error: 'Failed to get accesses' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN: REVOKE ACCESS
  // ══════════════════════════════════════════════════════════════════════════

  app.delete('/admin/accesses/:accessId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { accessId } = request.params as { accessId: string };
      const adminId = request.user.id;

      const admin = await prisma.user.findUnique({
        where: { id: adminId }
      });

      if (admin?.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Nur Admins können Zugriff entziehen' });
      }

      const access = await prisma.modelAccess.findUnique({
        where: { id: accessId }
      });

      if (!access) {
        return reply.status(404).send({ error: 'Zugriff nicht gefunden' });
      }

      await prisma.modelAccess.delete({
        where: { id: accessId }
      });

      const model = getModelById(access.modelId);
      logger.info(`Access revoked: ${access.modelId} for user ${access.userId} by admin ${adminId}`);

      return reply.send({
        success: true,
        message: `Zugriff auf ${model?.name || access.modelId} wurde entzogen`
      });
    } catch (error) {
      logger.error('Revoke access error:', error);
      return reply.status(500).send({ error: 'Failed to revoke access' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // RECOMMEND MODELS FOR TASK (updated for tier system)
  // ══════════════════════════════════════════════════════════════════════════

  app.post('/recommend', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { task, budget, includeRestricted } = request.body as {
        task: string;
        budget?: 'low' | 'medium' | 'high';
        includeRestricted?: boolean;
      };
      const userId = request.user.id;

      const taskLower = task.toLowerCase();
      let available: ModelConfig[] = [];

      // Start with basic models (always available)
      available = [...BASIC_MODELS];

      if (includeRestricted) {
        // Include all models if requested
        available = ALL_MODELS;
      } else {
        // Add models user has access to
        for (const model of [...STANDARD_MODELS, ...PREMIUM_MODELS]) {
          const access = await getUserModelAccess(userId, model.id);
          if (access) {
            available.push(model);
          }
        }
      }

      // Filter by task requirements
      let recommended: ModelConfig[] = [];

      if (taskLower.includes('code') || taskLower.includes('program')) {
        recommended = available.filter(m => m.strengths.some(s =>
          s.toLowerCase().includes('coding') || s.toLowerCase().includes('code')
        ));
      } else if (taskLower.includes('analyze') || taskLower.includes('research')) {
        recommended = available.filter(m => m.strengths.some(s =>
          s.toLowerCase().includes('analyse') || s.toLowerCase().includes('analysis')
        ));
      } else if (taskLower.includes('kreativ') || taskLower.includes('creative')) {
        recommended = available.filter(m => m.strengths.some(s =>
          s.toLowerCase().includes('kreativ') || s.toLowerCase().includes('creative')
        ));
      } else {
        recommended = available;
      }

      // Sort by budget
      if (budget === 'low') {
        recommended = recommended.sort((a, b) => a.inputCost - b.inputCost);
      } else if (budget === 'high') {
        recommended = recommended.sort((a, b) => {
          const tierOrder = { premium: 0, standard: 1, basic: 2 };
          return tierOrder[a.tier] - tierOrder[b.tier];
        });
      }

      const recommendations = await getModelsWithAccessInfo(userId, recommended.slice(0, 3));

      return reply.send({
        recommendations,
        reasoning: `Basierend auf "${task}" sind diese Modelle am besten geeignet.`,
      });
    } catch (error) {
      logger.error('Recommend models error:', error);
      return reply.status(500).send({ error: 'Failed to recommend models' });
    }
  });
}

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

// ════════════════════════════════════════════════════════════════════════════
// AVAILABLE INTEGRATIONS
// ════════════════════════════════════════════════════════════════════════════

const AVAILABLE_INTEGRATIONS = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Access and manage files from Google Drive',
    icon: 'drive',
    status: 'available',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Access repositories and code from GitHub',
    icon: 'github',
    status: 'available',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Import and sync with Notion pages',
    icon: 'notion',
    status: 'coming_soon',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send and receive messages in Slack',
    icon: 'slack',
    status: 'coming_soon',
  },
];

// ════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ════════════════════════════════════════════════════════════════════════════

const connectSchema = z.object({
  integrationId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// ════════════════════════════════════════════════════════════════════════════
// INTEGRATIONS ROUTES
// ════════════════════════════════════════════════════════════════════════════

export async function integrationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // ══════════════════════════════════════════════════════════════════════════
  // GET AVAILABLE INTEGRATIONS
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };

      // Get user's connected integrations
      const connected = await prisma.integration.findMany({
        where: { userId },
      });

      const connectedIds = connected.map(c => c.type);

      // Merge with available integrations
      const integrations = AVAILABLE_INTEGRATIONS.map(integration => ({
        ...integration,
        isConnected: connectedIds.includes(integration.id),
        connection: connected.find(c => c.type === integration.id),
      }));

      return reply.send({ integrations });
    } catch (error) {
      logger.error('Get integrations error:', error);
      return reply.status(500).send({ error: 'Failed to get integrations' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CONNECT INTEGRATION
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/connect', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const body = connectSchema.parse(request.body);

      // Check if already connected
      const existing = await prisma.integration.findFirst({
        where: {
          userId,
          type: body.integrationId,
        },
      });

      if (existing) {
        // Update existing
        const integration = await prisma.integration.update({
          where: { id: existing.id },
          data: {
            accessToken: body.accessToken,
            refreshToken: body.refreshToken,
            metadata: body.metadata,
          },
        });
        return reply.send({ integration });
      }

      // Create new
      const integration = await prisma.integration.create({
        data: {
          type: body.integrationId,
          userId,
          accessToken: body.accessToken,
          refreshToken: body.refreshToken,
          metadata: body.metadata || {},
        },
      });

      return reply.status(201).send({ integration });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Connect integration error:', error);
      return reply.status(500).send({ error: 'Failed to connect integration' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // DISCONNECT INTEGRATION
  // ══════════════════════════════════════════════════════════════════════════
  
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };

      await prisma.integration.deleteMany({
        where: {
          userId,
          type: id,
        },
      });

      return reply.send({ message: 'Integration disconnected' });
    } catch (error) {
      logger.error('Disconnect integration error:', error);
      return reply.status(500).send({ error: 'Failed to disconnect integration' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET OAUTH URL
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/:id/oauth-url', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      // TODO: Generate actual OAuth URLs
      const oauthUrls: Record<string, string> = {
        'google-drive': 'https://accounts.google.com/o/oauth2/v2/auth?...',
        'github': 'https://github.com/login/oauth/authorize?...',
      };

      const url = oauthUrls[id];
      if (!url) {
        return reply.status(404).send({ error: 'Integration not found' });
      }

      return reply.send({ url });
    } catch (error) {
      logger.error('Get OAuth URL error:', error);
      return reply.status(500).send({ error: 'Failed to get OAuth URL' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLE OAUTH CALLBACK
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/:id/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { code } = request.query as { code?: string };

      if (!code) {
        return reply.status(400).send({ error: 'Authorization code required' });
      }

      // TODO: Exchange code for tokens
      return reply.send({ message: 'OAuth callback handled' });
    } catch (error) {
      logger.error('OAuth callback error:', error);
      return reply.status(500).send({ error: 'OAuth callback failed' });
    }
  });
}

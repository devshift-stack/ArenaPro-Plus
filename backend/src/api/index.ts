import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.js';
import { usersRoutes } from './users.js';
import { teamsRoutes } from './teams.js';
import { chatsRoutes } from './chats.js';
import { arenaRoutes } from './arena.js';
import { memoryRoutes } from './memory.js';
import { knowledgeRoutes } from './knowledge.js';
import { promptsRoutes } from './prompts.js';
import { filesRoutes } from './files.js';
import { integrationsRoutes } from './integrations.js';
import { modelsRoutes } from './models.js';
import { learningRoutes } from './learning.js';

// ════════════════════════════════════════════════════════════════════════════
// REGISTER ALL ROUTES
// ════════════════════════════════════════════════════════════════════════════

export async function registerRoutes(app: FastifyInstance) {
  // Public Routes
  app.register(authRoutes, { prefix: '/api/auth' });

  // Protected Routes
  app.register(usersRoutes, { prefix: '/api/users' });
  app.register(teamsRoutes, { prefix: '/api/teams' });
  app.register(chatsRoutes, { prefix: '/api/chats' });
  app.register(arenaRoutes, { prefix: '/api/arena' });
  app.register(memoryRoutes, { prefix: '/api/memory' });
  app.register(knowledgeRoutes, { prefix: '/api/knowledge' });
  app.register(promptsRoutes, { prefix: '/api/prompts' });
  app.register(filesRoutes, { prefix: '/api/files' });
  app.register(integrationsRoutes, { prefix: '/api/integrations' });
  app.register(modelsRoutes, { prefix: '/api/models' });
  app.register(learningRoutes, { prefix: '/api/learning' });
}

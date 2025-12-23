// AI Arena Backend - Main Entry Point
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import { config } from './config/index.js';
import { prisma } from './utils/prisma.js';
import { redis } from './utils/redis.js';
import { logger } from './utils/logger.js';

// Routes
import { authRoutes } from './api/auth.js';
import { userRoutes } from './api/users.js';
import { teamRoutes } from './api/teams.js';
import { chatRoutes } from './api/chats.js';
import { arenaRoutes } from './api/arena.js';
import { memoryRoutes } from './api/memory.js';
import { knowledgeRoutes } from './api/knowledge.js';
import { promptRoutes } from './api/prompts.js';
import { fileRoutes } from './api/files.js';
import { integrationRoutes } from './api/integrations.js';
import { modelRoutes } from './api/models.js';

// WebSocket handlers
import { setupWebSocket } from './websocket/index.js';

const app = Fastify({
  logger: {
    level: config.LOG_LEVEL,
    transport: config.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    } : undefined,
  },
});

// Register plugins
async function registerPlugins() {
  // Security
  await app.register(helmet, {
    contentSecurityPolicy: config.NODE_ENV === 'production',
  });

  // CORS
  await app.register(cors, {
    origin: [config.FRONTEND_URL],
    credentials: true,
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: parseInt(config.RATE_LIMIT_MAX),
    timeWindow: parseInt(config.RATE_LIMIT_WINDOW),
  });

  // JWT
  await app.register(jwt, {
    secret: config.JWT_SECRET,
  });

  // WebSocket
  await app.register(websocket);

  // File uploads
  await app.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
    },
  });
}

// Register routes
async function registerRoutes() {
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(userRoutes, { prefix: '/api/users' });
  app.register(teamRoutes, { prefix: '/api/teams' });
  app.register(chatRoutes, { prefix: '/api/chats' });
  app.register(arenaRoutes, { prefix: '/api/arena' });
  app.register(memoryRoutes, { prefix: '/api/memory' });
  app.register(knowledgeRoutes, { prefix: '/api/knowledge' });
  app.register(promptRoutes, { prefix: '/api/prompts' });
  app.register(fileRoutes, { prefix: '/api/files' });
  app.register(integrationRoutes, { prefix: '/api/integrations' });
  app.register(modelRoutes, { prefix: '/api/models' });
}

// Health check
app.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  await app.close();
  await prisma.$disconnect();
  await redis.quit();
  
  logger.info('Server shut down successfully');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();
    
    // Setup WebSocket
    setupWebSocket(app);
    
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');
    
    // Test Redis connection
    await redis.ping();
    logger.info('✅ Redis connected');
    
    // Start listening
    await app.listen({
      port: parseInt(config.PORT),
      host: config.HOST,
    });
    
    logger.info(`🚀 AI Arena Backend running on ${config.HOST}:${config.PORT}`);
    logger.info(`📡 WebSocket available at ws://${config.HOST}:${config.PORT}/ws`);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export { app };

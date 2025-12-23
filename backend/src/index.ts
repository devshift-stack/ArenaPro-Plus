import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { registerRoutes } from './api/index.js';
import { setupWebSocket } from './websocket/index.js';

// ════════════════════════════════════════════════════════════════════════════
// FASTIFY SERVER
// ════════════════════════════════════════════════════════════════════════════

const app = Fastify({
  logger: true,
});

// ════════════════════════════════════════════════════════════════════════════
// PLUGINS
// ════════════════════════════════════════════════════════════════════════════

async function registerPlugins() {
  // CORS
  await app.register(cors, {
    origin: config.cors.origins,
    credentials: true,
  });

  // JWT
  await app.register(jwt, {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.expiresIn,
    },
  });

  // Rate Limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Multipart (File Uploads)
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  });

  // WebSocket
  await app.register(websocket);
}

// ════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION DECORATOR
// ════════════════════════════════════════════════════════════════════════════

app.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════════════════════════════════════════

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// ════════════════════════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════════════════════════

async function start() {
  try {
    await registerPlugins();
    await registerRoutes(app);
    await setupWebSocket(app);

    await app.listen({ 
      port: config.port, 
      host: '0.0.0.0' 
    });

    logger.info(`🚀 Server running on http://localhost:${config.port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

start();

export { app };

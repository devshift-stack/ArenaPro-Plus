import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

// ════════════════════════════════════════════════════════════════════════════
// PRISMA CLIENT SINGLETON
// ════════════════════════════════════════════════════════════════════════════

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient({
  log: ['error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// ════════════════════════════════════════════════════════════════════════════
// CONNECTION
// ════════════════════════════════════════════════════════════════════════════

prisma.$connect()
  .then(() => {
    logger.info('✅ Database connected');
  })
  .catch((err) => {
    logger.error('Database connection error:', err);
  });

export default prisma;

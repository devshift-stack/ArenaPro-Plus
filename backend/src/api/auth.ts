// AI Arena - Authentication API
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { prisma } from '../utils/prisma.js';
import { redis } from '../utils/redis.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

// Schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = registerSchema.parse(request.body);
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existingUser) {
        return reply.status(400).send({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(body.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          name: body.name,
        },
      });

      // Generate tokens
      const tokens = await generateTokens(app, user.id);

      // Create session
      await createSession(user.id, tokens, request);

      logger.info(`User registered: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        ...tokens,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      logger.error('Registration failed:', error);
      return reply.status(500).send({ error: 'Registration failed' });
    }
  });

  // Login
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = loginSchema.parse(request.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user || !user.isActive) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(body.password, user.passwordHash);
      if (!validPassword) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Generate tokens
      const tokens = await generateTokens(app, user.id);

      // Create session
      await createSession(user.id, tokens, request);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      logger.info(`User logged in: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        },
        ...tokens,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input' });
      }
      logger.error('Login failed:', error);
      return reply.status(500).send({ error: 'Login failed' });
    }
  });

  // Refresh token
  app.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = refreshSchema.parse(request.body);

      // Find session
      const session = await prisma.session.findUnique({
        where: { refreshToken: body.refreshToken },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        return reply.status(401).send({ error: 'Invalid or expired refresh token' });
      }

      // Generate new tokens
      const tokens = await generateTokens(app, session.userId);

      // Update session
      await prisma.session.update({
        where: { id: session.id },
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return tokens;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      return reply.status(500).send({ error: 'Token refresh failed' });
    }
  });

  // Logout
  app.post('/logout', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      const token = request.headers.authorization?.replace('Bearer ', '');

      if (token) {
        // Delete session
        await prisma.session.deleteMany({
          where: { userId, token },
        });

        // Blacklist token in Redis
        await redis.setex(`blacklist:${token}`, 900, '1'); // 15 min
      }

      return { success: true };
    } catch (error) {
      logger.error('Logout failed:', error);
      return reply.status(500).send({ error: 'Logout failed' });
    }
  });

  // Get current user
  app.get('/me', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return { user };
  });

  // Update profile
  app.patch('/me', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;
    const updates = request.body as any;

    const allowedUpdates = ['name', 'avatar'];
    const filteredUpdates: any = {};
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: filteredUpdates,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
      },
    });

    return { user };
  });

  // Change password
  app.post('/change-password', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;
    const { currentPassword, newPassword } = request.body as any;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      return reply.status(400).send({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({
      where: { userId },
    });

    return { success: true, message: 'Password changed. Please log in again.' };
  });
}

// Helper: Generate JWT tokens
async function generateTokens(app: FastifyInstance, userId: string) {
  const accessToken = app.jwt.sign(
    { userId },
    { expiresIn: config.JWT_ACCESS_EXPIRY }
  );

  const refreshToken = uuid();

  return { accessToken, refreshToken };
}

// Helper: Create session
async function createSession(
  userId: string,
  tokens: { accessToken: string; refreshToken: string },
  request: FastifyRequest
) {
  await prisma.session.create({
    data: {
      userId,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      userAgent: request.headers['user-agent'] || null,
      ipAddress: request.ip,
    },
  });
}

// Middleware: Authenticate
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return reply.status(401).send({ error: 'No token provided' });
    }

    // Check blacklist
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return reply.status(401).send({ error: 'Token has been revoked' });
    }

    // Verify token
    const decoded = await request.jwtVerify() as { userId: string };
    (request as any).userId = decoded.userId;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

// ════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ════════════════════════════════════════════════════════════════════════════

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// ════════════════════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════════════════════

export async function authRoutes(app: FastifyInstance) {
  // ══════════════════════════════════════════════════════════════════════════
  // REGISTER
  // ══════════════════════════════════════════════════════════════════════════
  
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
      const hashedPassword = await bcrypt.hash(body.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          name: body.name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const token = app.jwt.sign({ userId: user.id, email: user.email });
      const refreshToken = app.jwt.sign(
        { userId: user.id, type: 'refresh' },
        { expiresIn: '30d' }
      );

      logger.info(`User registered: ${user.email}`);

      return reply.send({
        token,
        refreshToken,
        user,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Register error:', error);
      return reply.status(500).send({ error: 'Registration failed' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // LOGIN
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = loginSchema.parse(request.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(body.password, user.password);
      if (!validPassword) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Generate tokens
      const token = app.jwt.sign({ userId: user.id, email: user.email });
      const refreshToken = app.jwt.sign(
        { userId: user.id, type: 'refresh' },
        { expiresIn: '30d' }
      );

      logger.info(`User logged in: ${user.email}`);

      return reply.send({
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Login error:', error);
      return reply.status(500).send({ error: 'Login failed' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ME (Current User)
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/me', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };

      const user = await prisma.user.findUnique({
        where: { id: userId },
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
      logger.error('Me error:', error);
      return reply.status(500).send({ error: 'Failed to get user' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // REFRESH TOKEN
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string };

      if (!refreshToken) {
        return reply.status(400).send({ error: 'Refresh token required' });
      }

      const decoded = app.jwt.verify(refreshToken) as { userId: string; type: string };

      if (decoded.type !== 'refresh') {
        return reply.status(401).send({ error: 'Invalid token type' });
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return reply.status(401).send({ error: 'User not found' });
      }

      const newToken = app.jwt.sign({ userId: user.id, email: user.email });

      return reply.send({ token: newToken });
    } catch (error) {
      logger.error('Refresh token error:', error);
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // LOGOUT
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    // In a real app, you might want to invalidate the token in Redis
    return reply.send({ message: 'Logged out successfully' });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // UPDATE PROFILE
  // ══════════════════════════════════════════════════════════════════════════
  
  app.put('/profile', {
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const updates = request.body as { name?: string; avatar?: string };

      const user = await prisma.user.update({
        where: { id: userId },
        data: updates,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
        },
      });

      return reply.send({ user });
    } catch (error) {
      logger.error('Update profile error:', error);
      return reply.status(500).send({ error: 'Failed to update profile' });
    }
  });
}

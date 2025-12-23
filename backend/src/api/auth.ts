import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

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

  // ══════════════════════════════════════════════════════════════════════════
  // GOOGLE OAUTH - INITIATE
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/google', async (request: FastifyRequest, reply: FastifyReply) => {
    const clientId = config.oauth.google.clientId;
    const redirectUri = `${config.apiUrl}/auth/google/callback`;

    if (!clientId) {
      logger.error('Google OAuth not configured: missing client ID');
      return reply.status(500).send({ error: 'Google OAuth not configured' });
    }

    const scope = encodeURIComponent('email profile');
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

    logger.info(`Redirecting to Google OAuth: ${googleAuthUrl}`);
    return reply.redirect(googleAuthUrl);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GOOGLE OAUTH - CALLBACK
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/google/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { code, error: oauthError } = request.query as { code?: string; error?: string };

      if (oauthError) {
        logger.error('Google OAuth error:', oauthError);
        return reply.redirect(`${config.frontendUrl}/login?error=oauth_denied`);
      }

      if (!code) {
        logger.error('Google OAuth: No code received');
        return reply.redirect(`${config.frontendUrl}/login?error=no_code`);
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: config.oauth.google.clientId,
          client_secret: config.oauth.google.clientSecret,
          redirect_uri: `${config.apiUrl}/auth/google/callback`,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        logger.error('Google token exchange failed:', errorData);
        return reply.redirect(`${config.frontendUrl}/login?error=token_exchange_failed`);
      }

      const tokens = await tokenResponse.json() as { access_token: string; id_token: string };

      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userInfoResponse.ok) {
        logger.error('Failed to fetch Google user info');
        return reply.redirect(`${config.frontendUrl}/login?error=user_info_failed`);
      }

      const googleUser = await userInfoResponse.json() as {
        id: string;
        email: string;
        name: string;
        picture?: string;
      };

      logger.info(`Google OAuth user: ${googleUser.email}`);

      // Find or create user
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: googleUser.email },
            { provider: 'google', providerAccountId: googleUser.id },
          ],
        },
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            avatar: googleUser.picture,
            provider: 'google',
            providerAccountId: googleUser.id,
          },
        });
        logger.info(`Created new user via Google OAuth: ${user.email}`);
      } else if (!user.provider) {
        // Link existing email account to Google
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: 'google',
            providerAccountId: googleUser.id,
            avatar: user.avatar || googleUser.picture,
          },
        });
        logger.info(`Linked existing user to Google OAuth: ${user.email}`);
      }

      // Generate JWT tokens
      const token = app.jwt.sign({ userId: user.id, email: user.email });
      const refreshToken = app.jwt.sign(
        { userId: user.id, type: 'refresh' },
        { expiresIn: '30d' }
      );

      // Redirect to frontend with tokens
      const redirectUrl = new URL(`${config.frontendUrl}/auth/callback`);
      redirectUrl.searchParams.set('token', token);
      redirectUrl.searchParams.set('refreshToken', refreshToken);

      logger.info(`Google OAuth successful, redirecting to: ${redirectUrl.toString()}`);
      return reply.redirect(redirectUrl.toString());

    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      return reply.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
    }
  });
}

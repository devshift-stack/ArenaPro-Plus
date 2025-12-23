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
  // GOOGLE OAUTH - Redirect to Google
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/google', async (request: FastifyRequest, reply: FastifyReply) => {
    const clientId = config.GOOGLE_CLIENT_ID;

    if (!clientId) {
      logger.warn('Google OAuth not configured');
      return reply.redirect(`${config.FRONTEND_URL}/login?error=google_not_configured`);
    }

    const redirectUri = `${config.API_URL || 'http://localhost:3001/api'}/auth/google/callback`;
    const scope = encodeURIComponent('email profile');
    const state = Buffer.from(JSON.stringify({ timestamp: Date.now() })).toString('base64');

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `state=${state}&` +
      `access_type=offline&` +
      `prompt=consent`;

    return reply.redirect(googleAuthUrl);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GOOGLE OAUTH - Callback
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/google/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { code, error } = request.query as { code?: string; error?: string };

      if (error || !code) {
        logger.error('Google OAuth error:', error);
        return reply.redirect(`${config.FRONTEND_URL}/login?error=google_auth_failed`);
      }

      const clientId = config.GOOGLE_CLIENT_ID;
      const clientSecret = config.GOOGLE_CLIENT_SECRET;
      const redirectUri = `${config.API_URL || 'http://localhost:3001/api'}/auth/google/callback`;

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokens.access_token) {
        logger.error('Failed to get Google access token');
        return reply.redirect(`${config.FRONTEND_URL}/login?error=google_token_failed`);
      }

      // Get user info
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      const googleUser = await userInfoResponse.json();

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name || googleUser.email.split('@')[0],
            avatar: googleUser.picture,
            password: '', // OAuth users don't have passwords
            provider: 'google',
            providerId: googleUser.id,
          },
        });
        logger.info(`New user created via Google: ${user.email}`);
      }

      // Generate tokens
      const token = app.jwt.sign({ userId: user.id, email: user.email });
      const refreshToken = app.jwt.sign(
        { userId: user.id, type: 'refresh' },
        { expiresIn: '30d' }
      );

      logger.info(`User logged in via Google: ${user.email}`);

      // Redirect to frontend with tokens
      return reply.redirect(
        `${config.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`
      );
    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      return reply.redirect(`${config.FRONTEND_URL}/login?error=google_callback_failed`);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GITHUB OAUTH - Redirect to GitHub
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/github', async (request: FastifyRequest, reply: FastifyReply) => {
    const clientId = config.GITHUB_CLIENT_ID;

    if (!clientId) {
      logger.warn('GitHub OAuth not configured');
      return reply.redirect(`${config.FRONTEND_URL}/login?error=github_not_configured`);
    }

    const redirectUri = `${config.API_URL || 'http://localhost:3001/api'}/auth/github/callback`;
    const scope = encodeURIComponent('user:email');
    const state = Buffer.from(JSON.stringify({ timestamp: Date.now() })).toString('base64');

    const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${scope}&` +
      `state=${state}`;

    return reply.redirect(githubAuthUrl);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GITHUB OAUTH - Callback
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/github/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { code, error } = request.query as { code?: string; error?: string };

      if (error || !code) {
        logger.error('GitHub OAuth error:', error);
        return reply.redirect(`${config.FRONTEND_URL}/login?error=github_auth_failed`);
      }

      const clientId = config.GITHUB_CLIENT_ID;
      const clientSecret = config.GITHUB_CLIENT_SECRET;

      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokens.access_token) {
        logger.error('Failed to get GitHub access token');
        return reply.redirect(`${config.FRONTEND_URL}/login?error=github_token_failed`);
      }

      // Get user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      const githubUser = await userResponse.json();

      // Get user email (might be private)
      let email = githubUser.email;
      if (!email) {
        const emailsResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        const emails = await emailsResponse.json();
        const primaryEmail = emails.find((e: any) => e.primary);
        email = primaryEmail?.email || emails[0]?.email;
      }

      if (!email) {
        logger.error('Could not get email from GitHub');
        return reply.redirect(`${config.FRONTEND_URL}/login?error=github_no_email`);
      }

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: githubUser.name || githubUser.login,
            avatar: githubUser.avatar_url,
            password: '', // OAuth users don't have passwords
            provider: 'github',
            providerId: String(githubUser.id),
          },
        });
        logger.info(`New user created via GitHub: ${user.email}`);
      }

      // Generate tokens
      const token = app.jwt.sign({ userId: user.id, email: user.email });
      const refreshToken = app.jwt.sign(
        { userId: user.id, type: 'refresh' },
        { expiresIn: '30d' }
      );

      logger.info(`User logged in via GitHub: ${user.email}`);

      // Redirect to frontend with tokens
      return reply.redirect(
        `${config.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`
      );
    } catch (error) {
      logger.error('GitHub OAuth callback error:', error);
      return reply.redirect(`${config.FRONTEND_URL}/login?error=github_callback_failed`);
    }
  });
}

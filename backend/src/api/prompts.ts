import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

// ════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ════════════════════════════════════════════════════════════════════════════

const createPromptSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  category: z.string().optional().default('general'),
  tags: z.array(z.string()).optional().default([]),
  isPublic: z.boolean().optional().default(false),
});

const suggestSchema = z.object({
  description: z.string().min(1),
});

// ════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

function generatePromptSuggestion(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes('code') || desc.includes('programming')) {
    return `You are an expert programmer. Please help me with the following task:

[Describe your coding task here]

Requirements:
- Use best practices
- Include comments explaining the code
- Handle edge cases

Please provide clean, well-structured code.`;
  }
  
  if (desc.includes('write') || desc.includes('article') || desc.includes('blog')) {
    return `Please write a [type of content] about [topic].

Target audience: [describe your audience]
Tone: [professional/casual/friendly]
Length: [approximate word count]

Key points to cover:
1. [Point 1]
2. [Point 2]
3. [Point 3]

Please make it engaging and informative.`;
  }
  
  if (desc.includes('analyze') || desc.includes('research')) {
    return `Please analyze the following [topic/data]:

[Insert content to analyze]

I'm looking for:
1. Key insights and patterns
2. Potential implications
3. Recommendations based on the analysis

Please be thorough and cite specific examples.`;
  }

  return `Please help me with the following task:

${description}

Context:
[Add any relevant context here]

Expected output:
[Describe what you want to receive]

Please be thorough and clear in your response.`;
}

// ════════════════════════════════════════════════════════════════════════════
// PROMPTS ROUTES
// ════════════════════════════════════════════════════════════════════════════

export async function promptsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // GET ALL PROMPTS
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { category, favorites } = request.query as { category?: string; favorites?: string };

      const prompts = await prisma.prompt.findMany({
        where: {
          OR: [
            { userId },
            { isPublic: true },
          ],
          ...(category ? { category } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ prompts });
    } catch (error) {
      logger.error('Get prompts error:', error);
      return reply.status(500).send({ error: 'Failed to get prompts' });
    }
  });

  // CREATE PROMPT
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const body = createPromptSchema.parse(request.body);

      const prompt = await prisma.prompt.create({
        data: {
          title: body.title,
          content: body.content,
          category: body.category,
          tags: body.tags,
          isPublic: body.isPublic,
          userId,
        },
      });

      return reply.status(201).send({ prompt });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Create prompt error:', error);
      return reply.status(500).send({ error: 'Failed to create prompt' });
    }
  });

  // TOGGLE FAVORITE
  app.post('/:id/favorite', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };

      // Simple toggle - in real app would use separate favorites table
      return reply.send({ isFavorited: true });
    } catch (error) {
      logger.error('Toggle favorite error:', error);
      return reply.status(500).send({ error: 'Failed to toggle favorite' });
    }
  });

  // SUGGEST PROMPT
  app.post('/suggest', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = suggestSchema.parse(request.body);
      const suggestion = generatePromptSuggestion(body.description);
      return reply.send({ suggestion });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Suggest prompt error:', error);
      return reply.status(500).send({ error: 'Failed to suggest prompt' });
    }
  });

  // GET PROMPT BY ID
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const prompt = await prisma.prompt.findUnique({ where: { id } });
      if (!prompt) {
        return reply.status(404).send({ error: 'Prompt not found' });
      }
      return reply.send({ prompt });
    } catch (error) {
      logger.error('Get prompt error:', error);
      return reply.status(500).send({ error: 'Failed to get prompt' });
    }
  });

  // UPDATE PROMPT
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };
      const updates = request.body as Record<string, any>;

      const prompt = await prisma.prompt.updateMany({
        where: { id, userId },
        data: updates,
      });

      return reply.send({ prompt });
    } catch (error) {
      logger.error('Update prompt error:', error);
      return reply.status(500).send({ error: 'Failed to update prompt' });
    }
  });

  // DELETE PROMPT
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { id } = request.params as { id: string };
      await prisma.prompt.deleteMany({ where: { id, userId } });
      return reply.send({ message: 'Prompt deleted' });
    } catch (error) {
      logger.error('Delete prompt error:', error);
      return reply.status(500).send({ error: 'Failed to delete prompt' });
    }
  });
}

// AI Arena - Arena API
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { arenaOrchestrator } from '../services/orchestrator.js';
import { openRouterService, ModelId } from '../services/openrouter.js';
import { authenticate } from './auth.js';
import { ArenaMode } from '@prisma/client';

// Schemas
const executeSchema = z.object({
  chatId: z.string().uuid(),
  message: z.string().min(1),
  mode: z.enum(['AUTO_SELECT', 'COLLABORATIVE', 'DIVIDE_CONQUER', 'PROJECT', 'TESTER']),
  selectedModels: z.array(z.string()).optional(),
  systemPrompt: z.string().optional(),
});

const analyzeSchema = z.object({
  message: z.string().min(1),
});

export async function arenaRoutes(app: FastifyInstance) {
  // Execute arena request
  app.post('/execute', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      const body = executeSchema.parse(request.body);

      // Verify chat ownership
      const chat = await prisma.chat.findFirst({
        where: {
          id: body.chatId,
          OR: [
            { userId },
            { team: { members: { some: { userId } } } },
          ],
        },
      });

      if (!chat) {
        return reply.status(404).send({ error: 'Chat not found' });
      }

      // Save user message
      await prisma.message.create({
        data: {
          chatId: body.chatId,
          role: 'USER',
          content: body.message,
        },
      });

      // Execute arena
      const startTime = Date.now();
      
      const result = await arenaOrchestrator.execute({
        chatId: body.chatId,
        userId,
        teamId: chat.teamId || undefined,
        message: body.message,
        mode: body.mode as ArenaMode,
        selectedModels: body.selectedModels as ModelId[] | undefined,
        systemPrompt: body.systemPrompt,
      });

      // Save assistant message
      const assistantMessage = await prisma.message.create({
        data: {
          chatId: body.chatId,
          role: 'ASSISTANT',
          content: result.content,
          modelId: result.modelId,
          modelName: result.modelName,
          promptTokens: result.metadata.totalTokens,
          completionTokens: 0,
          totalTokens: result.metadata.totalTokens,
          metadata: {
            mode: result.mode,
            processingTime: result.metadata.processingTime,
            cost: result.metadata.cost,
            confidence: result.metadata.confidence,
            subResults: result.subResults,
          },
        },
      });

      // Log usage
      await prisma.usageLog.create({
        data: {
          userId,
          teamId: chat.teamId,
          modelId: result.modelId,
          chatId: body.chatId,
          arenaMode: body.mode as ArenaMode,
          promptTokens: result.metadata.totalTokens,
          completionTokens: 0,
          totalTokens: result.metadata.totalTokens,
          cost: result.metadata.cost,
        },
      });

      logger.info(`Arena execution completed in ${Date.now() - startTime}ms`);

      return {
        message: {
          id: assistantMessage.id,
          content: result.content,
          modelId: result.modelId,
          modelName: result.modelName,
          mode: result.mode,
          metadata: result.metadata,
          subResults: result.subResults,
        },
      };
    } catch (error) {
      logger.error('Arena execution failed:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      return reply.status(500).send({ error: 'Execution failed' });
    }
  });

  // Analyze task (for auto-select preview)
  app.post('/analyze', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = analyzeSchema.parse(request.body);

      // Use the task classifier from orchestrator
      const classifyPrompt = `Analysiere die folgende Anfrage und klassifiziere sie.

Antworte NUR mit einem JSON-Objekt:
{
  "type": "code|writing|research|analysis|creative|general",
  "complexity": 1-10,
  "subTypes": ["sub1", "sub2"],
  "estimatedTokens": number,
  "reasoning": "kurze Begründung"
}

Anfrage: ${body.message}`;

      const response = await openRouterService.createCompletion({
        model: 'anthropic/claude-3.5-haiku',
        messages: [{ role: 'user', content: classifyPrompt }],
        maxTokens: 500,
      });

      try {
        const classification = JSON.parse(response.content);
        
        // Get suggested models
        const suggestedModels = getSuggestedModels(classification.type, classification.complexity);

        return {
          classification: {
            ...classification,
            suggestedModels: suggestedModels.map(id => ({
              id,
              ...openRouterService.getModel(id as ModelId),
            })),
          },
        };
      } catch {
        return {
          classification: {
            type: 'general',
            complexity: 5,
            suggestedModels: [{
              id: 'anthropic/claude-3.5-sonnet',
              ...openRouterService.getModel('anthropic/claude-3.5-sonnet'),
            }],
          },
        };
      }
    } catch (error) {
      logger.error('Task analysis failed:', error);
      return reply.status(500).send({ error: 'Analysis failed' });
    }
  });

  // Get available models
  app.get('/models', async (request: FastifyRequest, reply: FastifyReply) => {
    const models = openRouterService.getModels();
    
    return {
      models: Object.entries(models).map(([id, model]) => ({
        id,
        ...model,
      })),
    };
  });

  // Get model by ID
  app.get('/models/:modelId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { modelId } = request.params as { modelId: string };
    
    const model = openRouterService.getModel(modelId as ModelId);
    
    if (!model) {
      return reply.status(404).send({ error: 'Model not found' });
    }

    return { model: { id: modelId, ...model } };
  });

  // Get usage statistics
  app.get('/stats', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;
    const { period = '30d' } = request.query as { period?: string };

    // Calculate date range
    const days = parseInt(period.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get usage stats
    const [totalUsage, byMode, byModel, dailyUsage] = await Promise.all([
      // Total usage
      prisma.usageLog.aggregate({
        where: { userId, createdAt: { gte: startDate } },
        _sum: { totalTokens: true, cost: true },
        _count: true,
      }),
      
      // By mode
      prisma.usageLog.groupBy({
        by: ['arenaMode'],
        where: { userId, createdAt: { gte: startDate } },
        _sum: { totalTokens: true, cost: true },
        _count: true,
      }),
      
      // By model
      prisma.usageLog.groupBy({
        by: ['modelId'],
        where: { userId, createdAt: { gte: startDate } },
        _sum: { totalTokens: true, cost: true },
        _count: true,
      }),
      
      // Daily usage (simplified - would need raw SQL for proper grouping)
      prisma.usageLog.findMany({
        where: { userId, createdAt: { gte: startDate } },
        select: { createdAt: true, totalTokens: true, cost: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      stats: {
        period,
        total: {
          requests: totalUsage._count,
          tokens: totalUsage._sum.totalTokens || 0,
          cost: totalUsage._sum.cost || 0,
        },
        byMode: byMode.map(m => ({
          mode: m.arenaMode,
          requests: m._count,
          tokens: m._sum.totalTokens || 0,
          cost: m._sum.cost || 0,
        })),
        byModel: byModel.map(m => ({
          modelId: m.modelId,
          requests: m._count,
          tokens: m._sum.totalTokens || 0,
          cost: m._sum.cost || 0,
        })),
      },
    };
  });
}

// Helper: Get suggested models for a task
function getSuggestedModels(type: string, complexity: number): string[] {
  const modelsByType: Record<string, string[]> = {
    code: ['deepseek/deepseek-coder', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o'],
    writing: ['anthropic/claude-3-opus', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet'],
    research: ['perplexity/sonar-pro', 'google/gemini-1.5-pro', 'anthropic/claude-3.5-sonnet'],
    analysis: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-1.5-pro'],
    creative: ['anthropic/claude-3-opus', 'openai/gpt-4o', 'meta-llama/llama-3.1-405b'],
    general: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o'],
  };

  // For high complexity, prefer more powerful models
  if (complexity >= 8) {
    return ['anthropic/claude-3-opus', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet'];
  }

  // For low complexity, prefer faster models
  if (complexity <= 3) {
    return ['anthropic/claude-3.5-haiku', 'openai/gpt-4o-mini', 'google/gemini-1.5-flash'];
  }

  return modelsByType[type] || modelsByType.general;
}

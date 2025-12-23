import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

// ════════════════════════════════════════════════════════════════════════════
// ARENA MODES CONFIG
// ════════════════════════════════════════════════════════════════════════════

const ARENA_MODES = [
  {
    id: 'AUTO_SELECT',
    name: 'Auto-Select',
    description: 'Die Arena analysiert die Aufgabe und wählt das optimale Modell',
    icon: 'Sparkles',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'COLLABORATIVE',
    name: 'Collaborative',
    description: 'Mehrere Modelle arbeiten zusammen an der Aufgabe',
    icon: 'Users',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'DIVIDE_CONQUER',
    name: 'Divide & Conquer',
    description: 'Aufgabe wird zerlegt, spezialisierte Modelle bearbeiten Teile',
    icon: 'GitBranch',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'PROJECT',
    name: 'Project',
    description: 'Kollaborative Planung, spezialisierte Ausführung, gemeinsames Review',
    icon: 'FolderKanban',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'TESTER',
    name: 'Tester',
    description: 'Automatisierte Tests mit Cross-Verification durch mehrere Modelle',
    icon: 'TestTube2',
    color: 'from-red-500 to-rose-500',
  },
];

// ════════════════════════════════════════════════════════════════════════════
// AVAILABLE MODELS
// ════════════════════════════════════════════════════════════════════════════

const AVAILABLE_MODELS = [
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Most capable model for complex tasks',
    capabilities: ['reasoning', 'coding', 'analysis', 'creative'],
    costPer1kTokens: 0.015,
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced performance and cost',
    capabilities: ['reasoning', 'coding', 'analysis'],
    costPer1kTokens: 0.003,
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Fast and efficient for simple tasks',
    capabilities: ['chat', 'summarization'],
    costPer1kTokens: 0.00025,
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    description: 'Powerful model with vision capabilities',
    capabilities: ['reasoning', 'coding', 'vision', 'analysis'],
    costPer1kTokens: 0.01,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Optimized for speed and quality',
    capabilities: ['reasoning', 'coding', 'vision'],
    costPer1kTokens: 0.005,
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    description: 'Large context window, multimodal',
    capabilities: ['reasoning', 'analysis', 'long-context'],
    costPer1kTokens: 0.00125,
  },
  {
    id: 'meta/llama-3.1-405b',
    name: 'Llama 3.1 405B',
    provider: 'Meta',
    description: 'Open source large model',
    capabilities: ['reasoning', 'coding'],
    costPer1kTokens: 0.003,
  },
  {
    id: 'mistral/mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    description: 'European frontier model',
    capabilities: ['reasoning', 'multilingual'],
    costPer1kTokens: 0.002,
  },
  {
    id: 'deepseek/deepseek-coder',
    name: 'DeepSeek Coder',
    provider: 'DeepSeek',
    description: 'Specialized for code generation',
    capabilities: ['coding', 'debugging'],
    costPer1kTokens: 0.0002,
  },
];

// ════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ════════════════════════════════════════════════════════════════════════════

const changeModeSchema = z.object({
  mode: z.enum(['AUTO_SELECT', 'COLLABORATIVE', 'DIVIDE_CONQUER', 'PROJECT', 'TESTER']),
});

const selectModelsSchema = z.object({
  modelIds: z.array(z.string()),
});

const analyzeTaskSchema = z.object({
  content: z.string().min(1),
});

// ════════════════════════════════════════════════════════════════════════════
// ARENA ROUTES
// ════════════════════════════════════════════════════════════════════════════

export async function arenaRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // ══════════════════════════════════════════════════════════════════════════
  // GET AVAILABLE MODELS
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/models', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ models: AVAILABLE_MODELS });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET ARENA MODES
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/modes', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ modes: ARENA_MODES });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CHANGE CHAT MODE
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/chats/:chatId/mode', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { chatId } = request.params as { chatId: string };
      const body = changeModeSchema.parse(request.body);

      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [
            { userId },
            { team: { members: { some: { userId } } } },
          ],
        },
      });

      if (!chat) {
        return reply.status(404).send({ error: 'Chat not found' });
      }

      const updatedChat = await prisma.chat.update({
        where: { id: chatId },
        data: { mode: body.mode },
      });

      return reply.send({ chat: updatedChat });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Change mode error:', error);
      return reply.status(500).send({ error: 'Failed to change mode' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SELECT MODELS FOR CHAT
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/chats/:chatId/models', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };
      const { chatId } = request.params as { chatId: string };
      const body = selectModelsSchema.parse(request.body);

      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [
            { userId },
            { team: { members: { some: { userId } } } },
          ],
        },
      });

      if (!chat) {
        return reply.status(404).send({ error: 'Chat not found' });
      }

      // Validate model IDs
      const validModelIds = body.modelIds.filter(id => 
        AVAILABLE_MODELS.some(m => m.id === id)
      );

      const updatedChat = await prisma.chat.update({
        where: { id: chatId },
        data: { selectedModels: validModelIds },
      });

      return reply.send({ chat: updatedChat });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Select models error:', error);
      return reply.status(500).send({ error: 'Failed to select models' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ANALYZE TASK (Auto-Select Mode)
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = analyzeTaskSchema.parse(request.body);

      // Simple task analysis based on keywords
      const content = body.content.toLowerCase();
      
      let recommendedModels: string[] = [];
      let taskType = 'general';
      let complexity = 'medium';

      // Analyze task type
      if (content.includes('code') || content.includes('programming') || content.includes('debug')) {
        taskType = 'coding';
        recommendedModels = ['anthropic/claude-3-sonnet', 'deepseek/deepseek-coder'];
      } else if (content.includes('analyze') || content.includes('research') || content.includes('compare')) {
        taskType = 'analysis';
        recommendedModels = ['anthropic/claude-3-opus', 'openai/gpt-4-turbo'];
        complexity = 'high';
      } else if (content.includes('write') || content.includes('creative') || content.includes('story')) {
        taskType = 'creative';
        recommendedModels = ['anthropic/claude-3-opus', 'openai/gpt-4o'];
      } else if (content.includes('summarize') || content.includes('quick') || content.includes('simple')) {
        taskType = 'simple';
        recommendedModels = ['anthropic/claude-3-haiku', 'google/gemini-pro-1.5'];
        complexity = 'low';
      } else {
        recommendedModels = ['anthropic/claude-3-sonnet'];
      }

      // Recommend mode based on task
      let recommendedMode = 'AUTO_SELECT';
      if (taskType === 'coding' && complexity === 'high') {
        recommendedMode = 'DIVIDE_CONQUER';
      } else if (taskType === 'analysis') {
        recommendedMode = 'COLLABORATIVE';
      }

      return reply.send({
        analysis: {
          taskType,
          complexity,
          recommendedModels,
          recommendedMode,
          reasoning: `Detected ${taskType} task with ${complexity} complexity. Recommended models are optimized for this type of work.`,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      logger.error('Analyze task error:', error);
      return reply.status(500).send({ error: 'Failed to analyze task' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET MODEL RECOMMENDATIONS
  // ══════════════════════════════════════════════════════════════════════════

  app.post('/recommend', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { task } = request.body as { task: string };

      if (!task || task.trim().length === 0) {
        return reply.status(400).send({ error: 'Task description required' });
      }

      const content = task.toLowerCase();
      const recommendations: Array<{ modelId: string; confidence: number; reason: string }> = [];

      // Analyze task and recommend models
      if (content.includes('code') || content.includes('programming') || content.includes('debug') || content.includes('function')) {
        recommendations.push(
          { modelId: 'deepseek/deepseek-coder', confidence: 0.95, reason: 'Spezialisiert auf Code-Generierung und Debugging' },
          { modelId: 'anthropic/claude-3-sonnet', confidence: 0.85, reason: 'Ausgezeichnet für komplexe Programmieraufgaben' }
        );
      } else if (content.includes('analyze') || content.includes('research') || content.includes('compare') || content.includes('analyse')) {
        recommendations.push(
          { modelId: 'anthropic/claude-3-opus', confidence: 0.92, reason: 'Beste Wahl für tiefgehende Analysen' },
          { modelId: 'openai/gpt-4-turbo', confidence: 0.88, reason: 'Starke analytische Fähigkeiten' }
        );
      } else if (content.includes('write') || content.includes('creative') || content.includes('story') || content.includes('schreib')) {
        recommendations.push(
          { modelId: 'anthropic/claude-3-opus', confidence: 0.90, reason: 'Hervorragend für kreatives Schreiben' },
          { modelId: 'openai/gpt-4o', confidence: 0.85, reason: 'Vielseitig und kreativ' }
        );
      } else if (content.includes('summarize') || content.includes('zusammenfass') || content.includes('quick') || content.includes('simple')) {
        recommendations.push(
          { modelId: 'anthropic/claude-3-haiku', confidence: 0.90, reason: 'Schnell und effizient für einfache Aufgaben' },
          { modelId: 'google/gemini-pro-1.5', confidence: 0.80, reason: 'Gut für Zusammenfassungen' }
        );
      } else if (content.includes('translate') || content.includes('übersetz') || content.includes('language')) {
        recommendations.push(
          { modelId: 'mistral/mistral-large', confidence: 0.88, reason: 'Hervorragend für mehrsprachige Aufgaben' },
          { modelId: 'anthropic/claude-3-sonnet', confidence: 0.85, reason: 'Starke Sprachfähigkeiten' }
        );
      } else {
        // Default recommendations
        recommendations.push(
          { modelId: 'anthropic/claude-3-sonnet', confidence: 0.85, reason: 'Ausgewogene Leistung für allgemeine Aufgaben' },
          { modelId: 'openai/gpt-4o', confidence: 0.80, reason: 'Vielseitig einsetzbar' }
        );
      }

      return reply.send({ recommendations });
    } catch (error) {
      logger.error('Recommend models error:', error);
      return reply.status(500).send({ error: 'Failed to get recommendations' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET ARENA STATISTICS
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };

      const [chatCount, messageCount, totalTokens] = await Promise.all([
        prisma.chat.count({ where: { userId } }),
        prisma.message.count({ where: { chat: { userId } } }),
        prisma.message.aggregate({
          where: { chat: { userId } },
          _sum: { tokens: true },
        }),
      ]);

      // Estimate cost (simplified)
      const estimatedCost = ((totalTokens._sum.tokens || 0) / 1000) * 0.003;

      return reply.send({
        stats: {
          totalChats: chatCount,
          totalMessages: messageCount,
          totalTokens: totalTokens._sum.tokens || 0,
          estimatedCost: estimatedCost.toFixed(4),
        },
      });
    } catch (error) {
      logger.error('Get stats error:', error);
      return reply.status(500).send({ error: 'Failed to get stats' });
    }
  });
}

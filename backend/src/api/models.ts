import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger.js';

// ════════════════════════════════════════════════════════════════════════════
// AVAILABLE MODELS
// ════════════════════════════════════════════════════════════════════════════

const MODELS = [
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Most capable model for complex tasks',
    capabilities: ['reasoning', 'coding', 'analysis', 'creative'],
    contextWindow: 200000,
    costPerInputToken: 0.000015,
    costPerOutputToken: 0.000075,
    status: 'available',
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced performance and cost',
    capabilities: ['reasoning', 'coding', 'analysis'],
    contextWindow: 200000,
    costPerInputToken: 0.000003,
    costPerOutputToken: 0.000015,
    status: 'available',
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Fast and efficient for simple tasks',
    capabilities: ['chat', 'summarization'],
    contextWindow: 200000,
    costPerInputToken: 0.00000025,
    costPerOutputToken: 0.00000125,
    status: 'available',
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    description: 'Powerful model with vision capabilities',
    capabilities: ['reasoning', 'coding', 'vision', 'analysis'],
    contextWindow: 128000,
    costPerInputToken: 0.00001,
    costPerOutputToken: 0.00003,
    status: 'available',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Optimized for speed and quality',
    capabilities: ['reasoning', 'coding', 'vision'],
    contextWindow: 128000,
    costPerInputToken: 0.000005,
    costPerOutputToken: 0.000015,
    status: 'available',
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    description: 'Large context window, multimodal',
    capabilities: ['reasoning', 'analysis', 'long-context'],
    contextWindow: 1000000,
    costPerInputToken: 0.00000125,
    costPerOutputToken: 0.000005,
    status: 'available',
  },
  {
    id: 'meta/llama-3.1-405b',
    name: 'Llama 3.1 405B',
    provider: 'Meta',
    description: 'Open source large model',
    capabilities: ['reasoning', 'coding'],
    contextWindow: 128000,
    costPerInputToken: 0.000003,
    costPerOutputToken: 0.000003,
    status: 'available',
  },
  {
    id: 'mistral/mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    description: 'European frontier model',
    capabilities: ['reasoning', 'multilingual'],
    contextWindow: 32000,
    costPerInputToken: 0.000002,
    costPerOutputToken: 0.000006,
    status: 'available',
  },
  {
    id: 'deepseek/deepseek-coder',
    name: 'DeepSeek Coder',
    provider: 'DeepSeek',
    description: 'Specialized for code generation',
    capabilities: ['coding', 'debugging'],
    contextWindow: 16000,
    costPerInputToken: 0.0000002,
    costPerOutputToken: 0.0000002,
    status: 'available',
  },
];

// ════════════════════════════════════════════════════════════════════════════
// MODELS ROUTES
// ════════════════════════════════════════════════════════════════════════════

export async function modelsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // ══════════════════════════════════════════════════════════════════════════
  // GET ALL MODELS
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return reply.send({ models: MODELS });
    } catch (error) {
      logger.error('Get models error:', error);
      return reply.status(500).send({ error: 'Failed to get models' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET MODEL BY ID
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      const model = MODELS.find(m => m.id === id || m.id === decodeURIComponent(id));
      
      if (!model) {
        return reply.status(404).send({ error: 'Model not found' });
      }

      return reply.send({ model });
    } catch (error) {
      logger.error('Get model error:', error);
      return reply.status(500).send({ error: 'Failed to get model' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET MODELS BY CAPABILITY
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/capability/:capability', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { capability } = request.params as { capability: string };
      
      const models = MODELS.filter(m => m.capabilities.includes(capability));

      return reply.send({ models });
    } catch (error) {
      logger.error('Get models by capability error:', error);
      return reply.status(500).send({ error: 'Failed to get models' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET MODELS BY PROVIDER
  // ══════════════════════════════════════════════════════════════════════════
  
  app.get('/provider/:provider', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { provider } = request.params as { provider: string };
      
      const models = MODELS.filter(m => 
        m.provider.toLowerCase() === provider.toLowerCase()
      );

      return reply.send({ models });
    } catch (error) {
      logger.error('Get models by provider error:', error);
      return reply.status(500).send({ error: 'Failed to get models' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // RECOMMEND MODELS FOR TASK
  // ══════════════════════════════════════════════════════════════════════════
  
  app.post('/recommend', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { task, budget } = request.body as { task: string; budget?: 'low' | 'medium' | 'high' };
      
      const taskLower = task.toLowerCase();
      let recommended: typeof MODELS = [];

      // Determine required capabilities
      let requiredCapabilities: string[] = [];
      
      if (taskLower.includes('code') || taskLower.includes('program')) {
        requiredCapabilities.push('coding');
      }
      if (taskLower.includes('analyze') || taskLower.includes('research')) {
        requiredCapabilities.push('analysis');
        requiredCapabilities.push('reasoning');
      }
      if (taskLower.includes('image') || taskLower.includes('picture')) {
        requiredCapabilities.push('vision');
      }
      if (taskLower.includes('long') || taskLower.includes('document')) {
        requiredCapabilities.push('long-context');
      }

      // Filter by capabilities
      if (requiredCapabilities.length > 0) {
        recommended = MODELS.filter(m => 
          requiredCapabilities.some(cap => m.capabilities.includes(cap))
        );
      } else {
        recommended = MODELS;
      }

      // Sort by cost if budget specified
      if (budget === 'low') {
        recommended = recommended.sort((a, b) => a.costPerInputToken - b.costPerInputToken);
      } else if (budget === 'high') {
        // Prioritize capability over cost
        recommended = recommended.sort((a, b) => b.capabilities.length - a.capabilities.length);
      }

      return reply.send({ 
        recommendations: recommended.slice(0, 3),
        reasoning: `Based on your task "${task}", these models are best suited.`,
      });
    } catch (error) {
      logger.error('Recommend models error:', error);
      return reply.status(500).send({ error: 'Failed to recommend models' });
    }
  });
}

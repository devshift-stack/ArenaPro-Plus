// AI Arena - OpenRouter Service
// Handles all communication with OpenRouter API

import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { redis } from '../utils/redis.js';

// Model definitions with capabilities
export const MODELS = {
  // Reasoning & Analysis
  'anthropic/claude-3.5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    capabilities: ['reasoning', 'code', 'writing', 'analysis'],
    contextLength: 200000,
    inputPrice: 3.0,
    outputPrice: 15.0,
    speedScore: 85,
    qualityScore: 95,
    specialties: { code: 95, writing: 90, reasoning: 95, analysis: 92 },
  },
  'anthropic/claude-3-opus': {
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    capabilities: ['reasoning', 'code', 'writing', 'creative', 'analysis'],
    contextLength: 200000,
    inputPrice: 15.0,
    outputPrice: 75.0,
    speedScore: 60,
    qualityScore: 100,
    specialties: { code: 92, writing: 98, reasoning: 98, creative: 95, analysis: 96 },
  },
  'openai/gpt-4o': {
    name: 'GPT-4o',
    provider: 'OpenAI',
    capabilities: ['reasoning', 'code', 'writing', 'multimodal', 'analysis'],
    contextLength: 128000,
    inputPrice: 5.0,
    outputPrice: 15.0,
    speedScore: 90,
    qualityScore: 93,
    specialties: { code: 90, writing: 88, reasoning: 92, multimodal: 95, analysis: 90 },
  },
  'openai/gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    capabilities: ['reasoning', 'code', 'writing'],
    contextLength: 128000,
    inputPrice: 10.0,
    outputPrice: 30.0,
    speedScore: 75,
    qualityScore: 91,
    specialties: { code: 88, writing: 85, reasoning: 90 },
  },
  'google/gemini-1.5-pro': {
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    capabilities: ['reasoning', 'code', 'research', 'multimodal'],
    contextLength: 1000000,
    inputPrice: 3.5,
    outputPrice: 10.5,
    speedScore: 80,
    qualityScore: 88,
    specialties: { code: 85, research: 92, reasoning: 88, multimodal: 90 },
  },
  'deepseek/deepseek-coder': {
    name: 'DeepSeek Coder V2',
    provider: 'DeepSeek',
    capabilities: ['code'],
    contextLength: 128000,
    inputPrice: 0.14,
    outputPrice: 0.28,
    speedScore: 95,
    qualityScore: 88,
    specialties: { code: 96 },
  },
  'perplexity/sonar-pro': {
    name: 'Perplexity Sonar Pro',
    provider: 'Perplexity',
    capabilities: ['research', 'factual'],
    contextLength: 127000,
    inputPrice: 3.0,
    outputPrice: 15.0,
    speedScore: 85,
    qualityScore: 85,
    specialties: { research: 98, factual: 95 },
  },
  'mistralai/mistral-large': {
    name: 'Mistral Large',
    provider: 'Mistral',
    capabilities: ['reasoning', 'code', 'writing'],
    contextLength: 128000,
    inputPrice: 3.0,
    outputPrice: 9.0,
    speedScore: 85,
    qualityScore: 85,
    specialties: { code: 85, writing: 88, reasoning: 86 },
  },
  'meta-llama/llama-3.1-405b': {
    name: 'Llama 3.1 405B',
    provider: 'Meta',
    capabilities: ['reasoning', 'code', 'writing', 'creative'],
    contextLength: 131072,
    inputPrice: 3.0,
    outputPrice: 3.0,
    speedScore: 70,
    qualityScore: 88,
    specialties: { code: 85, writing: 86, reasoning: 87, creative: 85 },
  },
  // Fast models
  'anthropic/claude-3.5-haiku': {
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    capabilities: ['reasoning', 'code', 'writing'],
    contextLength: 200000,
    inputPrice: 0.25,
    outputPrice: 1.25,
    speedScore: 98,
    qualityScore: 80,
    specialties: { code: 82, writing: 78, reasoning: 80 },
  },
  'openai/gpt-4o-mini': {
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    capabilities: ['reasoning', 'code', 'writing'],
    contextLength: 128000,
    inputPrice: 0.15,
    outputPrice: 0.6,
    speedScore: 98,
    qualityScore: 78,
    specialties: { code: 80, writing: 75, reasoning: 78 },
  },
  'google/gemini-1.5-flash': {
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    capabilities: ['reasoning', 'code', 'multimodal'],
    contextLength: 1000000,
    inputPrice: 0.075,
    outputPrice: 0.3,
    speedScore: 98,
    qualityScore: 75,
    specialties: { code: 78, reasoning: 76, multimodal: 80 },
  },
} as const;

export type ModelId = keyof typeof MODELS;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model: ModelId;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
  stop?: string[];
}

export interface CompletionResponse {
  id: string;
  model: string;
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  finishReason: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

class OpenRouterService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = config.OPENROUTER_BASE_URL;
    this.apiKey = config.OPENROUTER_API_KEY;
  }

  /**
   * Create a chat completion
   */
  async createCompletion(options: CompletionOptions): Promise<CompletionResponse> {
    const {
      model,
      messages,
      maxTokens = 4096,
      temperature = 0.7,
      topP = 1,
      stop,
    } = options;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': config.FRONTEND_URL,
        'X-Title': 'AI Arena',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        stop,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`OpenRouter API error: ${error}`);
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      model: data.model,
      content: data.choices[0]?.message?.content || '',
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
      finishReason: data.choices[0]?.finish_reason || 'stop',
    };
  }

  /**
   * Create a streaming chat completion
   */
  async *createStreamingCompletion(options: CompletionOptions): AsyncGenerator<StreamChunk> {
    const {
      model,
      messages,
      maxTokens = 4096,
      temperature = 0.7,
      topP = 1,
      stop,
    } = options;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': config.FRONTEND_URL,
        'X-Title': 'AI Arena',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        stop,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        yield { content: '', done: true };
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { content: '', done: true };
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              yield { content, done: false };
            }
          } catch {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }
    }
  }

  /**
   * Get all available models
   */
  getModels() {
    return MODELS;
  }

  /**
   * Get model info by ID
   */
  getModel(modelId: ModelId) {
    return MODELS[modelId];
  }

  /**
   * Select best model for a task
   */
  selectBestModel(taskType: string, requirements: {
    speed?: 'fast' | 'normal' | 'slow';
    quality?: 'low' | 'medium' | 'high';
    budget?: 'low' | 'medium' | 'high';
  } = {}): ModelId {
    const { speed = 'normal', quality = 'medium', budget = 'medium' } = requirements;

    // Map requirements to scores
    const speedMin = speed === 'fast' ? 90 : speed === 'normal' ? 70 : 0;
    const qualityMin = quality === 'high' ? 90 : quality === 'medium' ? 75 : 0;
    const priceMax = budget === 'low' ? 5 : budget === 'medium' ? 20 : 100;

    let bestModel: ModelId = 'anthropic/claude-3.5-sonnet';
    let bestScore = 0;

    for (const [modelId, model] of Object.entries(MODELS)) {
      // Skip if doesn't meet requirements
      if (model.speedScore < speedMin) continue;
      if (model.qualityScore < qualityMin) continue;
      if (model.inputPrice > priceMax) continue;

      // Check if model has the required capability
      const specialty = model.specialties[taskType as keyof typeof model.specialties];
      if (!specialty && taskType !== 'general') continue;

      // Calculate score
      const taskScore = specialty || model.qualityScore;
      const score = taskScore * 0.5 + model.speedScore * 0.2 + (100 - model.inputPrice) * 0.3;

      if (score > bestScore) {
        bestScore = score;
        bestModel = modelId as ModelId;
      }
    }

    return bestModel;
  }

  /**
   * Calculate cost for a completion
   */
  calculateCost(modelId: ModelId, promptTokens: number, completionTokens: number): number {
    const model = MODELS[modelId];
    if (!model) return 0;

    const inputCost = (promptTokens / 1000000) * model.inputPrice;
    const outputCost = (completionTokens / 1000000) * model.outputPrice;

    return inputCost + outputCost;
  }

  /**
   * Cache a response in Redis
   */
  async cacheResponse(key: string, response: CompletionResponse, ttl = 3600) {
    await redis.setex(`openrouter:cache:${key}`, ttl, JSON.stringify(response));
  }

  /**
   * Get cached response from Redis
   */
  async getCachedResponse(key: string): Promise<CompletionResponse | null> {
    const cached = await redis.get(`openrouter:cache:${key}`);
    return cached ? JSON.parse(cached) : null;
  }
}

export const openRouterService = new OpenRouterService();

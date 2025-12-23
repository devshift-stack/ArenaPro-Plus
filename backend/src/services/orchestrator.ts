// ════════════════════════════════════════════════════════════════════════════
// ORCHESTRATOR SERVICE
// Verarbeitet Nachrichten mit Arena-Modi und integriert Learning Engine
// ════════════════════════════════════════════════════════════════════════════

import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { learningEngine } from './learningEngine.js';
import { AdminService, ALL_MODELS } from './adminService.js';
import { config } from '../config/index.js';

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OrchestratorResult {
  response: string;
  modelId: string;
  tokens: { input: number; output: number };
  cost: number;
  metadata?: Record<string, any>;
}

type ModelType = typeof ALL_MODELS[0];

// ════════════════════════════════════════════════════════════════════════════
// ORCHESTRATOR CLASS
// ════════════════════════════════════════════════════════════════════════════

export class Orchestrator {
  
  async processMessage(params: {
    userId: string;
    chatId: string;
    content: string;
    mode: 'AUTO_SELECT' | 'COLLABORATIVE' | 'DIVIDE_CONQUER' | 'PROJECT' | 'TESTER';
    selectedModels?: string[];
  }): Promise<OrchestratorResult> {
    const { userId, chatId, content, mode, selectedModels } = params;

    const availableModels = await AdminService.getAvailableModelsForUser(userId);
    
    let modelsToUse = selectedModels?.length 
      ? availableModels.filter(m => selectedModels.includes(m.id))
      : availableModels;

    if (modelsToUse.length === 0) {
      modelsToUse = availableModels.filter(m => m.tier === 'FREE').slice(0, 1);
    }

    const learningRules = await learningEngine.getActiveRulesForPrompt();
    const history = await this.getChatHistory(chatId);

    switch (mode) {
      case 'AUTO_SELECT':
        return this.autoSelectMode(content, modelsToUse, history, learningRules);
      case 'COLLABORATIVE':
        return this.collaborativeMode(content, modelsToUse, history, learningRules);
      case 'DIVIDE_CONQUER':
        return this.divideConquerMode(content, modelsToUse, history, learningRules);
      case 'PROJECT':
        return this.projectMode(content, modelsToUse, history, learningRules);
      case 'TESTER':
        return this.testerMode(content, modelsToUse, history, learningRules);
      default:
        return this.autoSelectMode(content, modelsToUse, history, learningRules);
    }
  }

  private async autoSelectMode(
    content: string,
    models: ModelType[],
    history: Message[],
    learningRules: string
  ): Promise<OrchestratorResult> {
    const taskType = this.analyzeTaskType(content);
    const selectedModel = this.selectModelForTask(taskType, models);
    return this.callModel(selectedModel, content, history, learningRules);
  }

  private async collaborativeMode(
    content: string,
    models: ModelType[],
    history: Message[],
    learningRules: string
  ): Promise<OrchestratorResult> {
    const selectedModels = models.slice(0, Math.min(3, models.length));
    const responses = await Promise.all(
      selectedModels.map(model => this.callModel(model, content, history, learningRules))
    );
    return this.synthesizeResponses(responses, content);
  }

  private async divideConquerMode(
    content: string,
    models: ModelType[],
    history: Message[],
    learningRules: string
  ): Promise<OrchestratorResult> {
    const subtasks = [
      `Analysiere: ${content}`,
      `Erstelle Lösung für: ${content}`,
      `Optimiere: ${content}`,
    ];

    const results = await Promise.all(
      subtasks.map((task, i) => 
        this.callModel(models[i % models.length], task, history, learningRules)
      )
    );

    const combined = results.map((r, i) => `### Schritt ${i + 1}:\n${r.response}`).join('\n\n');

    return {
      response: combined,
      modelId: models.map(m => m.id).join('+'),
      tokens: {
        input: results.reduce((s, r) => s + r.tokens.input, 0),
        output: results.reduce((s, r) => s + r.tokens.output, 0),
      },
      cost: results.reduce((s, r) => s + r.cost, 0),
      metadata: { mode: 'DIVIDE_CONQUER' },
    };
  }

  private async projectMode(
    content: string,
    models: ModelType[],
    history: Message[],
    learningRules: string
  ): Promise<OrchestratorResult> {
    const [planner, executor, reviewer] = [models[0], models[1] || models[0], models[2] || models[0]];

    const plan = await this.callModel(planner, `Erstelle Plan für: ${content}`, history, learningRules);
    const execution = await this.callModel(executor, `Führe aus: ${plan.response}`, history, learningRules);
    const review = await this.callModel(reviewer, `Überprüfe: ${execution.response}`, history, learningRules);

    return {
      response: `## Ergebnis\n\n${execution.response}\n\n---\n\n## Review\n\n${review.response}`,
      modelId: `${planner.id}+${executor.id}+${reviewer.id}`,
      tokens: {
        input: plan.tokens.input + execution.tokens.input + review.tokens.input,
        output: plan.tokens.output + execution.tokens.output + review.tokens.output,
      },
      cost: plan.cost + execution.cost + review.cost,
      metadata: { mode: 'PROJECT', phases: ['plan', 'execute', 'review'] },
    };
  }

  private async testerMode(
    content: string,
    models: ModelType[],
    history: Message[],
    learningRules: string
  ): Promise<OrchestratorResult> {
    const testModels = models.slice(0, Math.min(3, models.length));
    const responses = await Promise.all(
      testModels.map(model => this.callModel(model, content, history, learningRules))
    );

    const comparison = this.compareResponses(responses);
    
    if (comparison.consensus) {
      return { ...responses[0], metadata: { mode: 'TESTER', consensus: true } };
    }

    return {
      ...await this.synthesizeResponses(responses, content),
      metadata: { mode: 'TESTER', consensus: false, agreementRate: comparison.agreementRate },
    };
  }

  private async getChatHistory(chatId: string): Promise<Message[]> {
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    return messages.map(m => ({
      role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: m.content,
    }));
  }

  private analyzeTaskType(content: string): string {
    const lower = content.toLowerCase();
    if (lower.match(/code|program|function|script|debug/)) return 'coding';
    if (lower.match(/analyze|research|compare|study/)) return 'analysis';
    if (lower.match(/write|creative|story|poem/)) return 'creative';
    if (lower.match(/math|calculate|equation|compute/)) return 'math';
    return 'general';
  }

  private selectModelForTask(taskType: string, models: ModelType[]): ModelType {
    const scored = models.map(model => {
      let score = 0;
      if (taskType === 'coding' && model.capabilities.includes('coding')) score += 10;
      if (taskType === 'analysis' && model.capabilities.includes('analysis')) score += 10;
      if (taskType === 'creative' && model.capabilities.includes('creative')) score += 10;
      if (taskType === 'general') score -= model.costPerInputToken * 1000000;
      return { model, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].model;
  }

  private async callModel(
    model: ModelType,
    content: string,
    history: Message[],
    learningRules: string
  ): Promise<OrchestratorResult> {
    logger.info(`Calling model: ${model.id}`);

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [];

    // Add system prompt with learning rules if available
    if (learningRules) {
      messages.push({
        role: 'system',
        content: `Du bist ein hilfreicher AI-Assistent. Beachte folgende Regeln:\n${learningRules}`,
      });
    } else {
      messages.push({
        role: 'system',
        content: 'Du bist ein hilfreicher AI-Assistent.',
      });
    }

    // Add chat history
    for (const msg of history) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: content,
    });

    try {
      const response = await fetch(`${config.openrouter.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openrouter.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': config.frontendUrl,
          'X-Title': 'AI Arena',
        },
        body: JSON.stringify({
          model: model.id,
          messages: messages,
          max_tokens: 4096,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`OpenRouter API error: ${response.status} - ${errorText}`);
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage = data.choices?.[0]?.message?.content || 'Keine Antwort erhalten.';
      const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

      const inputTokens = usage.prompt_tokens || 0;
      const outputTokens = usage.completion_tokens || 0;
      const cost = (inputTokens * model.costPerInputToken) + (outputTokens * model.costPerOutputToken);

      logger.info(`Model ${model.id} responded with ${inputTokens} input, ${outputTokens} output tokens`);

      return {
        response: assistantMessage,
        modelId: model.id,
        tokens: { input: inputTokens, output: outputTokens },
        cost: cost,
      };
    } catch (error) {
      logger.error(`Error calling model ${model.id}:`, error);

      // Return error message instead of throwing
      return {
        response: `Fehler beim Aufrufen von ${model.name}: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        modelId: model.id,
        tokens: { input: 0, output: 0 },
        cost: 0,
        metadata: { error: true },
      };
    }
  }

  private async synthesizeResponses(responses: OrchestratorResult[], query: string): Promise<OrchestratorResult> {
    const combined = responses.map((r, i) => `### ${r.modelId}:\n${r.response}`).join('\n\n---\n\n');
    
    return {
      response: `## Synthese\n\n${combined}`,
      modelId: responses.map(r => r.modelId).join('+'),
      tokens: {
        input: responses.reduce((s, r) => s + r.tokens.input, 0),
        output: responses.reduce((s, r) => s + r.tokens.output, 0),
      },
      cost: responses.reduce((s, r) => s + r.cost, 0),
    };
  }

  private compareResponses(responses: OrchestratorResult[]): { consensus: boolean; agreementRate: number; discrepancies?: string[] } {
    // Einfache Vergleichslogik
    const agreementRate = responses.length > 1 ? 0.7 : 1;
    return { consensus: agreementRate > 0.8, agreementRate };
  }
}

export const orchestrator = new Orchestrator();

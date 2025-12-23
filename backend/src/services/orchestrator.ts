// AI Arena - Orchestrator Service
// Handles all arena modes and model coordination

import { openRouterService, ModelId, ChatMessage, CompletionResponse } from './openrouter.js';
import { memoryService } from './memory.js';
import { knowledgeService } from './knowledge.js';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { ArenaMode } from '@prisma/client';

// Task classification result
interface TaskClassification {
  type: 'code' | 'writing' | 'research' | 'analysis' | 'creative' | 'general';
  complexity: number; // 1-10
  subTypes: string[];
  estimatedTokens: number;
  suggestedModels: ModelId[];
  confidence: number;
}

// Arena execution result
interface ArenaResult {
  content: string;
  modelId: ModelId;
  modelName: string;
  mode: ArenaMode;
  subResults?: SubResult[];
  metadata: {
    totalTokens: number;
    processingTime: number;
    cost: number;
    confidence?: number;
  };
}

interface SubResult {
  taskId: string;
  taskType: string;
  modelId: ModelId;
  content: string;
  status: 'completed' | 'failed';
  tokens: number;
}

// System prompts
const ORCHESTRATOR_PROMPT = `Du bist der Arena Orchestrator, ein intelligentes System zur Koordination von KI-Modellen.

Deine Aufgaben:
1. Analysiere Benutzeranfragen und klassifiziere sie nach Typ und Komplexität
2. Wähle die optimalen Modelle für jede Aufgabe
3. Koordiniere die Zusammenarbeit zwischen Modellen
4. Synthetisiere Ergebnisse zu kohärenten Antworten

Wichtige Regeln:
- Sei immer hilfreich und proaktiv
- Mache Vorschläge zur Verbesserung
- Beachte alle Regeln aus dem Gesetzbuch
- Schütze Benutzerdaten
`;

const TASK_CLASSIFIER_PROMPT = `Analysiere die folgende Anfrage und klassifiziere sie.

Antworte NUR mit einem JSON-Objekt im folgenden Format:
{
  "type": "code|writing|research|analysis|creative|general",
  "complexity": 1-10,
  "subTypes": ["sub1", "sub2"],
  "estimatedTokens": number,
  "reasoning": "kurze Begründung"
}

Anfrage: `;

const SYNTHESIZER_PROMPT = `Du bist der Synthese-Agent. Deine Aufgabe ist es, mehrere Antworten von verschiedenen KI-Modellen zu einer optimalen Gesamtantwort zu kombinieren.

Regeln:
1. Identifiziere die besten Aspekte jeder Antwort
2. Kombiniere sie zu einer kohärenten Antwort
3. Löse Widersprüche durch logische Analyse
4. Die Synthese sollte besser sein als jede Einzelantwort
5. Behalte den natürlichen Sprachfluss bei

Zu kombinierende Antworten:
`;

class ArenaOrchestrator {
  /**
   * Execute an arena request
   */
  async execute(params: {
    chatId: string;
    userId: string;
    teamId?: string;
    message: string;
    mode: ArenaMode;
    selectedModels?: ModelId[];
    systemPrompt?: string;
  }): Promise<ArenaResult> {
    const startTime = Date.now();
    const { chatId, userId, teamId, message, mode, selectedModels, systemPrompt } = params;

    logger.info(`Arena executing in ${mode} mode for chat ${chatId}`);

    // Load relevant memories
    const memories = await memoryService.getRelevantMemories(userId, teamId, message);
    const memoryContext = memories.length > 0
      ? `\n\nRelevante Erinnerungen:\n${memories.map(m => m.content).join('\n')}`
      : '';

    // Load relevant knowledge
    const knowledge = await knowledgeService.search(message, { limit: 5 });
    const knowledgeContext = knowledge.length > 0
      ? `\n\nRelevantes Wissen:\n${knowledge.map(k => k.content).join('\n')}`
      : '';

    // Load rules
    const rules = await this.loadRules(teamId);
    const rulesContext = rules.length > 0
      ? `\n\nGeltende Regeln:\n${rules.map(r => `- ${r.rule}`).join('\n')}`
      : '';

    // Build enhanced system prompt
    const enhancedSystemPrompt = `${systemPrompt || ORCHESTRATOR_PROMPT}${memoryContext}${knowledgeContext}${rulesContext}`;

    // Execute based on mode
    let result: ArenaResult;

    switch (mode) {
      case 'AUTO_SELECT':
        result = await this.executeAutoSelect(message, enhancedSystemPrompt);
        break;
      case 'COLLABORATIVE':
        result = await this.executeCollaborative(message, enhancedSystemPrompt, selectedModels);
        break;
      case 'DIVIDE_CONQUER':
        result = await this.executeDivideConquer(message, enhancedSystemPrompt, selectedModels);
        break;
      case 'PROJECT':
        result = await this.executeProject(message, enhancedSystemPrompt, selectedModels);
        break;
      case 'TESTER':
        result = await this.executeTester(message, enhancedSystemPrompt, selectedModels);
        break;
      default:
        result = await this.executeAutoSelect(message, enhancedSystemPrompt);
    }

    result.metadata.processingTime = Date.now() - startTime;

    // Save to memory
    await memoryService.saveConversationMemory({
      userId,
      teamId,
      content: `User: ${message}\nAssistant (${result.modelName}): ${result.content.substring(0, 500)}...`,
      sourceConversationId: chatId,
      sourceModelId: result.modelId,
    });

    // Extract and save knowledge
    await knowledgeService.extractAndSave({
      content: result.content,
      userId,
      teamId,
      sourceConversationId: chatId,
      sourceModelId: result.modelId,
    });

    return result;
  }

  /**
   * MODE 1: Auto-Select
   * Arena chooses the best model automatically
   */
  private async executeAutoSelect(message: string, systemPrompt: string): Promise<ArenaResult> {
    // Classify the task
    const classification = await this.classifyTask(message);
    logger.info(`Task classified as ${classification.type} with complexity ${classification.complexity}`);

    // Select best model
    const modelId = classification.suggestedModels[0] || this.selectBestModel(classification);
    const model = openRouterService.getModel(modelId);

    // Execute with selected model
    const response = await openRouterService.createCompletion({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    });

    const cost = openRouterService.calculateCost(modelId, response.promptTokens, response.completionTokens);

    return {
      content: response.content,
      modelId,
      modelName: model.name,
      mode: 'AUTO_SELECT',
      metadata: {
        totalTokens: response.totalTokens,
        processingTime: 0,
        cost,
        confidence: classification.confidence,
      },
    };
  }

  /**
   * MODE 2: Collaborative
   * Multiple models work together on the task
   */
  private async executeCollaborative(
    message: string,
    systemPrompt: string,
    selectedModels?: ModelId[]
  ): Promise<ArenaResult> {
    const models = selectedModels?.length
      ? selectedModels
      : ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o'] as ModelId[];

    // Get responses from all models in parallel
    const responses = await Promise.all(
      models.map(async (modelId) => {
        try {
          const response = await openRouterService.createCompletion({
            model: modelId,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
          });
          return { modelId, response, success: true };
        } catch (error) {
          logger.error(`Model ${modelId} failed:`, error);
          return { modelId, response: null, success: false };
        }
      })
    );

    const successfulResponses = responses.filter(r => r.success && r.response);

    if (successfulResponses.length === 0) {
      throw new Error('All models failed to respond');
    }

    if (successfulResponses.length === 1) {
      const { modelId, response } = successfulResponses[0];
      const model = openRouterService.getModel(modelId);
      return {
        content: response!.content,
        modelId,
        modelName: model.name,
        mode: 'COLLABORATIVE',
        metadata: {
          totalTokens: response!.totalTokens,
          processingTime: 0,
          cost: openRouterService.calculateCost(modelId, response!.promptTokens, response!.completionTokens),
        },
      };
    }

    // Synthesize responses
    const synthesisPrompt = SYNTHESIZER_PROMPT + successfulResponses
      .map((r, i) => `\n\n--- Antwort ${i + 1} (${openRouterService.getModel(r.modelId).name}) ---\n${r.response!.content}`)
      .join('');

    const synthesisResponse = await openRouterService.createCompletion({
      model: 'anthropic/claude-3-opus',
      messages: [
        { role: 'system', content: 'Du bist ein Experte für die Synthese von Informationen.' },
        { role: 'user', content: synthesisPrompt },
      ],
    });

    const totalTokens = successfulResponses.reduce((sum, r) => sum + (r.response?.totalTokens || 0), 0) + synthesisResponse.totalTokens;
    const totalCost = successfulResponses.reduce((sum, r) => {
      if (!r.response) return sum;
      return sum + openRouterService.calculateCost(r.modelId, r.response.promptTokens, r.response.completionTokens);
    }, 0) + openRouterService.calculateCost('anthropic/claude-3-opus', synthesisResponse.promptTokens, synthesisResponse.completionTokens);

    return {
      content: synthesisResponse.content,
      modelId: 'anthropic/claude-3-opus',
      modelName: 'Claude 3 Opus (Synthesizer)',
      mode: 'COLLABORATIVE',
      subResults: successfulResponses.map(r => ({
        taskId: r.modelId,
        taskType: 'response',
        modelId: r.modelId,
        content: r.response!.content,
        status: 'completed' as const,
        tokens: r.response!.totalTokens,
      })),
      metadata: {
        totalTokens,
        processingTime: 0,
        cost: totalCost,
      },
    };
  }

  /**
   * MODE 3: Divide & Conquer
   * Split task into subtasks and assign to specialized models
   */
  private async executeDivideConquer(
    message: string,
    systemPrompt: string,
    selectedModels?: ModelId[]
  ): Promise<ArenaResult> {
    // Decompose task
    const subtasks = await this.decomposeTask(message);
    logger.info(`Task decomposed into ${subtasks.length} subtasks`);

    // Execute subtasks in parallel
    const subResults = await Promise.all(
      subtasks.map(async (subtask) => {
        const modelId = this.selectModelForSubtask(subtask.type, selectedModels);
        
        try {
          const response = await openRouterService.createCompletion({
            model: modelId,
            messages: [
              { role: 'system', content: `${systemPrompt}\n\nDeine spezifische Aufgabe: ${subtask.description}` },
              { role: 'user', content: subtask.prompt },
            ],
          });

          return {
            taskId: subtask.id,
            taskType: subtask.type,
            modelId,
            content: response.content,
            status: 'completed' as const,
            tokens: response.totalTokens,
          };
        } catch (error) {
          logger.error(`Subtask ${subtask.id} failed:`, error);
          return {
            taskId: subtask.id,
            taskType: subtask.type,
            modelId,
            content: '',
            status: 'failed' as const,
            tokens: 0,
          };
        }
      })
    );

    // Aggregate results
    const successfulResults = subResults.filter(r => r.status === 'completed');
    const aggregationPrompt = `Kombiniere die folgenden Teilergebnisse zu einer vollständigen Antwort auf die ursprüngliche Anfrage: "${message}"

${successfulResults.map((r, i) => `\n--- Teilergebnis ${i + 1} (${r.taskType}) ---\n${r.content}`).join('\n')}

Erstelle eine kohärente Gesamtantwort:`;

    const aggregationResponse = await openRouterService.createCompletion({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: 'Du bist ein Experte für die Aggregation von Teilergebnissen.' },
        { role: 'user', content: aggregationPrompt },
      ],
    });

    const totalTokens = subResults.reduce((sum, r) => sum + r.tokens, 0) + aggregationResponse.totalTokens;

    return {
      content: aggregationResponse.content,
      modelId: 'anthropic/claude-3.5-sonnet',
      modelName: 'Claude 3.5 Sonnet (Aggregator)',
      mode: 'DIVIDE_CONQUER',
      subResults,
      metadata: {
        totalTokens,
        processingTime: 0,
        cost: 0, // TODO: Calculate properly
      },
    };
  }

  /**
   * MODE 4: Project Mode
   * Collaborative planning, specialized execution, and review
   */
  private async executeProject(
    message: string,
    systemPrompt: string,
    selectedModels?: ModelId[]
  ): Promise<ArenaResult> {
    // Phase 1: Collaborative Planning
    const planningModels = selectedModels?.slice(0, 3) || ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o'] as ModelId[];
    
    const planningPrompt = `Erstelle einen detaillierten Projektplan für die folgende Anfrage. 
Identifiziere alle notwendigen Aufgaben, deren Reihenfolge und Abhängigkeiten.

Anfrage: ${message}

Antworte im JSON-Format:
{
  "projectName": "Name",
  "description": "Beschreibung",
  "tasks": [
    {
      "id": "task1",
      "title": "Titel",
      "description": "Beschreibung",
      "type": "code|writing|research|analysis|creative",
      "dependencies": ["task0"],
      "estimatedEffort": "low|medium|high"
    }
  ]
}`;

    const planningResponses = await Promise.all(
      planningModels.map(modelId => 
        openRouterService.createCompletion({
          model: modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: planningPrompt },
          ],
        })
      )
    );

    // Merge plans
    const mergedPlan = await this.mergePlans(planningResponses.map(r => r.content));

    // Phase 2: Execute Tasks
    const taskResults = await this.executeProjectTasks(mergedPlan.tasks, systemPrompt, selectedModels);

    // Phase 3: Review
    const reviewPrompt = `Überprüfe die folgenden Projektergebnisse auf Vollständigkeit, Qualität und Konsistenz.

Projektplan: ${JSON.stringify(mergedPlan, null, 2)}

Ergebnisse:
${taskResults.map(r => `\n--- ${r.taskType} ---\n${r.content}`).join('\n')}

Erstelle einen zusammenfassenden Bericht und eine finale, zusammengeführte Lösung:`;

    const reviewResponse = await openRouterService.createCompletion({
      model: 'anthropic/claude-3-opus',
      messages: [
        { role: 'system', content: 'Du bist ein erfahrener Projekt-Reviewer.' },
        { role: 'user', content: reviewPrompt },
      ],
    });

    const totalTokens = planningResponses.reduce((sum, r) => sum + r.totalTokens, 0) 
      + taskResults.reduce((sum, r) => sum + r.tokens, 0) 
      + reviewResponse.totalTokens;

    return {
      content: reviewResponse.content,
      modelId: 'anthropic/claude-3-opus',
      modelName: 'Claude 3 Opus (Reviewer)',
      mode: 'PROJECT',
      subResults: taskResults,
      metadata: {
        totalTokens,
        processingTime: 0,
        cost: 0,
      },
    };
  }

  /**
   * MODE 5: Tester Mode
   * Automated testing and cross-verification
   */
  private async executeTester(
    message: string,
    systemPrompt: string,
    selectedModels?: ModelId[]
  ): Promise<ArenaResult> {
    const testers = selectedModels?.slice(0, 3) || 
      ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-1.5-pro'] as ModelId[];

    // Phase 1: Generate Tests
    const testGenPrompt = `Analysiere den folgenden Code/Content und erstelle umfassende Testfälle.

Content: ${message}

Erstelle Tests im JSON-Format:
{
  "tests": [
    {
      "id": "test1",
      "name": "Test Name",
      "description": "Was wird getestet",
      "type": "unit|integration|edge_case|security",
      "input": "Testeingabe",
      "expectedOutput": "Erwartetes Ergebnis"
    }
  ]
}`;

    const testSets = await Promise.all(
      testers.slice(0, 2).map(async (modelId) => {
        const response = await openRouterService.createCompletion({
          model: modelId,
          messages: [
            { role: 'system', content: 'Du bist ein erfahrener QA-Ingenieur.' },
            { role: 'user', content: testGenPrompt },
          ],
        });
        return { modelId, tests: this.parseTests(response.content) };
      })
    );

    // Phase 2: Execute Tests (isolated)
    const executionResults = await Promise.all(
      testSets.map(async ({ modelId, tests }) => {
        const execPrompt = `Führe die folgenden Tests durch und dokumentiere die Ergebnisse:

Tests: ${JSON.stringify(tests, null, 2)}

Content zum Testen: ${message}

Antworte mit den Testergebnissen im JSON-Format:
{
  "results": [
    {
      "testId": "test1",
      "passed": true/false,
      "actualOutput": "Tatsächliches Ergebnis",
      "notes": "Anmerkungen"
    }
  ]
}`;

        const response = await openRouterService.createCompletion({
          model: modelId,
          messages: [
            { role: 'system', content: 'Du bist ein Test-Executor.' },
            { role: 'user', content: execPrompt },
          ],
        });

        return { modelId, results: response.content, tokens: response.totalTokens };
      })
    );

    // Phase 3: Cross-Verification
    const verificationPrompt = `Verifiziere die Testergebnisse der anderen Tester und identifiziere Diskrepanzen.

Testergebnisse Tester 1: ${executionResults[0]?.results}
Testergebnisse Tester 2: ${executionResults[1]?.results}

Erstelle einen konsolidierten Testbericht mit:
1. Übereinstimmende Ergebnisse
2. Diskrepanzen und deren Analyse
3. Gesamtbewertung
4. Empfehlungen`;

    const verifier = testers[2] || testers[0];
    const verificationResponse = await openRouterService.createCompletion({
      model: verifier,
      messages: [
        { role: 'system', content: 'Du bist ein unabhängiger Test-Verifizierer.' },
        { role: 'user', content: verificationPrompt },
      ],
    });

    const totalTokens = executionResults.reduce((sum, r) => sum + r.tokens, 0) + verificationResponse.totalTokens;

    return {
      content: verificationResponse.content,
      modelId: verifier,
      modelName: openRouterService.getModel(verifier).name + ' (Verifier)',
      mode: 'TESTER',
      subResults: executionResults.map(r => ({
        taskId: r.modelId,
        taskType: 'testing',
        modelId: r.modelId,
        content: r.results,
        status: 'completed' as const,
        tokens: r.tokens,
      })),
      metadata: {
        totalTokens,
        processingTime: 0,
        cost: 0,
      },
    };
  }

  /**
   * Helper: Classify a task
   */
  private async classifyTask(message: string): Promise<TaskClassification> {
    const response = await openRouterService.createCompletion({
      model: 'anthropic/claude-3.5-haiku',
      messages: [
        { role: 'user', content: TASK_CLASSIFIER_PROMPT + message },
      ],
      maxTokens: 500,
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        type: parsed.type || 'general',
        complexity: parsed.complexity || 5,
        subTypes: parsed.subTypes || [],
        estimatedTokens: parsed.estimatedTokens || 2000,
        suggestedModels: this.getSuggestedModels(parsed.type, parsed.complexity),
        confidence: 0.8,
      };
    } catch {
      return {
        type: 'general',
        complexity: 5,
        subTypes: [],
        estimatedTokens: 2000,
        suggestedModels: ['anthropic/claude-3.5-sonnet'],
        confidence: 0.5,
      };
    }
  }

  /**
   * Helper: Get suggested models for a task type
   */
  private getSuggestedModels(type: string, complexity: number): ModelId[] {
    const modelsByType: Record<string, ModelId[]> = {
      code: ['deepseek/deepseek-coder', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o'],
      writing: ['anthropic/claude-3-opus', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet'],
      research: ['perplexity/sonar-pro', 'google/gemini-1.5-pro', 'anthropic/claude-3.5-sonnet'],
      analysis: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-1.5-pro'],
      creative: ['anthropic/claude-3-opus', 'openai/gpt-4o', 'meta-llama/llama-3.1-405b'],
      general: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o'],
    };

    return modelsByType[type] || modelsByType.general;
  }

  /**
   * Helper: Select best model based on classification
   */
  private selectBestModel(classification: TaskClassification): ModelId {
    return classification.suggestedModels[0] || 'anthropic/claude-3.5-sonnet';
  }

  /**
   * Helper: Decompose task into subtasks
   */
  private async decomposeTask(message: string): Promise<Array<{
    id: string;
    type: string;
    description: string;
    prompt: string;
  }>> {
    const response = await openRouterService.createCompletion({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'system',
          content: 'Zerlege die Aufgabe in Teilaufgaben. Antworte nur mit JSON.',
        },
        {
          role: 'user',
          content: `Zerlege diese Aufgabe in 2-5 Teilaufgaben:

${message}

Format:
{
  "subtasks": [
    {
      "id": "task1",
      "type": "code|writing|research|analysis|creative",
      "description": "Was diese Teilaufgabe erreichen soll",
      "prompt": "Der spezifische Prompt für diese Teilaufgabe"
    }
  ]
}`,
        },
      ],
      maxTokens: 2000,
    });

    try {
      const parsed = JSON.parse(response.content);
      return parsed.subtasks || [
        { id: 'task1', type: 'general', description: 'Hauptaufgabe', prompt: message },
      ];
    } catch {
      return [
        { id: 'task1', type: 'general', description: 'Hauptaufgabe', prompt: message },
      ];
    }
  }

  /**
   * Helper: Select model for subtask type
   */
  private selectModelForSubtask(type: string, availableModels?: ModelId[]): ModelId {
    const preferredByType: Record<string, ModelId> = {
      code: 'deepseek/deepseek-coder',
      writing: 'anthropic/claude-3-opus',
      research: 'perplexity/sonar-pro',
      analysis: 'anthropic/claude-3.5-sonnet',
      creative: 'anthropic/claude-3-opus',
    };

    const preferred = preferredByType[type] || 'anthropic/claude-3.5-sonnet';

    if (availableModels?.length) {
      return availableModels.includes(preferred) ? preferred : availableModels[0];
    }

    return preferred;
  }

  /**
   * Helper: Load rules for a team
   */
  private async loadRules(teamId?: string) {
    return prisma.rule.findMany({
      where: {
        isActive: true,
        OR: [
          { isGlobal: true },
          { teamId: teamId || undefined },
        ],
      },
      orderBy: { priority: 'desc' },
    });
  }

  /**
   * Helper: Merge multiple project plans
   */
  private async mergePlans(plans: string[]): Promise<{
    projectName: string;
    description: string;
    tasks: Array<{
      id: string;
      title: string;
      description: string;
      type: string;
      dependencies: string[];
      estimatedEffort: string;
    }>;
  }> {
    const mergePrompt = `Kombiniere diese Projektpläne zu einem optimalen Plan:

${plans.map((p, i) => `Plan ${i + 1}: ${p}`).join('\n\n')}

Antworte nur mit dem kombinierten JSON:`;

    const response = await openRouterService.createCompletion({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'user', content: mergePrompt },
      ],
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        projectName: 'Projekt',
        description: 'Automatisch generierter Plan',
        tasks: [
          {
            id: 'task1',
            title: 'Hauptaufgabe',
            description: 'Die gesamte Aufgabe bearbeiten',
            type: 'general',
            dependencies: [],
            estimatedEffort: 'medium',
          },
        ],
      };
    }
  }

  /**
   * Helper: Execute project tasks
   */
  private async executeProjectTasks(
    tasks: Array<{ id: string; title: string; description: string; type: string }>,
    systemPrompt: string,
    selectedModels?: ModelId[]
  ): Promise<SubResult[]> {
    return Promise.all(
      tasks.map(async (task) => {
        const modelId = this.selectModelForSubtask(task.type, selectedModels);
        
        const response = await openRouterService.createCompletion({
          model: modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Aufgabe: ${task.title}\n\n${task.description}` },
          ],
        });

        return {
          taskId: task.id,
          taskType: task.type,
          modelId,
          content: response.content,
          status: 'completed' as const,
          tokens: response.totalTokens,
        };
      })
    );
  }

  /**
   * Helper: Parse test JSON
   */
  private parseTests(content: string): any[] {
    try {
      const parsed = JSON.parse(content);
      return parsed.tests || [];
    } catch {
      return [];
    }
  }
}

export const arenaOrchestrator = new ArenaOrchestrator();

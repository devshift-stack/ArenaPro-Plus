// AI Arena - Prompt Library Service
// Self-improving prompt library with suggestions

import { prisma } from '../utils/prisma.js';
import { redis } from '../utils/redis.js';
import { openRouterService } from './openrouter.js';
import { embeddingService } from './embeddings.js';
import { logger } from '../utils/logger.js';
import { Prisma } from '@prisma/client';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  category: string[];
  variables: PromptVariable[];
  usageCount: number;
  successRate: number;
  avgRating: number;
  isSystem: boolean;
}

interface PromptVariable {
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean';
  required: boolean;
  default?: any;
  options?: string[];
  description?: string;
}

interface PromptSuggestion {
  prompt: PromptTemplate;
  relevance: number;
  filledTemplate?: string;
}

class PromptLibraryService {
  private readonly CACHE_TTL = 3600;

  /**
   * Get prompt suggestions based on user input
   */
  async getSuggestions(
    userInput: string,
    options: {
      limit?: number;
      category?: string[];
      userId?: string;
    } = {}
  ): Promise<PromptSuggestion[]> {
    const { limit = 5, category, userId } = options;

    // Generate embedding for user input
    const inputEmbedding = await embeddingService.createEmbedding(userInput);

    // Build category filter
    const categoryFilter = category?.length
      ? `AND category && ARRAY[${category.map(c => `'${c}'`).join(',')}]`
      : '';

    // Search prompts by semantic similarity
    const prompts = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      description: string;
      template: string;
      category: string[];
      variables: any;
      usage_count: number;
      success_rate: number;
      avg_rating: number;
      is_system: boolean;
      similarity: number;
    }>>`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.template,
        p.category,
        p.variables,
        p."usageCount" as usage_count,
        p."successRate" as success_rate,
        p."avgRating" as avg_rating,
        p."isSystem" as is_system,
        1 - (p.embedding <=> ${inputEmbedding}::vector) as similarity
      FROM prompts p
      WHERE p.embedding IS NOT NULL
      ${Prisma.raw(categoryFilter)}
      ORDER BY 
        similarity DESC,
        p."successRate" DESC,
        p."usageCount" DESC
      LIMIT ${limit}
    `;

    // Fill templates with extracted variables
    const suggestions: PromptSuggestion[] = await Promise.all(
      prompts.map(async (p) => {
        const variables = typeof p.variables === 'string' ? JSON.parse(p.variables) : p.variables;
        
        // Try to auto-fill template based on user input
        const filledTemplate = await this.autoFillTemplate(p.template, variables, userInput);

        return {
          prompt: {
            id: p.id,
            name: p.name,
            description: p.description || '',
            template: p.template,
            category: p.category,
            variables,
            usageCount: p.usage_count,
            successRate: p.success_rate,
            avgRating: p.avg_rating,
            isSystem: p.is_system,
          },
          relevance: p.similarity,
          filledTemplate,
        };
      })
    );

    return suggestions;
  }

  /**
   * Auto-fill template variables from user input
   */
  private async autoFillTemplate(
    template: string,
    variables: PromptVariable[],
    userInput: string
  ): Promise<string | undefined> {
    if (variables.length === 0) {
      return template;
    }

    // Use LLM to extract variable values
    const extractionPrompt = `Extrahiere Werte für die folgenden Variablen aus der Benutzereingabe.

Benutzereingabe: "${userInput}"

Variablen:
${variables.map(v => `- ${v.name} (${v.type}${v.required ? ', erforderlich' : ', optional'}): ${v.description || ''}`).join('\n')}

Antworte NUR mit JSON:
{
${variables.map(v => `  "${v.name}": "extrahierter Wert oder null"`).join(',\n')}
}`;

    try {
      const response = await openRouterService.createCompletion({
        model: 'anthropic/claude-3.5-haiku',
        messages: [{ role: 'user', content: extractionPrompt }],
        maxTokens: 500,
      });

      const extracted = JSON.parse(response.content);
      
      // Fill template
      let filled = template;
      for (const variable of variables) {
        const value = extracted[variable.name];
        if (value && value !== 'null') {
          filled = filled.replace(new RegExp(`{{${variable.name}}}`, 'g'), value);
          filled = filled.replace(new RegExp(`{${variable.name}}`, 'g'), value);
        }
      }

      return filled;
    } catch {
      return undefined;
    }
  }

  /**
   * Create a new prompt
   */
  async create(params: {
    name: string;
    description?: string;
    template: string;
    category: string[];
    variables?: PromptVariable[];
    userId?: string;
    isSystem?: boolean;
  }): Promise<PromptTemplate> {
    const { name, description, template, category, variables = [], userId, isSystem = false } = params;

    // Generate embedding
    const embeddingText = `${name} ${description || ''} ${template}`;
    const embedding = await embeddingService.createEmbedding(embeddingText);

    const prompt = await prisma.prompt.create({
      data: {
        name,
        description,
        template,
        category,
        variables: variables as any,
        userId,
        isSystem,
      },
    });

    // Store embedding
    await prisma.$executeRaw`
      UPDATE prompts 
      SET embedding = ${embedding}::vector 
      WHERE id = ${prompt.id}
    `;

    return {
      id: prompt.id,
      name: prompt.name,
      description: prompt.description || '',
      template: prompt.template,
      category: prompt.category,
      variables: variables,
      usageCount: 0,
      successRate: 0,
      avgRating: 0,
      isSystem: prompt.isSystem,
    };
  }

  /**
   * Get a prompt by ID
   */
  async getById(id: string): Promise<PromptTemplate | null> {
    const prompt = await prisma.prompt.findUnique({
      where: { id },
    });

    if (!prompt) return null;

    const variables = typeof prompt.variables === 'string' 
      ? JSON.parse(prompt.variables) 
      : prompt.variables;

    return {
      id: prompt.id,
      name: prompt.name,
      description: prompt.description || '',
      template: prompt.template,
      category: prompt.category,
      variables: variables as PromptVariable[],
      usageCount: prompt.usageCount,
      successRate: prompt.successRate,
      avgRating: prompt.avgRating,
      isSystem: prompt.isSystem,
    };
  }

  /**
   * List prompts
   */
  async list(options: {
    category?: string[];
    userId?: string;
    includeSystem?: boolean;
    sortBy?: 'usage' | 'rating' | 'success' | 'recent';
    limit?: number;
    offset?: number;
  } = {}): Promise<{ prompts: PromptTemplate[]; total: number }> {
    const { 
      category, 
      userId, 
      includeSystem = true, 
      sortBy = 'usage',
      limit = 20,
      offset = 0,
    } = options;

    const where: Prisma.PromptWhereInput = {};

    if (category?.length) {
      where.category = { hasSome: category };
    }

    if (userId) {
      where.OR = [
        { userId },
        ...(includeSystem ? [{ isSystem: true }] : []),
      ];
    } else if (!includeSystem) {
      where.isSystem = false;
    }

    const orderBy: Prisma.PromptOrderByWithRelationInput = 
      sortBy === 'usage' ? { usageCount: 'desc' } :
      sortBy === 'rating' ? { avgRating: 'desc' } :
      sortBy === 'success' ? { successRate: 'desc' } :
      { createdAt: 'desc' };

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.prompt.count({ where }),
    ]);

    return {
      prompts: prompts.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        template: p.template,
        category: p.category,
        variables: (typeof p.variables === 'string' ? JSON.parse(p.variables) : p.variables) as PromptVariable[],
        usageCount: p.usageCount,
        successRate: p.successRate,
        avgRating: p.avgRating,
        isSystem: p.isSystem,
      })),
      total,
    };
  }

  /**
   * Update a prompt
   */
  async update(
    id: string,
    userId: string,
    updates: Partial<{
      name: string;
      description: string;
      template: string;
      category: string[];
      variables: PromptVariable[];
    }>
  ): Promise<PromptTemplate> {
    const prompt = await prisma.prompt.findFirst({
      where: { id, userId },
    });

    if (!prompt) {
      throw new Error('Prompt not found or unauthorized');
    }

    const updated = await prisma.prompt.update({
      where: { id },
      data: {
        ...updates,
        variables: updates.variables as any,
        version: { increment: 1 },
      },
    });

    // Update embedding if template changed
    if (updates.template || updates.name || updates.description) {
      const embeddingText = `${updated.name} ${updated.description || ''} ${updated.template}`;
      const embedding = await embeddingService.createEmbedding(embeddingText);
      
      await prisma.$executeRaw`
        UPDATE prompts 
        SET embedding = ${embedding}::vector 
        WHERE id = ${id}
      `;
    }

    const variables = typeof updated.variables === 'string' 
      ? JSON.parse(updated.variables) 
      : updated.variables;

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description || '',
      template: updated.template,
      category: updated.category,
      variables: variables as PromptVariable[],
      usageCount: updated.usageCount,
      successRate: updated.successRate,
      avgRating: updated.avgRating,
      isSystem: updated.isSystem,
    };
  }

  /**
   * Record prompt usage and outcome
   */
  async recordUsage(
    promptId: string,
    success: boolean,
    rating?: number
  ): Promise<void> {
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
    });

    if (!prompt) return;

    // Calculate new success rate (exponential moving average)
    const alpha = 0.1; // Smoothing factor
    const newSuccessRate = prompt.usageCount === 0
      ? (success ? 1 : 0)
      : alpha * (success ? 1 : 0) + (1 - alpha) * prompt.successRate;

    // Calculate new average rating
    let newAvgRating = prompt.avgRating;
    if (rating !== undefined) {
      newAvgRating = prompt.usageCount === 0
        ? rating
        : (prompt.avgRating * prompt.usageCount + rating) / (prompt.usageCount + 1);
    }

    await prisma.prompt.update({
      where: { id: promptId },
      data: {
        usageCount: { increment: 1 },
        successRate: newSuccessRate,
        avgRating: newAvgRating,
      },
    });

    logger.debug(`Prompt ${promptId} usage recorded: success=${success}, rating=${rating}`);
  }

  /**
   * Delete a prompt
   */
  async delete(id: string, userId: string): Promise<void> {
    const prompt = await prisma.prompt.findFirst({
      where: { id, userId, isSystem: false },
    });

    if (!prompt) {
      throw new Error('Prompt not found or unauthorized');
    }

    await prisma.prompt.delete({ where: { id } });
  }

  /**
   * Generate prompt improvement suggestions
   */
  async getImprovementSuggestions(promptId: string): Promise<string[]> {
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      include: { variants: true },
    });

    if (!prompt) {
      throw new Error('Prompt not found');
    }

    // Use LLM to suggest improvements
    const analysisPrompt = `Analysiere diesen Prompt und schlage Verbesserungen vor:

Name: ${prompt.name}
Template: ${prompt.template}
Aktuelle Erfolgsrate: ${(prompt.successRate * 100).toFixed(1)}%
Durchschnittliche Bewertung: ${prompt.avgRating.toFixed(1)}/5

Gib 3-5 konkrete Verbesserungsvorschläge als JSON-Array:
["Vorschlag 1", "Vorschlag 2", ...]`;

    const response = await openRouterService.createCompletion({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: analysisPrompt }],
      maxTokens: 1000,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return ['Konnte keine Vorschläge generieren'];
    }
  }

  /**
   * Create a variant for A/B testing
   */
  async createVariant(promptId: string, template: string): Promise<string> {
    const variant = await prisma.promptVariant.create({
      data: {
        promptId,
        template,
      },
    });

    return variant.id;
  }

  /**
   * Get system prompts (pre-defined library)
   */
  async getSystemPrompts(category?: string[]): Promise<PromptTemplate[]> {
    const where: Prisma.PromptWhereInput = {
      isSystem: true,
    };

    if (category?.length) {
      where.category = { hasSome: category };
    }

    const prompts = await prisma.prompt.findMany({
      where,
      orderBy: { usageCount: 'desc' },
    });

    return prompts.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      template: p.template,
      category: p.category,
      variables: (typeof p.variables === 'string' ? JSON.parse(p.variables) : p.variables) as PromptVariable[],
      usageCount: p.usageCount,
      successRate: p.successRate,
      avgRating: p.avgRating,
      isSystem: true,
    }));
  }

  /**
   * Seed system prompts
   */
  async seedSystemPrompts(): Promise<void> {
    const systemPrompts = [
      {
        name: 'Code Review',
        description: 'Führe ein Code Review durch',
        template: `Führe ein gründliches Code Review für den folgenden Code durch:

\`\`\`{{language}}
{{code}}
\`\`\`

Prüfe auf:
1. Bugs und potenzielle Fehler
2. Performance-Probleme
3. Sicherheitslücken
4. Code-Stil und Best Practices
5. Lesbarkeit und Wartbarkeit

Gib konkrete Verbesserungsvorschläge mit Codebeispielen.`,
        category: ['code', 'review'],
        variables: [
          { name: 'language', type: 'select', required: true, options: ['javascript', 'typescript', 'python', 'java', 'go', 'rust'] },
          { name: 'code', type: 'text', required: true, description: 'Der zu überprüfende Code' },
        ],
      },
      {
        name: 'Blog Post',
        description: 'Erstelle einen Blog-Artikel',
        template: `Schreibe einen {{tone}} Blog-Artikel über {{topic}}.

Zielgruppe: {{audience}}
Länge: ca. {{wordCount}} Wörter

Der Artikel sollte:
- Eine fesselnde Einleitung haben
- Klare Abschnitte mit Zwischenüberschriften
- Praktische Beispiele oder Tipps enthalten
- Mit einem Call-to-Action enden`,
        category: ['writing', 'blog', 'creative'],
        variables: [
          { name: 'topic', type: 'text', required: true, description: 'Das Thema des Artikels' },
          { name: 'tone', type: 'select', required: true, options: ['professionellen', 'lockeren', 'informativen', 'unterhaltsamen'] },
          { name: 'audience', type: 'text', required: true, description: 'Die Zielgruppe' },
          { name: 'wordCount', type: 'number', required: false, default: 800 },
        ],
      },
      {
        name: 'Datenanalyse',
        description: 'Analysiere Daten und erstelle Insights',
        template: `Analysiere die folgenden Daten:

{{data}}

Fokus: {{focus}}

Erstelle:
1. Eine Zusammenfassung der wichtigsten Erkenntnisse
2. Statistische Highlights (falls anwendbar)
3. Trends und Muster
4. Handlungsempfehlungen
5. Mögliche Visualisierungsvorschläge`,
        category: ['analysis', 'data'],
        variables: [
          { name: 'data', type: 'text', required: true, description: 'Die zu analysierenden Daten' },
          { name: 'focus', type: 'text', required: false, description: 'Spezifischer Fokusbereich' },
        ],
      },
      {
        name: 'E-Mail Antwort',
        description: 'Verfasse eine professionelle E-Mail-Antwort',
        template: `Verfasse eine {{tone}} E-Mail-Antwort auf:

"{{originalEmail}}"

Hauptpunkte der Antwort:
{{keyPoints}}

Ton: {{tone}}
Max. Länge: {{maxLength}} Sätze`,
        category: ['writing', 'email', 'business'],
        variables: [
          { name: 'originalEmail', type: 'text', required: true },
          { name: 'keyPoints', type: 'text', required: true },
          { name: 'tone', type: 'select', required: true, options: ['höfliche', 'formelle', 'freundliche', 'direkte'] },
          { name: 'maxLength', type: 'number', required: false, default: 5 },
        ],
      },
      {
        name: 'Brainstorming',
        description: 'Generiere kreative Ideen',
        template: `Führe ein kreatives Brainstorming durch für:

Thema: {{topic}}
Kontext: {{context}}
Anzahl Ideen: {{count}}

Generiere {{count}} diverse, kreative Ideen. Für jede Idee:
1. Kurzer Titel
2. Beschreibung (2-3 Sätze)
3. Umsetzbarkeit (leicht/mittel/schwer)
4. Potenzial (1-5 Sterne)`,
        category: ['creative', 'brainstorming'],
        variables: [
          { name: 'topic', type: 'text', required: true },
          { name: 'context', type: 'text', required: false },
          { name: 'count', type: 'number', required: false, default: 10 },
        ],
      },
    ];

    for (const prompt of systemPrompts) {
      const exists = await prisma.prompt.findFirst({
        where: { name: prompt.name, isSystem: true },
      });

      if (!exists) {
        await this.create({
          ...prompt,
          variables: prompt.variables as PromptVariable[],
          isSystem: true,
        });
        logger.info(`Seeded system prompt: ${prompt.name}`);
      }
    }
  }
}

export const promptLibraryService = new PromptLibraryService();

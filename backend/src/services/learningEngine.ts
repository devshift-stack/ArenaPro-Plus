// ════════════════════════════════════════════════════════════════════════════
// LEARNING ENGINE SERVICE
// Selbstlernendes System das aus allen Modellen und Usern lernt
// ════════════════════════════════════════════════════════════════════════════

import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { getRedis, cacheGet, cacheSet } from '../utils/redis.js';

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface ErrorPattern {
  id: string;
  pattern: string;
  category: string;
  occurrences: number;
  examples: string[];
  modelIds: string[];
  userIds: string[];
  firstSeen: Date;
  lastSeen: Date;
}

interface RuleProposal {
  title: string;
  description: string;
  instruction: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  examples: { input: string; wrongOutput: string; correctOutput: string }[];
  affectedModels: string[];
  triggerPatternId: string;
}

// ════════════════════════════════════════════════════════════════════════════
// ERROR CATEGORIES
// ════════════════════════════════════════════════════════════════════════════

const ERROR_CATEGORIES = {
  FACTUAL: 'Faktenfehler',
  FORMATTING: 'Formatierungsfehler',
  LANGUAGE: 'Sprachfehler',
  LOGIC: 'Logikfehler',
  CONTEXT: 'Kontextfehler',
  SAFETY: 'Sicherheitsfehler',
  INSTRUCTION: 'Anweisungsfehler',
  TONE: 'Tonfehler',
  CODE: 'Codefehler',
  MATH: 'Rechenfehler',
};

// ════════════════════════════════════════════════════════════════════════════
// LEARNING ENGINE CLASS
// ════════════════════════════════════════════════════════════════════════════

export class LearningEngine {
  private static instance: LearningEngine;
  private isProcessing: boolean = false;

  private constructor() {}

  static getInstance(): LearningEngine {
    if (!LearningEngine.instance) {
      LearningEngine.instance = new LearningEngine();
    }
    return LearningEngine.instance;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RECORD ERROR FROM ANY SOURCE
  // ══════════════════════════════════════════════════════════════════════════

  async recordError(params: {
    userId: string;
    chatId?: string;
    modelId: string;
    messageId?: string;
    errorType: 'CORRECTION' | 'FEEDBACK' | 'REGENERATION' | 'REPORT';
    originalContent: string;
    correctedContent?: string;
    userFeedback?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      // 1. Speichere das Event
      const event = await prisma.learningEvent.create({
        data: {
          type: params.errorType === 'CORRECTION' ? 'CORRECTION' : 'FEEDBACK',
          modelId: params.modelId,
          chatId: params.chatId,
          content: JSON.stringify({
            original: params.originalContent,
            corrected: params.correctedContent,
            feedback: params.userFeedback,
          }),
          metadata: params.metadata || {},
          userId: params.userId,
        },
      });

      logger.info(`Learning event recorded: ${event.id}`);

      // 2. Analysiere das Pattern
      await this.analyzePattern(event.id, params);

      // 3. Prüfe ob Regel vorgeschlagen werden soll
      await this.checkForRuleProposal(params.modelId);

    } catch (error) {
      logger.error('Error recording learning event:', error);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ANALYZE ERROR PATTERN
  // ══════════════════════════════════════════════════════════════════════════

  private async analyzePattern(
    eventId: string,
    params: {
      modelId: string;
      userId: string;
      originalContent: string;
      correctedContent?: string;
      userFeedback?: string;
    }
  ): Promise<void> {
    try {
      // Extrahiere Schlüsselwörter und Muster
      const patternKey = this.extractPatternKey(
        params.originalContent,
        params.correctedContent
      );

      // Suche nach existierendem Pattern
      let pattern = await prisma.errorPattern.findFirst({
        where: {
          patternKey,
        },
      });

      if (pattern) {
        // Update existierendes Pattern
        await prisma.errorPattern.update({
          where: { id: pattern.id },
          data: {
            occurrences: { increment: 1 },
            lastSeen: new Date(),
            modelIds: {
              push: params.modelId,
            },
            userIds: {
              push: params.userId,
            },
            examples: {
              push: JSON.stringify({
                original: params.originalContent.substring(0, 500),
                corrected: params.correctedContent?.substring(0, 500),
              }),
            },
          },
        });
      } else {
        // Erstelle neues Pattern
        const category = await this.categorizeError(
          params.originalContent,
          params.correctedContent,
          params.userFeedback
        );

        await prisma.errorPattern.create({
          data: {
            patternKey,
            category,
            occurrences: 1,
            modelIds: [params.modelId],
            userIds: [params.userId],
            examples: [
              JSON.stringify({
                original: params.originalContent.substring(0, 500),
                corrected: params.correctedContent?.substring(0, 500),
              }),
            ],
            firstSeen: new Date(),
            lastSeen: new Date(),
          },
        });
      }
    } catch (error) {
      logger.error('Error analyzing pattern:', error);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXTRACT PATTERN KEY
  // ══════════════════════════════════════════════════════════════════════════

  private extractPatternKey(original: string, corrected?: string): string {
    // Erstelle einen Hash aus den Kernunterschieden
    const words1 = original.toLowerCase().split(/\s+/).slice(0, 20);
    const words2 = corrected?.toLowerCase().split(/\s+/).slice(0, 20) || [];

    // Finde Unterschiede
    const differences = words1.filter(w => !words2.includes(w));
    
    // Erstelle Pattern Key
    return differences.slice(0, 5).join('_') || 'general_error';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORIZE ERROR
  // ══════════════════════════════════════════════════════════════════════════

  private async categorizeError(
    original: string,
    corrected?: string,
    feedback?: string
  ): Promise<string> {
    const text = `${original} ${corrected || ''} ${feedback || ''}`.toLowerCase();

    // Einfache Keyword-basierte Kategorisierung
    if (text.includes('falsch') || text.includes('incorrect') || text.includes('wrong')) {
      return 'FACTUAL';
    }
    if (text.includes('format') || text.includes('struktur') || text.includes('layout')) {
      return 'FORMATTING';
    }
    if (text.includes('code') || text.includes('syntax') || text.includes('bug')) {
      return 'CODE';
    }
    if (text.includes('rechnung') || text.includes('berechnung') || text.includes('math')) {
      return 'MATH';
    }
    if (text.includes('ton') || text.includes('höflich') || text.includes('style')) {
      return 'TONE';
    }
    if (text.includes('kontext') || text.includes('context') || text.includes('verstanden')) {
      return 'CONTEXT';
    }
    if (text.includes('logik') || text.includes('sinn') || text.includes('logic')) {
      return 'LOGIC';
    }
    if (text.includes('sprache') || text.includes('grammatik') || text.includes('rechtschreib')) {
      return 'LANGUAGE';
    }

    return 'INSTRUCTION';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CHECK FOR RULE PROPOSAL
  // ══════════════════════════════════════════════════════════════════════════

  private async checkForRuleProposal(modelId: string): Promise<void> {
    try {
      // Finde Patterns mit >= 3 Vorkommen die noch keine Regel haben
      const patterns = await prisma.errorPattern.findMany({
        where: {
          occurrences: { gte: 3 },
          hasProposedRule: false,
        },
        orderBy: { occurrences: 'desc' },
        take: 5,
      });

      for (const pattern of patterns) {
        await this.proposeRule(pattern);
      }
    } catch (error) {
      logger.error('Error checking for rule proposal:', error);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PROPOSE RULE
  // ══════════════════════════════════════════════════════════════════════════

  private async proposeRule(pattern: any): Promise<void> {
    try {
      const examples = pattern.examples.map((e: string) => {
        try {
          return JSON.parse(e);
        } catch {
          return { original: e, corrected: '' };
        }
      });

      // Generiere Regel-Vorschlag
      const ruleProposal = this.generateRuleFromPattern(pattern, examples);

      // Speichere Vorschlag
      await prisma.proposedRule.create({
        data: {
          title: ruleProposal.title,
          description: ruleProposal.description,
          instruction: ruleProposal.instruction,
          category: pattern.category,
          severity: ruleProposal.severity,
          confidence: Math.min(pattern.occurrences / 10, 1),
          examples: examples.slice(0, 5),
          affectedModels: pattern.modelIds,
          triggerPatternId: pattern.id,
          status: 'PENDING',
        },
      });

      // Markiere Pattern als verarbeitet
      await prisma.errorPattern.update({
        where: { id: pattern.id },
        data: { hasProposedRule: true },
      });

      logger.info(`Rule proposed for pattern: ${pattern.id}`);
    } catch (error) {
      logger.error('Error proposing rule:', error);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GENERATE RULE FROM PATTERN
  // ══════════════════════════════════════════════════════════════════════════

  private generateRuleFromPattern(
    pattern: any,
    examples: any[]
  ): RuleProposal {
    const categoryName = ERROR_CATEGORIES[pattern.category as keyof typeof ERROR_CATEGORIES] || 'Allgemeiner Fehler';

    // Generiere Regel basierend auf Kategorie
    const ruleTemplates: Record<string, Partial<RuleProposal>> = {
      FACTUAL: {
        title: `Faktenfehler vermeiden: ${pattern.patternKey}`,
        description: `Es wurden ${pattern.occurrences} Fälle gefunden, in denen falsche Fakten genannt wurden.`,
        instruction: 'Überprüfe alle faktischen Aussagen sorgfältig. Bei Unsicherheit, gib dies an.',
        severity: 'HIGH',
      },
      FORMATTING: {
        title: `Formatierung verbessern: ${pattern.patternKey}`,
        description: `Es wurden ${pattern.occurrences} Formatierungsfehler gefunden.`,
        instruction: 'Achte auf konsistente Formatierung und folge den Benutzer-Vorgaben.',
        severity: 'LOW',
      },
      CODE: {
        title: `Code-Qualität sicherstellen: ${pattern.patternKey}`,
        description: `Es wurden ${pattern.occurrences} Code-Fehler gefunden.`,
        instruction: 'Überprüfe Code auf Syntax-Fehler und Best Practices vor dem Absenden.',
        severity: 'HIGH',
      },
      MATH: {
        title: `Berechnungen überprüfen: ${pattern.patternKey}`,
        description: `Es wurden ${pattern.occurrences} Rechenfehler gefunden.`,
        instruction: 'Führe mathematische Berechnungen schrittweise durch und überprüfe das Ergebnis.',
        severity: 'HIGH',
      },
      TONE: {
        title: `Tonalität anpassen: ${pattern.patternKey}`,
        description: `Es wurden ${pattern.occurrences} Tonfehler gefunden.`,
        instruction: 'Achte auf angemessene Tonalität entsprechend dem Kontext.',
        severity: 'MEDIUM',
      },
      CONTEXT: {
        title: `Kontext beachten: ${pattern.patternKey}`,
        description: `Es wurden ${pattern.occurrences} Kontextfehler gefunden.`,
        instruction: 'Beachte den vollständigen Kontext der Konversation.',
        severity: 'MEDIUM',
      },
      LOGIC: {
        title: `Logik prüfen: ${pattern.patternKey}`,
        description: `Es wurden ${pattern.occurrences} Logikfehler gefunden.`,
        instruction: 'Überprüfe die logische Konsistenz der Antwort.',
        severity: 'HIGH',
      },
      LANGUAGE: {
        title: `Sprache korrigieren: ${pattern.patternKey}`,
        description: `Es wurden ${pattern.occurrences} Sprachfehler gefunden.`,
        instruction: 'Achte auf korrekte Grammatik und Rechtschreibung.',
        severity: 'LOW',
      },
      INSTRUCTION: {
        title: `Anweisungen befolgen: ${pattern.patternKey}`,
        description: `Es wurden ${pattern.occurrences} Fälle gefunden, in denen Anweisungen nicht korrekt befolgt wurden.`,
        instruction: 'Lies alle Anweisungen sorgfältig und befolge sie vollständig.',
        severity: 'MEDIUM',
      },
    };

    const template = ruleTemplates[pattern.category] || ruleTemplates.INSTRUCTION;

    return {
      title: template.title!,
      description: template.description!,
      instruction: template.instruction!,
      category: pattern.category,
      severity: template.severity as any,
      confidence: Math.min(pattern.occurrences / 10, 1),
      examples: examples.slice(0, 5),
      affectedModels: pattern.modelIds || [],
      triggerPatternId: pattern.id,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GET ACTIVE RULES FOR SYSTEM PROMPT
  // ══════════════════════════════════════════════════════════════════════════

  async getActiveRulesForPrompt(): Promise<string> {
    try {
      // Try cache first
      const cached = await cacheGet<string>('active_rules_prompt');
      if (cached) return cached;

      const rules = await prisma.activeRule.findMany({
        where: { isActive: true },
        orderBy: [
          { severity: 'desc' },
          { usageCount: 'desc' },
        ],
      });

      if (rules.length === 0) {
        return '';
      }

      const severityEmoji: Record<string, string> = {
        CRITICAL: '🚨',
        HIGH: '⚠️',
        MEDIUM: '📌',
        LOW: '💡',
      };

      const prompt = `
## Gelernte Regeln (Automatisch aus Feedback generiert)

Die folgenden Regeln wurden aus Benutzer-Feedback und Korrekturen gelernt. 
Befolge diese Regeln strikt, um bekannte Fehler zu vermeiden:

${rules.map((rule, i) => `
${i + 1}. ${severityEmoji[rule.severity]} **${rule.title}**
   - ${rule.instruction}
`).join('')}

---
`.trim();

      // Cache for 5 minutes
      await cacheSet('active_rules_prompt', prompt, 300);

      return prompt;
    } catch (error) {
      logger.error('Error getting active rules:', error);
      return '';
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GET STATISTICS
  // ══════════════════════════════════════════════════════════════════════════

  async getStatistics(): Promise<{
    totalEvents: number;
    totalPatterns: number;
    proposedRules: number;
    activeRules: number;
    topErrorCategories: { category: string; count: number }[];
    topAffectedModels: { modelId: string; count: number }[];
    recentActivity: { date: string; count: number }[];
  }> {
    const [
      totalEvents,
      totalPatterns,
      proposedRules,
      activeRules,
      eventsByCategory,
      eventsByModel,
      recentEvents,
    ] = await Promise.all([
      prisma.learningEvent.count(),
      prisma.errorPattern.count(),
      prisma.proposedRule.count({ where: { status: 'PENDING' } }),
      prisma.activeRule.count({ where: { isActive: true } }),
      prisma.errorPattern.groupBy({
        by: ['category'],
        _sum: { occurrences: true },
        orderBy: { _sum: { occurrences: 'desc' } },
        take: 5,
      }),
      prisma.learningEvent.groupBy({
        by: ['modelId'],
        _count: true,
        orderBy: { _count: { modelId: 'desc' } },
        take: 5,
      }),
      prisma.learningEvent.groupBy({
        by: ['createdAt'],
        _count: true,
        orderBy: { createdAt: 'desc' },
        take: 7,
      }),
    ]);

    return {
      totalEvents,
      totalPatterns,
      proposedRules,
      activeRules,
      topErrorCategories: eventsByCategory.map(e => ({
        category: e.category,
        count: e._sum.occurrences || 0,
      })),
      topAffectedModels: eventsByModel.map(e => ({
        modelId: e.modelId,
        count: e._count,
      })),
      recentActivity: recentEvents.map(e => ({
        date: e.createdAt.toISOString().split('T')[0],
        count: e._count,
      })),
    };
  }
}

// Singleton Export
export const learningEngine = LearningEngine.getInstance();

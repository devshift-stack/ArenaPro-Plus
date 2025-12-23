// ============================================================================
// AI ARENA - SELBSTLERNENDES REGEL-SYSTEM
// ============================================================================
// Dieses System ermöglicht:
// 1. Fehler-Tracking über alle Modelle hinweg
// 2. Automatische Regel-Vorschläge basierend auf Fehlern
// 3. Admin-Bestätigung bevor Regeln aktiv werden
// 4. Modell-übergreifendes Lernen
// ============================================================================

import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';
import { logger } from '../utils/logger';
import { openRouterService } from './openrouter';

const router = Router();

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface LearningEvent {
  id: string;
  chatId: string;
  messageId: string;
  modelId: string;
  eventType: 'error' | 'correction' | 'negative_feedback' | 'regeneration';
  originalContent: string;
  correctedContent?: string;
  errorCategory?: string;
  errorDescription?: string;
  userId: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

interface ProposedRule {
  id: string;
  title: string;
  description: string;
  ruleType: 'instruction' | 'constraint' | 'preference' | 'format' | 'behavior';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scope: 'global' | 'model' | 'user' | 'team';
  targetModels: string[];  // Welche Modelle betroffen sind
  condition?: string;      // Wann die Regel gilt
  action: string;          // Was die Regel bewirkt
  examples: {
    bad: string;
    good: string;
  }[];
  sourceEvents: string[];  // IDs der Lern-Events die zur Regel führten
  confidence: number;      // 0-1, wie sicher sind wir
  occurrences: number;     // Wie oft wurde das Problem erkannt
  status: 'proposed' | 'approved' | 'rejected' | 'deprecated';
  proposedAt: Date;
  decidedAt?: Date;
  decidedBy?: string;
  rejectionReason?: string;
}

interface ActiveRule {
  id: string;
  ruleId: string;
  rule: ProposedRule;
  activatedAt: Date;
  activatedBy: string;
  version: number;
  isActive: boolean;
}

interface ErrorPattern {
  pattern: string;
  category: string;
  count: number;
  models: string[];
  lastSeen: Date;
  suggestedFix?: string;
}

// ============================================================================
// LEARNING ENGINE SERVICE
// ============================================================================

class LearningEngineService {
  private readonly CACHE_PREFIX = 'learning:';
  private readonly PATTERN_THRESHOLD = 3;  // Mindestanzahl für Regel-Vorschlag
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  // --------------------------------------------------------------------------
  // FEHLER & EREIGNISSE ERFASSEN
  // --------------------------------------------------------------------------

  /**
   * Erfasst ein Lern-Ereignis (Fehler, Korrektur, negatives Feedback)
   */
  async recordLearningEvent(event: Omit<LearningEvent, 'id' | 'createdAt'>): Promise<LearningEvent> {
    const learningEvent: LearningEvent = {
      ...event,
      id: this.generateId(),
      createdAt: new Date(),
    };

    // In Datenbank speichern
    await prisma.learningEvent.create({
      data: {
        id: learningEvent.id,
        chatId: learningEvent.chatId,
        messageId: learningEvent.messageId,
        modelId: learningEvent.modelId,
        eventType: learningEvent.eventType,
        originalContent: learningEvent.originalContent,
        correctedContent: learningEvent.correctedContent,
        errorCategory: learningEvent.errorCategory,
        errorDescription: learningEvent.errorDescription,
        userId: learningEvent.userId,
        metadata: learningEvent.metadata ? JSON.stringify(learningEvent.metadata) : null,
      },
    });

    // Pattern-Analyse triggern
    await this.analyzeForPatterns(learningEvent);

    logger.info('Learning event recorded', { 
      eventId: learningEvent.id, 
      type: learningEvent.eventType,
      model: learningEvent.modelId 
    });

    return learningEvent;
  }

  /**
   * Erfasst wenn ein User eine AI-Antwort korrigiert
   */
  async recordCorrection(
    chatId: string,
    messageId: string,
    modelId: string,
    originalContent: string,
    correctedContent: string,
    userId: string
  ): Promise<LearningEvent> {
    // Analysiere die Korrektur um die Fehler-Kategorie zu bestimmen
    const analysis = await this.analyzeCorrection(originalContent, correctedContent);

    return this.recordLearningEvent({
      chatId,
      messageId,
      modelId,
      eventType: 'correction',
      originalContent,
      correctedContent,
      errorCategory: analysis.category,
      errorDescription: analysis.description,
      userId,
      metadata: {
        diff: analysis.diff,
        severity: analysis.severity,
      },
    });
  }

  /**
   * Erfasst negatives Feedback (Thumbs Down)
   */
  async recordNegativeFeedback(
    chatId: string,
    messageId: string,
    modelId: string,
    content: string,
    userId: string,
    reason?: string
  ): Promise<LearningEvent> {
    return this.recordLearningEvent({
      chatId,
      messageId,
      modelId,
      eventType: 'negative_feedback',
      originalContent: content,
      errorDescription: reason,
      userId,
    });
  }

  /**
   * Erfasst wenn eine Antwort regeneriert wurde
   */
  async recordRegeneration(
    chatId: string,
    messageId: string,
    modelId: string,
    originalContent: string,
    newContent: string,
    userId: string
  ): Promise<LearningEvent> {
    return this.recordLearningEvent({
      chatId,
      messageId,
      modelId,
      eventType: 'regeneration',
      originalContent,
      correctedContent: newContent,
      userId,
    });
  }

  // --------------------------------------------------------------------------
  // PATTERN-ERKENNUNG
  // --------------------------------------------------------------------------

  /**
   * Analysiert Ereignisse auf wiederkehrende Muster
   */
  private async analyzeForPatterns(event: LearningEvent): Promise<void> {
    // Hole ähnliche Ereignisse
    const similarEvents = await this.findSimilarEvents(event);

    if (similarEvents.length >= this.PATTERN_THRESHOLD - 1) {
      // Pattern erkannt! Generiere Regel-Vorschlag
      await this.generateRuleProposal([...similarEvents, event]);
    }

    // Update Pattern-Cache
    await this.updatePatternCache(event);
  }

  /**
   * Findet ähnliche Lern-Ereignisse
   */
  private async findSimilarEvents(event: LearningEvent): Promise<LearningEvent[]> {
    const events = await prisma.learningEvent.findMany({
      where: {
        errorCategory: event.errorCategory,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Letzte 30 Tage
        },
        id: { not: event.id },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Semantische Ähnlichkeit prüfen
    const similar: LearningEvent[] = [];
    for (const e of events) {
      const similarity = await this.calculateSimilarity(
        event.originalContent,
        e.originalContent
      );
      if (similarity > 0.6) {
        similar.push(e as LearningEvent);
      }
    }

    return similar;
  }

  /**
   * Berechnet semantische Ähnlichkeit zwischen zwei Texten
   */
  private async calculateSimilarity(text1: string, text2: string): Promise<number> {
    // Vereinfachte Ähnlichkeitsberechnung
    // In Produktion: Embeddings vergleichen
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Analysiert eine Korrektur um Fehlertyp zu bestimmen
   */
  private async analyzeCorrection(
    original: string,
    corrected: string
  ): Promise<{
    category: string;
    description: string;
    diff: string;
    severity: 'low' | 'medium' | 'high';
  }> {
    // AI-basierte Analyse der Korrektur
    const prompt = `Analysiere die folgende Korrektur und bestimme:
1. Fehler-Kategorie (z.B. factual_error, format_error, tone_error, incomplete, hallucination, code_error, instruction_ignored)
2. Kurze Beschreibung des Fehlers
3. Schweregrad (low/medium/high)

ORIGINAL:
${original.slice(0, 1000)}

KORRIGIERT:
${corrected.slice(0, 1000)}

Antworte im JSON-Format:
{
  "category": "...",
  "description": "...",
  "severity": "..."
}`;

    try {
      const response = await openRouterService.complete({
        model: 'anthropic/claude-3-haiku',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 200,
      });

      const result = JSON.parse(response.content);
      return {
        category: result.category || 'unknown',
        description: result.description || 'Unbekannter Fehler',
        diff: this.calculateDiff(original, corrected),
        severity: result.severity || 'medium',
      };
    } catch (error) {
      logger.error('Error analyzing correction', { error });
      return {
        category: 'unknown',
        description: 'Korrektur konnte nicht analysiert werden',
        diff: '',
        severity: 'medium',
      };
    }
  }

  private calculateDiff(original: string, corrected: string): string {
    // Vereinfachtes Diff
    return `Original: ${original.slice(0, 100)}...\nKorrigiert: ${corrected.slice(0, 100)}...`;
  }

  private async updatePatternCache(event: LearningEvent): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}patterns:${event.errorCategory}`;
    
    const cached = await redis.get(cacheKey);
    const pattern: ErrorPattern = cached ? JSON.parse(cached) : {
      pattern: event.errorCategory,
      category: event.errorCategory || 'unknown',
      count: 0,
      models: [],
      lastSeen: new Date(),
    };

    pattern.count++;
    pattern.lastSeen = new Date();
    if (!pattern.models.includes(event.modelId)) {
      pattern.models.push(event.modelId);
    }

    await redis.set(cacheKey, JSON.stringify(pattern), 'EX', 30 * 24 * 60 * 60);
  }

  // --------------------------------------------------------------------------
  // REGEL-GENERIERUNG
  // --------------------------------------------------------------------------

  /**
   * Generiert einen Regel-Vorschlag basierend auf erkannten Mustern
   */
  private async generateRuleProposal(events: LearningEvent[]): Promise<ProposedRule | null> {
    if (events.length < this.PATTERN_THRESHOLD) return null;

    // Sammle Informationen für die Regel
    const errorCategory = events[0].errorCategory || 'unknown';
    const affectedModels = [...new Set(events.map(e => e.modelId))];
    
    // AI-generierter Regel-Vorschlag
    const prompt = `Basierend auf folgenden wiederkehrenden Fehlern, erstelle eine Regel die verhindert, dass dieser Fehler erneut auftritt.

FEHLER-KATEGORIE: ${errorCategory}
BETROFFENE MODELLE: ${affectedModels.join(', ')}
ANZAHL VORKOMMEN: ${events.length}

BEISPIELE:
${events.slice(0, 3).map((e, i) => `
Beispiel ${i + 1}:
- Original: ${e.originalContent?.slice(0, 200)}...
- Korrektur: ${e.correctedContent?.slice(0, 200) || 'N/A'}
- Beschreibung: ${e.errorDescription || 'N/A'}
`).join('\n')}

Erstelle eine Regel im JSON-Format:
{
  "title": "Kurzer, prägnanter Titel der Regel",
  "description": "Ausführliche Beschreibung was die Regel bewirkt",
  "ruleType": "instruction|constraint|preference|format|behavior",
  "priority": "low|medium|high|critical",
  "condition": "Wann diese Regel angewendet werden soll (optional)",
  "action": "Die konkrete Anweisung für die AI-Modelle",
  "examples": [
    {
      "bad": "Beispiel für falsches Verhalten",
      "good": "Beispiel für korrektes Verhalten"
    }
  ]
}`;

    try {
      const response = await openRouterService.complete({
        model: 'anthropic/claude-3-sonnet',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 1000,
      });

      const ruleData = JSON.parse(response.content);
      
      const proposedRule: ProposedRule = {
        id: this.generateId(),
        title: ruleData.title,
        description: ruleData.description,
        ruleType: ruleData.ruleType || 'instruction',
        priority: ruleData.priority || 'medium',
        scope: affectedModels.length > 2 ? 'global' : 'model',
        targetModels: affectedModels,
        condition: ruleData.condition,
        action: ruleData.action,
        examples: ruleData.examples || [],
        sourceEvents: events.map(e => e.id),
        confidence: Math.min(events.length / 10, 1), // Mehr Events = höhere Confidence
        occurrences: events.length,
        status: 'proposed',
        proposedAt: new Date(),
      };

      // Speichere Vorschlag
      await this.saveProposedRule(proposedRule);

      logger.info('New rule proposed', {
        ruleId: proposedRule.id,
        title: proposedRule.title,
        confidence: proposedRule.confidence,
      });

      return proposedRule;
    } catch (error) {
      logger.error('Error generating rule proposal', { error });
      return null;
    }
  }

  /**
   * Speichert einen Regel-Vorschlag
   */
  private async saveProposedRule(rule: ProposedRule): Promise<void> {
    await prisma.proposedRule.create({
      data: {
        id: rule.id,
        title: rule.title,
        description: rule.description,
        ruleType: rule.ruleType,
        priority: rule.priority,
        scope: rule.scope,
        targetModels: JSON.stringify(rule.targetModels),
        condition: rule.condition,
        action: rule.action,
        examples: JSON.stringify(rule.examples),
        sourceEvents: JSON.stringify(rule.sourceEvents),
        confidence: rule.confidence,
        occurrences: rule.occurrences,
        status: rule.status,
        proposedAt: rule.proposedAt,
      },
    });

    // Cache invalidieren
    await redis.del(`${this.CACHE_PREFIX}proposed-rules`);
  }

  // --------------------------------------------------------------------------
  // REGEL-VERWALTUNG (Admin)
  // --------------------------------------------------------------------------

  /**
   * Holt alle vorgeschlagenen Regeln (pending approval)
   */
  async getProposedRules(): Promise<ProposedRule[]> {
    const rules = await prisma.proposedRule.findMany({
      where: { status: 'proposed' },
      orderBy: [
        { priority: 'desc' },
        { confidence: 'desc' },
        { occurrences: 'desc' },
      ],
    });

    return rules.map(this.mapDbToRule);
  }

  /**
   * Holt alle aktiven Regeln
   */
  async getActiveRules(): Promise<ActiveRule[]> {
    const cacheKey = `${this.CACHE_PREFIX}active-rules`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const rules = await prisma.activeRule.findMany({
      where: { isActive: true },
      include: { rule: true },
      orderBy: { activatedAt: 'desc' },
    });

    const activeRules = rules.map(r => ({
      id: r.id,
      ruleId: r.ruleId,
      rule: this.mapDbToRule(r.rule),
      activatedAt: r.activatedAt,
      activatedBy: r.activatedBy,
      version: r.version,
      isActive: r.isActive,
    }));

    await redis.set(cacheKey, JSON.stringify(activeRules), 'EX', 300);
    
    return activeRules;
  }

  /**
   * Genehmigt eine vorgeschlagene Regel (macht sie aktiv)
   */
  async approveRule(ruleId: string, adminId: string): Promise<ActiveRule> {
    // Update Status
    const rule = await prisma.proposedRule.update({
      where: { id: ruleId },
      data: {
        status: 'approved',
        decidedAt: new Date(),
        decidedBy: adminId,
      },
    });

    // Erstelle aktive Regel
    const activeRule = await prisma.activeRule.create({
      data: {
        id: this.generateId(),
        ruleId: rule.id,
        activatedAt: new Date(),
        activatedBy: adminId,
        version: 1,
        isActive: true,
      },
      include: { rule: true },
    });

    // Cache invalidieren
    await redis.del(`${this.CACHE_PREFIX}active-rules`);
    await redis.del(`${this.CACHE_PREFIX}proposed-rules`);

    logger.info('Rule approved', { ruleId, adminId });

    return {
      id: activeRule.id,
      ruleId: activeRule.ruleId,
      rule: this.mapDbToRule(activeRule.rule),
      activatedAt: activeRule.activatedAt,
      activatedBy: activeRule.activatedBy,
      version: activeRule.version,
      isActive: activeRule.isActive,
    };
  }

  /**
   * Lehnt eine vorgeschlagene Regel ab
   */
  async rejectRule(ruleId: string, adminId: string, reason: string): Promise<void> {
    await prisma.proposedRule.update({
      where: { id: ruleId },
      data: {
        status: 'rejected',
        decidedAt: new Date(),
        decidedBy: adminId,
        rejectionReason: reason,
      },
    });

    await redis.del(`${this.CACHE_PREFIX}proposed-rules`);

    logger.info('Rule rejected', { ruleId, adminId, reason });
  }

  /**
   * Deaktiviert eine aktive Regel
   */
  async deactivateRule(activeRuleId: string, adminId: string): Promise<void> {
    await prisma.activeRule.update({
      where: { id: activeRuleId },
      data: { isActive: false },
    });

    // Original-Regel auf deprecated setzen
    const activeRule = await prisma.activeRule.findUnique({
      where: { id: activeRuleId },
    });

    if (activeRule) {
      await prisma.proposedRule.update({
        where: { id: activeRule.ruleId },
        data: { status: 'deprecated' },
      });
    }

    await redis.del(`${this.CACHE_PREFIX}active-rules`);

    logger.info('Rule deactivated', { activeRuleId, adminId });
  }

  // --------------------------------------------------------------------------
  // REGEL-ANWENDUNG
  // --------------------------------------------------------------------------

  /**
   * Generiert System-Prompt-Ergänzungen basierend auf aktiven Regeln
   */
  async generateRuleInstructions(modelId?: string): Promise<string> {
    const activeRules = await this.getActiveRules();

    // Filtere relevante Regeln
    const relevantRules = activeRules.filter(ar => {
      const rule = ar.rule;
      if (rule.scope === 'global') return true;
      if (rule.scope === 'model' && modelId && rule.targetModels.includes(modelId)) return true;
      return false;
    });

    if (relevantRules.length === 0) return '';

    // Generiere Instruktionen
    const instructions = relevantRules.map(ar => {
      const rule = ar.rule;
      let instruction = `\n## ${rule.title}\n${rule.action}`;
      
      if (rule.condition) {
        instruction = `\nWENN: ${rule.condition}\nDANN: ${rule.action}`;
      }

      if (rule.examples.length > 0) {
        instruction += '\n\nBeispiele:';
        rule.examples.forEach(ex => {
          instruction += `\n❌ Falsch: ${ex.bad}`;
          instruction += `\n✅ Richtig: ${ex.good}`;
        });
      }

      return instruction;
    });

    return `
<learned_rules>
Die folgenden Regeln wurden aus vergangenen Fehlern gelernt und MÜSSEN befolgt werden:

${instructions.join('\n\n---\n')}
</learned_rules>
`;
  }

  /**
   * Prüft eine Antwort gegen alle aktiven Regeln
   */
  async validateAgainstRules(
    content: string,
    modelId: string
  ): Promise<{
    valid: boolean;
    violations: Array<{
      ruleId: string;
      ruleTitle: string;
      description: string;
    }>;
  }> {
    const activeRules = await this.getActiveRules();
    const violations: Array<{
      ruleId: string;
      ruleTitle: string;
      description: string;
    }> = [];

    // Prüfe jede Regel
    for (const ar of activeRules) {
      const rule = ar.rule;
      
      // Skip wenn Regel nicht für dieses Modell gilt
      if (rule.scope === 'model' && !rule.targetModels.includes(modelId)) {
        continue;
      }

      // Prüfe auf Verstöße (vereinfacht - in Produktion: AI-basierte Prüfung)
      const violates = await this.checkRuleViolation(content, rule);
      
      if (violates) {
        violations.push({
          ruleId: rule.id,
          ruleTitle: rule.title,
          description: `Möglicher Verstoß gegen: ${rule.description}`,
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  private async checkRuleViolation(content: string, rule: ProposedRule): Promise<boolean> {
    // Prüfe anhand der "bad" Beispiele
    for (const example of rule.examples) {
      // Sehr vereinfachte Prüfung - in Produktion: Embedding-basiert
      const badWords = example.bad.toLowerCase().split(/\s+/);
      const contentLower = content.toLowerCase();
      
      const matchCount = badWords.filter(w => 
        w.length > 3 && contentLower.includes(w)
      ).length;
      
      if (matchCount / badWords.length > 0.5) {
        return true;
      }
    }
    
    return false;
  }

  // --------------------------------------------------------------------------
  // STATISTIKEN & ANALYTICS
  // --------------------------------------------------------------------------

  /**
   * Holt Lern-Statistiken
   */
  async getStatistics(): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByModel: Record<string, number>;
    topErrorCategories: Array<{ category: string; count: number }>;
    proposedRules: number;
    activeRules: number;
    rejectedRules: number;
    learningTrend: Array<{ date: string; count: number }>;
  }> {
    const [
      totalEvents,
      eventsByType,
      eventsByModel,
      topCategories,
      proposedCount,
      activeCount,
      rejectedCount,
      trend,
    ] = await Promise.all([
      prisma.learningEvent.count(),
      prisma.learningEvent.groupBy({
        by: ['eventType'],
        _count: true,
      }),
      prisma.learningEvent.groupBy({
        by: ['modelId'],
        _count: true,
      }),
      prisma.learningEvent.groupBy({
        by: ['errorCategory'],
        _count: true,
        orderBy: { _count: { errorCategory: 'desc' } },
        take: 10,
      }),
      prisma.proposedRule.count({ where: { status: 'proposed' } }),
      prisma.activeRule.count({ where: { isActive: true } }),
      prisma.proposedRule.count({ where: { status: 'rejected' } }),
      prisma.learningEvent.groupBy({
        by: ['createdAt'],
        _count: true,
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      totalEvents,
      eventsByType: Object.fromEntries(
        eventsByType.map(e => [e.eventType, e._count])
      ),
      eventsByModel: Object.fromEntries(
        eventsByModel.map(e => [e.modelId, e._count])
      ),
      topErrorCategories: topCategories.map(c => ({
        category: c.errorCategory || 'unknown',
        count: c._count,
      })),
      proposedRules: proposedCount,
      activeRules: activeCount,
      rejectedRules: rejectedCount,
      learningTrend: trend.map(t => ({
        date: t.createdAt.toISOString().split('T')[0],
        count: t._count,
      })),
    };
  }

  // --------------------------------------------------------------------------
  // HILFSFUNKTIONEN
  // --------------------------------------------------------------------------

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapDbToRule(dbRule: any): ProposedRule {
    return {
      id: dbRule.id,
      title: dbRule.title,
      description: dbRule.description,
      ruleType: dbRule.ruleType,
      priority: dbRule.priority,
      scope: dbRule.scope,
      targetModels: JSON.parse(dbRule.targetModels || '[]'),
      condition: dbRule.condition,
      action: dbRule.action,
      examples: JSON.parse(dbRule.examples || '[]'),
      sourceEvents: JSON.parse(dbRule.sourceEvents || '[]'),
      confidence: dbRule.confidence,
      occurrences: dbRule.occurrences,
      status: dbRule.status,
      proposedAt: dbRule.proposedAt,
      decidedAt: dbRule.decidedAt,
      decidedBy: dbRule.decidedBy,
      rejectionReason: dbRule.rejectionReason,
    };
  }
}

// Singleton Instance
export const learningEngine = new LearningEngineService();

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * POST /api/learning/events
 * Erfasst ein neues Lern-Ereignis
 */
router.post('/events', async (req: Request, res: Response) => {
  try {
    const { chatId, messageId, modelId, eventType, originalContent, correctedContent, errorDescription } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const event = await learningEngine.recordLearningEvent({
      chatId,
      messageId,
      modelId,
      eventType,
      originalContent,
      correctedContent,
      errorDescription,
      userId,
    });

    res.json({ success: true, event });
  } catch (error) {
    logger.error('Error recording learning event', { error });
    res.status(500).json({ error: 'Failed to record learning event' });
  }
});

/**
 * POST /api/learning/corrections
 * Erfasst eine Korrektur
 */
router.post('/corrections', async (req: Request, res: Response) => {
  try {
    const { chatId, messageId, modelId, originalContent, correctedContent } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const event = await learningEngine.recordCorrection(
      chatId,
      messageId,
      modelId,
      originalContent,
      correctedContent,
      userId
    );

    res.json({ success: true, event });
  } catch (error) {
    logger.error('Error recording correction', { error });
    res.status(500).json({ error: 'Failed to record correction' });
  }
});

/**
 * POST /api/learning/feedback
 * Erfasst negatives Feedback
 */
router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const { chatId, messageId, modelId, content, reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const event = await learningEngine.recordNegativeFeedback(
      chatId,
      messageId,
      modelId,
      content,
      userId,
      reason
    );

    res.json({ success: true, event });
  } catch (error) {
    logger.error('Error recording feedback', { error });
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});

/**
 * GET /api/learning/rules/proposed
 * Holt alle vorgeschlagenen Regeln (Admin)
 */
router.get('/rules/proposed', async (req: Request, res: Response) => {
  try {
    // TODO: Admin-Check
    const rules = await learningEngine.getProposedRules();
    res.json({ rules });
  } catch (error) {
    logger.error('Error fetching proposed rules', { error });
    res.status(500).json({ error: 'Failed to fetch proposed rules' });
  }
});

/**
 * GET /api/learning/rules/active
 * Holt alle aktiven Regeln
 */
router.get('/rules/active', async (req: Request, res: Response) => {
  try {
    const rules = await learningEngine.getActiveRules();
    res.json({ rules });
  } catch (error) {
    logger.error('Error fetching active rules', { error });
    res.status(500).json({ error: 'Failed to fetch active rules' });
  }
});

/**
 * POST /api/learning/rules/:ruleId/approve
 * Genehmigt eine Regel (Admin)
 */
router.post('/rules/:ruleId/approve', async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Admin-Check

    const activeRule = await learningEngine.approveRule(ruleId, adminId);
    res.json({ success: true, activeRule });
  } catch (error) {
    logger.error('Error approving rule', { error });
    res.status(500).json({ error: 'Failed to approve rule' });
  }
});

/**
 * POST /api/learning/rules/:ruleId/reject
 * Lehnt eine Regel ab (Admin)
 */
router.post('/rules/:ruleId/reject', async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Admin-Check

    await learningEngine.rejectRule(ruleId, adminId, reason);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error rejecting rule', { error });
    res.status(500).json({ error: 'Failed to reject rule' });
  }
});

/**
 * DELETE /api/learning/rules/:activeRuleId
 * Deaktiviert eine aktive Regel (Admin)
 */
router.delete('/rules/:activeRuleId', async (req: Request, res: Response) => {
  try {
    const { activeRuleId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Admin-Check

    await learningEngine.deactivateRule(activeRuleId, adminId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deactivating rule', { error });
    res.status(500).json({ error: 'Failed to deactivate rule' });
  }
});

/**
 * GET /api/learning/statistics
 * Holt Lern-Statistiken
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const stats = await learningEngine.getStatistics();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching statistics', { error });
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/learning/instructions
 * Generiert Regel-Instruktionen für System-Prompt
 */
router.get('/instructions', async (req: Request, res: Response) => {
  try {
    const { modelId } = req.query;
    const instructions = await learningEngine.generateRuleInstructions(modelId as string);
    res.json({ instructions });
  } catch (error) {
    logger.error('Error generating instructions', { error });
    res.status(500).json({ error: 'Failed to generate instructions' });
  }
});

export default router;

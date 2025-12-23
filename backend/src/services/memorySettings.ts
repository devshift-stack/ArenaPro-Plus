// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY SETTINGS SERVICE
// Verwaltet User-spezifische Memory-Einstellungen
// ═══════════════════════════════════════════════════════════════════════════════

import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface MemorySettings {
  id: string;
  userId: string;
  
  // Feature Toggles
  enabled: boolean;
  conversationMemory: boolean;
  factMemory: boolean;
  preferenceMemory: boolean;
  crossChatMemory: boolean;
  
  // Retention
  retentionDays: number;
  maxMemories: number;
  autoConsolidate: boolean;
  
  // Privacy
  shareWithTeam: boolean;
  anonymizeExports: boolean;
  excludePatterns: string[];
  
  // Extraction
  autoExtract: boolean;
  extractionFrequency: 'per_chat' | 'per_message' | 'manual';
  minConfidence: number;
}

type MemoryType = 'CONVERSATION' | 'PREFERENCE' | 'FACT' | 'CONTEXT' | 'PROJECT';

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_SETTINGS: Omit<MemorySettings, 'id' | 'userId'> = {
  enabled: true,
  conversationMemory: true,
  factMemory: true,
  preferenceMemory: true,
  crossChatMemory: true,
  retentionDays: 365,
  maxMemories: 1000,
  autoConsolidate: true,
  shareWithTeam: false,
  anonymizeExports: true,
  excludePatterns: [],
  autoExtract: true,
  extractionFrequency: 'per_chat',
  minConfidence: 0.7,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class MemorySettingsService {
  
  // ─────────────────────────────────────────────────────────────────────────────
  // GET SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────
  
  async getSettings(userId: string): Promise<MemorySettings> {
    try {
      // Versuche existierende Settings zu laden
      const existing = await prisma.$queryRaw<MemorySettings[]>`
        SELECT * FROM user_memory_settings WHERE user_id = ${userId} LIMIT 1
      `;
      
      if (existing && existing.length > 0) {
        return existing[0];
      }
      
      // Erstelle Default Settings
      return this.createDefaultSettings(userId);
      
    } catch (error) {
      logger.error('Failed to get memory settings:', error);
      
      // Fallback auf Defaults
      return {
        id: 'default',
        userId,
        ...DEFAULT_SETTINGS,
      };
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE DEFAULT SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────
  
  private async createDefaultSettings(userId: string): Promise<MemorySettings> {
    const id = crypto.randomUUID();
    
    await prisma.$executeRaw`
      INSERT INTO user_memory_settings (
        id, user_id, enabled, conversation_memory, fact_memory, preference_memory,
        cross_chat_memory, retention_days, max_memories, auto_consolidate,
        share_with_team, anonymize_exports, exclude_patterns, auto_extract,
        extraction_frequency, min_confidence, created_at, updated_at
      ) VALUES (
        ${id}, ${userId}, ${DEFAULT_SETTINGS.enabled}, ${DEFAULT_SETTINGS.conversationMemory},
        ${DEFAULT_SETTINGS.factMemory}, ${DEFAULT_SETTINGS.preferenceMemory},
        ${DEFAULT_SETTINGS.crossChatMemory}, ${DEFAULT_SETTINGS.retentionDays},
        ${DEFAULT_SETTINGS.maxMemories}, ${DEFAULT_SETTINGS.autoConsolidate},
        ${DEFAULT_SETTINGS.shareWithTeam}, ${DEFAULT_SETTINGS.anonymizeExports},
        ${JSON.stringify(DEFAULT_SETTINGS.excludePatterns)}, ${DEFAULT_SETTINGS.autoExtract},
        ${DEFAULT_SETTINGS.extractionFrequency}, ${DEFAULT_SETTINGS.minConfidence},
        NOW(), NOW()
      )
    `;
    
    return {
      id,
      userId,
      ...DEFAULT_SETTINGS,
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────
  
  async updateSettings(
    userId: string, 
    updates: Partial<MemorySettings>
  ): Promise<MemorySettings> {
    // Validierung
    this.validateSettings(updates);
    
    // Sicherstellen, dass Settings existieren
    await this.getSettings(userId);
    
    // Build SET clause dynamisch
    const setClauses: string[] = [];
    const values: any[] = [];
    
    if (updates.enabled !== undefined) {
      setClauses.push('enabled = $' + (values.length + 1));
      values.push(updates.enabled);
    }
    if (updates.conversationMemory !== undefined) {
      setClauses.push('conversation_memory = $' + (values.length + 1));
      values.push(updates.conversationMemory);
    }
    if (updates.factMemory !== undefined) {
      setClauses.push('fact_memory = $' + (values.length + 1));
      values.push(updates.factMemory);
    }
    if (updates.preferenceMemory !== undefined) {
      setClauses.push('preference_memory = $' + (values.length + 1));
      values.push(updates.preferenceMemory);
    }
    if (updates.crossChatMemory !== undefined) {
      setClauses.push('cross_chat_memory = $' + (values.length + 1));
      values.push(updates.crossChatMemory);
    }
    if (updates.retentionDays !== undefined) {
      setClauses.push('retention_days = $' + (values.length + 1));
      values.push(updates.retentionDays);
    }
    if (updates.maxMemories !== undefined) {
      setClauses.push('max_memories = $' + (values.length + 1));
      values.push(updates.maxMemories);
    }
    if (updates.autoConsolidate !== undefined) {
      setClauses.push('auto_consolidate = $' + (values.length + 1));
      values.push(updates.autoConsolidate);
    }
    if (updates.shareWithTeam !== undefined) {
      setClauses.push('share_with_team = $' + (values.length + 1));
      values.push(updates.shareWithTeam);
    }
    if (updates.anonymizeExports !== undefined) {
      setClauses.push('anonymize_exports = $' + (values.length + 1));
      values.push(updates.anonymizeExports);
    }
    if (updates.excludePatterns !== undefined) {
      setClauses.push('exclude_patterns = $' + (values.length + 1));
      values.push(JSON.stringify(updates.excludePatterns));
    }
    if (updates.autoExtract !== undefined) {
      setClauses.push('auto_extract = $' + (values.length + 1));
      values.push(updates.autoExtract);
    }
    if (updates.extractionFrequency !== undefined) {
      setClauses.push('extraction_frequency = $' + (values.length + 1));
      values.push(updates.extractionFrequency);
    }
    if (updates.minConfidence !== undefined) {
      setClauses.push('min_confidence = $' + (values.length + 1));
      values.push(updates.minConfidence);
    }
    
    setClauses.push('updated_at = NOW()');
    
    if (setClauses.length > 1) {
      await prisma.$executeRawUnsafe(
        `UPDATE user_memory_settings SET ${setClauses.join(', ')} WHERE user_id = $${values.length + 1}`,
        ...values,
        userId
      );
    }
    
    return this.getSettings(userId);
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // VALIDATE SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────
  
  private validateSettings(settings: Partial<MemorySettings>): void {
    if (settings.retentionDays !== undefined) {
      if (settings.retentionDays < 1 || settings.retentionDays > 9999) {
        throw new Error('retentionDays muss zwischen 1 und 9999 liegen');
      }
    }
    
    if (settings.maxMemories !== undefined) {
      if (settings.maxMemories < 100 || settings.maxMemories > 10000) {
        throw new Error('maxMemories muss zwischen 100 und 10000 liegen');
      }
    }
    
    if (settings.minConfidence !== undefined) {
      if (settings.minConfidence < 0 || settings.minConfidence > 1) {
        throw new Error('minConfidence muss zwischen 0 und 1 liegen');
      }
    }
    
    if (settings.excludePatterns !== undefined) {
      // Validiere Regex Patterns
      for (const pattern of settings.excludePatterns) {
        try {
          new RegExp(pattern);
        } catch {
          throw new Error(`Ungültiges Pattern: ${pattern}`);
        }
      }
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // SHOULD STORE CHECK
  // ─────────────────────────────────────────────────────────────────────────────
  
  async shouldStore(
    userId: string, 
    content: string, 
    type: MemoryType
  ): Promise<boolean> {
    const settings = await this.getSettings(userId);
    
    // Memory komplett deaktiviert?
    if (!settings.enabled) {
      return false;
    }
    
    // Typ-spezifische Prüfung
    if (type === 'CONVERSATION' && !settings.conversationMemory) return false;
    if (type === 'FACT' && !settings.factMemory) return false;
    if (type === 'PREFERENCE' && !settings.preferenceMemory) return false;
    
    // Exclude Patterns prüfen
    for (const pattern of settings.excludePatterns) {
      try {
        if (new RegExp(pattern, 'i').test(content)) {
          logger.debug(`Content excluded by pattern: ${pattern}`);
          return false;
        }
      } catch {
        // Ignore invalid patterns
      }
    }
    
    // Max Memories prüfen
    const count = await this.getMemoryCount(userId);
    if (count >= settings.maxMemories) {
      // Versuche alte Memories zu löschen
      await this.pruneOldMemories(userId, settings);
    }
    
    return true;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // GET MEMORY COUNT
  // ─────────────────────────────────────────────────────────────────────────────
  
  private async getMemoryCount(userId: string): Promise<number> {
    const result = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM memories WHERE user_id = ${userId}
    `;
    return Number(result[0]?.count || 0);
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // PRUNE OLD MEMORIES
  // ─────────────────────────────────────────────────────────────────────────────
  
  private async pruneOldMemories(
    userId: string, 
    settings: MemorySettings
  ): Promise<number> {
    const toDelete = Math.floor(settings.maxMemories * 0.1); // 10%
    
    const result = await prisma.$executeRaw`
      DELETE FROM memories
      WHERE id IN (
        SELECT id FROM memories
        WHERE user_id = ${userId}
        ORDER BY importance ASC, created_at ASC
        LIMIT ${toDelete}
      )
    `;
    
    logger.info(`Pruned ${result} old memories for user ${userId}`);
    return result;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // EXPORT MEMORIES
  // ─────────────────────────────────────────────────────────────────────────────
  
  async exportMemories(userId: string): Promise<string> {
    const settings = await this.getSettings(userId);
    
    const memories = await prisma.$queryRaw<any[]>`
      SELECT type, content, importance, created_at
      FROM memories
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    
    const exportData = memories.map((m) => ({
      type: m.type,
      content: settings.anonymizeExports 
        ? this.anonymize(m.content) 
        : m.content,
      importance: m.importance,
      createdAt: m.created_at,
    }));
    
    return JSON.stringify(exportData, null, 2);
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ANONYMIZE CONTENT
  // ─────────────────────────────────────────────────────────────────────────────
  
  private anonymize(text: string): string {
    // E-Mail Adressen
    text = text.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
    
    // Telefonnummern
    text = text.replace(/\+?[\d\s-]{10,}/g, '[PHONE]');
    
    // URLs
    text = text.replace(/https?:\/\/[^\s]+/g, '[URL]');
    
    // IBANs
    text = text.replace(/[A-Z]{2}\d{2}[\s]?[\dA-Z]{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{0,2}/gi, '[IBAN]');
    
    // Kreditkarten (vereinfacht)
    text = text.replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '[CARD]');
    
    return text;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE ALL MEMORIES
  // ─────────────────────────────────────────────────────────────────────────────
  
  async deleteAllMemories(userId: string): Promise<{ deleted: number }> {
    const result = await prisma.$executeRaw`
      DELETE FROM memories WHERE user_id = ${userId}
    `;
    
    // Settings zurücksetzen
    await this.updateSettings(userId, {
      ...DEFAULT_SETTINGS,
    });
    
    logger.info(`Deleted all memories for user ${userId}`);
    
    return { deleted: result };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const memorySettingsService = new MemorySettingsService();

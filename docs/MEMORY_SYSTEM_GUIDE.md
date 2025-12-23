# 🧠 AI Arena - Memory System Dokumentation

## Vollständige Anleitung für Erweiterung, Vektor-Suche & User-Konfiguration

---

## Inhaltsverzeichnis

1. [Architektur-Übersicht](#1-architektur-übersicht)
2. [Vektor-Suche im Detail](#2-vektor-suche-im-detail)
3. [Memory-System erweitern](#3-memory-system-erweitern)
4. [User-spezifische Konfiguration](#4-user-spezifische-konfiguration)
5. [API Endpoints](#5-api-endpoints)
6. [Frontend Integration](#6-frontend-integration)
7. [Best Practices](#7-best-practices)

---

## 1. Architektur-Übersicht

### Das Memory-System besteht aus 4 Schichten:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MEMORY ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        SCHICHT 1: API                                │   │
│  │                                                                      │   │
│  │   POST /api/memory/store     - Speichern                            │   │
│  │   GET  /api/memory/recall    - Abrufen (semantisch)                 │   │
│  │   GET  /api/memory/context   - Kontext für Chat laden               │   │
│  │   PUT  /api/memory/settings  - User-Einstellungen                   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     SCHICHT 2: MEMORY SERVICE                        │   │
│  │                     backend/src/services/memory.ts                   │   │
│  │                                                                      │   │
│  │   • store()      - Verschlüsseln + Embedding + Speichern            │   │
│  │   • recall()     - Semantische Suche mit pgvector                   │   │
│  │   • extract()    - KI extrahiert Infos aus Gespräch                 │   │
│  │   • decay()      - Automatisches Vergessen (Cron)                   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     SCHICHT 3: SERVICES                              │   │
│  │                                                                      │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│  │   │ Encryption   │  │  Embeddings  │  │  OpenRouter  │             │   │
│  │   │   Service    │  │   Service    │  │   Service    │             │   │
│  │   │              │  │              │  │              │             │   │
│  │   │ AES-256-GCM  │  │ OpenAI       │  │ KI für       │             │   │
│  │   │ Encrypt/     │  │ text-embed-  │  │ Extraktion   │             │   │
│  │   │ Decrypt      │  │ ding-3-small │  │              │             │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘             │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     SCHICHT 4: STORAGE                               │   │
│  │                                                                      │   │
│  │   ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐         │   │
│  │   │   PostgreSQL     │  │    Redis     │  │    MinIO     │         │   │
│  │   │   + pgvector     │  │              │  │              │         │   │
│  │   │                  │  │              │  │              │         │   │
│  │   │ • Memory Table   │  │ • Session    │  │ • Backups    │         │   │
│  │   │ • Vector Index   │  │ • Cache      │  │ • Exports    │         │   │
│  │   │ • Encrypted      │  │ • Temp Data  │  │              │         │   │
│  │   └──────────────────┘  └──────────────┘  └──────────────┘         │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Vektor-Suche im Detail

### 2.1 Was sind Embeddings?

Embeddings sind numerische Repräsentationen von Text. Ähnliche Texte haben ähnliche Vektoren.

```
"Ich arbeite an einem React Projekt"
    ↓
[0.023, -0.156, 0.892, ..., 0.445]  // 1536 Dimensionen

"Mein Frontend nutzt React"
    ↓
[0.019, -0.148, 0.901, ..., 0.451]  // Sehr ähnlich!

"Ich mag Pizza"
    ↓
[-0.234, 0.567, 0.123, ..., -0.789]  // Komplett anders
```

### 2.2 Wie funktioniert die Vektor-Suche?

```typescript
// backend/src/services/memory.ts

class MemoryService {
  
  // ════════════════════════════════════════════════════════════════════════
  // SCHRITT 1: SPEICHERN MIT EMBEDDING
  // ════════════════════════════════════════════════════════════════════════
  
  async store(params: {
    userId: string;
    content: string;
    type: MemoryType;
  }) {
    // 1. Text → Vektor (über OpenAI)
    const embedding = await this.embeddingsService.create(params.content);
    // embedding = [0.023, -0.156, 0.892, ..., 0.445] (1536 floats)
    
    // 2. Content verschlüsseln
    const encrypted = this.encryption.encrypt(params.content);
    
    // 3. In PostgreSQL mit pgvector speichern
    await prisma.$executeRaw`
      INSERT INTO memories (id, user_id, type, content, embedding)
      VALUES (
        ${generateId()},
        ${params.userId},
        ${params.type},
        ${encrypted},
        ${embedding}::vector
      )
    `;
  }
  
  // ════════════════════════════════════════════════════════════════════════
  // SCHRITT 2: SEMANTISCHE SUCHE
  // ════════════════════════════════════════════════════════════════════════
  
  async recall(params: {
    userId: string;
    query: string;
    limit?: number;
    minSimilarity?: number;
  }) {
    // 1. Query → Vektor
    const queryEmbedding = await this.embeddingsService.create(params.query);
    
    // 2. Cosine Similarity Suche mit pgvector
    //    Der <=> Operator berechnet die Distanz zwischen Vektoren
    //    1 - Distanz = Similarity (0-1)
    
    const memories = await prisma.$queryRaw`
      SELECT 
        id,
        type,
        content,
        importance,
        created_at,
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM memories
      WHERE user_id = ${params.userId}
        AND 1 - (embedding <=> ${queryEmbedding}::vector) > ${params.minSimilarity || 0.7}
      ORDER BY similarity DESC
      LIMIT ${params.limit || 10}
    `;
    
    // 3. Entschlüsseln und zurückgeben
    return memories.map(m => ({
      ...m,
      content: this.encryption.decrypt(m.content),
    }));
  }
}
```

### 2.3 Cosine Similarity erklärt

```
                    Vektor A (Query)
                         ↗
                        /
                       /  θ = Winkel
                      /
                     /
    ─────────────────●─────────────────→ Vektor B (Memory)
                   Origin

Cosine Similarity = cos(θ)

• cos(0°)   = 1.0  → Identisch
• cos(45°)  = 0.7  → Sehr ähnlich  
• cos(90°)  = 0.0  → Unrelated
• cos(180°) = -1.0 → Gegenteil
```

### 2.4 PostgreSQL pgvector Setup

```sql
-- Extension aktivieren
CREATE EXTENSION IF NOT EXISTS vector;

-- Memory Tabelle mit Vektor-Spalte
CREATE TABLE memories (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,  -- Verschlüsselt
  embedding vector(1536), -- OpenAI Embedding Dimension
  importance FLOAT DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW Index für schnelle Suche (Approximate Nearest Neighbor)
CREATE INDEX ON memories 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Exakte Suche (langsamer, genauer)
CREATE INDEX ON memories 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### 2.5 Performance-Tipps

| Methode | Geschwindigkeit | Genauigkeit | Wann verwenden |
|---------|-----------------|-------------|----------------|
| **HNSW** | ⚡ Sehr schnell | ~95% | Production, >10k Einträge |
| **IVFFlat** | 🔶 Mittel | ~90% | Medium-sized Datasets |
| **Exakt** | 🐢 Langsam | 100% | <1000 Einträge, Testing |

```typescript
// HNSW mit ef_search Parameter für Speed/Accuracy Trade-off
const memories = await prisma.$queryRaw`
  SET hnsw.ef_search = 100;  -- Höher = genauer, langsamer
  
  SELECT * FROM memories
  WHERE user_id = ${userId}
  ORDER BY embedding <=> ${queryVector}::vector
  LIMIT 10;
`;
```

---

## 3. Memory-System erweitern

### 3.1 Neue Memory-Typen hinzufügen

```typescript
// 1. Enum in Prisma Schema erweitern (prisma/schema.prisma)

enum MemoryType {
  CONVERSATION  // Bestehend
  PREFERENCE    // Bestehend
  FACT          // Bestehend
  CONTEXT       // Bestehend
  PROJECT       // Bestehend
  
  // NEU:
  SKILL         // Technische Fähigkeiten
  RELATIONSHIP  // Beziehungen (Kollegen, etc.)
  GOAL          // Ziele und Vorhaben
  FEEDBACK      // Feedback zu AI-Antworten
}

// 2. Service erweitern (services/memory.ts)

async storeSkill(userId: string, skill: {
  name: string;
  level: 'beginner' | 'intermediate' | 'expert';
  context?: string;
}) {
  const content = `User hat ${skill.level} Kenntnisse in ${skill.name}. ${skill.context || ''}`;
  
  await this.store({
    userId,
    content,
    type: 'SKILL',
    importance: 0.8,  // Skills sind wichtig
    metadata: { skillName: skill.name, level: skill.level }
  });
}

// 3. Spezielle Recall-Methode

async recallSkills(userId: string, domain?: string) {
  const query = domain 
    ? `Technische Fähigkeiten im Bereich ${domain}`
    : 'Alle technischen Fähigkeiten und Kenntnisse';
    
  return this.recall({
    userId,
    query,
    types: ['SKILL'],
    limit: 20,
  });
}
```

### 3.2 Memory Decay (Vergessen) implementieren

```typescript
// services/memory.ts

class MemoryService {
  
  // ════════════════════════════════════════════════════════════════════════
  // AUTOMATISCHES VERGESSEN
  // ════════════════════════════════════════════════════════════════════════
  
  /**
   * Reduziert Importance von alten, nicht genutzten Memories
   * Sollte als Cron-Job laufen (täglich)
   */
  async decayMemories() {
    const decayRate = 0.05;  // 5% pro Tag
    const minImportance = 0.1;  // Unter diesem Wert → Löschen
    
    // 1. Importance reduzieren
    await prisma.$executeRaw`
      UPDATE memories
      SET importance = GREATEST(importance * ${1 - decayRate}, ${minImportance})
      WHERE last_accessed_at < NOW() - INTERVAL '7 days'
        AND type NOT IN ('PREFERENCE', 'FACT')  -- Fakten vergessen nicht
    `;
    
    // 2. Sehr unwichtige Memories löschen
    await prisma.$executeRaw`
      DELETE FROM memories
      WHERE importance < ${minImportance}
        AND type = 'CONVERSATION'
        AND created_at < NOW() - INTERVAL '30 days'
    `;
    
    // 3. Access bei Nutzung erhöhen
    // (wird in recall() aufgerufen)
  }
  
  /**
   * Erhöht Importance wenn Memory genutzt wird
   */
  async reinforceMemory(memoryId: string) {
    await prisma.memory.update({
      where: { id: memoryId },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
        importance: { increment: 0.1 },  // Max 1.0
      }
    });
  }
}
```

### 3.3 Cron Job Setup

```typescript
// backend/src/jobs/memoryDecay.ts

import cron from 'node-cron';
import { memoryService } from '../services/memory';

// Täglich um 3:00 Uhr
cron.schedule('0 3 * * *', async () => {
  console.log('🧠 Running memory decay...');
  
  try {
    await memoryService.decayMemories();
    console.log('✅ Memory decay completed');
  } catch (error) {
    console.error('❌ Memory decay failed:', error);
  }
});
```

### 3.4 Memory Consolidation (Zusammenfassung)

```typescript
// services/memory.ts

/**
 * Fasst ähnliche Memories zusammen
 * Reduziert Redundanz und spart Speicher
 */
async consolidateMemories(userId: string) {
  // 1. Finde ähnliche Memories
  const memories = await prisma.memory.findMany({
    where: { userId, type: 'CONVERSATION' },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  
  // 2. Gruppiere nach Similarity
  const clusters = await this.clusterBySimilarity(memories, 0.85);
  
  // 3. Für jeden Cluster: KI erstellt Zusammenfassung
  for (const cluster of clusters) {
    if (cluster.length < 3) continue;  // Nur wenn genug Einträge
    
    const summary = await this.openrouter.chat({
      model: 'anthropic/claude-3-haiku',  // Günstig für Summaries
      messages: [{
        role: 'user',
        content: `Fasse diese Informationen in einem Satz zusammen:
          ${cluster.map(m => m.content).join('\n')}
          
          Wichtig: Behalte alle wichtigen Fakten.`
      }]
    });
    
    // 4. Neues konsolidiertes Memory erstellen
    await this.store({
      userId,
      content: summary,
      type: 'FACT',
      importance: 0.9,
      metadata: { 
        consolidatedFrom: cluster.map(m => m.id),
        consolidatedAt: new Date()
      }
    });
    
    // 5. Alte Memories löschen
    await prisma.memory.deleteMany({
      where: { id: { in: cluster.map(m => m.id) } }
    });
  }
}
```

---

## 4. User-spezifische Konfiguration

### 4.1 Memory Settings Schema

```prisma
// prisma/schema.prisma

model UserMemorySettings {
  id        String @id @default(uuid())
  userId    String @unique
  user      User   @relation(fields: [userId], references: [id])
  
  // ══════════════════════════════════════════════════════════════
  // FEATURE TOGGLES
  // ══════════════════════════════════════════════════════════════
  
  enabled              Boolean @default(true)   // Memory komplett an/aus
  conversationMemory   Boolean @default(true)   // Gespräche merken
  factMemory           Boolean @default(true)   // Fakten merken
  preferenceMemory     Boolean @default(true)   // Präferenzen merken
  crossChatMemory      Boolean @default(true)   // Über Chats hinweg
  
  // ══════════════════════════════════════════════════════════════
  // RETENTION SETTINGS
  // ══════════════════════════════════════════════════════════════
  
  retentionDays        Int     @default(365)    // Wie lange behalten
  maxMemories          Int     @default(1000)   // Max Anzahl
  autoConsolidate      Boolean @default(true)   // Auto-Zusammenfassung
  
  // ══════════════════════════════════════════════════════════════
  // PRIVACY SETTINGS
  // ══════════════════════════════════════════════════════════════
  
  shareWithTeam        Boolean @default(false)  // Team kann sehen
  anonymizeExports     Boolean @default(true)   // Export anonymisiert
  excludePatterns      String[] @default([])    // Regex zum Ausschließen
  
  // ══════════════════════════════════════════════════════════════
  // EXTRACTION SETTINGS
  // ══════════════════════════════════════════════════════════════
  
  autoExtract          Boolean @default(true)   // Auto-Extraktion an
  extractionFrequency  String  @default("per_chat") // per_chat, per_message, manual
  minConfidence        Float   @default(0.7)    // Min Confidence für Auto-Extract
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("user_memory_settings")
}
```

### 4.2 Settings Service

```typescript
// services/memorySettings.ts

export class MemorySettingsService {
  
  // ══════════════════════════════════════════════════════════════════════
  // DEFAULT SETTINGS
  // ══════════════════════════════════════════════════════════════════════
  
  private defaultSettings = {
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
  
  // ══════════════════════════════════════════════════════════════════════
  // GET SETTINGS
  // ══════════════════════════════════════════════════════════════════════
  
  async getSettings(userId: string) {
    let settings = await prisma.userMemorySettings.findUnique({
      where: { userId }
    });
    
    if (!settings) {
      // Erstelle Default Settings
      settings = await prisma.userMemorySettings.create({
        data: { userId, ...this.defaultSettings }
      });
    }
    
    return settings;
  }
  
  // ══════════════════════════════════════════════════════════════════════
  // UPDATE SETTINGS
  // ══════════════════════════════════════════════════════════════════════
  
  async updateSettings(userId: string, updates: Partial<UserMemorySettings>) {
    // Validierung
    if (updates.retentionDays && updates.retentionDays < 1) {
      throw new Error('retentionDays muss mindestens 1 sein');
    }
    
    if (updates.maxMemories && updates.maxMemories < 100) {
      throw new Error('maxMemories muss mindestens 100 sein');
    }
    
    return prisma.userMemorySettings.upsert({
      where: { userId },
      update: updates,
      create: { userId, ...this.defaultSettings, ...updates }
    });
  }
  
  // ══════════════════════════════════════════════════════════════════════
  // CHECK IF SHOULD STORE
  // ══════════════════════════════════════════════════════════════════════
  
  async shouldStore(userId: string, content: string, type: MemoryType): Promise<boolean> {
    const settings = await this.getSettings(userId);
    
    // Memory komplett deaktiviert?
    if (!settings.enabled) return false;
    
    // Typ deaktiviert?
    if (type === 'CONVERSATION' && !settings.conversationMemory) return false;
    if (type === 'FACT' && !settings.factMemory) return false;
    if (type === 'PREFERENCE' && !settings.preferenceMemory) return false;
    
    // Exclude Patterns prüfen
    for (const pattern of settings.excludePatterns) {
      if (new RegExp(pattern, 'i').test(content)) {
        return false;
      }
    }
    
    // Max Memories erreicht?
    const count = await prisma.memory.count({ where: { userId } });
    if (count >= settings.maxMemories) {
      // Älteste unwichtige löschen
      await this.pruneOldMemories(userId);
    }
    
    return true;
  }
  
  // ══════════════════════════════════════════════════════════════════════
  // PRUNE OLD MEMORIES
  // ══════════════════════════════════════════════════════════════════════
  
  private async pruneOldMemories(userId: string) {
    const settings = await this.getSettings(userId);
    
    // Lösche 10% der ältesten, unwichtigsten Memories
    const toDelete = Math.floor(settings.maxMemories * 0.1);
    
    await prisma.$executeRaw`
      DELETE FROM memories
      WHERE id IN (
        SELECT id FROM memories
        WHERE user_id = ${userId}
        ORDER BY importance ASC, created_at ASC
        LIMIT ${toDelete}
      )
    `;
  }
  
  // ══════════════════════════════════════════════════════════════════════
  // EXPORT USER MEMORIES
  // ══════════════════════════════════════════════════════════════════════
  
  async exportMemories(userId: string): Promise<string> {
    const settings = await this.getSettings(userId);
    const memories = await prisma.memory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    let exportData = memories.map(m => ({
      type: m.type,
      content: settings.anonymizeExports 
        ? this.anonymize(m.content)
        : m.content,
      importance: m.importance,
      createdAt: m.createdAt,
    }));
    
    return JSON.stringify(exportData, null, 2);
  }
  
  private anonymize(text: string): string {
    // E-Mails entfernen
    text = text.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
    // Telefonnummern
    text = text.replace(/\+?[\d\s-]{10,}/g, '[PHONE]');
    // Namen (vereinfacht)
    text = text.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]');
    
    return text;
  }
  
  // ══════════════════════════════════════════════════════════════════════
  // DELETE ALL USER MEMORIES
  // ══════════════════════════════════════════════════════════════════════
  
  async deleteAllMemories(userId: string) {
    await prisma.memory.deleteMany({ where: { userId } });
    
    // Settings zurücksetzen aber behalten
    await this.updateSettings(userId, this.defaultSettings);
    
    return { deleted: true };
  }
}
```

### 4.3 Exclude Patterns Beispiele

```typescript
// User möchte bestimmte Themen nicht speichern

const excludePatterns = [
  // Passwörter und Secrets
  'password|passwort|secret|token|api.key',
  
  // Persönliche Daten
  'kreditkarte|credit.card|iban|social.security',
  
  // Bestimmte Projekte
  'projekt.geheim|confidential.project',
  
  // Medizinische Infos
  'diagnose|medikament|arzt|krankenhaus',
];

await memorySettings.updateSettings(userId, {
  excludePatterns
});
```

---

## 5. API Endpoints

### 5.1 Memory API Routes

```typescript
// backend/src/api/memory.ts

import { FastifyInstance } from 'fastify';
import { memoryService } from '../services/memory';
import { memorySettingsService } from '../services/memorySettings';

export async function memoryRoutes(fastify: FastifyInstance) {
  
  // ══════════════════════════════════════════════════════════════════════
  // GET /api/memory - Alle Memories abrufen
  // ══════════════════════════════════════════════════════════════════════
  
  fastify.get('/memory', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { type, limit, offset } = request.query;
    
    const memories = await prisma.memory.findMany({
      where: { 
        userId,
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit || 50,
      skip: offset || 0,
    });
    
    return { memories };
  });
  
  // ══════════════════════════════════════════════════════════════════════
  // POST /api/memory/recall - Semantische Suche
  // ══════════════════════════════════════════════════════════════════════
  
  fastify.post('/memory/recall', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string' },
          types: { type: 'array', items: { type: 'string' } },
          limit: { type: 'number', default: 10 },
          minSimilarity: { type: 'number', default: 0.7 },
        }
      }
    }
  }, async (request, reply) => {
    const { userId } = request.user;
    const { query, types, limit, minSimilarity } = request.body;
    
    const memories = await memoryService.recall({
      userId,
      query,
      types,
      limit,
      minSimilarity,
    });
    
    return { memories };
  });
  
  // ══════════════════════════════════════════════════════════════════════
  // GET /api/memory/context/:chatId - Kontext für Chat
  // ══════════════════════════════════════════════════════════════════════
  
  fastify.get('/memory/context/:chatId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { chatId } = request.params;
    
    // Letzte Nachricht des Chats holen
    const lastMessage = await prisma.message.findFirst({
      where: { chatId, role: 'USER' },
      orderBy: { createdAt: 'desc' },
    });
    
    if (!lastMessage) {
      return { context: [] };
    }
    
    const context = await memoryService.getContextForChat(
      userId, 
      lastMessage.content
    );
    
    return { context };
  });
  
  // ══════════════════════════════════════════════════════════════════════
  // DELETE /api/memory/:id - Einzelnes Memory löschen
  // ══════════════════════════════════════════════════════════════════════
  
  fastify.delete('/memory/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { id } = request.params;
    
    // Sicherstellen, dass Memory dem User gehört
    const memory = await prisma.memory.findFirst({
      where: { id, userId }
    });
    
    if (!memory) {
      return reply.status(404).send({ error: 'Memory not found' });
    }
    
    await prisma.memory.delete({ where: { id } });
    
    return { deleted: true };
  });
  
  // ══════════════════════════════════════════════════════════════════════
  // SETTINGS ENDPOINTS
  // ══════════════════════════════════════════════════════════════════════
  
  // GET /api/memory/settings
  fastify.get('/memory/settings', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const settings = await memorySettingsService.getSettings(userId);
    return { settings };
  });
  
  // PUT /api/memory/settings
  fastify.put('/memory/settings', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const updates = request.body;
    
    const settings = await memorySettingsService.updateSettings(userId, updates);
    return { settings };
  });
  
  // POST /api/memory/export
  fastify.post('/memory/export', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const exportData = await memorySettingsService.exportMemories(userId);
    
    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', 'attachment; filename=memories-export.json');
    
    return exportData;
  });
  
  // DELETE /api/memory/all
  fastify.delete('/memory/all', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    await memorySettingsService.deleteAllMemories(userId);
    return { deleted: true };
  });
}
```

---

## 6. Frontend Integration

### 6.1 Memory Settings Page

```tsx
// pages/MemorySettingsPage.tsx

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Brain, 
  Shield, 
  Clock, 
  Download, 
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle
} from 'lucide-react';
import api from '@/utils/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';

export function MemorySettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Fetch Settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['memorySettings'],
    queryFn: () => api.get('/memory/settings').then(r => r.data.settings),
  });
  
  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (updates: any) => api.put('/memory/settings', updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['memorySettings']);
      toast.success('Einstellungen gespeichert');
    },
  });
  
  // Delete All Mutation
  const deleteAllMutation = useMutation({
    mutationFn: () => api.delete('/memory/all'),
    onSuccess: () => {
      queryClient.invalidateQueries(['memorySettings']);
      toast.success('Alle Erinnerungen gelöscht');
    },
  });
  
  if (isLoading) return <MemorySettingsSkeleton />;
  
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain className="h-6 w-6 text-cyan-400" />
          Memory-Einstellungen
        </h1>
        <p className="text-slate-400 mt-1">
          Kontrolliere, was sich die AI Arena über dich merkt
        </p>
      </div>
      
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* HAUPTSCHALTER */}
      {/* ══════════════════════════════════════════════════════════════ */}
      
      <Card variant={settings.enabled ? 'gradient' : 'default'}>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Memory System
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              {settings.enabled 
                ? 'Die Arena lernt aus deinen Gesprächen' 
                : 'Kein Lernen aus Gesprächen'}
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => updateMutation.mutate({ enabled })}
            size="lg"
          />
        </CardContent>
      </Card>
      
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MEMORY-TYPEN */}
      {/* ══════════════════════════════════════════════════════════════ */}
      
      <Card>
        <CardHeader>
          <CardTitle>Was soll gemerkt werden?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            title="Gesprächsverlauf"
            description="Kontext aus früheren Chats"
            checked={settings.conversationMemory}
            disabled={!settings.enabled}
            onChange={(v) => updateMutation.mutate({ conversationMemory: v })}
          />
          <SettingRow
            title="Fakten"
            description="Wichtige Informationen über dich"
            checked={settings.factMemory}
            disabled={!settings.enabled}
            onChange={(v) => updateMutation.mutate({ factMemory: v })}
          />
          <SettingRow
            title="Präferenzen"
            description="Deine Vorlieben und Arbeitsweise"
            checked={settings.preferenceMemory}
            disabled={!settings.enabled}
            onChange={(v) => updateMutation.mutate({ preferenceMemory: v })}
          />
          <SettingRow
            title="Chat-übergreifend"
            description="Wissen zwischen verschiedenen Chats teilen"
            checked={settings.crossChatMemory}
            disabled={!settings.enabled}
            onChange={(v) => updateMutation.mutate({ crossChatMemory: v })}
          />
        </CardContent>
      </Card>
      
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* AUFBEWAHRUNG */}
      {/* ══════════════════════════════════════════════════════════════ */}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-400" />
            Aufbewahrung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Speicherdauer</p>
              <p className="text-sm text-slate-400">
                Wie lange Erinnerungen behalten werden
              </p>
            </div>
            <select
              value={settings.retentionDays}
              onChange={(e) => updateMutation.mutate({ 
                retentionDays: parseInt(e.target.value) 
              })}
              className="input w-32"
              disabled={!settings.enabled}
            >
              <option value={30}>30 Tage</option>
              <option value={90}>90 Tage</option>
              <option value={180}>180 Tage</option>
              <option value={365}>1 Jahr</option>
              <option value={730}>2 Jahre</option>
              <option value={9999}>Unbegrenzt</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Maximale Anzahl</p>
              <p className="text-sm text-slate-400">
                Alte werden automatisch entfernt
              </p>
            </div>
            <Input
              type="number"
              value={settings.maxMemories}
              onChange={(e) => updateMutation.mutate({ 
                maxMemories: parseInt(e.target.value) 
              })}
              className="w-32"
              min={100}
              max={10000}
              disabled={!settings.enabled}
            />
          </div>
          
          <SettingRow
            title="Automatisch zusammenfassen"
            description="Ähnliche Erinnerungen werden konsolidiert"
            checked={settings.autoConsolidate}
            disabled={!settings.enabled}
            onChange={(v) => updateMutation.mutate({ autoConsolidate: v })}
          />
        </CardContent>
      </Card>
      
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* PRIVACY */}
      {/* ══════════════════════════════════════════════════════════════ */}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-400" />
            Datenschutz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            title="Mit Team teilen"
            description="Team-Mitglieder können relevante Erinnerungen sehen"
            checked={settings.shareWithTeam}
            disabled={!settings.enabled}
            onChange={(v) => updateMutation.mutate({ shareWithTeam: v })}
          />
          <SettingRow
            title="Export anonymisieren"
            description="Persönliche Daten werden beim Export entfernt"
            checked={settings.anonymizeExports}
            disabled={!settings.enabled}
            onChange={(v) => updateMutation.mutate({ anonymizeExports: v })}
          />
        </CardContent>
      </Card>
      
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* AKTIONEN */}
      {/* ══════════════════════════════════════════════════════════════ */}
      
      <Card>
        <CardHeader>
          <CardTitle>Aktionen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="secondary"
            className="w-full justify-start"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => {
              window.open('/api/memory/export', '_blank');
            }}
          >
            Erinnerungen exportieren
          </Button>
          
          <Button
            variant="destructive"
            className="w-full justify-start"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => {
              if (confirm('Wirklich ALLE Erinnerungen löschen? Dies kann nicht rückgängig gemacht werden.')) {
                deleteAllMutation.mutate();
              }
            }}
          >
            Alle Erinnerungen löschen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Component
function SettingRow({ title, description, checked, disabled, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className={disabled ? 'opacity-50' : ''}>
        <p className="font-medium text-white">{title}</p>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
```

### 6.2 Memory Viewer Component

```tsx
// components/memory/MemoryViewer.tsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Brain, 
  Search, 
  Trash2, 
  Clock,
  Star,
  MessageSquare,
  Heart,
  Lightbulb
} from 'lucide-react';
import api from '@/utils/api';
import { formatRelativeTime } from '@/lib/utils';

const typeConfig = {
  CONVERSATION: { icon: MessageSquare, label: 'Gespräch', color: 'cyan' },
  FACT: { icon: Lightbulb, label: 'Fakt', color: 'green' },
  PREFERENCE: { icon: Heart, label: 'Präferenz', color: 'pink' },
  SKILL: { icon: Star, label: 'Skill', color: 'amber' },
};

export function MemoryViewer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // Fetch Memories
  const { data: memories, isLoading } = useQuery({
    queryKey: ['memories', selectedType],
    queryFn: () => api.get('/memory', { 
      params: { type: selectedType } 
    }).then(r => r.data.memories),
  });
  
  // Search Memories (Semantic)
  const { data: searchResults } = useQuery({
    queryKey: ['memorySearch', searchQuery],
    queryFn: () => api.post('/memory/recall', { 
      query: searchQuery,
      limit: 20 
    }).then(r => r.data.memories),
    enabled: searchQuery.length > 2,
  });
  
  const displayMemories = searchQuery.length > 2 ? searchResults : memories;
  
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Erinnerungen durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>
      
      {/* Type Filter */}
      <div className="flex gap-2">
        <button
          className={`badge ${!selectedType ? 'badge-cyan' : 'bg-slate-800'}`}
          onClick={() => setSelectedType(null)}
        >
          Alle
        </button>
        {Object.entries(typeConfig).map(([type, config]) => (
          <button
            key={type}
            className={`badge ${selectedType === type ? `badge-${config.color}` : 'bg-slate-800'}`}
            onClick={() => setSelectedType(type)}
          >
            <config.icon className="h-3 w-3 mr-1" />
            {config.label}
          </button>
        ))}
      </div>
      
      {/* Memory List */}
      <div className="space-y-2">
        {displayMemories?.map((memory) => {
          const config = typeConfig[memory.type] || typeConfig.FACT;
          
          return (
            <div
              key={memory.id}
              className="card-interactive p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-${config.color}-500/10`}>
                    <config.icon className={`h-4 w-4 text-${config.color}-400`} />
                  </div>
                  <div>
                    <p className="text-white">{memory.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(memory.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {(memory.importance * 100).toFixed(0)}%
                      </span>
                      {memory.similarity && (
                        <span className="text-cyan-400">
                          {(memory.similarity * 100).toFixed(0)}% match
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  onClick={() => deleteMemory(memory.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 7. Best Practices

### 7.1 Performance

```typescript
// ✅ GUT: Batch Embeddings
const embeddings = await embeddingsService.createBatch([
  text1, text2, text3
]);

// ❌ SCHLECHT: Einzelne Requests
for (const text of texts) {
  await embeddingsService.create(text);  // Langsam!
}
```

### 7.2 Kosten optimieren

```typescript
// Embedding-Modell Kosten (OpenAI)
// text-embedding-3-small: $0.02 / 1M tokens (EMPFOHLEN)
// text-embedding-3-large: $0.13 / 1M tokens
// text-embedding-ada-002: $0.10 / 1M tokens

// Verwende das kleine Modell - reicht für die meisten Fälle
const embedding = await openai.embeddings.create({
  model: 'text-embedding-3-small',  // ✅
  input: text,
});
```

### 7.3 Privacy by Design

```typescript
// NIEMALS rohe Inhalte loggen
console.log('Storing memory:', memoryId);  // ✅
console.log('Storing memory:', content);   // ❌ NIEMALS!

// Immer verschlüsseln vor dem Speichern
const encrypted = encryption.encrypt(content);
await prisma.memory.create({
  data: { content: encrypted }  // ✅
});
```

### 7.4 Sinnvolle Defaults

```typescript
// Nicht alles speichern - nur Wichtiges
const shouldStore = 
  content.length > 50 &&           // Mindestlänge
  confidence > 0.7 &&              // Hohe Konfidenz
  !isSmallTalk(content) &&         // Kein Small Talk
  !containsSensitiveData(content); // Keine sensitiven Daten
```

---

## Zusammenfassung

| Komponente | Datei | Beschreibung |
|------------|-------|--------------|
| Memory Service | `services/memory.ts` | Kernlogik für Store/Recall |
| Settings Service | `services/memorySettings.ts` | User-Konfiguration |
| Embeddings Service | `services/embeddings.ts` | Vektor-Erstellung |
| Encryption Service | `services/encryption.ts` | AES-256-GCM |
| Memory API | `api/memory.ts` | REST Endpoints |
| Settings Page | `pages/MemorySettingsPage.tsx` | UI für Einstellungen |
| Memory Viewer | `components/memory/MemoryViewer.tsx` | UI zum Anzeigen |

---

*Letzte Aktualisierung: Dezember 2024*

// ════════════════════════════════════════════════════════════════════════════
// EMBEDDING SERVICE
// Generiert OpenAI Embeddings für Knowledge Base und Memory
// ════════════════════════════════════════════════════════════════════════════

import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import prisma from '../utils/prisma.js';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

// ════════════════════════════════════════════════════════════════════════════
// GENERATE SINGLE EMBEDDING
// ════════════════════════════════════════════════════════════════════════════

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!config.openai.apiKey) {
    logger.warn('OpenAI API key not configured, returning zero vector');
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text.substring(0, 8000), // Limit input length
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`OpenAI embedding error: ${response.status} - ${error}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    logger.error('Error generating embedding:', error);
    // Return zero vector as fallback
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GENERATE BATCH EMBEDDINGS
// ════════════════════════════════════════════════════════════════════════════

export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (!config.openai.apiKey || texts.length === 0) {
    return texts.map(() => new Array(EMBEDDING_DIMENSIONS).fill(0));
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts.map(t => t.substring(0, 8000)),
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.map((d: { embedding: number[] }) => d.embedding);
  } catch (error) {
    logger.error('Error generating batch embeddings:', error);
    return texts.map(() => new Array(EMBEDDING_DIMENSIONS).fill(0));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// VECTOR SIMILARITY SEARCH FOR KNOWLEDGE
// ════════════════════════════════════════════════════════════════════════════

export async function searchKnowledgeBySimilarity(
  query: string,
  options: {
    userId?: string;
    teamId?: string;
    limit?: number;
    minSimilarity?: number;
  } = {}
): Promise<Array<{
  id: string;
  content: string;
  source: string;
  tags: string[];
  status: string;
  similarity: number;
}>> {
  const { limit = 5, minSimilarity = 0.7 } = options;

  const queryEmbedding = await generateEmbedding(query);

  // Check if embedding is valid (not all zeros)
  if (queryEmbedding.every(v => v === 0)) {
    logger.warn('Query embedding is zero vector, falling back to text search');
    return [];
  }

  try {
    // Use pgvector cosine similarity
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    const results = await prisma.$queryRaw<Array<{
      id: string;
      content: string;
      source: string;
      tags: string[];
      status: string;
      similarity: number;
    }>>`
      SELECT
        id, content, source, tags, status,
        1 - (embedding <=> ${embeddingStr}::vector) as similarity
      FROM "KnowledgeEntry"
      WHERE embedding IS NOT NULL
        AND 1 - (embedding <=> ${embeddingStr}::vector) > ${minSimilarity}
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `;

    return results;
  } catch (error) {
    logger.error('Vector search error:', error);
    return [];
  }
}

// ════════════════════════════════════════════════════════════════════════════
// VECTOR SIMILARITY SEARCH FOR MEMORY
// ════════════════════════════════════════════════════════════════════════════

export async function searchMemoryBySimilarity(
  query: string,
  userId: string,
  options: { limit?: number; minSimilarity?: number } = {}
): Promise<Array<{
  id: string;
  type: string;
  key: string;
  value: string;
  similarity: number;
}>> {
  const { limit = 5, minSimilarity = 0.7 } = options;

  const queryEmbedding = await generateEmbedding(query);

  if (queryEmbedding.every(v => v === 0)) {
    return [];
  }

  try {
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    const results = await prisma.$queryRaw<Array<{
      id: string;
      type: string;
      key: string;
      value: string;
      similarity: number;
    }>>`
      SELECT
        id, type, key, value,
        1 - (embedding <=> ${embeddingStr}::vector) as similarity
      FROM "Memory"
      WHERE "userId" = ${userId}
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> ${embeddingStr}::vector) > ${minSimilarity}
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `;

    return results;
  } catch (error) {
    logger.error('Memory vector search error:', error);
    return [];
  }
}

// ════════════════════════════════════════════════════════════════════════════
// RETRIEVE RELEVANT CONTEXT FOR CHAT
// ════════════════════════════════════════════════════════════════════════════

export async function retrieveRelevantContext(
  query: string,
  userId: string,
  options: { includeKnowledge?: boolean; includeMemory?: boolean } = {}
): Promise<string> {
  const { includeKnowledge = true, includeMemory = true } = options;
  const contextParts: string[] = [];

  // Get relevant knowledge entries
  if (includeKnowledge) {
    const knowledge = await searchKnowledgeBySimilarity(query, { userId, limit: 3 });
    if (knowledge.length > 0) {
      contextParts.push('=== Relevantes Wissen ===');
      knowledge.forEach((k, i) => {
        contextParts.push(`[${i + 1}] ${k.content}`);
      });
    }
  }

  // Get relevant memories
  if (includeMemory) {
    const memories = await searchMemoryBySimilarity(query, userId, { limit: 3 });
    if (memories.length > 0) {
      contextParts.push('=== Erinnerungen ===');
      memories.forEach(m => {
        contextParts.push(`- ${m.key}: ${m.value}`);
      });
    }
  }

  return contextParts.join('\n');
}

export const embeddingService = {
  generateEmbedding,
  generateBatchEmbeddings,
  searchKnowledgeBySimilarity,
  searchMemoryBySimilarity,
  retrieveRelevantContext,
};

export default embeddingService;

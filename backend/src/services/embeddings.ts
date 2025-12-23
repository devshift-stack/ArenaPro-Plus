// AI Arena - Embeddings Service
// Text embeddings using OpenAI

import OpenAI from 'openai';
import { config } from '../config/index.js';
import { redis } from '../utils/redis.js';
import { encryptionService } from './encryption.js';

class EmbeddingService {
  private openai: OpenAI;
  private readonly model = 'text-embedding-3-small';
  private readonly dimensions = 1536;
  private readonly CACHE_TTL = 86400; // 24 hours

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
  }

  /**
   * Create embedding for text
   */
  async createEmbedding(text: string): Promise<number[]> {
    // Check cache
    const cacheKey = `embedding:${encryptionService.createHash(text)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Truncate if too long (8191 tokens max)
    const truncatedText = text.slice(0, 30000);

    const response = await this.openai.embeddings.create({
      model: this.model,
      input: truncatedText,
    });

    const embedding = response.data[0].embedding;

    // Cache result
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(embedding));

    return embedding;
  }

  /**
   * Create embeddings for multiple texts (batch)
   */
  async createBatchEmbeddings(texts: string[]): Promise<number[][]> {
    // Check cache for each
    const results: (number[] | null)[] = await Promise.all(
      texts.map(async (text) => {
        const cacheKey = `embedding:${encryptionService.createHash(text)}`;
        const cached = await redis.get(cacheKey);
        return cached ? JSON.parse(cached) : null;
      })
    );

    // Find texts that need embedding
    const toEmbed: { index: number; text: string }[] = [];
    texts.forEach((text, index) => {
      if (!results[index]) {
        toEmbed.push({ index, text: text.slice(0, 30000) });
      }
    });

    if (toEmbed.length > 0) {
      // Batch embed (max 2048 at once)
      const batchSize = 100;
      for (let i = 0; i < toEmbed.length; i += batchSize) {
        const batch = toEmbed.slice(i, i + batchSize);
        
        const response = await this.openai.embeddings.create({
          model: this.model,
          input: batch.map(t => t.text),
        });

        // Store results
        for (let j = 0; j < batch.length; j++) {
          const embedding = response.data[j].embedding;
          results[batch[j].index] = embedding;

          // Cache
          const cacheKey = `embedding:${encryptionService.createHash(batch[j].text)}`;
          await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(embedding));
        }
      }
    }

    return results as number[][];
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Find most similar items from a set
   */
  findMostSimilar(
    queryEmbedding: number[],
    candidates: { id: string; embedding: number[] }[],
    topK = 5
  ): { id: string; similarity: number }[] {
    const scored = candidates.map(c => ({
      id: c.id,
      similarity: this.cosineSimilarity(queryEmbedding, c.embedding),
    }));

    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, topK);
  }

  /**
   * Get embedding dimensions
   */
  getDimensions(): number {
    return this.dimensions;
  }
}

export const embeddingService = new EmbeddingService();

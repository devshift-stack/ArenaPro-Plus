import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config
vi.mock('../config/index.js', () => ({
  config: {
    openai: {
      apiKey: 'test-api-key',
      baseUrl: 'https://api.openai.com/v1',
    },
  },
}));

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock prisma
vi.mock('../utils/prisma.js', () => ({
  default: {
    $queryRaw: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('embeddingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateEmbedding', () => {
    it('should return embedding vector from OpenAI API', async () => {
      const mockEmbedding = Array(1536).fill(0.1);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ embedding: mockEmbedding }],
        }),
      });

      const { generateEmbedding } = await import('../services/embeddingService.js');
      const result = await generateEmbedding('test text');

      expect(result).toEqual(mockEmbedding);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/embeddings',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should return zero vector when API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      const { generateEmbedding } = await import('../services/embeddingService.js');
      const result = await generateEmbedding('test text');

      expect(result).toHaveLength(1536);
      expect(result.every(v => v === 0)).toBe(true);
    });

    it('should truncate input to 8000 characters', async () => {
      const longText = 'a'.repeat(10000);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ embedding: Array(1536).fill(0.1) }],
        }),
      });

      const { generateEmbedding } = await import('../services/embeddingService.js');
      await generateEmbedding(longText);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.input.length).toBe(8000);
    });
  });

  describe('generateBatchEmbeddings', () => {
    it('should return embeddings for multiple texts', async () => {
      const mockEmbeddings = [
        Array(1536).fill(0.1),
        Array(1536).fill(0.2),
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: mockEmbeddings.map(embedding => ({ embedding })),
        }),
      });

      const { generateBatchEmbeddings } = await import('../services/embeddingService.js');
      const result = await generateBatchEmbeddings(['text1', 'text2']);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockEmbeddings[0]);
      expect(result[1]).toEqual(mockEmbeddings[1]);
    });

    it('should return zero vectors for empty input', async () => {
      const { generateBatchEmbeddings } = await import('../services/embeddingService.js');
      const result = await generateBatchEmbeddings([]);

      expect(result).toEqual([]);
    });
  });
});

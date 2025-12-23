import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

interface UserStats {
  totalChats: number;
  totalMessages: number;
  totalTokens: number;
  estimatedCost: string;
}

interface KnowledgeStats {
  total: number;
  verified: number;
  beta: number;
  pending: number;
}

interface MemoryStats {
  facts: number;
  preferences: number;
  context: number;
}

export function useStats() {
  // Fetch user arena stats
  const {
    data: arenaStats,
    isLoading: isLoadingArenaStats,
    error: arenaError,
  } = useQuery({
    queryKey: ['arenaStats'],
    queryFn: async () => {
      const response = await api.get('/arena/stats');
      return response.data.stats as UserStats;
    },
    staleTime: 1000 * 60, // Cache for 1 minute
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  // Fetch knowledge base stats
  const {
    data: knowledgeStats,
    isLoading: isLoadingKnowledgeStats,
    error: knowledgeError,
  } = useQuery({
    queryKey: ['knowledgeStats'],
    queryFn: async () => {
      const response = await api.get('/knowledge/stats/overview');
      return response.data.stats as KnowledgeStats;
    },
    staleTime: 1000 * 60, // Cache for 1 minute
  });

  // Fetch memory stats
  const {
    data: memoryStats,
    isLoading: isLoadingMemoryStats,
    error: memoryError,
  } = useQuery({
    queryKey: ['memoryStats'],
    queryFn: async () => {
      const response = await api.get('/memory/stats');
      return response.data.stats as MemoryStats;
    },
    staleTime: 1000 * 60, // Cache for 1 minute
  });

  return {
    // Arena Stats
    arenaStats: arenaStats || {
      totalChats: 0,
      totalMessages: 0,
      totalTokens: 0,
      estimatedCost: '0.00',
    },
    isLoadingArenaStats,
    arenaError,

    // Knowledge Stats
    knowledgeStats: knowledgeStats || {
      total: 0,
      verified: 0,
      beta: 0,
      pending: 0,
    },
    isLoadingKnowledgeStats,
    knowledgeError,

    // Memory Stats
    memoryStats: memoryStats || {
      facts: 0,
      preferences: 0,
      context: 0,
    },
    isLoadingMemoryStats,
    memoryError,

    // Combined loading state
    isLoading: isLoadingArenaStats || isLoadingKnowledgeStats || isLoadingMemoryStats,
  };
}

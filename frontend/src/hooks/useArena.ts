import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import type { ArenaMode, Model, Chat } from '@/types';

interface CreateChatParams {
  title?: string;
  mode?: ArenaMode;
  modelIds?: string[];
}

interface ChangeModeParams {
  chatId: string;
  mode: ArenaMode;
}

export function useArena() {
  const queryClient = useQueryClient();

  // Fetch available models
  const {
    data: models = [],
    isLoading: isLoadingModels,
    error: modelsError,
  } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await api.get('/arena/models');
      return response.data.models as Model[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch arena modes configuration
  const {
    data: modesConfig,
    isLoading: isLoadingModes,
  } = useQuery({
    queryKey: ['arenaModes'],
    queryFn: async () => {
      const response = await api.get('/arena/modes');
      return response.data.modes;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Create new chat with arena mode
  const createChatMutation = useMutation({
    mutationFn: async (params: CreateChatParams) => {
      const response = await api.post('/chats', {
        title: params.title || 'Neuer Chat',
        mode: params.mode || 'auto-select',
        modelIds: params.modelIds,
      });
      return response.data as Chat;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  // Change arena mode for existing chat
  const changeModeMutation = useMutation({
    mutationFn: async ({ chatId, mode }: ChangeModeParams) => {
      const response = await api.post(`/arena/chats/${chatId}/mode`, { mode });
      return response.data;
    },
    onSuccess: (_data, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
    },
  });

  // Select models for chat
  const selectModelsMutation = useMutation({
    mutationFn: async ({ chatId, modelIds }: { chatId: string; modelIds: string[] }) => {
      const response = await api.post(`/arena/chats/${chatId}/models`, { modelIds });
      return response.data;
    },
    onSuccess: (_data, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
    },
  });

  // Get model recommendations for a task
  const getRecommendationsMutation = useMutation({
    mutationFn: async (taskDescription: string) => {
      const response = await api.post('/arena/recommend', { task: taskDescription });
      return response.data.recommendations as Array<{
        modelId: string;
        confidence: number;
        reason: string;
      }>;
    },
  });

  // Helper functions
  const getModelById = (modelId: string) => {
    return models.find((m) => m.id === modelId);
  };

  const getModelsByProvider = (provider: string) => {
    return models.filter((m) => m.provider.toLowerCase() === provider.toLowerCase());
  };

  const getModelsByCapability = (capability: string) => {
    return models.filter((m) => m.capabilities.includes(capability));
  };

  // Arena mode configurations
  const arenaModes = [
    {
      id: 'auto-select' as ArenaMode,
      name: 'Auto-Select',
      description: 'Arena wählt automatisch das beste Modell für deine Anfrage',
      icon: 'Sparkles',
      gradient: 'from-amber-500 to-orange-600',
      color: 'amber',
    },
    {
      id: 'collaborative' as ArenaMode,
      name: 'Collaborative',
      description: 'Mehrere Modelle arbeiten zusammen an deiner Anfrage',
      icon: 'Users',
      gradient: 'from-blue-500 to-cyan-500',
      color: 'blue',
    },
    {
      id: 'divide-conquer' as ArenaMode,
      name: 'Divide & Conquer',
      description: 'Aufgabe wird aufgeteilt und an Spezialisten verteilt',
      icon: 'GitBranch',
      gradient: 'from-purple-500 to-pink-500',
      color: 'purple',
    },
    {
      id: 'project' as ArenaMode,
      name: 'Project Mode',
      description: 'Für komplexe Projekte mit mehreren Phasen',
      icon: 'FolderKanban',
      gradient: 'from-green-500 to-emerald-500',
      color: 'green',
    },
    {
      id: 'tester' as ArenaMode,
      name: 'Tester Mode',
      description: 'Automatisierte Tests und Verifikation der Ergebnisse',
      icon: 'TestTube2',
      gradient: 'from-red-500 to-rose-500',
      color: 'red',
    },
  ];

  const getModeConfig = (modeId: ArenaMode) => {
    return arenaModes.find((m) => m.id === modeId);
  };

  return {
    // Models
    models,
    isLoadingModels,
    modelsError,
    getModelById,
    getModelsByProvider,
    getModelsByCapability,

    // Arena modes
    arenaModes,
    modesConfig,
    isLoadingModes,
    getModeConfig,

    // Actions
    createChat: createChatMutation.mutateAsync,
    isCreating: createChatMutation.isPending,

    changeMode: changeModeMutation.mutate,
    isChangingMode: changeModeMutation.isPending,

    selectModels: selectModelsMutation.mutate,
    isSelectingModels: selectModelsMutation.isPending,

    getRecommendations: getRecommendationsMutation.mutateAsync,
    isGettingRecommendations: getRecommendationsMutation.isPending,
    recommendations: getRecommendationsMutation.data,
  };
}

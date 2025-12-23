import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/contexts/WebSocketContext';
import api from '@/utils/api';
import type { Chat, Message } from '@/types';

interface UseChatOptions {
  chatId?: string;
}

export function useChat({ chatId }: UseChatOptions = {}) {
  const queryClient = useQueryClient();
  const { subscribe } = useWebSocket();
  const [isTyping, setIsTyping] = useState(false);
  const [typingModel, setTypingModel] = useState<string | null>(null);

  // Fetch single chat
  const {
    data: chat,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const response = await api.get(`/chats/${chatId}`);
      return response.data as Chat;
    },
    enabled: !!chatId,
  });

  // Fetch chat list
  const {
    data: chats = [],
    isLoading: isLoadingChats,
  } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const response = await api.get('/chats');
      return response.data.chats as Chat[];
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatId, content }: { chatId: string; content: string }) => {
      const response = await api.post(`/chats/${chatId}/messages`, { content });
      return response.data as Message;
    },
    onMutate: async ({ chatId, content }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['chat', chatId] });

      // Snapshot previous value
      const previousChat = queryClient.getQueryData<Chat>(['chat', chatId]);

      // Optimistically update
      if (previousChat) {
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`,
          chatId,
          role: 'user',
          content,
          createdAt: new Date().toISOString(),
        };

        queryClient.setQueryData<Chat>(['chat', chatId], {
          ...previousChat,
          messages: [...previousChat.messages, optimisticMessage],
        });
      }

      return { previousChat };
    },
    onError: (_err, { chatId }, context) => {
      // Rollback on error
      if (context?.previousChat) {
        queryClient.setQueryData(['chat', chatId], context.previousChat);
      }
    },
    onSettled: (_data, _err, { chatId }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
    },
  });

  // Create chat mutation
  const createChatMutation = useMutation({
    mutationFn: async (params: { title?: string; mode?: string }) => {
      const response = await api.post('/chats', params);
      return response.data as Chat;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      await api.delete(`/chats/${chatId}`);
      return chatId;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.removeQueries({ queryKey: ['chat', deletedId] });
    },
  });

  // Subscribe to real-time events
  useEffect(() => {
    if (!chatId) return;

    const unsubNewMessage = subscribe('message:new', (message: Message) => {
      if (message.chatId === chatId) {
        queryClient.setQueryData<Chat>(['chat', chatId], (old) => {
          if (!old) return old;
          // Avoid duplicates
          const exists = old.messages.some((m) => m.id === message.id);
          if (exists) return old;
          return {
            ...old,
            messages: [...old.messages, message],
          };
        });
      }
    });

    const unsubMessageUpdate = subscribe('message:update', (update: Partial<Message> & { id: string }) => {
      queryClient.setQueryData<Chat>(['chat', chatId], (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m) =>
            m.id === update.id ? { ...m, ...update } : m
          ),
        };
      });
    });

    const unsubTypingStart = subscribe('typing:start', ({ chatId: cId, modelId }: { chatId: string; modelId: string }) => {
      if (cId === chatId) {
        setIsTyping(true);
        setTypingModel(modelId);
      }
    });

    const unsubTypingStop = subscribe('typing:stop', ({ chatId: cId }: { chatId: string }) => {
      if (cId === chatId) {
        setIsTyping(false);
        setTypingModel(null);
      }
    });

    return () => {
      unsubNewMessage();
      unsubMessageUpdate();
      unsubTypingStart();
      unsubTypingStop();
    };
  }, [chatId, subscribe, queryClient]);

  // Send message helper
  const sendMessage = useCallback(
    (content: string) => {
      if (!chatId) return;
      sendMessageMutation.mutate({ chatId, content });
    },
    [chatId, sendMessageMutation]
  );

  return {
    // Single chat
    chat,
    messages: chat?.messages || [],
    isLoading,
    error,

    // Chat list
    chats,
    isLoadingChats,

    // Actions
    sendMessage,
    isSending: sendMessageMutation.isPending,

    createChat: createChatMutation.mutateAsync,
    isCreating: createChatMutation.isPending,

    deleteChat: deleteChatMutation.mutate,
    isDeleting: deleteChatMutation.isPending,

    // Real-time state
    isTyping,
    typingModel,
  };
}

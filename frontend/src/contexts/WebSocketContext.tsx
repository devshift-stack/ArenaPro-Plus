// AI Arena - WebSocket Context
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinChat: (chatId: string) => void;
  leaveChat: () => void;
  sendTyping: (chatId: string) => void;
  onMessage: (handler: (message: any) => void) => () => void;
  onProgress: (handler: (progress: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io(WS_URL, {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('accessToken'),
      },
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Authenticate
      newSocket.emit('auth', { userId: user.id });
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  const joinChat = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('join_chat', { chatId });
    }
  }, [socket, isConnected]);

  const leaveChat = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('leave_chat');
    }
  }, [socket, isConnected]);

  const sendTyping = useCallback((chatId: string) => {
    if (socket && isConnected && user) {
      socket.emit('typing', { chatId, userId: user.id });
    }
  }, [socket, isConnected, user]);

  const onMessage = useCallback((handler: (message: any) => void) => {
    if (!socket) return () => {};
    
    socket.on('new_message', handler);
    return () => {
      socket.off('new_message', handler);
    };
  }, [socket]);

  const onProgress = useCallback((handler: (progress: any) => void) => {
    if (!socket) return () => {};
    
    socket.on('arena_progress', handler);
    return () => {
      socket.off('arena_progress', handler);
    };
  }, [socket]);

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        joinChat,
        leaveChat,
        sendTyping,
        onMessage,
        onProgress,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}

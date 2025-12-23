// AI Arena - WebSocket Handler
import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { logger } from '../utils/logger.js';
import { redis } from '../utils/redis.js';

interface WSClient {
  socket: WebSocket;
  userId: string;
  chatId?: string;
}

const clients = new Map<string, WSClient>();

export function setupWebSocket(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, (connection, req) => {
    const socket = connection.socket;
    const clientId = generateClientId();

    logger.info(`WebSocket client connected: ${clientId}`);

    // Handle messages
    socket.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleMessage(clientId, message, socket);
      } catch (error) {
        logger.error('WebSocket message error:', error);
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    // Handle disconnect
    socket.on('close', () => {
      clients.delete(clientId);
      logger.info(`WebSocket client disconnected: ${clientId}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`WebSocket error for ${clientId}:`, error);
    });

    // Send welcome message
    socket.send(JSON.stringify({
      type: 'connected',
      clientId,
      timestamp: new Date().toISOString(),
    }));
  });
}

async function handleMessage(clientId: string, message: any, socket: WebSocket) {
  const { type, payload } = message;

  switch (type) {
    case 'auth':
      // Authenticate client
      if (payload?.userId) {
        clients.set(clientId, { socket, userId: payload.userId });
        socket.send(JSON.stringify({ type: 'authenticated', userId: payload.userId }));
      }
      break;

    case 'join_chat':
      // Join a chat room
      const client = clients.get(clientId);
      if (client && payload?.chatId) {
        client.chatId = payload.chatId;
        clients.set(clientId, client);
        socket.send(JSON.stringify({ type: 'joined_chat', chatId: payload.chatId }));
      }
      break;

    case 'leave_chat':
      // Leave a chat room
      const leaveClient = clients.get(clientId);
      if (leaveClient) {
        delete leaveClient.chatId;
        clients.set(clientId, leaveClient);
        socket.send(JSON.stringify({ type: 'left_chat' }));
      }
      break;

    case 'typing':
      // Broadcast typing indicator
      broadcastToChat(payload.chatId, {
        type: 'user_typing',
        userId: payload.userId,
        chatId: payload.chatId,
      }, clientId);
      break;

    case 'ping':
      socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;

    default:
      socket.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

// Broadcast message to all clients in a chat
function broadcastToChat(chatId: string, message: any, excludeClientId?: string) {
  for (const [id, client] of clients) {
    if (client.chatId === chatId && id !== excludeClientId) {
      client.socket.send(JSON.stringify(message));
    }
  }
}

// Broadcast message to a specific user
export function broadcastToUser(userId: string, message: any) {
  for (const [_, client] of clients) {
    if (client.userId === userId) {
      client.socket.send(JSON.stringify(message));
    }
  }
}

// Broadcast arena progress
export function broadcastArenaProgress(chatId: string, progress: {
  stage: string;
  percentage: number;
  currentModel?: string;
  message?: string;
}) {
  broadcastToChat(chatId, {
    type: 'arena_progress',
    ...progress,
  });
}

// Broadcast new message
export function broadcastNewMessage(chatId: string, message: any) {
  broadcastToChat(chatId, {
    type: 'new_message',
    message,
  });
}

// Generate client ID
function generateClientId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

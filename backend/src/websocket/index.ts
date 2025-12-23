import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { logger } from '../utils/logger.js';

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface WebSocketClient {
  socket: WebSocket;
  userId: string;
  chatId?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// WEBSOCKET MANAGER
// ════════════════════════════════════════════════════════════════════════════

class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map();

  addClient(id: string, client: WebSocketClient) {
    this.clients.set(id, client);
    logger.info(`WebSocket client connected: ${id}`);
  }

  removeClient(id: string) {
    this.clients.delete(id);
    logger.info(`WebSocket client disconnected: ${id}`);
  }

  sendToUser(userId: string, message: any) {
    this.clients.forEach((client, id) => {
      if (client.userId === userId && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify(message));
      }
    });
  }

  sendToChat(chatId: string, message: any) {
    this.clients.forEach((client, id) => {
      if (client.chatId === chatId && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify(message));
      }
    });
  }

  broadcast(message: any) {
    this.clients.forEach((client) => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify(message));
      }
    });
  }
}

export const wsManager = new WebSocketManager();

// ════════════════════════════════════════════════════════════════════════════
// SETUP WEBSOCKET
// ════════════════════════════════════════════════════════════════════════════

export async function setupWebSocket(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, (connection, request) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add client (userId will be set after authentication)
    wsManager.addClient(clientId, {
      socket: connection.socket,
      userId: 'anonymous',
    });

    // Handle messages
    connection.socket.on('message', async (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage.toString());

        switch (message.type) {
          case 'auth':
            // Authenticate and update userId
            if (message.token) {
              try {
                const decoded = app.jwt.verify(message.token) as { userId: string };
                wsManager.addClient(clientId, {
                  socket: connection.socket,
                  userId: decoded.userId,
                  chatId: message.chatId,
                });
                connection.socket.send(JSON.stringify({
                  type: 'auth:success',
                  userId: decoded.userId,
                }));
              } catch (err) {
                connection.socket.send(JSON.stringify({
                  type: 'auth:error',
                  error: 'Invalid token',
                }));
              }
            }
            break;

          case 'join:chat':
            // Join a specific chat room
            const client = wsManager['clients'].get(clientId);
            if (client) {
              client.chatId = message.chatId;
              connection.socket.send(JSON.stringify({
                type: 'joined:chat',
                chatId: message.chatId,
              }));
            }
            break;

          case 'leave:chat':
            const clientToLeave = wsManager['clients'].get(clientId);
            if (clientToLeave) {
              clientToLeave.chatId = undefined;
              connection.socket.send(JSON.stringify({
                type: 'left:chat',
              }));
            }
            break;

          case 'typing:start':
            wsManager.sendToChat(message.chatId, {
              type: 'typing:start',
              userId: message.userId,
              chatId: message.chatId,
            });
            break;

          case 'typing:stop':
            wsManager.sendToChat(message.chatId, {
              type: 'typing:stop',
              userId: message.userId,
              chatId: message.chatId,
            });
            break;

          case 'ping':
            connection.socket.send(JSON.stringify({ type: 'pong' }));
            break;

          default:
            logger.warn(`Unknown WebSocket message type: ${message.type}`);
        }
      } catch (err) {
        logger.error('WebSocket message error:', err);
        connection.socket.send(JSON.stringify({
          type: 'error',
          error: 'Invalid message format',
        }));
      }
    });

    // Handle disconnect
    connection.socket.on('close', () => {
      wsManager.removeClient(clientId);
    });

    // Handle errors
    connection.socket.on('error', (err) => {
      logger.error('WebSocket error:', err);
      wsManager.removeClient(clientId);
    });

    // Send welcome message
    connection.socket.send(JSON.stringify({
      type: 'connected',
      clientId,
      message: 'Welcome to AI Arena WebSocket',
    }));
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS FOR BROADCASTING
// ════════════════════════════════════════════════════════════════════════════

export function notifyNewMessage(chatId: string, message: any) {
  wsManager.sendToChat(chatId, {
    type: 'message:new',
    chatId,
    message,
  });
}

export function notifyTyping(chatId: string, modelId: string, isTyping: boolean) {
  wsManager.sendToChat(chatId, {
    type: isTyping ? 'typing:start' : 'typing:stop',
    chatId,
    modelId,
  });
}

export function notifyProgress(chatId: string, progress: number, status: string) {
  wsManager.sendToChat(chatId, {
    type: 'progress:update',
    chatId,
    progress,
    status,
  });
}

export function notifyRuleProposed(userId: string, rule: any) {
  wsManager.sendToUser(userId, {
    type: 'rule:proposed',
    rule,
  });
}

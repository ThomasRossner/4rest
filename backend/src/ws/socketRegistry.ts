import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer | null = null;

export function registerWebSocketServer(instance: WebSocketServer): void {
  wss = instance;
}

export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}

export function broadcast(message: unknown): void {
  try {
    if (!wss) {
      return;
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);

    wss.clients.forEach((client: WebSocket) => {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      } catch (error) {
        // Ignore errors when sending to individual clients
        console.warn('[WebSocket] Error sending message to client:', error);
      }
    });
  } catch (error) {
    // Ignore broadcast errors to prevent breaking the request-response chain
    console.warn('[WebSocket] Error in broadcast:', error);
  }
}


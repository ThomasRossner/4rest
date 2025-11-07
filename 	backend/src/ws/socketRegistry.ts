import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer | null = null;

export function registerWebSocketServer(instance: WebSocketServer): void {
  wss = instance;
}

export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}

export function broadcast(message: unknown): void {
  if (!wss) {
    return;
  }

  const payload = typeof message === 'string' ? message : JSON.stringify(message);

  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}


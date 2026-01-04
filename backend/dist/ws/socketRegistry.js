import { WebSocket } from 'ws';
let wss = null;
export function registerWebSocketServer(instance) {
    wss = instance;
}
export function getWebSocketServer() {
    return wss;
}
export function broadcast(message) {
    if (!wss) {
        return;
    }
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}
//# sourceMappingURL=socketRegistry.js.map
import { WebSocket } from 'ws';
let wss = null;
export function registerWebSocketServer(instance) {
    wss = instance;
}
export function getWebSocketServer() {
    return wss;
}
export function broadcast(message) {
    try {
        if (!wss) {
            return;
        }
        const payload = typeof message === 'string' ? message : JSON.stringify(message);
        wss.clients.forEach((client) => {
            try {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(payload);
                }
            }
            catch (error) {
                // Ignore errors when sending to individual clients
                console.warn('[WebSocket] Error sending message to client:', error);
            }
        });
    }
    catch (error) {
        // Ignore broadcast errors to prevent breaking the request-response chain
        console.warn('[WebSocket] Error in broadcast:', error);
    }
}
//# sourceMappingURL=socketRegistry.js.map
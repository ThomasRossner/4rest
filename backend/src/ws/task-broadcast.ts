import { broadcast } from './socketRegistry.js';

export function broadcastTaskUpdate(): void {
  broadcast({
    type: 'task:update',
    timestamp: new Date().toISOString(),
  });
}

export function broadcastPhotoTaskUpdate(): void {
  broadcast({
    type: 'photo:task:update',
    timestamp: new Date().toISOString(),
  });
}

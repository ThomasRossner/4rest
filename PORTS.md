# Port-Konfiguration für lokale Entwicklung

## WICHTIG: Diese Ports sind fest definiert und dürfen nicht geändert werden!

### Backend: Port 5001
- **Grund**: Port 5000 ist bei Apple macOS/iOS Systemen standardmäßig vom AirPlay Receiver Service belegt
- **Konfiguration**: 
  - `backend/.env`: `PORT=5001`
  - `backend/src/server.ts`: `const PORT = process.env.PORT || 5001;`
- **URL**: `http://localhost:5001`

### Frontend: Port 3001
- **Grund**: Port 3000 kann bei manchen Systemen belegt sein, daher 3001 für Konsistenz
- **Konfiguration**:
  - `frontend/vite.config.ts`: `server.port: 3001`
  - `frontend/vite.config.ts`: `hmr.port: 3001`
- **URL**: `http://localhost:3001`

### Backend CORS-Konfiguration
- **WICHTIG**: Backend CORS muss auf Port 3001 erlauben!
- **Konfiguration**: `backend/src/server.ts`:
  ```typescript
  const CORS_ORIGIN = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3001';
  ```

### Vite Proxy-Konfiguration
- **WICHTIG**: Der Vite-Proxy MUSS auf Port 5001 zeigen!
- **Konfiguration**: `frontend/vite.config.ts`:
  ```typescript
  proxy: {
    '/api': {
      target: process.env.VITE_API_TARGET || 'http://localhost:5001',
      // ...
    }
  }
  ```

## Checkliste bei Port-Problemen

1. ✅ Backend `.env` hat `PORT=5001`
2. ✅ Backend `server.ts` hat Fallback `|| 5001` (nicht 5000!)
3. ✅ Backend `server.ts` hat CORS_ORIGIN Fallback `|| 'http://localhost:3001'` (nicht 3000!)
4. ✅ Frontend `vite.config.ts` hat `server.port: 3001`
5. ✅ Frontend `vite.config.ts` hat `hmr.port: 3001`
6. ✅ Frontend `vite.config.ts` Proxy zeigt auf `http://localhost:5001`

## Starten der Anwendung

```bash
npm run dev
```

- Backend startet auf: `http://localhost:5001`
- Frontend startet auf: `http://localhost:3001`
- Frontend-Requests an `/api/*` werden automatisch an `http://localhost:5001/api/*` weitergeleitet

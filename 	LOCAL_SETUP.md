# Lokale Entwicklung ohne Docker

Diese Anleitung zeigt, wie du die App lokal ohne Docker startest (nur Datenbanken in Docker).

## Voraussetzungen

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (nur für PostgreSQL und Redis)
- PostgreSQL Client (optional, für direkte DB-Zugriffe)

## Schritt 1: Datenbanken starten

Starte nur PostgreSQL und Redis mit Docker:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Prüfe, ob die Container laufen:
```bash
docker ps
```

Du solltest `roots-postgres` und `roots-redis` sehen.

## Schritt 2: Dependencies installieren

```bash
# Im Root-Verzeichnis
npm run install:all
```

Oder manuell:
```bash
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

## Schritt 3: Environment-Variablen konfigurieren

### Backend `.env` erstellen

```bash
cd backend
bash setup-env.sh
```

Oder manuell `backend/.env` erstellen:

```env
NODE_ENV=development
PORT=5001
DATABASE_URL=postgresql://roots_user:roots_password@localhost:5432/roots_of_impact
REDIS_URL=redis://localhost:6379
JWT_SECRET=development-secret-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
BASE_URL=http://localhost:5001
CORS_ORIGIN=http://localhost:3000

# SIHOT (Mock für lokale Entwicklung)
SIHOT_USE_MOCK=true
HOTEL_ID=ROI-BER

# Email (Mock für lokale Entwicklung)
EMAIL_ENABLED=true
EMAIL_MOCK_MODE=true
EMAIL_FROM=noreply@roots-of-impact.com
EMAIL_FROM_NAME=Roots of Impact
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Upload-Verzeichnis
UPLOAD_DIR=./uploads
```

**Wichtig:** Der Backend-Port ist standardmäßig `5001` (nicht `5000` wie in docker-compose.yml).

### Frontend `.env` erstellen

Erstelle `frontend/.env`:

```env
VITE_API_URL=http://localhost:5001/api
```

## Schritt 4: Datenbank-Migrationen ausführen

```bash
cd backend
npm run migrate
```

Alternativ kannst du die SQL-Dateien direkt ausführen:

```bash
# Alle Migrationen ausführen
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/001_initial_schema.sql
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/002_gdpr_consent.sql
# ... usw. für alle Migrationen
```

Oder das Setup-Skript verwenden:
```bash
bash database/run-setup.sh
```

## Schritt 5: Test-Daten einfügen (optional)

```bash
# Alle Seed-Daten einfügen
bash database/seed_all.sh

# Oder einzeln:
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/seed_example_task.sql
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/seed_example_reward.sql
```

## Schritt 6: App starten

### Option A: Beide Services gleichzeitig (empfohlen)

Im Root-Verzeichnis:
```bash
npm run dev
```

Dies startet Backend und Frontend gleichzeitig mit `concurrently`.

### Option B: Getrennt in verschiedenen Terminals

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Backend läuft auf: http://localhost:5001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend läuft auf: http://localhost:3000

## Schritt 7: App öffnen

Öffne im Browser:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api

## Test-Accounts

Nach dem Ausführen von `seed_all.sh` sind folgende Accounts verfügbar:

- **Email:** `test@example.com` | **Passwort:** `Test123!` | **Rolle:** guest
- **Email:** `employee@example.com` | **Passwort:** `Test123!` | **Rolle:** employee
- **Email:** `stakeholder@example.com` | **Passwort:** `Test123!` | **Rolle:** stakeholder
- **Email:** `admin@example.com` | **Passwort:** `Test123!` | **Rolle:** administrator

## Troubleshooting

### Port bereits belegt

**Backend Port 5001 belegt:**
- Ändere `PORT` in `backend/.env` auf einen anderen Port (z.B. `5002`)
- Passe `VITE_API_URL` in `frontend/.env` entsprechend an

**Frontend Port 3000 belegt:**
- Vite verwendet automatisch den nächsten freien Port
- Oder ändere in `frontend/vite.config.ts`

### Datenbank-Verbindungsfehler

```bash
# Prüfe, ob PostgreSQL läuft
docker ps | grep postgres

# Prüfe Logs
docker logs roots-postgres

# Teste Verbindung
docker exec -it roots-postgres psql -U roots_user -d roots_of_impact -c "SELECT NOW();"
```

### Redis-Verbindungsfehler

Redis ist optional. Falls Redis nicht läuft, verwendet das Backend MemoryStore für Sessions.

```bash
# Prüfe, ob Redis läuft
docker ps | grep redis

# Teste Verbindung
docker exec -it roots-redis redis-cli ping
```

### TypeScript-Fehler

Für die Entwicklung werden TypeScript-Dateien direkt mit `tsx` ausgeführt, keine Kompilierung nötig.

Falls du trotzdem builden willst:
```bash
cd backend
npm run build
npm start
```

### Module nicht gefunden

```bash
# Lösche node_modules und installiere neu
rm -rf node_modules frontend/node_modules backend/node_modules
npm run install:all
```

## Nützliche Befehle

```bash
# Datenbank zurücksetzen
bash database/reset-db.sh

# Alle Services stoppen
docker-compose -f docker-compose.dev.yml down

# Nur Datenbanken neu starten
docker-compose -f docker-compose.dev.yml restart

# Backend-Logs ansehen
cd backend && npm run dev

# Frontend-Logs ansehen
cd frontend && npm run dev
```

## Unterschiede zu Docker-Setup

- Backend läuft auf Port **5001** statt 5001 (kann in `.env` geändert werden)
- Frontend läuft auf Port **3000** (standardmäßig)
- Datenbanken laufen weiterhin in Docker (Ports 5432 und 6379)
- Hot-Reload funktioniert automatisch (tsx watch + Vite)

## Entwicklung mit Hot-Reload

Beide Services unterstützen Hot-Reload:

- **Backend:** `tsx watch` lädt automatisch neu bei Änderungen
- **Frontend:** Vite lädt automatisch neu bei Änderungen

Kein manueller Neustart nötig!

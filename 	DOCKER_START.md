# Was passiert beim Start mit Docker?

Diese Dokumentation erklärt detailliert, was beim Start der Anwendung mit Docker passiert.

## Entwicklung (docker-compose.yml)

### Befehl
```bash
docker-compose up -d
```

### Ablauf beim Start

#### 1. **Docker Images bauen** (beim ersten Start oder nach Änderungen)

**Backend:**
- Basis-Image: `node:18-alpine`
- Arbeitsverzeichnis: `/app`
- Kopiert `package.json` und `package-lock.json`
- Führt `npm install` aus (installiert alle Dependencies)
- Kopiert den gesamten Backend-Code
- Exponiert Port 5001
- **Wichtig:** Kein Build-Schritt, läuft direkt mit `tsx watch`

**Frontend:**
- Basis-Image: `node:18-alpine`
- Arbeitsverzeichnis: `/app`
- Kopiert `package.json` und `package-lock.json`
- Führt `npm install` aus
- Kopiert den gesamten Frontend-Code
- Exponiert Port 3000
- **Wichtig:** Kein Build-Schritt, läuft direkt mit `vite dev`

#### 2. **Container starten in dieser Reihenfolge:**

##### a) PostgreSQL Container (`roots-postgres`)
- Startet PostgreSQL 15 (Alpine)
- Erstellt Datenbank `roots_of_impact`
- Benutzer: `roots_user` / Passwort: `roots_password`
- Port-Mapping: `5432:5432` (lokal:Container)
- Volume: `postgres_data` (persistente Daten)
- **Healthcheck:** Prüft alle 10 Sekunden, ob PostgreSQL bereit ist

##### b) Redis Container (`roots-redis`)
- Startet Redis 7 (Alpine)
- Port-Mapping: `6379:6379`
- Volume: `redis_data` (persistente Daten)
- **Healthcheck:** Prüft alle 10 Sekunden mit `redis-cli ping`

##### c) Backend Container (`roots-backend`)
- **Wartet** auf PostgreSQL (Healthcheck muss erfolgreich sein)
- **Wartet** auf Redis (Healthcheck muss erfolgreich sein)
- Startet dann:
  ```bash
  npm run dev
  ```
  - Dies führt `tsx watch src/server.ts` aus
  - TypeScript wird on-the-fly kompiliert
  - Server läuft auf Port 5001
- **Volumes:**
  - `./backend:/app` - Code wird live gemountet (Hot-Reload!)
  - `/app/node_modules` - Eigener Volume für node_modules (nicht überschrieben)
- **Environment-Variablen:**
  - `NODE_ENV=development`
  - `DATABASE_URL=postgresql://roots_user:roots_password@postgres:5432/roots_of_impact`
  - `REDIS_URL=redis://redis:6379`
  - `JWT_SECRET=development-secret-change-in-production`
  - `CORS_ORIGIN=http://localhost:3000`

##### d) Frontend Container (`roots-frontend`)
- **Wartet** auf Backend (depends_on)
- Startet dann:
  ```bash
  npm run dev -- --host
  ```
  - Dies startet Vite Dev-Server
  - Läuft auf Port 3000
  - `--host` erlaubt Zugriff von außerhalb des Containers
- **Volumes:**
  - `./frontend:/app` - Code wird live gemountet (Hot-Reload!)
  - `/app/node_modules` - Eigener Volume für node_modules
- **Environment-Variablen:**
  - `VITE_API_URL=http://localhost:5001/api`

### Was passiert im Backend beim Start?

1. **Server-Initialisierung** (`src/server.ts`):
   - Lädt `.env` Datei (falls vorhanden)
   - Initialisiert Express-App
   - Konfiguriert CORS
   - Konfiguriert Session-Middleware (Redis oder MemoryStore)
   - Initialisiert Passport (OAuth)
   - Verbindet zur Datenbank
   - Startet WebSocket-Server
   - Startet SIHOT-Sync-Scheduler (falls konfiguriert)
   - Registriert alle Routes
   - Startet Server auf Port 5001

2. **Datenbank-Verbindung:**
   - Erstellt Connection Pool
   - Testet Verbindung mit `SELECT NOW()`
   - Loggt Verbindungsstatus

3. **Keine automatischen Migrationen** in Development-Modus
   - Migrationen müssen manuell ausgeführt werden:
     ```bash
     docker exec -it roots-backend npm run migrate
     ```

### Was passiert im Frontend beim Start?

1. **Vite Dev-Server startet:**
   - Lädt `vite.config.ts`
   - Kompiliert TypeScript on-the-fly
   - Startet HMR (Hot Module Replacement)
   - Öffnet Browser (optional)

2. **Build-Prozess:**
   - Kein Build in Development!
   - Dateien werden on-demand kompiliert
   - Sehr schneller Start

### Hot-Reload

**Backend:**
- `tsx watch` überwacht alle `.ts` Dateien
- Bei Änderung: Kompiliert neu und startet Server neu
- **Wichtig:** Server-Neustart bedeutet kurze Downtime (~1-2 Sekunden)

**Frontend:**
- Vite überwacht alle Dateien
- Bei Änderung: Aktualisiert Browser ohne Reload (HMR)
- **Wichtig:** Kein Server-Neustart nötig

## Produktion (docker-compose.prod.yml)

### Befehl
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Unterschiede zu Development

#### 1. **Multi-Stage Build**

**Backend (Dockerfile.prod):**
- **Stage 1 - Builder:**
  - Installiert alle Dependencies (inkl. Dev-Dependencies)
  - Kopiert Source-Code
  - Führt `npm run build` aus → kompiliert TypeScript zu JavaScript
  - Output: `/app/dist/`
  
- **Stage 2 - Production:**
  - Installiert nur Production-Dependencies
  - Kopiert kompilierte Dateien aus Builder
  - Kopiert `docker-entrypoint.sh`
  - Installiert PostgreSQL-Client (für DB-Init)
  - **ENTRYPOINT:** `./docker-entrypoint.sh`
  - **CMD:** `npm start` (läuft `node dist/server.js`)

**Frontend (Dockerfile.prod):**
- **Stage 1 - Builder:**
  - Installiert Dependencies
  - Kopiert Source-Code
  - Führt `npm run build` aus → erstellt optimiertes Bundle
  - Output: `/app/dist/`
  
- **Stage 2 - Production:**
  - Basis-Image: `nginx:alpine`
  - Kopiert gebaute Dateien nach `/usr/share/nginx/html`
  - Kopiert `nginx.conf` für Routing
  - **CMD:** `nginx -g daemon off`

#### 2. **Backend Entrypoint-Script** (`docker-entrypoint.sh`)

Beim Start des Backend-Containers passiert:

1. **Warten auf PostgreSQL:**
   ```bash
   # Versucht bis zu 30x (60 Sekunden) eine Verbindung herzustellen
   until psql -h postgres -U roots_user -d roots_of_impact -c '\q'; do
     sleep 2
   done
   ```

2. **Datenbank-Initialisierung** (`init-db.sh`):
   - Prüft, ob Datenbank bereits initialisiert ist
   - Führt alle Migrationen aus (falls nötig)
   - Seeded Test-Daten:
     - Locations
     - Beispiel-Tasks (QR, Video, Photo)
     - Beispiel-Rewards
     - Test-User (test@example.com, etc.)

3. **Server starten:**
   ```bash
   npm start  # Führt node dist/server.js aus
   ```

#### 3. **Keine Volumes in Production**

- Code ist im Image gebaut
- Kein Live-Mounting
- Kein Hot-Reload
- Änderungen erfordern Rebuild

#### 4. **Environment-Variablen aus `.env`**

Produktion verwendet `.env` Datei mit:
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `VITE_API_URL`
- etc.

#### 5. **Netzwerk**

- Alle Container im `roots-network`
- Container kommunizieren über Service-Namen:
  - `postgres` (nicht `localhost`)
  - `redis` (nicht `localhost`)
  - `backend`
  - `frontend`

#### 6. **Ports**

- Frontend: `80:3000` (Port 80 auf Host → Port 3000 im Container)
- Backend: `5000:5000`
- PostgreSQL: Nicht exponiert (nur intern)
- Redis: Nicht exponiert (nur intern)

#### 7. **Restart-Policy**

- `restart: unless-stopped`
- Container starten automatisch nach Reboot

## Vergleich: Development vs. Production

| Aspekt | Development | Production |
|--------|------------|------------|
| **Build** | Kein Build, tsx watch | Multi-Stage Build |
| **TypeScript** | On-the-fly kompiliert | Vorkompiliert |
| **Hot-Reload** | ✅ Ja (Backend + Frontend) | ❌ Nein |
| **Volumes** | ✅ Code gemountet | ❌ Code im Image |
| **Dependencies** | Alle (inkl. Dev) | Nur Production |
| **Frontend** | Vite Dev-Server | Nginx (statische Dateien) |
| **Backend** | tsx watch | node dist/server.js |
| **DB-Init** | Manuell | Automatisch (entrypoint) |
| **Ports** | 3000, 5001, 5432, 6379 | 80, 5000 (nur Frontend/Backend) |
| **Netzwerk** | Default Bridge | Custom Network |

## Typischer Start-Ablauf (Production)

```bash
# 1. Images bauen
docker-compose -f docker-compose.prod.yml build

# 2. Container starten
docker-compose -f docker-compose.prod.yml up -d

# Ablauf:
# 1. PostgreSQL startet → Healthcheck läuft
# 2. Redis startet → Healthcheck läuft
# 3. Backend startet:
#    - Wartet auf PostgreSQL (ready)
#    - Wartet auf Redis (ready)
#    - Führt docker-entrypoint.sh aus:
#      a) Wartet auf PostgreSQL (nochmal)
#      b) Führt init-db.sh aus (Migrationen + Seeds)
#      c) Startet npm start
# 4. Frontend startet:
#    - Wartet auf Backend
#    - Nginx startet mit gebauten Dateien
```

## Logs ansehen

```bash
# Alle Logs
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Frontend
docker-compose logs -f frontend

# Nur PostgreSQL
docker-compose logs -f postgres
```

## Container-Status prüfen

```bash
# Status aller Container
docker-compose ps

# Detaillierte Infos
docker ps

# In Container einloggen
docker exec -it roots-backend sh
docker exec -it roots-frontend sh
```

## Wichtige Unterschiede

### Development
- **Schneller Start** (kein Build)
- **Hot-Reload** funktioniert
- **Code-Änderungen** sofort sichtbar
- **Datenbank-Migrationen** müssen manuell ausgeführt werden

### Production
- **Langsamer Start** (Build nötig)
- **Kein Hot-Reload**
- **Code-Änderungen** erfordern Rebuild
- **Datenbank-Migrationen** laufen automatisch beim Start

## Troubleshooting

### Container startet nicht

```bash
# Logs prüfen
docker-compose logs backend

# Container-Status
docker-compose ps

# Healthcheck prüfen
docker inspect roots-backend | grep Health -A 10
```

### Datenbank-Verbindungsfehler

```bash
# Prüfe, ob PostgreSQL läuft
docker ps | grep postgres

# Teste Verbindung vom Backend-Container
docker exec -it roots-backend psql $DATABASE_URL -c "SELECT NOW();"
```

### Frontend zeigt alte Version

```bash
# Rebuild Frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Backend zeigt alte Version

```bash
# Rebuild Backend
docker-compose build backend
docker-compose up -d backend
```

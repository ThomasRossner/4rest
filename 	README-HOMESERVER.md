# Roots of Impact - Homeserver Deployment

Diese Anleitung beschreibt die Deployment-Prozedur für Roots of Impact auf einem Homeserver mit Docker.

## Übersicht

Die App läuft als Docker-Container mit folgenden Services:
- **Frontend**: Nginx mit statischen Assets auf Port 3001
- **Backend**: Node.js/Express API (nur intern, Port 5000)
- **PostgreSQL**: Datenbank (nur intern, Port 5432)
- **Redis**: Cache (nur intern, Port 6379)

Alle Container kommunizieren über ein isoliertes Docker-Netzwerk (`roots-network`).

## Voraussetzungen

- Docker und Docker Compose installiert
- Git Zugriff auf das Repository
- SSH-Zugriff auf den Homeserver
- Port 3001 frei (wird später über Caddy auf 443 bereitgestellt)

## Erste Installation

### Option A: Remote-Deployment vom Entwicklungsrechner (empfohlen)

Vom Entwicklungsrechner aus kann das Deployment per SSH durchgeführt werden:

```bash
# Vom Entwicklungsrechner aus
./scripts/deploy-homeserver-remote.sh
```

Das Skript:
- Prüft SSH-Verbindung zum Homeserver
- Erstellt das Deployment-Verzeichnis falls nötig
- Klont das Repository falls nötig
- Erstellt `.env` aus Template falls nötig
- Führt das Deployment auf dem Server aus

**Voraussetzungen:**
- `sshpass` installiert: `brew install hudochenkov/sshpass/sshpass` (macOS) oder `sudo apt-get install sshpass` (Linux)
- SSH-Zugriff auf den Homeserver

**Konfiguration:**

Das Skript verwendet folgende Standardwerte, die über Environment-Variablen überschrieben werden können:

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `HOMESERVER_HOST` | `homeserver` | Hostname oder IP des Homeservers |
| `HOMESERVER_USER` | `neueradmin` | SSH Benutzername |
| `HOMESERVER_PASSWORD` | `REMOVED_PASSWORD` | SSH Passwort |
| `DEPLOYMENT_PATH` | `/home/neueradmin/roots-of-impact` | Pfad auf dem Server |
| `REPO_URL` | - | Git Repository URL (nur bei erstem Setup nötig) |

**Beispiel mit angepassten Werten:**
```bash
export HOMESERVER_HOST="192.168.1.100"
export HOMESERVER_USER="admin"
export HOMESERVER_PASSWORD="mein-passwort"
export DEPLOYMENT_PATH="/opt/roots-of-impact"
export REPO_URL="https://github.com/user/roots-of-impact.git"
./scripts/deploy-homeserver-remote.sh
```

**Oder in einer Konfigurationsdatei:**
```bash
# Template kopieren und anpassen
cp scripts/deploy-homeserver-remote.env.example scripts/deploy-homeserver-remote.env
nano scripts/deploy-homeserver-remote.env  # Werte anpassen

# Dann ausführen:
source scripts/deploy-homeserver-remote.env
./scripts/deploy-homeserver-remote.sh
```

**Wichtig:** Die `.env` Datei mit Passwörtern sollte **nicht** in Git committed werden!

### Option B: Direkt auf dem Homeserver

### 1. Repository auf Homeserver klonen

```bash
ssh neueradmin@homeserver
cd /path/to/deployment
git clone <repository-url> roots-of-impact
cd roots-of-impact
```

### 2. Environment-Variablen konfigurieren

```bash
# Template kopieren
cp env.homeserver.example .env

# .env Datei bearbeiten
nano .env
```

**Wichtige Variablen die angepasst werden müssen:**
- `POSTGRES_PASSWORD`: Starkes Passwort für PostgreSQL
- `JWT_SECRET`: Generiere mit `openssl rand -base64 32`
- `SESSION_SECRET`: Gleicher Wert wie JWT_SECRET oder separater Wert
- `CORS_ORIGIN`: URL des Frontends (später über Caddy)
- `VITE_API_URL`: Backend API URL
- `EMAIL_MOCK_MODE`: Auf `false` setzen für Production
- SMTP Konfiguration für E-Mails

### 3. Erste Deployment

```bash
# Deployment-Skript ausführen
./scripts/deploy-homeserver.sh
```

Das Skript führt automatisch aus:
- Git Pull (falls Repository bereits existiert)
- Docker Images bauen
- Container starten
- Datenbank initialisieren (Migrations + Seeds)
- Health Checks durchführen

### 4. Verifikation

```bash
# Container Status prüfen
docker-compose -f docker-compose.homeserver.yml ps

# Logs ansehen
docker-compose -f docker-compose.homeserver.yml logs -f

# Frontend testen
curl http://localhost:3001/health

# Backend testen
curl http://localhost:5000/health
```

## Updates durchführen

### Vom Entwicklungsrechner (Remote)

```bash
./scripts/deploy-homeserver-remote.sh
```

### Direkt auf dem Homeserver

```bash
./scripts/deploy-homeserver.sh
```

Das Skript:
1. Macht Git Pull
2. Baut neue Images
3. Stoppt alte Container
4. Startet neue Container
5. Führt neue DB-Migrations automatisch aus

## Datenbank-Initialisierung

Die Datenbank wird beim ersten Start automatisch initialisiert:

1. **Migrations**: Alle 16 Migrations werden ausgeführt
2. **Seeds**: 
   - Locations (Berlin Lobby, Vienna Rooftop Garden)
   - Beispiel-Tasks (QR, Video, Photo)
   - Beispiel-Rewards
   - Test-User (siehe unten)

### Test-User

Nach der Initialisierung sind folgende Test-Accounts verfügbar:

| Email | Passwort | Rolle |
|-------|----------|-------|
| test@example.com | Test123! | guest |
| employee@example.com | Test123! | employee |
| stakeholder@example.com | Test123! | stakeholder |
| admin@example.com | Test123! | administrator |

**Wichtig**: Diese Accounts sollten in Production gelöscht oder Passwörter geändert werden!

## Container-Verwaltung

### Container starten

```bash
docker-compose -f docker-compose.homeserver.yml up -d
```

### Container stoppen

```bash
docker-compose -f docker-compose.homeserver.yml down
```

### Container neu starten

```bash
docker-compose -f docker-compose.homeserver.yml restart
```

### Logs ansehen

```bash
# Alle Logs
docker-compose -f docker-compose.homeserver.yml logs -f

# Nur Backend
docker-compose -f docker-compose.homeserver.yml logs -f backend

# Nur Frontend
docker-compose -f docker-compose.homeserver.yml logs -f frontend
```

### In Container einsteigen

```bash
# Backend Container
docker exec -it roots-backend-homeserver sh

# PostgreSQL Container
docker exec -it roots-postgres-homeserver psql -U roots_user -d roots_of_impact
```

## Datenbank-Verwaltung

### Manuelle Migration

Falls Migrations manuell ausgeführt werden müssen:

```bash
docker exec -it roots-backend-homeserver npm run migrate
```

### Datenbank-Backup

```bash
docker exec roots-postgres-homeserver pg_dump -U roots_user roots_of_impact > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Datenbank-Wiederherstellung

```bash
cat backup.sql | docker exec -i roots-postgres-homeserver psql -U roots_user -d roots_of_impact
```

### Datenbank zurücksetzen

**Vorsicht**: Löscht alle Daten!

```bash
docker-compose -f docker-compose.homeserver.yml down -v
docker volume rm roots-of-impact_postgres_data
# Dann erneut deployen
./scripts/deploy-homeserver.sh
```

## Troubleshooting

### Container startet nicht

1. **Logs prüfen**:
   ```bash
   docker-compose -f docker-compose.homeserver.yml logs backend
   ```

2. **PostgreSQL-Verbindung prüfen**:
   ```bash
   docker exec -it roots-postgres-homeserver psql -U roots_user -d roots_of_impact -c "SELECT 1;"
   ```

3. **Environment-Variablen prüfen**:
   ```bash
   docker exec roots-backend-homeserver env | grep DATABASE
   ```

### Datenbank-Migrationen schlagen fehl

1. **Manuell ausführen**:
   ```bash
   docker exec -it roots-backend-homeserver npm run migrate
   ```

2. **Schema-Status prüfen**:
   ```bash
   docker exec -it roots-postgres-homeserver psql -U roots_user -d roots_of_impact -c "SELECT * FROM schema_migrations;"
   ```

### Frontend lädt nicht

1. **Nginx-Logs prüfen**:
   ```bash
   docker-compose -f docker-compose.homeserver.yml logs frontend
   ```

2. **Port prüfen**:
   ```bash
   netstat -tuln | grep 3001
   ```

3. **Container-Status**:
   ```bash
   docker-compose -f docker-compose.homeserver.yml ps frontend
   ```

### Backend antwortet nicht

1. **Health Check**:
   ```bash
   curl http://localhost:5000/health
   ```

2. **Container-Logs**:
   ```bash
   docker-compose -f docker-compose.homeserver.yml logs backend
   ```

3. **Datenbank-Verbindung testen**:
   ```bash
   docker exec roots-backend-homeserver node -e "require('pg').Pool({connectionString: process.env.DATABASE_URL}).query('SELECT 1').then(() => console.log('OK')).catch(e => console.error(e))"
   ```

### Port-Konflikte

Falls Port 3001 bereits belegt ist, kann der Port in `docker-compose.homeserver.yml` geändert werden:

```yaml
frontend:
  ports:
    - "3002:3000"  # Ändere 3001 zu 3002
```

Dann auch `CORS_ORIGIN` in `.env` anpassen.

## Caddy Integration

Die App läuft intern auf Port 3001. Für die Bereitstellung über HTTPS mit Caddy:

### Caddyfile Beispiel

```
yourdomain.com {
    reverse_proxy localhost:3001
}
```

### Environment-Variablen anpassen

Wenn Caddy läuft, müssen folgende Variablen in `.env` angepasst werden:

```env
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api
BASE_URL=https://api.yourdomain.com
```

Dann Container neu starten:
```bash
docker-compose -f docker-compose.homeserver.yml restart backend frontend
```

## Wartung

### Regelmäßige Backups

Erstelle ein Cron-Job für tägliche Backups:

```bash
# Crontab bearbeiten
crontab -e

# Täglich um 2 Uhr morgens
0 2 * * * cd /path/to/roots-of-impact && docker exec roots-postgres-homeserver pg_dump -U roots_user roots_of_impact > /backups/roots_$(date +\%Y\%m\%d).sql
```

### Log-Rotation

Docker verwaltet Logs automatisch. Bei Bedarf können Logs begrenzt werden in `docker-compose.homeserver.yml`:

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Updates

1. Code-Änderungen: `./scripts/deploy-homeserver.sh`
2. Docker Images aktualisieren: `docker-compose -f docker-compose.homeserver.yml pull`
3. System-Updates: Reguläre System-Updates auf dem Homeserver

## Sicherheit

### Production-Checkliste

- [ ] Starke Passwörter für PostgreSQL und JWT_SECRET
- [ ] Test-User löschen oder Passwörter ändern
- [ ] EMAIL_MOCK_MODE auf `false` setzen
- [ ] SMTP korrekt konfiguriert
- [ ] CORS_ORIGIN auf Production-Domain gesetzt
- [ ] OAuth Callback URLs auf Production-Domain gesetzt
- [ ] Regelmäßige Backups eingerichtet
- [ ] Firewall-Regeln konfiguriert (nur Port 3001 nach außen)
- [ ] SSL/TLS über Caddy aktiviert

### Firewall

Stelle sicher, dass nur Port 3001 (später 443 über Caddy) nach außen exponiert ist:

```bash
# UFW Beispiel
sudo ufw allow 3001/tcp
sudo ufw deny 5000/tcp  # Backend nicht nach außen
```

## Support

Bei Problemen:
1. Logs prüfen: `docker-compose -f docker-compose.homeserver.yml logs`
2. Container-Status: `docker-compose -f docker-compose.homeserver.yml ps`
3. Health Checks: `curl http://localhost:3001/health` und `curl http://localhost:5000/health`


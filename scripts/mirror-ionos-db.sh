#!/bin/bash
# Spiegelt die IONOS-Produktionsdatenbank auf die lokale Datenbank
# Erstellt einen vollständigen Dump der IONOS-DB und importiert ihn lokal

set -euo pipefail

# IONOS Server-Konfiguration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ionos-ssh-add.sh
source "$SCRIPT_DIR/ionos-ssh-add.sh"
SSH_USER="${IONOS_USER:-root}"
SSH_HOST="${IONOS_HOST:-87.106.86.203}"
SSH_KEY="${IONOS_SSH_KEY_PATH:-$HOME/.ssh/id_ed25519}"

# Datenbank-Konfiguration (IONOS)
IONOS_DB_USER="roots_user"
IONOS_DB_PASSWORD="roots_password"
IONOS_DB_NAME="roots_of_impact"
IONOS_DB_HOST="localhost"  # Auf dem IONOS-Server

# Lokale Datenbank-Konfiguration
LOCAL_DB_USER="${POSTGRES_USER:-roots_user}"
LOCAL_DB_PASSWORD="${POSTGRES_PASSWORD:-roots_password}"
LOCAL_DB_NAME="${POSTGRES_DB:-roots_of_impact}"
LOCAL_DB_HOST="${POSTGRES_HOST:-localhost}"
LOCAL_DB_PORT="${POSTGRES_PORT:-5432}"

# Temporäre Dateien
DUMP_FILE="/tmp/4rest_ionos_dump_$(date +%Y%m%d_%H%M%S).sql"
LOCAL_DUMP_FILE="./database/mirror_dump_$(date +%Y%m%d_%H%M%S).sql"

echo "==> Mirroring IONOS database to local..."
echo ""

# Prüfe ob PostgreSQL-Tools lokal verfügbar sind
if ! command -v psql >/dev/null 2>&1; then
    echo "❌ Error: psql nicht gefunden. Bitte PostgreSQL installieren."
    exit 1
fi

# Prüfe ob lokale Datenbank erreichbar ist
echo "==> Checking local database connection..."
# Prüfe ob Docker-Container läuft
# Prefer explicit local project DB container to avoid selecting unrelated postgres containers.
LOCAL_CONTAINER=""
if docker ps --format "{{.Names}}" | rg -x "roots-postgres" >/dev/null 2>&1; then
    LOCAL_CONTAINER="roots-postgres"
else
    LOCAL_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)
fi
if [ -n "$LOCAL_CONTAINER" ]; then
    echo "   Found Docker container: $LOCAL_CONTAINER"
    USE_DOCKER=true
    if ! docker exec "$LOCAL_CONTAINER" psql -U "$LOCAL_DB_USER" -d postgres -c '\q' 2>/dev/null; then
        echo "❌ Error: Kann nicht zur lokalen Datenbank im Container verbinden"
        exit 1
    fi
    echo "   ✓ Lokale Datenbank (Docker) erreichbar"
else
    # Versuche direkte Verbindung
    export PGHOST="$LOCAL_DB_HOST"
    export PGPORT="$LOCAL_DB_PORT"
    export PGUSER="$LOCAL_DB_USER"
    export PGPASSWORD="$LOCAL_DB_PASSWORD"
    export PGDATABASE="postgres"
    USE_DOCKER=false
    
    if ! PGPASSWORD="$LOCAL_DB_PASSWORD" psql -h "$LOCAL_DB_HOST" -p "$LOCAL_DB_PORT" -U "$LOCAL_DB_USER" -d postgres -c '\q' 2>/dev/null; then
        echo "❌ Error: Kann nicht zur lokalen Datenbank verbinden"
        echo "   Stelle sicher, dass PostgreSQL läuft und die Verbindungsdaten korrekt sind"
        exit 1
    fi
    echo "   ✓ Lokale Datenbank erreichbar"
fi
echo ""

# SSH-Key zum Agent hinzufügen
echo "==> Setting up SSH connection..."
if ! ionos_ssh_add_key; then
    echo "   Bitte IONOS_SSH_PASSPHRASE setzen und den Schlüssel unter ${SSH_KEY} bereitlegen."
    if ! ssh-add -l >/dev/null 2>&1; then
        exit 1
    fi
fi
echo "   ✓ SSH key ready"
echo ""

# Erstelle Dump auf IONOS-Server
echo "==> Creating database dump on IONOS server..."
ssh -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" << REMOTE_SCRIPT
    # Finde das Docker-Container mit der Datenbank
    CONTAINER=\$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)
    
    if [ -z "\$CONTAINER" ]; then
        echo "❌ Error: PostgreSQL container nicht gefunden"
        exit 1
    fi
    
    echo "   Found container: \$CONTAINER"
    
    # Erstelle Dump im Container
    docker exec \$CONTAINER pg_dump -U ${IONOS_DB_USER} -d ${IONOS_DB_NAME} --clean --if-exists --no-owner --no-acl > ${DUMP_FILE}
    
    if [ \$? -eq 0 ]; then
        echo "   ✓ Dump created: ${DUMP_FILE}"
    else
        echo "❌ Error: Dump creation failed"
        exit 1
    fi
REMOTE_SCRIPT

if [ $? -ne 0 ]; then
    echo "❌ Error: Fehler beim Erstellen des Dumps auf IONOS"
    exit 1
fi
echo ""

# Kopiere Dump lokal
echo "==> Downloading dump from IONOS server..."
scp -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}:${DUMP_FILE}" "${LOCAL_DUMP_FILE}"

if [ $? -ne 0 ]; then
    echo "❌ Error: Fehler beim Herunterladen des Dumps"
    exit 1
fi
echo "   ✓ Dump downloaded: ${LOCAL_DUMP_FILE}"
echo ""

# Lösche Dump auf IONOS-Server
echo "==> Cleaning up remote dump file..."
ssh -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" "rm -f ${DUMP_FILE}"
echo ""

# Erstelle lokale Datenbank falls nicht vorhanden
echo "==> Preparing local database..."
if [ "$USE_DOCKER" = true ]; then
    docker exec "$LOCAL_CONTAINER" psql -U "$LOCAL_DB_USER" -d postgres <<EOF >/dev/null 2>&1 || true
SELECT 'CREATE DATABASE ${LOCAL_DB_NAME}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${LOCAL_DB_NAME}')\gexec
EOF
else
    PGPASSWORD="$LOCAL_DB_PASSWORD" psql -h "$LOCAL_DB_HOST" -p "$LOCAL_DB_PORT" -U "$LOCAL_DB_USER" -d postgres <<EOF >/dev/null 2>&1 || true
SELECT 'CREATE DATABASE ${LOCAL_DB_NAME}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${LOCAL_DB_NAME}')\gexec
EOF
fi
echo "   ✓ Local database ready"
echo ""

# Erstelle database-Verzeichnis falls nicht vorhanden
mkdir -p "$(dirname "${LOCAL_DUMP_FILE}")"

# Lösche bestehende Datenbank (VORSICHT!)
echo "⚠️  WARNING: This will DROP the local database '${LOCAL_DB_NAME}'"
if [ "${AUTO_CONFIRM:-}" != "yes" ]; then
    echo "   Press Ctrl+C to cancel, or Enter to continue..."
    read -r
else
    echo "   Auto-confirming (AUTO_CONFIRM=yes)..."
fi

echo "==> Dropping existing local database..."
if [ "$USE_DOCKER" = true ]; then
    docker exec "$LOCAL_CONTAINER" psql -U "$LOCAL_DB_USER" -d postgres <<EOF
DROP DATABASE IF EXISTS ${LOCAL_DB_NAME};
CREATE DATABASE ${LOCAL_DB_NAME};
EOF
else
    PGPASSWORD="$LOCAL_DB_PASSWORD" psql -h "$LOCAL_DB_HOST" -p "$LOCAL_DB_PORT" -U "$LOCAL_DB_USER" -d postgres <<EOF
DROP DATABASE IF EXISTS ${LOCAL_DB_NAME};
CREATE DATABASE ${LOCAL_DB_NAME};
EOF
fi
echo "   ✓ Local database recreated"
echo ""

# Importiere Dump
echo "==> Importing dump into local database..."
if [ "$USE_DOCKER" = true ]; then
    docker exec -i "$LOCAL_CONTAINER" psql -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" < "${LOCAL_DUMP_FILE}"
else
    PGPASSWORD="$LOCAL_DB_PASSWORD" psql -h "$LOCAL_DB_HOST" -p "$LOCAL_DB_PORT" -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" < "${LOCAL_DUMP_FILE}"
fi

if [ $? -eq 0 ]; then
    echo "   ✓ Dump imported successfully"
else
    echo "❌ Error: Import fehlgeschlagen"
    exit 1
fi
echo ""

# Zeige Statistiken
echo "==> Database statistics:"
if [ "$USE_DOCKER" = true ]; then
    docker exec "$LOCAL_CONTAINER" psql -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" <<'STATS_EOF'
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
STATS_EOF
else
    PGPASSWORD="$LOCAL_DB_PASSWORD" psql -h "$LOCAL_DB_HOST" -p "$LOCAL_DB_PORT" -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" <<'STATS_EOF'
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
STATS_EOF
fi
echo ""

# Lösche lokalen Dump (optional - auskommentiert für Debugging)
# echo "==> Cleaning up local dump file..."
# rm -f "${LOCAL_DUMP_FILE}"
# echo "   ✓ Cleanup complete"
# echo ""

echo "✅ Database mirroring complete!"
echo ""
echo "Local database: ${LOCAL_DB_NAME}"
echo "Dump file saved: ${LOCAL_DUMP_FILE}"
echo ""
echo "To connect to the local database:"
echo "  psql -h ${LOCAL_DB_HOST} -p ${LOCAL_DB_PORT} -U ${LOCAL_DB_USER} -d ${LOCAL_DB_NAME}"

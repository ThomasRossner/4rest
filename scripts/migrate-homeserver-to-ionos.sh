#!/bin/bash
# Migration script: Homeserver → Ionos
# Migrates database and upload files from Homeserver to Ionos production server

set -euxo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Homeserver configuration
HOMESERVER_HOST="192.168.178.131"
HOMESERVER_USER="neueradmin"
HOMESERVER_PASS="neueradmin1808"
HOMESERVER_DIR="/roots-of-impact"

# Ionos configuration
IONOS_HOST="87.106.86.203"
IONOS_USER="root"
IONOS_SSH_KEY="$HOME/.ssh/id_ed25519"
IONOS_SSH_PASSPHRASE="Tan0808zen"
IONOS_DIR="/root/4rest"

# Local temporary directory
TEMP_DIR="/tmp/4rest-migration-$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$TEMP_DIR/backups"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Migration: Homeserver → Ionos${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}==> Checking prerequisites...${NC}"

if ! command -v sshpass >/dev/null 2>&1; then
    echo -e "${RED}ERROR: sshpass not found. Install with: brew install hudochenkov/sshpass/sshpass${NC}"
    exit 1
fi

if ! command -v expect >/dev/null 2>&1; then
    echo -e "${RED}ERROR: expect not found. Install with: brew install expect${NC}"
    exit 1
fi

# Check SSH key for Ionos
if [ ! -f "$IONOS_SSH_KEY" ]; then
    echo -e "${RED}ERROR: SSH key not found: $IONOS_SSH_KEY${NC}"
    exit 1
fi

# Add SSH key to agent if not already added
if ! ssh-add -l 2>/dev/null | grep -q "id_ed25519"; then
    echo "Adding SSH key to agent..."
    expect << EOF
spawn ssh-add $IONOS_SSH_KEY
expect "Enter passphrase"
send "$IONOS_SSH_PASSPHRASE\r"
expect eof
EOF
fi

echo -e "${GREEN}   Prerequisites OK${NC}"
echo ""

# Create temporary directories
mkdir -p "$TEMP_DIR"
mkdir -p "$BACKUP_DIR"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}==> Cleaning up temporary files...${NC}"
    # Keep backups for now, user can delete manually
    echo -e "${GREEN}   Backup files kept in: $BACKUP_DIR${NC}"
    echo "   You can delete them manually after verifying the migration"
}

trap cleanup EXIT

# ============================================
# Phase 1: Export from Homeserver
# ============================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Phase 1: Export from Homeserver${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Find deployment directory on Homeserver
echo -e "${YELLOW}==> Connecting to Homeserver...${NC}"
echo "[DEBUG] Attempting SSH connection to ${HOMESERVER_USER}@${HOMESERVER_HOST}"
HOMESERVER_DEPLOY_DIR=$(sshpass -p "$HOMESERVER_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PasswordAuthentication=yes \
    "${HOMESERVER_USER}@${HOMESERVER_HOST}" \
    "HOME_DIR=\$(getent passwd $HOMESERVER_USER | cut -d: -f6); if [ -d '$HOMESERVER_DIR' ]; then echo '$HOMESERVER_DIR'; elif [ -d '/services/roots-of-impact' ]; then echo '/services/roots-of-impact'; elif [ -d \"\$HOME_DIR/roots-of-impact\" ]; then echo \"\$HOME_DIR/roots-of-impact\"; elif [ -d \"\$HOME_DIR/4rest\" ]; then echo \"\$HOME_DIR/4rest\"; else timeout 5 find \"\$HOME_DIR\" -maxdepth 3 -type d \\( -name 'roots-of-impact' -o -name '4rest' \\) 2>/dev/null | head -1; fi" 2>/dev/null | grep -v "Warning:" | grep -v "Permanently added" | tr -d '\n')
echo "[DEBUG] SSH connection completed, deploy dir: $HOMESERVER_DEPLOY_DIR"

if [ -z "$HOMESERVER_DEPLOY_DIR" ]; then
    echo -e "${RED}ERROR: Could not find deployment directory on Homeserver${NC}"
    exit 1
fi

echo -e "${GREEN}   Found deployment directory: $HOMESERVER_DEPLOY_DIR${NC}"
echo ""

# Check Docker Compose command
echo "[DEBUG] Checking Docker Compose command on Homeserver..."
COMPOSE_CMD=$(sshpass -p "$HOMESERVER_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PasswordAuthentication=yes \
    "${HOMESERVER_USER}@${HOMESERVER_HOST}" \
    "cd '$HOMESERVER_DEPLOY_DIR' && if docker compose version >/dev/null 2>&1; then echo 'docker compose'; else echo 'docker-compose'; fi" 2>/dev/null | grep -vE "(Warning|Permanently)" | tr -d '\n\r')
# Fallback if empty
if [ -z "$COMPOSE_CMD" ]; then
    COMPOSE_CMD="docker compose"
fi
echo "[DEBUG] Docker Compose command: $COMPOSE_CMD"

# 1.1 Export Database
echo -e "${YELLOW}==> Exporting database from Homeserver...${NC}"
echo "[DEBUG] Starting database export..."

DB_DUMP_FILE="$BACKUP_DIR/database_dump_$(date +%Y%m%d_%H%M%S).sql"
echo "[DEBUG] Dump file will be: $DB_DUMP_FILE"
echo "[DEBUG] Connecting to Homeserver for database dump..."

sshpass -p "$HOMESERVER_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PasswordAuthentication=yes \
    "${HOMESERVER_USER}@${HOMESERVER_HOST}" << EOF
cd "$HOMESERVER_DEPLOY_DIR"
echo "[DEBUG] Changed to directory: $HOMESERVER_DEPLOY_DIR"
echo "[DEBUG] Using compose command: $COMPOSE_CMD"

# Get PostgreSQL container name
echo "[DEBUG] Getting PostgreSQL container name..."
POSTGRES_CONTAINER=\$($COMPOSE_CMD -f docker-compose.homeserver.yml ps -q postgres 2>/dev/null || echo "")
echo "[DEBUG] PostgreSQL container: \$POSTGRES_CONTAINER"

if [ -z "\$POSTGRES_CONTAINER" ]; then
    echo "[DEBUG] ERROR: PostgreSQL container not found"
    echo "[DEBUG] Listing all containers:"
    $COMPOSE_CMD -f docker-compose.homeserver.yml ps
    exit 1
fi

# Get database credentials from docker-compose
echo "[DEBUG] Extracting database credentials..."
POSTGRES_USER=\$(grep POSTGRES_USER docker-compose.homeserver.yml | head -1 | sed 's/.*POSTGRES_USER:\${POSTGRES_USER:-\([^}]*\)}.*/\1/' | sed 's/.*POSTGRES_USER: *\([^ ]*\).*/\1/' | tr -d ' ')
if [ -z "\$POSTGRES_USER" ] || [ "\$POSTGRES_USER" = "\${POSTGRES_USER:-roots_user}" ]; then
    POSTGRES_USER="roots_user"
fi
echo "[DEBUG] PostgreSQL user: \$POSTGRES_USER"

POSTGRES_DB=\$(grep POSTGRES_DB docker-compose.homeserver.yml | head -1 | sed 's/.*POSTGRES_DB:\${POSTGRES_DB:-\([^}]*\)}.*/\1/' | sed 's/.*POSTGRES_DB: *\([^ ]*\).*/\1/' | tr -d ' ')
if [ -z "\$POSTGRES_DB" ] || [ "\$POSTGRES_DB" = "\${POSTGRES_DB:-roots_of_impact}" ]; then
    POSTGRES_DB="roots_of_impact"
fi
echo "[DEBUG] PostgreSQL database: \$POSTGRES_DB"

# Create database dump
echo "[DEBUG] Creating database dump..."
docker exec \$POSTGRES_CONTAINER pg_dump -U \$POSTGRES_USER -d \$POSTGRES_DB --clean --if-exists > /tmp/db_dump.sql 2>&1
DUMP_EXIT_CODE=\$?
echo "[DEBUG] Dump exit code: \$DUMP_EXIT_CODE"
if [ \$DUMP_EXIT_CODE -eq 0 ]; then
    DUMP_SIZE=\$(stat -f%z /tmp/db_dump.sql 2>/dev/null || stat -c%s /tmp/db_dump.sql 2>/dev/null || echo "unknown")
    echo "[DEBUG] Dump file size: \$DUMP_SIZE bytes"
    echo "Database dump created successfully"
else
    echo "[DEBUG] ERROR: Database dump failed with exit code \$DUMP_EXIT_CODE"
    exit 1
fi
EOF

# Download database dump
echo "[DEBUG] Downloading database dump from Homeserver..."
sshpass -p "$HOMESERVER_PASS" scp -v -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PasswordAuthentication=yes \
    "${HOMESERVER_USER}@${HOMESERVER_HOST}:/tmp/db_dump.sql" "$DB_DUMP_FILE" 2>&1 | tee /tmp/scp_debug.log

if [ -f "$DB_DUMP_FILE" ]; then
    DUMP_SIZE=$(stat -f%z "$DB_DUMP_FILE" 2>/dev/null || stat -c%s "$DB_DUMP_FILE" 2>/dev/null || echo "unknown")
    echo "[DEBUG] Downloaded dump file size: $DUMP_SIZE bytes"
    echo -e "${GREEN}   Database dump saved to: $DB_DUMP_FILE${NC}"
else
    echo "[DEBUG] ERROR: Dump file not found after download!"
    exit 1
fi
echo ""

# 1.2 Export Upload Files
echo -e "${YELLOW}==> Exporting upload files from Homeserver...${NC}"
echo "[DEBUG] Starting upload files export..."

UPLOADS_TAR="$BACKUP_DIR/uploads_$(date +%Y%m%d_%H%M%S).tar.gz"
echo "[DEBUG] Uploads tar will be: $UPLOADS_TAR"

sshpass -p "$HOMESERVER_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PasswordAuthentication=yes \
    "${HOMESERVER_USER}@${HOMESERVER_HOST}" << EOF
cd "$HOMESERVER_DEPLOY_DIR"
echo "[DEBUG] Changed to directory: $HOMESERVER_DEPLOY_DIR"

# Get backend container name
echo "[DEBUG] Getting backend container name..."
BACKEND_CONTAINER=\$($COMPOSE_CMD -f docker-compose.homeserver.yml ps -q backend 2>/dev/null || echo "")
echo "[DEBUG] Backend container: \$BACKEND_CONTAINER"

if [ -z "\$BACKEND_CONTAINER" ]; then
    echo "[DEBUG] ERROR: Backend container not found"
    echo "[DEBUG] Listing all containers:"
    $COMPOSE_CMD -f docker-compose.homeserver.yml ps
    exit 1
fi

# Find upload directory
echo "[DEBUG] Finding upload directory..."
UPLOAD_DIR=\$(docker exec \$BACKEND_CONTAINER sh -c 'echo \${UPLOAD_DIR:-/app/uploads}' 2>/dev/null || echo "/app/uploads")
echo "[DEBUG] Upload directory: \$UPLOAD_DIR"

# Create tar archive of uploads
echo "[DEBUG] Creating tar archive of uploads..."
docker exec \$BACKEND_CONTAINER sh -c "if [ -d \$UPLOAD_DIR ] && [ \"\$(ls -A \$UPLOAD_DIR 2>/dev/null)\" ]; then tar czf /tmp/uploads.tar.gz -C \$UPLOAD_DIR . && echo 'Archive created'; else echo 'No uploads directory or empty'; fi" || echo "No uploads found"

if docker exec \$BACKEND_CONTAINER test -f /tmp/uploads.tar.gz 2>/dev/null; then
    ARCHIVE_SIZE=\$(docker exec \$BACKEND_CONTAINER stat -c%s /tmp/uploads.tar.gz 2>/dev/null || echo "unknown")
    echo "[DEBUG] Archive size: \$ARCHIVE_SIZE bytes"
    echo "Upload files archived successfully"
else
    echo "[DEBUG] No archive created (uploads directory may be empty)"
fi
EOF

# Download uploads archive
echo "[DEBUG] Downloading uploads archive from Homeserver..."
sshpass -p "$HOMESERVER_PASS" scp -v -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PasswordAuthentication=yes \
    "${HOMESERVER_USER}@${HOMESERVER_HOST}:/tmp/uploads.tar.gz" "$UPLOADS_TAR" 2>&1 | tee /tmp/scp_uploads_debug.log || {
    echo "[DEBUG] WARNING: Failed to download uploads archive"
    echo -e "${YELLOW}   WARNING: No upload files found or uploads directory is empty${NC}"
    UPLOADS_TAR=""
}

if [ -n "$UPLOADS_TAR" ] && [ -f "$UPLOADS_TAR" ]; then
    echo -e "${GREEN}   Upload files saved to: $UPLOADS_TAR${NC}"
else
    echo -e "${YELLOW}   No upload files to migrate${NC}"
fi
echo ""

# ============================================
# Phase 2: Import to Ionos
# ============================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Phase 2: Import to Ionos${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Find deployment directory on Ionos
echo -e "${YELLOW}==> Connecting to Ionos server...${NC}"
echo "[DEBUG] Attempting SSH connection to ${IONOS_USER}@${IONOS_HOST}"

IONOS_DEPLOY_DIR=$(ssh -o StrictHostKeyChecking=no -o LogLevel=ERROR "${IONOS_USER}@${IONOS_HOST}" << 'REMOTE_SCRIPT' 2>/dev/null
if [ -d "/root/4rest" ]; then
    echo "/root/4rest"
elif [ -d "/root/roots-of-impact" ]; then
    echo "/root/roots-of-impact"
elif [ -d "/var/www/4rest" ]; then
    echo "/var/www/4rest"
else
    find /root /var/www -type d -name "4rest" -o -name "roots-of-impact" 2>/dev/null | head -1
fi
REMOTE_SCRIPT
)
# Filter out any welcome messages or other output
IONOS_DEPLOY_DIR=$(echo "$IONOS_DEPLOY_DIR" | grep -E "^/" | head -1 | tr -d '\n\r')

if [ -z "$IONOS_DEPLOY_DIR" ]; then
    echo "[DEBUG] ERROR: Could not find deployment directory on Ionos"
    echo -e "${RED}ERROR: Could not find deployment directory on Ionos${NC}"
    exit 1
fi

echo "[DEBUG] Ionos deploy directory: $IONOS_DEPLOY_DIR"
echo -e "${GREEN}   Found deployment directory: $IONOS_DEPLOY_DIR${NC}"
echo ""

# Check Docker Compose command on Ionos
IONOS_COMPOSE_CMD=$(ssh -o StrictHostKeyChecking=no -o LogLevel=ERROR "${IONOS_USER}@${IONOS_HOST}" \
    "cd '$IONOS_DEPLOY_DIR' && if docker compose version >/dev/null 2>&1; then echo 'docker compose'; else echo 'docker-compose'; fi" 2>/dev/null | grep -vE "(Welcome|Documentation|Management|Support|System|Expanded|update|ESM)" | tr -d '\n\r')
# Fallback if empty
if [ -z "$IONOS_COMPOSE_CMD" ]; then
    IONOS_COMPOSE_CMD="docker compose"
fi

# 2.1 Create backup on Ionos before import
echo -e "${YELLOW}==> Creating backup on Ionos before import...${NC}"
echo "[DEBUG] Creating backup on Ionos..."

ssh -o StrictHostKeyChecking=no -o LogLevel=ERROR "${IONOS_USER}@${IONOS_HOST}" << EOF 2>/dev/null
cd "$IONOS_DEPLOY_DIR"
echo "[DEBUG] Changed to directory: $IONOS_DEPLOY_DIR"

# Get PostgreSQL container name
POSTGRES_CONTAINER=\$($IONOS_COMPOSE_CMD -f docker-compose.homeserver.yml ps -q postgres 2>/dev/null || echo "")

if [ -n "\$POSTGRES_CONTAINER" ]; then
    POSTGRES_USER=\$(grep POSTGRES_USER docker-compose.homeserver.yml | head -1 | sed 's/.*POSTGRES_USER:\${POSTGRES_USER:-\([^}]*\)}.*/\1/' | sed 's/.*POSTGRES_USER: *\([^ ]*\).*/\1/' | tr -d ' ')
    if [ -z "\$POSTGRES_USER" ] || [ "\$POSTGRES_USER" = "\${POSTGRES_USER:-roots_user}" ]; then
        POSTGRES_USER="roots_user"
    fi
    
    POSTGRES_DB=\$(grep POSTGRES_DB docker-compose.homeserver.yml | head -1 | sed 's/.*POSTGRES_DB:\${POSTGRES_DB:-\([^}]*\)}.*/\1/' | sed 's/.*POSTGRES_DB: *\([^ ]*\).*/\1/' | tr -d ' ')
    if [ -z "\$POSTGRES_DB" ] || [ "\$POSTGRES_DB" = "\${POSTGRES_DB:-roots_of_impact}" ]; then
        POSTGRES_DB="roots_of_impact"
    fi
    
    # Create backup
    docker exec \$POSTGRES_CONTAINER pg_dump -U \$POSTGRES_USER -d \$POSTGRES_DB > /tmp/ionos_backup_\$(date +%Y%m%d_%H%M%S).sql
    echo "Backup created on Ionos"
else
    echo "No existing database to backup"
fi
EOF

echo -e "${GREEN}   Backup created${NC}"
echo ""

# 2.2 Upload database dump to Ionos
echo -e "${YELLOW}==> Uploading database dump to Ionos...${NC}"
echo "[DEBUG] Uploading database dump to Ionos..."
DUMP_SIZE=$(stat -f%z "$DB_DUMP_FILE" 2>/dev/null || stat -c%s "$DB_DUMP_FILE" 2>/dev/null || echo "unknown")
echo "[DEBUG] Uploading dump file of size: $DUMP_SIZE bytes"

scp -v -o StrictHostKeyChecking=no "$DB_DUMP_FILE" "${IONOS_USER}@${IONOS_HOST}:/tmp/db_dump.sql" 2>&1 | tee /tmp/scp_ionos_debug.log

echo "[DEBUG] Database dump upload completed"
echo -e "${GREEN}   Database dump uploaded${NC}"
echo ""

# 2.3 Import database on Ionos
echo -e "${YELLOW}==> Importing database on Ionos...${NC}"
echo "[DEBUG] Starting database import on Ionos..."

ssh -o StrictHostKeyChecking=no -o LogLevel=ERROR "${IONOS_USER}@${IONOS_HOST}" << EOF 2>/dev/null
cd "$IONOS_DEPLOY_DIR"
echo "[DEBUG] Changed to directory: $IONOS_DEPLOY_DIR"

# Get PostgreSQL container name
POSTGRES_CONTAINER=\$($IONOS_COMPOSE_CMD -f docker-compose.homeserver.yml ps -q postgres 2>/dev/null || echo "")

if [ -z "\$POSTGRES_CONTAINER" ]; then
    echo "ERROR: PostgreSQL container not found. Starting containers..."
    $IONOS_COMPOSE_CMD -f docker-compose.homeserver.yml up -d postgres
    sleep 5
    POSTGRES_CONTAINER=\$($IONOS_COMPOSE_CMD -f docker-compose.homeserver.yml ps -q postgres)
fi

# Get database credentials
POSTGRES_USER=\$(grep POSTGRES_USER docker-compose.homeserver.yml | head -1 | sed 's/.*POSTGRES_USER:\${POSTGRES_USER:-\([^}]*\)}.*/\1/' | sed 's/.*POSTGRES_USER: *\([^ ]*\).*/\1/' | tr -d ' ')
if [ -z "\$POSTGRES_USER" ] || [ "\$POSTGRES_USER" = "\${POSTGRES_USER:-roots_user}" ]; then
    POSTGRES_USER="roots_user"
fi

POSTGRES_DB=\$(grep POSTGRES_DB docker-compose.homeserver.yml | head -1 | sed 's/.*POSTGRES_DB:\${POSTGRES_DB:-\([^}]*\)}.*/\1/' | sed 's/.*POSTGRES_DB: *\([^ ]*\).*/\1/' | tr -d ' ')
if [ -z "\$POSTGRES_DB" ] || [ "\$POSTGRES_DB" = "\${POSTGRES_DB:-roots_of_impact}" ]; then
    POSTGRES_DB="roots_of_impact"
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker exec \$POSTGRES_CONTAINER pg_isready -U \$POSTGRES_USER >/dev/null 2>&1; do
    echo "   PostgreSQL is unavailable - sleeping"
    sleep 2
done

# Import database dump
echo "Importing database..."
docker exec -i \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB < /tmp/db_dump.sql

# Clean up uploaded dump
rm /tmp/db_dump.sql

echo "Database import completed"
EOF

echo -e "${GREEN}   Database imported successfully${NC}"
echo ""

# 2.4 Import upload files on Ionos
if [ -n "$UPLOADS_TAR" ] && [ -f "$UPLOADS_TAR" ]; then
    echo -e "${YELLOW}==> Importing upload files on Ionos...${NC}"
    echo "[DEBUG] Uploading uploads archive to Ionos..."
    UPLOADS_SIZE=$(stat -f%z "$UPLOADS_TAR" 2>/dev/null || stat -c%s "$UPLOADS_TAR" 2>/dev/null || echo "unknown")
    echo "[DEBUG] Uploading uploads archive of size: $UPLOADS_SIZE bytes"
    
    # Upload tar file
    scp -v -o StrictHostKeyChecking=no "$UPLOADS_TAR" "${IONOS_USER}@${IONOS_HOST}:/tmp/uploads.tar.gz" 2>&1 | tee /tmp/scp_uploads_ionos_debug.log
    echo "[DEBUG] Uploads archive upload completed"
    
    # Extract in backend container
    echo "[DEBUG] Extracting uploads in backend container..."
    ssh -o StrictHostKeyChecking=no -o LogLevel=ERROR "${IONOS_USER}@${IONOS_HOST}" << EOF 2>/dev/null
cd "$IONOS_DEPLOY_DIR"
echo "[DEBUG] Changed to directory: $IONOS_DEPLOY_DIR"

# Get backend container name
echo "[DEBUG] Getting backend container name..."
BACKEND_CONTAINER=\$($IONOS_COMPOSE_CMD -f docker-compose.homeserver.yml ps -q backend 2>/dev/null || echo "")
echo "[DEBUG] Backend container: \$BACKEND_CONTAINER"

if [ -z "\$BACKEND_CONTAINER" ]; then
    echo "[DEBUG] ERROR: Backend container not found"
    echo "[DEBUG] Listing all containers:"
    $IONOS_COMPOSE_CMD -f docker-compose.homeserver.yml ps
    exit 1
fi

# Find upload directory
echo "[DEBUG] Finding upload directory..."
UPLOAD_DIR=\$(docker exec \$BACKEND_CONTAINER sh -c 'echo \${UPLOAD_DIR:-/app/uploads}' 2>/dev/null || echo "/app/uploads")
echo "[DEBUG] Upload directory: \$UPLOAD_DIR"

# Copy tar into container and extract
echo "[DEBUG] Copying archive into container..."
docker cp /tmp/uploads.tar.gz \$BACKEND_CONTAINER:/tmp/uploads.tar.gz
echo "[DEBUG] Extracting archive..."
docker exec \$BACKEND_CONTAINER sh -c "mkdir -p \$UPLOAD_DIR && cd \$UPLOAD_DIR && tar xzf /tmp/uploads.tar.gz && rm /tmp/uploads.tar.gz && chmod -R 755 \$UPLOAD_DIR"
EXTRACT_EXIT_CODE=\$?
echo "[DEBUG] Extract exit code: \$EXTRACT_EXIT_CODE"

# Clean up
rm /tmp/uploads.tar.gz

if [ \$EXTRACT_EXIT_CODE -eq 0 ]; then
    echo "Upload files imported successfully"
else
    echo "[DEBUG] WARNING: Extract may have failed"
fi
EOF
    
    echo -e "${GREEN}   Upload files imported successfully${NC}"
else
    echo -e "${YELLOW}==> Skipping upload files import (no files to migrate)${NC}"
fi
echo ""

# ============================================
# Phase 3: Validation
# ============================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Phase 3: Validation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}==> Validating migration on Ionos...${NC}"
echo "[DEBUG] Starting validation..."

ssh -o StrictHostKeyChecking=no -o LogLevel=ERROR "${IONOS_USER}@${IONOS_HOST}" << EOF 2>/dev/null
cd "$IONOS_DEPLOY_DIR"
echo "[DEBUG] Changed to directory: $IONOS_DEPLOY_DIR"

POSTGRES_CONTAINER=\$($IONOS_COMPOSE_CMD -f docker-compose.homeserver.yml ps -q postgres 2>/dev/null || echo "")

if [ -n "\$POSTGRES_CONTAINER" ]; then
    POSTGRES_USER=\$(grep POSTGRES_USER docker-compose.homeserver.yml | head -1 | sed 's/.*POSTGRES_USER:\${POSTGRES_USER:-\([^}]*\)}.*/\1/' | sed 's/.*POSTGRES_USER: *\([^ ]*\).*/\1/' | tr -d ' ')
    if [ -z "\$POSTGRES_USER" ] || [ "\$POSTGRES_USER" = "\${POSTGRES_USER:-roots_user}" ]; then
        POSTGRES_USER="roots_user"
    fi
    
    POSTGRES_DB=\$(grep POSTGRES_DB docker-compose.homeserver.yml | head -1 | sed 's/.*POSTGRES_DB:\${POSTGRES_DB:-\([^}]*\)}.*/\1/' | sed 's/.*POSTGRES_DB: *\([^ ]*\).*/\1/' | tr -d ' ')
    if [ -z "\$POSTGRES_DB" ] || [ "\$POSTGRES_DB" = "\${POSTGRES_DB:-roots_of_impact}" ]; then
        POSTGRES_DB="roots_of_impact"
    fi
    
    # Check table count
    TABLE_COUNT=\$(docker exec \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    echo "   Tables found: \$TABLE_COUNT"
    
    # Check user count
    USER_COUNT=\$(docker exec \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB -tAc "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    echo "   Users found: \$USER_COUNT"
    
    # Check task count
    TASK_COUNT=\$(docker exec \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB -tAc "SELECT COUNT(*) FROM tasks;" 2>/dev/null || echo "0")
    echo "   Tasks found: \$TASK_COUNT"
fi
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Migration completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify the application on Ionos is working correctly"
echo "  2. Check that all data is accessible"
echo "  3. Run setup-homeserver-dev.sh to configure Homeserver for development"
echo ""
echo "Backup files are stored in: $BACKUP_DIR"

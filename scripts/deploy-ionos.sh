#!/bin/bash
# Deployment script for IONOS server
# Uses SSH with passphrase-protected key

SSH_USER="root"
SSH_HOST="87.106.86.203"
SSH_KEY="$HOME/.ssh/id_ed25519"
SSH_PASSPHRASE="Tan0808zen"

# First, add key to ssh-agent if not already added
if ! ssh-add -l 2>/dev/null | grep -q "id_ed25519"; then
    echo "Adding SSH key to agent..."
    expect << 'EOF'
spawn ssh-add /Users/thomas/.ssh/id_ed25519
expect "Enter passphrase"
send "Tan0808zen\r"
expect eof
EOF
fi

# Now connect and deploy
echo "Connecting to IONOS server..."
# Häufige Keepalives + hohes CountMax: lange Remote-Skripte (Migrationen, Docker-Build) ohne „Broken pipe“
ssh -o StrictHostKeyChecking=no \
  -o TCPKeepAlive=yes \
  -o ServerAliveInterval=10 \
  -o ServerAliveCountMax=999 \
  "${SSH_USER}@${SSH_HOST}" << 'REMOTE_SCRIPT'
# Find the deployment directory
if [ -d "/root/4rest" ]; then
    DEPLOY_DIR="/root/4rest"
elif [ -d "/root/roots-of-impact" ]; then
    DEPLOY_DIR="/root/roots-of-impact"
elif [ -d "/var/www/4rest" ]; then
    DEPLOY_DIR="/var/www/4rest"
else
    echo "Deployment directory not found. Searching..."
    DEPLOY_DIR=$(find /root /var/www -type d -name "4rest" -o -name "roots-of-impact" 2>/dev/null | head -1)
    if [ -z "$DEPLOY_DIR" ]; then
        echo "ERROR: Could not find deployment directory"
        exit 1
    fi
fi

echo "Found deployment directory: $DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Load SSH key for GitHub access
echo "==> Loading SSH key for GitHub..."
eval $(ssh-agent -s) > /dev/null
expect << 'EXPECT_SCRIPT'
spawn ssh-add /root/.ssh/id_ed25519
expect "Enter passphrase"
send "Tan0808zen\r"
expect eof
EXPECT_SCRIPT

echo "==> Pulling latest changes from Git..."
# Stash local changes in node_modules if any
git stash push -m "Stashing local node_modules changes before pull" -- frontend/node_modules backend/node_modules 2>/dev/null || true
# Force pull to overwrite any local changes
git fetch origin
git reset --hard origin/dev || git reset --hard origin/main || git pull --rebase
git clean -fd

echo ""
echo "==> Pre-Deployment Checks..."

# Check if docker-compose file exists
if [ ! -f "docker-compose.homeserver.yml" ]; then
    echo "ERROR: docker-compose.homeserver.yml not found!"
    exit 1
fi
echo "✓ Docker compose file found"

# Determine Docker Compose command
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Check if containers are running (for backup and migration check)
CONTAINERS_RUNNING=false
if $COMPOSE_CMD -f docker-compose.homeserver.yml ps | grep -q "Up"; then
    CONTAINERS_RUNNING=true
fi

# Get database credentials from docker-compose
POSTGRES_USER_LINE=$(grep POSTGRES_USER docker-compose.homeserver.yml | head -1)
if echo "$POSTGRES_USER_LINE" | grep -q '\${POSTGRES_USER:-'; then
    # Extract default value from ${POSTGRES_USER:-roots_user}
    POSTGRES_USER=$(echo "$POSTGRES_USER_LINE" | sed -n 's/.*POSTGRES_USER:\${POSTGRES_USER:-\([^}]*\)}.*/\1/p')
fi
if [ -z "$POSTGRES_USER" ] || [ "$POSTGRES_USER" = "\${POSTGRES_USER:-roots_user}" ] || [ "$POSTGRES_USER" = "${POSTGRES_USER:-roots_user}" ]; then
    POSTGRES_USER="roots_user"
fi

POSTGRES_DB_LINE=$(grep POSTGRES_DB docker-compose.homeserver.yml | head -1)
if echo "$POSTGRES_DB_LINE" | grep -q '\${POSTGRES_DB:-'; then
    # Extract default value from ${POSTGRES_DB:-roots_of_impact}
    POSTGRES_DB=$(echo "$POSTGRES_DB_LINE" | sed -n 's/.*POSTGRES_DB:\${POSTGRES_DB:-\([^}]*\)}.*/\1/p')
fi
if [ -z "$POSTGRES_DB" ] || [ "$POSTGRES_DB" = "\${POSTGRES_DB:-roots_of_impact}" ] || [ "$POSTGRES_DB" = "${POSTGRES_DB:-roots_of_impact}" ]; then
    POSTGRES_DB="roots_of_impact"
fi

# Check for recent backup (within last 2 hours)
BACKUP_DIR="/root/backups"
RECENT_BACKUP_FOUND=false
SKIP_BACKUP=false
SKIP_MIGRATIONS=false

if [ -d "$BACKUP_DIR" ] && [ "$CONTAINERS_RUNNING" = true ]; then
    # Find most recent backup
    LATEST_BACKUP=$(ls -td "$BACKUP_DIR"/deployment_* 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ] && [ -f "$LATEST_BACKUP/database_backup.sql" ]; then
        # Extract timestamp from backup directory name
        BACKUP_NAME=$(basename "$LATEST_BACKUP")
        BACKUP_TIMESTAMP_STR=$(echo "$BACKUP_NAME" | sed 's/deployment_//')
        # Convert to seconds since epoch for comparison
        BACKUP_YEAR=$(echo "$BACKUP_TIMESTAMP_STR" | cut -c1-4)
        BACKUP_MONTH=$(echo "$BACKUP_TIMESTAMP_STR" | cut -c5-6)
        BACKUP_DAY=$(echo "$BACKUP_TIMESTAMP_STR" | cut -c7-8)
        BACKUP_HOUR=$(echo "$BACKUP_TIMESTAMP_STR" | cut -c10-11)
        BACKUP_MIN=$(echo "$BACKUP_TIMESTAMP_STR" | cut -c12-13)
        BACKUP_SEC=$(echo "$BACKUP_TIMESTAMP_STR" | cut -c14-15)
        
        # Calculate backup age in seconds (using stat for file modification time as fallback)
        BACKUP_FILE="$LATEST_BACKUP/database_backup.sql"
        if [ -f "$BACKUP_FILE" ]; then
            # Use file modification time as more reliable method
            BACKUP_EPOCH=$(stat -c %Y "$BACKUP_FILE" 2>/dev/null || stat -f %m "$BACKUP_FILE" 2>/dev/null || echo "0")
            if [ "$BACKUP_EPOCH" = "0" ]; then
                # Fallback: try date parsing
                BACKUP_EPOCH=$(date -d "${BACKUP_YEAR}-${BACKUP_MONTH}-${BACKUP_DAY} ${BACKUP_HOUR}:${BACKUP_MIN}:${BACKUP_SEC}" +%s 2>/dev/null || echo "0")
            fi
            CURRENT_EPOCH=$(date +%s)
            BACKUP_AGE=$((CURRENT_EPOCH - BACKUP_EPOCH))
            BACKUP_AGE_HOURS=$((BACKUP_AGE / 3600))
            
            # Consider backup "recent" if less than 2 hours old
            if [ "$BACKUP_AGE_HOURS" -lt 2 ] && [ "$BACKUP_EPOCH" -gt 0 ]; then
                RECENT_BACKUP_FOUND=true
                echo "✓ Found recent backup: $BACKUP_NAME (${BACKUP_AGE_HOURS}h old)"
            fi
        fi
    fi
fi

# Vor/Nach Vergleich für migrate (ohne langsame Namens-Schleife)
BEFORE_MIGRATE_COUNT=""

# Check if migrations are needed (quick check)
PENDING_MIGRATIONS_COUNT=0
POSTGRES_CONTAINER=""
if [ "$CONTAINERS_RUNNING" = true ]; then
    POSTGRES_CONTAINER=$($COMPOSE_CMD -f docker-compose.homeserver.yml ps -q postgres 2>/dev/null || echo "")
    if [ -n "$POSTGRES_CONTAINER" ]; then
        # Quick check: count expected migrations vs executed migrations
        EXECUTED_COUNT=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM schema_migrations;" 2>/dev/null | tr -d ' ' | grep -v '^$' || echo "0")
        # Expected: count migration files
        EXPECTED_COUNT=$(ls -1 database/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
        if [ "$EXECUTED_COUNT" -ge "$EXPECTED_COUNT" ] && [ "$EXECUTED_COUNT" -gt 0 ] && [ "$EXPECTED_COUNT" -gt 0 ]; then
            echo "✓ All migrations are up to date ($EXECUTED_COUNT/$EXPECTED_COUNT)"
            SKIP_MIGRATIONS=true
        else
            PENDING_MIGRATIONS_COUNT=$((EXPECTED_COUNT - EXECUTED_COUNT))
            if [ "$PENDING_MIGRATIONS_COUNT" -gt 0 ]; then
                echo "⏳ Found $PENDING_MIGRATIONS_COUNT pending migration(s)"
            fi
        fi
    fi
fi

# Decide if we can skip backup and migration checks
if [ "$RECENT_BACKUP_FOUND" = true ] && [ "$SKIP_MIGRATIONS" = true ]; then
    SKIP_BACKUP=true
    echo ""
    echo "🚀 Fast deployment mode: Recent backup found and no migrations needed"
    echo "   Skipping backup creation and migration checks"
    echo "   Proceeding with: Git pull → Build → Restart"
else
    echo ""
    if [ "$RECENT_BACKUP_FOUND" = false ]; then
        echo "📦 Creating backup (no recent backup found)"
    fi
    if [ "$SKIP_MIGRATIONS" = false ]; then
        echo "🔄 Migrations needed (will check and execute)"
    fi
fi

# Create backup directory (only if we need to create a backup)
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CURRENT_BACKUP_DIR="$BACKUP_DIR/deployment_$BACKUP_TIMESTAMP"

if [ "$SKIP_BACKUP" = false ]; then
    mkdir -p "$CURRENT_BACKUP_DIR"
    echo ""
    echo "==> Creating full backup before deployment..."
    echo "Backup directory: $CURRENT_BACKUP_DIR"

    # 1. Backup database
    if [ "$CONTAINERS_RUNNING" = true ]; then
        POSTGRES_CONTAINER=$($COMPOSE_CMD -f docker-compose.homeserver.yml ps -q postgres 2>/dev/null || echo "")
        if [ -n "$POSTGRES_CONTAINER" ]; then
            echo "  -> Backing up database..."
            docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-acl > "$CURRENT_BACKUP_DIR/database_backup.sql" || {
                echo "ERROR: Database backup failed!"
                exit 1
            }
            echo "  ✓ Database backup created"
        else
            echo "  ⚠ WARNING: PostgreSQL container not found, skipping database backup"
        fi
    else
        echo "  ⚠ WARNING: Containers not running, skipping database backup"
    fi

    # 2. Backup uploads volume
    echo "  -> Backing up uploads volume..."
    # Try to find uploads volume name from docker-compose
    UPLOADS_VOLUME=$(grep -A 5 "volumes:" docker-compose.homeserver.yml | grep -E "uploads|uploads_data" | head -1 | sed 's/.*- *\([^:]*\):.*/\1/' | tr -d ' ' || echo "")
    # Fallback: try common volume names
    if [ -z "$UPLOADS_VOLUME" ]; then
        UPLOADS_VOLUME=$(docker volume ls | grep -E "uploads|uploads_data" | awk '{print $2}' | head -1 || echo "")
    fi
    # Fallback: try to get from compose config
    if [ -z "$UPLOADS_VOLUME" ]; then
        UPLOADS_VOLUME=$($COMPOSE_CMD -f docker-compose.homeserver.yml config --volumes 2>/dev/null | grep -E "uploads|uploads_data" | head -1 || echo "")
    fi

    if [ -n "$UPLOADS_VOLUME" ]; then
        # Create a temporary container to access the volume
        docker run --rm -v "${UPLOADS_VOLUME}:/data" -v "$CURRENT_BACKUP_DIR:/backup" alpine tar czf /backup/uploads_backup.tar.gz -C /data . || {
            echo "ERROR: Uploads volume backup failed!"
            exit 1
        }
        echo "  ✓ Uploads volume backup created (volume: $UPLOADS_VOLUME)"
    else
        echo "  ⚠ WARNING: Uploads volume not found, skipping uploads backup"
    fi

    # 3. Backup container images (optional, but useful for rollback)
    echo "  -> Saving container image information..."
    $COMPOSE_CMD -f docker-compose.homeserver.yml images > "$CURRENT_BACKUP_DIR/container_images.txt" 2>/dev/null || true
    echo "  ✓ Container image info saved"

    # 4. Backup Git information (for rollback)
    echo "  -> Saving Git information..."
    git rev-parse HEAD > "$CURRENT_BACKUP_DIR/git_commit.txt" 2>/dev/null || true
    git branch --show-current > "$CURRENT_BACKUP_DIR/git_branch.txt" 2>/dev/null || true
    git log -1 --format="%H%n%an%n%ae%n%ad%n%s" > "$CURRENT_BACKUP_DIR/git_info.txt" 2>/dev/null || true
    echo "  ✓ Git information saved"

    echo ""
    echo "✓ Backup completed"
    echo "  Backup location: $CURRENT_BACKUP_DIR"
fi

# Migrationen: keine Schleife über 60+ Namen (war langsam, oft hinter SSH-Buffering/Timeouts,
# und die Namensliste driftete von migrate.ts ab). Kurzstatus + Ausführung nur noch via npm run migrate.
if [ "$SKIP_MIGRATIONS" = false ]; then
    echo ""
    echo "==> Migration status (summary)..."
    if [ "$CONTAINERS_RUNNING" = true ] && [ -n "$POSTGRES_CONTAINER" ]; then
        BEFORE_MIGRATE_COUNT=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -A -c "SELECT COUNT(*)::text FROM schema_migrations;" 2>/dev/null | tr -d '\r\n' || echo "0")
        echo "  → Rows in schema_migrations (before deploy migrate): ${BEFORE_MIGRATE_COUNT:-0}"
        echo "  → Pending work is applied by backend migrate.ts after containers start (single source of truth)."
    else
        echo "  ⚠ WARNING: Cannot check migrations - containers not running or database not accessible"
        echo "  → Will run migrations after deployment"
    fi
fi

echo ""
echo "==> Building Docker images..."
$COMPOSE_CMD -f docker-compose.homeserver.yml build --no-cache

echo ""
echo "==> Stopping old containers..."
$COMPOSE_CMD -f docker-compose.homeserver.yml down || true

echo ""
echo "==> Starting new containers..."
$COMPOSE_CMD -f docker-compose.homeserver.yml up -d

echo ""
echo "==> Waiting for services to start..."
sleep 10

# Run migrations only if needed
if [ "$SKIP_MIGRATIONS" = false ]; then
    echo ""
    echo "==> Running database migrations..."
    # Wait for backend to be ready
    BACKEND_CONTAINER=$($COMPOSE_CMD -f docker-compose.homeserver.yml ps -q backend 2>/dev/null || echo "")
    if [ -n "$BACKEND_CONTAINER" ]; then
        echo "Waiting for backend to be ready..."
        for i in $(seq 1 30); do
            if $COMPOSE_CMD -f docker-compose.homeserver.yml exec -T backend curl -f http://localhost:5000/health >/dev/null 2>&1; then
                echo "Backend is ready"
                break
            fi
            if [ $((i % 5)) -eq 0 ]; then
                echo "  ... still waiting for backend ($i/30)"
            fi
            if [ "$i" -eq 30 ]; then
                echo "WARNING: Backend health check failed, but continuing..."
            fi
            sleep 2
        done
        
        # Run migrations (migrate.ts automatically runs only pending migrations)
        echo "Executing database migrations..."
        echo "  → Only pending migrations will be executed"
        $COMPOSE_CMD -f docker-compose.homeserver.yml exec -T backend npm run migrate || {
            echo "ERROR: Database migrations failed!"
            echo "==> Recent backend logs:"
            $COMPOSE_CMD -f docker-compose.homeserver.yml logs --tail=50 backend
            echo ""
            if [ "$SKIP_BACKUP" = false ] && [ -n "$CURRENT_BACKUP_DIR" ]; then
                echo "⚠️  IMPORTANT: If migrations failed, you can restore from backup:"
                echo "   Backup location: $CURRENT_BACKUP_DIR"
            fi
            exit 1
        }
        echo "✓ Database migrations completed"
        
        POSTGRES_CONTAINER_AFTER=$($COMPOSE_CMD -f docker-compose.homeserver.yml ps -q postgres 2>/dev/null || echo "")
        if [ -n "$POSTGRES_CONTAINER_AFTER" ]; then
            AFTER_MIGRATE_COUNT=$(docker exec "$POSTGRES_CONTAINER_AFTER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -A -c "SELECT COUNT(*)::text FROM schema_migrations;" 2>/dev/null | tr -d '\r\n' || echo "0")
            echo "  → Rows in schema_migrations (after migrate): ${AFTER_MIGRATE_COUNT:-0}"
            if [ -n "${BEFORE_MIGRATE_COUNT}" ] && [ "${AFTER_MIGRATE_COUNT:-0}" -gt "${BEFORE_MIGRATE_COUNT}" ] 2>/dev/null; then
                echo "  ✓ Migration count increased as expected"
            elif [ -n "${BEFORE_MIGRATE_COUNT}" ] && [ "${AFTER_MIGRATE_COUNT:-0}" -ge "${BEFORE_MIGRATE_COUNT}" ] 2>/dev/null; then
                echo "  ✓ Migration count unchanged or already up to date"
            fi
        fi
    else
        echo "WARNING: Backend container not found, skipping migrations"
    fi
else
    echo ""
    echo "⏭️  Skipping migrations (all up to date)"
fi

echo ""
echo "==> Container status:"
$COMPOSE_CMD -f docker-compose.homeserver.yml ps

echo ""
echo "==> Health checks..."
BACKEND_CONTAINER=$($COMPOSE_CMD -f docker-compose.homeserver.yml ps -q backend 2>/dev/null || echo "")
# Check backend health
if [ -n "$BACKEND_CONTAINER" ]; then
    if $COMPOSE_CMD -f docker-compose.homeserver.yml exec -T backend curl -f http://localhost:5000/health >/dev/null 2>&1; then
        echo "✓ Backend health check passed"
    else
        echo "⚠ WARNING: Backend health check failed"
    fi
fi

# Check frontend
FRONTEND_CONTAINER=$($COMPOSE_CMD -f docker-compose.homeserver.yml ps -q frontend 2>/dev/null || echo "")
if [ -n "$FRONTEND_CONTAINER" ]; then
    if $COMPOSE_CMD -f docker-compose.homeserver.yml exec -T frontend curl -f http://localhost:80 >/dev/null 2>&1; then
        echo "✓ Frontend health check passed"
    else
        echo "⚠ WARNING: Frontend health check failed"
    fi
fi

echo ""
echo "==> Recent logs:"
$COMPOSE_CMD -f docker-compose.homeserver.yml logs --tail=20

echo ""
echo "✅ Deployment complete!"
REMOTE_SCRIPT

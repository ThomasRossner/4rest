#!/bin/bash
# Rollback script for IONOS server
# Restores from a deployment backup created by deploy-ionos.sh

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

# Now connect and rollback
echo "Connecting to IONOS server for rollback..."
ssh -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" << 'REMOTE_SCRIPT'
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

# Determine Docker Compose command
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Check if docker-compose file exists
if [ ! -f "docker-compose.homeserver.yml" ]; then
    echo "ERROR: docker-compose.homeserver.yml not found!"
    exit 1
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

# Backup directory
BACKUP_DIR="/root/backups"

# List available backups
echo ""
echo "==> Available backups:"
if [ ! -d "$BACKUP_DIR" ]; then
    echo "ERROR: Backup directory $BACKUP_DIR not found!"
    exit 1
fi

BACKUPS=($(ls -td "$BACKUP_DIR"/deployment_* 2>/dev/null | head -10))
if [ ${#BACKUPS[@]} -eq 0 ]; then
    echo "ERROR: No backups found in $BACKUP_DIR"
    exit 1
fi

# Display backups
for i in "${!BACKUPS[@]}"; do
    BACKUP_PATH="${BACKUPS[$i]}"
    BACKUP_NAME=$(basename "$BACKUP_PATH")
    BACKUP_DATE=$(echo "$BACKUP_NAME" | sed 's/deployment_//')
    if [ -f "$BACKUP_PATH/database_backup.sql" ]; then
        DB_SIZE=$(du -h "$BACKUP_PATH/database_backup.sql" | cut -f1)
        echo "  [$i] $BACKUP_NAME (DB: $DB_SIZE)"
    else
        echo "  [$i] $BACKUP_NAME (⚠ incomplete backup)"
    fi
done

# Select backup
echo ""
if [ -z "${BACKUP_INDEX:-}" ]; then
    echo "Select backup to restore (0-$((${#BACKUPS[@]} - 1))), or press Enter for latest [0]:"
    read -r BACKUP_INDEX
    BACKUP_INDEX=${BACKUP_INDEX:-0}
fi

if ! [[ "$BACKUP_INDEX" =~ ^[0-9]+$ ]] || [ "$BACKUP_INDEX" -lt 0 ] || [ "$BACKUP_INDEX" -ge ${#BACKUPS[@]} ]; then
    echo "ERROR: Invalid backup index"
    exit 1
fi

SELECTED_BACKUP="${BACKUPS[$BACKUP_INDEX]}"
SELECTED_BACKUP_NAME=$(basename "$SELECTED_BACKUP")

echo ""
echo "⚠️  WARNING: This will restore from backup: $SELECTED_BACKUP_NAME"
echo "   This will:"
echo "   1. Stop all containers"
echo "   2. Restore database from backup"
echo "   3. Restore uploads volume from backup"
echo "   4. Reset Git to previous state (if possible)"
echo "   5. Rebuild and restart containers"
echo ""
echo "Press Ctrl+C to cancel, or Enter to continue..."
read -r

echo ""
echo "==> Starting rollback process..."

# 1. Stop containers
echo "==> Stopping containers..."
$COMPOSE_CMD -f docker-compose.homeserver.yml down || true

# 2. Restore database
echo ""
echo "==> Restoring database..."
if [ ! -f "$SELECTED_BACKUP/database_backup.sql" ]; then
    echo "ERROR: Database backup file not found in $SELECTED_BACKUP"
    exit 1
fi

# Start postgres container if not running
$COMPOSE_CMD -f docker-compose.homeserver.yml up -d postgres
sleep 5

POSTGRES_CONTAINER=$($COMPOSE_CMD -f docker-compose.homeserver.yml ps -q postgres 2>/dev/null || echo "")
if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "ERROR: PostgreSQL container not found or could not be started"
    exit 1
fi

# Wait for postgres to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec "$POSTGRES_CONTAINER" pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; then
        echo "PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "ERROR: PostgreSQL did not become ready"
        exit 1
    fi
    sleep 1
done

# Drop and recreate database
echo "Dropping existing database..."
docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d postgres <<EOF
DROP DATABASE IF EXISTS ${POSTGRES_DB};
CREATE DATABASE ${POSTGRES_DB};
EOF

# Restore database
echo "Restoring database from backup..."
docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$SELECTED_BACKUP/database_backup.sql" || {
    echo "ERROR: Database restoration failed!"
    exit 1
}
echo "✓ Database restored"

# 3. Restore uploads volume
echo ""
echo "==> Restoring uploads volume..."
if [ -f "$SELECTED_BACKUP/uploads_backup.tar.gz" ]; then
    # Find uploads volume
    UPLOADS_VOLUME=$(grep -A 5 "volumes:" docker-compose.homeserver.yml | grep -E "uploads|uploads_data" | head -1 | sed 's/.*- *\([^:]*\):.*/\1/' | tr -d ' ' || echo "")
    if [ -z "$UPLOADS_VOLUME" ]; then
        UPLOADS_VOLUME=$(docker volume ls | grep -E "uploads|uploads_data" | awk '{print $2}' | head -1 || echo "")
    fi
    if [ -z "$UPLOADS_VOLUME" ]; then
        UPLOADS_VOLUME=$($COMPOSE_CMD -f docker-compose.homeserver.yml config --volumes 2>/dev/null | grep -E "uploads|uploads_data" | head -1 || echo "")
    fi
    
    if [ -n "$UPLOADS_VOLUME" ]; then
        echo "Restoring volume: $UPLOADS_VOLUME"
        # Remove existing volume content and restore
        docker run --rm -v "${UPLOADS_VOLUME}:/data" alpine sh -c "rm -rf /data/* /data/..?* /data/.[!.]*" || true
        docker run --rm -v "${UPLOADS_VOLUME}:/data" -v "$SELECTED_BACKUP:/backup" alpine tar xzf /backup/uploads_backup.tar.gz -C /data || {
            echo "ERROR: Uploads volume restoration failed!"
            exit 1
        }
        echo "✓ Uploads volume restored"
    else
        echo "⚠ WARNING: Uploads volume not found, skipping volume restore"
    fi
else
    echo "⚠ WARNING: Uploads backup not found, skipping volume restore"
fi

# 4. Reset Git to the exact commit from backup
echo ""
echo "==> Resetting Git repository..."

# Load SSH key for GitHub access
echo "Loading SSH key for GitHub..."
eval $(ssh-agent -s) > /dev/null
expect << 'EXPECT_SCRIPT'
spawn ssh-add /root/.ssh/id_ed25519
expect "Enter passphrase"
send "Tan0808zen\r"
expect eof
EXPECT_SCRIPT

# Fetch latest changes
git fetch origin

# Try to get commit hash from backup
if [ -f "$SELECTED_BACKUP/git_commit.txt" ]; then
    COMMIT_HASH=$(cat "$SELECTED_BACKUP/git_commit.txt" | tr -d '\n\r ' || echo "")
    if [ -n "$COMMIT_HASH" ] && [ ${#COMMIT_HASH} -eq 40 ]; then
        echo "Found commit hash in backup: $COMMIT_HASH"
        # Verify commit exists
        if git cat-file -e "$COMMIT_HASH" 2>/dev/null; then
            echo "Commit exists in repository"
            echo "Resetting to commit..."
            git reset --hard "$COMMIT_HASH" || {
                echo "⚠ WARNING: Could not reset to commit $COMMIT_HASH"
                echo "   Trying to fetch from remote..."
                git fetch origin "$COMMIT_HASH" 2>/dev/null || true
                git reset --hard "$COMMIT_HASH" || {
                    echo "⚠ WARNING: Could not reset to commit $COMMIT_HASH"
                    echo "   Repository will remain at current state"
                }
            }
        else
            echo "⚠ WARNING: Commit $COMMIT_HASH not found in repository"
            echo "   Fetching from remote..."
            git fetch origin "$COMMIT_HASH" 2>/dev/null || true
            if git cat-file -e "$COMMIT_HASH" 2>/dev/null; then
                echo "Resetting to commit..."
                git reset --hard "$COMMIT_HASH" || {
                    echo "⚠ WARNING: Could not reset to commit $COMMIT_HASH"
                    echo "   Repository will remain at current state"
                }
            else
                echo "⚠ WARNING: Could not fetch commit $COMMIT_HASH from remote"
                echo "   Repository will remain at current state"
            fi
        fi
    else
        echo "⚠ WARNING: Invalid commit hash in backup"
        echo "   Repository will remain at current state"
    fi
else
    echo "⚠ WARNING: Git commit information not found in backup"
    echo "   Trying to find commit from backup timestamp..."
    BACKUP_DATE=$(echo "$SELECTED_BACKUP_NAME" | sed 's/deployment_//')
    # Format: YYYYMMDD_HHMMSS -> YYYY-MM-DD HH:MM:SS
    BACKUP_DATE_FORMATTED=$(echo "$BACKUP_DATE" | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3 \4:\5:\6/')
    
    # Get commits from around backup time
    COMMIT_HASH=$(git log --all --until="$BACKUP_DATE_FORMATTED" --format="%H" -1 2>/dev/null || echo "")
    
    if [ -n "$COMMIT_HASH" ]; then
        echo "Found commit around backup time: $COMMIT_HASH"
        echo "Resetting to commit..."
        git reset --hard "$COMMIT_HASH" || {
            echo "⚠ WARNING: Could not reset to commit $COMMIT_HASH"
            echo "   Repository will remain at current state"
        }
    else
        echo "⚠ WARNING: Could not find commit from backup time"
        echo "   Repository will remain at current state"
        echo "   You may need to manually reset Git to the correct commit"
    fi
fi

# Show current Git state
echo ""
echo "Current Git state:"
git log -1 --oneline 2>/dev/null || echo "  (could not get Git info)"

# 5. Rebuild and restart containers
echo ""
echo "==> Rebuilding containers..."
$COMPOSE_CMD -f docker-compose.homeserver.yml build --no-cache

echo ""
echo "==> Starting containers..."
$COMPOSE_CMD -f docker-compose.homeserver.yml up -d

echo ""
echo "==> Waiting for services to start..."
sleep 10

# Health checks
echo ""
echo "==> Health checks..."
BACKEND_CONTAINER=$($COMPOSE_CMD -f docker-compose.homeserver.yml ps -q backend 2>/dev/null || echo "")
if [ -n "$BACKEND_CONTAINER" ]; then
    echo "Waiting for backend to be ready..."
    for i in {1..30}; do
        if $COMPOSE_CMD -f docker-compose.homeserver.yml exec -T backend curl -f http://localhost:5000/health >/dev/null 2>&1; then
            echo "✓ Backend health check passed"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "⚠ WARNING: Backend health check failed"
        fi
        sleep 2
    done
fi

FRONTEND_CONTAINER=$($COMPOSE_CMD -f docker-compose.homeserver.yml ps -q frontend 2>/dev/null || echo "")
if [ -n "$FRONTEND_CONTAINER" ]; then
    if $COMPOSE_CMD -f docker-compose.homeserver.yml exec -T frontend curl -f http://localhost:80 >/dev/null 2>&1; then
        echo "✓ Frontend health check passed"
    else
        echo "⚠ WARNING: Frontend health check failed"
    fi
fi

echo ""
echo "==> Container status:"
$COMPOSE_CMD -f docker-compose.homeserver.yml ps

echo ""
echo "✅ Rollback complete!"
echo "   Restored from: $SELECTED_BACKUP_NAME"
echo ""
echo "⚠️  IMPORTANT: Verify that the application is working correctly!"
REMOTE_SCRIPT

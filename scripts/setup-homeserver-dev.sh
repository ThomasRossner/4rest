#!/bin/bash
# Setup script to configure Homeserver for Development
# Resets database and configures environment for development use

set -euo pipefail

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

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Homeserver Development Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}==> Checking prerequisites...${NC}"

if ! command -v sshpass >/dev/null 2>&1; then
    echo -e "${RED}ERROR: sshpass not found. Install with: brew install hudochenkov/sshpass/sshpass${NC}"
    exit 1
fi

echo -e "${GREEN}   Prerequisites OK${NC}"
echo ""

# Find deployment directory on Homeserver
echo -e "${YELLOW}==> Connecting to Homeserver...${NC}"
HOMESERVER_DEPLOY_DIR=$(sshpass -p "$HOMESERVER_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PasswordAuthentication=yes \
    "${HOMESERVER_USER}@${HOMESERVER_HOST}" \
    "HOME_DIR=\$(getent passwd $HOMESERVER_USER | cut -d: -f6); if [ -d '$HOMESERVER_DIR' ]; then echo '$HOMESERVER_DIR'; elif [ -d '/services/roots-of-impact' ]; then echo '/services/roots-of-impact'; elif [ -d \"\$HOME_DIR/roots-of-impact\" ]; then echo \"\$HOME_DIR/roots-of-impact\"; elif [ -d \"\$HOME_DIR/4rest\" ]; then echo \"\$HOME_DIR/4rest\"; else timeout 5 find \"\$HOME_DIR\" -maxdepth 3 -type d \\( -name 'roots-of-impact' -o -name '4rest' \\) 2>/dev/null | head -1; fi")

if [ -z "$HOMESERVER_DEPLOY_DIR" ]; then
    echo -e "${RED}ERROR: Could not find deployment directory on Homeserver${NC}"
    exit 1
fi

echo -e "${GREEN}   Found deployment directory: $HOMESERVER_DEPLOY_DIR${NC}"
echo ""

# Check Docker Compose command
COMPOSE_CMD=$(sshpass -p "$HOMESERVER_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PasswordAuthentication=yes \
    "${HOMESERVER_USER}@${HOMESERVER_HOST}" \
    "cd '$HOMESERVER_DEPLOY_DIR' && if docker compose version >/dev/null 2>&1; then echo 'docker compose'; else echo 'docker-compose'; fi")

# Ask user what to do with database (or use command line argument)
if [ -n "${1:-}" ]; then
    DB_CHOICE="$1"
else
    echo -e "${YELLOW}What should happen with the database?${NC}"
    echo "  1) Reset database and seed with test data (recommended for development)"
    echo "  2) Keep existing data (for testing with real data)"
    echo "  3) Reset database but don't seed (empty database)"
    echo ""
    read -p "Enter choice [1-3] (default: 1): " DB_CHOICE
fi
DB_CHOICE=${DB_CHOICE:-1}

# ============================================
# Step 1: Stop services
# ============================================

echo ""
echo -e "${YELLOW}==> Stopping services...${NC}"

sshpass -p "$HOMESERVER_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PasswordAuthentication=yes \
    "${HOMESERVER_USER}@${HOMESERVER_HOST}" << EOF 2>/dev/null
cd "$HOMESERVER_DEPLOY_DIR"
$COMPOSE_CMD -f docker-compose.homeserver.yml down || true
EOF

echo -e "${GREEN}   Services stopped${NC}"
echo ""

# ============================================
# Step 2: Reset database if requested
# ============================================

if [ "$DB_CHOICE" = "1" ] || [ "$DB_CHOICE" = "3" ]; then
    echo -e "${YELLOW}==> Resetting database...${NC}"
    
    sshpass -p "$HOMESERVER_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PasswordAuthentication=yes \
        "${HOMESERVER_USER}@${HOMESERVER_HOST}" << EOF 2>/dev/null
cd "$HOMESERVER_DEPLOY_DIR"

# Start only PostgreSQL
$COMPOSE_CMD -f docker-compose.homeserver.yml up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
sleep 5

# Get PostgreSQL container name
POSTGRES_CONTAINER=\$($COMPOSE_CMD -f docker-compose.homeserver.yml ps -q postgres)

# Get database credentials
POSTGRES_USER=\$(grep POSTGRES_USER docker-compose.homeserver.yml | head -1 | sed 's/.*POSTGRES_USER:\${POSTGRES_USER:-\([^}]*\)}.*/\1/' | sed 's/.*POSTGRES_USER: *\([^ ]*\).*/\1/' | tr -d ' ')
if [ -z "\$POSTGRES_USER" ] || [ "\$POSTGRES_USER" = "\${POSTGRES_USER:-roots_user}" ]; then
    POSTGRES_USER="roots_user"
fi

POSTGRES_DB=\$(grep POSTGRES_DB docker-compose.homeserver.yml | head -1 | sed 's/.*POSTGRES_DB:\${POSTGRES_DB:-\([^}]*\)}.*/\1/' | sed 's/.*POSTGRES_DB: *\([^ ]*\).*/\1/' | tr -d ' ')
if [ -z "\$POSTGRES_DB" ] || [ "\$POSTGRES_DB" = "\${POSTGRES_DB:-roots_of_impact}" ]; then
    POSTGRES_DB="roots_of_impact"
fi

# Wait for PostgreSQL
until docker exec \$POSTGRES_CONTAINER pg_isready -U \$POSTGRES_USER >/dev/null 2>&1; do
    echo "   PostgreSQL is unavailable - sleeping"
    sleep 2
done

# Drop and recreate database
echo "Dropping database..."
docker exec \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d postgres -c "DROP DATABASE IF EXISTS \$POSTGRES_DB;" || true
docker exec \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d postgres -c "CREATE DATABASE \$POSTGRES_DB;"

echo "Database reset completed"
EOF
    
    echo -e "${GREEN}   Database reset completed${NC}"
    echo ""
    
    # Seed test data if requested
    if [ "$DB_CHOICE" = "1" ]; then
        echo -e "${YELLOW}==> Seeding test data...${NC}"
        
        sshpass -p "$HOMESERVER_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
            "${HOMESERVER_USER}@${HOMESERVER_HOST}" << EOF
cd "$HOMESERVER_DEPLOY_DIR"

POSTGRES_CONTAINER=\$($COMPOSE_CMD -f docker-compose.homeserver.yml ps -q postgres)

POSTGRES_USER=\$(grep POSTGRES_USER docker-compose.homeserver.yml | head -1 | sed 's/.*POSTGRES_USER:\${POSTGRES_USER:-\([^}]*\)}.*/\1/' | sed 's/.*POSTGRES_USER: *\([^ ]*\).*/\1/' | tr -d ' ')
if [ -z "\$POSTGRES_USER" ] || [ "\$POSTGRES_USER" = "\${POSTGRES_USER:-roots_user}" ]; then
    POSTGRES_USER="roots_user"
fi

POSTGRES_DB=\$(grep POSTGRES_DB docker-compose.homeserver.yml | head -1 | sed 's/.*POSTGRES_DB:\${POSTGRES_DB:-\([^}]*\)}.*/\1/' | sed 's/.*POSTGRES_DB: *\([^ ]*\).*/\1/' | tr -d ' ')
if [ -z "\$POSTGRES_DB" ] || [ "\$POSTGRES_DB" = "\${POSTGRES_DB:-roots_of_impact}" ]; then
    POSTGRES_DB="roots_of_impact"
fi

# Run migrations
echo "Running migrations..."
if [ -f "database/init-db.sh" ]; then
    docker exec -i \$POSTGRES_CONTAINER sh -c "cd /app && bash database/init-db.sh" || {
        # Alternative: run migrations manually
        if [ -d "database/migrations" ]; then
            for migration in database/migrations/0*.sql; do
                if [ -f "\$migration" ]; then
                    echo "Running migration: \$(basename \$migration)"
                    docker exec -i \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB < "\$migration" || true
                fi
            done
        fi
    }
else
    # Run migrations from database directory
    if [ -d "database/migrations" ]; then
        for migration in database/migrations/0*.sql; do
            if [ -f "\$migration" ]; then
                echo "Running migration: \$(basename \$migration)"
                docker exec -i \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB < "\$migration" || true
            fi
        done
    fi
fi

# Seed test data
echo "Seeding test data..."
if [ -f "database/seed_locations.sql" ]; then
    docker exec -i \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB < database/seed_locations.sql || true
fi

if [ -f "database/seed_example_task.sql" ]; then
    docker exec -i \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB < database/seed_example_task.sql || true
fi

if [ -f "database/seed_example_video_task.sql" ]; then
    docker exec -i \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB < database/seed_example_video_task.sql || true
fi

if [ -f "database/seed_example_photo_task.sql" ]; then
    docker exec -i \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB < database/seed_example_photo_task.sql || true
fi

if [ -f "database/seed_example_reward.sql" ]; then
    docker exec -i \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB < database/seed_example_reward.sql || true
fi

echo "Test data seeded"
EOF
        
        echo -e "${GREEN}   Test data seeded${NC}"
        echo ""
    fi
fi

# ============================================
# Step 3: Create/Update .env for Development
# ============================================

echo -e "${YELLOW}==> Configuring environment for development...${NC}"

sshpass -p "$HOMESERVER_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    "${HOMESERVER_USER}@${HOMESERVER_HOST}" << 'EOF'
cd "$HOMESERVER_DEPLOY_DIR"

# Create .env file for development if it doesn't exist
if [ ! -f ".env" ]; then
    cat > .env << 'ENVFILE'
# Development Environment Configuration
NODE_ENV=development
PORT=5000

# Database
POSTGRES_USER=roots_user
POSTGRES_PASSWORD=roots_password
POSTGRES_DB=roots_of_impact
DATABASE_URL=postgresql://roots_user:roots_password@postgres:5432/roots_of_impact
DATABASE_SSL=false

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=development-secret-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3001

# Base URL
BASE_URL=http://localhost:5000

# Frontend
VITE_API_URL=http://localhost:5000/api

# External APIs (Mock mode for development)
HOTELKIT_API_URL=
HOTELKIT_API_KEY=
SIHOT_USE_MOCK=true
SIHOT_API_URL=
SIHOT_API_KEY=
SIHOT_TIMEOUT_MS=15000
SIHOT_SYNC_INTERVAL_MS=900000
HOTEL_ID=ROI-BER
VOUCHER_API_URL=
VOUCHER_API_KEY=

# Email (Mock mode)
EMAIL_ENABLED=true
EMAIL_MOCK_MODE=true
EMAIL_FROM=noreply@4rest.local
EMAIL_FROM_NAME=4rest Development
APP_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3001

# Uploads
UPLOAD_DIR=/app/uploads
ENVFILE
    echo "Created .env file"
else
    echo ".env file already exists, updating NODE_ENV to development..."
    # Update NODE_ENV if it exists
    if grep -q "^NODE_ENV=" .env; then
        sed -i 's/^NODE_ENV=.*/NODE_ENV=development/' .env
    else
        echo "NODE_ENV=development" >> .env
    fi
    
    # Update CORS_ORIGIN for development
    if grep -q "^CORS_ORIGIN=" .env; then
        sed -i 's|^CORS_ORIGIN=.*|CORS_ORIGIN=http://localhost:3001|' .env
    else
        echo "CORS_ORIGIN=http://localhost:3001" >> .env
    fi
    
    # Update BASE_URL for development
    if grep -q "^BASE_URL=" .env; then
        sed -i 's|^BASE_URL=.*|BASE_URL=http://localhost:5000|' .env
    else
        echo "BASE_URL=http://localhost:5000" >> .env
    fi
    
    # Enable mock mode for external APIs
    if grep -q "^SIHOT_USE_MOCK=" .env; then
        sed -i 's/^SIHOT_USE_MOCK=.*/SIHOT_USE_MOCK=true/' .env
    else
        echo "SIHOT_USE_MOCK=true" >> .env
    fi
    
    if grep -q "^EMAIL_MOCK_MODE=" .env; then
        sed -i 's/^EMAIL_MOCK_MODE=.*/EMAIL_MOCK_MODE=true/' .env
    else
        echo "EMAIL_MOCK_MODE=true" >> .env
    fi
fi
EOF

echo -e "${GREEN}   Environment configured for development${NC}"
echo ""

# ============================================
# Step 4: Update docker-compose for Development
# ============================================

echo -e "${YELLOW}==> Updating docker-compose configuration...${NC}"

# Note: We'll modify the existing docker-compose.homeserver.yml to use development settings
# Alternatively, we could create a separate docker-compose.dev.yml

sshpass -p "$HOMESERVER_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PasswordAuthentication=yes \
    "${HOMESERVER_USER}@${HOMESERVER_HOST}" << EOF
cd "$HOMESERVER_DEPLOY_DIR"

# Update docker-compose.homeserver.yml to use development settings
# We'll modify the backend environment to use NODE_ENV=development
if [ -f "docker-compose.homeserver.yml" ]; then
    # Backup original
    cp docker-compose.homeserver.yml docker-compose.homeserver.yml.backup
    
    # Update NODE_ENV in backend service
    sed -i 's/NODE_ENV: production/NODE_ENV: development/' docker-compose.homeserver.yml || true
    
    # Update CORS_ORIGIN for development
    sed -i 's|CORS_ORIGIN: \${CORS_ORIGIN:-.*}|CORS_ORIGIN: \${CORS_ORIGIN:-http://localhost:3001}|' docker-compose.homeserver.yml || true
    
    # Update BASE_URL for development
    sed -i 's|BASE_URL: \${BASE_URL:-.*}|BASE_URL: \${BASE_URL:-http://localhost:5000}|' docker-compose.homeserver.yml || true
    
    echo "Updated docker-compose.homeserver.yml for development"
fi
EOF

echo -e "${GREEN}   Docker Compose configuration updated${NC}"
echo ""

# ============================================
# Step 5: Start services
# ============================================

echo -e "${YELLOW}==> Starting services in development mode...${NC}"

sshpass -p "$HOMESERVER_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PasswordAuthentication=yes \
    "${HOMESERVER_USER}@${HOMESERVER_HOST}" << EOF
cd "$HOMESERVER_DEPLOY_DIR"

# Build images if needed
echo "Building images..."
$COMPOSE_CMD -f docker-compose.homeserver.yml build --no-cache || true

# Start all services
echo "Starting services..."
$COMPOSE_CMD -f docker-compose.homeserver.yml up -d

# Wait for services
echo "Waiting for services to start..."
sleep 10

# Show status
echo ""
echo "Container status:"
$COMPOSE_CMD -f docker-compose.homeserver.yml ps
EOF

echo -e "${GREEN}   Services started${NC}"
echo ""

# ============================================
# Step 6: Validation
# ============================================

echo -e "${YELLOW}==> Validating setup...${NC}"

sshpass -p "$HOMESERVER_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PasswordAuthentication=yes \
    "${HOMESERVER_USER}@${HOMESERVER_HOST}" << EOF
cd "$HOMESERVER_DEPLOY_DIR"

# Check container status
echo "Checking containers..."
$COMPOSE_CMD -f docker-compose.homeserver.yml ps

# Check database
POSTGRES_CONTAINER=\$($COMPOSE_CMD -f docker-compose.homeserver.yml ps -q postgres 2>/dev/null || echo "")
if [ -n "\$POSTGRES_CONTAINER" ]; then
    POSTGRES_USER="roots_user"
    POSTGRES_DB="roots_of_impact"
    
    TABLE_COUNT=\$(docker exec \$POSTGRES_CONTAINER psql -U \$POSTGRES_USER -d \$POSTGRES_DB -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    echo "Database tables: \$TABLE_COUNT"
fi
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Development setup completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Homeserver is now configured for development:"
echo "  - Frontend: http://192.168.178.131:3001"
echo "  - Backend API: http://192.168.178.131:5000/api"
echo "  - NODE_ENV: development"
echo "  - Mock modes enabled for external APIs"
echo ""
echo "You can now use the Homeserver for development and testing."

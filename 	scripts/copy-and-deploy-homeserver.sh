#!/bin/bash
# Copy docker-compose.homeserver.yml to homeserver and start the application

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration - use environment variables or prompt
HOMESERVER_HOST="${HOMESERVER_HOST:-}"
HOMESERVER_USER="${HOMESERVER_USER:-}"
HOMESERVER_PASSWORD="${HOMESERVER_PASSWORD:-}"
DEPLOYMENT_PATH="${DEPLOYMENT_PATH:-}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo -e "${BLUE}==> Copy docker-compose.homeserver.yml and deploy${NC}"
echo ""

# Prompt for missing variables
if [ -z "$HOMESERVER_HOST" ]; then
  read -p "Homeserver Host (IP or hostname): " HOMESERVER_HOST
fi

if [ -z "$HOMESERVER_USER" ]; then
  read -p "SSH Username: " HOMESERVER_USER
fi

if [ -z "$HOMESERVER_PASSWORD" ]; then
  read -sp "SSH Password: " HOMESERVER_PASSWORD
  echo ""
fi

if [ -z "$DEPLOYMENT_PATH" ]; then
  read -p "Deployment path on server (e.g., /home/user/roots-of-impact): " DEPLOYMENT_PATH
fi

# Check if sshpass is available
if ! command -v sshpass >/dev/null 2>&1; then
  echo -e "${RED}ERROR: sshpass is required but not installed${NC}"
  echo "   Install with: brew install hudochenkov/sshpass/sshpass (macOS)"
  echo "   Or: sudo apt-get install sshpass (Linux)"
  exit 1
fi

# Check if docker-compose.homeserver.yml exists locally
if [ ! -f "${PROJECT_DIR}/docker-compose.homeserver.yml" ]; then
  echo -e "${RED}ERROR: docker-compose.homeserver.yml not found in project root${NC}"
  exit 1
fi

# Test SSH connection
echo -e "${BLUE}==> Testing SSH connection...${NC}"
if sshpass -p "${HOMESERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 \
  "${HOMESERVER_USER}@${HOMESERVER_HOST}" "echo 'Connection successful'" >/dev/null 2>&1; then
  echo -e "${GREEN}   SSH connection successful${NC}"
else
  echo -e "${RED}ERROR: Cannot connect to ${HOMESERVER_USER}@${HOMESERVER_HOST}${NC}"
  exit 1
fi

# Check if deployment directory exists
echo -e "${BLUE}==> Checking deployment directory...${NC}"
if sshpass -p "${HOMESERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no \
  "${HOMESERVER_USER}@${HOMESERVER_HOST}" "[ -d '${DEPLOYMENT_PATH}' ]" 2>/dev/null; then
  echo -e "${GREEN}   Directory exists: ${DEPLOYMENT_PATH}${NC}"
else
  echo -e "${RED}ERROR: Deployment directory does not exist: ${DEPLOYMENT_PATH}${NC}"
  echo "   Please create it first or clone the repository"
  exit 1
fi

# Copy docker-compose.homeserver.yml
echo -e "${BLUE}==> Copying docker-compose.homeserver.yml to server...${NC}"
sshpass -p "${HOMESERVER_PASSWORD}" scp -o StrictHostKeyChecking=no \
  "${PROJECT_DIR}/docker-compose.homeserver.yml" \
  "${HOMESERVER_USER}@${HOMESERVER_HOST}:${DEPLOYMENT_PATH}/docker-compose.homeserver.yml"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}   File copied successfully${NC}"
else
  echo -e "${RED}ERROR: Failed to copy file${NC}"
  exit 1
fi

# Start the application
echo ""
echo -e "${BLUE}==> Starting application on homeserver...${NC}"
echo ""

sshpass -p "${HOMESERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -t \
  "${HOMESERVER_USER}@${HOMESERVER_HOST}" <<EOF
cd "${DEPLOYMENT_PATH}"

# Use docker compose (v2) if available, otherwise docker-compose (v1)
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  COMPOSE_CMD="docker-compose"
fi

# Build and start
echo "Building Docker images..."
$COMPOSE_CMD -f docker-compose.homeserver.yml build --no-cache

echo ""
echo "Stopping old containers..."
$COMPOSE_CMD -f docker-compose.homeserver.yml down || true

echo ""
echo "Starting containers..."
$COMPOSE_CMD -f docker-compose.homeserver.yml up -d

echo ""
echo "Waiting for services to start..."
sleep 5

echo ""
echo "Container status:"
$COMPOSE_CMD -f docker-compose.homeserver.yml ps

echo ""
echo "Recent logs:"
\$COMPOSE_CMD -f docker-compose.homeserver.yml logs --tail=20
EOF

DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
  echo ""
  echo "Services should be running on:"
  echo "  - Frontend: http://${HOMESERVER_HOST}:3001"
  echo "  - Backend API: http://${HOMESERVER_HOST}:5000/api"
else
  echo ""
  echo -e "${RED}❌ Deployment failed with exit code: ${DEPLOY_EXIT_CODE}${NC}"
  exit $DEPLOY_EXIT_CODE
fi

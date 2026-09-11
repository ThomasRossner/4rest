#!/bin/bash
# Deployment script for Roots of Impact on Homeserver
# This script handles Git pull, Docker build, and container restart

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "$PROJECT_DIR"

echo "==> Roots of Impact Homeserver Deployment"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}WARN: .env file not found${NC}"
  if [ -f "env.homeserver.example" ]; then
    echo "   Creating .env from env.homeserver.example..."
    cp env.homeserver.example .env
    echo -e "${YELLOW}   Please edit .env file with your production values!${NC}"
    echo "   Press Enter to continue or Ctrl+C to abort..."
    read -r
  else
    echo -e "${RED}ERROR: .env file not found and no env.homeserver.example template available${NC}"
    exit 1
  fi
fi

# Check if docker-compose is available
if ! command -v docker-compose >/dev/null 2>&1 && ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}ERROR: docker-compose or docker not found${NC}"
  exit 1
fi

# Use docker compose (v2) if available, otherwise docker-compose (v1)
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  COMPOSE_CMD="docker-compose"
fi

# Git pull
echo "==> Updating code from Git..."
if [ -d ".git" ]; then
  git pull || {
    echo -e "${YELLOW}WARN: Git pull failed, continuing with existing code...${NC}"
  }
  echo -e "${GREEN}   Code updated${NC}"
else
  echo -e "${YELLOW}WARN: Not a Git repository, skipping Git pull${NC}"
fi

# Build Docker images
echo ""
echo "==> Building Docker images..."
$COMPOSE_CMD -f docker-compose.homeserver.yml build --no-cache || {
  echo -e "${RED}ERROR: Docker build failed${NC}"
  exit 1
}
echo -e "${GREEN}   Images built successfully${NC}"

# Stop old containers
echo ""
echo "==> Stopping old containers..."
$COMPOSE_CMD -f docker-compose.homeserver.yml down || {
  echo -e "${YELLOW}WARN: Some containers may not have stopped cleanly${NC}"
}

# Start new containers
echo ""
echo "==> Starting new containers..."
$COMPOSE_CMD -f docker-compose.homeserver.yml up -d || {
  echo -e "${RED}ERROR: Failed to start containers${NC}"
  exit 1
}

# Wait for services to be healthy
echo ""
echo "==> Waiting for services to be ready..."
sleep 5

# Check container status
echo ""
echo "==> Container status:"
$COMPOSE_CMD -f docker-compose.homeserver.yml ps

# Health check
echo ""
echo "==> Performing health checks..."

# Check backend
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health 2>/dev/null || echo "000")
if [ "$BACKEND_HEALTH" = "200" ]; then
  echo -e "${GREEN}   Backend: Healthy${NC}"
else
  echo -e "${YELLOW}   Backend: Not responding (HTTP $BACKEND_HEALTH)${NC}"
  echo "   Checking logs..."
  $COMPOSE_CMD -f docker-compose.homeserver.yml logs --tail=20 backend
fi

# Check frontend
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")
if [ "$FRONTEND_HEALTH" = "200" ]; then
  echo -e "${GREEN}   Frontend: Healthy${NC}"
else
  echo -e "${YELLOW}   Frontend: Not responding (HTTP $FRONTEND_HEALTH)${NC}"
  echo "   Checking logs..."
  $COMPOSE_CMD -f docker-compose.homeserver.yml logs --tail=20 frontend
fi

# Show logs if there are issues
if [ "$BACKEND_HEALTH" != "200" ] || [ "$FRONTEND_HEALTH" != "200" ]; then
  echo ""
  echo -e "${YELLOW}==> Recent logs (last 30 lines):${NC}"
  $COMPOSE_CMD -f docker-compose.homeserver.yml logs --tail=30
fi

echo ""
echo "==> Deployment complete!"
echo ""
echo "Services:"
echo "  - Frontend: http://localhost:3001"
echo "  - Backend API: http://localhost:5000/api"
echo ""
echo "Useful commands:"
echo "  - View logs: $COMPOSE_CMD -f docker-compose.homeserver.yml logs -f"
echo "  - Stop: $COMPOSE_CMD -f docker-compose.homeserver.yml down"
echo "  - Restart: $COMPOSE_CMD -f docker-compose.homeserver.yml restart"


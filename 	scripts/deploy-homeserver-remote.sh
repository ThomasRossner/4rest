#!/bin/bash
# Remote deployment script for Roots of Impact on Homeserver
# This script runs the deployment on the homeserver via SSH from the development machine
#
# Configuration via environment variables:
#   HOMESERVER_HOST       - Hostname or IP of the homeserver (default: homeserver)
#   HOMESERVER_USER       - SSH username (default: neueradmin)
#   HOMESERVER_PASSWORD   - SSH password (default: REMOVED_PASSWORD)
#   DEPLOYMENT_PATH       - Path on homeserver where app is deployed (default: /home/neueradmin/roots-of-impact)
#   REPO_URL              - Git repository URL (only needed for first-time setup)

set -euo pipefail

# Configuration with defaults
HOMESERVER_HOST="${HOMESERVER_HOST:-homeserver}"
HOMESERVER_USER="${HOMESERVER_USER:-neueradmin}"
HOMESERVER_PASSWORD="${HOMESERVER_PASSWORD:-REMOVED_PASSWORD}"
DEPLOYMENT_PATH="${DEPLOYMENT_PATH:-/home/neueradmin/roots-of-impact}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==> Roots of Impact - Remote Deployment to Homeserver${NC}"
echo ""

# Check if sshpass is available
if ! command -v sshpass >/dev/null 2>&1; then
  echo -e "${RED}ERROR: sshpass is required but not installed${NC}"
  echo "   Install with: brew install hudochenkov/sshpass/sshpass (macOS)"
  echo "   Or: sudo apt-get install sshpass (Linux)"
  exit 1
fi

# Check SSH connection
echo -e "${BLUE}==> Testing SSH connection to ${HOMESERVER_USER}@${HOMESERVER_HOST}...${NC}"
if sshpass -p "${HOMESERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 \
  "${HOMESERVER_USER}@${HOMESERVER_HOST}" "echo 'Connection successful'" >/dev/null 2>&1; then
  echo -e "${GREEN}   SSH connection successful${NC}"
else
  echo -e "${RED}ERROR: Cannot connect to ${HOMESERVER_USER}@${HOMESERVER_HOST}${NC}"
  echo "   Please check:"
  echo "   - SSH is enabled on the homeserver"
  echo "   - Host is reachable"
  echo "   - Credentials are correct"
  exit 1
fi

# Check if deployment directory exists
echo -e "${BLUE}==> Checking deployment directory...${NC}"
if sshpass -p "${HOMESERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no \
  "${HOMESERVER_USER}@${HOMESERVER_HOST}" "[ -d '${DEPLOYMENT_PATH}' ]" 2>/dev/null; then
  echo -e "${GREEN}   Directory exists: ${DEPLOYMENT_PATH}${NC}"
else
  echo -e "${YELLOW}   Directory does not exist: ${DEPLOYMENT_PATH}${NC}"
  echo "   Creating directory and cloning repository..."
  
  # Ask for repository URL if not set
  if [ -z "${REPO_URL:-}" ]; then
    echo ""
    echo -e "${YELLOW}   REPO_URL environment variable not set${NC}"
    read -p "Enter Git repository URL: " REPO_URL
    if [ -z "${REPO_URL}" ]; then
      echo -e "${RED}ERROR: Repository URL is required${NC}"
      exit 1
    fi
  fi
  
  # Create directory and clone
  echo "   Cloning repository..."
  echo -e "${YELLOW}   Note: For private repositories, you may need to clone manually first${NC}"
  
  # Check if directory was created in the meantime
  sleep 2
  if sshpass -p "${HOMESERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no \
    "${HOMESERVER_USER}@${HOMESERVER_HOST}" "[ -d '${DEPLOYMENT_PATH}' ]" 2>/dev/null; then
    echo -e "${GREEN}   Directory now exists (may have been created manually)${NC}"
  else
    # Try to clone (non-interactive, with environment variable to prevent prompts)
    echo "   Attempting to clone (this may take a moment)..."
    
    # Use a background process with timeout simulation
    (sshpass -p "${HOMESERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
      "${HOMESERVER_USER}@${HOMESERVER_HOST}" bash -s <<REMOTE_SCRIPT
set -e
DEPLOYMENT_PATH_VAR="${DEPLOYMENT_PATH}"
REPO_URL_VAR="${REPO_URL}"

mkdir -p "\$(dirname "\${DEPLOYMENT_PATH_VAR}")"
cd "\$(dirname "\${DEPLOYMENT_PATH_VAR}")"

if [ -d "\$(basename "\${DEPLOYMENT_PATH_VAR}")" ]; then
  echo "EXISTS"
  exit 0
fi

# Try to clone (non-interactive)
export GIT_TERMINAL_PROMPT=0
export GIT_ASKPASS=/bin/echo
git clone "\${REPO_URL_VAR}" "\$(basename "\${DEPLOYMENT_PATH_VAR}")" 2>&1 | head -5
echo "CLONED"
REMOTE_SCRIPT
    ) &
    
    CLONE_PID=$!
    CLONE_TIMEOUT=15
    CLONE_COUNT=0
    
    while kill -0 $CLONE_PID 2>/dev/null && [ $CLONE_COUNT -lt $CLONE_TIMEOUT ]; do
      sleep 1
      CLONE_COUNT=$((CLONE_COUNT + 1))
    done
    
    if kill -0 $CLONE_PID 2>/dev/null; then
      kill $CLONE_PID 2>/dev/null || true
      echo -e "${YELLOW}   Clone attempt timed out or requires interactive authentication${NC}"
    else
      wait $CLONE_PID
      CLONE_EXIT_CODE=$?
    fi
    
    # Check if directory exists now
    if sshpass -p "${HOMESERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no \
      "${HOMESERVER_USER}@${HOMESERVER_HOST}" "[ -d '${DEPLOYMENT_PATH}' ]" 2>/dev/null; then
      echo -e "${GREEN}   Repository directory created${NC}"
    else
      echo -e "${YELLOW}   Git clone may require manual intervention${NC}"
      echo ""
      echo "   For private repositories, please clone manually:"
      echo "   ssh ${HOMESERVER_USER}@${HOMESERVER_HOST}"
      echo "   cd $(dirname "${DEPLOYMENT_PATH}")"
      echo "   git clone ${REPO_URL} $(basename "${DEPLOYMENT_PATH}")"
      echo ""
      read -p "Continue anyway (if repo exists or will be created manually)? (y/n) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
      fi
    fi
  fi
fi

# Check if .env file exists on server
echo -e "${BLUE}==> Checking environment configuration...${NC}"
ENV_EXISTS=$(sshpass -p "${HOMESERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no \
  "${HOMESERVER_USER}@${HOMESERVER_HOST}" "[ -f '${DEPLOYMENT_PATH}/.env' ]" 2>/dev/null && echo "yes" || echo "no")

if [ "$ENV_EXISTS" = "no" ]; then
  echo -e "${YELLOW}   .env file not found on server${NC}"
  echo "   Creating from template..."
  
  # Get script and project directories
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
  
  # First check if template exists on server
  TEMPLATE_ON_SERVER=$(sshpass -p "${HOMESERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no \
    "${HOMESERVER_USER}@${HOMESERVER_HOST}" \
    "cd '${DEPLOYMENT_PATH}' && ([ -f 'env.homeserver.example' ] && echo 'env.homeserver.example' || ([ -f '.env.homeserver.example' ] && echo '.env.homeserver.example' || echo 'none'))" 2>/dev/null)
  
  if [ "$TEMPLATE_ON_SERVER" != "none" ] && [ -n "$TEMPLATE_ON_SERVER" ]; then
    # Template exists on server, copy it
    sshpass -p "${HOMESERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no \
      "${HOMESERVER_USER}@${HOMESERVER_HOST}" \
      "cd '${DEPLOYMENT_PATH}' && cp '${TEMPLATE_ON_SERVER}' .env" >/dev/null 2>&1
    echo -e "${GREEN}   Created .env from ${TEMPLATE_ON_SERVER} on server${NC}"
  elif [ -f "${PROJECT_DIR}/env.homeserver.example" ]; then
    # Template not on server, copy from local
    echo "   Copying template from local repository..."
    sshpass -p "${HOMESERVER_PASSWORD}" scp -o StrictHostKeyChecking=no \
      "${PROJECT_DIR}/env.homeserver.example" \
      "${HOMESERVER_USER}@${HOMESERVER_HOST}:${DEPLOYMENT_PATH}/.env" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}   Created .env from local template${NC}"
    else
      echo -e "${RED}   ERROR: Failed to copy template${NC}"
      exit 1
    fi
  else
    echo -e "${RED}   ERROR: Environment template not found${NC}"
    echo "   Please create .env file manually on the server"
    exit 1
  fi
  
  echo -e "${YELLOW}   WARNING: Please edit .env file on the server with production values!${NC}"
else
  echo -e "${GREEN}   .env file exists${NC}"
fi

# Run deployment on server
echo ""
echo -e "${BLUE}==> Running deployment on homeserver...${NC}"
echo ""

# Execute deployment script on server
sshpass -p "${HOMESERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -t \
  "${HOMESERVER_USER}@${HOMESERVER_HOST}" <<EOF
cd "${DEPLOYMENT_PATH}"
if [ -f "./scripts/deploy-homeserver.sh" ]; then
  chmod +x ./scripts/deploy-homeserver.sh
  ./scripts/deploy-homeserver.sh
else
  echo -e "${RED}ERROR: deploy-homeserver.sh not found${NC}"
  exit 1
fi
EOF

DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
  echo ""
  echo "Services should be running on:"
  echo "  - Frontend: http://${HOMESERVER_HOST}:3001"
  echo "  - Backend API: http://${HOMESERVER_HOST}:5000/api"
  echo ""
  echo "To check status, run:"
  echo "  sshpass -p '${HOMESERVER_PASSWORD}' ssh ${HOMESERVER_USER}@${HOMESERVER_HOST} 'cd ${DEPLOYMENT_PATH} && docker-compose -f docker-compose.homeserver.yml ps'"
else
  echo ""
  echo -e "${RED}❌ Deployment failed with exit code: ${DEPLOY_EXIT_CODE}${NC}"
  echo ""
  echo "To debug, SSH into the server and check logs:"
  echo "  sshpass -p '${HOMESERVER_PASSWORD}' ssh ${HOMESERVER_USER}@${HOMESERVER_HOST}"
  echo "  cd ${DEPLOYMENT_PATH}"
  echo "  docker-compose -f docker-compose.homeserver.yml logs"
  exit $DEPLOY_EXIT_CODE
fi


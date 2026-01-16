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
echo "==> Building Docker images..."
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD -f docker-compose.homeserver.yml build --no-cache

echo ""
echo "==> Stopping old containers..."
$COMPOSE_CMD -f docker-compose.homeserver.yml down || true

echo ""
echo "==> Starting new containers..."
$COMPOSE_CMD -f docker-compose.homeserver.yml up -d

echo ""
echo "==> Waiting for services to start..."
sleep 5

echo ""
echo "==> Container status:"
$COMPOSE_CMD -f docker-compose.homeserver.yml ps

echo ""
echo "==> Recent logs:"
$COMPOSE_CMD -f docker-compose.homeserver.yml logs --tail=20

echo ""
echo "✅ Deployment complete!"
REMOTE_SCRIPT

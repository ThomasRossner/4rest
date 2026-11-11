#!/bin/bash
# Startet das Deployment auf dem IONOS-Server.
# Lokal und in GitHub Actions: Schlüssel und Passphrase kommen aus der Umgebung.
#
#   IONOS_SSH_PASSPHRASE   Pflicht. Entsperrt den Schlüssel zum Server und,
#                          falls SERVER_GIT_SSH_PASSPHRASE fehlt, den GitHub-Schlüssel auf dem Server.
#   IONOS_SSH_KEY_PATH     Standard: ~/.ssh/id_ed25519
#   IONOS_HOST             Standard: 87.106.86.203
#   IONOS_USER             Standard: root
#   DEPLOY_NO_CACHE        Standard: 1 (voller Image-Rebuild). 0 nutzt den Docker-Layer-Cache.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ionos-ssh-add.sh
source "$SCRIPT_DIR/ionos-ssh-add.sh"

export IONOS_HOST="${IONOS_HOST:-87.106.86.203}"
export IONOS_USER="${IONOS_USER:-root}"
DEPLOY_NO_CACHE="${DEPLOY_NO_CACHE:-1}"
SERVER_GIT_SSH_PASSPHRASE="${SERVER_GIT_SSH_PASSPHRASE:-$IONOS_SSH_PASSPHRASE}"

echo "Connecting to IONOS server... (DEPLOY_NO_CACHE=${DEPLOY_NO_CACHE})"
ionos_ssh_add_key

{
  printf 'export SERVER_GIT_SSH_PASSPHRASE=%q\n' "$SERVER_GIT_SSH_PASSPHRASE"
  printf 'export DEPLOY_NO_CACHE=%q\n' "$DEPLOY_NO_CACHE"
  cat "$SCRIPT_DIR/deploy-ionos-remote.sh"
} | ssh -o StrictHostKeyChecking=accept-new \
  -o TCPKeepAlive=yes \
  -o ServerAliveInterval=10 \
  -o ServerAliveCountMax=999 \
  "${IONOS_USER}@${IONOS_HOST}" bash -s

#!/bin/bash
# Release script: Git commit, push und Deployment auf IONOS
# Wird automatisch ausgeführt, wenn im Agenten "Feature-Entwicklung" das Wort "release" geschrieben wird

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

echo "🚀 Release-Prozess gestartet..."
echo ""

# Prüfe Git-Status
if [ ! -d ".git" ]; then
    echo -e "${RED}ERROR: Kein Git-Repository gefunden${NC}"
    exit 1
fi

# Prüfe ob es Änderungen gibt
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}WARN: Keine Änderungen zum Committen gefunden${NC}"
    echo "Fahre trotzdem mit Push und Deployment fort..."
else
    echo "==> Änderungen gefunden, erstelle Commit..."
    
    # Erstelle Commit mit automatischer Message
    COMMIT_MESSAGE="Release: $(date '+%Y-%m-%d %H:%M:%S')"
    
    git add -A
    git commit -m "$COMMIT_MESSAGE" || {
        echo -e "${YELLOW}WARN: Commit fehlgeschlagen oder bereits committed${NC}"
    }
    echo -e "${GREEN}✓ Commit erstellt${NC}"
fi

# Git Push
echo ""
echo "==> Pushe Änderungen zu Git..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Aktueller Branch: $CURRENT_BRANCH"

git push origin "$CURRENT_BRANCH" || {
    echo -e "${RED}ERROR: Git Push fehlgeschlagen${NC}"
    exit 1
}
echo -e "${GREEN}✓ Git Push erfolgreich${NC}"

# Deployment auf IONOS
echo ""
echo "==> Starte Deployment auf IONOS..."
"$SCRIPT_DIR/deploy-ionos.sh" || {
    echo -e "${RED}ERROR: Deployment fehlgeschlagen${NC}"
    exit 1
}

echo ""
echo -e "${GREEN}✅ Release-Prozess erfolgreich abgeschlossen!${NC}"
echo "   - Git Commit & Push: ✓"
echo "   - Deployment auf IONOS: ✓"

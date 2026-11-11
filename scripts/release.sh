#!/bin/bash
# Release script: Git commit und push.
# Das Deployment auf luise.bio startet danach in GitHub Actions, sobald main
# und die CI/CD Pipeline grün sind (Workflow „Deploy luise.bio“).

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

echo ""
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "${GREEN}✅ Push auf main ist durch.${NC}"
    echo "   Das Deployment auf luise.bio startet in GitHub Actions,"
    echo "   sobald der Workflow „CI/CD Pipeline“ grün ist."
    echo "   Manuell: Actions → Deploy luise.bio → Run workflow."
else
    echo -e "${GREEN}✅ Push auf ${CURRENT_BRANCH} ist durch.${NC}"
    echo "   Ausgerollt wird nur main. Nach dem Merge und grüner CI"
    echo "   startet „Deploy luise.bio“ das Deployment."
fi

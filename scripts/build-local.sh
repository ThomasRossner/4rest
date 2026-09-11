#!/bin/bash
# Lokales Build-Skript für 4rest
# Baut Frontend und Backend für lokale Tests

set -euo pipefail

echo "==> Building 4rest locally..."
echo ""

# Prüfe ob wir im Projekt-Root sind
if [ ! -f "package.json" ]; then
    echo "❌ Error: Bitte im Projekt-Root ausführen"
    exit 1
fi

# Installiere Dependencies falls nötig
if [ ! -d "node_modules" ] || [ ! -d "frontend/node_modules" ] || [ ! -d "backend/node_modules" ]; then
    echo "==> Installing dependencies..."
    npm run install:all
    echo ""
fi

# Baue Backend
echo "==> Building backend..."
cd backend
npm run build
cd ..
echo "   ✓ Backend built successfully"
echo ""

# Baue Frontend
echo "==> Building frontend..."
cd frontend
npm run build
cd ..
echo "   ✓ Frontend built successfully"
echo ""

echo "✅ Build complete!"
echo ""
echo "Backend build output: backend/dist/"
echo "Frontend build output: frontend/dist/"
echo ""
echo "To start the application:"
echo "  Backend:  cd backend && npm start"
echo "  Frontend: cd frontend && npm run preview"

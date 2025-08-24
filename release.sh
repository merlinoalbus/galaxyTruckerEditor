#!/bin/bash
# release.sh - Script automatico per release Galaxy Trucker Editor

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Controlla parametri
if [ "$1" != "patch" ] && [ "$1" != "minor" ] && [ "$1" != "major" ]; then
    echo -e "${RED}Uso: ./release.sh [patch|minor|major]${NC}"
    echo -e "  patch: bug fix (1.0.0 → 1.0.1)"
    echo -e "  minor: nuove feature (1.0.0 → 1.1.0)"
    echo -e "  major: breaking changes (1.0.0 → 2.0.0)"
    exit 1
fi

# Verifica Docker sia in esecuzione
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker non è in esecuzione!${NC}"
    echo -e "${YELLOW}Avvia Docker Desktop e riprova${NC}"
    exit 1
fi

# Verifica gh CLI sia installato
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️ GitHub CLI (gh) non installato${NC}"
    echo -e "Installa con: winget install GitHub.cli"
    SKIP_GH_RELEASE=true
else
    SKIP_GH_RELEASE=false
fi

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 Galaxy Trucker Editor Release     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 1. Aggiorna versione
echo -e "${GREEN}📝 Aggiornando versione ($1)...${NC}"
npm version $1 --no-git-tag-version
cd server && npm version $1 --no-git-tag-version && cd ..
VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}✅ Nuova versione: ${YELLOW}v$VERSION${NC}"
echo ""

# 2. Build immagini
echo -e "${GREEN}🏗️  Building Docker images...${NC}"
echo -e "${BLUE}  Backend...${NC}"
docker build -f server/Dockerfile -t ghcr.io/merlinoalbus/galaxy-trucker-backend:$VERSION ./server
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build backend fallito!${NC}"
    exit 1
fi

echo -e "${BLUE}  Frontend...${NC}"
docker build -f Dockerfile.frontend -t ghcr.io/merlinoalbus/galaxy-trucker-frontend:$VERSION .
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build frontend fallito!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build completate${NC}"
echo ""

# 3. Tag come latest
echo -e "${GREEN}🏷️  Tagging as latest...${NC}"
docker tag ghcr.io/merlinoalbus/galaxy-trucker-backend:$VERSION ghcr.io/merlinoalbus/galaxy-trucker-backend:latest
docker tag ghcr.io/merlinoalbus/galaxy-trucker-frontend:$VERSION ghcr.io/merlinoalbus/galaxy-trucker-frontend:latest
echo -e "${GREEN}✅ Tag applicati${NC}"
echo ""

# 4. Push su registry
echo -e "${GREEN}📤 Pushing to GitHub Container Registry...${NC}"
echo -e "${BLUE}  Backend v$VERSION...${NC}"
docker push ghcr.io/merlinoalbus/galaxy-trucker-backend:$VERSION
echo -e "${BLUE}  Backend latest...${NC}"
docker push ghcr.io/merlinoalbus/galaxy-trucker-backend:latest

echo -e "${BLUE}  Frontend v$VERSION...${NC}"
docker push ghcr.io/merlinoalbus/galaxy-trucker-frontend:$VERSION
echo -e "${BLUE}  Frontend latest...${NC}"
docker push ghcr.io/merlinoalbus/galaxy-trucker-frontend:latest
echo -e "${GREEN}✅ Push completato${NC}"
echo ""

# 5. Git commit e tag
echo -e "${GREEN}📋 Creating Git commit e tag...${NC}"
git add .
git commit -m "chore: release v$VERSION

- Backend: ghcr.io/merlinoalbus/galaxy-trucker-backend:$VERSION
- Frontend: ghcr.io/merlinoalbus/galaxy-trucker-frontend:$VERSION"
git tag -a "v$VERSION" -m "Release v$VERSION"
git push
git push origin "v$VERSION"
echo -e "${GREEN}✅ Git tag creato${NC}"
echo ""

# 6. GitHub release (se gh è installato)
if [ "$SKIP_GH_RELEASE" = false ]; then
    echo -e "${GREEN}🎉 Creating GitHub release...${NC}"
    gh release create "v$VERSION" \
      --title "Release v$VERSION" \
      --notes "## 🐳 Docker Images
- Backend: \`ghcr.io/merlinoalbus/galaxy-trucker-backend:$VERSION\`
- Frontend: \`ghcr.io/merlinoalbus/galaxy-trucker-frontend:$VERSION\`

## 📦 Aggiornamento TrueNAS
Per aggiornare su TrueNAS:
\`\`\`bash
docker pull ghcr.io/merlinoalbus/galaxy-trucker-backend:latest
docker pull ghcr.io/merlinoalbus/galaxy-trucker-frontend:latest
# Poi riavvia l'app da TrueNAS UI
\`\`\`"
    echo -e "${GREEN}✅ GitHub release creata${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Release v$VERSION Completata!     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📢 Prossimi passi:${NC}"
echo -e "  1. Vai su TrueNAS Web UI → Apps → Galaxy Trucker"
echo -e "  2. Click 'Check for Updates'"
echo -e "  3. Click 'Update' se disponibile"
echo -e ""
echo -e "${BLUE}🔗 Oppure via SSH:${NC}"
echo -e "  ssh root@192.168.1.26"
echo -e "  docker pull ghcr.io/merlinoalbus/galaxy-trucker-backend:latest"
echo -e "  docker pull ghcr.io/merlinoalbus/galaxy-trucker-frontend:latest"
echo -e "  # Riavvia da TrueNAS UI"
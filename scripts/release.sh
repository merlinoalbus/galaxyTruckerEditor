#!/bin/bash
# release.sh - Script automatico per release

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Controlla parametri
if [ "$1" != "patch" ] && [ "$1" != "minor" ] && [ "$1" != "major" ]; then
    echo -e "${RED}Uso: ./release.sh [patch|minor|major]${NC}"
    exit 1
fi

# Verifica Docker sia in esecuzione
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker non è in esecuzione!${NC}"
    exit 1
fi

echo -e "${YELLOW}🚀 Iniziando release $1...${NC}"

# 1. Aggiorna versione
echo -e "${GREEN}📝 Aggiornando versione...${NC}"
npm version $1 --no-git-tag-version
cd server && npm version $1 --no-git-tag-version && cd ..
VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}✅ Nuova versione: $VERSION${NC}"

# 2. Build immagini
echo -e "${GREEN}🏗️ Building Docker images...${NC}"
docker build -f server/Dockerfile -t ghcr.io/merlinoalbus/galaxy-trucker-backend:$VERSION ./server
docker build -f Dockerfile.frontend -t ghcr.io/merlinoalbus/galaxy-trucker-frontend:$VERSION .

# 3. Tag come latest
echo -e "${GREEN}🏷️ Tagging as latest...${NC}"
docker tag ghcr.io/merlinoalbus/galaxy-trucker-backend:$VERSION ghcr.io/merlinoalbus/galaxy-trucker-backend:latest
docker tag ghcr.io/merlinoalbus/galaxy-trucker-frontend:$VERSION ghcr.io/merlinoalbus/galaxy-trucker-frontend:latest

# 4. Push su registry
echo -e "${GREEN}📤 Pushing to registry...${NC}"
docker push ghcr.io/merlinoalbus/galaxy-trucker-backend:$VERSION
docker push ghcr.io/merlinoalbus/galaxy-trucker-backend:latest
docker push ghcr.io/merlinoalbus/galaxy-trucker-frontend:$VERSION
docker push ghcr.io/merlinoalbus/galaxy-trucker-frontend:latest

# 5. Git commit e tag
echo -e "${GREEN}📋 Creating Git tag...${NC}"
git add .
git commit -m "chore: release v$VERSION"
git tag -a "v$VERSION" -m "Release v$VERSION"
git push
git push origin "v$VERSION"

# 6. GitHub release
echo -e "${GREEN}🎉 Creating GitHub release...${NC}"
gh release create "v$VERSION" \
  --title "v$VERSION" \
  --notes "Docker images available:
- Backend: ghcr.io/merlinoalbus/galaxy-trucker-backend:$VERSION
- Frontend: ghcr.io/merlinoalbus/galaxy-trucker-frontend:$VERSION"

echo -e "${GREEN}✅ Release v$VERSION completata con successo!${NC}"
echo -e "${YELLOW}📢 Ricorda di aggiornare TrueNAS con la nuova versione${NC}"
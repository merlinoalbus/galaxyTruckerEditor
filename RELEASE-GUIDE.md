# 📦 Galaxy Trucker Editor - Guida Release e Aggiornamenti

## 🔢 Sistema di Versioning

Usiamo **Semantic Versioning** (MAJOR.MINOR.PATCH):
- **MAJOR** (1.x.x): Cambiamenti incompatibili
- **MINOR** (x.1.x): Nuove funzionalità retrocompatibili
- **PATCH** (x.x.1): Bug fix e piccole migliorie

Esempio: `1.2.3` → `1.2.4` (bug fix) → `1.3.0` (nuova feature)

## 🚀 Processo di Release

### 1️⃣ Preparazione Release

```bash
# 1. Aggiorna la versione nel package.json
npm version patch  # per bug fix (1.0.0 → 1.0.1)
npm version minor  # per nuove feature (1.0.0 → 1.1.0)
npm version major  # per breaking changes (1.0.0 → 2.0.0)

# 2. Aggiorna anche server/package.json
cd server
npm version patch  # stessa versione del frontend
cd ..

# 3. Commit delle modifiche
git add .
git commit -m "chore: bump version to $(node -p "require('./package.json').version")"
git push
```

### 2️⃣ Build e Tag delle Immagini Docker

```bash
# Ottieni la versione corrente
VERSION=$(node -p "require('./package.json').version")
echo "Building version: $VERSION"

# Build Backend (GAMEFOLDER è escluso automaticamente)
docker build -f server/Dockerfile -t ghcr.io/merlinoalbus/galaxy-trucker-backend:$VERSION ./server
docker tag ghcr.io/merlinoalbus/galaxy-trucker-backend:$VERSION ghcr.io/merlinoalbus/galaxy-trucker-backend:latest

# Build Frontend
docker build -f Dockerfile.frontend -t ghcr.io/merlinoalbus/galaxy-trucker-frontend:$VERSION .
docker tag ghcr.io/merlinoalbus/galaxy-trucker-frontend:$VERSION ghcr.io/merlinoalbus/galaxy-trucker-frontend:latest

# Build GameData (se necessario)
docker build -f Dockerfile.gamedata -t ghcr.io/merlinoalbus/galaxy-trucker-gamedata:$VERSION .
docker tag ghcr.io/merlinoalbus/galaxy-trucker-gamedata:$VERSION ghcr.io/merlinoalbus/galaxy-trucker-gamedata:latest
```

### 3️⃣ Push su GitHub Container Registry

```bash
# Push tutte le versioni
VERSION=$(node -p "require('./package.json').version")

# Backend
docker push ghcr.io/merlinoalbus/galaxy-trucker-backend:$VERSION
docker push ghcr.io/merlinoalbus/galaxy-trucker-backend:latest

# Frontend
docker push ghcr.io/merlinoalbus/galaxy-trucker-frontend:$VERSION
docker push ghcr.io/merlinoalbus/galaxy-trucker-frontend:latest

# GameData (se aggiornato)
docker push ghcr.io/merlinoalbus/galaxy-trucker-gamedata:$VERSION
docker push ghcr.io/merlinoalbus/galaxy-trucker-gamedata:latest
```

### 4️⃣ Creazione Release su GitHub

```bash
# Crea un tag Git
VERSION=$(node -p "require('./package.json').version")
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin "v$VERSION"

# Crea release su GitHub (usando gh CLI)
gh release create "v$VERSION" \
  --title "Galaxy Trucker Editor v$VERSION" \
  --notes "## What's Changed
- Feature 1
- Bug fix 2
- Enhancement 3

## Docker Images
- Backend: \`ghcr.io/merlinoalbus/galaxy-trucker-backend:$VERSION\`
- Frontend: \`ghcr.io/merlinoalbus/galaxy-trucker-frontend:$VERSION\`"
```

## 🔄 Aggiornamento su TrueNAS

### Metodo 1: Aggiornamento Automatico (Consigliato)

TrueNAS controlla automaticamente gli aggiornamenti delle immagini Docker ogni 24 ore.

Per forzare il controllo:
1. **TrueNAS Web UI** → **Apps** → **Galaxy Trucker**
2. Click su **Check for Updates**
3. Se disponibile, click **Update**
4. L'app si riavvierà automaticamente con la nuova versione

### Metodo 2: Aggiornamento Manuale via SSH

```bash
# Connetti a TrueNAS via SSH
ssh root@192.168.1.26

# 1. Pull delle nuove immagini
docker pull ghcr.io/merlinoalbus/galaxy-trucker-backend:latest
docker pull ghcr.io/merlinoalbus/galaxy-trucker-frontend:latest

# 2. Stop dei container
docker stop galaxy-trucker-backend galaxy-trucker-frontend
docker rm galaxy-trucker-backend galaxy-trucker-frontend

# 3. Riavvia con le nuove immagini
cd /mnt/NASMilano/dati/galaxytrucker-app
docker-compose up -d

# 4. Verifica la nuova versione
docker exec galaxy-trucker-backend cat package.json | grep version
docker exec galaxy-trucker-frontend cat /usr/share/nginx/html/index.html | grep version
```

### Metodo 3: Update con Versione Specifica

Se vuoi una versione specifica invece di `latest`:

```bash
# Modifica docker-compose.truenas.yml
nano /mnt/NASMilano/dati/galaxytrucker-app/docker-compose.yml

# Cambia:
image: ghcr.io/merlinoalbus/galaxy-trucker-backend:latest
# In:
image: ghcr.io/merlinoalbus/galaxy-trucker-backend:1.2.3

# Poi riavvia
docker-compose pull
docker-compose up -d
```

## 🤖 Script Automatico per Release

Crea `release.sh`:

```bash
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
```

Rendi eseguibile:
```bash
chmod +x release.sh
```

## 📋 Checklist Pre-Release

Prima di ogni release, verifica:

- [ ] Tutti i test passano (`npm test`)
- [ ] Build di produzione funziona (`npm run build`)
- [ ] Nessun errore ESLint (`npm run lint`)
- [ ] CHANGELOG aggiornato con le modifiche
- [ ] Versione aggiornata in package.json
- [ ] Docker images costruite correttamente
- [ ] **Backend NON include GAMEFOLDER** (deve essere montato esternamente)
- [ ] Volume mount su TrueNAS funziona correttamente
- [ ] Test manuale delle funzionalità principali

## 🔍 Verifica Versione su TrueNAS

Per verificare quale versione è attualmente in esecuzione:

```bash
# Via SSH su TrueNAS
docker ps --format "table {{.Names}}\t{{.Image}}"

# Output esempio:
# NAMES                     IMAGE
# galaxy-trucker-backend    ghcr.io/merlinoalbus/galaxy-trucker-backend:1.2.3
# galaxy-trucker-frontend   ghcr.io/merlinoalbus/galaxy-trucker-frontend:1.2.3
```

## 🐛 Rollback in caso di problemi

Se una release ha problemi, puoi tornare alla versione precedente:

```bash
# Su TrueNAS
docker-compose down

# Modifica docker-compose.yml con la versione precedente
# Esempio: cambia :latest con :1.2.2 (versione precedente)

docker-compose pull
docker-compose up -d
```

## 📊 Monitoraggio Post-Release

Dopo ogni release:
1. Controlla i log: `docker logs galaxy-trucker-backend`
2. Verifica health endpoint: `curl http://192.168.1.26:13001/health`
3. Test funzionalità principali dall'interfaccia web
4. Monitora utilizzo risorse: `docker stats`

---

## 🎯 Esempi Pratici

### Rilascio Bug Fix (1.0.0 → 1.0.1)
```bash
./release.sh patch
```

### Rilascio Nuova Feature (1.0.1 → 1.1.0)
```bash
./release.sh minor
```

### Rilascio Major con Breaking Changes (1.1.0 → 2.0.0)
```bash
./release.sh major
```
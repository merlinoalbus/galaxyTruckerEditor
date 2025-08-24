# Multi-stage Dockerfile per Galaxy Trucker Editor Backend

# Stage base con Node.js
FROM node:18-alpine AS base

# Installa bash e curl per compatibilità script e health check
RUN apk add --no-cache bash curl

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file di configurazione del server
COPY package*.json ./

# Stage di sviluppo
FROM base AS development

# Installa tutte le dipendenze (incluse devDependencies)
RUN npm ci

# Copia il codice sorgente
COPY . .

# Espone la porta 3001
EXPOSE 3001

# Comando per avviare in modalità sviluppo con nodemon
CMD ["npm", "run", "dev"]

# Stage di produzione
FROM base AS production

# Installa solo le dipendenze di produzione
RUN npm ci --only=production && npm cache clean --force

# Crea utente non-root per sicurezza
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copia il codice sorgente
COPY --chown=nodejs:nodejs . .

# Crea directory per il mount point del volume esterno
RUN mkdir -p /galaxytrucker/game && chown -R nodejs:nodejs /galaxytrucker/game

# Espone la porta 3001 per il backend
EXPOSE 3001

# Imposta l'utente non-root
USER nodejs

# Health check per verificare che il server sia attivo
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Comando per avviare il server
CMD ["node", "server.js"]

# Default target è production
FROM production
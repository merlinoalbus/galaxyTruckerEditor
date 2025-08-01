# Dockerfile per Galaxy Trucker Editor
FROM node:18-alpine

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file di configurazione
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia il codice sorgente
COPY . .

# Espone la porta 3000
EXPOSE 3000

# Monta il volume per i dati del gioco
VOLUME ["/app/game-data"]

# Comando per avviare l'applicazione
CMD ["npm", "start"]
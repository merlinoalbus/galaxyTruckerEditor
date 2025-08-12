# Configurazione Server BE

Il server backend è ora completamente configurabile tramite variabili d'ambiente per permettere la portabilità dell'applicazione.

## Variabili di Ambiente

### GAME_HOST
Percorso assoluto alla directory di installazione del gioco Galaxy Trucker.

- **Default**: `../../` (due livelli su dalla directory del server)
- **Esempio Windows**: `C:\Program Files (x86)\Steam\steamapps\common\Galaxy Trucker`
- **Esempio Linux**: `/home/user/.steam/steam/steamapps/common/Galaxy Trucker`

### SERVER_PORT
Porta su cui il server BE resta in ascolto.

- **Default**: `3001`
- **Range**: `1024-65535`

### HOST_ADDRESS
Indirizzo IP su cui il server resta in ascolto.

- **Default**: `localhost` (solo connessioni locali)
- **Per accesso remoto**: `0.0.0.0` (tutte le interfacce)
- **Per IP specifico**: `192.168.1.100`

## Configurazione

### File .env
Crea un file `.env` nella directory del server per personalizzare la configurazione:

```bash
# Configurazione produzione
GAME_HOST=C:\Games\Galaxy Trucker
SERVER_PORT=3001
HOST_ADDRESS=localhost

# Configurazione sviluppo
GAME_HOST=/home/dev/games/galaxy-trucker
SERVER_PORT=3002
HOST_ADDRESS=0.0.0.0
```

### Variabili di Sistema
Alternativamente, puoi impostare le variabili direttamente nel sistema:

**Windows:**
```cmd
set GAME_HOST=C:\Games\Galaxy Trucker
set SERVER_PORT=8080
node server.js
```

**Linux/macOS:**
```bash
export GAME_HOST="/opt/games/galaxy-trucker"
export SERVER_PORT=8080
node server.js
```

## Path Templates

Il sistema utilizza template centralizzati per tutti i percorsi di file:

```javascript
const config = require('./src/config/config');

// Esempi di utilizzo
const scriptsPath = config.PATH_TEMPLATES.scriptsFile('ES');
const nodesPath = config.PATH_TEMPLATES.nodesYaml('FR');
const charactersPath = config.PATH_TEMPLATES.charactersYaml;
```

### Template Disponibili

- `scriptsFile(lang)` - File scripts2.txt per lingua
- `nodesYaml(lang)` - File nodes.yaml per lingua
- `missionsYaml(lang)` - File missions.yaml per lingua
- `charactersYaml` - File characters.yaml principale
- `buttonStrings(lang)` - File button strings per lingua
- `fallbackImage` - Immagine avatar fallback

## Deployment

### Locale
```bash
cd server
cp .env.example .env
# Modifica .env con i tuoi percorsi
npm start
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
ENV GAME_HOST=/app/game
ENV SERVER_PORT=3001
ENV HOST_ADDRESS=0.0.0.0
CMD ["node", "server.js"]
```

### Produzione
- Imposta `NODE_ENV=production` per logging ottimizzato
- Usa un processo manager come PM2
- Configura reverse proxy (nginx/apache) se necessario

## Troubleshooting

### Server non si avvia
1. Verifica che `GAME_HOST` punti a directory esistente
2. Controlla che `SERVER_PORT` non sia già in uso
3. Verifica permessi di lettura sui file del gioco

### API restituiscono errori
1. Controlla log del server per errori di path
2. Verifica che i file del gioco esistano nelle posizioni attese
4. Controlla formato e sintassi dei file YAML

### Performance issues
1. Usa `NODE_ENV=production` in produzione
2. Considera cache per file statici
3. Monitora uso memoria con file grandi
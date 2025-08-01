# Guida all'Uso - Galaxy Trucker Editor

## 🚀 Avvio Rapido

### Opzione 1: Docker (Raccomandato)
```bash
# Windows
.\start.bat

# Linux/Mac
chmod +x start.sh
./start.sh
```

### Opzione 2: Sviluppo Locale
```bash
npm install
npm start
```

L'applicazione sarà disponibile su `http://localhost:3000`

## 📋 Funzionalità Principali

### 1. Dashboard
- Panoramica generale del sistema
- Statistiche missioni, script e componenti
- Accesso rapido alle funzioni principali
- Attività recenti

### 2. Editor Missioni
Crea e modifica missioni multiplayer con:
- **Informazioni Base**: Nome, ID, descrizione
- **Configurazione Voli**: STI, STII, STIII
- **Tipi di Nave**: Standard, Double, Amoeba
- **Regole Punteggio**: Personalizzabili per ogni volo
- **Script Mazzi**: Associa script per carte avventura
- **Preview YAML**: Anteprima e modifica diretta

### 3. Editor Script Mazzi
Gestisci gli script che controllano i mazzi di carte:
- **Comandi TmpDeckLoad**: Carica mazzo base
- **Comandi DeckAddCardType**: Aggiungi carte specifiche
- **Preview**: Visualizza script generato
- **Export/Import**: Esporta in formato .txt

### 4. Localizzazione
Gestisci traduzioni in 7 lingue:
- EN, IT, FR, DE, ES, PL, RU, CS
- Editor visuale per stringhe
- Stato traduzioni per lingua
- Ricerca avanzata

## 🎯 Esempi Pratici

### Creare una Nuova Missione

1. **Vai alla sezione Missioni** → Clic su "Nuovo"
2. **Compila Informazioni Base**:
   ```
   Nome: multiplayer_custom_mission
   ID: 100
   Descrizione: Missione personalizzata per test
   ```

3. **Configura Voli**:
   - Voli modificabili: STI, STII, STIII
   - Voli selezionati: STI
   - Navi: I, II, III

4. **Imposta Regole** (opzionale):
   ```
   STI:
     deliveredCrewMember: +2
     lostCrewMember: -1
   ```

5. **Associa Script Mazzo**:
   - Script universale: `basic_deck`
   - O crea un nuovo script personalizzato

6. **Salva ed Esporta** in formato YAML

### Creare uno Script Mazzo Personalizzato

1. **Vai alla sezione Script Mazzi** → "Nuovo"
2. **Nome Script**: `custom_pirates_deck`
3. **Aggiungi Comandi**:
   ```
   TmpDeckLoad → advCards/variable_deck.yaml
   DeckAddCardType → Volo: 1, Tipo: enemies, Quantità: 5
   DeckAddCardType → Volo: 2, Tipo: pirates, Quantità: 3
   DeckAddCardType → Volo: 3, Tipo: combatzone, Quantità: 2
   ```
4. **Preview e Salva**

### Modificare Traduzioni

1. **Sezione Localizzazione**
2. **Cerca stringa**: `multiplayer_mission1`
3. **Aggiungi traduzioni**:
   - EN: "Pirates Mission"
   - IT: "Missione Pirati"
   - FR: "Mission Pirates"
4. **Salva modifiche**

## 🔧 Metacodici Supportati

L'editor riconosce automaticamente i metacodici nelle descrizioni:

- `[player]` → Nome del giocatore
- `[credits]` → Crediti attuali
- `[flight]` → Numero volo (1, 2, 3)
- `[ship]` → Tipo nave
- `[cargo]` → Cargo trasportato
- `[crew]` → Membri equipaggio
- `[day]` → Giorno di gioco
- `[turn]` → Turno attuale

**Esempio**: 
```
"Hai consegnato [cargo] cargo e [crew] membri dell'equipaggio nel volo [flight]!"
```

## 📁 Struttura File Supportati

### Missioni (`multiplayermissions/*.yaml`)
```yaml
name: "multiplayer_mission1"
missionID: 1
flightsPicked: [STI]
playersCount: [2, 4]
shipPlans: [I, II, III]
evaluation:
  STI:
    deliveredCrewMember: 1
```

### Script Mazzi (`customScripts/*.txt`)
```
SCRIPTS
  SCRIPT customDeck
    TmpDeckLoad "advCards/variable_deck.yaml"
    DeckAddCardType 1 openspace 3
    DeckAddCardType 1 enemies 2
```

### Componenti (`parts/*.yaml`)
```yaml
- id: engine_basic
  name: Basic Engine
  type: engine
  connectors: 2
  cost: 5
```

## 🔍 Validazione

Il sistema valida automaticamente:

### ✅ Controlli Validazione
- Campi obbligatori (nome, ID missione)
- Range valori (giocatori 2-4, voli validi)
- Consistenza configurazioni
- Sintassi YAML corretta
- Esistenza file referenziati

### 🎨 Codici Colore
- **🟢 Verde**: Tutto corretto
- **🟡 Giallo**: Avvertimenti (non bloccanti)
- **🔴 Rosso**: Errori (impediscono salvataggio)

## 🐳 Docker

### Comandi Utili
```bash
# Avvio
docker-compose up -d

# Log in tempo reale
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down
```

### Volume Mounting
I dati del gioco sono montati automaticamente:
```
../                  → /app/game-data
├── multiplayermissions/
├── customScripts/
├── parts/
└── localization_strings/
```

## 🛠️ Risoluzione Problemi

### Porta già in uso
```bash
# Cambia porta in docker-compose.yml
ports:
  - "3001:3000"  # Usa porta 3001
```

### Errori di compilazione
```bash
# Pulisci e reinstalla
rm -rf node_modules package-lock.json
npm install
npm run build
```

### File non trovati
- Verifica che i path siano corretti
- Controlla che i file referenziati esistano
- Usa path relativi alla root del gioco

## 📞 Supporto

Per problemi o richieste di funzionalità:
1. Controlla i log: `docker-compose logs`
2. Verifica la documentazione
3. Controlla i file di esempio nella directory del gioco
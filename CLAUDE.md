# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architettura del Progetto

Questo è un editor visuale completo per Galaxy Trucker, composto da:
- **Frontend React**: TypeScript, Tailwind CSS, gestione stato tramite Context API
- **Backend Express**: Server Node.js per gestione file reali del gioco
- **Visual Flow Editor**: Editor drag-and-drop per script di campagna
- **Interactive Map**: Visualizzazione e navigazione grafo delle missioni

### Struttura Modularizzata

Il progetto segue un'architettura modulare con separazione chiara:
```
src/
├── components/CampaignEditor/
│   ├── VisualFlowEditor/     # Editor visuale drag-and-drop
│   ├── InteractiveMap/        # Mappa interattiva missioni
│   ├── VariablesSystem/       # Sistema gestione variabili
│   └── Overview/              # Dashboard metriche
├── hooks/                     # Hook React personalizzati
├── services/                  # Parser e servizi
├── types/                     # TypeScript types
└── contexts/                  # Context providers
```

## Comandi di Sviluppo

### Gestione Server

I server richiedono avvio manuale tramite script configurati. Gli script sono configurati nella cartella `scripts/`:

```bash
# Backend (porta 3001) - NON si ricarica automaticamente
startBE     # Avvia il Backend
stopBE      # Ferma il Backend  
restartBE   # Riavvia il Backend

# Frontend (porta 3000) - Hot reload automatico
startFE     # Avvia il Frontend
stopFE      # Ferma il Frontend
restartFE   # Riavvia il Frontend

# Entrambi
start       # Avvia Backend e Frontend
stop        # Ferma entrambi
restart     # Riavvia entrambi
```

**IMPORTANTE**: Il Backend NON ha hot reload. Dopo modifiche ai file in `server/`, riavviare sempre con `restartBE`.

### Build e Test

```bash
# Frontend
npm run build      # Build produzione con Craco
npm test          # Test con Jest

# Backend (dalla cartella server/)
npm start         # Avvia server
npm run dev       # Modalità sviluppo con nodemon
```

## Pattern di Sviluppo

### Visual Flow Editor

L'editor supporta blocchi drag-and-drop per comandi di campagna:
- **Blocchi Base**: TEXT, MENU, OPT, IF, GO, EXIT_MENU
- **Blocchi Contenitori**: IF con rami THEN/ELSE, MENU con OPT annidati
- **Metacode Editor**: Editor integrato per metacodici multilingua
- **Validazione Real-time**: Controllo errori durante editing

### Sistema di Parsing

Il progetto usa parser specializzati per diversi formati:
- `CampaignScriptParser`: Parsing script campagna con supporto blocchi annidati
- `services/parsers/`: Parser per missioni, script, variabili
- Supporto completo metacodici (`[player]`, `[credits]`, etc.)

### Gestione Multilingua

Supporto completo per 7 lingue (EN, DE, FR, ES, PL, CS, RU):
- File localizzazione in `server/GAMEFOLDER/localization_strings/`
- Script campagna per lingua in `campaignScripts{LANG}/`
- Context `LanguageContext` per cambio lingua runtime

### API Backend

Il server Express espone endpoint RESTful:
- `/api/scripts`: CRUD script campagna
- `/api/missions`: Gestione missioni multiplayer
- `/api/variables`: Sistema variabili/achievement
- `/api/images`: Gestione immagini personaggi
- Validazione con `jsonschema` e sanitizzazione input

## Convenzioni di Codice

### TypeScript

- Tipi definiti in file `.types.ts` separati
- Interfacce con prefisso `I` (es. `IFlowBlock`)
- Props components sempre tipizzate
- Uso di discriminated unions per variant types

### React Components

- Componenti funzionali con hooks
- Custom hooks in `hooks/` con prefisso `use`
- Memo/useCallback per ottimizzazioni performance
- Context providers per stato globale

### Stile e CSS

- Tailwind CSS per styling
- Classi custom in `tailwind.config.js`
- Theme Galaxy Trucker con colori `gt-*`
- Animazioni CSS per transizioni fluide

## Testing e Validazione

### Validazione Script

Il sistema valida automaticamente:
- Sintassi comandi (MENU/OPT matching, GO labels)
- Riferimenti file (missioni, script, immagini)
- Metacodici e parametri
- Struttura blocchi annidati

### Test da Eseguire

Prima di ogni commit verificare:
1. Frontend compila senza errori: `npm run build`
2. Backend avvia correttamente: `restartBE`
3. Validazione script nell'editor non mostra errori
4. Drag-and-drop mantiene struttura corretta

## Note Importanti

- **File Reali**: Il backend opera su file reali in `server/GAMEFOLDER/`
- **Backup**: Sempre backup prima di modifiche massive
- **Performance**: Con script >2000 righe, usare virtualizzazione
- **Sicurezza**: Validazione lato server per tutti input utente
- **Browser**: Testato principalmente su Chrome/Edge, verificare Firefox per drag-and-drop
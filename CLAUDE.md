# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architettura del Progetto

Editor visuale completo per Galaxy Trucker con gestione real-time di script, missioni e sistemi di gioco.

### Stack Tecnologico
- **Frontend**: React 18, TypeScript, Tailwind CSS, Context API
- **Backend**: Express.js, Node.js, gestione file reali YAML/TXT  
- **Editor**: Monaco Editor, drag-and-drop nativo, validazione real-time

### Struttura Modularizzata

```
src/
├── components/CampaignEditor/
│   ├── VisualFlowEditor/     # Editor drag-and-drop blocchi script
│   ├── InteractiveMap/        # Grafo interattivo missioni
│   ├── VariablesSystem/       # Gestione variabili/achievement
│   └── Overview/              # Dashboard metriche qualità
├── hooks/                     # Custom hooks React
├── services/                  # Parser e business logic
├── types/                     # TypeScript types
└── contexts/                  # Context providers globali

server/
├── GAMEFOLDER/               # File reali del gioco
│   ├── campaignScripts*/     # Script per lingua
│   ├── missions/             # Missioni YAML
│   └── localization_strings/ # Traduzioni
├── routes/                   # API endpoints
└── server.js                 # Entry point backend
```

## Comandi di Sviluppo

### Gestione Server

```bash
# Backend (porta 3001) - Richiede restart manuale dopo modifiche
startBE     # Avvia Backend con verifica
stopBE      # Ferma Backend
restartBE   # Riavvia Backend

# Frontend (porta 3000) - Hot reload automatico
startFE     # Avvia Frontend con verifica
stopFE      # Ferma Frontend  
restartFE   # Riavvia Frontend

# Gestione combinata
start       # Avvia entrambi in sequenza
stop        # Ferma entrambi
restart     # Riavvia entrambi
```

**IMPORTANTE**: Backend NON ha hot reload. Dopo modifiche in `server/`, sempre `restartBE`.

### Build e Test

```bash
# Frontend
npm run build    # Build produzione con Craco
npm test         # Test Jest

# Backend
cd server && npm start    # Produzione
cd server && npm run dev  # Development con nodemon
```

## Visual Flow Editor - Sistema Blocchi

### Tipologie Blocchi Supportati

- **Comandi Base**: TEXT, SAY, GO, EXIT_MENU, LAUNCH_MISSION
- **Contenitori**: MENU (con OPT figli), IF (con THEN/ELSE)
- **Scene**: SHOW_SCENE, HIDE_SCENE
- **Personaggi**: SHOW_CHAR, HIDE_CHAR
- **Costruzione**: BUILD, FLIGHT

### Aggiunta Nuovo Blocco

1. **Definire tipo** in `types/CampaignEditor/VisualFlowEditor/blocks.types.ts`
2. **Creare componente** in `components/.../blocks/NuovoBlocco/`
3. **Registrare rendering** in `BlockRenderer.tsx`
4. **Aggiungere colore** in `utils/.../blockColors.ts`
5. **Implementare validazione** in `hooks/.../validation/`
6. **Estendere parser** in `CampaignScriptParserService.ts`

## Sistema Parsing Bidirezionale

Parser specializzati per conversione script ↔ blocchi:

- **CampaignScriptParserService**: Parser principale script campagna
- **scriptParserService**: Parsing blocchi annidati e metacodici
- **Preserva**: Commenti, linee vuote, formattazione originale

## Multilingua e Metacodici

### Lingue Supportate
EN, DE, FR, ES, PL, CS, RU

### Metacodici Principali (50+ pattern)
- `[player]`, `[credits]`, `[flight]`, `[ship]`
- `[mission_result:ID]`, `[string:KEY]`
- `[gender:M|F|N:testo]`, `[plural:N|S:testo]`
- `[image:character:NAME]`

### Sincronizzazione
Modifiche strutturali propagate automaticamente tra lingue mantenendo traduzioni esistenti.

## API Backend

```
/api/scripts      # CRUD script campagna
/api/missions     # Gestione missioni multiplayer
/api/variables    # Sistema variabili/achievement
/api/images       # Immagini personaggi
/api/validation   # Validazione real-time
```

Tutti gli endpoint validano input con `jsonschema` e sanitizzano path.

## Convenzioni Codice

### TypeScript
- Types in file `.types.ts` dedicati
- Interfacce prefisso `I` (es. `IFlowBlock`)
- Discriminated unions per varianti
- Strict mode abilitato

### React
- Functional components + hooks
- Custom hooks prefisso `use`
- React.memo per ottimizzazione
- Context API per stato globale

### Styling
- Tailwind CSS utilities-first
- Theme custom `gt-*` per Galaxy Trucker
- Animazioni CSS native
- Dark mode non supportato

## Validazione e Testing

### Validazione Automatica
- Sintassi comandi e struttura nidificata
- Esistenza file referenziati (missioni, immagini)
- Coerenza metacodici multilingua
- Limiti caratteri per localizzazione

### Checklist Pre-Commit
1. `npm run build` senza errori
2. `restartBE` avvio corretto
3. Validazione editor pulita
4. Test drag-and-drop preserva struttura
5. Parsing round-trip mantiene contenuto

## Note Critiche

- **File Reali**: Backend modifica direttamente `server/GAMEFOLDER/`
- **Backup**: Obbligatorio prima modifiche massive
- **Performance**: Virtualizzare script >2000 righe
- **Parser**: Mai modificare logica preservazione commenti
- **Multilingua**: Sempre sincronizzare struttura tra lingue
- **Hot Reload**: Solo Frontend, Backend richiede restart
- **Browser**: Chrome/Edge ottimali, Firefox può avere issue drag-and-drop
## Communication Guidelines
- Always communicate in Italian language
- Interactions must be fully understood and respected word by word, syllable by syllable
- Prohibited from ignoring or pretending not to have read any part of messages
- Must maintain the most professional approach
- No use of mockups, placeholders, or regressions without explicit prior authorization
- prima di eseguire modifiche al codice devi fare analisi del codice esistente
- identificare la soluzione migliore significa trovare la soluzione più robusta ed efficace a prescindere dalle risorse computazionali necessarie per realizzarla.
- qualsiasi modifica di codice eseguita deve comprendere da parte tua verifica che il codice non presenti errori di build o Runtime
- ogni modifica che fai devi rivalidarla tu stesso per 3 volte... controllando se ti sei dimenticato qualcosa.
- devi verificare che le modifiche che hai apportato non abbiano portato regressioni.
- TI è FATTO DIVIETO di cercare la via più facile... devi applicare la via più efficiente a prescindere dal costo computazionale per raggiungerla.

##IMPORTANTE##
- DOPO AVER SVOLTO MINUZIOSAMENTE PER OGNI PUNTO DELLA TODOS, PRIMA DI PASSARE AL PUNTO SUCCESSIVO DEVI eseguire la validazione dello step richiamando l'agent: galaxy-task-validator che potrà approvare il completamento dell'attività o rigettarla. 
- galaxy-task-validator NON è TENUTO ED HA IL DIVIETO ASSOLUTO DI ESEGUIRE MODIFICHE AL CODICE. IL SUO COMPITO è SOLO VERIFICARE CHE TU HAI SVOLTO BENE.
- L'AUTORITà del galaxy-task-validator è PARI ALLA MIA E TU NON HAI IL DIRITTO DI NEGOZIARE O RIFIUTARTI DI ESEGUIRE LE SUE RICHIESTE MINUZIOSAMENTE.
- SE SOSPETTI UN POSSIBILE ERRORE DELL'AGENT PUOI APPELLARTI A ME CHE VALIDERò IL DA FARSI RIPORTANDOMI ESATTAMENTE LA RICHIESTA DELL'AGENT E I TUOI DUBBI.
- SE L'AGENT DECIDE CHE NON HAI SVOLTO BENE L'ATTIVITà NON PUOI SEGNARE VALIDATO IL PUNTO, NON PUOI PASSARE A PUNTI SUCCESSIVI NON PUOI FARE ALTRO SE NON CORREGGERE OTTEMPERANDO ALLE SUE RICHIESTE O APPELLARTI AL MIO GIUDIZIO.
- QUALSIASI INADEMPIENZA A QUESTA PROCEDURA VERRà PUNITA CON UNA SEGNALAZIONE DI BUG.

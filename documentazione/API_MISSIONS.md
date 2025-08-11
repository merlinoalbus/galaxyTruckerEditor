# API Missions Documentation

## Endpoint Overview

Le API per le missions gestiscono il caricamento, salvataggio e parsing delle missioni del gioco Galaxy Trucker. Le missions sono strutture complesse che includono fasi BUILD e FLIGHT.

## Endpoints Disponibili

### 1. GET /api/missions
Lista tutte le missions disponibili con metadati e collegamenti.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "nomemission": "roughMission",
      "nomefile": "campaign01.txt",
      "numero_blocchi": 50,
      "numero_comandi": 150,
      "stellato": true,
      "languages": ["EN", "ES", "FR"],
      "bottoni_collegati": [...],
      "script_richiamati": [...],
      "missions_richiamate": [...],
      "utilizzi_totali": 3
    }
  ],
  "count": 385
}
```

### 2. GET /api/missions/:missionName
Carica una mission specifica con parsing a blocchi.

**Query Parameters:**
- `multilingua` (boolean): Se true, carica tutte le lingue disponibili
- `format` (string): "blocks" o "raw" - formato del risultato
- `lang` (string): Lingua specifica (default: "EN")

**Esempi:**
```
GET /api/missions/roughMission?multilingua=true&format=blocks
GET /api/missions/tutorialMission?lang=ES&format=blocks
```

**Response con format=blocks e multilingua=true:**
```json
{
  "success": true,
  "data": {
    "name": "roughMission",
    "fileName": "campaign01.txt",
    "originalCode": "MISSION roughMission\n...",
    "blocksMission": [
      {
        "type": "ADDOPPONENT",
        "parameters": {
          "character": "roughTrucker"
        }
      },
      {
        "type": "BUILD",
        "blockInit": [
          {
            "type": "BUILDINGHELPSCRIPT",
            "parameters": {
              "delay": 500,
              "script": "tutorialAdditionalConcepts"
            }
          }
        ],
        "blockStart": [
          {
            "type": "SUB_SCRIPT",
            "parameters": {
              "script": "stdParts"
            }
          }
        ],
        "numBlockInit": 1,
        "numBlockStart": 1
      },
      {
        "type": "FLIGHT",
        "blockInit": [],
        "blockStart": [
          {
            "type": "FLIGHTHELPSCRIPT",
            "parameters": {
              "script": "tutorialAdditionalFlightConcepts"
            }
          }
        ],
        "blockEvaluate": [
          {
            "type": "SHOWDLGSCENE"
          },
          {
            "type": "IF",
            "ifType": "IF",
            "variabile": "wasBet",
            "thenBlocks": [...],
            "elseBlocks": [...]
          }
        ],
        "numBlockInit": 0,
        "numBlockStart": 1,
        "numBlockEvaluate": 2
      }
    ],
    "blocksFinish": [
      {
        "type": "HIDEDLGSCENE"
      }
    ]
  }
}
```

### 3. POST /api/missions/saveMission
Salva una mission da struttura JSON.

**Body:**
```json
[
  {
    "name": "roughMission",
    "fileName": "campaign01.txt",
    "blocksMission": [
      {
        "type": "ADDOPPONENT",
        "parameters": {
          "character": "roughTrucker"
        }
      },
      {
        "type": "BUILD",
        "blockInit": [...],
        "blockStart": [...],
        "numBlockInit": 1,
        "numBlockStart": 1
      },
      {
        "type": "FLIGHT",
        "blockInit": [...],
        "blockStart": [...],
        "blockEvaluate": [...],
        "numBlockInit": 0,
        "numBlockStart": 1,
        "numBlockEvaluate": 2
      }
    ],
    "blocksFinish": [...]
  }
]
```

**Query Parameters:**
- `lang` (string): Lingua in cui salvare (default: "EN")

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "roughMission",
    "fileName": "campaign01.txt",
    "language": "EN",
    "savedAt": "2025-08-10T21:00:00.000Z",
    "blocksMissionCount": 10,
    "blocksFinishCount": 2
  }
}
```

### 4. GET /api/missions/routes
Lista tutti gli archi/rotte della mappa con analisi utilizzo.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "route1",
      "source": "Earth",
      "destination": "Mars",
      "missiontype": "NORMAL",
      "license": "STI",
      "button": {
        "id": "btn_mars",
        "script": "marsScript",
        "mission": "marsMission",
        "localizedLabels": {...}
      },
      "localizedCaptions": {...},
      "localizedDescriptions": {...},
      "utilizzi_totali": 5,
      "script_che_lo_usano": ["script1", "script2"],
      "comandi_utilizzati": ["SHOWPATH", "HIDEPATH"]
    }
  ],
  "count": 45
}
```

## Struttura dei Blocchi Mission

### Blocco BUILD
Il blocco BUILD gestisce la fase di costruzione dell'astronave:

```json
{
  "type": "BUILD",
  "blockInit": [],     // Comandi eseguiti in INIT_BUILD
  "blockStart": [],    // Comandi eseguiti in START_BUILDING
  "numBlockInit": 0,   // Numero comandi in blockInit
  "numBlockStart": 0   // Numero comandi in blockStart
}
```

Le fasi corrispondono a:
- `INIT_BUILD`: Preparazione fase build
- `START_BUILDING`: Avvio costruzione
- `END_BUILDING`: Fine costruzione (marker, non contiene comandi)

### Blocco FLIGHT
Il blocco FLIGHT gestisce la fase di volo:

```json
{
  "type": "FLIGHT",
  "blockInit": [],      // Comandi eseguiti in INIT_FLIGHT
  "blockStart": [],     // Comandi eseguiti in START_FLIGHT
  "blockEvaluate": [],  // Comandi eseguiti in EVALUATE_FLIGHT
  "numBlockInit": 0,    // Numero comandi in blockInit
  "numBlockStart": 0,   // Numero comandi in blockStart
  "numBlockEvaluate": 0 // Numero comandi in blockEvaluate
}
```

Le fasi corrispondono a:
- `INIT_FLIGHT`: Preparazione fase volo
- `START_FLIGHT`: Avvio volo
- `EVALUATE_FLIGHT`: Valutazione risultati
- `END_FLIGHT`: Fine volo (marker, non contiene comandi)

## Struttura Mission Completa

Una mission ha questa struttura:

```
MISSION <nomemission>
  [comandi e blocchi in blocksMission]
  INIT_BUILD
    [comandi preparazione build]
  START_BUILDING
    [comandi durante build]
  END_BUILDING
  INIT_FLIGHT
    [comandi preparazione volo]
  START_FLIGHT
    [comandi durante volo]
  EVALUATE_FLIGHT
    [comandi valutazione]
  END_FLIGHT
FINISH_MISSION
  [comandi in blocksFinish]
END_OF_MISSION
```

## Note Implementative

1. **Parsing Ricorsivo**: I blocchi BUILD e FLIGHT possono contenere altri blocchi (IF, MENU, etc.) in modo ricorsivo.

2. **Multilingua**: Le missions supportano testi multilingua per comandi SAY, ASK, etc.

3. **Validazione**: Il salvataggio include validazione automatica della struttura.

4. **Compatibilità**: Le API mantengono compatibilità con il formato esistente dei file .txt.

## Esempi di Utilizzo

### Caricare una mission per editing:
```javascript
const response = await fetch('http://localhost:3001/api/missions/roughMission?multilingua=true&format=blocks');
const data = await response.json();
const { blocksMission, blocksFinish } = data.data;
```

### Salvare una mission modificata:
```javascript
const missionData = [{
  name: "roughMission",
  fileName: "campaign01.txt",
  blocksMission: [...],
  blocksFinish: [...]
}];

const response = await fetch('http://localhost:3001/api/missions/saveMission', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(missionData)
});
```

## Error Handling

Tutti gli endpoint ritornano errori nel formato:
```json
{
  "success": false,
  "error": "Descrizione errore",
  "message": "Dettagli tecnici"
}
```

Codici HTTP:
- 200: Successo
- 400: Bad Request (parametri mancanti/errati)
- 404: Mission non trovata
- 500: Errore server
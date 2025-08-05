# Galaxy Trucker Editor - API Documentation

## Panoramica
Il backend fornisce API RESTful per gestire tutti gli aspetti del gioco Galaxy Trucker, inclusi script, missioni, nodi, personaggi e altri elementi di gioco.

Base URL: `http://localhost:3001/api`

## Endpoints

### 1. Scripts API

#### GET /api/scripts
Recupera la lista completa degli script disponibili con analisi dettagliata.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "nomefile": "script.dks",
      "nomescript": "SCRIPT_NAME",
      "tipo": "MISSION|NODE|MISC",
      "numero_comandi": 10,
      "nodi_referenziati": ["node1", "node2"],
      "script_collegati_ricorsivamente": ["script2", "script3"],
      "variabili_utilizzate": ["var1", "var2"],
      "missioni_collegate": ["mission1"],
      "personaggi_utilizzati": ["character1"]
    }
  ]
}
```

#### GET /api/scripts/:scriptname/content
Recupera il contenuto completo di uno script specifico.

**Parameters:**
- `scriptname`: Nome dello script (senza estensione)

**Response:**
```json
{
  "success": true,
  "data": {
    "scriptName": "SCRIPT_NAME",
    "fileName": "script.dks",
    "content": "// Script content...",
    "blocks": [
      {
        "name": "BLOCK_NAME",
        "content": "Block content...",
        "commands": [...]
      }
    ]
  }
}
```

#### GET /api/scripts/semaphores
Recupera tutti i semafori utilizzati negli script.

**Response:**
```json
{
  "success": true,
  "data": ["semaphore1", "semaphore2", ...]
}
```

#### GET /api/scripts/variables
Recupera tutte le variabili utilizzate negli script.

**Response:**
```json
{
  "success": true,
  "data": ["variable1", "variable2", ...]
}
```

#### GET /api/scripts/labels
Recupera tutte le etichette utilizzate negli script.

**Response:**
```json
{
  "success": true,
  "data": ["label1", "label2", ...]
}
```

### 2. Missions API

#### GET /api/missions/routes
Recupera tutte le rotte/missioni disponibili con dettagli completi.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mission_id",
      "source": "node1",
      "destination": "node2",
      "missiontype": "NORMAL|UNIQUE",
      "license": "STI|STII|STIII",
      "cost": 100,
      "button": {
        "id": "button_id",
        "script": "script_name"
      },
      "localizedCaptions": {
        "EN": "Mission Name",
        "IT": "Nome Missione"
      },
      "localizedDescriptions": {
        "EN": "Description",
        "IT": "Descrizione"
      },
      "script_collegati_ricorsivamente": ["script1", "script2"]
    }
  ]
}
```

### 3. Game Elements API

#### GET /api/game/characters
Recupera tutti i personaggi del gioco con dettagli e immagini.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "nomepersonaggio": "character_name",
      "localizedNames": {
        "EN": "Character Name",
        "IT": "Nome Personaggio"
      },
      "immagini": [
        {
          "nomefile": "image.jpg",
          "percorso": "path/to/image.jpg"
        }
      ],
      "utilizzato_in_script": ["script1", "script2"]
    }
  ]
}
```

#### GET /api/game/nodes
Recupera tutti i nodi della mappa con coordinate e dettagli.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "node_name",
      "coordinates": [100, 200],
      "image": "node.jpg",
      "localizedCaptions": {
        "EN": "Node Name",
        "IT": "Nome Nodo"
      },
      "localizedDescriptions": {
        "EN": "Description",
        "IT": "Descrizione"
      },
      "shuttles": [["node2", 50]],
      "buttons": [...],
      "utilizzato_in_script": ["script1"]
    }
  ]
}
```

#### GET /api/game/buttons
Recupera tutti i pulsanti del gioco con scripts associati.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "button_id",
      "script": "script_name",
      "tipo": "NODE|ROUTE",
      "localizzazioni": [
        {
          "tipo": "NODE",
          "nome": "node_name"
        }
      ]
    }
  ]
}
```

#### GET /api/game/achievements
Recupera tutti gli achievement del gioco.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "achievement_id",
      "steamId": 123456,
      "localizedNames": {
        "EN": "Achievement Name",
        "IT": "Nome Achievement"
      },
      "localizedDescriptions": {
        "EN": "Description",
        "IT": "Descrizione"
      },
      "immagine": "achievement.jpg"
    }
  ]
}
```

#### GET /api/game/map-background
Recupera uno sfondo randomico per la mappa interattiva.

**Descrizione:**
Questa API seleziona casualmente uno sfondo per la mappa interattiva basandosi su pesi predefiniti. Prima controlla se esiste il file `bg.jpg` originale nella cartella campaign, poi seleziona tra gli sfondi disponibili nella cartella `sd/backgrounds`.

**Pesi di selezione:**
- `bg.jpg` (se esiste): 30%
- `bg_static.jpg`: 35%
- `turn_background.jpg`: 35%

**Response:**
- Success: Immagine JPEG/JPG con headers appropriati
- Error 404: Se nessuno sfondo è disponibile
- Error 500: In caso di errore del server

**Headers Response:**
```
Content-Type: image/jpeg
Access-Control-Allow-Origin: *
```

**Note tecniche:**
- La selezione è completamente randomica ad ogni richiesta
- Non c'è caching lato server per garantire varietà
- Fallback automatico a `bg_static.jpg` se il file selezionato non esiste
- Supporta CORS per utilizzo cross-origin

### 4. Files API

#### POST /api/files/list
Lista i file in una directory specifica.

**Request Body:**
```json
{
  "directory": "path/relative/to/game"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "nome": "file.ext",
      "percorso": "full/path/to/file.ext",
      "tipo": "file|directory",
      "dimensione": 1024,
      "data_modifica": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /api/file/*
Recupera un file specifico dal filesystem di gioco.

**Parameters:**
- Path del file relativo alla root di gioco

**Response:**
- File binario con content-type appropriato

### 5. Images API

#### POST /api/images/find
Cerca immagini correlate a un elemento specifico.

**Request Body:**
```json
{
  "tipo": "personaggio|nodo|achievement",
  "nome": "element_name"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "nomefile": "image.jpg",
      "percorso": "path/to/image.jpg"
    }
  ]
}
```

#### POST /api/images/binary
Recupera immagini in formato base64.

**Request Body:**
```json
{
  "percorsi": ["path/to/image1.jpg", "path/to/image2.jpg"]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "percorso": "path/to/image.jpg",
      "dati_base64": "data:image/jpeg;base64,..."
    }
  ]
}
```

## Error Handling

Tutte le API seguono uno schema di errore standard:

```json
{
  "success": false,
  "error": "Descrizione dell'errore"
}
```

Codici di stato HTTP comuni:
- 200: Successo
- 400: Bad Request - parametri mancanti o invalidi
- 404: Not Found - risorsa non trovata
- 500: Internal Server Error - errore del server

## Note di sicurezza

- CORS abilitato per origini localhost:3000 e localhost:3002
- Validazione percorsi file per prevenire directory traversal
- Limite dimensione payload: 50MB
- Headers di sicurezza implementati con Helmet.js

## Versioning

Attualmente l'API è alla versione 1.0. Future versioni potrebbero introdurre versionamento nell'URL (es. `/api/v2/`).
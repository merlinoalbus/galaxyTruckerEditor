# Galaxy Trucker Editor - Documentazione API Backend

## Architettura del Sistema

Il backend di Galaxy Trucker Editor è strutturato in modo modulare:

```
server/
├── server.js                     # Entry point principale
├── server_backup.js              # Backup versione monolitica (4000+ righe)
└── src/
    ├── parsers/
    │   ├── scriptParser.js        # Parser comandi script (659 righe)
    │   └── blockParser.js         # Conversione script ↔ blocchi (563 righe)
    ├── routes/
    │   ├── apiRoutes.js           # API generiche (immagini, file)
    │   ├── scriptsRoutes.js       # API gestione script
    │   ├── missionsRoutes.js      # API gestione missions
    │   └── gameRoutes.js          # API elementi di gioco
    └── utils/
        ├── logger.js              # Sistema logging
        ├── fileUtils.js           # Utilità file e sicurezza
        └── characterUtils.js      # Utilità personaggi
```

## Endpoint Principali

### Server Status
- `GET /health` - Health check del server

### Immagini e File (API Generiche)
- `GET /api/images` - Lista completa immagini
- `POST /api/images/binary` - Caricamento immagini binarie
- `GET /api/file/*` - Lettura file generica da percorso

### Scripts
- `GET /api/scripts` - Lista tutti gli script
- `GET /api/scripts/:scriptName?lang=EN&format=blocks` - Script specifico
- `POST /api/scripts/:scriptName/save` - Salvataggio script da blocchi JSON
- `GET /api/scripts/variables` - Lista variabili script
- `GET /api/scripts/semaphores` - Lista semafori script  
- `GET /api/scripts/labels` - Lista label script

### Missions
- `GET /api/missions` - Lista tutte le missions
- `GET /api/missions/:missionName?lang=EN&format=blocks` - Mission specifica
- `POST /api/missions/:missionName/save` - Salvataggio mission da blocchi JSON
- `GET /api/missions/routes` - Lista archi/percorsi mappa

### Elementi di Gioco
- `GET /api/game/characters` - Lista personaggi con immagini
- `GET /api/game/nodes` - Lista nodi mappa multilingua
- `GET /api/game/buttons` - Lista bottoni (generati da nodi)
- `GET /api/game/achievements` - Lista achievement con stringhe localizzate
- `GET /api/game/achievements/images` - Immagini achievement

---

## API 1: Lista Immagini con Classificazione Intelligente

**Endpoint:** `GET /api/images`

**Descrizione:** Ricerca ricorsiva case-insensitive di tutte le immagini JPG/PNG con classificazione intelligente e deduplicazione.

**Risposta:**
```json
{
  "success": true,
  "data": [
    {
      "nomefile": "alterEgo",
      "percorso": "campaign/alterEgo.png",
      "tipo": "campaign",
      "sottotipo": "character",
      "dimensione": 15420,
      "modificato": "2024-01-15T10:00:00.000Z",
      "profondita": 1
    }
  ],
  "count": 156,
  "stats": {
    "totali_trovate": 203,
    "dopo_deduplicazione": 156,
    "duplicate_rimosse": 47
  }
}
```

**Caratteristiche:**
- **Ricerca ricorsiva:** Pattern `**/*.{jpg,jpeg,png}` case-insensitive
- **Classificazione intelligente:** Tipo/sottotipo basato su percorso
- **Deduplicazione:** Per `nomefile + tipo + sottotipo` 
- **Priorità duplicati:** Dimensione maggiore → Data più recente

**Classificazione Tipi:**
- `campaign` - Cartelle campaign/
- `interface` - Cartelle icons/, ui/
- `parts` - Cartelle parts/, components/
- `achievements` - Cartelle achievements/
- `system` - Root level

**Classificazione Sottotipi:**
- `character` - Cartelle /big/, /small/
- `variant` - File con _big, _small
- `sequence` - File che terminano con numeri
- `generic` - Altri casi

---

## API 2: Recupero Binary con Fallback

**Endpoint:** `POST /api/images/binary`

**Descrizione:** Carica immagini in formato binary (base64) con fallback automatico per immagini mancanti.

**Body:**
```json
{
  "percorsi": [
    "campaign/alterEgo.png",
    "icons/missing.jpg"
  ]
}
```

**Risposta:**
```json
{
  "success": true,
  "data": [
    {
      "percorso": "campaign/alterEgo.png",
      "binary": "iVBORw0KGgoAAAANSUhEUgAA...",
      "successo": true,
      "dimensione": 15420
    },
    {
      "percorso": "icons/missing.jpg",
      "binary": "iVBORw0KGgoAAAANSUhEUgAA...",
      "successo": false,
      "errore": "File not found - fallback applied",
      "fallback": "./avatars/common/avatar_no_avatar.png",
      "dimensione": 8432
    }
  ],
  "stats": {
    "richieste": 2,
    "successo": 1,
    "fallback": 1,
    "fallback_disponibile": true
  }
}
```

**Caratteristiche:**
- **Fallback robusto:** `./avatars/common/avatar_no_avatar.png` per immagini mancanti
- **Gestione errori:** Ogni immagine ha stato successo individuale
- **Sicurezza:** Validazione path traversal e estensioni consentite
- **Performance:** Pre-caricamento immagine fallback

---

## API 3: Lista Variabili con Scansione Ricorsiva

**Endpoint:** `GET /api/scripts/variables`

**Descrizione:** Scansione ricorsiva di tutti i file .txt in ./campaign per estrarre variabili numeriche con dettagli di utilizzo.

**Risposta:**
```json
{
  "success": true,
  "data": [
    {
      "nomevariabile": "credits",
      "listascriptchelausano": ["tutorial_intro", "mission_cargo", "shop_dialog"],
      "tipo": "numerica",
      "utilizzi_totali": 15,
      "operazioni": {
        "SET_TO": 3,
        "ADD": 8,
        "IF_IS": 2,
        "IF_MIN": 1,
        "IF_MAX": 1
      },
      "valori_utilizzati": [0, 10, 50, 100]
    }
  ],
  "count": 45
}
```

**Caratteristiche:**
- **Scansione ricorsiva:** Pattern `./campaign/**/*.txt` 
- **Univocità:** Ogni variabile appare una sola volta
- **Aggregazione:** Tutti gli script che la usano vengono consolidati
- **Operazioni tracciate:** SET_TO, ADD, IF_IS, IF_MIN, IF_MAX
- **Valori utilizzati:** Array ordinato di tutti i valori numerici trovati

**Fonte dati:** Tutti i file .txt nella cartella campaign e sottocartelle

---

## API 4: Lista Semafori con Analisi Operazioni

**Endpoint:** `GET /api/scripts/semaphores`

**Descrizione:** Scansione ricorsiva di tutti i file .txt in ./campaign per estrarre semafori booleani con analisi dettagliata.

**Risposta:**
```json
{
  "success": true,
  "data": [
    {
      "nomesemaforo": "tutorial_seen",
      "listascriptchelousano": ["intro_script", "main_menu", "help_system"],
      "tipo": "booleano",
      "utilizzi_totali": 8,
      "operazioni": {
        "SET": 2,
        "RESET": 1,
        "IF": 3,
        "IFNOT": 1,
        "OPT_IF": 1
      },
      "stato_finale_probabile": "SET"
    }
  ],
  "count": 23
}
```

**Caratteristiche:**
- **Scansione ricorsiva:** Pattern `./campaign/**/*.txt`
- **Operazioni tracciate:** SET, RESET, IF, IFNOT, OPT_IF, OPT_IFNOT  
- **Stato finale probabile:** "SET" se più SET che RESET, "RESET" altrimenti
- **Distinzione da variabili:** Esclude IF_IS, IF_MIN, IF_MAX (che sono per variabili numeriche)

**Fonte dati:** Tutti i file .txt nella cartella campaign e sottocartelle

---

## API 5: Lista Label con Tracciamento Utilizzo

**Endpoint:** `GET /api/scripts/labels`

**Descrizione:** Scansione ricorsiva di tutti i file .txt in ./campaign per estrarre label (punti di salto) con tracciamento dettagliato degli utilizzi.

**Risposta:**
```json
{
  "success": true,
  "data": [
    {
      "nomelabel": "campaignIntroEnd",
      "scriptancoraggio": "campaignIntro",
      "utilizzi_totali": 2,
      "posizione_definizione": {
        "file": "tutorials.txt",
        "linea": 84
      },
      "riferimenti": [
        {
          "linea": 42,
          "comando": "GO campaignIntroEnd"
        },
        {
          "linea": 78,
          "comando": "GO campaignIntroEnd"
        }
      ]
    }
  ],
  "count": 1
}
```

**Caratteristiche:**
- **Scansione ricorsiva:** Pattern `./campaign/**/*.txt`
- **Tracciamento intra-script:** Le label sono utilizzate solo all'interno dello stesso script
- **Posizione definizione:** File e numero di linea dove è definita la LABEL
- **Riferimenti GO:** Lista di tutti i comandi GO che saltano a questa label
- **Script ancoraggio:** Nome dello script che contiene la label

**Fonte dati:** Tutti i file .txt nella cartella campaign e sottocartelle

**Note:** Le label in Galaxy Trucker sono sempre intra-script - non esistono salti cross-script tramite GO.

---

## API 6: Lista Personaggi con Analisi Utilizzo

**Endpoint:** `GET /api/game/characters`

**Descrizione:** Lista completa personaggi definiti in characters.yaml con analisi dettagliata dell'utilizzo negli script/missions e tutte le immagini disponibili.

**Risposta:**
```json
{
  "success": true,
  "data": [
    {
      "nomepersonaggio": "tutor",
      "visibile": false,
      "immaginebase": {
        "nomefile": "tutor",
        "percorso": "campaign/tutor.png",
        "binary": "iVBORw0KGgoAAAANSUhEUgAA..."
      },
      "listaimmagini": [
        {
          "nomefile": "tutor",
          "percorso": "campaign/tutor.png", 
          "binary": "iVBORw0KGgoAAAANSUhEUgAA..."
        },
        {
          "nomefile": "tutor-smile",
          "percorso": "campaign/tutor-smile.png",
          "binary": "iVBORw0KGgoAAAANSUhEUgAA..."
        },
        {
          "nomefile": "tutor-out",
          "percorso": "campaign/tutor-out.png",
          "binary": "iVBORw0KGgoAAAANSUhEUgAA..."
        }
      ],
      "posizione": null,
      "utilizzi_totali": 25,
      "script_che_lo_usano": ["campaignIntro", "tutorialIntro"],
      "comandi_utilizzati": ["SHOWCHAR", "HIDECHAR", "SAYCHAR"],
      "immagine_corrente": "campaign/tutor-smile.png"
    }
  ],
  "count": 45
}
```

**Caratteristiche:**
- **Fonte base:** `campaign/characters.yaml` - Lista completa di tutti i personaggi definiti
- **Analisi utilizzo:** Scansione ricorsiva `campaign/**/*.txt` per statistiche dettagliate
- **Immagini complete:** Tutte le varianti trovate con pattern `nomepersonaggio*.png`
- **Binary incluso:** Sia immaginebase che listaimmagini contengono binary base64
- **Personaggi non utilizzati:** Inclusi con utilizzi_totali=0 per completezza editor

**Logica implementazione:**
1. Carica tutti i personaggi da `campaign/characters.yaml`
2. Scansiona script per trovare comandi: SHOWCHAR, HIDECHAR, CHANGECHAR, SAYCHAR, ASKCHAR, FOCUSCHAR
3. Raccoglie statistiche utilizzo per ogni personaggio
4. Carica immagine base con binary da percorso YAML
5. Trova tutte le varianti immagine in `campaign/` con pattern nome
6. Determina immagine_corrente da ultimo CHANGECHAR o default base

**Valori fissi per specifica:**
- `visibile: false` (sempre)
- `posizione: null` (sempre)

**Fonti dati:** 
- `campaign/characters.yaml` - Definizioni personaggi e immagini base
- `campaign/**/*.txt` - Utilizzo effettivo negli script
- `campaign/*.png` - Varianti immagini disponibili

---

## API 7: Lista Nodi Mappa con Attributi Completi

**Endpoint:** `GET /api/game/nodes`

**Descrizione:** Lista completa nodi della mappa con tutti gli attributi da nodes.yaml multilingua e analisi dettagliata dell'utilizzo negli script.

**Risposta:**
```json
{
  "success": true,
  "data": [
    {
      "name": "newbie",
      "coordinates": [1250, 2550],
      "image": "newbieport.png", 
      "localizedCaptions": {
        "EN": "Port Newbie",
        "CS": "Přístav Nováček",
        "DE": "Neuling-Hafen"
      },
      "localizedDescriptions": {
        "EN": "All galaxy truckers start their careers here.",
        "CS": "Všichni galaktičtí kamioňáci zde začínají svou kariéru."
      },
      "shuttles": [["outpost", 10], ["regula", 15], ["bar", 10]],
      "buttons": [
        {
          "id": "btutor", 
          "script": "newbieDlg",
          "localizedLabels": {
            "EN": "Talk to instructor."
          }
        },
        {
          "id": "brace",
          "script": "raceDlg", 
          "localizedLabels": {
            "EN": "Sign up for race."
          }
        }
      ],
      "imagePath": "campaign/campaignMap/big/newbieport.png",
      "imageBinary": "iVBORw0KGgoAAAANSUhEUgAA...",
      "utilizzi_totali": 3,
      "script_che_lo_usano": ["campaignIntro", "tutorial"],
      "comandi_utilizzati": ["CENTERMAPBYNODE", "MOVEPLAYERTONODE"]
    }
  ],
  "count": 15
}
```

**Caratteristiche:**
- **Tutti gli attributi originali:** name, coordinates, image, shuttles, buttons preservati esattamente
- **Supporto multilingua:** Caption e description da tutti i files `campaignScripts[XX]/nodes.yaml`
- **Buttons strutturati:** Parsing da formato array `[id, script, label]` a oggetti completi
- **Immagini complete:** Binary base64 da `campaign/campaignMap/big/`
- **Analisi utilizzo:** Scansione script per comandi sui nodi

**Logica implementazione:**
1. Carica `nodes.yaml` da tutte le lingue (`campaignScripts[XX]/`)
2. Unisce dati multilingua per ogni nodo mantenendo attributi originali
3. Scansiona `campaign/**/*.txt` per comandi: SHOWNODE, HIDENODE, CENTERMAPBYNODE, MOVEPLAYERTONODE
4. Carica immagini con binary da `campaign/campaignMap/big/`
5. Parsa buttons da formato array a struttura con localizedLabels
6. Raccoglie statistiche complete utilizzo per ogni nodo

**Fonti dati:**
- `campaign/campaignScripts[XX]/nodes.yaml` - Definizioni nodi multilingua
- `campaign/**/*.txt` - Utilizzo effettivo negli script
- `campaign/campaignMap/big/*.png` - Immagini nodi con binary

**Note sui buttons:** Come specificato, i buttons rendono "stellati" gli script collegati (es: newbieDlg, raceDlg, debugStart sono collegati ai bottoni di Port Newbie)

---

## API 8: Lista Archi Mappa con Attributi Completi

**Endpoint:** `GET /api/missions/routes`

**Descrizione:** Lista completa archi/rotte della mappa con tutti gli attributi da missions.yaml multilingua e analisi dettagliata dell'utilizzo negli script.

**Risposta:**
```json
{
  "success": true,
  "data": [
    {
      "name": "R1-1a",
      "source": "newbie", 
      "destination": "bar",
      "missiontype": "NORMAL",
      "license": "STI",
      "button": {
        "id": "blaunch",
        "script": "camp_takeRoute", 
        "mission": "ms_first_mission",
        "localizedLabels": {
          "EN": "Launch Mission"
        }
      },
      "localizedCaptions": {
        "EN": "Regular Route to Space Bar",
        "CS": "Pravidelná trasa do Space Baru",
        "DE": "Reguläre Route zur Space Bar"
      },
      "localizedDescriptions": {
        "EN": "Good mission to start with, for a newbie trucker.",
        "CS": "Dobrá mise pro začátečníka kamioňáka."
      },
      "utilizzi_totali": 5,
      "script_che_lo_usano": ["campaignIntro", "routeSelection"],
      "comandi_utilizzati": ["SHOWPATH", "CENTERMAPBYPATH"]
    }
  ],
  "count": 25
}
```

**Caratteristiche:**
- **Tutti gli attributi originali:** name, source, destination, missiontype, license, button preservati esattamente
- **Classificazione rotte:** missiontype (NORMAL=linea piena, UNIQUE=tratteggiato), license (STI/STII/STIII=colore)
- **Button strutturato:** Parsing da formato array `[id, script, mission]` a oggetto completo
- **Supporto multilingua:** Caption e description da tutti i files `campaignScripts[XX]/missions.yaml`
- **Analisi utilizzo:** Scansione script per comandi sulle rotte

**Logica implementazione:**
1. Carica `missions.yaml` da tutte le lingue (`campaignScripts[XX]/`)
2. Unisce dati multilingua per ogni rotta mantenendo attributi originali
3. Scansiona `campaign/**/*.txt` per comandi: SHOWPATH, HIDEPATH, CENTERMAPBYPATH, HIDEALLPATHS
4. Parsa button da formato array a struttura con localizedLabels
5. Raccoglie statistiche complete utilizzo per ogni rotta

**Fonti dati:**
- `campaign/campaignScripts[XX]/missions.yaml` - Definizioni rotte multilingua
- `campaign/**/*.txt` - Utilizzo effettivo negli script

**Note sui tipi:**
- **missiontype NORMAL:** Linea piena sulla mappa
- **missiontype UNIQUE:** Linea tratteggiata sulla mappa  
- **license STI/STII/STIII:** Determina colore della rotta sulla mappa

---

## API 9: Lista Bottoni Completa con Analisi Utilizzo

**Endpoint:** `GET /api/game/buttons`

**Descrizione:** Lista completa di tutti i bottoni UI calcolati sia dai nodi che dagli archi della mappa, con analisi dettagliata dell'utilizzo negli script.

**Risposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "btutor",
      "tipo": "node_button",
      "sourceId": "newbie",
      "script": "newbieDlg",
      "localizedLabels": {
        "EN": "Talk to instructor."
      },
      "sourceDetails": {
        "name": "newbie",
        "localizedCaptions": {
          "EN": "Port Newbie",
          "CS": "Přístav Nováček"
        }
      },
      "utilizzi_totali": 3,
      "script_che_lo_usano": ["campaignIntro", "helpSystem"],
      "comandi_utilizzati": ["SHOWBUTTON", "HIDEBUTTON"]
    },
    {
      "id": "blaunch",
      "tipo": "route_button", 
      "sourceId": "R1-1a",
      "script": "camp_takeRoute",
      "mission": "ms_first_mission",
      "localizedLabels": {
        "EN": "Launch Mission"
      },
      "sourceDetails": {
        "name": "R1-1a",
        "source": "newbie",
        "destination": "bar",
        "localizedCaptions": {
          "EN": "Regular Route to Space Bar"
        }
      },
      "utilizzi_totali": 1,
      "script_che_lo_usano": ["routeManager"],
      "comandi_utilizzati": ["SHOWBUTTON"]
    }
  ],
  "count": 60
}
```

**Caratteristiche:**
- **Bottoni dai nodi:** Estratti da `buttons` array in nodes.yaml con `tipo: "node_button"`
- **Bottoni dagli archi:** Estratti da `button` field in missions.yaml con `tipo: "route_button"`
- **Source details completi:** Informazioni della sorgente (nodo o arco) per ogni bottone
- **Supporto multilingua:** Labels localizzati e caption delle sorgenti
- **Analisi utilizzo:** Scansione script per comandi sui bottoni
- **Unified interface:** Formato consistente per bottoni da fonti diverse

**Logica implementazione:**
1. Raccoglie bottoni dai nodi tramite `collectNodeButtons()`:
   - Carica nodes.yaml multilingua
   - Estrae array `buttons: [[id, script, label], ...]` da ogni nodo
   - Aggiunge sourceDetails con informazioni del nodo
2. Raccoglie bottoni dagli archi tramite `collectRouteButtons()`:
   - Carica missions.yaml multilingua  
   - Estrae `button: [id, script, mission]` da ogni rotta
   - Aggiunge sourceDetails con informazioni dell'arco
3. Scansiona `campaign/**/*.txt` per comandi: SHOWBUTTON, HIDEBUTTON
4. Aggiungi statistiche utilizzo per ogni bottone
5. Unisce entrambe le liste e ordina per ID bottone

**Fonti dati:**
- `campaign/campaignScripts[XX]/nodes.yaml` - Bottoni dei nodi
- `campaign/campaignScripts[XX]/missions.yaml` - Bottoni degli archi
- `campaign/**/*.txt` - Utilizzo effettivo negli script

**Tipi bottone:**
- **node_button:** Bottoni associati ai nodi della mappa (es: dialoghi, azioni sui luoghi)
- **route_button:** Bottoni associati agli archi della mappa (es: lancio missioni)

---

## API 10: Lista Scripts con Stellato e Collegamenti Completi

**Endpoint:** `GET /api/scripts`

**Descrizione:** Lista completa script secondo specifica con analisi collegamenti completa e stellato dai bottoni.

**Risposta:**
```json
{
  "success": true,
  "data": [
    {
      "nomescript": "newbieDlg",
      "nomefile": "tutorials.txt",
      "numero_blocchi": 8,
      "numero_comandi": 25,
      "stellato": true,
      "languages": ["EN", "CS", "DE"],
      "bottoni_collegati": [
        {
          "buttonId": "btutor",
          "sourceId": "newbie",
          "tipo": "node_button"
        }
      ],
      "script_richiamati": ["tutorialIntro"],
      "missions_richiamate": [],
      "richiamato_da_script": ["campaignIntro"],
      "richiamato_da_missions": [],
      "comandi_richiamo": ["SUB_SCRIPT"],
      "utilizzi_totali": 3,
      "variabili_utilizzate": ["tutorial_seen"],
      "personaggi_utilizzati": ["tutor"],
      "labels_definite": ["start", "end"],
      "nodi_referenziati": ["newbie"]
    }
  ],
  "count": 45
}
```

**Caratteristiche:**
- **Scansione multilingua:** Pattern `campaign/campaignScripts[XX]/*.txt` per tutte le lingue
- **Stellato dai bottoni:** Script collegati a bottoni di nodi o archi sono stellati
- **Grafo bidirezionale:** Chi chiama chi e chi è chiamato da chi (script e missions)
- **Bottoni collegati:** Tutti i bottoni che attivano lo script con dettagli sorgente
- **Analisi utilizzi:** Variabili, personaggi, labels, nodi utilizzati nello script
- **Multilingua:** Array di tutte le lingue disponibili per lo script
- **Metadata completi:** Conteggi comandi, blocchi, utilizzi totali

**Logica implementazione:**
1. Scansiona tutti i file `campaign/campaignScripts[XX]/*.txt` per tutte le lingue
2. Parsa ogni script per estrarre collegamenti (SUB_SCRIPT, ACT_MISSION)
3. Costruisce grafo bidirezionale dei collegamenti script↔missions
4. Determina script stellati raccogliendo bottoni da nodes.yaml e missions.yaml
5. Calcola filename dal primo linguaggio disponibile
6. Aggrega variabili, personaggi, labels, nodi utilizzati
7. Conta utilizzi totali da collegamenti + bottoni

**Fonti dati:**
- `campaign/campaignScripts[XX]/*.txt` - Codice script multilingua
- `campaign/campaignScripts[XX]/nodes.yaml` - Bottoni dei nodi
- `campaign/campaignScripts[XX]/missions.yaml` - Bottoni degli archi

**Note stellato:**
Uno script è "stellato" se collegato a bottoni di nodi (es: "Talk to instructor") o archi (es: "Launch Mission"). Indica script attivabili direttamente dall'interfaccia utente.

---

## API 11: Script Specifico con Parsing Completo

**Endpoint:** `GET /api/scripts/{scriptName}`

**Parametri:**
- `scriptName` (path): Nome dello script da recuperare
- `lang` (query): Lingua (default: EN) 
- `format` (query): Formato di output (raw/blocks, default: blocks)
- `multilingua` (query): Parsing multilingua (true/false, default: false)

**Descrizione:** Recupera uno script specifico con parsing completo bidirezionale secondo specifica SUPPORTOBUG. Supporta parsing in blocchi strutturati e gestione multilingua con merge automatico.

**LOGICA PARSER RICORSIVO COMPLETO:**

**STEP 1 - Identificazione File e Estrazione Script:**
```javascript
// 1. Scansiona cartella campaignScripts[LANG] 
// 2. Per ogni file .txt, legge contenuto e cerca pattern:
//    - "SCRIPT nomeScript" → inizio script
//    - "END_OF_SCRIPTS" → fine script  
// 3. Estrae array di righe tra questi delimitatori
```

**STEP 2 - Parser Sequenziale Ricorsivo:**
```javascript
function parseScriptToBlocks(lines, language) {
  let currentIndex = 0;
  while (currentIndex < lines.length) {
    const element = parseNextElement(lines, currentIndex, language);
    // Se è BLOCCO → gestione ricorsiva
    // Se è COMANDO → parsing atomico
    currentIndex = element.nextIndex;
  }
}
```

**STEP 3 - Riconoscimento BLOCCO vs COMANDO:**
```javascript
// BLOCCO: Ha pattern apertura + chiusura
// ES: "IF VIPGranted" ... "END_OF_IF"
//     "MENU" ... "END_OF_MENU"

// COMANDO: Singola riga con parametri
// ES: "SAY \"testo\"" → tipo SAY, parametro text multilingua
//     "SHOWCHAR securitybot left" → tipo SHOWCHAR, parametri character+position
```

**STEP 4 - Gestione Ricorsiva Blocchi:**
```javascript
// Quando trova BLOCCO (es. IF):
// 1. Contatore = 1, array contenuto = []
// 2. Scansiona righe successive:
//    - Se trova apertura altro blocco → contatore++
//    - Se trova "ELSE" e contatore=1 → switch a elseBranch 
//    - Se trova chiusura blocco → contatore--
//    - Ogni riga → chiamata ricorsiva parseNextElement()
// 3. Quando contatore=0 → blocco completo
// 4. Ritorna oggetto blocco strutturato
```

**STEP 5 - Catalogazione con Pattern Matching:**
```javascript
// 109 COMANDI mappati con pattern regex:
'SHOWCHAR': { pattern: /^ShowChar\s+(\w+)\s+(left|center|right)$/ }
'SAY': { pattern: /^Say\s+"(.+)"$/, multilingua: true }
'IF_IS': { pattern: /^IF_IS\s+(\w+)\s+(\d+)$/ }

// 7 BLOCCHI con varianti:
'IF': { variants: [
  { pattern: /^IF\s+(.+)$/, type: 'IF_SEMAPHORE' },
  { pattern: /^IFNOT\s+(.+)$/, type: 'IFNOT_SEMAPHORE' },
  { pattern: /^IF_PROB\s+(\d+)$/, type: 'IF_PROBABILITY' }
]}
```

**STEP 6 - Gestione Multilingua (se multilingua=true):**
```javascript
// 1. Parse stesso script in EN, ES, DE, FR, etc.
// 2. Confronto strutturale ricorsivo:
//    - Stesso numero blocchi per livello
//    - Stessi tipi comando stesse posizioni  
//    - Stesso annidamento IF/ELSE/MENU
// 3. Se strutture identiche → merge parametri multilingua:
//    { text: { EN: "Hello", ES: "Hola", DE: "Hallo" } }
// 4. Se discrepanza → errore ML con posizione esatta
```

**STEP 7 - Serializzazione Bidirezionale:**
```javascript
// PARSING: TEXT → BLOCKS (sopra)
// SERIALIZING: BLOCKS → TEXT  
function convertBlocksToScript(blocks) {
  return blocks.map(block => {
    switch(block.type) {
      case 'IF': return buildIfCommand(block) + serialize(children) + 'END_OF_IF'
      case 'SAY': return `Say "${block.parameters.text[lang]}"`
    }
  }).join('\n');
}
```

**Risposta Formato Blocks:**
```json
{
  "success": true,
  "data": {
    "name": "vipCheck",
    "fileName": "newbieDlg.txt", 
    "language": "EN",
    "originalCode": "SCRIPT vipCheck\n...\nEND_OF_SCRIPTS",
    "blocks": [
      {
        "type": "SCRIPT",
        "name": "vipCheck",
        "children": [
          {
            "type": "SHOWDLGSCENE",
            "parameters": {}
          },
          {
            "type": "SHOWCHAR", 
            "parameters": {
              "character": "securitybot",
              "position": "left"
            }
          },
          {
            "type": "IF",
            "ifType": "IF_SEMAPHORE",
            "condition": "VIPGranted", 
            "thenBranch": [...],
            "elseBranch": [...]
          }
        ]
      }
    ],
    "metadata": {
      "blockCount": 15,
      "commandCount": 45,
      "variableCount": 6,
      "characterCount": 2,
      "labelCount": 0,
      "errorCount": 0
    },
    "availableLanguages": ["EN", "ES", "DE"],
    "multilingualMerged": true
  }
}
```

**Gestione Errori:**
- `error: "PARSE - Invalid block structure at line 23"` (errori parsing)
- `error: "ML - Structure mismatch between EN and ES at block 5"` (errori multilingua)
- Fallback automatico a inglese con segnalazione errore

**Implementazione:** ✅ Completa con parser bidirezionale completo

---

## API 12: Lista Missions con Stellato e Collegamenti Completi

**Endpoint:** `GET /api/missions`

**Descrizione:** Lista completa missions secondo specifica con analisi collegamenti completa e stellato dai bottoni.

**Risposta:**
```json
{
  "success": true,
  "data": [
    {
      "nomemission": "ms_first_mission",
      "nomefile": "missions.txt",
      "numero_blocchi": 12,
      "numero_comandi": 35,
      "stellato": true,
      "languages": ["EN", "CS", "DE"],
      "bottoni_collegati": [
        {
          "buttonId": "blaunch",
          "sourceId": "R1-1a",
          "tipo": "route_button"
        }
      ],
      "script_richiamati": ["camp_takeRoute"],
      "missions_richiamate": [],
      "richiamato_da_script": ["campaignIntro"],
      "richiamato_da_missions": [],
      "comandi_richiamo": ["SUB_SCRIPT", "ACT_MISSION"],
      "utilizzi_totali": 3,
      "variabili_utilizzate": ["credits"],
      "personaggi_utilizzati": ["pilot"],
      "labels_definite": ["start", "end"],
      "nodi_referenziati": ["newbie", "bar"]
    }
  ],
  "count": 45
}
```

**Caratteristiche:**
- **Scansione multilingua:** Pattern `campaign/campaignScripts[XX]/*.txt` per blocchi MISSION
- **Stellato dai bottoni:** Missions collegate a bottoni in missions.yaml sono stellate
- **Grafo bidirezionale:** Chi chiama chi e chi è chiamato da chi (script e missions)
- **Bottoni collegati:** Solo route_button che attivano la mission
- **Analisi utilizzi:** Variabili, personaggi, labels, nodi utilizzati nella mission
- **Multilingua:** Array di tutte le lingue disponibili per la mission
- **Metadata completi:** Conteggi comandi, blocchi, utilizzi totali

**Logica implementazione:**
1. Scansiona tutti i file `campaign/campaignScripts[XX]/*.txt` per blocchi MISSION
2. Parsa ogni mission per estrarre collegamenti (SUB_SCRIPT, ACT_MISSION)
3. Costruisce grafo bidirezionale dei collegamenti script↔missions
4. Determina missions stellate raccogliendo bottoni da missions.yaml (campo button[2])
5. Calcola filename dal primo linguaggio disponibile
6. Aggrega variabili, personaggi, labels, nodi utilizzati
7. Conta utilizzi totali da collegamenti + bottoni

**Fonti dati:**
- `campaign/campaignScripts[XX]/*.txt` - Codice missions multilingua (blocchi MISSION...END_OF_MISSION)
- `campaign/campaignScripts[XX]/missions.yaml` - Bottoni degli archi (button[2] = nome mission)

**Note stellato:**
Una mission è "stellata" se collegata a bottoni di archi (es: "Launch Mission"). Il nome mission è nel campo `button[2]` del missions.yaml.

**Collegamenti missions:**
- `script_richiamati`: Script chiamati dalla mission (SUB_SCRIPT)
- `missions_richiamate`: Missions chiamate dalla mission (ACT_MISSION)  
- `richiamato_da_script`: Script che chiamano questa mission (ACT_MISSION)
- `richiamato_da_missions`: Missions che chiamano questa mission (ACT_MISSION)
```

---

## API 13: Mission Specifica con Parsing Completo 

**Endpoint:** `GET /api/missions/{missionName}`

**Parametri:**
- `missionName` (path): Nome della mission da recuperare
- `lang` (query): Lingua (default: EN) 
- `format` (query): Formato di output (raw/blocks, default: blocks)
- `multilingua` (query): Parsing multilingua (true/false, default: false)

**Descrizione:** Recupera una mission specifica con parsing completo bidirezionale secondo specifica SUPPORTOBUG. Supporta parsing in blocchi strutturati e gestione multilingua con merge automatico.

**LOGICA PARSER MISSION RICORSIVO COMPLETO:**

**STEP 1 - Identificazione File e Estrazione Mission:**
```javascript
// 1. Scansiona cartella campaignScripts[LANG] 
// 2. Per ogni file .txt, legge contenuto e cerca pattern:
//    - "MISSION nomeMission" → inizio mission
//    - "FINISH_MISSION" → sezione conclusiva (opzionale)  
//    - "END_OF_MISSION" → fine mission
// 3. Estrae array di righe tra questi delimitatori
```

**STEP 2 - Parser Mission con Sezioni Speciali:**
```javascript
function parseMissionToBlocks(lines, language) {
  // DIFFERENZE RISPETTO A SCRIPT:
  // - Gestisce sezione FINISH_MISSION opzionale
  // - Supporta blocchi BUILD e FLIGHT con fasi multiple
  // - Comandi specifici mission (ADDOPPONENT, SETSHIPTYPE, etc.)
  
  let mainContent = [];      // Contenuto principale mission
  let finishContent = [];    // Contenuto sezione FINISH_MISSION
  let inFinishSection = false;
  
  while (parsing) {
    if (line === 'FINISH_MISSION') inFinishSection = true;
    else if (inFinishSection) finishContent.push(parseNextElement(...));
    else mainContent.push(parseNextElement(...));
  }
}
```

**STEP 3 - Blocchi BUILD e FLIGHT con Fasi:**
```javascript
// BLOCCHI MISSION SPECIFICI:
'BUILD': {
  phases: [
    { pattern: /^INIT_BUILD$/, phase: 'init' },
    { pattern: /^START_BUILDING$/, phase: 'start' }, 
    { pattern: /^END_BUILDING$/, phase: 'end' }
  ]
}

'FLIGHT': {
  phases: [
    { pattern: /^INIT_FLIGHT$/, phase: 'init' },
    { pattern: /^START_FLIGHT$/, phase: 'start' },
    { pattern: /^EVALUATE_FLIGHT$/, phase: 'evaluate' },
    { pattern: /^END_FLIGHT$/, phase: 'end' }
  ]
}

// PARSING: Ogni fase diventa blocco separato con children
// ES: INIT_BUILD + comandi → { type: 'BUILD', phase: 'init', children: [...] }
```

**STEP 4 - Comandi Mission Specifici:**
```javascript
// COMANDI AGGIUNTIVI PER MISSIONS:
'ADDOPPONENT': { pattern: /^ADDOPPONENT\s+(\w+)$/ },
'SETSHIPTYPE': { pattern: /^SETSHIPTYPE\s+(STI|STII|STIII)$/ },
'ACT_MISSION': { pattern: /^ACT_MISSION\s+(\w+)$/ },
'ADDMISSIONCREDITS': { pattern: /^ADDMISSIONCREDITS\s+(\d+)$/ },

// COMANDI PARAMETRI COMPLESSI (gestiti come stringa):
'ADDPARTTOSHIP': { params: ['params:complex'], example: '1 7 alienEngine 3333 0' },
'SETADVPILE': { params: ['params:complex'], example: '1 3' }
```

**STEP 5 - Struttura Mission Completa:**
```javascript
// OGGETTO MISSION RISULTANTE:
{
  type: 'MISSION',
  name: 'ms_first_mission',
  children: [
    { type: 'INIT_BUILD', phase: 'init', children: [...] },
    { type: 'START_BUILDING', phase: 'start', children: [...] },
    { type: 'IF', ifType: 'IF_SEMAPHORE', condition: 'firstTime', 
      thenBranch: [...], elseBranch: [...] },
    { type: 'INIT_FLIGHT', phase: 'init', children: [...] }
  ],
  finishSection: [  // SEZIONE OPZIONALE
    { type: 'ADDMISSIONCREDITS', parameters: { amount: 100 } }
  ]
}
```

**STEP 6 - Confronto Strutturale Mission Multilingua:**
```javascript
// CONTROLLI AGGIUNTIVI PER MISSION:
function compareMissionStructures(mission1, mission2) {
  // 1. Controllo standard (come script)
  // 2. Controllo sezione FINISH:
  if ((mission1.finishSection && !mission2.finishSection) || 
      (!mission1.finishSection && mission2.finishSection)) {
    return { isMatch: false, mismatchLocation: 'finish section differs' };
  }
  // 3. Controllo fasi BUILD/FLIGHT:
  //    Stesso numero e ordine fasi tra lingue
}
```

**STEP 7 - Metadata Mission Specifiche:**
```javascript
// CONTEGGI AGGIUNTIVI PER MISSION:
metadata: {
  blockCount: 25,
  commandCount: 78,
  variableCount: 12,
  characterCount: 5,
  labelCount: 3,
  buildPhaseCount: 3,    // Numero fasi BUILD
  flightPhaseCount: 4,   // Numero fasi FLIGHT
  errorCount: 0
}
```

**Implementazione:** ✅ Completa con parser bidirezionale mission-specific

---

## API 14: Salvataggio Script con Serializzazione Completa

**Endpoint:** `POST /api/scripts/{scriptName}/save`

**Parametri:**
- `scriptName` (path): Nome dello script da salvare
- `lang` (body): Lingua target (default: EN)
- `blocks` (body): Array blocchi da serializzare
- `updateMode` (body): Modalità aggiornamento (replace/merge, default: replace)

**Descrizione:** Salva script da formato blocchi JSON al file di testo con serializzazione completa bidirezionale, validazione post-save e test round-trip.

**LOGICA SERIALIZZAZIONE INVERSA COMPLETA:**

**STEP 1 - Serializzazione Bidirezionale:**
```javascript
// BLOCKS → TEXT con parser completo invertito
function convertBlocksToScriptComplete(blocks) {
  return blocks.map(block => {
    switch(block.type) {
      case 'SCRIPT':
        return `SCRIPT ${block.name}\n${serializeChildren(block.children)}\nEND_OF_SCRIPTS`;
      
      case 'IF':
        let result = buildIfCommand(block); // IF/IFNOT/IF_PROB/IF_IS etc.
        result += '\n' + serializeChildren(block.thenBranch);
        if (block.elseBranch?.length) {
          result += '\nELSE\n' + serializeChildren(block.elseBranch);
        }
        result += '\nEND_OF_IF';
        return result;
        
      case 'SAY':
        return `Say "${block.parameters.text[language] || block.parameters.text.EN}"`;
      
      case 'SHOWCHAR':
        return `ShowChar ${block.parameters.character} ${block.parameters.position}`;
    }
  }).join('\n');
}
```

**STEP 2 - Gestione Comandi Complessi:**
```javascript
// 109 COMANDI mappati per serializzazione:
function buildCommandFromBlock(block) {
  switch(block.type) {
    case 'IF_IS': return `IF_IS ${block.variable} ${block.value}`;
    case 'IF_PROB': return `IF_PROB ${block.value}`;
    case 'ADDPARTTOSHIP': return `ADDPARTTOSHIP ${block.parameters.params}`; // Complex params
    case 'UNKNOWN_COMMAND': return `${block.name} ${block.parameters.raw}`;
  }
}
```

**STEP 3 - Aggiornamento File Intelligente:**
```javascript
// REPLACE MODE: Sostituisce solo lo script specifico
// 1. Legge file esistente
// 2. Trova pattern SCRIPT nomeScript ... END_OF_SCRIPTS
// 3. Rimuove blocco esistente
// 4. Inserisce nuovo contenuto serializzato
// 5. Preserva tutti gli altri script nel file
```

**STEP 4 - Validazione Post-Save Round-Trip:**
```javascript
// TEST BIDIREZIONALITÀ:
// 1. Salva blocks → text
// 2. Rilegge text → blocks (via API 11)
// 3. Confronta strutture originale vs riletta
// 4. Verifica serializzazione→parsing→serializzazione = idempotente
```

**Body Request:**
```json
{
  "lang": "EN",
  "blocks": [
    {
      "type": "SCRIPT",
      "name": "vipCheck",
      "children": [
        {
          "type": "SHOWDLGSCENE",
          "parameters": {}
        },
        {
          "type": "IF",
          "ifType": "IF_SEMAPHORE",
          "condition": "VIPGranted",
          "thenBranch": [
            {
              "type": "SAY",
              "parameters": {
                "text": {
                  "EN": "Access granted!",
                  "ES": "¡Acceso concedido!"
                }
              }
            }
          ],
          "elseBranch": [
            {
              "type": "SAY", 
              "parameters": {
                "text": {
                  "EN": "Access denied!",
                  "ES": "¡Acceso denegado!"
                }
              }
            }
          ]
        }
      ]
    }
  ]
}
```

**Risposta con Validazione:**
```json
{
  "success": true,
  "data": {
    "scriptName": "vipCheck",
    "language": "EN",
    "blockCount": 1,
    "generatedLines": 15,
    "savedAt": "2024-01-15T10:30:00.000Z",
    "filePath": "scripts_EN.txt",
    "validation": {
      "isValid": true,
      "roundTripTest": {
        "passed": true,
        "originalLines": 15,
        "reserializedLines": 15
      },
      "structureValidation": {
        "passed": true,
        "blockCount": 1,
        "commandCount": 4
      }
    }
  }
}
```

**Gestione Errori Serializzazione:**
- `SERIALIZATION_ERROR` - Errore nella conversione BLOCKS→TEXT
- `VALIDATION_FAILED` - Test round-trip fallito 
- `STRUCTURE_MISMATCH` - Struttura salvata ≠ originale

**Implementazione:** ✅ Completa con serializzazione bidirezionale + validazione

---

## API 15: Salvataggio Mission con Serializzazione Completa

**Endpoint:** `POST /api/missions/{missionName}/save`

**Parametri:**
- `missionName` (path): Nome della mission da salvare
- `lang` (body): Lingua target (default: EN)
- `blocks` (body): Array blocchi mission da serializzare
- `updateMode` (body): Modalità aggiornamento (replace/merge, default: replace)

**Descrizione:** Salva mission da formato blocchi JSON al file di testo con serializzazione completa mission-specific, gestione sezioni FINISH, fasi BUILD/FLIGHT e validazione post-save.

**LOGICA SERIALIZZAZIONE MISSION COMPLETA:**

**STEP 1 - Serializzazione Mission con Sezioni Speciali:**
```javascript
// MISSION BLOCKS → TEXT con gestione sezioni specifiche
function serializeMissionBlocks(blocks) {
  return blocks.map(block => {
    switch(block.type) {
      case 'MISSION':
        let result = `MISSION ${block.name}\n`;
        result += serializeChildren(block.children);
        
        // SEZIONE FINISH OPZIONALE
        if (block.finishSection?.length) {
          result += '\nFINISH_MISSION\n';
          result += serializeChildren(block.finishSection);
        }
        
        result += '\nEND_OF_MISSION';
        return result;
        
      case 'BUILD':
        return getPhaseCommand('BUILD', block.phase) + '\n' + 
               serializeChildren(block.children);
               
      case 'FLIGHT': 
        return getPhaseCommand('FLIGHT', block.phase) + '\n' +
               serializeChildren(block.children);
    }
  }).join('\n');
}
```

**STEP 2 - Gestione Fasi BUILD/FLIGHT:**
```javascript
// MAPPING FASI → COMANDI
function getPhaseCommand(blockType, phase) {
  if (blockType === 'BUILD') {
    switch(phase) {
      case 'init': return 'INIT_BUILD';
      case 'start': return 'START_BUILDING'; 
      case 'end': return 'END_BUILDING';
    }
  } else if (blockType === 'FLIGHT') {
    switch(phase) {
      case 'init': return 'INIT_FLIGHT';
      case 'start': return 'START_FLIGHT';
      case 'evaluate': return 'EVALUATE_FLIGHT';
      case 'end': return 'END_FLIGHT';
    }
  }
}
```

**STEP 3 - Comandi Mission Specifici:**
```javascript
// SERIALIZZAZIONE COMANDI MISSION:
case 'ADDOPPONENT': return `ADDOPPONENT ${block.parameters.character}`;
case 'SETSHIPTYPE': return `SETSHIPTYPE ${block.parameters.type}`;
case 'ACT_MISSION': return `ACT_MISSION ${block.parameters.mission}`;
case 'ADDMISSIONCREDITS': return `ADDMISSIONCREDITS ${block.parameters.amount}`;

// COMANDI PARAMETRI COMPLESSI:
case 'ADDPARTTOSHIP': return `ADDPARTTOSHIP ${block.parameters.params}`;
case 'SETADVPILE': return `SETADVPILE ${block.parameters.params}`;
```

**STEP 4 - Validazione Mission Specifica:**
```javascript
// VALIDAZIONE AGGIUNTIVA PER MISSION:
function validateMissionStructure(originalBlocks, savedBlocks) {
  // 1. Validazione standard (come script)
  // 2. Controllo sezione FINISH:
  if ((orig.finishSection && !saved.finishSection) || 
      (!orig.finishSection && saved.finishSection)) {
    return { isValid: false, error: 'Finish section mismatch' };
  }
  // 3. Controllo fasi BUILD/FLIGHT:
  //    Verificare stesso numero e ordine fasi
  // 4. Controllo comandi mission-specific
}
```

**Body Request Mission:**
```json
{
  "lang": "EN", 
  "blocks": [
    {
      "type": "MISSION",
      "name": "ms_first_mission",
      "children": [
        {
          "type": "BUILD",
          "phase": "init",
          "children": [
            {
              "type": "SETSHIPTYPE",
              "parameters": { "type": "STI" }
            }
          ]
        },
        {
          "type": "BUILD", 
          "phase": "start",
          "children": [
            {
              "type": "ADDPARTTOSHIP",
              "parameters": { "params": "1 7 alienEngine 3333 0" }
            }
          ]
        },
        {
          "type": "FLIGHT",
          "phase": "init", 
          "children": [
            {
              "type": "ADDOPPONENT",
              "parameters": { "character": "pirate1" }
            }
          ]
        }
      ],
      "finishSection": [
        {
          "type": "ADDMISSIONCREDITS",
          "parameters": { "amount": 100 }
        }
      ]
    }
  ]
}
```

**Risposta con Validazione Mission:**
```json
{
  "success": true,
  "data": {
    "missionName": "ms_first_mission",
    "language": "EN",
    "blockCount": 1,
    "generatedLines": 12,
    "savedAt": "2024-01-15T10:30:00.000Z",
    "filePath": "missions_EN.txt",
    "validation": {
      "isValid": true,
      "roundTripTest": {
        "passed": true,
        "originalLines": 12,
        "reserializedLines": 12
      },
      "structureValidation": {
        "passed": true,
        "blockCount": 1,
        "commandCount": 4,
        "buildPhases": 2,
        "flightPhases": 1
      }
    }
  }
}
```

**Implementazione:** ✅ Completa con serializzazione mission-specific + validazione

---

## API 16: Lista Achievement Completa con Analisi Utilizzo

**Endpoint:** `GET /api/game/achievements`

**Descrizione:** Lista completa achievement con tutti i campi dal YAML e analisi dettagliata dell'utilizzo negli script/missions.

**Risposta:**
```json
{
  "success": true,
  "data": [
    {
      "name": "first_achievements",
      "category": "exploring",
      "points": 5,
      "objectivesCount": 1,
      "hidden": false,
      "repeatable": false,
      "preDesc": "pre_first_achievements",
      "postDesc": "post_first_achievements",
      "preImage": {
        "fileName": "p_Challenge_Accepted.jpg",
        "path": "achievements/images/p_Challenge_Accepted.jpg",
        "exists": true
      },
      "postImage": {
        "fileName": "Challenge_Accepted.jpg",
        "path": "achievements/images/Challenge_Accepted.jpg",
        "exists": true
      },
      "localizedNames": {
        "EN": "Challenge Accepted!",
        "IT": "Sfida Accettata!"
      },
      "localizedPreDescriptions": {
        "EN": "Complete any achievement",
        "IT": "Completa qualsiasi obiettivo"
      },
      "localizedPostDescriptions": {
        "EN": "You've unlocked your first achievement!",
        "IT": "Hai sbloccato il tuo primo obiettivo!"
      },
      "utilizzi_totali": 3,
      "script_che_lo_utilizzano": ["intro_script", "tutorial_complete"],
      "comandi_utilizzati": ["UNLOCKACHIEVEMENT", "SETACHIEVEMENTPROGRESS"]
    }
  ],
  "count": 45
}
```

**Caratteristiche:**
- **Campi completi dal YAML:** name, category, points, objectivesCount, hidden, repeatable
- **Chiavi localizzazione:** preDesc, postDesc preservate per riferimento
- **Verifica immagini:** Controllo esistenza file pre/post con path completo
- **Stringhe multilingua:** Nome e descrizioni pre/post in tutte le lingue
- **Analisi utilizzo:** Scansione script/missions per comandi achievement
- **Ordinamento:** Per categoria e poi per nome

**Logica implementazione:**
1. Carica `achievements/achi.yaml` con TUTTI i campi originali
2. Per ogni achievement:
   - Usa `name` come identificatore (NON `id`)
   - Verifica esistenza immagini in `achievements/images/`
   - Carica stringhe localizzate usando:
     - `name` per il nome localizzato
     - `preDesc` per la descrizione pre-sblocco
     - `postDesc` per la descrizione post-sblocco
3. Scansiona `campaign/**/*.txt` per trovare utilizzi:
   - UNLOCKACHIEVEMENT
   - SETACHIEVEMENTPROGRESS
   - IFACHIEVEMENTUNLOCKED
4. Ordina per categoria e nome

**Fonti dati:**
- `achievements/achi.yaml` - Definizioni achievement con tutti i campi
- `localization_strings/achievements_strings_[XX].yaml` - Stringhe localizzate
- `campaign/**/*.txt` - Utilizzo negli script/missions
- `achievements/images/` - Verifica esistenza immagini

**Note correzioni:**
- Corretto: usa `name` non `id` (campo inesistente)
- Corretto: usa `points` non `value`
- Rimosso: campo `type` inventato
- Aggiunti: tutti i campi mancanti dal YAML
- Aggiunta: analisi utilizzo come API 10/12

---

## API 17: Get File Generico con Binary

**Endpoint:** `POST /api/game/file/binary`

**Descrizione:** Carica binary base64 per qualsiasi tipo di file. API generica speculare all'API 2 ma senza restrizioni di estensione e senza fallback.

**Body:**
```json
{
  "percorsi": [
    "achievements/images/Challenge_Accepted.jpg",
    "campaign/characters.yaml",
    "config/settings.txt",
    "missing_file.png"
  ]
}
```

**Risposta:**
```json
{
  "success": true,
  "data": [
    {
      "percorso": "achievements/images/Challenge_Accepted.jpg",
      "binary": "iVBORw0KGgoAAAANSUhEUgAA...",
      "successo": true,
      "dimensione": 15420,
      "tipo": "image"
    },
    {
      "percorso": "campaign/characters.yaml",
      "binary": "LSBuYW1lOiAiZmlyc3RfYWNoaWV2ZW1lbnRzIg==",
      "successo": true,
      "dimensione": 1024,
      "tipo": "text"
    },
    {
      "percorso": "config/settings.txt",
      "binary": "dmVyc2lvbjogMS4wCmRlYnVnOiB0cnVl",
      "successo": true,
      "dimensione": 256,
      "tipo": "text"
    },
    {
      "percorso": "missing_file.png",
      "binary": null,
      "successo": false,
      "errore": "File not found",
      "dimensione": 0,
      "tipo": "unknown"
    }
  ],
  "stats": {
    "richieste": 4,
    "successo": 3,
    "falliti": 1
  }
}
```

**Caratteristiche:**
- **Nessuna restrizione estensione:** Accetta qualsiasi tipo di file (immagini, testo, binary, etc.)
- **Nessun fallback:** Se file non esiste, binary = null (a differenza API 2)
- **Classificazione tipo:** Determina automaticamente tipo file (image/text/audio/video/archive/document/binary)
- **Sicurezza path:** Validazione traversal e caratteri pericolosi mantenuta
- **Speculare API 2:** Stessa struttura ma generalizzata

**Logica implementazione:**
1. Valida ogni percorso per sicurezza (no traversal, no caratteri pericolosi)
2. Per ogni file:
   - Se esiste: carica binary + determina tipo + statistiche
   - Se non esiste: binary = null, successo = false
3. Classifica tipo file dall'estensione
4. Nessun fallback automatico

**Tipi file supportati:**
- **image:** jpg, jpeg, png, gif, bmp, webp
- **text:** txt, yaml, yml, json, xml, csv, md
- **audio:** mp3, wav, ogg, m4a
- **video:** mp4, avi, mov, webm
- **archive:** zip, rar, 7z, tar, gz
- **document:** pdf, doc, docx
- **binary:** tutti gli altri

**Differenze da API 2:**
- ✅ **Tutti i tipi** vs solo immagini
- ❌ **Nessun fallback** vs fallback avatar_no_avatar.png
- ✅ **Campo tipo** per classificazione
- ✅ **Validazione più robusta**

**Casi d'uso:**
- Caricare immagini achievement (sostituisce API 17 originale)
- Caricare file configurazione YAML/JSON
- Caricare qualsiasi asset di gioco
- Editor per preview file generici
```

---

## API Generica: Lettura File

**Endpoint:** `GET /api/file/*`

**Descrizione:** Legge contenuto di qualsiasi file dal percorso specificato.

**Esempio:** `GET /api/file/config/settings.yaml`

**Risposta:**
```json
{
  "success": true,
  "data": {
    "path": "config/settings.yaml",
    "content": "version: 1.0\ndebug: true",
    "size": 1024,
    "modified": "2024-01-15T10:00:00.000Z",
    "encoding": "utf8"
  }
}
```

**Sicurezza:** Validazione path traversal, solo file all'interno della directory di gioco.

---

## Sistema di Parsing Comandi

Il sistema supporta oltre 70 tipi di comando Galaxy Trucker:

### Comandi Contenitore (con annidamento)
- `IF`, `IFNOT`, `IF_PROB`, `IF_IS`, `IF_DEBUG`, ecc. → `END_OF_IF`
- `MENU` → `OPT`/`OPT_IF`/`OPT_IFNOT` → `END_OF_MENU`
- `SUB_SCRIPT` → `END_SUB_SCRIPT`
- `MISSION` → `END_OF_MISSION`

### Comandi Atomici
- **Dialoghi**: `SAY`, `SAYCHAR`, `ASK`, `ASKCHAR`, `ANNOUNCE`
- **Variabili**: `SET`, `RESET`, `SET_TO`, `ADD`
- **Personaggi**: `SHOWCHAR`, `HIDECHAR`, `CHANGECHAR`, `FOCUSCHAR`
- **Mappa**: `SHOWPATH`, `HIDEPATH`, `SHOWNODE`, `HIDENODE`
- **Flusso**: `LABEL`, `GO`, `RETURN`, `DELAY`
- **Mission**: `ADDOPPONENT`, `ADDCREDITS`, `SETSHIPTYPE`
- **Achievement**: `UNLOCKACHIEVEMENT`, `SETACHIEVEMENTPROGRESS`

### Gestione Annidamenti
Il parser gestisce correttamente:
- Annidamenti multipli (IF dentro MENU dentro SUB_SCRIPT)
- Condizioni ELSE per blocchi IF
- Opzioni condizionali nei menu
- Parsing ricorsivo con controllo profondità massima

---

## Supporto Multilingua

**Lingue supportate:** EN, CS, DE, ES, FR, PL, RU

**Struttura file:**
- `scripts_EN.txt`, `scripts_CS.txt`, etc.
- `missions_EN.txt`, `missions_CS.txt`, etc.
- `localization_strings/nodes_EN.yaml`, `nodes_CS.yaml`, etc.
- `localization_strings/achievements_strings_EN.yaml`, etc.

**Aggregazione dati:** Le API aggregano automaticamente dati da tutte le lingue, fornendo oggetti con chiavi localizzate:

```json
{
  "localizedNames": {
    "EN": "English Name",
    "IT": "Nome Italiano",
    "ES": "Nombre Español"
  }
}
```

---

## Sicurezza e Validazione

### Validazione Path
- Controllo directory traversal (`../`)
- Whitelist estensioni file
- Percorsi relativi alla directory di gioco

### Logging
- Winston logger con rotazione file
- Log requests, errori, performance
- Levels: info, warn, error

### Error Handling
- Middleware centralizzato errori
- Risposte strutturate con `success: boolean`
- Stack trace solo in development

---

## Performance e Ottimizzazioni

### Caching
- Contenuti multilingua caricati on-demand
- Parsing script cacheable per sessione

### Streaming
- Immagini binarie con supporto base64
- Limit 50MB per request JSON

### Monitoring
- Health check endpoint
- Metriche timing per ogni request
- File watcher per hot reload (development)

---

## Deployment e Configurazione

### Variabili Ambiente
- `PORT`: Porta server (default: 3001)
- `NODE_ENV`: production/development
- `LOG_LEVEL`: debug/info/warn/error

### Dependencies
- **express**: Web framework
- **cors**: CORS handling  
- **helmet**: Security headers
- **winston**: Logging
- **js-yaml**: YAML parsing
- **fs-extra**: File operations
- **chokidar**: File watching

### Struttura Modulare
```
server.js (123 righe) ← Entry point
├── routes/ (4 moduli)
├── parsers/ (2 moduli, 1222 righe totali) 
├── utils/ (3 moduli)
└── Backup: server_backup.js (4040 righe)
```

**Benefici modularizzazione:**
- ✅ Codice manutenibile e testabile
- ✅ Separazione responsabilità
- ✅ Facilità debug e sviluppo
- ✅ Scalabilità per nuove funzionalità

---

## Testing e Debug

### Health Check
```bash
curl http://localhost:3001/health
```

### Test API Examples
```bash
# Lista immagini
curl http://localhost:3001/api/images

# Script specifico
curl http://localhost:3001/api/scripts/tutorial_intro?lang=EN&format=blocks

# Salvataggio script
curl -X POST http://localhost:3001/api/scripts/test/save \
  -H "Content-Type: application/json" \
  -d '{"lang":"EN","blocks":[...]}'
```

### Log Files
- `server.log` - Log principale (5MB rotazione)
- Console output colorato per development

---

**Sistema completo e pronto per produzione! ✅**
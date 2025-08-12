# Report di Categorizzazione Comandi per Visual Flow Editor

## Categorie Proposte

### 1. 🎯 **GENERALE** (Comandi più comuni - sempre visibili)
Comandi utilizzati frequentemente che devono essere sempre accessibili:

- **SAY** (12.23%) - Dialogo base
- **DELAY** (7.10%) - Attesa temporizzata  
- **SET** (4.17%) - Imposta semaforo
- **RESET** (1.40%) - Resetta semaforo
- **GO** (2.99%) - Salto a label
- **LABEL** (1.27%) - Definisce punto di ancoraggio
- **SUB_SCRIPT** (2.71%) - Richiama altro script
- **RETURN** (0.81%) - Ritorna allo script chiamante

### 2. 💬 **DIALOGO** 
Tutti i comandi relativi a dialoghi e comunicazione:

- **ASK** (2.61%) - Domanda con menu
- **SAYCHAR** (0.62%) - Dialogo con personaggio
- **ASKCHAR** (0.10%) - Domanda con personaggio
- **ANNOUNCE** (0.68%) - Messaggio su barra stato
- **SETFLIGHTSTATUSBAR** (0.02%) - Testo barra status flight

### 3. 🎭 **PERSONAGGI**
Gestione visualizzazione e stato dei personaggi:

- **SHOWCHAR** (1.98%) - Mostra personaggio
- **HIDECHAR** (2.18%) - Nasconde personaggio
- **CHANGECHAR** (4.26%) - Cambia immagine personaggio
- **FOCUSCHAR** (0.01%) - Focus su personaggio
- **SHOWDLGSCENE** (1.11%) - Apre finestra dialogo
- **HIDEDLGSCENE** (1.52%) - Chiude finestra dialogo

### 4. 🔢 **VARIABILI**
Gestione variabili numeriche e operazioni:

- **SET_TO** (0.51%) - Imposta variabile
- **ADD** (0.37%) - Aggiunge a variabile

### 5. 🗺️ **MAPPA**
Comandi per gestione mappa, nodi e navigazione:

- **SHOWPATH** (1.22%) - Mostra rotta
- **HIDEPATH** (0.36%) - Nasconde rotta
- **HIDEALLPATHS** (0.05%) - Nasconde tutte le rotte
- **SHOWNODE** (0.56%) - Mostra nodo
- **HIDENODE** (0.01%) - Nasconde nodo
- **SHOWBUTTON** (0.46%) - Mostra bottone
- **HIDEBUTTON** (0.31%) - Nasconde bottone
- **CENTERMAPBYNODE** (0.24%) - Centra su nodo
- **CENTERMAPBYPATH** (0.09%) - Centra su rotta
- **MOVEPLAYERTONODE** (0.16%) - Sposta giocatore
- **SETFOCUS** (0.41%) - Focus su bottone
- **RESETFOCUS** (0.22%) - Rimuove focus
- **SETFOCUSIFCREDITS** (0.02%) - Focus condizionale
- **SETNODEKNOWN** (0.15%) - Marca nodo conosciuto
- **ADDNODE** (0.01%) - Aggiunge nodo dinamico

### 6. ⚔️ **MISSIONE**
Configurazione e gestione delle missioni:

- **ADDOPPONENT** (1.25%) - Aggiunge avversario
- **ADDOPPONENTSCREDITS** (0.02%) - Modifica crediti avversario
- **MODIFYOPPONENTSBUILDSPEED** (0.11%) - Velocità build
- **SETSHIPTYPE** (0.55%) - Tipo nave
- **SETDECKPREPARATIONSCRIPT** (0.55%) - Script deck
- **SETFLIGHTDECKPREPARATIONSCRIPT** (0.01%) - Script deck flight
- **SETADVPILE** (0.25%) - Pile avventura
- **SETSECRETADVPILE** (0.30%) - Pile segreta
- **ADDPARTTOSHIP** (0.54%) - Aggiunge parte nave
- **ADDPARTTOASIDESLOT** (0.41%) - Parte aside
- **SETSPECCONDITION** (0.21%) - Condizione speciale
- **ADDSHIPPARTS** (0.06%) - Parti da file
- **ACT_MISSION** (0.26%) - Attiva mission
- **SETTURNBASED** (0.07%) - Modalità turni
- **SETMISSIONASFAILED** (0.05%) - Mission fallita
- **SETMISSIONASCOMPLETED** (0.01%) - Mission completata
- **ALLSHIPSGIVEUP** (0.05%) - Arresa generale
- **GIVEUPFLIGHT** (0.01%) - Arrendi flight

### 7. 💰 **CREDITI**
Gestione economia e rewards:

- **ADDCREDITS** (0.18%) - Aggiunge crediti
- **SETCREDITS** (0.02%) - Imposta crediti
- **ADDMISSIONCREDITS** (0.33%) - Crediti mission
- **ADDMISSIONCREDITSBYRESULT** (0.04%) - Crediti da risultato
- **SUBOPPONENTCREDITSBYRESULT** (0.03%) - Sottrae crediti

### 8. 🏆 **ACHIEVEMENT**
Gestione achievements e sblocchi:

- **SETACHIEVEMENTPROGRESS** (0.16%) - Progress achievement
- **SETACHIEVEMENTATTEMPT** (0.08%) - Attempt achievement
- **UNLOCKACHIEVEMENT** (0.13%) - Sblocca achievement
- **UNLOCKSHIPPLAN** (0.12%) - Sblocca piano nave
- **UNLOCKSHUTTLES** (0.05%) - Sblocca shuttle

### 9. ℹ️ **TUTORIAL**
Help e informazioni:

- **ADDINFOWINDOW** (0.34%) - Aggiunge info
- **SHOWINFOWINDOW** (0.18%) - Mostra info
- **BUILDINGHELPSCRIPT** (0.14%) - Help build
- **FLIGHTHELPSCRIPT** (0.02%) - Help flight
- **ALIENHELPSCRIPT** (0.01%) - Help alieni
- **SHOWHELPIMAGE** (0.01%) - Mostra immagine help

### 10. 💾 **SISTEMA**
Comandi di sistema e salvataggio:

- **SAVESTATE** (0.01%) - Salva stato
- **LOADSTATE** (0.01%) - Carica stato
- **QUITCAMPAIGN** (0.01%) - Esci campagna
- **EXIT_MENU** (2.22%) - Esci da menu

## Blocchi Container (sempre visibili come categoria separata)

### 📦 **CONTENITORI**
- **IF** - Blocco condizionale base
- **MENU** - Menu di scelte
- **OPT** - Opzione menu
- **SCRIPT** - Contenitore script
- **MISSION** - Contenitore mission
- **BUILD** - Fase costruzione
- **FLIGHT** - Fase volo

## Icone Proposte

### Generale
- SAY: 💬 (fumetto dialogo)
- DELAY: ⏱️ (timer)
- SET/RESET: 🔀 (switch on/off)
- GO/LABEL: 🏷️ (etichetta)
- SUB_SCRIPT: 📄 (documento)
- RETURN: ↩️ (ritorno)

### Dialogo
- ASK: ❓ (punto interrogativo)
- ANNOUNCE: 📢 (megafono)

### Personaggi
- SHOWCHAR: 👤 (silhouette)
- HIDECHAR: 👻 (fantasma)
- CHANGECHAR: 🎭 (maschere)
- SHOWDLGSCENE: 🗨️ (finestra dialogo)

### Variabili
- SET_TO: 🔢 (numeri)
- ADD: ➕ (più)

### Mappa
- SHOWPATH: 🛤️ (percorso)
- SHOWNODE: 📍 (pin)
- SHOWBUTTON: 🔘 (bottone)
- CENTERMAPBYNODE: 🎯 (bersaglio)

### Missione
- ADDOPPONENT: ⚔️ (spade incrociate)
- SETSHIPTYPE: 🚀 (razzo)
- SETDECKPREPARATIONSCRIPT: 🃏 (carte)

### Crediti
- ADDCREDITS: 💰 (sacco denaro)

### Achievement
- UNLOCKACHIEVEMENT: 🏆 (trofeo)

### Tutorial
- SHOWINFOWINDOW: ℹ️ (info)
- BUILDINGHELPSCRIPT: 🔧 (chiave inglese)

### Sistema
- SAVESTATE: 💾 (floppy)
- QUITCAMPAIGN: 🚪 (porta)

### Container
- IF: 🔀 (diramazione)
- MENU: 📋 (lista)
- OPT: ☑️ (checkbox)
- SCRIPT: 📜 (pergamena)
- MISSION: 🎯 (missione)
- BUILD: 🔨 (martello)
- FLIGHT: ✈️ (aereo)

## Implementazione Proposta

1. **Menu sempre visibile**: Categoria GENERALE con i comandi più usati
2. **Categorie collassabili**: Click per aprire/chiudere sottocategorie
3. **Tooltip al mouseover**: Nome completo del comando
4. **Drag & Drop**: Ogni icona trascinabile
5. **Colori**: 
   - Comandi implementati: Colorati secondo categoria
   - Comandi non implementati: Grigi/disabilitati
6. **Ricerca rapida**: Campo di ricerca per filtrare comandi
7. **Indicatore frequenza**: Piccolo badge con percentuale d'uso

## Priorità Implementazione

### FASE 1 (Già implementati)
- Blocchi container base (IF, MENU, OPT, SCRIPT, MISSION, BUILD, FLIGHT)
- Comandi base (SAY, DELAY, SET, RESET, SHOWCHAR, HIDECHAR, etc.)

### FASE 2 (Da implementare)
- Comandi dialogo avanzati (SAYCHAR, ASKCHAR, ANNOUNCE)
- Gestione variabili (SET_TO, ADD)
- Comandi mappa base (SHOWPATH, SHOWNODE, etc.)

### FASE 3 (Futura)
- Comandi missione avanzati
- Sistema achievement
- Comandi tutorial
- Comandi sistema
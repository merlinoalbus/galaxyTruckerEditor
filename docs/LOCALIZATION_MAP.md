# GALAXY TRUCKER - MAPPA COMPLETA LOCALIZZAZIONE

## LINGUE SUPPORTATE
- **EN** - Inglese
- **CS** - Ceco
- **DE** - Tedesco
- **ES** - Spagnolo
- **FR** - Francese
- **PL** - Polacco
- **RU** - Russo
- **RO** - Rumeno (solo parziale in alcuni file)

## STRUTTURA FILE DI LOCALIZZAZIONE

### 1. STRINGHE PRINCIPALI DI GIOCO
**Percorso:** `gamefolder/localization_strings/`

#### File di testo del gioco (uno per lingua):
- `game_strings_[LANG].yaml` - Stringhe generali UI e menu
- `build_strings_[LANG].yaml` - Stringhe fase costruzione nave
- `flight_strings_[LANG].yaml` - Stringhe fase di volo
- `lobby_strings_[LANG].yaml` - Stringhe lobby multiplayer
- `tutorial_strings_[LANG].yaml` - Stringhe tutorial
- `achievements_strings_[LANG].yaml` - Nomi e descrizioni achievement
- `ai_strings_[LANG].yaml` - Nomi e descrizioni personaggi AI
- `alientechnologies_strings_[LANG].yaml` - Stringhe modalità Alien Technologies
- `chat_strings_[LANG].yaml` - Stringhe sistema chat
- `gameselect_strings_[LANG].yaml` - Stringhe selezione partita
- `hints_strings_[LANG].yaml` - Suggerimenti e hint
- `multiplayermissions_strings_[LANG].yaml` - Descrizioni missioni multiplayer
- `onlinehelp_strings_[LANG].yaml` - Aiuto online
- `overlay_strings_[LANG].yaml` - Overlay di gioco
- `pausemenu_strings_[LANG].yaml` - Menu pausa

#### Crediti (sottocartella):
**Percorso:** `gamefolder/localization_strings/credits/`
- `credits_[LANG].yaml` - Testi dei crediti

### 2. CAMPAGNA SINGLE PLAYER
**Percorso:** `gamefolder/campaign/`

#### Cartelle per lingua:
- `campaignScriptsEN/`
- `campaignScriptsCS/`
- `campaignScriptsDE/`
- `campaignScriptsES/`
- `campaignScriptsFR/`
- `campaignScriptsPL/`
- `campaignScriptsRU/`

#### Contenuto di ogni cartella lingua:
- `nodes.yaml` - Nomi e descrizioni dei nodi della mappa campagna
- `missions.yaml` - Nomi e descrizioni delle missioni campagna
- File `.txt` numerati - Script dei dialoghi della campagna

### 3. MISSIONI MULTIPLAYER
**Percorso:** `gamefolder/multiplayermissions/`

File YAML con campo `name:` che referenzia stringhe localizzate in `multiplayermissions_strings_[LANG].yaml`

### 4. IMMAGINI LOCALIZZATE

#### Bandiere lingue:
- `gamefolder/common/flags/[LANG].png`
- `gamefolder/sd/common/flags/[LANG].png`

#### Logo azienda:
- `gamefolder/videos/company_logo_[LANG].png`
- `gamefolder/sd/videos/company_logo_[LANG].png`

#### Tutorial:
- `gamefolder/tutorial/infoGivingUpFlightImg1[LANG].png`
- `gamefolder/sd/tutorial/infoGivingUpFlightImg1[LANG].png`

### 5. FONT DI GIOCO
**Percorso:** `gamefolder/fonts/`

#### Font TrueType:
- `Roboto-Italic.ttf`
- `Roboto_Medium.ttf`

#### Font Bitmap (con texture associate):
- `amorpheus.fnt` + `amorpheus.png`
- `roboto.fnt` + `roboto.png`
- `roboto_italic.fnt` + `roboto_italic.png`  
- `roboto_italic_shadow.fnt` + `roboto_italic_shadow.png`
- `roboto_shadow.fnt` + `roboto_shadow.png`

## STRUTTURA PER CREARE UNA PATCH LINGUISTICA

Per aggiungere una nuova lingua (es. IT - Italiano) bisogna:

### 1. Copiare e tradurre tutti i file di stringhe:
- Creare copia di tutti i file `*_EN.yaml` rinominandoli in `*_IT.yaml`
- Tradurre il contenuto mantenendo le chiavi YAML invariate

### 2. Creare la cartella campagna:
- Creare `gamefolder/campaign/campaignScriptsIT/`
- Copiare e tradurre `nodes.yaml`, `missions.yaml` e tutti i file `.txt`

### 3. Localizzare le immagini:
- Creare versioni `_IT` delle immagini con testo
- Aggiungere bandiera `IT.png` nelle cartelle flags

### 4. File da NON modificare:
- Font (usano caratteri latini standard)
- File di configurazione `.yaml` che non contengono testo visibile
- Immagini senza testo

### 5. Sostituire una lingua esistente:
Per sostituire una lingua esistente (es. sostituire RO con IT):
- Rinominare tutti i file `*_IT.yaml` in `*_RO.yaml`
- Rinominare la cartella `campaignScriptsIT` in `campaignScriptsRO`
- Rinominare le immagini `*_IT.*` in `*_RO.*`

## NOTE TECNICHE
- Formato stringhe: YAML con struttura `chiave: "valore"`
- Encoding: UTF-8
- Variabili nel testo: `[v(variabile)]` o `%variable%`
- Caratteri speciali: escape con backslash `\`
- A capo: `\n`

## DIMENSIONI APPROSSIMATIVE
- File di stringhe: ~50-200 KB ciascuno
- Immagini localizzate: ~10-100 KB ciascuna
- Totale per lingua: ~2-5 MB
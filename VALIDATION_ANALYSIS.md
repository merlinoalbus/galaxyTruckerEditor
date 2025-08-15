# Analisi Sistema di Validazione - Galaxy Trucker Editor

## Classificazione Attuale delle Validazioni

### 🔴 ERRORI (Bloccanti - impediscono il salvataggio)

#### 1. **Parametri Mancanti**
- `DELAY_NO_DURATION` - Il blocco DELAY non ha durata specificata
- `SAY_NO_TEXT` - Il blocco SAY non ha testo
- `ASK_NO_TEXT` - Il blocco ASK non ha testo  
- `GO_NO_LABEL` - Il blocco GO non ha label di destinazione
- `LABEL_NO_NAME` - Il blocco LABEL non ha nome
- `SUB_SCRIPT_NO_NAME` - Il blocco SUB_SCRIPT non ha script specificato
- `OPT_NO_TEXT` - Il blocco OPT non ha testo
- `SHOWCHAR_NO_CHARACTER` - SHOWCHAR non specifica quale personaggio mostrare
- `SHOWCHAR_NO_POSITION` - SHOWCHAR non specifica la posizione
- `HIDECHAR_NO_CHARACTER` - HIDECHAR non specifica quale personaggio nascondere

#### 2. **Errori di Struttura Grave**
- `GO_WITHOUT_LABEL` - GO usato senza nessun LABEL nello script
- `MENU_WITHOUT_OPT` - MENU completamente vuoto (nessun OPT)
- `MENU_NO_SIMPLE_OPT` - MENU senza almeno un OPT semplice (non condizionale)
- `NON_OPT_IN_MENU` - Blocchi non-OPT inseriti in MENU
- `IF_EMPTY_THEN` - IF con ramo THEN vuoto
#### 3. **Posizionamento Blocchi**
- `OPT_OUTSIDE_MENU` - OPT fuori da MENU
- `EXIT_MENU_OUTSIDE_OPT` - EXIT_MENU fuori da OPT

### 🟡 WARNING (Non bloccanti - permettono il salvataggio)

#### 1. **Regole di Sequenza**
- `CONSECUTIVE_ASK` - Due blocchi ASK consecutivi
- `ASK_NOT_FOLLOWED_BY_MENU` - ASK non seguito da MENU
- `ASK_WITHOUT_MENU` - ASK come ultimo blocco senza MENU
- `MENU_WITHOUT_ASK` - MENU non preceduto da ASK
- `BUILD_CONTAINS_BUILD` - BUILD dentro BUILD
- `BUILD_CONTAINS_FLIGHT` - FLIGHT dentro BUILD
- `FLIGHT_CONTAINS_BUILD` - BUILD dentro FLIGHT
- `FLIGHT_CONTAINS_FLIGHT` - FLIGHT dentro FLIGHT
- `SHOWCHAR_NO_SCENE` - SHOWCHAR senza scena attiva
- `HIDECHAR_NO_SCENE` - HIDECHAR senza scena attiva
- `HIDECHAR_NO_VISIBLE_CHARACTERS` - HIDECHAR senza personaggi visibili
- `HIDECHAR_CHARACTER_NOT_VISIBLE` - Tentativo di nascondere personaggio non visibile
- `SAY_NO_SCENE` - SAY fuori da scena di dialogo
- `ASK_NO_SCENE` - ASK fuori da scena di dialogo
- `DIALOG_OUTSIDE_SCENE` - Blocchi dialogo fuori da scena
- `CHARACTER_OUTSIDE_SCENE` - Operazioni personaggi fuori da scena
- `HIDE_SCENE_WITHOUT_SHOW` - HIDEDLGSCENE senza SHOWDLGSCENE precedente
- `ASK_IF_INVALID_THEN` - Dopo ASK, ramo THEN di IF non inizia con MENU/GO
- `ASK_IF_INVALID_ELSE` - Dopo ASK, ramo ELSE di IF non inizia con MENU/GO


## Logica di Classificazione

### Perché sono ERRORI:
- **Parametri mancanti**: Il comando non può essere eseguito senza i dati necessari
- **Struttura grave**: Rompe la logica fondamentale del gioco (es. GO senza destinazione)
- **Container vuoti**: Un MENU vuoto o IF senza THEN non ha senso logico

### Perché sono WARNING:
- **Regole di sequenza**: Sono best practice ma il gioco può funzionare
- **Annidamento**: Potrebbe causare comportamenti inaspettati ma non crash
- **Contesto scene**: Il gioco potrebbe gestire questi casi con fallback

## Modifiche Proposte

### Da riclassificare come ERROR?
- [ ] `ASK_NOT_FOLLOWED_BY_MENU` - ASK senza MENU potrebbe rompere il flow?
- [ ] `OPT_OUTSIDE_MENU` - OPT isolato non ha senso?

### Da riclassificare come WARNING?
- [ ] Alcuni parametri mancanti potrebbero avere valori default?

## Note per l'Implementazione

1. **Visualizzazione nella UI**:
   - Errors: Bordo rosso, icona ❌, blocca salvataggio
   - Warnings: Bordo arancione, icona ⚠️, permette salvataggio

2. **Toolbar**:
   - Pulsante rosso per errors (priorità alta)
   - Pulsante arancione per warnings (se non ci sono errors)
   - Tooltip con conteggio separato

3. **Modal di Validazione**:
   - Sezione separata per Errors e Warnings
   - Errors mostrati per primi
   - Possibilità di filtrare per tipo

## Domande da Risolvere

1. **SHOWCHAR/HIDECHAR senza scena** - Dovrebbero essere ERROR se il gioco non li gestisce?
2. **ASK consecutivi** - È davvero solo un warning o rompe la logica?
3. **MENU senza ASK precedente** - Il gioco lo gestisce o crasha?
4. **BUILD/FLIGHT annidati** - Causano problemi runtime o sono solo sconsigliati?

---

**IMPORTANTE**: Rivedere questa classificazione in base al comportamento effettivo del gioco Galaxy Trucker. Alcune validazioni potrebbero dover essere spostate tra ERROR e WARNING in base a come il motore di gioco gestisce questi casi.
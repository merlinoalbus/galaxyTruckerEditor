# Analisi Funzionale del Sistema di Metacodice
## Galaxy Trucker Campaign Scripts

---

## Executive Summary

Il sistema di metacodice negli script della campagna di Galaxy Trucker utilizza un meccanismo di sostituzione dinamica del testo basato su pattern racchiusi tra parentesi quadre `[]`. Questo sistema permette di personalizzare i dialoghi e le interfacce in base a:
- **Genere del giocatore** (maschile/femminile/neutro)
- **Piattaforma di gioco** (mobile/desktop)
- **Dati dinamici del giocatore** (nome, risultati missione)

---

## 1. Architettura del Sistema

### 1.1 Sintassi Base
```
[tipo(opzione1|opzione2|...)]
```

### 1.2 Tipi di Metacodice Identificati

| Tipo | Prefisso | Descrizione | Occorrenze |
|------|----------|-------------|------------|
| Gender | `[g(...)]` | Adattamento di genere | 46 varianti |
| Verb/Action | `[v(...)]` | Adattamento piattaforma | 5 varianti |
| Player Name | `[NAME]` | Nome giocatore | 10 usi |
| Mission Result | `[missionResult]` | Risultato missione | 4 usi |

---

## 2. Sistema di Adattamento di Genere `[g(...)]`

### 2.1 Scopo Funzionale
Permette di adattare automaticamente il testo del dialogo in base al genere del personaggio giocatore, garantendo una narrazione coerente e personalizzata.

### 2.2 Categorie di Utilizzo

#### 2.2.1 Pronomi Personali
```
[g(He|She)]       - Soggetto
[g(him|her)]      - Oggetto
[g(his|her)]      - Possessivo
[g(He|She|It)]    - Include forma neutra
```

#### 2.2.2 Titoli Formali
```
[g(Sir|Madam)]    - Molto formale
[g(sir|madam)]    - Formale standard
[g(sir|miss)]     - Formale giovane
[g(Mr.|Miss)]     - Prefisso nome
[g(sir|ma'am)]    - Militare/rispettoso
```

#### 2.2.3 Appellativi Informali
```
[g(buddy|lady)]   - Amichevole
[g(guy|gal)]      - Colloquiale
[g(lad|lass)]     - Tradizionale
[g(laddie|lassie)] - Scozzese/marinaresco
[g(fella|lady)]   - Casual
```

#### 2.2.4 Termini Professionali
```
[g(gentleman|trucker)]  - Ruolo sociale
[g(man|trucker)]        - Professione
[g(fly boy|girl)]       - Pilota
[g(modern-day Nelson|female Nelson)] - Riferimento storico
```

#### 2.2.5 Oggetti Personali
```
[g(wallet|pocketbook)]  - Portafoglio
```

### 2.3 Esempi di Implementazione
```
SAY "This [g(gentleman|lady)] will accompany you home."
ASK "Ha, [g(Mr.|Miss)] I-Know-Everything! Changed your mind?"
OPT_IFNOT hasEnoughForDebt "Oh. I ... seem to have left my [g(wallet|pocketbook)] back on my ship."
```

---

## 3. Sistema di Adattamento Piattaforma `[v(...)]`

### 3.1 Scopo Funzionale
Adatta i verbi d'azione in base alla piattaforma di gioco (touch screen vs mouse).

### 3.2 Pattern Identificati
```
[v(tap|click)]    - minuscolo
[v(Tap|Click)]    - Maiuscolo iniziale
[v(tapp|click)]   - Variante ortografica
```

### 3.3 Contesti di Utilizzo
- **Tutorial:** Istruzioni per l'interfaccia utente
- **Barre di stato:** Indicazioni operative
- **Dialoghi di aiuto:** Spiegazioni meccaniche di gioco

### 3.4 Esempio
```
SAY "Great. Now just [v(tap|click)] on that pulsing rocket, and you can go."
SetFlightStatusBar "[v(Tap|Click)] the button to say you understand."
```

---

## 4. Sistema di Personalizzazione `[NAME]`

### 4.1 Scopo Funzionale
Inserisce dinamicamente il nome del giocatore nei dialoghi per aumentare l'immersione.

### 4.2 Contesti di Utilizzo
- **Presentazioni:** "You must be [NAME]"
- **Chiamate dirette:** "Hey [NAME]!"
- **Riferimenti in terza persona:** "Tell [NAME] that..."

### 4.3 Esempio
```
ASK "Ah! You must be [NAME]. Welcome to the headquarters of Club Gold."
OPT "I am [NAME]. And you?"
```

---

## 5. Sistema di Dati Dinamici `[missionResult]`

### 5.1 Scopo Funzionale
Visualizza risultati numerici delle missioni (crediti guadagnati).

### 5.2 Implementazione
```
SAY "Here is your share: [missionResult] credits."
SAY "Here are [missionResult] credits. Thank you very much."
```

---

## 6. Distribuzione nei File di Script

| File | Pattern Unici | Focus Principale |
|------|---------------|------------------|
| scripts3.txt | 23 | Dialoghi complessi con molte varianti di genere |
| scripts1.txt | 11 | Tutorial e introduzione |
| tutorials.txt | 9 | Istruzioni piattaforma-specifiche |
| scripts5.txt | 9 | Dialoghi avanzati |
| scripts2.txt | 8 | Interazioni sociali |
| ms_scripts.txt | 8 | Missioni speciali |
| missions.txt | 2 | Risultati missione |

---

## 7. Raccomandazioni per l'Implementazione nell'Editor

### 7.1 Validazione
- **Pattern di genere:** Verificare che abbiano esattamente 2 opzioni separate da `|`
- **Pattern di verbo:** Verificare coerenza maiuscole/minuscole
- **[NAME]:** Non richiede parametri
- **[missionResult]:** Verificare che sia in contesto appropriato

### 7.2 Preview nell'Editor
Suggerimento di implementare una modalità preview che mostri:
- Versione maschile/femminile del testo
- Versione mobile/desktop
- Placeholder per [NAME] e [missionResult]

### 7.3 Autocompletamento
Implementare suggerimenti per i pattern più comuni:
```javascript
const commonPatterns = {
  formal: "[g(sir|madam)]",
  informal: "[g(buddy|lady)]",
  pronoun: "[g(he|she)]",
  action: "[v(tap|click)]",
  name: "[NAME]",
  result: "[missionResult]"
};
```

### 7.4 Controlli di Coerenza
- Verificare che tutti i file di lingua abbiano gli stessi pattern
- Segnalare pattern non standard o typo comuni
- Controllare bilanciamento parentesi quadre

---

## 8. Considerazioni Tecniche

### 8.1 Parser Requirements
Il parser del motore di gioco deve:
1. Identificare pattern `[...]`
2. Estrarre il tipo (g/v/NAME/missionResult)
3. Per g/v: separare opzioni con `|`
4. Sostituire con valore appropriato basato su:
   - Stato giocatore (genere)
   - Piattaforma (mobile/desktop)
   - Dati sessione (nome, risultati)

### 8.2 Performance
- Cache delle sostituzioni frequenti
- Pre-processing dei dialoghi all'avvio missione
- Lazy loading per dialoghi opzionali

---

## 9. Estensibilità Futura

### 9.1 Nuovi Tipi Proposti
- `[p(singular|plural)]` - Pluralizzazione
- `[t(morning|afternoon|evening)]` - Tempo di gioco
- `[r(low|medium|high)]` - Reputazione giocatore
- `[l(easy|normal|hard)]` - Livello difficoltà

### 9.2 Localizzazione Avanzata
- Supporto per lingue con più di 2 generi
- Adattamenti culturali specifici
- Varianti regionali

---

## Appendice A: Lista Completa Pattern

### Pattern di Genere (46 varianti)
```
[g(, pal|, sister)]
[g(a pal|cute)]
[g(buddy|lady)]
[g(fella|lady)]
[g(fine sir|dear madam)]
[g(fly boy|girl)]
[g(gentleman|lady)]
[g(gentleman|trucker)]
[g(guy|gal)]
[g(He|She)]
[g(He|She|It)]
[g(him|her)]
[g(his|her)]
[g(lad|lass)]
[g(laddie|lassie)]
[g(man|trucker)]
[g(man|woman)]
[g(modern-day Nelson|female Nelson)]
[g(Mr.|Miss)]
[g(my friend|my dear)]
[g(my good man|madam)]
[g(pal|sister)]
[g(sir|ma'am)]
[g(sir|madam)]
[g(Sir|Madam)]
[g(sir|miss)]
[g(wallet|pocketbook)]
[g(, sir.|.)]
```

### Pattern di Azione (5 varianti)
```
[v(tap|click)]
[v(Tap|Click)]
[v(tapp|click)]
[v(Tapp|Click)]
```

### Pattern Speciali (2 varianti)
```
[NAME]
[missionResult]
```

---

**Documento creato:** Gennaio 2025  
**Versione:** 1.0  
**Autore:** Sistema di Analisi Automatica
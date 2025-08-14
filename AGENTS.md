# Agent Specializzati per Galaxy Trucker Editor

## 1. 🎮 Campaign Script Agent
**Specializzazione**: Gestione e modifica script di campagna

**Competenze**:
- Parsing e validazione sintassi comandi (TEXT, MENU, OPT, IF, GO, etc.)
- Gestione blocchi annidati e strutture condizionali
- Validazione riferimenti (labels, missioni, script)
- Ottimizzazione performance per script di grandi dimensioni

**Quando usarlo**:
- Creazione nuovi script campagna
- Debug errori di parsing
- Refactoring script esistenti
- Implementazione nuovi comandi

---

## 2. 🌍 Localization Agent
**Specializzazione**: Sistema multilingua e traduzioni

**Competenze**:
- Gestione file `localization_strings/*_strings_*.yaml`
- Sincronizzazione traduzioni tra 7 lingue
- Validazione metacodici multilingua
- Controllo completezza traduzioni

**Quando usarlo**:
- Aggiunta nuove stringhe localizzate
- Verifica copertura linguistica
- Sincronizzazione traduzioni mancanti
- Implementazione nuovi metacodici

---

## 3. 🔧 Visual Flow Agent
**Specializzazione**: Visual Flow Editor e drag-and-drop

**Competenze**:
- Gestione blocchi drag-and-drop
- Validazione struttura flussi visuali
- Ottimizzazione rendering React
- Gestione stato complesso con hooks

**Quando usarlo**:
- Aggiunta nuovi tipi di blocchi
- Debug problemi drag-and-drop
- Ottimizzazione performance editor
- Implementazione nuove funzionalità visuali

---

## 4. 🔌 API Integration Agent
**Specializzazione**: Backend Express e API REST

**Competenze**:
- Endpoint RESTful design
- Validazione con jsonschema
- Gestione file system sicura
- Ottimizzazione query e caching

**Quando usarlo**:
- Creazione nuovi endpoint API
- Refactoring servizi backend
- Implementazione middleware
- Ottimizzazione performance server

---

## 5. 🎨 UI/UX Agent
**Specializzazione**: Interfaccia utente e esperienza

**Competenze**:
- Tailwind CSS e tema Galaxy Trucker
- Componenti React riutilizzabili
- Animazioni e transizioni
- Responsive design

**Quando usarlo**:
- Redesign componenti UI
- Implementazione nuove animazioni
- Ottimizzazione UX
- Accessibilità e usabilità

---

## 6. 📊 Analytics Agent
**Specializzazione**: Metriche e analisi codice

**Competenze**:
- Analisi complessità script
- Metriche di qualità codice
- Performance monitoring
- Generazione report

**Quando usarlo**:
- Analisi performance applicazione
- Identificazione bottleneck
- Generazione dashboard metriche
- Ottimizzazione query complesse

---

## 7. 🧪 Testing Agent
**Specializzazione**: Test e validazione

**Competenze**:
- Unit test con Jest
- Test integrazione API
- Validazione script campagna
- Test drag-and-drop UI

**Quando usarlo**:
- Scrittura nuovi test
- Debug test falliti
- Copertura codice
- Test regression

---

## 8. 🔄 Migration Agent
**Specializzazione**: Migrazioni e refactoring

**Competenze**:
- Refactoring sicuro codice legacy
- Migrazione strutture dati
- Aggiornamento dipendenze
- Conversione formati file

**Quando usarlo**:
- Aggiornamento major dependencies
- Refactoring architetturale
- Migrazione dati
- Modernizzazione codebase

---

## 9. 🛡️ Security Agent
**Specializzazione**: Sicurezza e validazione

**Competenze**:
- Sanitizzazione input utente
- Validazione percorsi file
- Gestione permessi
- Audit sicurezza

**Quando usarlo**:
- Review sicurezza codice
- Implementazione validazioni
- Gestione autenticazione
- Audit vulnerabilità

---

## 10. 📝 Documentation Agent
**Specializzazione**: Documentazione e guide

**Competenze**:
- Generazione documentazione API
- Guide utente
- Documentazione tecnica
- Changelog e release notes

**Quando usarlo**:
- Aggiornamento README
- Documentazione nuove feature
- Guide sviluppatore
- Release notes

---

## Come Utilizzare gli Agent

### Attivazione Singola
```
"Ho bisogno di aggiungere un nuovo comando WAIT al Visual Flow Editor"
→ Usa: Visual Flow Agent
```

### Attivazione Multipla
```
"Devo implementare una nuova feature per esportare script in formato JSON con traduzioni"
→ Usa: Campaign Script Agent + Localization Agent + API Integration Agent
```

### Workflow Consigliato

1. **Analisi**: Analytics Agent per capire l'impatto
2. **Implementazione**: Agent specializzato per dominio
3. **Testing**: Testing Agent per validazione
4. **Documentazione**: Documentation Agent per aggiornare guide

---

## Prompt Template per Agent

### Per attivare un agent specifico:
```
Come [NOME_AGENT], analizza e implementa [DESCRIZIONE_TASK] considerando:
- Le convenzioni del progetto in CLAUDE.md
- La struttura modulare esistente
- Le best practice per [DOMINIO_AGENT]
```

### Esempio pratico:
```
Come Visual Flow Agent, implementa un nuovo blocco LOOP per il Visual Flow Editor che:
- Supporti iterazioni con contatore
- Sia compatibile con drag-and-drop
- Validi i parametri in real-time
- Mantenga la struttura modulare esistente
```

---

## Note per l'Utilizzo

- **Specializzazione**: Ogni agent ha competenze specifiche, usali per task mirati
- **Collaborazione**: Gli agent possono lavorare insieme per task complessi
- **Context**: Fornisci sempre contesto specifico del dominio
- **Validazione**: Usa sempre Testing Agent dopo modifiche importanti
- **Documentazione**: Aggiorna sempre la documentazione con Documentation Agent
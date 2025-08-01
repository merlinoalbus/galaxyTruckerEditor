# Galaxy Trucker Editor

Un editor visuale completo per modificare missioni, script e configurazioni di Galaxy Trucker.

## Caratteristiche

- 🎮 **Editor Missioni**: Interfaccia grafica per creare e modificare missioni multiplayer
- 📜 **Script Mazzi**: Gestione visuale degli script per i mazzi di carte avventura
- ⚙️ **Componenti**: Editor per i componenti delle navi
- 🌍 **Localizzazione**: Gestione delle traduzioni in multiple lingue
- 🔍 **Validazione**: Sistema di controllo errori in tempo reale
- 📤 **Import/Export**: Supporto completo per file YAML
- 🐳 **Docker Ready**: Facilmente deployabile con Docker

## Tecnologie Utilizzate

- **React 18** con TypeScript
- **Tailwind CSS** per lo styling
- **Monaco Editor** per l'editing del codice
- **js-yaml** per parsing/serializzazione YAML
- **React Router** per la navigazione
- **Lucide React** per le icone

## Installazione e Avvio

### Sviluppo Locale

```bash
# Installa le dipendenze
npm install

# Avvia in modalità sviluppo
npm start

# Build di produzione
npm run build
```

### Docker

```bash
# Build dell'immagine
docker build -t galaxy-trucker-editor .

# Avvio con docker-compose (raccomandato)
docker-compose up -d

# Avvio manuale
docker run -p 3000:3000 -v "$(pwd)/../:/app/game-data" galaxy-trucker-editor
```

L'applicazione sarà disponibile su `http://localhost:3000`

## Struttura del Progetto

```
supportappgtedit/
├── public/                 # File statici
├── src/
│   ├── components/         # Componenti React
│   │   ├── Dashboard/      # Dashboard principale
│   │   ├── Editors/        # Editor per missioni, script, etc.
│   │   ├── FileManager/    # Gestione file
│   │   └── Layout/         # Header, Sidebar, etc.
│   ├── contexts/          # Context API per state management
│   ├── types/             # Definizioni TypeScript
│   ├── utils/             # Utility e parser
│   └── App.tsx            # Componente principale
├── Dockerfile             # Configurazione Docker
├── docker-compose.yml     # Orchestrazione Docker
└── package.json           # Dipendenze e script
```

## Funzionalità Principali

### Editor Missioni

- **Informazioni Base**: Nome, ID, descrizione, modalità di gioco
- **Voli e Navi**: Configurazione voli disponibili e tipi di navi
- **Regole**: Sistema di punteggio personalizzabile per flight
- **Carte**: Gestione script mazzi e carte avventura
- **Preview YAML**: Anteprima e modifica diretta del codice

### Supporto Metacodici

L'editor riconosce e gestisce i metacodici utilizzati nel gioco:
- `[player]` - Nome del giocatore
- `[credits]` - Crediti attuali
- `[flight]` - Numero del volo
- `[ship]` - Tipo di nave
- `[cargo]` - Cargo trasportato
- `[crew]` - Membri dell'equipaggio
- `[day]` - Giorno di gioco
- `[turn]` - Turno attuale

### Validazione

Sistema di validazione completo che controlla:
- Campi obbligatori
- Valori validi per ogni campo
- Consistenza tra le configurazioni
- Sintassi YAML corretta

### Docker Support

L'applicazione è completamente containerizzata e può essere facilmente deployata:

- **Volume Mounting**: I dati del gioco sono montati come volume
- **Hot Reload**: Modifiche al codice riflesse immediatamente
- **Production Ready**: Configurazione ottimizzata per produzione

## File Supportati

- **Missioni**: `multiplayermissions/*.yaml`
- **Script Mazzi**: `customScripts/*.txt`
- **Componenti**: `parts/*.yaml`
- **Localizzazione**: `localization_strings/*_strings_*.yaml`
- **Configurazioni AI**: `aiConfigs/*.ai`

## Esempi di Utilizzo

### Creare una Nuova Missione

1. Vai alla sezione "Missioni"
2. Clicca "Crea Nuova Missione"
3. Compila i campi nelle varie tab
4. Salva e esporta in YAML

### Modificare uno Script Mazzo

1. Vai alla sezione "Script Mazzi"
2. Seleziona lo script da modificare
3. Usa l'interfaccia visuale per aggiungere/rimuovere comandi
4. Preview e salva le modifiche

### Validazione in Tempo Reale

L'editor valida automaticamente i dati mentre li inserisci:
- ✅ **Verde**: Tutto corretto
- ⚠️ **Giallo**: Avvertimenti
- ❌ **Rosso**: Errori che impediscono il salvataggio

## Contribuire

1. Fork del repository
2. Crea un branch per la feature (`git checkout -b feature/nuova-feature`)
3. Commit delle modifiche (`git commit -am 'Aggiunge nuova feature'`)
4. Push al branch (`git push origin feature/nuova-feature`)
5. Crea una Pull Request

## Licenza

Questo progetto è sotto licenza MIT. Vedi il file LICENSE per dettagli.

## Note Tecniche

### Compatibilità con Marmalade SDK

L'editor è progettato per essere completamente compatibile con la struttura file del Marmalade SDK utilizzato da Galaxy Trucker:

- Parsing accurato dei file YAML esistenti
- Preservazione di commenti e formattazione
- Supporto per tutte le configurazioni del gioco
- Validazione basata sulle regole effettive del gioco

### Performance

- Caricamento lazy dei componenti per prestazioni ottimali  
- Debouncing per validazione in tempo reale
- Caching intelligente dei dati
- Ottimizzazioni per grandi dataset

### Sicurezza

- Validazione input lato client e server
- Sanitizzazione dei dati YAML
- Protezione contro XSS
- Controlli di accesso ai file
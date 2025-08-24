# Galaxy Trucker Editor — Blueprint tecnica (Iterazione 1)

Scopo: creare una prima iterazione del report tecnico esteso che descriva architettura, componenti, data model, flussi di dati e punti critici per refactor.

## Sommario (proposta)
1. Executive summary
2. Architettura generale
3. Frontend: struttura componenti, hooks, types
4. Backend: struttura, parser, API
5. Data model: YAML, immagini, characters
6. Scene simulation & Visual Flow Editor
7. Deploy e Docker
8. Test e QA
9. Roadmap di refactor e technical debt
10. Appendici: file rilevanti, comandi utili

## 1) Executive summary (esteso)

Questo documento è la prima iterazione della blueprint tecnica per "Galaxy Trucker Editor" — un'applicazione React + TypeScript pensata come editor visuale per missioni, script e asset del gioco Galaxy Trucker.

Obiettivo del report
- Fornire una visione tecnica e operativa completa dell'applicazione: architettura, componenti critici, contratti dei dati, flussi operativi e dipendenze esterne.
- Identificare punti di rischio e technical debt prioritari per attività di refactor e hardening.
- Fornire una base documentale utilizzabile dal team per sviluppo, QA e deployment.

Stato attuale sintetico
- Codebase: frontend React 18 + TypeScript con utility per parsing YAML (js-yaml) e editor integrati (Monaco). Architettura a singola codebase con cartelle chiaramente separate per `components`, `hooks`, `services`, `utils`, `types`.
- Backend: presente in cartella `server/` con script minimi per parsing e fornitura di asset; non è il focus principale di questa iterazione ma verrà analizzato in seguito.
- Documentazione: numerosi documenti descrittivi in `docs/` e report esistenti in `reports/` che forniscono materiale prezioso per la generazione del blueprint.

Principali aree critiche identificate
1. Parser & metacodici: il supporto ai metacodici (token come [player], [credits], ecc.) è una parte centrale; la robustezza del parser nel gestire nesting complessi (IF, MENU, OPT) è fondamentale.
2. Visual Flow Editor: il codice che gestisce blocchi, loro identificatori unici, manipolazione e conversione JSON/YAML sembra contenere logiche complesse e hook monolitici (`useBlockManipulation`, `useScriptManagement`) che richiedono refactor per chiarezza e testabilità.
3. Scene simulation: `sceneSimulation.ts` è responsabile della simulazione visiva dei comandi SHOWCHAR/CHANGECHAR/SAY ecc.; la logica è delicata, deve essere chiaramente definita e coperta da test.
4. Gestione asset: il caricamento, caching e mapping tra immagini base e varianti personaggio devono essere centralizzati (es. `imagesViewService`, `imageCache`) per evitare duplicazioni e inconsistenze.
5. Testing: esistono test unitari ma manca una copertura E2E per i flussi dell'editor (apertura missione, modifica script, simulazione scena).

Raccomandazioni strategiche iniziali
- Priorità 1: Stabilizzare parser + creare una suite di test che includa casi di nesting complessi (IF, MENU, OPT) e roundtrip YAML->internal->YAML.
- Priorità 2: Refactor modulare dei hooks del Visual Flow Editor in servizi piccoli e testabili; trasformare logiche pure in helper senza side-effects globali.
- Priorità 3: Definire un contratto chiaro per `Character` e `Image` (immagine base vs varianti) e centralizzare la risoluzione delle immagini in un servizio con caching.
- Priorità 4: Copertura test automation per `sceneSimulation.ts` che includa tutti i comandi rilevanti (SHOWCHAR, CHANGECHAR, HIDECHAR, SAY, ASK, SAYCHAR, ASKCHAR) con scenari di before/after.

Deliverable attesi da questa iterazione
- Documento blueprint incrementale (questa e successive iterazioni) salvate in `/reports`.
- Elenco di ticket tecnici suggeriti (refactor, test, bugfix) con priorità e stima grossolana.
- Prima bozza di contratti API e data-model per personaggi/immagini/script.

## File analizzati (prima passata)
- `package.json`
- `README.md`
- `docs/METACODE_COMPLETE_ANALYSIS.md` (referenza)
- `docs/API_DOCUMENTATION.md` (referenza)
- `src/utils/CampaignEditor/VisualFlowEditor/sceneSimulation.ts`
- `src/utils/CampaignEditor/VisualFlowEditor/jsonConverter.ts`
- `src/utils/CampaignEditor/VisualFlowEditor/collectAllBlocks.ts`
- `src/utils/CampaignEditor/VisualFlowEditor/blockIdManager.ts`
- `src/utils/CampaignEditor/VisualFlowEditor/blockCleaner.ts`
- `src/components/CampaignEditor/VisualFlowEditor/VisualFlowEditor.tsx`
- `src/hooks/CampaignEditor/VisualFlowEditor/useScriptManagement.ts`
- `src/hooks/CampaignEditor/VisualFlowEditor/useBlockManipulation.ts`
- `docs/CATEGORIZZAZIONE_COMANDI.md`
- `reports/DECK_COMMANDS_AND_SHOWCHAR_ANALYSIS.md`

## Osservazioni iniziali e rischi
- Il progetto è principalmente frontend React + TypeScript. Alcuni moduli server esistono nella cartella `server/`.
- Punti critici: parser degli script, gestione degli asset (immagini), simulazione scene (sceneSimulation.ts), e hook monolitici nel visual flow.
- Mancano test end-to-end completi per il flusso editor visuale.

## Azioni proposte per la prossima iterazione
- Espandere ogni sezione del sommario in sottosezioni tecniche dettagliate.
- Eseguire lettura approfondita dei file elencati e generare diagrammi (architettura, sequence, component boundaries).
- Aggiungere esempi di JSON/YAML e contratti API.

## 2) Architettura generale (dettagliata)

Obiettivo: descrivere l'architettura a più livelli dell'applicazione, i confini tra componenti, i principali servizi e i contratti dati principali.

2.1 Panorama ad alto livello
- Frontend (Single Page Application): React 18 + TypeScript, bundle gestito da CRACO/React Scripts. Utilizza Tailwind CSS per lo styling e Monaco Editor per editing testo. Il FE è responsabile di rendering dell'editor visuale, simulazione lato cliente e interfacce utente per import/export YAML.
- Backend (server/): Node.js minimale che espone API per accesso ai file game-data, parsing server-side e fornire asset (immagini, YAML). Non è strettamente richiesto per tutte le operazioni ma è usato per comodità in ambiente di sviluppo e per operazioni che richiedono I/O dal filesystem.
- Storage: game-data montato come volume (cartella `server/GAMEFOLDER`), include immagini, YAML e risorse. Le API del BE servono i file al FE in forma utile (spesso base64 per immagini o percorsi relativi).
- Build/Deployment: Dockerfile e docker-compose sono presenti per containerizzazione; pipeline CI consigliata: lint -> unit tests -> build -> image build -> deploy.

2.2 Frontend — suddivisione dei moduli
- Shell/Root
  - `App.tsx` + routing: definisce route per Dashboard, Campaign Editor, File Manager.
- Layout
  - Header, Sidebar, Notification system: servizi `headerService`, `sidebarService` per sincronizzazione globale.
- Campaign Editor
  - VisualFlowEditor: componente principale per editing visuale dei blocchi. Responsabilità: rendering canvas, gestione eventi drag&drop, apertura editor di blocco.
  - Components interni: BlockPalette, Canvas, BlockInspector, BlockToolbar.
  - Hooks critici:
    - `useScriptManagement`: orchestrazione import/export script, validazione, conversione JSON<->YAML.
    - `useBlockManipulation`: operazioni CRUD su blocchi, spostamento, copia/incolla, assegna ID unici.
  - Utils: `collectAllBlocks`, `jsonConverter`, `blockCleaner`, `blockIdManager`.
- Variables System
  - Gestione anagrafiche (characters, images, localization). Servizi in `src/services/CampaignEditor/VariablesSystem/*`.
- Simulazione scena
  - `sceneSimulation.ts`: motore che simula lo stato visivo della scena dato uno stream di blocchi. Dovrà essere stabilizzato e coperto da test mirati.

2.3 Backend — responsabilità e contratto API
- Ruolo: Accesso sicuro al filesystem game-data, parsing server-side, operazioni pesanti (es. conversioni batch), e endpoint per fornire immagini/asset.
- Endpoints principali (proposti dal codice esistente e docs):
  - GET /api/characters — lista characters + metadata (immaginebase, listaimmagini)
  - GET /api/scripts/:id — ritorna script JSON/YAML
  - POST /api/validate — valida uno script lato server
  - GET /api/image?path=... — ritorna immagine (binary/base64)
- Sicurezza: consentire accesso solo a path in whitelist; sanificare parametri; rate-limiting per API esposte.

2.4 Data model e contratti principali
- Character
  - { nomepersonaggio: string, immaginebase?: Image, listaimmagini?: Image[] }
- Image
  - { nomefile: string, percorso?: string, binary?: string }
- Flow Block (IFlowBlock)
  - Tipi: SHOWCHAR, CHANGECHAR, HIDECHAR, SAY, ASK, SAYCHAR, ASKCHAR, IF, MENU, OPT, SHOWDLGSCENE, HIDEDLGSCENE, etc.
  - Ogni block ha: id, type, parameters?, children/thenBlocks/elseBlocks?
- Scene Stack
  - Una pila di `SimulatedScene` (personaggi[], internalScene: boolean). `SimulatedSceneState` mantiene sceneStack, isInDialogScene, lastModifiedCharacter.

2.5 Pattern architetturali e boundary
- Keep UI pure: logiche pure (transformazioni sui blocchi, jsonConverter, sceneSimulation) devono essere isolate e testabili senza side-effect.
- Services: per I/O (imageCache, imagesViewService, campaignScriptParserService) fornire interfacce e wrapper per poter mockare in test.
- Single source of truth: mantenere la rappresentazione canonica dello script (es. JSON intermedio) e fare conversione verso/da YAML solo in punti definiti (import/export).

2.6 Osservazioni su performance e scalabilità
- Caricamento immagini: usare caching in `imageCache` per evitare re-fetching e conversioni ripetute.
- Virtualizzazione canvas: se il numero di blocchi può crescere molto, considerare virtualizzazione o raggruppamento per rendering del canvas.
- Debounce su validazione: evitare validazione sincrona ad ogni tasto; usare debouncing e cancellazione di richieste non più rilevanti.

2.7 Deployment e CI/CD (raccomandazioni)
- Pipeline minima proposta:
  - lint (eslint, typescript)
  - unit tests
  - build FE
  - build and push Docker image
  - deploy su environment staging/prod (docker-compose o orchestrator)
- Artifact: pubblicare immagine con tag semver e includere manifest change-log semplificato.

2.8 Prossimi artifact tecnici da generare
- Diagramma architetturale (SVG/PNG) con FE, BE, GameData volume, e flussi API.
- Sequence diagram per: open mission -> edit -> simulate scene -> save.
- Contract docs: OpenAPI-like per le API server.

## 3) Frontend — componenti, hooks e types (dettagli)

Obiettivo: dettagliare i componenti principali del frontend, i hook critici, le strutture TypeScript usate e le responsabilità di ogni modulo; indicare punti di refactor e test per rendere il FE manutenibile e testabile.

3.1 Mappa delle responsabilità
- UI Layer (Components): rendering, presentazione, interazione utente. Devono essere il più possibile "dumb" (ricevono props e emettono eventi).
- Domain Logic (Hooks/Services): regole di manipolazione blocchi, validazione, conversioni. Devono essere isolati e testabili.
- Persistence/IO (Services): chiamate API, filesystem access via backend, caching immagini.

3.2 Componenti chiave e responsabilità
- `VisualFlowEditor` (`src/components/CampaignEditor/VisualFlowEditor/VisualFlowEditor.tsx`)
  - Coordinate canvas, palette blocchi, toolbar di editing, pannello proprietà del blocco.
  - Non dovrebbe contenere logica di business: delegare a hook (`useBlockManipulation`, `useScriptManagement`).
  - Eventi emessi: onBlockAdd, onBlockDelete, onBlockMove, onBlockSelect, onSimulate.

- `BlockPalette`
  - Mostra i blocchi disponibili (categorie). Fornisce drag source per il canvas.

- `Canvas` / `BlockNode`
  - Rendering di singoli blocchi: props minime (block: IFlowBlock, isSelected: boolean, onClick: ()=>void).
  - Gestire solo rendering e animazioni; logica di snapping/drag dovrebbe essere in servizi di utilità.

- `BlockInspector` / `PropertiesPanel`
  - Mostra e modifica i parametri di un blocco. Modifiche scrivono tramite callback debounced al dominio (hook) e non direttamente nello store globale.

- `CharacterAvatar` / `ScenePreview`
  - Componenti usati per mostrare lo stato simulato della scena; ricevono `SimulatedSceneState` e renderizzano personaggi in base a `posizione` e `lastImmagine`.

3.3 Hook critici (da stabilizzare e testare)
- `useScriptManagement` (`src/hooks/CampaignEditor/VisualFlowEditor/useScriptManagement.ts`)
  - Responsabilità: import/export, validazione top-level, interazione con `jsonConverter` e `collectAllBlocks`.
  - Test consigliati: roundtrip YAML->JSON->YAML su script complessi; validazione messaggi di errore e warning.

- `useBlockManipulation` (`src/hooks/CampaignEditor/VisualFlowEditor/useBlockManipulation.ts`)
  - Responsabilità: aggiunta/rimozione/spostamento blocchi, assegnazione ID, clone, undo/redo (se presente).
  - Refactor suggerito: estrarre funzioni pure (es. insertBlockAt, removeBlockById) e mantenere state mutations in un reducer testabile.

- `useDialogSceneSimulation` (proposto)
  - Nuovo hook che incapsula `sceneSimulation.ts` e mappa i risultati su `CharacterAvatar` props.
  - Beneficio: separa la logica di simulazione dalla UI e permette mock facil per i test del componente.

3.4 Types e contratti TypeScript (punti di attenzione)
- Tipi principali:
  - `IFlowBlock` (`src/types/CampaignEditor/VisualFlowEditor/blocks.types.ts`): assicurarsi che `parameters` sia opzionale ma tipizzato correttamente per ogni `type`.
  - `SimulatedCharacter` / `SimulatedImage` (`src/utils/.../sceneSimulation.ts`): rendere i campi coerenti con `Character` (mappe dei nomi e dei percorsi).
  - `Character` (`src/types/CampaignEditor/VariablesSystem/VariablesSystem.types.ts`): chiarire `immaginebase` vs `listaimmagini`.

- Raccomandazione: usare discriminated unions per `IFlowBlock` in modo da avere `parameters` tipizzati in base a `type` (es. union di `ShowCharBlock`, `ChangeCharBlock`, etc.). Questo riduce i controlli runtime su `parameters` e rende il codice più robusto.

3.5 Flusso dati interno (esempio semplificato)
1. L'utente trascina un nuovo `SHOWCHAR` dal `BlockPalette` al `Canvas`.
2. `VisualFlowEditor` chiama `useBlockManipulation.insertBlock()` con i dati del blocco.
3. `useBlockManipulation` aggiorna lo stato locale (o global store) e assegna un ID unico usando `blockIdManager`.
4. `BlockInspector` permette di modificare i `parameters`; le modifiche vengono propagate via callback debounced a `useScriptManagement` per validazione e salvataggio draft.
5. Quando si clicca `Simulate`, il componente invoca `useDialogSceneSimulation.simulate(blocks)` che esegue `sceneSimulation` e ritorna `SimulatedSceneState`.

3.6 Refactor e miglioramenti immediati
- Convertire funzioni con side-effect dei hook in pure helpers e utilizzare `useReducer` per gestire mutazioni di struttura (più testabile, predicibile).
- Creare un layer di services (pure JS/TS modules) per operazioni complesse: `blockOperations`, `scriptIO`, `imageResolution`.
- Aggiungere types generici per il sistema di validazione delle `parameters` per ridurre runtime checks ripetuti.
- Separare la responsabilità di assegnare `lastModifiedCharacter` e la visualizzazione in header: un servizio `sceneStateManager` che espone API pure.

3.7 Test unitari e d'integrazione raccomandati
- Unit tests per:
  - `jsonConverter` (case edge di conversione e perdita di dati)
  - `blockCleaner` (garantire idempotenza)
  - `blockIdManager` (unicità e persistenza temporanea)
  - `sceneSimulation` (coprire SHOWCHAR/CHANGECHAR/HIDECHAR/SAY/SAYCHAR/ASKCHAR)
- Integration tests:
  - Roundtrip import/export script completo
  - Simulazione scena end-to-end: carica script -> simulate -> verifica avatar
- E2E (cypress/playwright): workflow utente: open mission -> edit block -> simulate -> save/export

3.8 Checklist di implementazione rapida (3-6 giorni stimati)
- [ ] Estrarre helpers puri da `useBlockManipulation` (1 giorno)
- [ ] Aggiungere discriminated unions per `IFlowBlock` (1 giorno)
- [ ] Scrivere 10 test unitari per `sceneSimulation` (1-2 giorni)
- [ ] Introdurre `useDialogSceneSimulation` wrapper e aggiornare `VisualFlowEditor` (1 giorno)

## 4) Backend — parser, API, I/O e affidabilità

Obiettivo: descrivere il ruolo del backend nella codebase, le responsabilità del parser lato server, i contratti API principali, i requisiti di sicurezza e le strategie di test/deploy.

4.1 Ruolo generale del backend
- Fornire accesso ai dati del gioco (file YAML, immagini, risorse) in modo controllato.
- Eseguire operazioni pesanti o sensibili (parsing complesso, conversioni batch, sanitizzazione dei file) che è preferibile tenere fuori dal client.
- Offrire endpoint di validazione, storage remoto e possibili servizi di trasformazione (es. compressione immagini, generazione di preview).

4.2 Architettura e struttura del codice
- Cartella `server/` contiene `server.js`, `package.json`, Dockerfile e `GAMEFOLDER` con i dati del gioco.
- Pattern proposto: separare in layer - routes, controllers, services, utils, parsers.
  - routes: definiscono l'API surface (es. `/api/characters`, `/api/scripts/:id`, `/api/validate`).
  - controllers: orchestrano input -> services -> response.
  - services: I/O e logica di alto livello (imageService, scriptService).
  - parsers: logica di parsing YAML/script, con test di regressione.

4.3 Parser e metacodici
- Il parser deve supportare metacodici e token personalizzati e produrre una rappresentazione intermedia robusta (JSON canonical) che il FE usa come single source of truth.
- Requisiti principali:
  - Gestire nesting IF/MENU/OPT correttamente, preservando l'ordine e i riferimenti ai blocchi.
  - Preservare meta-informazioni come commenti o label quando possibile (utilità per roundtrip fidelity).
  - Validare schema e riportare errori strutturati con posizione/contesto.
- Strategia di testing: test di regressione con corpus di script reali (sample YAML presenti nel repo). Per ogni script: parse -> serialize -> parse e confrontare strutture canonicizzate.

4.4 API contract proposti
- GET /api/characters
  - Response: [{ nomepersonaggio, immaginebase?: {nomefile,percorso}, listaimmagini?: [...] }]
- GET /api/scripts/:id
  - Response: { id, name, blocks: IFlowBlock[] }
- POST /api/validate
  - Body: { script: string | JSON }
  - Response: { valid: boolean, errors: [{path, message, severity}], warnings: [...] }
- GET /api/image?path=... (o /api/images/:id)
  - Response: binary stream o JSON { nomefile, mime, base64 }
- POST /api/convert
  - Body: { script: YAML }
  - Response: JSON canonical

4.5 Sicurezza e sanificazione
- Validare e normalizzare i path in input; rifiutare percorsi che escono dalla root `GAMEFOLDER`.
- Limitare dimensione dei payload (soprattutto immagini base64) e impostare limiti di timeout.
- Sanificare i contenuti YAML per prevenire attacchi tramite tag personalizzati o strutture eseguibili.
- Autenticazione/authorisation: se l'app viene esposta, integrare un livello di auth (token-based) per operazioni di scrittura.

4.6 Logging, monitoring e resilience
- Log strutturati per request/response e per errori di parsing con contesto (file, line/column se disponibile).
- Metriche: conteggio parsing error, latenza endpoint, percentuale di payload grandi.
- Retry/backoff per operazioni di I/O esterne (es. fetch immagini da storage remoto).

4.7 Testing backend
- Unit tests per parsers (cover edge cases, invalid YAML, nesting profondi).
- Integration tests su routes (es. validate endpoint con script di esempio).
- Smoke tests end-to-end: api /convert, /validate, /scripts roundtrip.

4.8 Deployment
- Dockerize: utilizzare l'immagine definita in `server/Dockerfile`. Montare `GAMEFOLDER` come volume in container.
- Pipeline: build image -> run unit tests -> push registry -> deploy.
- Backup dei dati: versionare `GAMEFOLDER` o prevedere snapshot prima di operazioni di scrittura.

4.9 Operazioni consigliate immediate
- Scrivere test di regressione per parser usando un corpus di file YAML già presenti nel repo.
- Definire file OpenAPI (o similar) per documentare gli endpoint principali e abilitare mock server per sviluppo FE.
- Implementare limiti di rate e size per gli endpoint che gestiscono immagini o file payload.

---

_End of iterazione 1 scaffold._

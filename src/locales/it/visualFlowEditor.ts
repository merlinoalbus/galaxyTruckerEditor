/**
 * Visual Flow Editor translations for Italian
 */

export const visualFlowEditorTranslations = {
  // Main Editor
  'visualFlowEditor.title': 'Visual Flow Editor',
  'visualFlowEditor.subtitle': 'Editor visuale completo con tutti i 14 tipi di IF',
  'visualFlowEditor.loading': 'Caricamento Visual Flow Editor...',
  'visualFlowEditor.noScriptLoaded': 'Nessuno script caricato',
  
  // Toolbar
  'visualFlowEditor.toolbar.scripts': 'Scripts',
  'visualFlowEditor.toolbar.missions': 'Missions',
  'visualFlowEditor.toolbar.new': 'Nuovo',
  'visualFlowEditor.toolbar.json': 'JSON',
  'visualFlowEditor.toolbar.save': 'Salva',
  'visualFlowEditor.toolbar.saving': 'Salvataggio...',
  'visualFlowEditor.toolbar.scriptManagement': 'Gestione Script',
  'visualFlowEditor.toolbar.missionManagement': 'Gestione Missions',
  'visualFlowEditor.toolbar.newScript': 'Nuovo Script',
  'visualFlowEditor.toolbar.viewJson': 'Visualizza JSON',
  'visualFlowEditor.toolbar.saveScript': 'Salva Script',
  'visualFlowEditor.toolbar.saveError': 'Errore nel salvataggio:',
  'visualFlowEditor.toolbar.clickToSeeErrors': 'Clicca per vedere i dettagli degli errori',
  'visualFlowEditor.toolbar.error': 'errore',
  'visualFlowEditor.toolbar.errors': 'errori',
  'visualFlowEditor.toolbar.fixErrorsBeforeSaving': 'Correggi {count} errori prima di salvare',
  
  // New Script Dialog
  'visualFlowEditor.newScriptDialog.title': 'Nuovo Elemento',
  'visualFlowEditor.newScriptDialog.elementType': 'Tipo di elemento',
  'visualFlowEditor.newScriptDialog.script': 'Script',
  'visualFlowEditor.newScriptDialog.mission': 'Mission',
  'visualFlowEditor.newScriptDialog.fileName': 'Nome file',
  'visualFlowEditor.newScriptDialog.scriptPlaceholder': 'es. myScript.txt',
  'visualFlowEditor.newScriptDialog.missionPlaceholder': 'es. myMission.txt',
  'visualFlowEditor.newScriptDialog.cancel': 'Annulla',
  'visualFlowEditor.newScriptDialog.create': 'Crea',
  'visualFlowEditor.newScriptDialog.createScript': 'Crea Script',
  'visualFlowEditor.newScriptDialog.createMission': 'Crea Mission',
  
  // Scripts List
  'visualFlowEditor.scriptsList.noScriptsAvailable': 'Nessuno script disponibile',
  
  // Missions List
  'visualFlowEditor.missionsList.loadingMissions': 'Caricamento missions...',
  
  // Validation Errors Modal
  'visualFlowEditor.validation.title': 'Errori di Validazione',
  'visualFlowEditor.validation.close': 'Chiudi',
  'visualFlowEditor.validation.occurrence': 'occorrenza',
  'visualFlowEditor.validation.occurrences': 'occorrenze',
  'visualFlowEditor.validation.block': 'Blocco',
  'visualFlowEditor.validation.path': 'Percorso',
  'visualFlowEditor.validation.goToBlock': 'Vai →',
  'visualFlowEditor.validation.goToBlockTitle': 'Vai al blocco',
  'visualFlowEditor.validation.footer': 'Correggi questi errori per garantire il corretto funzionamento dello script. I blocchi con errori sono evidenziati in rosso nell\'editor.',
  
  // Delay Block
  'visualFlowEditor.blocks.delay.duration': 'Durata',
  'visualFlowEditor.blocks.delay.hint': '1000 ms = 1 secondo',
  
  // GO Block
  'visualFlowEditor.blocks.go.anchor': 'Ancora:',
  'visualFlowEditor.blocks.go.goToLabel': 'Vai all\'etichetta',

  // LABEL Block
  'visualFlowEditor.blocks.label.anchorName': 'Nome Ancora',
  'visualFlowEditor.blocks.label.hint': 'Non sono ammessi spazi nei nomi delle ancore',
  
  // SUB_SCRIPT Block
  'visualFlowEditor.blocks.subScript.scriptName': 'Nome Script',
  'visualFlowEditor.blocks.subScript.hint': 'Seleziona lo script da eseguire',
  'visualFlowEditor.blocks.subScript.navigate': 'Naviga al sub-script',
  
  // EXIT_MENU Block
  'visualFlowEditor.blocks.exitMenu.description': 'Esci dal menu corrente',
  'visualFlowEditor.blocks.exitMenu.info': 'Questo comando esce dal menu corrente e continua l\'esecuzione',
  'visualFlowEditor.blocks.exitMenu.compact': 'Esci dal menu',
  'visualFlowEditor.blocks.exitMenu.fullDescription': 'Esci dal menu corrente. Questo comando esce dal menu corrente e continua l\'esecuzione.',
  
  // Validation Error Messages (existing and new)
  'visualFlowEditor.validation.error': 'Errore di validazione',
  'visualFlowEditor.validation.delayNoDuration': 'Il blocco DELAY deve avere un valore di durata. Imposta la durata in millisecondi.',
  'visualFlowEditor.validation.sayNoText': 'Il blocco SAY deve avere del testo. Aggiungi almeno il testo in inglese.',
  'visualFlowEditor.validation.askNoText': 'Il blocco ASK deve avere del testo. Aggiungi almeno il testo in inglese.',
  'visualFlowEditor.validation.goNoLabel': 'Il blocco GO deve avere una label selezionata. Scegli una label di destinazione.',
  'visualFlowEditor.validation.labelNoName': 'Il blocco LABEL deve avere un nome. Imposta il nome dell\'ancora.',
  'visualFlowEditor.validation.subScriptNoName': 'Il blocco SUB_SCRIPT deve avere un nome script. Seleziona uno script da eseguire.',
  'visualFlowEditor.validation.optNoText': 'Il blocco OPT deve avere del testo. Aggiungi almeno il testo in inglese.',
  'visualFlowEditor.validation.consecutiveAskError': '🚫 Due blocchi ASK consecutivi non sono permessi. Inserisci un altro tipo di blocco tra i due ASK.',
  'visualFlowEditor.validation.blockInBuildError': '🚫 Il blocco {blockType} non può essere inserito dentro un blocco BUILD. I blocchi BUILD e FLIGHT non possono essere annidati.',
  'visualFlowEditor.validation.blockInFlightError': '🚫 Il blocco {blockType} non può essere inserito dentro un blocco FLIGHT. I blocchi BUILD e FLIGHT non possono essere annidati.',
  'visualFlowEditor.validation.menuWithoutAskError': '🚫 Il blocco MENU deve essere preceduto da un blocco ASK per funzionare correttamente.',
  'visualFlowEditor.validation.optOutsideMenuError': '🚫 Il blocco OPT può essere inserito solo all\'interno di un blocco MENU.',
  'visualFlowEditor.validation.exitMenuOutsideOptError': '🚫 Il blocco EXIT_MENU può essere inserito solo all\'interno di un blocco OPT.',
  'visualFlowEditor.validation.exitMenuOnlyInOpt': 'Il blocco EXIT_MENU può essere inserito solo all\'interno di un blocco OPT.',
  'visualFlowEditor.validation.onlyOptInMenuError': '🚫 Solo blocchi OPT possono essere inseriti in un MENU. Il blocco {blockType} non è permesso.',
  'visualFlowEditor.validation.consecutiveAskDetailed': '💡 Due blocchi ASK consecutivi non sono permessi. Il primo ASK ({firstAsk}) è seguito direttamente da questo ASK. Inserisci un blocco SAY, MENU o altro comando tra i due ASK per separarli.',
  'visualFlowEditor.validation.blockInBuildDetailed': '💡 Il blocco {blockType} si trova dentro l\'area "{area}" di un blocco BUILD. I blocchi BUILD e FLIGHT non possono essere annidati. Sposta questo blocco fuori dal BUILD o usa altri tipi di blocchi.',
  'visualFlowEditor.validation.blockInFlightDetailed': '💡 Il blocco {blockType} si trova dentro l\'area "{area}" di un blocco FLIGHT. I blocchi BUILD e FLIGHT non possono essere annidati tra loro. Sposta questo blocco fuori dal FLIGHT.',
  'visualFlowEditor.validation.noText': 'senza testo',
  'visualFlowEditor.validation.areaInitialPhase': 'Fase Iniziale',
  'visualFlowEditor.validation.areaBuildStart': 'Inizio Build',
  'visualFlowEditor.validation.areaFlightStart': 'Inizio Volo',
  'visualFlowEditor.validation.areaEvaluation': 'Valutazione',
  'visualFlowEditor.validation.menuNeedsAsk': 'Il blocco MENU deve essere preceduto da un blocco ASK.',
  'visualFlowEditor.validation.menuAfterIfNoBranch': 'Il MENU segue un blocco IF dove né il ramo THEN né il ramo ELSE terminano con ASK. Entrambi i rami devono terminare con ASK.',
  'visualFlowEditor.validation.menuAfterIfNoThen': 'Il MENU segue un blocco IF dove il ramo THEN non termina con ASK. Aggiungi un ASK alla fine del ramo THEN.',
  'visualFlowEditor.validation.menuAfterIfNoElse': 'Il MENU segue un blocco IF dove il ramo ELSE non termina con ASK. Aggiungi un ASK alla fine del ramo ELSE.',
  'visualFlowEditor.validation.menuAfterMenu': 'Il MENU segue un altro MENU. I blocchi MENU non terminano con ASK, quindi devi inserire un ASK tra i due MENU.',
  'visualFlowEditor.validation.menuAfterBlock': 'Il MENU segue un blocco {blockType} che non termina con ASK. Inserisci un ASK prima del MENU.',
  'visualFlowEditor.validation.menuFirstBlock': 'Il MENU è il primo blocco dello script. Deve essere preceduto da almeno un blocco ASK.',
  'visualFlowEditor.validation.optOnlyInMenu': 'Il blocco OPT può essere inserito solo all\'interno di un blocco MENU.',
  'visualFlowEditor.validation.onlyOptInMenu': 'Il blocco {blockType} non può essere inserito in un MENU. Solo blocchi OPT sono permessi.',
  'visualFlowEditor.validation.askAfterMenu': 'Il blocco ASK non può seguire direttamente un blocco MENU',
  'visualFlowEditor.validation.menuAfterAsk': 'Il blocco MENU non può seguire direttamente un blocco ASK',
  'visualFlowEditor.validation.consecutiveAsk': 'Due blocchi ASK consecutivi non sono permessi',
  'visualFlowEditor.validation.buildInsideContainer': 'Il blocco BUILD non può essere annidato dentro un altro blocco contenitore',
  'visualFlowEditor.validation.flightInsideContainer': 'Il blocco FLIGHT non può essere annidato dentro un altro blocco contenitore',
  'visualFlowEditor.validation.buildContainsBuild': 'BUILD non può contenere un altro blocco BUILD',
  'visualFlowEditor.validation.buildContainsFlight': 'BUILD non può contenere un blocco FLIGHT',
  'visualFlowEditor.validation.flightContainsBuild': 'FLIGHT non può contenere un blocco BUILD',
  'visualFlowEditor.validation.flightContainsFlight': 'FLIGHT non può contenere un altro blocco FLIGHT',
  'visualFlowEditor.validation.menuWithoutAsk': 'MENU deve essere preceduto da un blocco ASK',
  'visualFlowEditor.validation.optOutsideMenu': 'OPT può essere inserito solo dentro un blocco MENU',
  'visualFlowEditor.validation.genericError': 'Errore di validazione generico',
  'visualFlowEditor.validation.invalidPosition': 'Posizione non valida per questo blocco',
  'visualFlowEditor.validation.missingRequired': 'Campi obbligatori mancanti',
  'visualFlowEditor.validation.ifEmptyThen': 'Il blocco IF non può avere il ramo THEN vuoto. Aggiungi almeno un blocco al ramo THEN.',
  'visualFlowEditor.validation.menuWithoutOpt': 'Il blocco MENU non può essere vuoto. Aggiungi almeno un blocco OPT al MENU.',
  'visualFlowEditor.validation.menuNoSimpleOpt': 'Il blocco MENU deve contenere almeno un blocco OPT semplice (senza condizioni).',
  'visualFlowEditor.validation.askMustBeFollowedByMenu': 'Il blocco ASK deve essere seguito da un blocco MENU. Se l\'ASK è dentro un IF, il MENU può essere nel ramo stesso o fuori dall\'IF.',
  'visualFlowEditor.validation.askWithoutMenu': 'Il blocco ASK deve essere seguito da un blocco MENU. Questo ASK è l\'ultimo blocco e non ha un MENU seguente.',
  'visualFlowEditor.validation.goWithoutLabel': 'Il blocco GO richiede almeno un blocco LABEL nello script. Aggiungi un blocco LABEL prima di usare GO.',
  
  // Error Modal
  'visualFlowEditor.errorModal.close': 'Chiudi',
  
  // Tools Panel
  'visualFlowEditor.tools.title': 'Strumenti',
  'visualFlowEditor.tools.searchPlaceholder': 'Cerca comando...',
  'visualFlowEditor.tools.dragInfo': '✋ Trascina 🖱️ Info',
  
  // Tool Categories
  'visualFlowEditor.tools.category.general': 'Generale',
  'visualFlowEditor.tools.category.constructs': 'Costrutti',
  'visualFlowEditor.tools.category.map': 'Mappa',
  'visualFlowEditor.tools.category.mission': 'Missione',
  'visualFlowEditor.tools.category.variables': 'Variabili',
  'visualFlowEditor.tools.category.info': 'Info e Aiuto',
  'visualFlowEditor.tools.category.credits': 'Crediti',
  'visualFlowEditor.tools.category.achievement': 'Achievement',
  'visualFlowEditor.tools.category.characters': 'Personaggi',
  'visualFlowEditor.tools.category.system': 'Sistema',
  'visualFlowEditor.tools.category.flow': 'Flusso',
  'visualFlowEditor.tools.category.display': 'Display',
  'visualFlowEditor.tools.category.input': 'Input',
  'visualFlowEditor.tools.category.audio': 'Audio',
  'visualFlowEditor.tools.category.animation': 'Animazione',
  'visualFlowEditor.tools.category.combat': 'Combattimento',
  'visualFlowEditor.tools.category.game': 'Gioco',
  'visualFlowEditor.tools.category.special': 'Speciali',
  
  // JSON View
  'visualFlowEditor.jsonView.title': 'Vista JSON',
  'visualFlowEditor.jsonView.copy': 'Copia',
  'visualFlowEditor.jsonView.copied': 'Copiato!',
  'visualFlowEditor.jsonView.close': 'Chiudi',
  'visualFlowEditor.jsonView.noScriptLoaded': 'Nessuno script caricato',
  'visualFlowEditor.jsonView.copyError': 'Errore nella copia del JSON:',
  'visualFlowEditor.jsonView.hideView': 'Nascondi vista JSON',
  'visualFlowEditor.jsonView.showView': 'Mostra vista JSON',
  'visualFlowEditor.jsonView.expand': 'Espandi',
  'visualFlowEditor.jsonView.compress': 'Comprimi',
  'visualFlowEditor.jsonView.copyToClipboard': 'Copia JSON negli appunti',
  'visualFlowEditor.jsonView.keys': 'chiavi',
  'visualFlowEditor.jsonView.characters': 'caratteri',
  
  // Block Actions (existing and new)
  'visualFlowEditor.addBlock': 'Aggiungi Blocco',
  'visualFlowEditor.deleteBlock': 'Elimina Blocco',
  'visualFlowEditor.moveUp': 'Sposta Su',
  'visualFlowEditor.moveDown': 'Sposta Giù',
  'visualFlowEditor.duplicate': 'Duplica',
  'visualFlowEditor.cut': 'Taglia',
  'visualFlowEditor.copy': 'Copia',
  'visualFlowEditor.paste': 'Incolla',
  'visualFlowEditor.undo': 'Annulla',
  'visualFlowEditor.redo': 'Ripeti',
  'visualFlowEditor.block.delete': 'Elimina',
  'visualFlowEditor.block.duplicate': 'Duplica',
  'visualFlowEditor.block.moveUp': 'Sposta su',
  'visualFlowEditor.block.moveDown': 'Sposta giù',
  'visualFlowEditor.block.zoomIn': 'Zoom in',
  'visualFlowEditor.block.zoomOut': 'Zoom out',
  
  // Drag and Drop (existing and new)
  'visualFlowEditor.dragDrop.hint': 'Trascina i blocchi per riordinare',
  'visualFlowEditor.dragDrop.dropHere': 'Rilascia qui',
  'visualFlowEditor.dragDrop.cannotDrop': 'Non puoi rilasciare qui',
  
  // Container
  'visualFlowEditor.container.then': 'Allora',
  'visualFlowEditor.container.else': 'Altrimenti',
  'visualFlowEditor.container.empty': 'Contenitore vuoto',
  
  // Block Types
  'visualFlowEditor.block.command': 'Comando',
  'visualFlowEditor.block.condition': 'Condizione',
  'visualFlowEditor.block.container': 'Contenitore',
  'visualFlowEditor.block.special': 'Speciale',
  
  // General UI
  'visualFlowEditor.search': 'Cerca',
  'visualFlowEditor.searchPlaceholder': 'Cerca blocchi...',
  'visualFlowEditor.noResults': 'Nessun risultato trovato',
  'visualFlowEditor.save': 'Salva',
  'visualFlowEditor.cancel': 'Annulla',
  'visualFlowEditor.confirmDelete': 'Sei sicuro di voler eliminare questo blocco?',
  'visualFlowEditor.unsavedChanges': 'Hai modifiche non salvate',
  'visualFlowEditor.loadError': 'Errore nel caricamento dei dati',
  'visualFlowEditor.saveSuccess': 'Modifiche salvate con successo',
  'visualFlowEditor.saveError': 'Errore nel salvataggio delle modifiche',
  
  // Navigation Breadcrumb
  'visualFlowEditor.navigation.root': 'Root',
  'visualFlowEditor.navigation.backToMain': 'Torna alla vista principale',
  
  // Scripts/Missions Lists
  'visualFlowEditor.scriptsList.title': 'Scripts Disponibili',
  'visualFlowEditor.scriptsList.searchPlaceholder': 'Cerca script...',
  'visualFlowEditor.missionsList.title': 'Missions Disponibili',
  'visualFlowEditor.missionsList.searchPlaceholder': 'Cerca mission...',
  
  // ToolsPanel
  'visualFlowEditor.tools.inDevelopment': 'In sviluppo',
  'visualFlowEditor.tools.notImplemented': 'Non implementato',
  
  // ZoomControls
  'visualFlowEditor.zoom.zoomIn': 'Zoom su questo blocco',
  'visualFlowEditor.zoom.goBack': 'Torna indietro',
  
  // MultilingualTextEditor
  'visualFlowEditor.multilingual.expandLanguages': 'Espandi lingue',
  'visualFlowEditor.multilingual.collapse': 'Comprimi',
  'visualFlowEditor.multilingual.copyToAll': 'Copia in tutte le lingue',
  'visualFlowEditor.multilingual.copyFromEN': 'Copia da EN',
  'visualFlowEditor.multilingual.languages.en': 'Inglese',
  'visualFlowEditor.multilingual.languages.cs': 'Ceco',
  'visualFlowEditor.multilingual.languages.de': 'Tedesco',
  'visualFlowEditor.multilingual.languages.es': 'Spagnolo',
  'visualFlowEditor.multilingual.languages.fr': 'Francese',
  'visualFlowEditor.multilingual.languages.pl': 'Polacco',
  'visualFlowEditor.multilingual.languages.ru': 'Russo',
  'visualFlowEditor.multilingual.defaultPlaceholder': 'Inserisci testo...',
  'visualFlowEditor.multilingual.defaultLabel': 'Testo',
  
  // SelectWithModal
  'visualFlowEditor.select.searchPlaceholder': 'Cerca...',
  'visualFlowEditor.select.variableName': 'Nome variabile',
  'visualFlowEditor.select.semaphoreName': 'Nome semaforo',
  'visualFlowEditor.select.labelName': 'Nome etichetta',
  'visualFlowEditor.select.scriptName': 'Nome script...',
  'visualFlowEditor.select.missionName': 'Nome missione...',
  'visualFlowEditor.select.selectVariable': 'Seleziona Variabile',
  'visualFlowEditor.select.selectSemaphore': 'Seleziona Semaforo',
  'visualFlowEditor.select.selectLabel': 'Seleziona Etichetta',
  'visualFlowEditor.select.selectScript': 'Seleziona Script',
  'visualFlowEditor.select.selectMission': 'Seleziona Missione',
  'visualFlowEditor.select.select': 'Seleziona',
  'visualFlowEditor.select.selectPlaceholder': 'Seleziona...',
  'visualFlowEditor.select.variableType': 'variabile',
  'visualFlowEditor.select.semaphoreType': 'semaforo',
  'visualFlowEditor.select.labelType': 'etichetta',
  'visualFlowEditor.select.scriptType': 'script',
  'visualFlowEditor.select.missionType': 'missione',
  'visualFlowEditor.select.alreadyExists': '{type} esiste già!',
  'visualFlowEditor.select.nothingFound': 'Nessun {type} trovato',
  'visualFlowEditor.select.nothingAvailable': 'Nessun {type} disponibile',
  'visualFlowEditor.select.addNew': 'Aggiungi {type}',
  'visualFlowEditor.select.confirm': 'Conferma',
  'visualFlowEditor.select.cancel': 'Annulla',
  
  // BaseBlock
  'visualFlowEditor.block.deleteTitle': 'Elimina blocco',
  'visualFlowEditor.block.expandTitle': 'Espandi blocco',
  'visualFlowEditor.block.collapseTitle': 'Comprimi blocco',
  'visualFlowEditor.block.dragToMove': 'Trascina per spostare',
  
  // CommandBlock
  'visualFlowEditor.command.dialogText': 'Testo dialogo',
  'visualFlowEditor.command.dialogLabel': 'Dialogo',
  'visualFlowEditor.command.questionText': 'Testo domanda',
  'visualFlowEditor.command.questionLabel': 'Domanda',
  'visualFlowEditor.command.milliseconds': 'Millisecondi (es. 1000 = 1 secondo)',
  'visualFlowEditor.command.selectLabel': 'Seleziona etichetta...',
  'visualFlowEditor.command.labelName': 'Nome etichetta...',
  
  // ScriptBlock
  'visualFlowEditor.script.scriptName': 'Nome script...',
  'visualFlowEditor.script.expand': 'Espandi blocco',
  'visualFlowEditor.script.collapse': 'Comprimi blocco',
  'visualFlowEditor.script.scriptNameLabel': 'Nome Script:',
  'visualFlowEditor.script.fileLabel': 'File:',
  'visualFlowEditor.script.blocksLabel': 'Blocchi:',
  
  // MissionBlock
  'visualFlowEditor.mission.missionName': 'Nome missione...',
  'visualFlowEditor.mission.expand': 'Espandi missione',
  'visualFlowEditor.mission.collapse': 'Comprimi missione',
  'visualFlowEditor.mission.missionNameLabel': 'Nome Missione:',
  'visualFlowEditor.mission.fileLabel': 'File:',
  'visualFlowEditor.mission.blocksLabel': 'Blocchi:',
  'visualFlowEditor.mission.missionBlocksTitle': 'Blocchi Missione',
  'visualFlowEditor.mission.elements': 'elementi',
  'visualFlowEditor.mission.insertHere': 'Inserisci qui',
  'visualFlowEditor.mission.missionFinishTitle': 'Fine Missione',
  
  // OptBlock
  'visualFlowEditor.opt.selectVariable': 'Seleziona variabile...',
  'visualFlowEditor.opt.optionText': 'Testo opzione...',
  'visualFlowEditor.opt.simple': 'Semplice',
  'visualFlowEditor.opt.conditional': 'Condizionale (IF)',
  'visualFlowEditor.opt.conditionalNot': 'Condizionale (IF NOT)',
  'visualFlowEditor.opt.elements': 'elementi',
  'visualFlowEditor.opt.conditionLabel': 'Condizione:',
  'visualFlowEditor.opt.optionTextLabel': 'Testo Opzione',
  'visualFlowEditor.opt.insertHere': 'Inserisci qui',
  'visualFlowEditor.opt.emptyContainer': 'Container vuoto',
  'visualFlowEditor.opt.dragBlocksHere': 'Trascina qui i blocchi',
  
  // IfBlock Parameters
  'visualFlowEditor.if.selectSemaphore': 'Seleziona semaforo...',
  'visualFlowEditor.if.orderPositions': 'Posizioni Ordine:',
  'visualFlowEditor.if.selectVariable': 'Seleziona variabile...',
  'visualFlowEditor.if.value': 'Valore',
  'visualFlowEditor.if.percentage': 'Percentuale (%)',
  'visualFlowEditor.if.credits': 'Crediti',
  'visualFlowEditor.if.selectMission': 'Seleziona missione...',
  'visualFlowEditor.if.result': 'Risultato',
  'visualFlowEditor.if.minResult': 'Risultato Minimo',
  'visualFlowEditor.if.campaignName': 'Nome Campagna (opzionale)',
  'visualFlowEditor.if.tutorialId': 'ID Tutorial',
  'visualFlowEditor.if.thenElseTooltip': 'Then: {thenCount} elementi, Else: {elseCount} elementi',
  'visualFlowEditor.if.noElements': '0 elementi',
  'visualFlowEditor.if.noElementsTooltip': 'Nessun elemento in Then o Else',
  'visualFlowEditor.if.elementSingle': '1 elemento',
  'visualFlowEditor.if.elements': '{count} elementi',
  'visualFlowEditor.if.thenTooltip': 'Then: {count} elementi',
  'visualFlowEditor.if.insertInThen': 'Inserisci in THEN',
  'visualFlowEditor.if.insertInElse': 'Inserisci in ELSE',
  
  // BuildBlock
  'visualFlowEditor.build.initPhase': 'Fase Iniziale',
  'visualFlowEditor.build.startPhase': 'Inizio Build',
  'visualFlowEditor.build.insertHere': 'Inserisci qui',
  'visualFlowEditor.build.elements': 'elementi',
  
  // FlightBlock
  'visualFlowEditor.flight.initPhase': 'Fase Iniziale',
  'visualFlowEditor.flight.startPhase': 'Inizio Volo',
  'visualFlowEditor.flight.evaluatePhase': 'Valutazione',
  'visualFlowEditor.flight.insertHere': 'Inserisci qui',
  'visualFlowEditor.flight.elements': 'elementi',
  
  // MenuBlock
  'visualFlowEditor.menu.elements': 'elementi',
  'visualFlowEditor.menu.insertHere': 'Inserisci qui',
  'visualFlowEditor.menu.emptyContainer': 'Container vuoto',
  'visualFlowEditor.menu.dragBlocksHere': 'Trascina qui i blocchi',
  
  // AnchorPoint
  'visualFlowEditor.anchorPoint.dropNotAllowed': 'Drop non permesso',
  
  // Tool Descriptions - General
  'visualFlowEditor.tools.delay.description': 'Aggiunge ritardo in millisecondi',
  'visualFlowEditor.tools.go.description': 'Vai a etichetta',
  'visualFlowEditor.tools.subScript.description': 'Esegue sotto-script',
  'visualFlowEditor.tools.exitMenu.description': 'Esci dal menu',
  'visualFlowEditor.tools.say.description': 'Mostra dialogo',
  'visualFlowEditor.tools.changeChar.description': 'Cambia personaggio',
  'visualFlowEditor.tools.set.description': 'Imposta semaforo',
  'visualFlowEditor.tools.ask.description': 'Fai domanda',
  'visualFlowEditor.tools.hideChar.description': 'Nascondi personaggio',
  'visualFlowEditor.tools.showChar.description': 'Mostra personaggio',
  'visualFlowEditor.tools.reset.description': 'Resetta semaforo',
  'visualFlowEditor.tools.label.description': 'Definisce etichetta',
  'visualFlowEditor.tools.hideDlgScene.description': 'Nascondi scena dialogo',
  'visualFlowEditor.tools.showDlgScene.description': 'Mostra scena dialogo',
  'visualFlowEditor.tools.return.description': 'Ritorna da sotto-script',
  'visualFlowEditor.tools.announce.description': 'Fai annuncio',
  'visualFlowEditor.tools.sayChar.description': 'Personaggio parla',
  
  // Tool Descriptions - Constructs
  'visualFlowEditor.tools.if.description': 'Ramo condizionale',
  'visualFlowEditor.tools.menu.description': 'Mostra opzioni menu',
  'visualFlowEditor.tools.opt.description': 'Opzione menu',
  'visualFlowEditor.tools.build.description': 'Fase costruzione',
  'visualFlowEditor.tools.flight.description': 'Fase volo',
  
  // Tool Descriptions - Map
  'visualFlowEditor.tools.showNode.description': 'Mostra nodo mappa',
  'visualFlowEditor.tools.hideNode.description': 'Nascondi nodo mappa',
  'visualFlowEditor.tools.addNode.description': 'Aggiungi nodo mappa',
  'visualFlowEditor.tools.setNodeKnown.description': 'Segna nodo come conosciuto',
  'visualFlowEditor.tools.showPath.description': 'Mostra percorso',
  'visualFlowEditor.tools.hidePath.description': 'Nascondi percorso',
  'visualFlowEditor.tools.hideAllPaths.description': 'Nascondi tutti i percorsi',
  'visualFlowEditor.tools.showButton.description': 'Mostra bottone',
  'visualFlowEditor.tools.hideButton.description': 'Nascondi bottone',
  'visualFlowEditor.tools.centerMapByNode.description': 'Centra mappa su nodo',
  'visualFlowEditor.tools.centerMapByPath.description': 'Centra mappa su percorso',
  'visualFlowEditor.tools.movePlayerToNode.description': 'Sposta giocatore al nodo',
  
  // Tool Descriptions - Mission
  'visualFlowEditor.tools.addOpponent.description': 'Aggiunge avversario',
  'visualFlowEditor.tools.setShipType.description': 'Imposta tipo nave',
  'visualFlowEditor.tools.addPartToShip.description': 'Aggiunge parte a nave',
  'visualFlowEditor.tools.addPartToAsideSlot.description': 'Aggiunge parte ad aside',
  'visualFlowEditor.tools.addShipParts.description': 'Aggiunge parti multiple',
  'visualFlowEditor.tools.finishMission.description': 'Termina missione',
  'visualFlowEditor.tools.actMission.description': 'Attiva missione',
  'visualFlowEditor.tools.setDeckPreparationScript.description': 'Imposta script deck',
  'visualFlowEditor.tools.setFlightDeckPreparationScript.description': 'Imposta script deck volo',
  'visualFlowEditor.tools.setAdvPile.description': 'Imposta pile avventura',
  'visualFlowEditor.tools.setSecretAdvPile.description': 'Imposta pile segreta',
  'visualFlowEditor.tools.setSpecCondition.description': 'Imposta condizione speciale',
  'visualFlowEditor.tools.modifyOpponentsBuildSpeed.description': 'Modifica velocità costruzione',
  'visualFlowEditor.tools.setTurnBased.description': 'Imposta modalità turni',
  'visualFlowEditor.tools.setMissionAsFailed.description': 'Segna missione fallita',
  'visualFlowEditor.tools.setMissionAsCompleted.description': 'Segna missione completata',
  'visualFlowEditor.tools.allShipsGiveUp.description': 'Resa generale navi',
  'visualFlowEditor.tools.giveUpFlight.description': 'Arrendi volo',
  
  // Tool Descriptions - Variables
  'visualFlowEditor.tools.setTo.description': 'Imposta valore variabile',
  'visualFlowEditor.tools.add.description': 'Aggiunge a variabile',
  'visualFlowEditor.tools.setFocus.description': 'Imposta focus',
  'visualFlowEditor.tools.resetFocus.description': 'Resetta focus',
  'visualFlowEditor.tools.setFocusIfCredits.description': 'Focus condizionale',
  
  // Tool Descriptions - Info
  'visualFlowEditor.tools.addInfoWindow.description': 'Aggiunge finestra info',
  'visualFlowEditor.tools.showInfoWindow.description': 'Mostra finestra info',
  'visualFlowEditor.tools.showHelpImage.description': 'Mostra immagine aiuto',
  'visualFlowEditor.tools.buildingHelpScript.description': 'Script aiuto costruzione',
  'visualFlowEditor.tools.flightHelpScript.description': 'Script aiuto volo',
  'visualFlowEditor.tools.alienHelpScript.description': 'Script aiuto alieni',
  
  // Tool Descriptions - Credits
  'visualFlowEditor.tools.addCredits.description': 'Aggiunge crediti',
  'visualFlowEditor.tools.setCredits.description': 'Imposta crediti',
  'visualFlowEditor.tools.addMissionCredits.description': 'Aggiunge crediti missione',
  'visualFlowEditor.tools.addMissionCreditsByResult.description': 'Crediti da risultato',
  'visualFlowEditor.tools.subOpponentCreditsByResult.description': 'Sottrae crediti',
  'visualFlowEditor.tools.addOpponentsCredits.description': 'Aggiunge crediti avversario',
  
  // Tool Descriptions - Achievement
  'visualFlowEditor.tools.setAchievementProgress.description': 'Imposta progresso achievement',
  'visualFlowEditor.tools.setAchievementAttempt.description': 'Imposta tentativo achievement',
  'visualFlowEditor.tools.unlockAchievement.description': 'Sblocca achievement',
  'visualFlowEditor.tools.unlockShipPlan.description': 'Sblocca piano nave',
  'visualFlowEditor.tools.unlockShuttles.description': 'Sblocca shuttle',
  
  // Tool Descriptions - Characters
  'visualFlowEditor.tools.askChar.description': 'Domanda con personaggio',
  'visualFlowEditor.tools.focusChar.description': 'Focus su personaggio',
  
  // Tool Descriptions - System
  'visualFlowEditor.tools.setFlightStatusBar.description': 'Imposta barra stato volo',
  'visualFlowEditor.tools.saveState.description': 'Salva stato gioco',
  'visualFlowEditor.tools.loadState.description': 'Carica stato gioco',
  'visualFlowEditor.tools.quitCampaign.description': 'Esci dalla campagna',
  
} as const;
import { SupportedLanguage } from '@/contexts/LanguageContext';
import { useLanguage } from '@/contexts/LanguageContext';

export type TranslationKey = 
  // Common
  | 'common.loading'
  | 'common.error'
  | 'common.save'
  | 'common.cancel'
  | 'common.close'
  | 'common.search'
  | 'common.refresh'
  | 'common.export'
  | 'common.import'
  | 'common.connected'
  | 'common.connecting'
  | 'common.noData'
  
  // Header
  | 'header.title'
  | 'header.saveAll'
  | 'header.update'
  | 'header.exportTooltip'
  | 'header.importTooltip'
  | 'header.refreshTooltip'
  
  // Tabs
  | 'tabs.interactiveMap'
  | 'tabs.visualFlowEditor'
  | 'tabs.variablesSystem'
  | 'tabs.overview'
  
  // Campaign Editor
  | 'campaignEditor.title'
  | 'campaignEditor.description'
  | 'campaignEditor.interactiveMapTitle'
  
  // Sidebar
  | 'sidebar.navigation'
  | 'sidebar.campaign'
  | 'sidebar.translations'
  | 'sidebar.footerTitle'
  | 'sidebar.footerSubtitle'
  
  // Overview
  | 'overview.title'
  | 'overview.description'
  | 'overview.loading'
  | 'overview.noCampaignData'
  | 'overview.loadCampaignMessage'
  | 'overview.scripts'
  | 'overview.variables'
  | 'overview.characters'
  | 'overview.missions'
  | 'overview.totalCommands'
  | 'overview.semaphores'
  | 'overview.numeric'
  | 'overview.missionsReferenced'
  | 'overview.languageDistribution'
  | 'overview.complexityAnalysis'
  | 'overview.averageCommandsPerScript'
  | 'overview.mostComplexScript'
  | 'overview.scriptConnections'
  | 'overview.campaignEntities'
  | 'overview.labels'
  | 'overview.avgPerScript'
  | 'overview.commands'
  
  // Map Controls
  | 'mapControls.title'
  | 'mapControls.zoomIn'
  | 'mapControls.zoomOut'
  | 'mapControls.centerNewbie'
  | 'mapControls.resetView'
  
  // Map Legend
  | 'mapLegend.title'
  | 'mapLegend.flightLicenses'
  | 'mapLegend.routeTypes'
  | 'mapLegend.normalMissions'
  | 'mapLegend.uniqueMissions'
  | 'mapLegend.shuttles'
  
  // Interactive Map
  | 'interactiveMap.enterFullscreen'
  | 'interactiveMap.exitFullscreen'
  
  // Element Counters
  | 'elements.scripts'
  | 'elements.missions'
  | 'elements.semaphores'
  | 'elements.labels'
  | 'elements.characters'
  | 'elements.variables'
  | 'elements.images'
  | 'elements.achievements'
  
  // Variables System
  | 'variablesSystem.title'
  | 'variablesSystem.description'
  | 'variablesSystem.searchPlaceholder'
  | 'variablesSystem.loadingData'
  | 'variablesSystem.errorLoading'
  | 'variablesSystem.retry'
  | 'variablesSystem.sortBy'
  | 'variablesSystem.name'
  | 'variablesSystem.usage'
  | 'variablesSystem.noResults'
  | 'variablesSystem.tryDifferentSearch'
  | 'variablesSystem.selectItem'
  | 'variablesSystem.usedIn'
  | 'variablesSystem.others'
  | 'variablesSystem.operations'
  | 'variablesSystem.position'
  | 'variablesSystem.objectives'
  | 'variablesSystem.hidden'
  | 'variablesSystem.repeatable'
  | 'variablesSystem.points'
  
  // Script Selector
  | 'scriptSelector.searchScripts'
  | 'scriptSelector.starScripts'
  | 'scriptSelector.otherScripts'
  | 'scriptSelector.uniqueMissions'
  | 'scriptSelector.normalMissions'
  | 'scriptSelector.noScriptsFound'
  | 'scriptSelector.noMissionsFound'
  | 'scriptSelector.noScriptsAvailable'
  | 'scriptSelector.noMissionsAvailable'
  
  // Tooltips
  | 'tooltip.interactiveButtons'
  | 'tooltip.routes'
  | 'tooltip.scripts'
  | 'tooltip.buttons'
  | 'tooltip.license'
  | 'tooltip.type'
  
  // Common
  | 'common.usedIn'
  | 'common.others'
  
  // ListView
  | 'listView.noElementsFound'
  | 'listView.tryModifyingSearch'
  
  // CharacterView
  | 'characterView.character'
  | 'characterView.uses'
  | 'characterView.availableImages'
  
  // VariableView
  | 'variableView.numericVariable'
  | 'variableView.uses'
  | 'variableView.values'
  
  // LabelView
  | 'labelView.label'
  | 'labelView.uses'
  | 'labelView.script'
  | 'labelView.line'
  | 'labelView.references'
  | 'labelView.otherReferences'
  
  // AchievementView
  | 'achievementView.objectives'
  | 'achievementView.hidden'
  | 'achievementView.repeatable'
  
  // SemaforoView
  | 'semaforoView.semaphore'
  | 'semaforoView.uses'
  | 'semaforoView.finalState'
  
  // ImageView
  | 'imageView.modified'
  | 'imageView.depth'
  
  // DetailView
  | 'detailView.selectElement'
  | 'detailView.initialValue'
  | 'detailView.totalUsage'
  | 'detailView.commandsUsed'
  | 'detailView.scriptsUsing'
  | 'detailView.goToScript'
  | 'detailView.numericVariable'
  | 'detailView.semaphore'
  | 'detailView.label'
  | 'detailView.character'
  | 'detailView.image'
  | 'detailView.achievement'
  | 'detailView.labelDefinition'
  | 'detailView.labelReferences'
  | 'detailView.goToDefinition'
  | 'detailView.goToLine'
  | 'charactersView.charactersList'
  | 'charactersView.visible'
  | 'charactersView.hidden'
  | 'charactersView.visibleInGame'
  | 'charactersView.hiddenInGame'
  | 'charactersView.basicInfo'
  | 'charactersView.internalName'
  | 'charactersView.visibility'
  | 'charactersView.scriptCount'
  | 'charactersView.imageGallery'
  | 'charactersView.scriptsUsing'
  | 'charactersView.goToScript'
  | 'charactersView.selectCharacter'
  | 'charactersView.imagePreview'
  | 'charactersView.noImageSelected'
  | 'charactersView.totalUsage'
  | 'charactersView.usedInScripts'
  | 'charactersView.commands';

type Translations = {
  [key in SupportedLanguage]: {
    [key in TranslationKey]: string;
  };
};

export const translations: Translations = {
  EN: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.refresh': 'Refresh',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.connected': 'Connected',
    'common.connecting': 'Connecting...',
    'common.noData': 'No data available',
    
    // Header
    'header.title': 'Galaxy Trucker Editor',
    'header.saveAll': 'Save All',
    'header.update': 'Update',
    'header.exportTooltip': 'Export all',
    'header.importTooltip': 'Import file',
    'header.refreshTooltip': 'Reload data',
    
    // Tabs
    'tabs.interactiveMap': 'Interactive Map',
    'tabs.visualFlowEditor': 'Visual Flow Editor',
    'tabs.variablesSystem': 'Variables & System',
    'tabs.overview': 'Overview',
    
    // Campaign Editor
    'campaignEditor.title': 'Complete Campaign Editor',
    'campaignEditor.description': 'Interactive map-based script editing with complete flow visualization',
    'campaignEditor.interactiveMapTitle': 'Interactive Campaign Map',
    
    // Sidebar
    'sidebar.navigation': 'Navigation',
    'sidebar.campaign': 'Campaign',
    'sidebar.translations': 'Translations',
    'sidebar.footerTitle': 'Galaxy Trucker Editor',
    'sidebar.footerSubtitle': 'Based on Marmalade SDK',
    
    // Overview
    'overview.title': 'Campaign Overview',
    'overview.description': 'Comprehensive analysis of your campaign structure and content',
    'overview.loading': 'Loading overview data...',
    'overview.noCampaignData': 'No Campaign Data',
    'overview.loadCampaignMessage': 'Load campaign scripts to see overview statistics',
    'overview.scripts': 'Scripts',
    'overview.variables': 'Variables',
    'overview.characters': 'Characters',
    'overview.missions': 'Missions',
    'overview.totalCommands': 'total commands',
    'overview.semaphores': 'semaphores',
    'overview.numeric': 'numeric',
    'overview.missionsReferenced': 'missions referenced',
    'overview.languageDistribution': 'Language Distribution',
    'overview.complexityAnalysis': 'Complexity Analysis',
    'overview.averageCommandsPerScript': 'Average Commands per Script',
    'overview.mostComplexScript': 'Most Complex Script',
    'overview.scriptConnections': 'Script Connections',
    'overview.campaignEntities': 'Campaign Entities',
    'overview.labels': 'Labels',
    'overview.avgPerScript': 'avg per script',
    'overview.commands': 'commands',
    
    // Map Controls
    'mapControls.title': 'Controls',
    'mapControls.zoomIn': 'Zoom In (+)',
    'mapControls.zoomOut': 'Zoom Out (-)',
    'mapControls.centerNewbie': 'Center on Port Newbie',
    'mapControls.resetView': 'Reset View (Center + 100%)',
    
    // Map Legend
    'mapLegend.title': 'Legend',
    'mapLegend.flightLicenses': 'Flight Licenses',
    'mapLegend.routeTypes': 'Route Types',
    'mapLegend.normalMissions': 'Normal Missions',
    'mapLegend.uniqueMissions': 'Unique Missions',
    'mapLegend.shuttles': 'Shuttles',
    
    // Interactive Map
    'interactiveMap.enterFullscreen': 'Fullscreen',
    'interactiveMap.exitFullscreen': 'Exit Fullscreen',
    
    // Element Counters
    'elements.scripts': 'Scripts',
    'elements.missions': 'Missions',
    'elements.semaphores': 'Semaphores',
    'elements.labels': 'Labels',
    'elements.characters': 'Characters',
    'elements.variables': 'Variables',
    'elements.images': 'Images',
    'elements.achievements': 'Achievements',
    
    // Variables System
    'variablesSystem.title': 'Variables & System',
    'variablesSystem.description': 'Manage and analyze all campaign elements',
    'variablesSystem.searchPlaceholder': 'Search',
    'variablesSystem.loadingData': 'Loading data...',
    'variablesSystem.errorLoading': 'Error loading',
    'variablesSystem.retry': 'Retry',
    'variablesSystem.sortBy': 'Sort by',
    'variablesSystem.name': 'Name',
    'variablesSystem.usage': 'Usage',
    'variablesSystem.noResults': 'No items found',
    'variablesSystem.tryDifferentSearch': 'Try modifying your search criteria',
    'variablesSystem.selectItem': 'Select an item to view details',
    'variablesSystem.usedIn': 'Used in:',
    'variablesSystem.others': 'others',
    'variablesSystem.operations': 'Operations',
    'variablesSystem.position': 'Position',
    'variablesSystem.objectives': 'objectives',
    'variablesSystem.hidden': 'Hidden',
    'variablesSystem.repeatable': 'Repeatable',
    'variablesSystem.points': 'pts',
    
    // Script Selector
    'scriptSelector.searchScripts': 'Search scripts and missions...',
    'scriptSelector.starScripts': 'Star Scripts',
    'scriptSelector.otherScripts': 'Other Scripts',
    'scriptSelector.uniqueMissions': 'Unique Missions',
    'scriptSelector.normalMissions': 'Normal Missions',
    'scriptSelector.noScriptsFound': 'No scripts found',
    'scriptSelector.noMissionsFound': 'No missions found',
    'scriptSelector.noScriptsAvailable': 'No scripts available',
    'scriptSelector.noMissionsAvailable': 'No missions available',
    
    // Tooltips
    'tooltip.interactiveButtons': 'Interactive Buttons:',
    'tooltip.routes': 'Routes:',
    'tooltip.scripts': 'Scripts:',
    'tooltip.buttons': 'Buttons:',
    'tooltip.license': 'License:',
    'tooltip.type': 'Type:',
    
    // Common
    'common.usedIn': 'Used in:',
    'common.others': 'others',
    
    // ListView
    'listView.noElementsFound': 'No elements found',
    'listView.tryModifyingSearch': 'Try modifying search criteria',
    
    // CharacterView
    'characterView.character': 'Character',
    'characterView.uses': 'uses',
    'characterView.availableImages': 'available images',
    
    // VariableView
    'variableView.numericVariable': 'Numeric Variable',
    'variableView.uses': 'uses',
    'variableView.values': 'Values',
    
    // LabelView
    'labelView.label': 'Label',
    'labelView.uses': 'uses',
    'labelView.script': 'Script',
    'labelView.line': 'Line',
    'labelView.references': 'References',
    'labelView.otherReferences': 'other references',
    
    // AchievementView
    'achievementView.objectives': 'objectives',
    'achievementView.hidden': 'Hidden',
    'achievementView.repeatable': 'Repeatable',
    
    // SemaforoView
    'semaforoView.semaphore': 'Semaphore',
    'semaforoView.uses': 'uses',
    'semaforoView.finalState': 'Final state',
    
    // ImageView
    'imageView.modified': 'Modified',
    'imageView.depth': 'Depth',
    
    // DetailView
    'detailView.selectElement': 'Select an element to view details',
    'detailView.initialValue': 'Initial value',
    'detailView.totalUsage': 'Total usage',
    'detailView.commandsUsed': 'Commands used',
    'detailView.scriptsUsing': 'Scripts using it',
    'detailView.goToScript': 'Go to script',
    'detailView.numericVariable': 'Numeric Variable',
    'detailView.semaphore': 'Semaphore',
    'detailView.label': 'Label',
    'detailView.character': 'Character',
    'detailView.image': 'Image',
    'detailView.achievement': 'Achievement',
    'detailView.labelDefinition': 'Label Definition',
    'detailView.labelReferences': 'References',
    'detailView.goToDefinition': 'Go to definition',
    'detailView.goToLine': 'Go',
    'charactersView.charactersList': 'Characters',
    'charactersView.visible': 'Visible',
    'charactersView.hidden': 'Hidden',
    'charactersView.visibleInGame': 'Visible in game',
    'charactersView.hiddenInGame': 'Hidden in game',
    'charactersView.basicInfo': 'Basic Information',
    'charactersView.internalName': 'Internal name',
    'charactersView.visibility': 'Visibility',
    'charactersView.scriptCount': 'Script count',
    'charactersView.imageGallery': 'Image Gallery',
    'charactersView.scriptsUsing': 'Scripts using',
    'charactersView.goToScript': 'Go to script',
    'charactersView.selectCharacter': 'Select a character',
    'charactersView.imagePreview': 'Image Preview',
    'charactersView.noImageSelected': 'No image selected',
    'charactersView.totalUsage': 'Total usage',
    'charactersView.usedInScripts': 'Used in scripts',
    'charactersView.commands': 'Commands'
  },
  
  IT: {
    // Common
    'common.loading': 'Caricamento...',
    'common.error': 'Errore',
    'common.save': 'Salva',
    'common.cancel': 'Annulla',
    'common.close': 'Chiudi',
    'common.search': 'Cerca',
    'common.refresh': 'Aggiorna',
    'common.export': 'Esporta',
    'common.import': 'Importa',
    'common.connected': 'Connesso',
    'common.connecting': 'Connessione...',
    'common.noData': 'Nessun dato disponibile',
    
    // Header
    'header.title': 'Galaxy Trucker Editor',
    'header.saveAll': 'Salva Tutto',
    'header.update': 'Aggiorna',
    'header.exportTooltip': 'Esporta tutto',
    'header.importTooltip': 'Importa file',
    'header.refreshTooltip': 'Ricarica dati',
    
    // Tabs
    'tabs.interactiveMap': 'Mappa Interattiva',
    'tabs.visualFlowEditor': 'Editor Flusso Visuale',
    'tabs.variablesSystem': 'Variabili e Sistema',
    'tabs.overview': 'Panoramica',
    
    // Campaign Editor
    'campaignEditor.title': 'Editor Campagna Completo',
    'campaignEditor.description': 'Editing degli script basato su mappa interattiva con visualizzazione completa del flusso',
    'campaignEditor.interactiveMapTitle': 'Mappa Campagna Interattiva',
    
    // Sidebar
    'sidebar.navigation': 'Navigazione',
    'sidebar.campaign': 'Campagna',
    'sidebar.translations': 'Traduzioni',
    'sidebar.footerTitle': 'Galaxy Trucker Editor',
    'sidebar.footerSubtitle': 'Basato su Marmalade SDK',
    
    // Overview
    'overview.title': 'Panoramica Campagna',
    'overview.description': 'Analisi completa della struttura e contenuto della tua campagna',
    'overview.loading': 'Caricamento dati panoramica...',
    'overview.noCampaignData': 'Nessun Dato Campagna',
    'overview.loadCampaignMessage': 'Carica gli script della campagna per vedere le statistiche',
    'overview.scripts': 'Script',
    'overview.variables': 'Variabili',
    'overview.characters': 'Personaggi',
    'overview.missions': 'Missioni',
    'overview.totalCommands': 'comandi totali',
    'overview.semaphores': 'semafori',
    'overview.numeric': 'numeriche',
    'overview.missionsReferenced': 'missioni referenziate',
    'overview.languageDistribution': 'Distribuzione Lingue',
    'overview.complexityAnalysis': 'Analisi Complessità',
    'overview.averageCommandsPerScript': 'Comandi Medi per Script',
    'overview.mostComplexScript': 'Script più Complesso',
    'overview.scriptConnections': 'Connessioni Script',
    'overview.campaignEntities': 'Entità Campagna',
    'overview.labels': 'Etichette',
    'overview.avgPerScript': 'media per script',
    'overview.commands': 'comandi',
    
    // Map Controls
    'mapControls.title': 'Controlli',
    'mapControls.zoomIn': 'Zoom Avanti (+)',
    'mapControls.zoomOut': 'Zoom Indietro (-)',
    'mapControls.centerNewbie': 'Centra su Port Newbie',
    'mapControls.resetView': 'Ripristina Vista (Centro + 100%)',
    
    // Map Legend
    'mapLegend.title': 'Legenda',
    'mapLegend.flightLicenses': 'Licenze di Volo',
    'mapLegend.routeTypes': 'Tipo Rotte',
    'mapLegend.normalMissions': 'Missioni Normal',
    'mapLegend.uniqueMissions': 'Missioni Unique',
    'mapLegend.shuttles': 'Shuttles',
    
    // Interactive Map
    'interactiveMap.enterFullscreen': 'Schermo Intero',
    'interactiveMap.exitFullscreen': 'Esci da Schermo Intero',
    
    // Element Counters
    'elements.scripts': 'Scripts',
    'elements.missions': 'Missioni',
    'elements.semaphores': 'Semafori',
    'elements.labels': 'Etichette',
    'elements.characters': 'Personaggi',
    'elements.variables': 'Variabili',
    'elements.images': 'Immagini',
    'elements.achievements': 'Obiettivi',
    
    // Variables System
    'variablesSystem.title': 'Variables & System',
    'variablesSystem.description': 'Gestisci e analizza tutti gli elementi della campagna',
    'variablesSystem.searchPlaceholder': 'Cerca',
    'variablesSystem.loadingData': 'Caricamento dati in corso...',
    'variablesSystem.errorLoading': 'Errore nel caricamento',
    'variablesSystem.retry': 'Riprova',
    'variablesSystem.sortBy': 'Ordina per',
    'variablesSystem.name': 'Nome',
    'variablesSystem.usage': 'Utilizzo',
    'variablesSystem.noResults': 'Nessun elemento trovato',
    'variablesSystem.tryDifferentSearch': 'Prova a modificare i criteri di ricerca',
    'variablesSystem.selectItem': 'Seleziona un elemento per vedere i dettagli',
    'variablesSystem.usedIn': 'Usato in:',
    'variablesSystem.others': 'altri',
    'variablesSystem.operations': 'Operazioni',
    'variablesSystem.position': 'Posizione',
    'variablesSystem.objectives': 'obiettivi',
    'variablesSystem.hidden': 'Nascosto',
    'variablesSystem.repeatable': 'Ripetibile',
    'variablesSystem.points': 'pts',
    
    // Script Selector
    'scriptSelector.searchScripts': 'Cerca scripts e missioni...',
    'scriptSelector.starScripts': 'Script Stella',
    'scriptSelector.otherScripts': 'Altri Script',
    'scriptSelector.uniqueMissions': 'Missioni Unique',
    'scriptSelector.normalMissions': 'Missioni Normal',
    'scriptSelector.noScriptsFound': 'Nessuno script trovato',
    'scriptSelector.noMissionsFound': 'Nessuna missione trovata',
    'scriptSelector.noScriptsAvailable': 'Nessuno script disponibile',
    'scriptSelector.noMissionsAvailable': 'Nessuna missione disponibile',
    
    // Tooltips
    'tooltip.interactiveButtons': 'Pulsanti Interattivi:',
    'tooltip.routes': 'Rotte:',
    'tooltip.scripts': 'Script:',
    'tooltip.buttons': 'Pulsanti:',
    'tooltip.license': 'Licenza:',
    'tooltip.type': 'Tipo:',
    
    // Common
    'common.usedIn': 'Usato in:',
    'common.others': 'altri',
    
    // ListView
    'listView.noElementsFound': 'Nessun elemento trovato',
    'listView.tryModifyingSearch': 'Prova a modificare i criteri di ricerca',
    
    // CharacterView
    'characterView.character': 'Personaggio',
    'characterView.uses': 'utilizzi',
    'characterView.availableImages': 'immagini disponibili',
    
    // VariableView
    'variableView.numericVariable': 'Variabile Numerica',
    'variableView.uses': 'utilizzi',
    'variableView.values': 'Valori',
    
    // LabelView
    'labelView.label': 'Etichetta',
    'labelView.uses': 'utilizzi',
    'labelView.script': 'Script',
    'labelView.line': 'Linea',
    'labelView.references': 'Riferimenti',
    'labelView.otherReferences': 'altri riferimenti',
    
    // AchievementView
    'achievementView.objectives': 'obiettivi',
    'achievementView.hidden': 'Nascosto',
    'achievementView.repeatable': 'Ripetibile',
    
    // SemaforoView
    'semaforoView.semaphore': 'Semaforo',
    'semaforoView.uses': 'utilizzi',
    'semaforoView.finalState': 'Stato finale',
    
    // ImageView
    'imageView.modified': 'Modificato',
    'imageView.depth': 'Profondità',
    
    // DetailView
    'detailView.selectElement': 'Seleziona un elemento per visualizzarne i dettagli',
    'detailView.initialValue': 'Valore iniziale',
    'detailView.totalUsage': 'Utilizzi totali',
    'detailView.commandsUsed': 'Comandi utilizzati',
    'detailView.scriptsUsing': 'Script che lo utilizzano',
    'detailView.goToScript': 'Vai allo script',
    'detailView.numericVariable': 'Variabile Numerica',
    'detailView.semaphore': 'Semaforo',
    'detailView.label': 'Etichetta',
    'detailView.character': 'Personaggio',
    'detailView.image': 'Immagine',
    'detailView.achievement': 'Obiettivo',
    'detailView.labelDefinition': 'Definizione Label',
    'detailView.labelReferences': 'Riferimenti',
    'detailView.goToDefinition': 'Vai alla definizione',
    'detailView.goToLine': 'Vai',
    'charactersView.charactersList': 'Personaggi',
    'charactersView.visible': 'Visibile',
    'charactersView.hidden': 'Nascosto',
    'charactersView.visibleInGame': 'Visibile nel gioco',
    'charactersView.hiddenInGame': 'Nascosto nel gioco',
    'charactersView.basicInfo': 'Informazioni Base',
    'charactersView.internalName': 'Nome interno',
    'charactersView.visibility': 'Visibilità',
    'charactersView.scriptCount': 'Numero script',
    'charactersView.imageGallery': 'Galleria Immagini',
    'charactersView.scriptsUsing': 'Script che lo usano',
    'charactersView.goToScript': 'Vai allo script',
    'charactersView.selectCharacter': 'Seleziona un personaggio',
    'charactersView.imagePreview': 'Anteprima Immagine',
    'charactersView.noImageSelected': 'Nessuna immagine selezionata',
    'charactersView.totalUsage': 'Utilizzo totale',
    'charactersView.usedInScripts': 'Usato negli script',
    'charactersView.commands': 'Comandi'
  },
  
  CS: {
    // Common
    'common.loading': 'Načítání...',
    'common.error': 'Chyba',
    'common.save': 'Uložit',
    'common.cancel': 'Zrušit',
    'common.close': 'Zavřít',
    'common.search': 'Hledat',
    'common.refresh': 'Obnovit',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.connected': 'Připojeno',
    'common.connecting': 'Připojování...',
    'common.noData': 'Žádná data k dispozici',
    
    // Header
    'header.title': 'Galaxy Trucker Editor',
    'header.saveAll': 'Uložit vše',
    'header.update': 'Aktualizovat',
    'header.exportTooltip': 'Exportovat vše',
    'header.importTooltip': 'Importovat soubor',
    'header.refreshTooltip': 'Znovu načíst data',
    
    // Tabs
    'tabs.interactiveMap': 'Interaktivní mapa',
    'tabs.visualFlowEditor': 'Vizuální editor toku',
    'tabs.variablesSystem': 'Proměnné a systém',
    'tabs.overview': 'Přehled',
    
    // Campaign Editor
    'campaignEditor.title': 'Kompletní editor kampaně',
    'campaignEditor.description': 'Interaktivní editování skriptů založené na mapě s kompletní vizualizací toku',
    'campaignEditor.interactiveMapTitle': 'Interaktivní mapa kampaně',
    
    // Sidebar
    'sidebar.navigation': 'Navigace',
    'sidebar.campaign': 'Kampaň',
    'sidebar.translations': 'Překlady',
    'sidebar.footerTitle': 'Galaxy Trucker Editor',
    'sidebar.footerSubtitle': 'Založeno na Marmalade SDK',
    
    // Overview
    'overview.title': 'Přehled kampaně',
    'overview.description': 'Komplexní analýza struktury a obsahu vaší kampaně',
    'overview.loading': 'Načítání dat přehledu...',
    'overview.noCampaignData': 'Žádná data kampaně',
    'overview.loadCampaignMessage': 'Načtěte skripty kampaně pro zobrazení statistik přehledu',
    'overview.scripts': 'Skripty',
    'overview.variables': 'Proměnné',
    'overview.characters': 'Postavy',
    'overview.missions': 'Mise',
    'overview.totalCommands': 'celkem příkazů',
    'overview.semaphores': 'semafory',
    'overview.numeric': 'numerické',
    'overview.missionsReferenced': 'referencované mise',
    'overview.languageDistribution': 'Distribuce jazyků',
    'overview.complexityAnalysis': 'Analýza složitosti',
    'overview.averageCommandsPerScript': 'Průměrné příkazy na skript',
    'overview.mostComplexScript': 'Nejsložitější skript',
    'overview.scriptConnections': 'Spojení skriptů',
    'overview.campaignEntities': 'Entity kampaně',
    'overview.labels': 'Štítky',
    'overview.avgPerScript': 'průměr na skript',
    'overview.commands': 'příkazy',
    
    // Map Controls
    'mapControls.title': 'Ovládání',
    'mapControls.zoomIn': 'Přiblížit (+)',
    'mapControls.zoomOut': 'Oddálit (-)',
    'mapControls.centerNewbie': 'Vystředit na Port Newbie',
    'mapControls.resetView': 'Obnovit zobrazení (Střed + 100%)',
    
    // Map Legend
    'mapLegend.title': 'Legenda',
    'mapLegend.flightLicenses': 'Letové licence',
    'mapLegend.routeTypes': 'Typy tras',
    'mapLegend.normalMissions': 'Normální mise',
    'mapLegend.uniqueMissions': 'Jedinečné mise',
    'mapLegend.shuttles': 'Kyvadlová doprava',
    
    // Interactive Map
    'interactiveMap.enterFullscreen': 'Celá obrazovka',
    'interactiveMap.exitFullscreen': 'Opustit celou obrazovku',
    
    // Element Counters
    'elements.scripts': 'Skripty',
    'elements.missions': 'Mise',
    'elements.semaphores': 'Semafory',
    'elements.labels': 'Štítky',
    'elements.characters': 'Postavy',
    'elements.variables': 'Proměnné',
    'elements.images': 'Obrázky',
    'elements.achievements': 'Úspěchy',
    
    // Variables System
    'variablesSystem.title': 'Proměnné a systém',
    'variablesSystem.description': 'Spravujte a analyzujte všechny prvky kampaně',
    'variablesSystem.searchPlaceholder': 'Hledat',
    'variablesSystem.loadingData': 'Načítání dat...',
    'variablesSystem.errorLoading': 'Chyba při načítání',
    'variablesSystem.retry': 'Zkusit znovu',
    'variablesSystem.sortBy': 'Seřadit podle',
    'variablesSystem.name': 'Název',
    'variablesSystem.usage': 'Použití',
    'variablesSystem.noResults': 'Žádné položky nenalezeny',
    'variablesSystem.tryDifferentSearch': 'Zkuste upravit kritéria vyhledávání',
    'variablesSystem.selectItem': 'Vyberte položku pro zobrazení podrobností',
    'variablesSystem.usedIn': 'Použito v:',
    'variablesSystem.others': 'další',
    'variablesSystem.operations': 'Operace',
    'variablesSystem.position': 'Pozice',
    'variablesSystem.objectives': 'cíle',
    'variablesSystem.hidden': 'Skryté',
    'variablesSystem.repeatable': 'Opakovatelné',
    'variablesSystem.points': 'bodů',
    
    // Script Selector
    'scriptSelector.searchScripts': 'Hledat skripty a mise...',
    'scriptSelector.starScripts': 'Hvězdné skripty',
    'scriptSelector.otherScripts': 'Ostatní skripty',
    'scriptSelector.uniqueMissions': 'Jedinečné mise',
    'scriptSelector.normalMissions': 'Normální mise',
    'scriptSelector.noScriptsFound': 'Žádné skripty nenalezeny',
    'scriptSelector.noMissionsFound': 'Žádné mise nenalezeny',
    'scriptSelector.noScriptsAvailable': 'Žádné skripty k dispozici',
    'scriptSelector.noMissionsAvailable': 'Žádné mise k dispozici',
    
    // Tooltips
    'tooltip.interactiveButtons': 'Interaktivní tlačítka:',
    'tooltip.routes': 'Trasy:',
    'tooltip.scripts': 'Skripty:',
    'tooltip.buttons': 'Tlačítka:',
    'tooltip.license': 'Licence:',
    'tooltip.type': 'Typ:',
    
    // Common
    'common.usedIn': 'Použito v:',
    'common.others': 'další',
    
    // ListView
    'listView.noElementsFound': 'Žádné prvky nenalezeny',
    'listView.tryModifyingSearch': 'Zkuste upravit kritéria vyhledávání',
    
    // CharacterView
    'characterView.character': 'Postava',
    'characterView.uses': 'použití',
    'characterView.availableImages': 'dostupné obrázky',
    
    // VariableView
    'variableView.numericVariable': 'Číselná proměnná',
    'variableView.uses': 'použití',
    'variableView.values': 'Hodnoty',
    
    // LabelView
    'labelView.label': 'Štítek',
    'labelView.uses': 'použití',
    'labelView.script': 'Skript',
    'labelView.line': 'Řádek',
    'labelView.references': 'Reference',
    'labelView.otherReferences': 'další reference',
    
    // AchievementView
    'achievementView.objectives': 'cíle',
    'achievementView.hidden': 'Skryté',
    'achievementView.repeatable': 'Opakovatelné',
    
    // SemaforoView
    'semaforoView.semaphore': 'Semafor',
    'semaforoView.uses': 'použití',
    'semaforoView.finalState': 'Konečný stav',
    
    // ImageView
    'imageView.modified': 'Upraveno',
    'imageView.depth': 'Hloubka',
    
    // DetailView
    'detailView.selectElement': 'Vyberte prvek pro zobrazení podrobností',
    'detailView.initialValue': 'Počáteční hodnota',
    'detailView.totalUsage': 'Celkové použití',
    'detailView.commandsUsed': 'Použité příkazy',
    'detailView.scriptsUsing': 'Skripty používající',
    'detailView.goToScript': 'Přejít na skript',
    'detailView.numericVariable': 'Číselná proměnná',
    'detailView.semaphore': 'Semafor',
    'detailView.label': 'Štítek',
    'detailView.character': 'Postava',
    'detailView.image': 'Obrázek',
    'detailView.achievement': 'Úspěch',
    'detailView.labelDefinition': 'Definice štítku',
    'detailView.labelReferences': 'Reference',
    'detailView.goToDefinition': 'Přejít na definici',
    'detailView.goToLine': 'Přejít',
    'charactersView.charactersList': 'Postavy',
    'charactersView.visible': 'Viditelné',
    'charactersView.hidden': 'Skryté',
    'charactersView.visibleInGame': 'Viditelné ve hře',
    'charactersView.hiddenInGame': 'Skryté ve hře',
    'charactersView.basicInfo': 'Základní informace',
    'charactersView.internalName': 'Interní název',
    'charactersView.visibility': 'Viditelnost',
    'charactersView.scriptCount': 'Počet skriptů',
    'charactersView.imageGallery': 'Galerie obrázků',
    'charactersView.scriptsUsing': 'Používající skripty',
    'charactersView.goToScript': 'Přejít na skript',
    'charactersView.selectCharacter': 'Vyberte postavu',
    'charactersView.imagePreview': 'Náhled obrázku',
    'charactersView.noImageSelected': 'Žádný obrázek není vybrán',
    'charactersView.totalUsage': 'Celkové použití',
    'charactersView.usedInScripts': 'Použito ve skriptech',
    'charactersView.commands': 'Příkazy'
  },
  
  DE: {
    // Common
    'common.loading': 'Lädt...',
    'common.error': 'Fehler',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.close': 'Schließen',
    'common.search': 'Suchen',
    'common.refresh': 'Aktualisieren',
    'common.export': 'Exportieren',
    'common.import': 'Importieren',
    'common.connected': 'Verbunden',
    'common.connecting': 'Verbinde...',
    'common.noData': 'Keine Daten verfügbar',
    
    // Header
    'header.title': 'Galaxy Trucker Editor',
    'header.saveAll': 'Alles speichern',
    'header.update': 'Aktualisieren',
    'header.exportTooltip': 'Alles exportieren',
    'header.importTooltip': 'Datei importieren',
    'header.refreshTooltip': 'Daten neu laden',
    
    // Tabs
    'tabs.interactiveMap': 'Interaktive Karte',
    'tabs.visualFlowEditor': 'Visueller Flow-Editor',
    'tabs.variablesSystem': 'Variablen & System',
    'tabs.overview': 'Übersicht',
    
    // Campaign Editor
    'campaignEditor.title': 'Vollständiger Kampagnen-Editor',
    'campaignEditor.description': 'Interaktive kartenbasierte Skriptbearbeitung mit vollständiger Flow-Visualisierung',
    'campaignEditor.interactiveMapTitle': 'Interaktive Kampagnenkarte',
    
    // Sidebar
    'sidebar.navigation': 'Navigation',
    'sidebar.campaign': 'Kampagne',
    'sidebar.translations': 'Übersetzungen',
    'sidebar.footerTitle': 'Galaxy Trucker Editor',
    'sidebar.footerSubtitle': 'Basierend auf Marmalade SDK',
    
    // Overview
    'overview.title': 'Kampagnenübersicht',
    'overview.description': 'Umfassende Analyse Ihrer Kampagnenstruktur und -inhalte',
    'overview.loading': 'Übersichtsdaten werden geladen...',
    'overview.noCampaignData': 'Keine Kampagnendaten',
    'overview.loadCampaignMessage': 'Laden Sie Kampagnenskripte, um Übersichtsstatistiken zu sehen',
    'overview.scripts': 'Skripte',
    'overview.variables': 'Variablen',
    'overview.characters': 'Charaktere',
    'overview.missions': 'Missionen',
    'overview.totalCommands': 'Befehle insgesamt',
    'overview.semaphores': 'Semaphore',
    'overview.numeric': 'numerisch',
    'overview.missionsReferenced': 'referenzierte Missionen',
    'overview.languageDistribution': 'Sprachverteilung',
    'overview.complexityAnalysis': 'Komplexitätsanalyse',
    'overview.averageCommandsPerScript': 'Durchschnittliche Befehle pro Skript',
    'overview.mostComplexScript': 'Komplexestes Skript',
    'overview.scriptConnections': 'Skriptverbindungen',
    'overview.campaignEntities': 'Kampagnenentitäten',
    'overview.labels': 'Etiketten',
    'overview.avgPerScript': 'Durchschnitt pro Skript',
    'overview.commands': 'Befehle',
    
    // Map Controls
    'mapControls.title': 'Steuerung',
    'mapControls.zoomIn': 'Vergrößern (+)',
    'mapControls.zoomOut': 'Verkleinern (-)',
    'mapControls.centerNewbie': 'Auf Port Newbie zentrieren',
    'mapControls.resetView': 'Ansicht zurücksetzen (Mitte + 100%)',
    
    // Map Legend
    'mapLegend.title': 'Legende',
    'mapLegend.flightLicenses': 'Fluglizenzen',
    'mapLegend.routeTypes': 'Routentypen',
    'mapLegend.normalMissions': 'Normale Missionen',
    'mapLegend.uniqueMissions': 'Einzigartige Missionen',
    'mapLegend.shuttles': 'Shuttles',
    
    // Interactive Map
    'interactiveMap.enterFullscreen': 'Vollbild',
    'interactiveMap.exitFullscreen': 'Vollbild verlassen',
    
    // Element Counters
    'elements.scripts': 'Skripte',
    'elements.missions': 'Missionen',
    'elements.semaphores': 'Semaphore',
    'elements.labels': 'Etiketten',
    'elements.characters': 'Charaktere',
    'elements.variables': 'Variablen',
    'elements.images': 'Bilder',
    'elements.achievements': 'Erfolge',
    
    // Variables System
    'variablesSystem.title': 'Variablen & System',
    'variablesSystem.description': 'Verwalten und analysieren Sie alle Kampagnenelemente',
    'variablesSystem.searchPlaceholder': 'Suchen',
    'variablesSystem.loadingData': 'Daten werden geladen...',
    'variablesSystem.errorLoading': 'Fehler beim Laden',
    'variablesSystem.retry': 'Erneut versuchen',
    'variablesSystem.sortBy': 'Sortieren nach',
    'variablesSystem.name': 'Name',
    'variablesSystem.usage': 'Verwendung',
    'variablesSystem.noResults': 'Keine Elemente gefunden',
    'variablesSystem.tryDifferentSearch': 'Versuchen Sie, Ihre Suchkriterien zu ändern',
    'variablesSystem.selectItem': 'Wählen Sie ein Element aus, um Details anzuzeigen',
    'variablesSystem.usedIn': 'Verwendet in:',
    'variablesSystem.others': 'andere',
    'variablesSystem.operations': 'Operationen',
    'variablesSystem.position': 'Position',
    'variablesSystem.objectives': 'Ziele',
    'variablesSystem.hidden': 'Versteckt',
    'variablesSystem.repeatable': 'Wiederholbar',
    'variablesSystem.points': 'Pkt',
    
    // Script Selector
    'scriptSelector.searchScripts': 'Skripte und Missionen suchen...',
    'scriptSelector.starScripts': 'Stern-Skripte',
    'scriptSelector.otherScripts': 'Andere Skripte',
    'scriptSelector.uniqueMissions': 'Einzigartige Missionen',
    'scriptSelector.normalMissions': 'Normale Missionen',
    'scriptSelector.noScriptsFound': 'Keine Skripte gefunden',
    'scriptSelector.noMissionsFound': 'Keine Missionen gefunden',
    'scriptSelector.noScriptsAvailable': 'Keine Skripte verfügbar',
    'scriptSelector.noMissionsAvailable': 'Keine Missionen verfügbar',
    
    // Tooltips
    'tooltip.interactiveButtons': 'Interaktive Schaltflächen:',
    'tooltip.routes': 'Routen:',
    'tooltip.scripts': 'Skripte:',
    'tooltip.buttons': 'Schaltflächen:',
    'tooltip.license': 'Lizenz:',
    'tooltip.type': 'Typ:',
    
    // Common
    'common.usedIn': 'Verwendet in:',
    'common.others': 'andere',
    
    // ListView
    'listView.noElementsFound': 'Keine Elemente gefunden',
    'listView.tryModifyingSearch': 'Versuchen Sie, die Suchkriterien zu ändern',
    
    // CharacterView
    'characterView.character': 'Charakter',
    'characterView.uses': 'Verwendungen',
    'characterView.availableImages': 'verfügbare Bilder',
    
    // VariableView
    'variableView.numericVariable': 'Numerische Variable',
    'variableView.uses': 'Verwendungen',
    'variableView.values': 'Werte',
    
    // LabelView
    'labelView.label': 'Etikett',
    'labelView.uses': 'Verwendungen',
    'labelView.script': 'Skript',
    'labelView.line': 'Zeile',
    'labelView.references': 'Referenzen',
    'labelView.otherReferences': 'weitere Referenzen',
    
    // AchievementView
    'achievementView.objectives': 'Ziele',
    'achievementView.hidden': 'Versteckt',
    'achievementView.repeatable': 'Wiederholbar',
    
    // SemaforoView
    'semaforoView.semaphore': 'Semaphor',
    'semaforoView.uses': 'Verwendungen',
    'semaforoView.finalState': 'Endzustand',
    
    // ImageView
    'imageView.modified': 'Geändert',
    'imageView.depth': 'Tiefe',
    
    // DetailView
    'detailView.selectElement': 'Element auswählen, um Details anzuzeigen',
    'detailView.initialValue': 'Anfangswert',
    'detailView.totalUsage': 'Gesamtnutzung',
    'detailView.commandsUsed': 'Verwendete Befehle',
    'detailView.scriptsUsing': 'Skripte, die es verwenden',
    'detailView.goToScript': 'Zum Skript gehen',
    'detailView.numericVariable': 'Numerische Variable',
    'detailView.semaphore': 'Semaphor',
    'detailView.label': 'Etikett',
    'detailView.character': 'Charakter',
    'detailView.image': 'Bild',
    'detailView.achievement': 'Erfolg',
    'detailView.labelDefinition': 'Label-Definition',
    'detailView.labelReferences': 'Verweise',
    'detailView.goToDefinition': 'Zur Definition gehen',
    'detailView.goToLine': 'Gehen',
    'charactersView.charactersList': 'Charaktere',
    'charactersView.visible': 'Sichtbar',
    'charactersView.hidden': 'Versteckt',
    'charactersView.visibleInGame': 'Im Spiel sichtbar',
    'charactersView.hiddenInGame': 'Im Spiel versteckt',
    'charactersView.basicInfo': 'Grundinformationen',
    'charactersView.internalName': 'Interner Name',
    'charactersView.visibility': 'Sichtbarkeit',
    'charactersView.scriptCount': 'Skriptanzahl',
    'charactersView.imageGallery': 'Bildergalerie',
    'charactersView.scriptsUsing': 'Verwendende Skripte',
    'charactersView.goToScript': 'Zum Skript gehen',
    'charactersView.selectCharacter': 'Wählen Sie einen Charakter',
    'charactersView.imagePreview': 'Bildvorschau',
    'charactersView.noImageSelected': 'Kein Bild ausgewählt',
    'charactersView.totalUsage': 'Gesamtnutzung',
    'charactersView.usedInScripts': 'In Skripten verwendet',
    'charactersView.commands': 'Befehle'
  },
  
  ES: {
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.close': 'Cerrar',
    'common.search': 'Buscar',
    'common.refresh': 'Actualizar',
    'common.export': 'Exportar',
    'common.import': 'Importar',
    'common.connected': 'Conectado',
    'common.connecting': 'Conectando...',
    'common.noData': 'No hay datos disponibles',
    
    // Header
    'header.title': 'Galaxy Trucker Editor',
    'header.saveAll': 'Guardar todo',
    'header.update': 'Actualizar',
    'header.exportTooltip': 'Exportar todo',
    'header.importTooltip': 'Importar archivo',
    'header.refreshTooltip': 'Recargar datos',
    
    // Tabs
    'tabs.interactiveMap': 'Mapa interactivo',
    'tabs.visualFlowEditor': 'Editor de Flujo Visual',
    'tabs.variablesSystem': 'Variables y sistema',
    'tabs.overview': 'Vista general',
    
    // Campaign Editor
    'campaignEditor.title': 'Editor de Campaña Completo',
    'campaignEditor.description': 'Edición de scripts basada en mapa interactivo con visualización completa del flujo',
    'campaignEditor.interactiveMapTitle': 'Mapa de Campaña Interactivo',
    
    // Sidebar
    'sidebar.navigation': 'Navegación',
    'sidebar.campaign': 'Campaña',
    'sidebar.translations': 'Traducciones',
    'sidebar.footerTitle': 'Galaxy Trucker Editor',
    'sidebar.footerSubtitle': 'Basado en Marmalade SDK',
    
    // Overview
    'overview.title': 'Vista general de la campaña',
    'overview.description': 'Análisis integral de la estructura y contenido de tu campaña',
    'overview.loading': 'Cargando datos de vista general...',
    'overview.noCampaignData': 'Sin datos de campaña',
    'overview.loadCampaignMessage': 'Carga los scripts de campaña para ver las estadísticas de vista general',
    'overview.scripts': 'Scripts',
    'overview.variables': 'Variables',
    'overview.characters': 'Personajes',
    'overview.missions': 'Misiones',
    'overview.totalCommands': 'comandos totales',
    'overview.semaphores': 'semáforos',
    'overview.numeric': 'numérico',
    'overview.missionsReferenced': 'misiones referenciadas',
    'overview.languageDistribution': 'Distribución de idiomas',
    'overview.complexityAnalysis': 'Análisis de complejidad',
    'overview.averageCommandsPerScript': 'Comandos promedio por script',
    'overview.mostComplexScript': 'Script más complejo',
    'overview.scriptConnections': 'Conexiones de scripts',
    'overview.campaignEntities': 'Entidades de campaña',
    'overview.labels': 'Etiquetas',
    'overview.avgPerScript': 'promedio por script',
    'overview.commands': 'comandos',
    
    // Map Controls
    'mapControls.title': 'Controles',
    'mapControls.zoomIn': 'Acercar (+)',
    'mapControls.zoomOut': 'Alejar (-)',
    'mapControls.centerNewbie': 'Centrar en Port Newbie',
    'mapControls.resetView': 'Restablecer vista (Centro + 100%)',
    
    // Map Legend
    'mapLegend.title': 'Leyenda',
    'mapLegend.flightLicenses': 'Licencias de vuelo',
    'mapLegend.routeTypes': 'Tipos de rutas',
    'mapLegend.normalMissions': 'Misiones normales',
    'mapLegend.uniqueMissions': 'Misiones únicas',
    'mapLegend.shuttles': 'Lanzaderas',
    
    // Interactive Map
    'interactiveMap.enterFullscreen': 'Pantalla completa',
    'interactiveMap.exitFullscreen': 'Salir pantalla completa',
    
    // Element Counters
    'elements.scripts': 'Scripts',
    'elements.missions': 'Misiones',
    'elements.semaphores': 'Semáforos',
    'elements.labels': 'Etiquetas',
    'elements.characters': 'Personajes',
    'elements.variables': 'Variables',
    'elements.images': 'Imágenes',
    'elements.achievements': 'Logros',
    
    // Variables System
    'variablesSystem.title': 'Variables y Sistema',
    'variablesSystem.description': 'Gestiona y analiza todos los elementos de la campaña',
    'variablesSystem.searchPlaceholder': 'Buscar',
    'variablesSystem.loadingData': 'Cargando datos...',
    'variablesSystem.errorLoading': 'Error al cargar',
    'variablesSystem.retry': 'Reintentar',
    'variablesSystem.sortBy': 'Ordenar por',
    'variablesSystem.name': 'Nombre',
    'variablesSystem.usage': 'Uso',
    'variablesSystem.noResults': 'No se encontraron elementos',
    'variablesSystem.tryDifferentSearch': 'Intenta modificar tus criterios de búsqueda',
    'variablesSystem.selectItem': 'Selecciona un elemento para ver detalles',
    'variablesSystem.usedIn': 'Usado en:',
    'variablesSystem.others': 'otros',
    'variablesSystem.operations': 'Operaciones',
    'variablesSystem.position': 'Posición',
    'variablesSystem.objectives': 'objetivos',
    'variablesSystem.hidden': 'Oculto',
    'variablesSystem.repeatable': 'Repetible',
    'variablesSystem.points': 'pts',
    
    // Script Selector
    'scriptSelector.searchScripts': 'Buscar scripts y misiones...',
    'scriptSelector.starScripts': 'Scripts estrella',
    'scriptSelector.otherScripts': 'Otros scripts',
    'scriptSelector.uniqueMissions': 'Misiones únicas',
    'scriptSelector.normalMissions': 'Misiones normales',
    'scriptSelector.noScriptsFound': 'No se encontraron scripts',
    'scriptSelector.noMissionsFound': 'No se encontraron misiones',
    'scriptSelector.noScriptsAvailable': 'No hay scripts disponibles',
    'scriptSelector.noMissionsAvailable': 'No hay misiones disponibles',
    
    // Tooltips
    'tooltip.interactiveButtons': 'Botones interactivos:',
    'tooltip.routes': 'Rutas:',
    'tooltip.scripts': 'Scripts:',
    'tooltip.buttons': 'Botones:',
    'tooltip.license': 'Licencia:',
    'tooltip.type': 'Tipo:',
    
    // Common
    'common.usedIn': 'Usado en:',
    'common.others': 'otros',
    
    // ListView
    'listView.noElementsFound': 'No se encontraron elementos',
    'listView.tryModifyingSearch': 'Intenta modificar los criterios de búsqueda',
    
    // CharacterView
    'characterView.character': 'Personaje',
    'characterView.uses': 'usos',
    'characterView.availableImages': 'imágenes disponibles',
    
    // VariableView
    'variableView.numericVariable': 'Variable Numérica',
    'variableView.uses': 'usos',
    'variableView.values': 'Valores',
    
    // LabelView
    'labelView.label': 'Etiqueta',
    'labelView.uses': 'usos',
    'labelView.script': 'Script',
    'labelView.line': 'Línea',
    'labelView.references': 'Referencias',
    'labelView.otherReferences': 'otras referencias',
    
    // AchievementView
    'achievementView.objectives': 'objetivos',
    'achievementView.hidden': 'Oculto',
    'achievementView.repeatable': 'Repetible',
    
    // SemaforoView
    'semaforoView.semaphore': 'Semáforo',
    'semaforoView.uses': 'usos',
    'semaforoView.finalState': 'Estado final',
    
    // ImageView
    'imageView.modified': 'Modificado',
    'imageView.depth': 'Profundidad',
    
    // DetailView
    'detailView.selectElement': 'Selecciona un elemento para ver los detalles',
    'detailView.initialValue': 'Valor inicial',
    'detailView.totalUsage': 'Uso total',
    'detailView.commandsUsed': 'Comandos utilizados',
    'detailView.scriptsUsing': 'Scripts que lo usan',
    'detailView.goToScript': 'Ir al script',
    'detailView.numericVariable': 'Variable Numérica',
    'detailView.semaphore': 'Semáforo',
    'detailView.label': 'Etiqueta',
    'detailView.character': 'Personaje',
    'detailView.image': 'Imagen',
    'detailView.achievement': 'Logro',
    'detailView.labelDefinition': 'Definición de etiqueta',
    'detailView.labelReferences': 'Referencias',
    'detailView.goToDefinition': 'Ir a la definición',
    'detailView.goToLine': 'Ir',
    'charactersView.charactersList': 'Personajes',
    'charactersView.visible': 'Visible',
    'charactersView.hidden': 'Oculto',
    'charactersView.visibleInGame': 'Visible en el juego',
    'charactersView.hiddenInGame': 'Oculto en el juego',
    'charactersView.basicInfo': 'Información Básica',
    'charactersView.internalName': 'Nombre interno',
    'charactersView.visibility': 'Visibilidad',
    'charactersView.scriptCount': 'Número de scripts',
    'charactersView.imageGallery': 'Galería de Imágenes',
    'charactersView.scriptsUsing': 'Scripts que lo usan',
    'charactersView.goToScript': 'Ir al script',
    'charactersView.selectCharacter': 'Selecciona un personaje',
    'charactersView.imagePreview': 'Vista Previa de Imagen',
    'charactersView.noImageSelected': 'Ninguna imagen seleccionada',
    'charactersView.totalUsage': 'Uso total',
    'charactersView.usedInScripts': 'Usado en scripts',
    'charactersView.commands': 'Comandos'
  },
  
  FR: {
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.search': 'Rechercher',
    'common.refresh': 'Actualiser',
    'common.export': 'Exporter',
    'common.import': 'Importer',
    'common.connected': 'Connecté',
    'common.connecting': 'Connexion...',
    'common.noData': 'Aucune donnée disponible',
    
    // Header
    'header.title': 'Galaxy Trucker Editor',
    'header.saveAll': 'Tout enregistrer',
    'header.update': 'Mettre à jour',
    'header.exportTooltip': 'Tout exporter',
    'header.importTooltip': 'Importer un fichier',
    'header.refreshTooltip': 'Recharger les données',
    
    // Tabs
    'tabs.interactiveMap': 'Carte interactive',
    'tabs.visualFlowEditor': 'Éditeur de Flux Visuel',
    'tabs.variablesSystem': 'Variables et système',
    'tabs.overview': 'Vue d\'ensemble',
    
    // Campaign Editor
    'campaignEditor.title': 'Éditeur de Campagne Complet',
    'campaignEditor.description': 'Édition de scripts basée sur une carte interactive avec visualisation complète du flux',
    'campaignEditor.interactiveMapTitle': 'Carte de Campagne Interactive',
    
    // Sidebar
    'sidebar.navigation': 'Navigation',
    'sidebar.campaign': 'Campagne',
    'sidebar.translations': 'Traductions',
    'sidebar.footerTitle': 'Galaxy Trucker Editor',
    'sidebar.footerSubtitle': 'Basé sur Marmalade SDK',
    
    // Overview
    'overview.title': 'Vue d\'ensemble de la campagne',
    'overview.description': 'Analyse complète de la structure et du contenu de votre campagne',
    'overview.loading': 'Chargement des données de vue d\'ensemble...',
    'overview.noCampaignData': 'Aucune donnée de campagne',
    'overview.loadCampaignMessage': 'Chargez les scripts de campagne pour voir les statistiques de vue d\'ensemble',
    'overview.scripts': 'Scripts',
    'overview.variables': 'Variables',
    'overview.characters': 'Personnages',
    'overview.missions': 'Missions',
    'overview.totalCommands': 'commandes totales',
    'overview.semaphores': 'sémaphores',
    'overview.numeric': 'numérique',
    'overview.missionsReferenced': 'missions référencées',
    'overview.languageDistribution': 'Distribution des langues',
    'overview.complexityAnalysis': 'Analyse de complexité',
    'overview.averageCommandsPerScript': 'Commandes moyennes par script',
    'overview.mostComplexScript': 'Script le plus complexe',
    'overview.scriptConnections': 'Connexions de scripts',
    'overview.campaignEntities': 'Entités de campagne',
    'overview.labels': 'Étiquettes',
    'overview.avgPerScript': 'moyenne par script',
    'overview.commands': 'commandes',
    
    // Map Controls
    'mapControls.title': 'Contrôles',
    'mapControls.zoomIn': 'Zoom avant (+)',
    'mapControls.zoomOut': 'Zoom arrière (-)',
    'mapControls.centerNewbie': 'Centrer sur Port Newbie',
    'mapControls.resetView': 'Réinitialiser la vue (Centre + 100%)',
    
    // Map Legend
    'mapLegend.title': 'Légende',
    'mapLegend.flightLicenses': 'Licences de vol',
    'mapLegend.routeTypes': 'Types de routes',
    'mapLegend.normalMissions': 'Missions normales',
    'mapLegend.uniqueMissions': 'Missions uniques',
    'mapLegend.shuttles': 'Navettes',
    
    // Interactive Map
    'interactiveMap.enterFullscreen': 'Plein écran',
    'interactiveMap.exitFullscreen': 'Quitter plein écran',
    
    // Element Counters
    'elements.scripts': 'Scripts',
    'elements.missions': 'Missions',
    'elements.semaphores': 'Sémaphores',
    'elements.labels': 'Étiquettes',
    'elements.characters': 'Personnages',
    'elements.variables': 'Variables',
    'elements.images': 'Images',
    'elements.achievements': 'Succès',
    
    // Variables System
    'variablesSystem.title': 'Variables et Système',
    'variablesSystem.description': 'Gérez et analysez tous les éléments de la campagne',
    'variablesSystem.searchPlaceholder': 'Rechercher',
    'variablesSystem.loadingData': 'Chargement des données...',
    'variablesSystem.errorLoading': 'Erreur de chargement',
    'variablesSystem.retry': 'Réessayer',
    'variablesSystem.sortBy': 'Trier par',
    'variablesSystem.name': 'Nom',
    'variablesSystem.usage': 'Utilisation',
    'variablesSystem.noResults': 'Aucun élément trouvé',
    'variablesSystem.tryDifferentSearch': 'Essayez de modifier vos critères de recherche',
    'variablesSystem.selectItem': 'Sélectionnez un élément pour voir les détails',
    'variablesSystem.usedIn': 'Utilisé dans :',
    'variablesSystem.others': 'autres',
    'variablesSystem.operations': 'Opérations',
    'variablesSystem.position': 'Position',
    'variablesSystem.objectives': 'objectifs',
    'variablesSystem.hidden': 'Caché',
    'variablesSystem.repeatable': 'Répétable',
    'variablesSystem.points': 'pts',
    
    // Script Selector
    'scriptSelector.searchScripts': 'Rechercher scripts et missions...',
    'scriptSelector.starScripts': 'Scripts étoile',
    'scriptSelector.otherScripts': 'Autres scripts',
    'scriptSelector.uniqueMissions': 'Missions uniques',
    'scriptSelector.normalMissions': 'Missions normales',
    'scriptSelector.noScriptsFound': 'Aucun script trouvé',
    'scriptSelector.noMissionsFound': 'Aucune mission trouvée',
    'scriptSelector.noScriptsAvailable': 'Aucun script disponible',
    'scriptSelector.noMissionsAvailable': 'Aucune mission disponible',
    
    // Tooltips
    'tooltip.interactiveButtons': 'Boutons interactifs :',
    'tooltip.routes': 'Routes :',
    'tooltip.scripts': 'Scripts :',
    'tooltip.buttons': 'Boutons :',
    'tooltip.license': 'Licence :',
    'tooltip.type': 'Type :',
    
    // Common
    'common.usedIn': 'Utilisé dans :',
    'common.others': 'autres',
    
    // ListView
    'listView.noElementsFound': 'Aucun élément trouvé',
    'listView.tryModifyingSearch': 'Essayez de modifier les critères de recherche',
    
    // CharacterView
    'characterView.character': 'Personnage',
    'characterView.uses': 'utilisations',
    'characterView.availableImages': 'images disponibles',
    
    // VariableView
    'variableView.numericVariable': 'Variable Numérique',
    'variableView.uses': 'utilisations',
    'variableView.values': 'Valeurs',
    
    // LabelView
    'labelView.label': 'Étiquette',
    'labelView.uses': 'utilisations',
    'labelView.script': 'Script',
    'labelView.line': 'Ligne',
    'labelView.references': 'Références',
    'labelView.otherReferences': 'autres références',
    
    // AchievementView
    'achievementView.objectives': 'objectifs',
    'achievementView.hidden': 'Caché',
    'achievementView.repeatable': 'Répétable',
    
    // SemaforoView
    'semaforoView.semaphore': 'Sémaphore',
    'semaforoView.uses': 'utilisations',
    'semaforoView.finalState': 'État final',
    
    // ImageView
    'imageView.modified': 'Modifié',
    'imageView.depth': 'Profondeur',
    
    // DetailView
    'detailView.selectElement': 'Sélectionnez un élément pour voir les détails',
    'detailView.initialValue': 'Valeur initiale',
    'detailView.totalUsage': 'Utilisation totale',
    'detailView.commandsUsed': 'Commandes utilisées',
    'detailView.scriptsUsing': 'Scripts qui l\'utilisent',
    'detailView.goToScript': 'Aller au script',
    'detailView.numericVariable': 'Variable Numérique',
    'detailView.semaphore': 'Sémaphore',
    'detailView.label': 'Étiquette',
    'detailView.character': 'Personnage',
    'detailView.image': 'Image',
    'detailView.achievement': 'Succès',
    'detailView.labelDefinition': 'Définition de l\'étiquette',
    'detailView.labelReferences': 'Références',
    'detailView.goToDefinition': 'Aller à la définition',
    'detailView.goToLine': 'Aller',
    'charactersView.charactersList': 'Personnages',
    'charactersView.visible': 'Visible',
    'charactersView.hidden': 'Caché',
    'charactersView.visibleInGame': 'Visible dans le jeu',
    'charactersView.hiddenInGame': 'Caché dans le jeu',
    'charactersView.basicInfo': 'Informations de Base',
    'charactersView.internalName': 'Nom interne',
    'charactersView.visibility': 'Visibilité',
    'charactersView.scriptCount': 'Nombre de scripts',
    'charactersView.imageGallery': 'Galerie d\'Images',
    'charactersView.scriptsUsing': 'Scripts utilisant',
    'charactersView.goToScript': 'Aller au script',
    'charactersView.selectCharacter': 'Sélectionnez un personnage',
    'charactersView.imagePreview': 'Aperçu de l\'Image',
    'charactersView.noImageSelected': 'Aucune image sélectionnée',
    'charactersView.totalUsage': 'Utilisation totale',
    'charactersView.usedInScripts': 'Utilisé dans les scripts',
    'charactersView.commands': 'Commandes'
  },
  
  PL: {
    // Common
    'common.loading': 'Ładowanie...',
    'common.error': 'Błąd',
    'common.save': 'Zapisz',
    'common.cancel': 'Anuluj',
    'common.close': 'Zamknij',
    'common.search': 'Szukaj',
    'common.refresh': 'Odśwież',
    'common.export': 'Eksportuj',
    'common.import': 'Importuj',
    'common.connected': 'Połączono',
    'common.connecting': 'Łączenie...',
    'common.noData': 'Brak dostępnych danych',
    
    // Header
    'header.title': 'Galaxy Trucker Editor',
    'header.saveAll': 'Zapisz wszystko',
    'header.update': 'Aktualizuj',
    'header.exportTooltip': 'Eksportuj wszystko',
    'header.importTooltip': 'Importuj plik',
    'header.refreshTooltip': 'Przeładuj dane',
    
    // Tabs
    'tabs.interactiveMap': 'Interaktywna mapa',
    'tabs.visualFlowEditor': 'Wizualny Edytor Przepływu',
    'tabs.variablesSystem': 'Zmienne i system',
    'tabs.overview': 'Przegląd',
    
    // Campaign Editor
    'campaignEditor.title': 'Kompletny Edytor Kampanii',
    'campaignEditor.description': 'Interaktywne edytowanie skryptów oparte na mapie z pełną wizualizacją przepływu',
    'campaignEditor.interactiveMapTitle': 'Interaktywna Mapa Kampanii',
    
    // Sidebar
    'sidebar.navigation': 'Nawigacja',
    'sidebar.campaign': 'Kampania',
    'sidebar.translations': 'Tłumaczenia',
    'sidebar.footerTitle': 'Galaxy Trucker Editor',
    'sidebar.footerSubtitle': 'Oparty na Marmalade SDK',
    
    // Overview
    'overview.title': 'Przegląd kampanii',
    'overview.description': 'Kompleksowa analiza struktury i zawartości twojej kampanii',
    'overview.loading': 'Ładowanie danych przeglądu...',
    'overview.noCampaignData': 'Brak danych kampanii',
    'overview.loadCampaignMessage': 'Załaduj skrypty kampanii, aby zobaczyć statystyki przeglądu',
    'overview.scripts': 'Skrypty',
    'overview.variables': 'Zmienne',
    'overview.characters': 'Postacie',
    'overview.missions': 'Misje',
    'overview.totalCommands': 'łącznie poleceń',
    'overview.semaphores': 'semafory',
    'overview.numeric': 'numeryczne',
    'overview.missionsReferenced': 'misje odniesione',
    'overview.languageDistribution': 'Rozkład języków',
    'overview.complexityAnalysis': 'Analiza złożoności',
    'overview.averageCommandsPerScript': 'Średnie polecenia na skrypt',
    'overview.mostComplexScript': 'Najbardziej złożony skrypt',
    'overview.scriptConnections': 'Połączenia skryptów',
    'overview.campaignEntities': 'Jednostki kampanii',
    'overview.labels': 'Etykiety',
    'overview.avgPerScript': 'średnio na skrypt',
    'overview.commands': 'polecenia',
    
    // Map Controls
    'mapControls.title': 'Sterowanie',
    'mapControls.zoomIn': 'Powiększ (+)',
    'mapControls.zoomOut': 'Pomniejsz (-)',
    'mapControls.centerNewbie': 'Wyśrodkuj na Port Newbie',
    'mapControls.resetView': 'Resetuj widok (Środek + 100%)',
    
    // Map Legend
    'mapLegend.title': 'Legenda',
    'mapLegend.flightLicenses': 'Licencje lotnicze',
    'mapLegend.routeTypes': 'Typy tras',
    'mapLegend.normalMissions': 'Normalne misje',
    'mapLegend.uniqueMissions': 'Unikalne misje',
    'mapLegend.shuttles': 'Promy',
    
    // Interactive Map
    'interactiveMap.enterFullscreen': 'Pełny ekran',
    'interactiveMap.exitFullscreen': 'Opuść pełny ekran',
    
    // Element Counters
    'elements.scripts': 'Skrypty',
    'elements.missions': 'Misje',
    'elements.semaphores': 'Semafory',
    'elements.labels': 'Etykiety',
    'elements.characters': 'Postacie',
    'elements.variables': 'Zmienne',
    'elements.images': 'Obrazy',
    'elements.achievements': 'Osiągnięcia',
    
    // Variables System
    'variablesSystem.title': 'Zmienne i System',
    'variablesSystem.description': 'Zarządzaj i analizuj wszystkie elementy kampanii',
    'variablesSystem.searchPlaceholder': 'Szukaj',
    'variablesSystem.loadingData': 'Ładowanie danych...',
    'variablesSystem.errorLoading': 'Błąd ładowania',
    'variablesSystem.retry': 'Spróbuj ponownie',
    'variablesSystem.sortBy': 'Sortuj według',
    'variablesSystem.name': 'Nazwa',
    'variablesSystem.usage': 'Użycie',
    'variablesSystem.noResults': 'Nie znaleziono elementów',
    'variablesSystem.tryDifferentSearch': 'Spróbuj zmienić kryteria wyszukiwania',
    'variablesSystem.selectItem': 'Wybierz element, aby zobaczyć szczegóły',
    'variablesSystem.usedIn': 'Używane w:',
    'variablesSystem.others': 'inne',
    'variablesSystem.operations': 'Operacje',
    'variablesSystem.position': 'Pozycja',
    'variablesSystem.objectives': 'cele',
    'variablesSystem.hidden': 'Ukryte',
    'variablesSystem.repeatable': 'Powtarzalne',
    'variablesSystem.points': 'pkt',
    
    // Script Selector
    'scriptSelector.searchScripts': 'Szukaj skryptów i misji...',
    'scriptSelector.starScripts': 'Skrypty gwiazd',
    'scriptSelector.otherScripts': 'Inne skrypty',
    'scriptSelector.uniqueMissions': 'Unikalne misje',
    'scriptSelector.normalMissions': 'Normalne misje',
    'scriptSelector.noScriptsFound': 'Nie znaleziono skryptów',
    'scriptSelector.noMissionsFound': 'Nie znaleziono misji',
    'scriptSelector.noScriptsAvailable': 'Brak dostępnych skryptów',
    'scriptSelector.noMissionsAvailable': 'Brak dostępnych misji',
    
    // Tooltips
    'tooltip.interactiveButtons': 'Interaktywne przyciski:',
    'tooltip.routes': 'Trasy:',
    'tooltip.scripts': 'Skrypty:',
    'tooltip.buttons': 'Przyciski:',
    'tooltip.license': 'Licencja:',
    'tooltip.type': 'Typ:',
    
    // Common
    'common.usedIn': 'Używane w:',
    'common.others': 'inne',
    
    // ListView
    'listView.noElementsFound': 'Nie znaleziono elementów',
    'listView.tryModifyingSearch': 'Spróbuj zmienić kryteria wyszukiwania',
    
    // CharacterView
    'characterView.character': 'Postać',
    'characterView.uses': 'użyć',
    'characterView.availableImages': 'dostępne obrazy',
    
    // VariableView
    'variableView.numericVariable': 'Zmienna Numeryczna',
    'variableView.uses': 'użyć',
    'variableView.values': 'Wartości',
    
    // LabelView
    'labelView.label': 'Etykieta',
    'labelView.uses': 'użyć',
    'labelView.script': 'Skrypt',
    'labelView.line': 'Linia',
    'labelView.references': 'Odniesienia',
    'labelView.otherReferences': 'inne odniesienia',
    
    // AchievementView
    'achievementView.objectives': 'cele',
    'achievementView.hidden': 'Ukryte',
    'achievementView.repeatable': 'Powtarzalne',
    
    // SemaforoView
    'semaforoView.semaphore': 'Semafor',
    'semaforoView.uses': 'użyć',
    'semaforoView.finalState': 'Stan końcowy',
    
    // ImageView
    'imageView.modified': 'Zmodyfikowany',
    'imageView.depth': 'Głębokość',
    
    // DetailView
    'detailView.selectElement': 'Wybierz element, aby wyświetlić szczegóły',
    'detailView.initialValue': 'Wartość początkowa',
    'detailView.totalUsage': 'Całkowite użycie',
    'detailView.commandsUsed': 'Użyte polecenia',
    'detailView.scriptsUsing': 'Skrypty używające',
    'detailView.goToScript': 'Idź do skryptu',
    'detailView.numericVariable': 'Zmienna Numeryczna',
    'detailView.semaphore': 'Semafor',
    'detailView.label': 'Etykieta',
    'detailView.character': 'Postać',
    'detailView.image': 'Obraz',
    'detailView.achievement': 'Osiągnięcie',
    'detailView.labelDefinition': 'Definicja etykiety',
    'detailView.labelReferences': 'Odniesienia',
    'detailView.goToDefinition': 'Przejdź do definicji',
    'detailView.goToLine': 'Idź',
    'charactersView.charactersList': 'Postacie',
    'charactersView.visible': 'Widoczny',
    'charactersView.hidden': 'Ukryty',
    'charactersView.visibleInGame': 'Widoczny w grze',
    'charactersView.hiddenInGame': 'Ukryty w grze',
    'charactersView.basicInfo': 'Podstawowe Informacje',
    'charactersView.internalName': 'Nazwa wewnętrzna',
    'charactersView.visibility': 'Widoczność',
    'charactersView.scriptCount': 'Liczba skryptów',
    'charactersView.imageGallery': 'Galeria Obrazów',
    'charactersView.scriptsUsing': 'Używające skrypty',
    'charactersView.goToScript': 'Idź do skryptu',
    'charactersView.selectCharacter': 'Wybierz postać',
    'charactersView.imagePreview': 'Podgląd Obrazu',
    'charactersView.noImageSelected': 'Nie wybrano obrazu',
    'charactersView.totalUsage': 'Całkowite użycie',
    'charactersView.usedInScripts': 'Użyte w skryptach',
    'charactersView.commands': 'Polecenia'
  },
  
  RU: {
    // Common
    'common.loading': 'Загрузка...',
    'common.error': 'Ошибка',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.close': 'Закрыть',
    'common.search': 'Поиск',
    'common.refresh': 'Обновить',
    'common.export': 'Экспорт',
    'common.import': 'Импорт',
    'common.connected': 'Подключено',
    'common.connecting': 'Подключение...',
    'common.noData': 'Нет доступных данных',
    
    // Header
    'header.title': 'Galaxy Trucker Editor',
    'header.saveAll': 'Сохранить всё',
    'header.update': 'Обновить',
    'header.exportTooltip': 'Экспортировать всё',
    'header.importTooltip': 'Импортировать файл',
    'header.refreshTooltip': 'Перезагрузить данные',
    
    // Tabs
    'tabs.interactiveMap': 'Интерактивная карта',
    'tabs.visualFlowEditor': 'Визуальный Редактор Потока',
    'tabs.variablesSystem': 'Переменные и система',
    'tabs.overview': 'Обзор',
    
    // Campaign Editor
    'campaignEditor.title': 'Полный Редактор Кампании',
    'campaignEditor.description': 'Интерактивное редактирование скриптов на основе карты с полной визуализацией потока',
    'campaignEditor.interactiveMapTitle': 'Интерактивная Карта Кампании',
    
    // Sidebar
    'sidebar.navigation': 'Навигация',
    'sidebar.campaign': 'Кампания',
    'sidebar.translations': 'Переводы',
    'sidebar.footerTitle': 'Galaxy Trucker Editor',
    'sidebar.footerSubtitle': 'Основан на Marmalade SDK',
    
    // Overview
    'overview.title': 'Обзор кампании',
    'overview.description': 'Всесторонний анализ структуры и содержания вашей кампании',
    'overview.loading': 'Загрузка данных обзора...',
    'overview.noCampaignData': 'Нет данных кампании',
    'overview.loadCampaignMessage': 'Загрузите скрипты кампании для просмотра статистики обзора',
    'overview.scripts': 'Скрипты',
    'overview.variables': 'Переменные',
    'overview.characters': 'Персонажи',
    'overview.missions': 'Миссии',
    'overview.totalCommands': 'всего команд',
    'overview.semaphores': 'семафоры',
    'overview.numeric': 'числовые',
    'overview.missionsReferenced': 'ссылочные миссии',
    'overview.languageDistribution': 'Распределение языков',
    'overview.complexityAnalysis': 'Анализ сложности',
    'overview.averageCommandsPerScript': 'Средние команды на скрипт',
    'overview.mostComplexScript': 'Самый сложный скрипт',
    'overview.scriptConnections': 'Соединения скриптов',
    'overview.campaignEntities': 'Сущности кампании',
    'overview.labels': 'Метки',
    'overview.avgPerScript': 'среднее на скрипт',
    'overview.commands': 'команды',
    
    // Map Controls
    'mapControls.title': 'Управление',
    'mapControls.zoomIn': 'Увеличить (+)',
    'mapControls.zoomOut': 'Уменьшить (-)',
    'mapControls.centerNewbie': 'Центрировать на Port Newbie',
    'mapControls.resetView': 'Сбросить вид (Центр + 100%)',
    
    // Map Legend
    'mapLegend.title': 'Легенда',
    'mapLegend.flightLicenses': 'Лётные лицензии',
    'mapLegend.routeTypes': 'Типы маршрутов',
    'mapLegend.normalMissions': 'Обычные миссии',
    'mapLegend.uniqueMissions': 'Уникальные миссии',
    'mapLegend.shuttles': 'Челноки',
    
    // Interactive Map
    'interactiveMap.enterFullscreen': 'Полный экран',
    'interactiveMap.exitFullscreen': 'Выйти из полного экрана',
    
    // Element Counters
    'elements.scripts': 'Скрипты',
    'elements.missions': 'Миссии',
    'elements.semaphores': 'Семафоры',
    'elements.labels': 'Метки',
    'elements.characters': 'Персонажи',
    'elements.variables': 'Переменные',
    'elements.images': 'Изображения',
    'elements.achievements': 'Достижения',
    
    // Variables System
    'variablesSystem.title': 'Переменные и Система',
    'variablesSystem.description': 'Управляйте и анализируйте все элементы кампании',
    'variablesSystem.searchPlaceholder': 'Поиск',
    'variablesSystem.loadingData': 'Загрузка данных...',
    'variablesSystem.errorLoading': 'Ошибка загрузки',
    'variablesSystem.retry': 'Повторить',
    'variablesSystem.sortBy': 'Сортировать по',
    'variablesSystem.name': 'Имя',
    'variablesSystem.usage': 'Использование',
    'variablesSystem.noResults': 'Элементы не найдены',
    'variablesSystem.tryDifferentSearch': 'Попробуйте изменить критерии поиска',
    'variablesSystem.selectItem': 'Выберите элемент для просмотра деталей',
    'variablesSystem.usedIn': 'Используется в:',
    'variablesSystem.others': 'другие',
    'variablesSystem.operations': 'Операции',
    'variablesSystem.position': 'Позиция',
    'variablesSystem.objectives': 'цели',
    'variablesSystem.hidden': 'Скрыто',
    'variablesSystem.repeatable': 'Повторяемое',
    'variablesSystem.points': 'очк',
    
    // Script Selector
    'scriptSelector.searchScripts': 'Поиск скриптов и миссий...',
    'scriptSelector.starScripts': 'Звёздные скрипты',
    'scriptSelector.otherScripts': 'Другие скрипты',
    'scriptSelector.uniqueMissions': 'Уникальные миссии',
    'scriptSelector.normalMissions': 'Обычные миссии',
    'scriptSelector.noScriptsFound': 'Скрипты не найдены',
    'scriptSelector.noMissionsFound': 'Миссии не найдены',
    'scriptSelector.noScriptsAvailable': 'Нет доступных скриптов',
    'scriptSelector.noMissionsAvailable': 'Нет доступных миссий',
    
    // Tooltips
    'tooltip.interactiveButtons': 'Интерактивные кнопки:',
    'tooltip.routes': 'Маршруты:',
    'tooltip.scripts': 'Скрипты:',
    'tooltip.buttons': 'Кнопки:',
    'tooltip.license': 'Лицензия:',
    'tooltip.type': 'Тип:',
    
    // Common
    'common.usedIn': 'Используется в:',
    'common.others': 'другие',
    
    // ListView
    'listView.noElementsFound': 'Элементы не найдены',
    'listView.tryModifyingSearch': 'Попробуйте изменить критерии поиска',
    
    // CharacterView
    'characterView.character': 'Персонаж',
    'characterView.uses': 'использований',
    'characterView.availableImages': 'доступные изображения',
    
    // VariableView
    'variableView.numericVariable': 'Числовая переменная',
    'variableView.uses': 'использований',
    'variableView.values': 'Значения',
    
    // LabelView
    'labelView.label': 'Метка',
    'labelView.uses': 'использований',
    'labelView.script': 'Скрипт',
    'labelView.line': 'Строка',
    'labelView.references': 'Ссылки',
    'labelView.otherReferences': 'другие ссылки',
    
    // AchievementView
    'achievementView.objectives': 'цели',
    'achievementView.hidden': 'Скрыто',
    'achievementView.repeatable': 'Повторяемое',
    
    // SemaforoView
    'semaforoView.semaphore': 'Семафор',
    'semaforoView.uses': 'использований',
    'semaforoView.finalState': 'Конечное состояние',
    
    // ImageView
    'imageView.modified': 'Изменено',
    'imageView.depth': 'Глубина',
    
    // DetailView
    'detailView.selectElement': 'Выберите элемент для просмотра деталей',
    'detailView.initialValue': 'Начальное значение',
    'detailView.totalUsage': 'Общее использование',
    'detailView.commandsUsed': 'Используемые команды',
    'detailView.scriptsUsing': 'Скрипты, использующие',
    'detailView.goToScript': 'Перейти к скрипту',
    'detailView.numericVariable': 'Числовая переменная',
    'detailView.semaphore': 'Семафор',
    'detailView.label': 'Метка',
    'detailView.character': 'Персонаж',
    'detailView.image': 'Изображение',
    'detailView.achievement': 'Достижение',
    'detailView.labelDefinition': 'Определение метки',
    'detailView.labelReferences': 'Ссылки',
    'detailView.goToDefinition': 'Перейти к определению',
    'detailView.goToLine': 'Перейти',
    'charactersView.charactersList': 'Персонажи',
    'charactersView.visible': 'Видимый',
    'charactersView.hidden': 'Скрытый',
    'charactersView.visibleInGame': 'Видимый в игре',
    'charactersView.hiddenInGame': 'Скрытый в игре',
    'charactersView.basicInfo': 'Основная информация',
    'charactersView.internalName': 'Внутреннее имя',
    'charactersView.visibility': 'Видимость',
    'charactersView.scriptCount': 'Количество скриптов',
    'charactersView.imageGallery': 'Галерея изображений',
    'charactersView.scriptsUsing': 'Использующие скрипты',
    'charactersView.goToScript': 'Перейти к скрипту',
    'charactersView.selectCharacter': 'Выберите персонажа',
    'charactersView.imagePreview': 'Предварительный просмотр',
    'charactersView.noImageSelected': 'Изображение не выбрано',
    'charactersView.totalUsage': 'Общее использование',
    'charactersView.usedInScripts': 'Используется в скриптах',
    'charactersView.commands': 'Команды'
  }
};

// Custom hook for translations
export function useTranslation() {
  const { currentLanguage } = useLanguage();
  
  const t = (key: TranslationKey): string => {
    return translations[currentLanguage][key] || translations.EN[key] || key;
  };
  
  return { t };
}


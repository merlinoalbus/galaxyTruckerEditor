import { BlockType } from './BlockTypes';

export interface Tool {
  id: string;
  name: string;
  icon: string;
  blockType: BlockType;
  description?: string;
  implemented: boolean;
  inProgress?: boolean; // Comando in corso di implementazione
  frequency?: number; // Percentuale di utilizzo
  parameters?: string[]; // Parametri richiesti
}

export interface ToolCategory {
  id: string;
  name: string;
  icon: string;
  alwaysVisible?: boolean;
  tools: Tool[];
}

// Definizione delle categorie e dei comandi - TUTTI I COMANDI RICHIESTI
export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'general',
    name: 'Generale',
    icon: '⭐',
    alwaysVisible: false,
    tools: [
      { id: 'delay', name: 'DELAY', icon: '⏱️', blockType: 'DELAY', description: 'Pausa temporizzata', implemented: false },
      { id: 'go', name: 'GO', icon: '➡️', blockType: 'GO', description: 'Salta a label', implemented: false },
      { id: 'sub_script', name: 'SUB_SCRIPT', icon: '📄', blockType: 'SUB_SCRIPT', description: 'Richiama altro script', implemented: false },
      { id: 'exit_menu', name: 'EXIT_MENU', icon: '🚪', blockType: 'EXIT_MENU', description: 'Esci da menu', implemented: false },
      { id: 'say', name: 'SAY', icon: '💬', blockType: 'SAY', description: 'Mostra testo di dialogo', implemented: false, inProgress: true },
      { id: 'changechar', name: 'CHANGECHAR', icon: '🎭', blockType: 'CHANGECHAR', description: 'Cambia immagine personaggio', implemented: false },
      { id: 'set', name: 'SET', icon: '✅', blockType: 'SET', description: 'Attiva semaforo', implemented: false },
      { id: 'ask', name: 'ASK', icon: '❓', blockType: 'ASK', description: 'Domanda con menu', implemented: false },
      { id: 'hidechar', name: 'HIDECHAR', icon: '👻', blockType: 'HIDECHAR', description: 'Nasconde personaggio', implemented: false },
      { id: 'showchar', name: 'SHOWCHAR', icon: '👤', blockType: 'SHOWCHAR', description: 'Mostra personaggio', implemented: false },
      { id: 'reset', name: 'RESET', icon: '❌', blockType: 'RESET', description: 'Disattiva semaforo', implemented: false },
      { id: 'label', name: 'LABEL', icon: '🏷️', blockType: 'LABEL', description: 'Definisce etichetta', implemented: false },
      { id: 'hidedlgscene', name: 'HIDEDLGSCENE', icon: '🚫', blockType: 'HIDEDLGSCENE', description: 'Chiude finestra dialogo', implemented: false },
      { id: 'showdlgscene', name: 'SHOWDLGSCENE', icon: '🗨️', blockType: 'SHOWDLGSCENE', description: 'Apre finestra dialogo', implemented: false },
      { id: 'return', name: 'RETURN', icon: '↩️', blockType: 'RETURN', description: 'Ritorna allo script chiamante', implemented: false },
      { id: 'announce', name: 'ANNOUNCE', icon: '📢', blockType: 'ANNOUNCE', description: 'Messaggio su barra stato', implemented: false },
      { id: 'saychar', name: 'SAYCHAR', icon: '🗣️', blockType: 'SAYCHAR', description: 'Dialogo con personaggio', implemented: false }
    ]
  },
  {
    id: 'constructs',
    name: 'Costrutti',
    icon: '📦',
    alwaysVisible: false,
    tools: [
      { id: 'if', name: 'IF', icon: '🔀', blockType: 'IF', description: 'Blocco condizionale', implemented: true },
      { id: 'menu', name: 'MENU', icon: '☰', blockType: 'MENU', description: 'Menu di scelte', implemented: true },
      { id: 'opt', name: 'OPT', icon: '⭕', blockType: 'OPT', description: 'Opzione menu', implemented: true },
      { id: 'build', name: 'BUILD', icon: '🔨', blockType: 'BUILD', description: 'Fase costruzione', implemented: true, inProgress: true },
      { id: 'flight', name: 'FLIGHT', icon: '✈️', blockType: 'FLIGHT', description: 'Fase volo', implemented: true, inProgress: true }
    ]
  },
  {
    id: 'map',
    name: 'Mappa',
    icon: '🗺️',
    tools: [
      { id: 'shownode', name: 'SHOWNODE', icon: '📍', blockType: 'SHOWNODE', description: 'Mostra nodo', implemented: false },
      { id: 'hidenode', name: 'HIDENODE', icon: '📌', blockType: 'HIDENODE', description: 'Nasconde nodo', implemented: false },
      { id: 'addnode', name: 'ADDNODE', icon: '➕', blockType: 'ADDNODE', description: 'Aggiunge nodo', implemented: false },
      { id: 'setnodeknown', name: 'SETNODEKNOWN', icon: '✔️', blockType: 'SETNODEKNOWN', description: 'Marca nodo conosciuto', implemented: false },
      { id: 'showpath', name: 'SHOWPATH', icon: '🛤️', blockType: 'SHOWPATH', description: 'Mostra rotta', implemented: false },
      { id: 'hidepath', name: 'HIDEPATH', icon: '🚧', blockType: 'HIDEPATH', description: 'Nasconde rotta', implemented: false },
      { id: 'hideallpaths', name: 'HIDEALLPATHS', icon: '🚫', blockType: 'HIDEALLPATHS', description: 'Nasconde tutte le rotte', implemented: false },
      { id: 'showbutton', name: 'SHOWBUTTON', icon: '🔘', blockType: 'SHOWBUTTON', description: 'Mostra bottone', implemented: false },
      { id: 'hidebutton', name: 'HIDEBUTTON', icon: '⭕', blockType: 'HIDEBUTTON', description: 'Nasconde bottone', implemented: false },
      { id: 'centermapbynode', name: 'CENTERMAPBYNODE', icon: '🎯', blockType: 'CENTERMAPBYNODE', description: 'Centra su nodo', implemented: false },
      { id: 'centermapbypath', name: 'CENTERMAPBYPATH', icon: '🗺️', blockType: 'CENTERMAPBYPATH', description: 'Centra su percorso', implemented: false },
      { id: 'moveplayertonode', name: 'MOVEPLAYERTONODE', icon: '🚶', blockType: 'MOVEPLAYERTONODE', description: 'Sposta giocatore', implemented: false }
    ]
  },
  {
    id: 'mission',
    name: 'Missione',
    icon: '⚔️',
    tools: [
      { id: 'addopponent', name: 'ADDOPPONENT', icon: '🎮', blockType: 'ADDOPPONENT', description: 'Aggiunge avversario', implemented: false },
      { id: 'setshiptype', name: 'SETSHIPTYPE', icon: '🚀', blockType: 'SETSHIPTYPE', description: 'Tipo nave', implemented: false },
      { id: 'addparttoship', name: 'ADDPARTTOSHIP', icon: '🔧', blockType: 'ADDPARTTOSHIP', description: 'Parte a nave', implemented: false },
      { id: 'addparttoasideslot', name: 'ADDPARTTOASIDESLOT', icon: '📦', blockType: 'ADDPARTTOASIDESLOT', description: 'Parte aside', implemented: false },
      { id: 'addshipparts', name: 'ADDSHIPPARTS', icon: '⚙️', blockType: 'ADDSHIPPARTS', description: 'Parti multiple', implemented: false },
      { id: 'finish_mission', name: 'FINISH_MISSION', icon: '🏁', blockType: 'FINISH_MISSION', description: 'Termina missione', implemented: false },
      { id: 'act_mission', name: 'ACT_MISSION', icon: '🎬', blockType: 'ACT_MISSION', description: 'Attiva missione', implemented: false },
      { id: 'setdeckpreparationscript', name: 'SETDECKPREPARATIONSCRIPT', icon: '🃏', blockType: 'SETDECKPREPARATIONSCRIPT', description: 'Script deck', implemented: false },
      { id: 'setflightdeckpreparationscript', name: 'SETFLIGHTDECKPREPARATIONSCRIPT', icon: '🛩️', blockType: 'SETFLIGHTDECKPREPARATIONSCRIPT', description: 'Script deck volo', implemented: false },
      { id: 'setadvpile', name: 'SETADVPILE', icon: '📚', blockType: 'SETADVPILE', description: 'Pile avventura', implemented: false },
      { id: 'setsecretadvpile', name: 'SETSECRETADVPILE', icon: '🔒', blockType: 'SETSECRETADVPILE', description: 'Pile segreta', implemented: false },
      { id: 'setspeccondition', name: 'SETSPECCONDITION', icon: '⚙️', blockType: 'SETSPECCONDITION', description: 'Condizione speciale', implemented: false },
      { id: 'modifyopponentsbuildspeed', name: 'MODIFYOPPONENTSBUILDSPEED', icon: '⚡', blockType: 'MODIFYOPPONENTSBUILDSPEED', description: 'Velocità build', implemented: false },
      { id: 'setturnbased', name: 'SETTURNBASED', icon: '♟️', blockType: 'SETTURNBASED', description: 'Modalità turni', implemented: false },
      { id: 'setmissionasfailed', name: 'SETMISSIONASFAILED', icon: '❌', blockType: 'SETMISSIONASFAILED', description: 'Missione fallita', implemented: false },
      { id: 'setmissionascompleted', name: 'SETMISSIONASCOMPLETED', icon: '✅', blockType: 'SETMISSIONASCOMPLETED', description: 'Missione completata', implemented: false },
      { id: 'allshipsgiveup', name: 'ALLSHIPSGIVEUP', icon: '🏳️', blockType: 'ALLSHIPSGIVEUP', description: 'Resa generale', implemented: false },
      { id: 'giveupflight', name: 'GIVEUPFLIGHT', icon: '🛑', blockType: 'GIVEUPFLIGHT', description: 'Arrendi volo', implemented: false }
    ]
  },
  {
    id: 'variables',
    name: 'Variabili',
    icon: '🔢',
    tools: [
      { id: 'set_to', name: 'SET_TO', icon: '🔢', blockType: 'SET_TO', description: 'Imposta variabile', implemented: false },
      { id: 'add', name: 'ADD', icon: '➕', blockType: 'ADD', description: 'Aggiunge a variabile', implemented: false },
      { id: 'setfocus', name: 'SETFOCUS', icon: '🎯', blockType: 'SETFOCUS', description: 'Imposta focus', implemented: false },
      { id: 'resetfocus', name: 'RESETFOCUS', icon: '🔄', blockType: 'RESETFOCUS', description: 'Resetta focus', implemented: false },
      { id: 'setfocusifcredits', name: 'SETFOCUSIFCREDITS', icon: '💲', blockType: 'SETFOCUSIFCREDITS', description: 'Focus condizionale', implemented: false }
    ]
  },
  {
    id: 'info',
    name: 'Info & Help',
    icon: 'ℹ️',
    tools: [
      { id: 'addinfowindow', name: 'ADDINFOWINDOW', icon: 'ℹ️', blockType: 'ADDINFOWINDOW', description: 'Aggiunge finestra info', implemented: false },
      { id: 'showinfowindow', name: 'SHOWINFOWINDOW', icon: '🪟', blockType: 'SHOWINFOWINDOW', description: 'Mostra finestra info', implemented: false },
      { id: 'showhelpimage', name: 'SHOWHELPIMAGE', icon: '🖼️', blockType: 'SHOWHELPIMAGE', description: 'Mostra immagine aiuto', implemented: false },
      { id: 'buildinghelpscript', name: 'BUILDINGHELPSCRIPT', icon: '🔨', blockType: 'BUILDINGHELPSCRIPT', description: 'Help costruzione', implemented: false },
      { id: 'flighthelpscript', name: 'FLIGHTHELPSCRIPT', icon: '✈️', blockType: 'FLIGHTHELPSCRIPT', description: 'Help volo', implemented: false },
      { id: 'alienhelpscript', name: 'ALIENHELPSCRIPT', icon: '👽', blockType: 'ALIENHELPSCRIPT', description: 'Help alieni', implemented: false }
    ]
  },
  {
    id: 'credits',
    name: 'Crediti',
    icon: '💰',
    tools: [
      { id: 'addcredits', name: 'ADDCREDITS', icon: '💰', blockType: 'ADDCREDITS', description: 'Aggiunge crediti', implemented: false },
      { id: 'setcredits', name: 'SETCREDITS', icon: '💵', blockType: 'SETCREDITS', description: 'Imposta crediti', implemented: false },
      { id: 'addmissioncredits', name: 'ADDMISSIONCREDITS', icon: '🏆', blockType: 'ADDMISSIONCREDITS', description: 'Crediti mission', implemented: false },
      { id: 'addmissioncreditsbyresult', name: 'ADDMISSIONCREDITSBYRESULT', icon: '💸', blockType: 'ADDMISSIONCREDITSBYRESULT', description: 'Crediti da risultato', implemented: false },
      { id: 'subopponentcreditsbyresult', name: 'SUBOPPONENTCREDITSBYRESULT', icon: '💳', blockType: 'SUBOPPONENTCREDITSBYRESULT', description: 'Sottrae crediti', implemented: false },
      { id: 'addopponentscredits', name: 'ADDOPPONENTSCREDITS', icon: '🪙', blockType: 'ADDOPPONENTSCREDITS', description: 'Crediti avversario', implemented: false }
    ]
  },
  {
    id: 'achievement',
    name: 'Achievement',
    icon: '🏆',
    tools: [
      { id: 'setachievementprogress', name: 'SETACHIEVEMENTPROGRESS', icon: '📈', blockType: 'SETACHIEVEMENTPROGRESS', description: 'Progress achievement', implemented: false },
      { id: 'setachievementattempt', name: 'SETACHIEVEMENTATTEMPT', icon: '🎯', blockType: 'SETACHIEVEMENTATTEMPT', description: 'Tentativo achievement', implemented: false },
      { id: 'unlockachievement', name: 'UNLOCKACHIEVEMENT', icon: '🏆', blockType: 'UNLOCKACHIEVEMENT', description: 'Sblocca achievement', implemented: false },
      { id: 'unlockshipplan', name: 'UNLOCKSHIPPLAN', icon: '📋', blockType: 'UNLOCKSHIPPLAN', description: 'Sblocca piano nave', implemented: false },
      { id: 'unlockshuttles', name: 'UNLOCKSHUTTLES', icon: '🚁', blockType: 'UNLOCKSHUTTLES', description: 'Sblocca shuttle', implemented: false }
    ]
  },
  {
    id: 'characters',
    name: 'Personaggi',
    icon: '🎭',
    tools: [
      { id: 'askchar', name: 'ASKCHAR', icon: '❔', blockType: 'ASKCHAR', description: 'Domanda con personaggio', implemented: false },
      { id: 'focuschar', name: 'FOCUSCHAR', icon: '🔍', blockType: 'FOCUSCHAR', description: 'Focus su personaggio', implemented: false }
    ]
  },
  {
    id: 'system',
    name: 'Sistema',
    icon: '💾',
    tools: [
      { id: 'setflightstatusbar', name: 'SETFLIGHTSTATUSBAR', icon: '📊', blockType: 'SETFLIGHTSTATUSBAR', description: 'Barra stato volo', implemented: false },
      { id: 'savestate', name: 'SAVESTATE', icon: '💾', blockType: 'SAVESTATE', description: 'Salva stato', implemented: false },
      { id: 'loadstate', name: 'LOADSTATE', icon: '📂', blockType: 'LOADSTATE', description: 'Carica stato', implemented: false },
      { id: 'quitcampaign', name: 'QUITCAMPAIGN', icon: '🚪', blockType: 'QUITCAMPAIGN', description: 'Esci campagna', implemented: false }
    ]
  }
];
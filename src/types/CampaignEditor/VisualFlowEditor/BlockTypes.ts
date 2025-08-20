// Tipi base per i blocchi
export interface BaseBlock {
  id: string;
  type: string;
  position: { x: number; y: number };
}

// BLOCCHI CONTAINER - hanno children
export interface ContainerBlock extends BaseBlock {
  isContainer: true;
  children: Block[];
  // Punti di ancoraggio per aggiungere children
  anchorPoints: AnchorPoint[];
}

// BLOCCHI COMANDO - non hanno children  
export interface CommandBlock extends BaseBlock {
  isContainer: false;
  parameters: Record<string, any>;
}

export type Block = ContainerBlock | CommandBlock;

// Tipo per identificare i diversi tipi di blocchi - TUTTI I COMANDI RICHIESTI
export type BlockType = 
  // Generale
  | 'DELAY' | 'GO' | 'SUB_SCRIPT' | 'EXIT_MENU' | 'SAY' | 'CHANGECHAR' 
  | 'SET' | 'ASK' | 'HIDECHAR' | 'SHOWCHAR' | 'RESET' | 'LABEL' 
  | 'HIDEDLGSCENE' | 'SHOWDLGSCENE' | 'RETURN' | 'ANNOUNCE' | 'SAYCHAR'
  // Mappa e navigazione
  | 'SHOWPATH' | 'SHOWNODE' | 'HIDEPATH' | 'HIDENODE' | 'HIDEALLPATHS'
  | 'CENTERMAPBYNODE' | 'CENTERMAPBYPATH' | 'MOVEPLAYERTONODE' | 'ADDNODE'
  | 'SETNODEKNOWN' | 'SHOWBUTTON' | 'HIDEBUTTON' | 'SETFOCUS' | 'RESETFOCUS' | 'SETFOCUSIFCREDITS'
  // Variabili e dati  
  | 'SET_TO' | 'ADD' | 'SETFOCUS' | 'RESETFOCUS'
  // Info e help
  | 'ADDINFOWINDOW' | 'SHOWINFOWINDOW' | 'SHOWHELPIMAGE'
  | 'BUILDINGHELPSCRIPT' | 'FLIGHTHELPSCRIPT' | 'ALIENHELPSCRIPT'
  // Missione e combattimento
  | 'ADDOPPONENT' | 'SETSHIPTYPE' | 'ADDPARTTOSHIP' | 'ADDPARTTOASIDESLOT'
  | 'ACT_MISSION' | 'SETTURNBASED' | 'ADDSHIPPARTS'
  | 'SETMISSIONASFAILED' | 'SETMISSIONASCOMPLETED' | 'ALLSHIPSGIVEUP' | 'GIVEUPFLIGHT'
  | 'SETDECKPREPARATIONSCRIPT' | 'SETFLIGHTDECKPREPARATIONSCRIPT'
  | 'SETADVPILE' | 'SETSECRETADVPILE' | 'SETSPECCONDITION' | 'MODIFYOPPONENTSBUILDSPEED'
  // Crediti
  | 'ADDCREDITS' | 'SETCREDITS' | 'ADDMISSIONCREDITS' | 'ADDMISSIONCREDITSBYRESULT'
  | 'SUBOPPONENTCREDITSBYRESULT' | 'ADDOPPONENTSCREDITS' | 'SETFLIGHTSTATUSBAR'
  // Achievement
  | 'SETACHIEVEMENTPROGRESS' | 'SETACHIEVEMENTATTEMPT' | 'UNLOCKACHIEVEMENT'
  | 'UNLOCKSHIPPLAN' | 'UNLOCKSHUTTLES'
  // Personaggi
  | 'ASKCHAR' | 'FOCUSCHAR'
  // Sistema
  | 'SAVESTATE' | 'LOADSTATE' | 'QUITCAMPAIGN'
  // Contenitori
  | 'IF' | 'MENU' | 'OPT' | 'BUILD' | 'FLIGHT';

// Punti di ancoraggio per drag & drop
export interface AnchorPoint {
  id: string;
  position: { x: number; y: number };
  allowedTypes: string[]; // Tipi di blocchi accettati
  flowState: FlowState;
}

// Stati di flusso
export type FlowState = 'start' | 'middle' | 'end' | 'branch' | 'condition';

// Blocco SCRIPT principale (container speciale)
export interface ScriptBlock extends ContainerBlock {
  type: 'SCRIPT';
  scriptName: string;
  fileName: string;
}

// Blocchi container specifici
export interface IfBlock extends ContainerBlock {
  type: 'IF';
  condition: string;
  thenBranch: Block[];
  elseBranch: Block[];
}

export interface MenuBlock extends ContainerBlock {
  type: 'MENU';
  options: OptionBlock[];
}

// Tipi di OPT disponibili
export type OptType = 'OPT_SIMPLE' | 'OPT_CONDITIONAL' | 'OPT_CONDITIONAL_NOT';

export interface OptionBlock extends ContainerBlock {
  type: 'OPT';
  optType: OptType;
  condition: string | null; // Semaforo per OPT_CONDITIONAL e OPT_CONDITIONAL_NOT
  text: {
    EN: string;
    CS: string | null;
    DE: string | null;
    ES: string | null;
    FR: string | null;
    PL: string | null;
    RU: string | null;
  };
  children: Block[]; // Blocchi contenuti nell'opzione
}

// Blocco MISSION (container con due aree come IF)
export interface MissionBlock extends ContainerBlock {
  type: 'MISSION';
  missionName: string;
  fileName: string;
  blocksMission: Block[];  // Blocchi principali della missione
  blocksFinish: Block[];   // Blocchi di fine missione
}

// Blocchi comando specifici
export interface SayBlock extends CommandBlock {
  type: 'SAY';
  parameters: {
    text: Record<string, string>; // Multilingua
  };
}

export interface AskBlock extends CommandBlock {
  type: 'ASK';
  parameters: {
    text: Record<string, string>; // Multilingua
  };
}

export interface DelayBlock extends CommandBlock {
  type: 'DELAY';
  parameters: {
    milliseconds: number;
  };
}

export interface GotoBlock extends CommandBlock {
  type: 'GO';
  parameters: {
    label: string;
  };
}

export interface LabelBlock extends CommandBlock {
  type: 'LABEL';
  parameters: {
    name: string;
  };
}

export interface ShowButtonBlock extends CommandBlock {
  type: 'SHOWBUTTON';
  parameters: {
    button: string;
  };
}

export interface HideButtonBlock extends CommandBlock {
  type: 'HIDEBUTTON';
  parameters: {
    button: string;
  };
}

export interface SetFocusBlock extends CommandBlock {
  type: 'SETFOCUS';
  parameters: {
    button: string;
  };
}

export interface ResetFocusBlock extends CommandBlock {
  type: 'RESETFOCUS';
  parameters: {
    button: string;
  };
}

export interface SetFocusIfCreditsBlock extends CommandBlock {
  type: 'SETFOCUSIFCREDITS';
  parameters: {
    button: string;
    credits: number;
  };
}

// Strumenti disponibili nella barra laterale
export interface ToolItem {
  id: string;
  name: string;
  blockType: string;
  icon: string;
  isContainer: boolean;
  category: 'dialog' | 'control' | 'navigation' | 'actions';
}

export const AVAILABLE_TOOLS: ToolItem[] = [
  // Blocchi Container
  {
    id: 'if-tool',
    name: 'Condizione IF',
    blockType: 'IF',
    icon: '🔀',
    isContainer: true,
    category: 'control'
  },
  {
    id: 'menu-tool', 
    name: 'Menu Scelte',
    blockType: 'MENU',
    icon: '📋',
    isContainer: true,
    category: 'dialog'
  },
  {
    id: 'opt-tool',
    name: 'Opzione Menu', 
    blockType: 'OPT',
    icon: '▶️',
    isContainer: true,
    category: 'dialog'
  },
  
  // Blocchi Comando
  {
    id: 'say-tool',
    name: 'Dialogo SAY',
    blockType: 'SAY', 
    icon: '💬',
    isContainer: false,
    category: 'dialog'
  },
  {
    id: 'ask-tool',
    name: 'Domanda ASK',
    blockType: 'ASK',
    icon: '❓',
    isContainer: false,
    category: 'dialog'
  },
  {
    id: 'delay-tool',
    name: 'Pausa DELAY',
    blockType: 'DELAY',
    icon: '⏱️', 
    isContainer: false,
    category: 'actions'
  },
  {
    id: 'goto-tool',
    name: 'Vai a GOTO',
    blockType: 'GO',
    icon: '➡️',
    isContainer: false, 
    category: 'navigation'
  },
  {
    id: 'label-tool',
    name: 'Etichetta LABEL',
    blockType: 'LABEL',
    icon: '🏷️',
    isContainer: false,
    category: 'navigation'
  }
];
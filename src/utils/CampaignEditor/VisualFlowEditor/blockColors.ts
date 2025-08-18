/**
 * Sistema di colori centralizzato per i blocchi del Visual Flow Editor
 * Evita rosso e tonalità simili (usate per errori)
 */

export interface BlockColorConfig {
  background: string;
  border: string;
  icon: string;
  text: string;
  dragHandle: string;
}

// Categorie principali   'ACT_MISSION': BlockCategory.MISSION, blocchi
export enum BlockCategory {
  CONTROL_FLOW = 'CONTROL_FLOW',      // IF, MENU, OPT, etc.
  MISSION = 'MISSION',                 // MISSION, BUILD, FLIGHT
  DIALOGUE = 'DIALOGUE',               // SAY, ASK, etc.
  NAVIGATION = 'NAVIGATION',           // GO, LABEL, SUBSCRIPT
  VARIABLES = 'VARIABLES',             // SET, ADD, SUB, etc.
  MAP = 'MAP',                        // MAP_TRAVEL, MAP_UNLOCK, etc.
  GAME_STATE = 'GAME_STATE',          // SAVE, LOAD, etc.
  MULTIMEDIA = 'MULTIMEDIA',           // PLAY, STOP, VIDEO, etc.
  TIME = 'TIME',                      // DELAY, WAIT, etc.
  UTILITY = 'UTILITY'                 // Altri comandi
}

// Colori per categoria
const CATEGORY_COLORS: Record<BlockCategory, BlockColorConfig> = {
  [BlockCategory.CONTROL_FLOW]: {
    background: 'bg-slate-950/90',
    border: 'border-slate-700/80',
    icon: 'bg-slate-900/80',
    text: 'text-slate-300',
    dragHandle: 'bg-slate-700'
  },
  [BlockCategory.MISSION]: {
    background: 'bg-purple-950/90',
    border: 'border-purple-700/80',
    icon: 'bg-purple-900/80',
    text: 'text-purple-300',
    dragHandle: 'bg-purple-700'
  },
  [BlockCategory.DIALOGUE]: {
    background: 'bg-blue-950/90',
    border: 'border-blue-700/80',
    icon: 'bg-blue-900/80',
    text: 'text-blue-300',
    dragHandle: 'bg-blue-700'
  },
  [BlockCategory.NAVIGATION]: {
    background: 'bg-fuchsia-950/90',
    border: 'border-fuchsia-700/80',
    icon: 'bg-fuchsia-900/80',
    text: 'text-fuchsia-300',
    dragHandle: 'bg-fuchsia-700'
  },
  [BlockCategory.VARIABLES]: {
    background: 'bg-emerald-950/90',
    border: 'border-emerald-700/80',
    icon: 'bg-emerald-900/80',
    text: 'text-emerald-300',
    dragHandle: 'bg-emerald-700'
  },
  [BlockCategory.MAP]: {
    background: 'bg-teal-950/90',
    border: 'border-teal-700/80',
    icon: 'bg-teal-900/80',
    text: 'text-teal-300',
    dragHandle: 'bg-teal-700'
  },
  [BlockCategory.GAME_STATE]: {
    background: 'bg-indigo-950/90',
    border: 'border-indigo-700/80',
    icon: 'bg-indigo-900/80',
    text: 'text-indigo-300',
    dragHandle: 'bg-indigo-700'
  },
  [BlockCategory.MULTIMEDIA]: {
    background: 'bg-violet-950/90',
    border: 'border-violet-700/80',
    icon: 'bg-violet-900/80',
    text: 'text-violet-300',
    dragHandle: 'bg-violet-700'
  },
  [BlockCategory.TIME]: {
    background: 'bg-yellow-950/90',
    border: 'border-yellow-700/80',
    icon: 'bg-yellow-900/80',
    text: 'text-yellow-300',
    dragHandle: 'bg-yellow-700'
  },
  [BlockCategory.UTILITY]: {
    background: 'bg-gray-950/90',
    border: 'border-gray-700/80',
    icon: 'bg-gray-900/80',
    text: 'text-gray-300',
    dragHandle: 'bg-gray-700'
  }
};

// COLORI UNICI PER I 5 COSTRUTTI PRINCIPALI
const CONSTRUCT_COLORS: Record<string, BlockColorConfig> = {
  'IF': {
    background: 'bg-gradient-to-br from-gray-800/95 to-gray-900/95',
    border: 'border-gray-600/80',
    icon: 'bg-blue-900/80',
    text: 'text-blue-300',
    dragHandle: 'bg-blue-900/80'
  },
  'MENU': {
    background: 'bg-indigo-950/90',
    border: 'border-indigo-800/80',
    icon: 'bg-indigo-900/80',
    text: 'text-indigo-300',
    dragHandle: 'bg-indigo-700'
  },
  'OPT': {
    background: 'bg-cyan-950/90',
    border: 'border-cyan-800/80',
    icon: 'bg-cyan-900/80',
    text: 'text-cyan-300',
    dragHandle: 'bg-cyan-700'
  },
  'BUILD': {
    background: 'bg-teal-950/90',
    border: 'border-teal-700/80',
    icon: 'bg-teal-900/80',
    text: 'text-teal-300',
    dragHandle: 'bg-teal-700'
  },
  'FLIGHT': {
    background: 'bg-sky-950/90',
    border: 'border-sky-800/80',
    icon: 'bg-sky-900/80',
    text: 'text-sky-300',
    dragHandle: 'bg-sky-700'
  }
};

// COLORI UNICI PER I 17 COMANDI GENERALI (dalla toolbar)
const GENERAL_COMMAND_COLORS: Record<string, BlockColorConfig> = {
  'DELAY': {
    background: 'bg-yellow-950/90',
    border: 'border-yellow-700/80',
    icon: 'bg-yellow-900/80',
    text: 'text-yellow-300',
    dragHandle: 'bg-yellow-700'
  },
  'GO': {
    background: 'bg-fuchsia-950/90',
    border: 'border-fuchsia-700/80',
    icon: 'bg-fuchsia-900/80',
    text: 'text-fuchsia-300',
    dragHandle: 'bg-fuchsia-700'
  },
  'SUB_SCRIPT': {
  background: 'bg-rose-950/90',
  border: 'border-rose-700/80',
  icon: 'bg-rose-900/80',
  text: 'text-rose-300',
  dragHandle: 'bg-rose-700'
  },
  'EXIT_MENU': {
    background: 'bg-stone-950/90',
    border: 'border-stone-700/80',
    icon: 'bg-stone-900/80',
    text: 'text-stone-300',
    dragHandle: 'bg-stone-700'
  },
  'SAY': {
    background: 'bg-blue-950/90',
    border: 'border-blue-700/80',
    icon: 'bg-blue-900/80',
    text: 'text-blue-300',
    dragHandle: 'bg-blue-700'
  },
  'ANNOUNCE': {
    background: 'bg-amber-950/90',
    border: 'border-amber-700/80',
    icon: 'bg-amber-900/80',
    text: 'text-amber-300',
    dragHandle: 'bg-amber-700'
  },
  'CHANGECHAR': {
    background: 'bg-violet-950/90',
    border: 'border-violet-700/80',
    icon: 'bg-violet-900/80',
    text: 'text-violet-300',
    dragHandle: 'bg-violet-700'
  },
  'SET': {
    background: 'bg-lime-950/90',
    border: 'border-lime-700/80',
    icon: 'bg-lime-900/80',
    text: 'text-lime-300',
    dragHandle: 'bg-lime-700'
  },
  'ASK': {
    background: 'bg-sky-950/90',
    border: 'border-sky-700/80',
    icon: 'bg-sky-900/80',
    text: 'text-sky-300',
    dragHandle: 'bg-sky-700'
  },
  'HIDECHAR': {
    background: 'bg-zinc-950/90',
    border: 'border-zinc-700/80',
    icon: 'bg-zinc-900/80',
    text: 'text-zinc-300',
    dragHandle: 'bg-zinc-700'
  },
  'SHOWCHAR': {
    background: 'bg-emerald-950/90',
    border: 'border-emerald-700/80',
    icon: 'bg-emerald-900/80',
    text: 'text-emerald-300',
    dragHandle: 'bg-emerald-700'
  },
  'RESET': {
    background: 'bg-slate-950/90',
    border: 'border-slate-700/80',
    icon: 'bg-slate-900/80',
    text: 'text-slate-300',
    dragHandle: 'bg-slate-700'
  },
  'LABEL': {
    background: 'bg-green-950/90',
    border: 'border-green-700/80',
    icon: 'bg-green-900/80',
    text: 'text-green-300',
    dragHandle: 'bg-green-700'
  },
  'HIDEDLGSCENE': {
    background: 'bg-gray-950/90',
    border: 'border-gray-700/80',
    icon: 'bg-gray-900/80',
    text: 'text-gray-300',
    dragHandle: 'bg-gray-700'
  },
  'SHOWDLGSCENE': {
    background: 'bg-cyan-950/90',
    border: 'border-cyan-700/80',
    icon: 'bg-cyan-900/80',
    text: 'text-cyan-300',
    dragHandle: 'bg-cyan-700'
  },
  'RETURN': {
    background: 'bg-amber-950/90',
    border: 'border-amber-700/80',
    icon: 'bg-amber-900/80',
    text: 'text-amber-300',
    dragHandle: 'bg-amber-700'
  },
  'SAYCHAR': {
    background: 'bg-indigo-900/90',
    border: 'border-indigo-600/80',
    icon: 'bg-indigo-800/80',
    text: 'text-indigo-300',
    dragHandle: 'bg-indigo-600'
  }
};

// Mappatura tipo blocco -> categoria
const BLOCK_TYPE_CATEGORY: Record<string, BlockCategory> = {
  // Control Flow
  'IF': BlockCategory.CONTROL_FLOW,
  'IFNOT': BlockCategory.CONTROL_FLOW,
  'IF_DEBUG': BlockCategory.CONTROL_FLOW,
  'IF_FROM_CAMPAIGN': BlockCategory.CONTROL_FLOW,
  'IF_HAS_CREDITS': BlockCategory.CONTROL_FLOW,
  'IF_IS': BlockCategory.CONTROL_FLOW,
  'IF_MAX': BlockCategory.CONTROL_FLOW,
  'IF_MIN': BlockCategory.CONTROL_FLOW,
  'IF_MISSION_WON': BlockCategory.CONTROL_FLOW,
  'IF_ORDER': BlockCategory.CONTROL_FLOW,
  'IF_PROB': BlockCategory.CONTROL_FLOW,
  'IF_TUTORIAL_SEEN': BlockCategory.CONTROL_FLOW,
  'IFMISSIONRESULTIS': BlockCategory.CONTROL_FLOW,
  'IFMISSIONRESULTMIN': BlockCategory.CONTROL_FLOW,
  'MENU': BlockCategory.CONTROL_FLOW,
  'OPT': BlockCategory.CONTROL_FLOW,
  'OPT_SIMPLE': BlockCategory.CONTROL_FLOW,
  'OPT_CONDITIONAL': BlockCategory.CONTROL_FLOW,
  'OPT_CONDITIONAL_NOT': BlockCategory.CONTROL_FLOW,
  
  // Mission
  'MISSION': BlockCategory.MISSION,
  'BUILD': BlockCategory.MISSION,
  'FLIGHT': BlockCategory.MISSION,
  'ACT_MISSION': BlockCategory.MISSION,
  'END_MISSION': BlockCategory.MISSION,
  'MISSION_WIN': BlockCategory.MISSION,
  'MISSION_LOSE': BlockCategory.MISSION,
  'ADDOPPONENT': BlockCategory.MISSION,
  'SETSHIPTYPE': BlockCategory.MISSION,
  'ADDPARTTOSHIP': BlockCategory.MISSION,
  'ADDPARTTOASIDESLOT': BlockCategory.MISSION,
  'ADDSHIPPARTS': BlockCategory.MISSION,
  'SETDECKPREPARATIONSCRIPT': BlockCategory.MISSION,
  'SETFLIGHTDECKPREPARATIONSCRIPT': BlockCategory.MISSION,
  
  // Dialogue
  'SAY': BlockCategory.DIALOGUE,
  'ASK': BlockCategory.DIALOGUE,
  'BRIEF': BlockCategory.DIALOGUE,
  'DEBRIEF': BlockCategory.DIALOGUE,
  'DIALOGUE': BlockCategory.DIALOGUE,
  
  // Navigation
  'GO': BlockCategory.NAVIGATION,
  'LABEL': BlockCategory.NAVIGATION,
  'SUBSCRIPT': BlockCategory.NAVIGATION,
  'RETURN': BlockCategory.NAVIGATION,
  'EXIT': BlockCategory.NAVIGATION,
  
  // Variables
  'SET': BlockCategory.VARIABLES,
  'ADD': BlockCategory.VARIABLES,
  'SUB': BlockCategory.VARIABLES,
  'MUL': BlockCategory.VARIABLES,
  'DIV': BlockCategory.VARIABLES,
  'RANDOM': BlockCategory.VARIABLES,
  'CLEAR': BlockCategory.VARIABLES,
  
  // Map
  'MAP_TRAVEL': BlockCategory.MAP,
  'MAP_UNLOCK': BlockCategory.MAP,
  'MAP_LOCK': BlockCategory.MAP,
  'MAP_SHOW': BlockCategory.MAP,
  'MAP_HIDE': BlockCategory.MAP,
  
  // Game State
  'SAVE': BlockCategory.GAME_STATE,
  'LOAD': BlockCategory.GAME_STATE,
  'CHECKPOINT': BlockCategory.GAME_STATE,
  'RESET': BlockCategory.GAME_STATE,
  'GAME_OVER': BlockCategory.GAME_STATE,
  
  // Multimedia
  'PLAY': BlockCategory.MULTIMEDIA,
  'STOP': BlockCategory.MULTIMEDIA,
  'VIDEO': BlockCategory.MULTIMEDIA,
  'MUSIC': BlockCategory.MULTIMEDIA,
  'SOUND': BlockCategory.MULTIMEDIA,
  'VOICE': BlockCategory.MULTIMEDIA,
  
  // Time
  'DELAY': BlockCategory.TIME,
  'WAIT': BlockCategory.TIME,
  'TIMER_START': BlockCategory.TIME,
  'TIMER_STOP': BlockCategory.TIME,
  
  // Utility (default for unknown types)
  'DEFAULT': BlockCategory.UTILITY
};

/**
 * Ottiene la configurazione colori per un tipo di blocco
 */
export function getBlockColors(blockType: string): BlockColorConfig {
  // Prima controlla se è un costrutto (5 costrutti)
  if (CONSTRUCT_COLORS[blockType]) {
    return CONSTRUCT_COLORS[blockType];
  }
  
  // Poi controlla se è un comando generale (17 comandi)
  if (GENERAL_COMMAND_COLORS[blockType]) {
    return GENERAL_COMMAND_COLORS[blockType];
  }
  
  // Altrimenti usa il colore della categoria
  const category = BLOCK_TYPE_CATEGORY[blockType] || BlockCategory.UTILITY;
  return CATEGORY_COLORS[category];
}

/**
 * Ottiene solo il colore di sfondo per un tipo di blocco
 */
export function getBlockBackground(blockType: string): string {
  return getBlockColors(blockType).background;
}

/**
 * Ottiene solo il colore del bordo per un tipo di blocco
 */
export function getBlockBorder(blockType: string): string {
  return getBlockColors(blockType).border;
}

/**
 * Ottiene la classe CSS completa per un blocco
 */
export function getBlockClassName(
  blockType: string, 
  isInvalid: boolean = false, 
  validationType: 'error' | 'warning' = 'error'
): string {
  const colors = getBlockColors(blockType);
  
  let invalidClass = colors.border;
  if (isInvalid) {
    if (validationType === 'warning') {
      // Warning: bordo arancione
      invalidClass = 'border-orange-500 border-2 shadow-orange-500/50';
    } else {
      // Error: bordo rosso
      invalidClass = 'border-red-500 border-2 shadow-red-500/50';
    }
  }
  
  return `${colors.background} ${invalidClass} rounded-lg`;
}

/**
 * Ottiene il colore dell'icona per un tipo di blocco
 */
export function getBlockIconBackground(blockType: string): string {
  return getBlockColors(blockType).icon;
}

/**
 * Ottiene il colore del drag handle per un tipo di blocco  
 */
export function getBlockDragHandle(blockType: string): string {
  return getBlockColors(blockType).dragHandle;
}
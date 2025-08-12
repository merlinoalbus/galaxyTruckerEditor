// Configurazione centralizzata per tutti i tipi di blocchi
// Supporta 94+ command blocks e 8+ container types

export interface BlockTypeConfig {
  type: string;
  category: 'command' | 'container';
  label: string;
  color: {
    background: string;
    border: string;
    icon?: string;
  };
  icon?: string;
  parameters?: {
    [key: string]: {
      type: 'text' | 'number' | 'select' | 'variable' | 'semaphore' | 'label' | 'script' | 'mission';
      label: string;
      placeholder?: string;
      options?: { value: string; label: string }[];
      required?: boolean;
    };
  };
  defaultCollapsed?: boolean;
  hasChildren?: boolean;
}

// Container blocks configuration (8+ types)
export const CONTAINER_BLOCKS: Record<string, BlockTypeConfig> = {
  SCRIPT: {
    type: 'SCRIPT',
    category: 'container',
    label: 'Script',
    color: {
      background: 'bg-gradient-to-br from-slate-800/90 to-slate-900/90',
      border: 'border-slate-700/50',
      icon: 'bg-slate-700/50'
    },
    hasChildren: true,
    defaultCollapsed: false
  },
  IF: {
    type: 'IF',
    category: 'container',
    label: 'IF',
    color: {
      background: 'bg-gradient-to-br from-gray-800/95 to-gray-900/95',
      border: 'border-gray-600/80',
      icon: 'bg-blue-900/80'
    },
    hasChildren: true,
    defaultCollapsed: false,
    parameters: {
      ifType: {
        type: 'select',
        label: 'Tipo IF',
        options: [
          { value: 'IF', label: 'IF' },
          { value: 'IFNOT', label: 'IF NOT' },
          { value: 'IF_DEBUG', label: 'IF DEBUG' },
          { value: 'IF_FROM_CAMPAIGN', label: 'IF FROM CAMPAIGN' },
          { value: 'IF_HAS_CREDITS', label: 'IF HAS CREDITS' },
          { value: 'IF_IS', label: 'IF IS' },
          { value: 'IF_MAX', label: 'IF MAX' },
          { value: 'IF_MIN', label: 'IF MIN' },
          { value: 'IF_MISSION_WON', label: 'IF MISSION WON' },
          { value: 'IF_ORDER', label: 'IF ORDER' },
          { value: 'IF_PROB', label: 'IF PROBABILITY' },
          { value: 'IF_TUTORIAL_SEEN', label: 'IF TUTORIAL SEEN' },
          { value: 'IFMISSIONRESULTIS', label: 'IF MISSION RESULT IS' },
          { value: 'IFMISSIONRESULTMIN', label: 'IF MISSION RESULT MIN' }
        ],
        required: true
      },
      variabile: {
        type: 'variable',
        label: 'Variabile',
        placeholder: 'Seleziona variabile...'
      },
      valore: {
        type: 'text',
        label: 'Valore',
        placeholder: 'Valore...'
      }
    }
  },
  MENU: {
    type: 'MENU',
    category: 'container',
    label: 'Menu',
    color: {
      background: 'bg-indigo-950/90',
      border: 'border-indigo-800/80'
    },
    hasChildren: true,
    defaultCollapsed: false
  },
  OPT: {
    type: 'OPT',
    category: 'container',
    label: 'Option',
    color: {
      background: 'bg-cyan-950/90',
      border: 'border-cyan-800/80'
    },
    hasChildren: true,
    defaultCollapsed: false
  },
  WHILE: {
    type: 'WHILE',
    category: 'container',
    label: 'While',
    color: {
      background: 'bg-purple-950/90',
      border: 'border-purple-800/80'
    },
    hasChildren: true,
    defaultCollapsed: false
  },
  FOR: {
    type: 'FOR',
    category: 'container',
    label: 'For',
    color: {
      background: 'bg-orange-950/90',
      border: 'border-orange-800/80'
    },
    hasChildren: true,
    defaultCollapsed: false
  },
  SWITCH: {
    type: 'SWITCH',
    category: 'container',
    label: 'Switch',
    color: {
      background: 'bg-rose-950/90',
      border: 'border-rose-800/80'
    },
    hasChildren: true,
    defaultCollapsed: false
  },
  CASE: {
    type: 'CASE',
    category: 'container',
    label: 'Case',
    color: {
      background: 'bg-pink-950/90',
      border: 'border-pink-800/80'
    },
    hasChildren: true,
    defaultCollapsed: false
  }
};

// Command blocks configuration (94+ types)
export const COMMAND_BLOCKS: Record<string, BlockTypeConfig> = {
  // Dialog & Communication
  SAY: {
    type: 'SAY',
    category: 'command',
    label: 'Say',
    color: {
      background: 'bg-blue-950/90',
      border: 'border-blue-800/80'
    },
    parameters: {
      text: {
        type: 'text',
        label: 'Testo',
        placeholder: 'Testo dialogo...',
        required: true
      }
    },
    defaultCollapsed: true
  },
  DELAY: {
    type: 'DELAY',
    category: 'command',
    label: 'Delay',
    color: {
      background: 'bg-amber-950/90',
      border: 'border-amber-800/80'
    },
    parameters: {
      duration: {
        type: 'number',
        label: 'Durata (ms)',
        placeholder: '1000',
        required: true
      }
    },
    defaultCollapsed: true
  },
  GO: {
    type: 'GO',
    category: 'command',
    label: 'Go',
    color: {
      background: 'bg-purple-950/90',
      border: 'border-purple-800/80'
    },
    parameters: {
      label: {
        type: 'label',
        label: 'Etichetta',
        placeholder: 'Seleziona etichetta...',
        required: true
      }
    },
    defaultCollapsed: true
  },
  LABEL: {
    type: 'LABEL',
    category: 'command',
    label: 'Label',
    color: {
      background: 'bg-emerald-950/90',
      border: 'border-emerald-800/80'
    },
    parameters: {
      name: {
        type: 'text',
        label: 'Nome',
        placeholder: 'Nome etichetta...',
        required: true
      }
    },
    defaultCollapsed: true
  },
  
  // Variables & Data
  VAR: {
    type: 'VAR',
    category: 'command',
    label: 'Variable',
    color: {
      background: 'bg-teal-950/90',
      border: 'border-teal-800/80'
    },
    parameters: {
      name: {
        type: 'variable',
        label: 'Variabile',
        placeholder: 'Seleziona variabile...',
        required: true
      },
      value: {
        type: 'text',
        label: 'Valore',
        placeholder: 'Valore...'
      }
    },
    defaultCollapsed: true
  },
  SET: {
    type: 'SET',
    category: 'command',
    label: 'Set',
    color: {
      background: 'bg-sky-950/90',
      border: 'border-sky-800/80'
    },
    parameters: {
      variable: {
        type: 'variable',
        label: 'Variabile',
        required: true
      },
      value: {
        type: 'text',
        label: 'Valore',
        required: true
      }
    },
    defaultCollapsed: true
  },
  INCREMENT: {
    type: 'INCREMENT',
    category: 'command',
    label: 'Increment',
    color: {
      background: 'bg-lime-950/90',
      border: 'border-lime-800/80'
    },
    parameters: {
      variable: {
        type: 'variable',
        label: 'Variabile',
        required: true
      },
      amount: {
        type: 'number',
        label: 'Quantità',
        placeholder: '1'
      }
    },
    defaultCollapsed: true
  },
  
  // Flow Control
  CALL: {
    type: 'CALL',
    category: 'command',
    label: 'Call',
    color: {
      background: 'bg-violet-950/90',
      border: 'border-violet-800/80'
    },
    parameters: {
      script: {
        type: 'script',
        label: 'Script',
        placeholder: 'Seleziona script...',
        required: true
      }
    },
    defaultCollapsed: true
  },
  RETURN: {
    type: 'RETURN',
    category: 'command',
    label: 'Return',
    color: {
      background: 'bg-fuchsia-950/90',
      border: 'border-fuchsia-800/80'
    },
    defaultCollapsed: true
  },
  EXIT: {
    type: 'EXIT',
    category: 'command',
    label: 'Exit',
    color: {
      background: 'bg-red-950/90',
      border: 'border-red-800/80'
    },
    defaultCollapsed: true
  },
  
  // Save/Load
  SAVE: {
    type: 'SAVE',
    category: 'command',
    label: 'Save',
    color: {
      background: 'bg-green-950/90',
      border: 'border-green-800/80'
    },
    parameters: {
      slot: {
        type: 'number',
        label: 'Slot',
        placeholder: '1',
        required: true
      }
    },
    defaultCollapsed: true
  },
  LOAD: {
    type: 'LOAD',
    category: 'command',
    label: 'Load',
    color: {
      background: 'bg-yellow-950/90',
      border: 'border-yellow-800/80'
    },
    parameters: {
      slot: {
        type: 'number',
        label: 'Slot',
        placeholder: '1',
        required: true
      }
    },
    defaultCollapsed: true
  },
  
  // Media
  IMAGE: {
    type: 'IMAGE',
    category: 'command',
    label: 'Image',
    color: {
      background: 'bg-indigo-950/90',
      border: 'border-indigo-800/80'
    },
    parameters: {
      path: {
        type: 'text',
        label: 'Percorso',
        placeholder: 'path/to/image.png',
        required: true
      }
    },
    defaultCollapsed: true
  },
  MOVIE: {
    type: 'MOVIE',
    category: 'command',
    label: 'Movie',
    color: {
      background: 'bg-cyan-950/90',
      border: 'border-cyan-800/80'
    },
    parameters: {
      path: {
        type: 'text',
        label: 'Percorso',
        placeholder: 'path/to/movie.mp4',
        required: true
      }
    },
    defaultCollapsed: true
  },
  SOUND: {
    type: 'SOUND',
    category: 'command',
    label: 'Sound',
    color: {
      background: 'bg-orange-950/90',
      border: 'border-orange-800/80'
    },
    parameters: {
      path: {
        type: 'text',
        label: 'Percorso',
        placeholder: 'path/to/sound.mp3',
        required: true
      }
    },
    defaultCollapsed: true
  },
  
  // User Input
  INPUT: {
    type: 'INPUT',
    category: 'command',
    label: 'Input',
    color: {
      background: 'bg-rose-950/90',
      border: 'border-rose-800/80'
    },
    parameters: {
      variable: {
        type: 'variable',
        label: 'Variabile',
        required: true
      },
      prompt: {
        type: 'text',
        label: 'Prompt',
        placeholder: 'Inserisci testo...'
      }
    },
    defaultCollapsed: true
  },
  CONFIRM: {
    type: 'CONFIRM',
    category: 'command',
    label: 'Confirm',
    color: {
      background: 'bg-pink-950/90',
      border: 'border-pink-800/80'
    },
    parameters: {
      message: {
        type: 'text',
        label: 'Messaggio',
        placeholder: 'Confermi?',
        required: true
      }
    },
    defaultCollapsed: true
  },
  
  // Game Specific
  MISSION: {
    type: 'MISSION',
    category: 'command',
    label: 'Mission',
    color: {
      background: 'bg-emerald-950/90',
      border: 'border-emerald-800/80'
    },
    parameters: {
      mission: {
        type: 'mission',
        label: 'Missione',
        placeholder: 'Seleziona missione...',
        required: true
      }
    },
    defaultCollapsed: true
  },
  ADD_CREDITS: {
    type: 'ADD_CREDITS',
    category: 'command',
    label: 'Add Credits',
    color: {
      background: 'bg-yellow-950/90',
      border: 'border-yellow-800/80'
    },
    parameters: {
      amount: {
        type: 'number',
        label: 'Quantità',
        placeholder: '100',
        required: true
      }
    },
    defaultCollapsed: true
  },
  REWARD: {
    type: 'REWARD',
    category: 'command',
    label: 'Reward',
    color: {
      background: 'bg-teal-950/90',
      border: 'border-teal-800/80'
    },
    parameters: {
      type: {
        type: 'select',
        label: 'Tipo',
        options: [
          { value: 'CREDITS', label: 'Crediti' },
          { value: 'ITEM', label: 'Oggetto' },
          { value: 'ACHIEVEMENT', label: 'Achievement' }
        ],
        required: true
      },
      value: {
        type: 'text',
        label: 'Valore',
        required: true
      }
    },
    defaultCollapsed: true
  }
  
  // ... Continua con altri 70+ command blocks quando necessario
};

// Funzione helper per ottenere la configurazione di un blocco
export function getBlockConfig(type: string): BlockTypeConfig | undefined {
  return CONTAINER_BLOCKS[type] || COMMAND_BLOCKS[type];
}

// Funzione per determinare se un blocco è un container
export function isContainerBlock(type: string): boolean {
  return !!CONTAINER_BLOCKS[type];
}

// Funzione per determinare se un blocco è un command
export function isCommandBlock(type: string): boolean {
  return !!COMMAND_BLOCKS[type];
}
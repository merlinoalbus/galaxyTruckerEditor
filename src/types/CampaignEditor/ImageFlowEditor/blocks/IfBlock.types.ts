import { BaseBlock, Block } from '../../VisualFlowEditor/BlockTypes';

// Tipi di condizioni IF supportate
export type IfType = 
  | 'IF'
  | 'IFNOT'
  | 'IF_DEBUG'
  | 'IF_FROM_CAMPAIGN'
  | 'IF_HAS_CREDITS'
  | 'IF_IS'
  | 'IF_MAX'
  | 'IF_MIN'
  | 'IF_MISSION_WON'
  | 'IF_ORDER'
  | 'IF_PROB'
  | 'IF_TUTORIAL_SEEN'
  | 'IFMISSIONRESULTIS'
  | 'IFMISSIONRESULTMIN';

// Interfaccia principale per il blocco IF
export interface IfBlock extends BaseBlock {
  type: 'IF';
  ifType: IfType;
  thenBlocks: Block[];
  elseBlocks: Block[];
  variabile?: string;
  valore?: any;
  numThen: number;
  numElse: number;
}

// Configurazioni specifiche per ogni tipo di IF
export interface IfTypeConfig {
  requiresVariable: boolean;
  requiresValue: boolean;
  valueType?: 'string' | 'number' | 'array' | 'boolean';
  valueConstraints?: {
    min?: number;
    max?: number;
    options?: any[];
  };
  label: string;
  description: string;
}

// Mappa delle configurazioni per tipo
export const IF_TYPE_CONFIGS: Record<IfType, IfTypeConfig> = {
  'IF': {
    requiresVariable: true,
    requiresValue: false,
    label: 'IF',
    description: 'Condizione basata su semaforo'
  },
  'IFNOT': {
    requiresVariable: true,
    requiresValue: false,
    label: 'IF NOT',
    description: 'Condizione negata basata su semaforo'
  },
  'IF_DEBUG': {
    requiresVariable: false,
    requiresValue: false,
    label: 'IF DEBUG',
    description: 'Condizione attiva solo in modalità debug'
  },
  'IF_FROM_CAMPAIGN': {
    requiresVariable: false,
    requiresValue: false,
    label: 'IF FROM CAMPAIGN',
    description: 'Verifica provenienza da campagna'
  },
  'IF_HAS_CREDITS': {
    requiresVariable: false,
    requiresValue: true,
    valueType: 'number',
    valueConstraints: { min: 0 },
    label: 'IF HAS CREDITS',
    description: 'Verifica crediti disponibili'
  },
  'IF_IS': {
    requiresVariable: true,
    requiresValue: true,
    label: 'IF IS',
    description: 'Confronto di uguaglianza'
  },
  'IF_MAX': {
    requiresVariable: true,
    requiresValue: true,
    valueType: 'number',
    label: 'IF MAX',
    description: 'Verifica valore massimo'
  },
  'IF_MIN': {
    requiresVariable: true,
    requiresValue: true,
    valueType: 'number',
    label: 'IF MIN',
    description: 'Verifica valore minimo'
  },
  'IF_MISSION_WON': {
    requiresVariable: false,
    requiresValue: false,
    label: 'IF MISSION WON',
    description: 'Verifica vittoria missione'
  },
  'IF_ORDER': {
    requiresVariable: false,
    requiresValue: true,
    valueType: 'array',
    label: 'IF ORDER',
    description: 'Verifica ordine di arrivo'
  },
  'IF_PROB': {
    requiresVariable: false,
    requiresValue: true,
    valueType: 'number',
    valueConstraints: { min: 0, max: 100 },
    label: 'IF PROBABILITY',
    description: 'Condizione probabilistica'
  },
  'IF_TUTORIAL_SEEN': {
    requiresVariable: false,
    requiresValue: false,
    label: 'IF TUTORIAL SEEN',
    description: 'Verifica tutorial visualizzato'
  },
  'IFMISSIONRESULTIS': {
    requiresVariable: false,
    requiresValue: true,
    valueType: 'string',
    label: 'IF MISSION RESULT IS',
    description: 'Verifica risultato specifico missione'
  },
  'IFMISSIONRESULTMIN': {
    requiresVariable: false,
    requiresValue: true,
    valueType: 'number',
    valueConstraints: { min: 0 },
    label: 'IF MISSION RESULT MIN',
    description: 'Verifica punteggio minimo missione'
  }
};

// Helper functions per validazione
export const validateIfBlock = (block: IfBlock): string[] => {
  const errors: string[] = [];
  const config = IF_TYPE_CONFIGS[block.ifType];
  
  if (!config) {
    errors.push(`Tipo IF non valido: ${block.ifType}`);
    return errors;
  }
  
  if (config.requiresVariable && !block.variabile) {
    errors.push('Variabile richiesta per questo tipo di condizione');
  }
  
  if (config.requiresValue) {
    if (block.valore === undefined || block.valore === null) {
      errors.push('Valore richiesto per questo tipo di condizione');
    } else if (config.valueType === 'number') {
      const numValue = Number(block.valore);
      if (isNaN(numValue)) {
        errors.push('Il valore deve essere un numero');
      } else if (config.valueConstraints) {
        if (config.valueConstraints.min !== undefined && numValue < config.valueConstraints.min) {
          errors.push(`Il valore deve essere >= ${config.valueConstraints.min}`);
        }
        if (config.valueConstraints.max !== undefined && numValue > config.valueConstraints.max) {
          errors.push(`Il valore deve essere <= ${config.valueConstraints.max}`);
        }
      }
    } else if (config.valueType === 'array' && !Array.isArray(block.valore)) {
      errors.push('Il valore deve essere un array');
    }
  }
  
  if (block.numThen === 0 && block.numElse === 0) {
    errors.push('Almeno un ramo (THEN o ELSE) deve contenere blocchi');
  }
  
  return errors;
};

// Helper per creazione nuovo blocco IF
export const createIfBlock = (ifType: IfType = 'IF'): IfBlock => {
  return {
    id: `if-${Date.now()}`,
    type: 'IF',
    ifType,
    thenBlocks: [],
    elseBlocks: [],
    numThen: 0,
    numElse: 0,
    position: { x: 0, y: 0 }
  };
};

// Helper per esportazione
export const exportIfBlock = (block: IfBlock): any => {
  const exported: any = {
    type: block.type,
    ifType: block.ifType,
    thenBlocks: block.thenBlocks,
    elseBlocks: block.elseBlocks,
    numThen: block.numThen,
    numElse: block.numElse
  };
  
  if (block.variabile !== undefined) {
    exported.variabile = block.variabile;
  }
  
  if (block.valore !== undefined) {
    exported.valore = block.valore;
  }
  
  return exported;
};
export interface FlowBlock {
  id: string;
  type: FlowBlockType;
  position: { x: number; y: number };
  data: FlowBlockData;
  metadata: FlowBlockMetadata;
  isContainer: boolean;
  children?: FlowBlock[];
  parentId?: string;
}

export type FlowBlockType = 
  // Dialogue
  | 'SAY' | 'ASK' | 'MENU' | 'OPT'
  // Character Control
  | 'CHARACTER' | 'SHOW' | 'HIDE' | 'CHANGE'
  // Flow Control  
  | 'IF' | 'ELSE' | 'ENDIF' | 'JUMP' | 'LABEL' | 'RETURN'
  // Variables
  | 'SET' | 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE'
  // System
  | 'CALL' | 'WAIT' | 'END' | 'DEBUG'
  // Media
  | 'SOUND' | 'MUSIC' | 'EFFECT'
  // Scene
  | 'BACKGROUND' | 'SCENE' | 'LOCATION'
  // Unknown/Fallback
  | 'UNKNOWN';

export interface FlowBlockData {
  commandType: string;
  parameters: Record<string, any>;
  originalCommand: {
    line: number;
    command: string;
    args: string[];
    original: string;
  };
  translations?: Record<string, string>;
}

export interface FlowBlockMetadata {
  level: number;
  isVisible: boolean;
  isValid: boolean;
  validationErrors: ValidationError[];
  characterState?: CharacterState;
  variableEffects?: VariableEffect[];
  flowContext?: FlowContext;
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  field?: string;
}

export interface CharacterState {
  currentCharacter?: Character;
  visibleCharacters: Character[];
  availableCharacters: Character[];
}

export interface Character {
  id: string;
  name: string;
  isVisible: boolean;
  currentExpression?: string;
  currentPosition?: string;
}

export interface VariableEffect {
  variable: string;
  operation: 'set' | 'add' | 'subtract' | 'multiply' | 'divide';
  value: any;
  condition?: string;
}

export interface FlowContext {
  insideMenu: boolean;
  menuDepth: number;
  conditionalDepth: number;
  hasReturnPath: boolean;
  reachableLabels: string[];
}
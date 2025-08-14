// Block types for VisualFlowEditor
export interface IFlowBlock {
  id: string;
  type: BlockType;
  position?: { x: number; y: number }; // Position for visual editor
  parameters?: BlockParameters;
  children?: IFlowBlock[];
  parentId?: string;
  containerType?: 'if' | 'menu' | 'opt' | 'else';
  containerPath?: string[];
  isFromContainer?: boolean;
  isContainer?: boolean; // Indicates if block contains other blocks
  category?: string;
  
  // Script block specific
  name?: string;
  scriptName?: string; // Script name for SCRIPT blocks
  fileName?: string;
  language?: string;
  missionType?: string;
  blocksMission?: IFlowBlock[]; // Mission blocks for MISSION type
  blocksFinish?: IFlowBlock[]; // Finish blocks for MISSION type
  
  // Build/Flight block specific
  blockInit?: IFlowBlock[];
  blockStart?: IFlowBlock[];
  blockEvaluate?: IFlowBlock[]; // Evaluate blocks for FLIGHT type
  numBlockInit?: number;
  numBlockStart?: number;
  
  // If block specific
  thenBlocks?: IFlowBlock[];
  elseBlocks?: IFlowBlock[];
  
  // Opt block specific
  optType?: 'OPT_SIMPLE' | 'OPT_CONDITIONAL' | 'OPT_CONDITIONAL_NOT';
  condition?: string | null;
  text?: string | Record<string, string>; // Text content for OPT blocks
  
  // Validation
  errors?: ValidationError[];
  isValid?: boolean;
}

export type BlockType = 
  // Script/Mission
  | 'SCRIPT' | 'MISSION'
  // Text/Dialog
  | 'TEXT' | 'SAY' | 'ASK'
  // Menu/Options
  | 'MENU' | 'OPT' | 'EXIT_MENU' 
  // Flow Control
  | 'IF' | 'ELSE' | 'GO' | 'LABEL' | 'SUB_SCRIPT'
  // Variables/Progress
  | 'SET_VARIABLE' | 'SET_ACHIEVEMENT' | 'SET_PROGRESS'
  // Characters/Ships
  | 'ADD_OPPONENT' | 'SET_SHIP' | 'SPAWN_SHIP'
  // Cards/Items
  | 'GIVE_CARD' | 'GIVE_PILE'
  // Build/Tutorial
  | 'BUILD' | 'BUILD_TUTORIAL' | 'FLIGHT'
  // System
  | 'DELAY'
  // Mission/Node
  | 'NEXT_MISSION' | 'NEXT_NODE' | 'SET_NODE_STATUS'
  // Unknown
  | 'UNKNOWN_COMMAND';

export interface BlockParameters {
  text?: string | Record<string, string>; // Support for multilingua
  variable?: string;
  value?: string | number | boolean;
  achievement?: string;
  shiptype?: string;
  character?: string;
  pile?: string;
  card?: string;
  progress?: string;
  node?: string;
  label?: string;
  name?: string; // For label names
  condition?: string;
  script?: string;
  mission?: string;
  image?: string;
  status?: string;
  duration?: number | string; // For DELAY command
  [key: string]: string | number | boolean | Record<string, string> | undefined;
}

export interface ValidationError {
  blockId: string;
  blockType: string;
  errorType: string;
  message: string;
  path?: string[];
  type?: 'error' | 'warning' | 'info';
  field?: string;
}

export interface ValidationResult {
  errors: number;
  invalidBlocks: string[];
  details?: ValidationError[];
}

export interface BlockUpdate {
  parameters?: Partial<BlockParameters>;
  children?: IFlowBlock[];
  isValid?: boolean;
  errors?: ValidationError[];
  scriptName?: string;
  name?: string;
  fileName?: string;
  
  // Build/Flight specific
  blockInit?: IFlowBlock[];
  blockStart?: IFlowBlock[];
  numBlockInit?: number;
  numBlockStart?: number;
  
  // If block specific
  thenBlocks?: IFlowBlock[];
  elseBlocks?: IFlowBlock[];
  
  // Opt block specific
  optType?: 'OPT_SIMPLE' | 'OPT_CONDITIONAL' | 'OPT_CONDITIONAL_NOT';
  condition?: string | null;
  text?: string | Record<string, string>;
}

export interface DraggedBlock {
  block: IFlowBlock;
  sourceContainerId?: string;
  sourceIndex?: number;
}

export interface DraggedTool {
  blockType: BlockType;
  category?: string;
}

export interface ScriptContext {
  scriptName: string;
  isSubScript: boolean;
  parentBlockId?: string;
}

export interface OpenedScript {
  scriptName: string;
  fileName: string;
  blocks: IFlowBlock[];
  isModified: boolean;
}

export interface SessionData {
  scriptLabels?: string[];
  goToLabel?: (label: string) => void;
  availableScripts?: Array<{ name: string; fileName?: string }>;
  onNavigateToSubScript?: (scriptName: string, parentBlock: IFlowBlock) => void;
  availableVariables?: string[];
  availableAchievements?: string[];
  availableCharacters?: string[];
  availableImages?: string[];
  availableNodes?: string[];
  availablePiles?: string[];
  availableShipTypes?: string[];
  variables?: string[]; // Legacy alias for availableVariables
  addVariable?: (name: string) => void;
}
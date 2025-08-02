import { ScriptBlockType } from '@/types/CampaignEditor';

// Position and layout types
export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

// Flow block structure
export interface FlowBlock {
  id: string;
  type: ScriptBlockType;
  position: Position;
  data: any;
  parentId?: string;
  branchType?: 'if' | 'else' | 'option';
  branchIndex?: number;
  isValid: boolean;
  validationErrors: string[];
  validationWarnings?: string[];
  metadata?: {
    currentCharacter?: {
      name: string;
      image: string;
    };
  };
}

// Connection between blocks
export interface FlowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type: 'sequential' | 'branch';
}

// Character state tracking
export interface CharacterState {
  baseImage: string;
  currentImage: string;
  isShown: boolean;
  position?: string;
}

// Branch information
export interface BranchInfo {
  type: 'main' | 'if' | 'else' | 'menu-option';
  parentBlockId?: string;
  index?: number;
}

// Flow state at a specific point
export interface FlowState {
  characterStates: Map<string, CharacterState>;
  variables: Map<string, any>;
  semafori: Map<string, boolean>;
  lastAskBlockId?: string;
  currentBranch: BranchInfo;
}

// Validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ValidationError {
  id: string;
  type: string;
  message: string;
  blockId: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning extends ValidationError {
  severity: 'warning';
}

// Drag and drop
export interface DragState {
  isDragging: boolean;
  draggedBlockId?: string;
  dragOffset?: Position;
  validDropZones: DropZone[];
  hoveredDropZone?: string;
}

export interface DropZone {
  id: string;
  blockId: string;
  type: 'before' | 'after' | 'inside';
  position: Position;
  dimensions: Dimensions;
  isValid: boolean;
  isHovered: boolean;
}

// Add block menu
export interface AddBlockMenuState {
  isOpen: boolean;
  position: Position;
  targetBlockId?: string;
  targetType: 'before' | 'after' | 'inside';
  availableBlocks: AvailableBlock[];
}

export interface AvailableBlock {
  type: ScriptBlockType;
  isValid: boolean;
  validationMessage?: string;
  category: string;
  label: string;
  description: string;
  icon: string;
}

// Component props - import from main types
export type { VisualFlowEditorProps } from '@/types/CampaignEditor';

// Hook return type
export interface UseVisualFlowEditorReturn {
  // State
  blocks: FlowBlock[];
  connections: FlowConnection[];
  flowState: FlowState;
  dragState: DragState;
  addBlockMenuState: AddBlockMenuState;
  selectedBlockId?: string;
  validationResults: Map<string, ValidationResult>;
  
  // Actions
  initializeFromScript: (scriptName: string) => void;
  generateScript: () => void;
  
  addBlock: (type: ScriptBlockType, targetBlockId?: string, targetType?: 'before' | 'after' | 'inside') => void;
  removeBlock: (blockId: string) => void;
  updateBlock: (blockId: string, updates: Partial<FlowBlock>) => void;
  moveBlock: (blockId: string, position: Position) => void;
  
  selectBlock: (blockId: string | undefined) => void;
  
  startDrag: (blockId: string, offset: Position) => void;
  updateDrag: (position: Position) => void;
  endDrag: () => void;
  
  openAddBlockMenu: (position: Position, targetBlockId?: string, targetType?: 'before' | 'after' | 'inside') => void;
  closeAddBlockMenu: () => void;
}

// Re-export commonly used types
export type BlockType = ScriptBlockType;
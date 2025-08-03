export interface FlowBlock {
  id: string;
  type: FlowBlockType;
  position: Position;
  data: BlockData;
  parentId?: string;
  branchType?: BranchType;
  metadata?: BlockMetadata;
}

export type FlowBlockType = 
  | 'say'
  | 'ask' 
  | 'announce'
  | 'show_character'
  | 'hide_character'
  | 'change_character'
  | 'set_variable'
  | 'reset_variable'
  | 'set_to_variable'
  | 'dialog_container'
  | 'menu_container'
  | 'if_container';

export type BranchType = 'main' | 'if' | 'else' | 'menu_option';

export interface Position {
  x: number;
  y: number;
}

export interface BlockData {
  text?: string;
  character?: string;
  image?: string;
  variable?: string;
  value?: string | number | boolean;
  target?: string;
  condition?: string;
  options?: string[];
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface BlockMetadata {
  currentCharacter?: string;
  visibleCharacters?: string[];
  branchPath?: string[];
  lastAskInBranch?: string;
}

export interface FlowState {
  characterStates: Map<string, CharacterState>;
  variables: Map<string, VariableState>;
  branchStack: BranchContext[];
  lastAskPerBranch: Map<string, string>;
}

export interface CharacterState {
  name: string;
  isVisible: boolean;
  currentImage: string;
  baseImage: string;
}

export interface VariableState {
  name: string;
  type: 'boolean' | 'number';
  value: boolean | number;
}

export interface BranchContext {
  type: 'if' | 'menu';
  blockId: string;
  activeBranch: string;
  availableBranches: string[];
}

export interface ValidationResult {
  blockId: string;
  type: 'error' | 'warning';
  message: string;
  rule: ValidationRule;
}

export type ValidationRule = 
  | 'menu_needs_ask'
  | 'consecutive_asks'
  | 'character_not_visible'
  | 'invalid_block_in_container'
  | 'missing_character'
  | 'invalid_variable';

export interface AnchorPoint {
  id: string;
  blockId: string;
  position: 'before' | 'after' | 'inside';
  coordinates: Position;
  isValid: boolean;
  reason?: string;
}

export interface DragState {
  isDragging: boolean;
  draggedBlockId?: string;
  startPosition?: Position;
  currentPosition?: Position;
  availableAnchors: AnchorPoint[];
  targetAnchor?: AnchorPoint;
}

export interface AddBlockMenuState {
  isOpen: boolean;
  position: Position;
  targetAnchor?: AnchorPoint;
  availableBlockTypes: AvailableBlockType[];
}

export interface AvailableBlockType {
  type: FlowBlockType;
  label: string;
  icon: string;
  isEnabled: boolean;
  disabledReason?: string;
}

export interface FlowConnection {
  from: string;
  to: string;
  type: 'sequential' | 'branch';
  branchLabel?: string;
}

import { CampaignScript, MapNode } from '../../InteractiveMap/InteractiveMap.types';

export interface Character {
  name: string;
  image?: string;
  images?: string[];
  isVisible?: boolean;
}

export interface VisualFlowEditorProps {
  selectedScript?: CampaignScript | null;
  selectedNode?: MapNode | null;
  onScriptChange?: (script: CampaignScript) => void;
}
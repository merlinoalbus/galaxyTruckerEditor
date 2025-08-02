import { FlowBlock, BlockType, CharacterState, ValidationError, ValidationWarning } from '../../VisualFlowEditor.types';

export interface ValidationEngineProps {
  blocks: FlowBlock[];
  characterStates: Map<string, CharacterState>;
  variables: Map<string, any>;
  semafori: Set<string>;
  onValidationChange: (blockId: string, validation: BlockValidationResult) => void;
}

export interface BlockValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  canInsertAfter: BlockType[];
  canInsertBefore: BlockType[];
  contextualBlocks: BlockType[];
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  blockTypes: BlockType[];
  validator: (context: ValidationContext) => ValidationResult;
  priority: number;
}

export interface ValidationContext {
  currentBlock: FlowBlock;
  allBlocks: FlowBlock[];
  characterStates: Map<string, CharacterState>;
  variables: Map<string, any>;
  semafori: Set<string>;
  branchContext: BranchValidationContext;
  flowHistory: FlowBlock[];
}

export interface BranchValidationContext {
  type: 'linear' | 'if' | 'else' | 'menu';
  parentBlockId?: string;
  siblingBlocks: FlowBlock[];
  depth: number;
  lastAskInBranch?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions?: string[];
}

export interface FlowValidationState {
  globalValid: boolean;
  blockValidations: Map<string, BlockValidationResult>;
  globalErrors: ValidationError[];
  globalWarnings: ValidationWarning[];
}

export type ValidationRuleType = 
  | 'character_visibility'
  | 'ask_consecutive'
  | 'menu_prerequisites'
  | 'variable_existence'
  | 'parameter_validation'
  | 'branch_structure'
  | 'flow_continuity';
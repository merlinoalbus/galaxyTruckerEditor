import { FlowBlock, BlockType, CharacterState, ValidationError, ValidationWarning } from '../../VisualFlowEditor.types';

export interface BlockRendererProps {
  block: FlowBlock;
  isSelected: boolean;
  isHovered: boolean;
  characterStates: Map<string, CharacterState>;
  variables: Map<string, any>;
  semafori: Set<string>;
  onBlockEdit: (blockId: string, field: string, value: any) => void;
  onBlockDelete: (blockId: string) => void;
  onParameterChange: (blockId: string, parameter: string, value: any) => void;
  languages: string[];
  currentLanguage: string;
}

export interface BlockComponent {
  type: BlockType;
  component: React.FC<BlockComponentProps>;
  category: BlockCategory;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  isImplemented: boolean;
}

export interface BlockComponentProps extends BlockRendererProps {
  onOpenPicker?: (type: 'character' | 'image' | 'variable', currentValue?: any) => void;
  onValidationChange?: (validation: BlockValidation) => void;
}

export interface BlockValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  canEdit: boolean;
}

export interface BlockCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  order: number;
}

export interface BlockStyle {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
}

export interface BlockEditState {
  isEditing: boolean;
  editingField?: string;
  editingValue?: any;
  hasUnsavedChanges: boolean;
}

export interface RenderableBlock {
  block: FlowBlock;
  component: BlockComponent;
  style: BlockStyle;
  editState: BlockEditState;
  validation: BlockValidation;
}

export interface BlockTheme {
  [key in BlockType]: {
    background: string;
    border: string;
    text: string;
    icon: string;
    accent: string;
  };
}

export interface ImplementedBlocks {
  dialogue: boolean;
  question: boolean;
  announce: boolean;
  show_character: boolean;
  hide_character: boolean;
  change_character: boolean;
  variable_set: boolean;
  variable_reset: boolean;
  variable_set_to: boolean;
  dialog_start: boolean;
  dialog_end: boolean;
  menu_start: boolean;
  menu_end: boolean;
}

export interface UnimplementedBlockProps {
  block: FlowBlock;
  reason: string;
  showWarning: boolean;
  preserveInFlow: boolean;
}
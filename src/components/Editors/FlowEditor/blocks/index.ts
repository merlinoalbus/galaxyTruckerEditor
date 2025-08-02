// Barrel export for all block components
export { SayBlock } from './SayBlock';
export { AskBlock } from './AskBlock';  
export { AnnounceBlock } from './AnnounceBlock';
export { ShowCharacterBlock } from './ShowCharacterBlock';
export { HideCharacterBlock } from './HideCharacterBlock';
export { ChangeCharacterBlock } from './ChangeCharacterBlock';
export { SetVariableBlock } from './SetVariableBlock';
export { ResetVariableBlock } from './ResetVariableBlock';
export { SetToVariableBlock } from './SetToVariableBlock';
export { DialogBlock } from './DialogBlock';
export { MenuBlock } from './MenuBlock';
export { IfBlock } from './IfBlock';
export { BaseBlock } from './BaseBlock';

// Common interfaces
export interface CharacterState {
  currentImage: string;
  baseImage: string;
  isShown: boolean;
}

export interface BlockProps {
  block: any;
  isEditing: boolean;
  editingField: any;
  editingValue: string;
  selectedLanguage: string;
  showAllLanguages: boolean;
  translations: Map<string, Record<string, string>>;
  availableNodes: any[];
  variables: Map<string, boolean>;
  characters: any[];
  characterStates: Map<string, CharacterState>;
  languages: string[];
  onStartEditing: (blockId: string, field: string, currentValue: string, language?: string) => void;
  onSaveEdit: () => void;
  onEditingValueChange: (value: string) => void;
  onOpenCharacterPicker: (blockId: string, field: string, current?: string) => void;
  onOpenVariablePicker: (blockId: string, field: string, current?: string, action?: string) => void;
  onOpenNodeSelector: (blockId: string, field: string, current?: string) => void;
  onOpenButtonSelector: (blockId: string, field: string, current?: string) => void;
  onDeleteBlock?: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
}

export interface NavigationProps {
  blockId: string;
  onDeleteBlock?: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
}
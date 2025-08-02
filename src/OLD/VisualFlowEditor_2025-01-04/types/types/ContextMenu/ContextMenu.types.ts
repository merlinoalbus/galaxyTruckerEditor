import { BlockType, FlowBlock } from '../../VisualFlowEditor.types';

export interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  targetBlockId?: string;
  insertPosition?: 'before' | 'after' | 'inside';
  availableBlocks: BlockType[];
  onBlockInsert: (blockType: BlockType, targetBlockId?: string, position?: 'before' | 'after' | 'inside') => void;
  onClose: () => void;
}

export interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  targetBlockId?: string;
  insertPosition?: 'before' | 'after' | 'inside';
  searchTerm: string;
  selectedIndex: number;
  filteredOptions: ContextMenuOption[];
}

export interface ContextMenuOption {
  id: string;
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  category: string;
  keywords: string[];
  isAvailable: boolean;
  reason?: string;
  shortcut?: string;
}

export interface ContextMenuCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  collapsed?: boolean;
}

export interface ContextMenuFilters {
  categories: Set<string>;
  implemented: boolean;
  available: boolean;
  searchTerm: string;
}

export interface ContextMenuActions {
  onInsertBlock: (blockType: BlockType) => void;
  onEditBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onCollapseBlock: (blockId: string) => void;
  onAddToFavorites: (blockType: BlockType) => void;
}

export interface ContextMenuConfig {
  showIcons: boolean;
  showDescriptions: boolean;
  showShortcuts: boolean;
  showCategories: boolean;
  maxHeight: number;
  searchThreshold: number;
  keyboardNavigation: boolean;
  autoFocus: boolean;
}

export interface ContextMenuKeyboard {
  onArrowUp: () => void;
  onArrowDown: () => void;
  onEnter: () => void;
  onEscape: () => void;
  onSearch: (term: string) => void;
  onCategoryToggle: (categoryId: string) => void;
}
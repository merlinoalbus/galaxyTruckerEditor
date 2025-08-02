import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ContextMenuOption,
  ContextMenuCategory,
  BlockType
} from '../../../../../types/CampaignEditor';

// Local ContextMenuState definition for this hook
interface LocalContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  targetBlockId?: string;
  insertPosition?: 'before' | 'after' | 'inside';
  searchTerm: string;
  selectedIndex: number;
  filteredOptions: ContextMenuOption[];
}

export const useContextMenu = (
  availableBlocks: BlockType[],
  onBlockInsert: (blockType: BlockType, targetBlockId?: string, position?: 'before' | 'after' | 'inside') => void
) => {
  const [contextMenuState, setContextMenuState] = useState<LocalContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    searchTerm: '',
    selectedIndex: 0,
    filteredOptions: []
  });

  const categories: ContextMenuCategory[] = useMemo(() => [
    {
      id: 'dialogue',
      name: 'Dialogue',
      icon: '💬',
      color: 'blue',
      order: 1
    },
    {
      id: 'character',
      name: 'Character',
      icon: '👤',
      color: 'purple',
      order: 2
    },
    {
      id: 'variables',
      name: 'Variables',
      icon: '🔧',
      color: 'green',
      order: 3
    },
    {
      id: 'flow',
      name: 'Flow Control',
      icon: '🔀',
      color: 'orange',
      order: 4
    },
    {
      id: 'system',
      name: 'System',
      icon: '⚙️',
      color: 'gray',
      order: 5
    }
  ], []);

  const allOptions: ContextMenuOption[] = useMemo(() => [
    {
      id: 'dialogue',
      type: 'dialogue',
      label: 'Say',
      description: 'Character dialogue',
      icon: '💬',
      category: 'dialogue',
      keywords: ['say', 'dialogue', 'speak', 'talk'],
      isAvailable: true,
      shortcut: 'S'
    },
    {
      id: 'question',
      type: 'question',
      label: 'Ask',
      description: 'Ask player a question',
      icon: '❓',
      category: 'dialogue',
      keywords: ['ask', 'question', 'prompt'],
      isAvailable: true,
      shortcut: 'A'
    },
    {
      id: 'announce',
      type: 'announce',
      label: 'Announce',
      description: 'System announcement',
      icon: '📢',
      category: 'system',
      keywords: ['announce', 'system', 'notification'],
      isAvailable: true,
      shortcut: 'N'
    },
    {
      id: 'show_character',
      type: 'show_character',
      label: 'Show Character',
      description: 'Display a character',
      icon: '👁️',
      category: 'character',
      keywords: ['show', 'character', 'display'],
      isAvailable: true,
      shortcut: 'C'
    },
    {
      id: 'hide_character',
      type: 'hide_character',
      label: 'Hide Character',
      description: 'Hide a character',
      icon: '👻',
      category: 'character',
      keywords: ['hide', 'character', 'remove'],
      isAvailable: true
    },
    {
      id: 'change_character',
      type: 'change_character',
      label: 'Change Character',
      description: 'Change character image',
      icon: '🔄',
      category: 'character',
      keywords: ['change', 'character', 'image', 'switch'],
      isAvailable: true
    },
    {
      id: 'variable_set',
      type: 'variable_set',
      label: 'Set Variable',
      description: 'Set semaforo to ON',
      icon: '🔛',
      category: 'variables',
      keywords: ['set', 'variable', 'semaforo', 'on'],
      isAvailable: true,
      shortcut: 'V'
    },
    {
      id: 'variable_reset',
      type: 'variable_reset',
      label: 'Reset Variable',
      description: 'Reset semaforo to OFF',
      icon: '🔴',
      category: 'variables',
      keywords: ['reset', 'variable', 'semaforo', 'off'],
      isAvailable: true
    },
    {
      id: 'variable_set_to',
      type: 'variable_set_to',
      label: 'Set Variable To',
      description: 'Set numeric variable',
      icon: '🔢',
      category: 'variables',
      keywords: ['set', 'variable', 'number', 'value'],
      isAvailable: true
    },
    {
      id: 'menu_start',
      type: 'menu_start',
      label: 'Menu',
      description: 'Create menu options',
      icon: '📋',
      category: 'flow',
      keywords: ['menu', 'options', 'choice'],
      isAvailable: true,
      shortcut: 'M'
    },
    {
      id: 'condition_start',
      type: 'condition_start',
      label: 'If Condition',
      description: 'Conditional branching',
      icon: '🔀',
      category: 'flow',
      keywords: ['if', 'condition', 'branch'],
      isAvailable: true,
      shortcut: 'I'
    },
    {
      id: 'condition_start_not',
      type: 'condition_start_not',
      label: 'If Not Condition',
      description: 'Negative conditional branching',
      icon: '🚫',
      category: 'flow',
      keywords: ['if not', 'condition', 'branch', 'negative'],
      isAvailable: true
    },
    {
      id: 'dialog_start',
      type: 'dialog_start',
      label: 'Dialog Container',
      description: 'Group dialogue blocks',
      icon: '📦',
      category: 'dialogue',
      keywords: ['dialog', 'container', 'group'],
      isAvailable: true
    }
  ], []);

  const filteredOptions = useMemo(() => {
    let filtered = allOptions.filter(option => 
      availableBlocks.includes(option.type) &&
      option.isAvailable
    );

    if (contextMenuState.searchTerm) {
      const term = contextMenuState.searchTerm.toLowerCase();
      filtered = filtered.filter(option =>
        option.label.toLowerCase().includes(term) ||
        option.description.toLowerCase().includes(term) ||
        option.keywords.some(keyword => keyword.includes(term))
      );
    }

    return filtered.sort((a, b) => {
      const categoryA = categories.find(cat => cat.id === a.category);
      const categoryB = categories.find(cat => cat.id === b.category);
      return (categoryA?.order || 999) - (categoryB?.order || 999);
    });
  }, [allOptions, availableBlocks, contextMenuState.searchTerm, categories]);

  const openContextMenu = useCallback((
    position: { x: number; y: number },
    targetBlockId?: string,
    insertPosition?: 'before' | 'after' | 'inside'
  ) => {
    setContextMenuState(prev => ({
      ...prev,
      isOpen: true,
      position,
      targetBlockId,
      insertPosition,
      selectedIndex: 0,
      filteredOptions: filteredOptions
    }));
  }, [filteredOptions]);

  const closeContextMenu = useCallback(() => {
    setContextMenuState(prev => ({
      ...prev,
      isOpen: false,
      targetBlockId: undefined,
      insertPosition: undefined,
      searchTerm: '',
      selectedIndex: 0
    }));
  }, []);

  const handleSearch = useCallback((term: string) => {
    setContextMenuState(prev => ({
      ...prev,
      searchTerm: term,
      selectedIndex: 0
    }));
  }, []);

  const handleKeyboardNavigation = useCallback((key: string) => {
    switch (key) {
      case 'ArrowUp':
        setContextMenuState(prev => ({
          ...prev,
          selectedIndex: Math.max(0, prev.selectedIndex - 1)
        }));
        break;
      case 'ArrowDown':
        setContextMenuState(prev => ({
          ...prev,
          selectedIndex: Math.min(filteredOptions.length - 1, prev.selectedIndex + 1)
        }));
        break;
      case 'Enter':
        if (filteredOptions[contextMenuState.selectedIndex]) {
          handleOptionSelect(filteredOptions[contextMenuState.selectedIndex]);
        }
        break;
      case 'Escape':
        closeContextMenu();
        break;
      default:
        // Check for shortcut keys
        const option = filteredOptions.find(opt => opt.shortcut?.toLowerCase() === key.toLowerCase());
        if (option) {
          handleOptionSelect(option);
        }
        break;
    }
  }, [filteredOptions, contextMenuState.selectedIndex, closeContextMenu]);

  const handleOptionSelect = useCallback((option: ContextMenuOption) => {
    onBlockInsert(
      option.type,
      contextMenuState.targetBlockId,
      contextMenuState.insertPosition
    );
    closeContextMenu();
  }, [onBlockInsert, contextMenuState, closeContextMenu]);

  const getOptionsByCategory = useCallback(() => {
    const grouped = new Map<string, ContextMenuOption[]>();
    
    filteredOptions.forEach(option => {
      if (!grouped.has(option.category)) {
        grouped.set(option.category, []);
      }
      grouped.get(option.category)!.push(option);
    });

    return Array.from(grouped.entries()).map(([categoryId, options]) => ({
      category: categories.find(cat => cat.id === categoryId)!,
      options
    })).filter(group => group.category).sort((a, b) => a.category.order - b.category.order);
  }, [filteredOptions, categories]);

  // Update filtered options when dependencies change
  useEffect(() => {
    setContextMenuState(prev => ({
      ...prev,
      filteredOptions
    }));
  }, [filteredOptions]);

  // Handle clicks outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuState.isOpen) {
        closeContextMenu();
      }
    };

    if (contextMenuState.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenuState.isOpen, closeContextMenu]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (contextMenuState.isOpen) {
        event.preventDefault();
        handleKeyboardNavigation(event.key);
      }
    };

    if (contextMenuState.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [contextMenuState.isOpen, handleKeyboardNavigation]);

  return {
    contextMenuState,
    openContextMenu,
    closeContextMenu,
    handleSearch,
    handleOptionSelect,
    getOptionsByCategory,
    categories,
    filteredOptions
  };
};
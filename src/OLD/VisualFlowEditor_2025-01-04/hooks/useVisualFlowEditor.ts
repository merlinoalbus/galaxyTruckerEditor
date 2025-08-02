import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  FlowBlock,
  FlowConnection,
  FlowState,
  DragState,
  AddBlockMenuState,
  ValidationResult,
  Position,
  CharacterState,
  BranchInfo,
  AvailableBlock,
  UseVisualFlowEditorReturn,
  VisualFlowEditorProps
} from '../../../types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';
import { ScriptBlockType } from '../../../types/CampaignEditor';
import { CampaignScriptParser } from '../../../services/CampaignScriptParser';

const CHARACTERS = [
  { name: 'tutor', images: ['tutor.png', 'tutor-smile.png'], displayName: 'Tutor' },
  { name: 'mechanic', images: ['mech.png', 'mech-blush.png'], displayName: 'Mechanic' },
  // ... other characters
];

export const useVisualFlowEditor = ({
  selectedScript,
  selectedNode,
  onScriptChange
}: VisualFlowEditorProps): UseVisualFlowEditorReturn => {
  // Core state
  const [blocks, setBlocks] = useState<FlowBlock[]>([]);
  const [connections, setConnections] = useState<FlowConnection[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>();
  
  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    validDropZones: []
  });
  
  // Add block menu state
  const [addBlockMenuState, setAddBlockMenuState] = useState<AddBlockMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    availableBlocks: []
  });
  
  const parser = useMemo(() => CampaignScriptParser.getInstance(), []);

  // Calculate flow state at any point
  const calculateFlowState = useCallback((targetBlockId?: string): FlowState => {
    const characterStates = new Map<string, CharacterState>();
    const variables = new Map<string, any>();
    const semafori = new Map<string, boolean>();
    let lastAskBlockId: string | undefined;
    
    // Initialize character states
    CHARACTERS.forEach(char => {
      characterStates.set(char.name, {
        baseImage: char.images[0],
        currentImage: char.images[0],
        isShown: false
      });
    });
    
    // Process blocks in order up to target block
    const processedBlocks = new Set<string>();
    const processBlock = (block: FlowBlock) => {
      if (processedBlocks.has(block.id) || (targetBlockId && block.id === targetBlockId)) {
        return;
      }
      processedBlocks.add(block.id);
      
      // Update character states
      if (block.type === ScriptBlockType.SHOW_CHARACTER) {
        const characterName = block.data?.character;
        if (characterName) {
          const state = characterStates.get(characterName);
          if (state) {
            characterStates.set(characterName, {
              ...state,
              isShown: true,
              currentImage: block.data?.image || state.baseImage
            });
          }
        }
      } else if (block.type === ScriptBlockType.HIDE_CHARACTER) {
        const characterName = block.data?.character;
        if (characterName) {
          const state = characterStates.get(characterName);
          if (state) {
            characterStates.set(characterName, {
              ...state,
              isShown: false
            });
          }
        }
      } else if (block.type === ScriptBlockType.CHANGE_CHARACTER) {
        const characterName = block.data?.character;
        const newImage = block.data?.image;
        if (characterName && newImage) {
          const state = characterStates.get(characterName);
          if (state && state.isShown) {
            characterStates.set(characterName, {
              ...state,
              currentImage: newImage
            });
          }
        }
      }
      
      // Update variables
      if (block.type === ScriptBlockType.SET_VARIABLE) {
        const variable = block.data?.variable;
        if (variable) {
          semafori.set(variable, true);
        }
      } else if (block.type === ScriptBlockType.RESET_VARIABLE) {
        const variable = block.data?.variable;
        if (variable) {
          semafori.set(variable, false);
        }
      } else if (block.type === ScriptBlockType.SET_TO_VARIABLE) {
        const variable = block.data?.variable;
        const value = block.data?.value;
        if (variable && value !== undefined) {
          variables.set(variable, value);
        }
      }
      
      // Track last Ask block
      if (block.type === ScriptBlockType.ASK) {
        lastAskBlockId = block.id;
      }
    };
    
    // Sort blocks by position and process in order
    const sortedBlocks = [...blocks].sort((a, b) => a.position.y - b.position.y);
    sortedBlocks.forEach(processBlock);
    
    return {
      characterStates,
      variables,
      semafori,
      lastAskBlockId,
      currentBranch: { type: 'main' }
    };
  }, [blocks]);
  
  // Get current flow state
  const flowState = useMemo(() => calculateFlowState(), [calculateFlowState]);
  
  // Get available blocks for current position
  const getAvailableBlocks = useCallback((
    targetBlockId?: string,
    targetType: 'before' | 'after' | 'inside' = 'after'
  ): AvailableBlock[] => {
    const currentFlowState = targetBlockId ? 
      calculateFlowState(targetBlockId) : flowState;
    
    const baseBlocks: AvailableBlock[] = [
      {
        type: ScriptBlockType.SAY,
        isValid: true,
        category: 'dialogue',
        label: 'Say (Dialogue)',
        description: 'Character speaks a line',
        icon: '💬'
      },
      {
        type: ScriptBlockType.ANNOUNCE,
        isValid: true,
        category: 'dialogue',
        label: 'Announce',
        description: 'System announcement',
        icon: '📢'
      },
      {
        type: ScriptBlockType.SHOW_CHARACTER,
        isValid: true,
        category: 'character',
        label: 'Show Character',
        description: 'Display character on screen',
        icon: '👤'
      }
    ];
    
    // Ask - only if not after another Ask
    const targetBlock = blocks.find(b => b.id === targetBlockId);
    if (!targetBlock || targetBlock.type !== ScriptBlockType.ASK || targetType !== 'after') {
      baseBlocks.push({
        type: ScriptBlockType.ASK,
        isValid: true,
        category: 'dialogue',
        label: 'Ask (Question)',
        description: 'Ask player a question',
        icon: '❓'
      });
    } else {
      baseBlocks.push({
        type: ScriptBlockType.ASK,
        isValid: false,
        category: 'dialogue',
        label: 'Ask (Question)',
        description: 'Ask player a question',
        icon: '❓',
        validationMessage: 'Cannot place Ask after another Ask'
      });
    }
    
    // Menu - only if Ask exists
    if (currentFlowState.lastAskBlockId) {
      baseBlocks.push({
        type: ScriptBlockType.MENU_CONTAINER,
        isValid: true,
        category: 'containers',
        label: 'Menu',
        description: 'Interactive menu container',
        icon: '📋'
      });
    } else {
      baseBlocks.push({
        type: ScriptBlockType.MENU_CONTAINER,
        isValid: false,
        category: 'containers',
        label: 'Menu',
        description: 'Interactive menu container',
        icon: '📋',
        validationMessage: 'Menu must be preceded by an Ask block'
      });
    }
    
    // Hide/Change Character - only if characters visible
    const visibleCharacters = Array.from(currentFlowState.characterStates.entries())
      .filter(([_, state]) => state.isShown);
    
    if (visibleCharacters.length > 0) {
      baseBlocks.push(
        {
          type: ScriptBlockType.HIDE_CHARACTER,
          isValid: true,
          category: 'character',
          label: 'Hide Character',
          description: 'Hide character from screen',
          icon: '👥'
        },
        {
          type: ScriptBlockType.CHANGE_CHARACTER,
          isValid: true,
          category: 'character',
          label: 'Change Character',
          description: 'Switch character image/pose',
          icon: '🔄'
        }
      );
    } else {
      baseBlocks.push(
        {
          type: ScriptBlockType.HIDE_CHARACTER,
          isValid: false,
          category: 'character',
          label: 'Hide Character',
          description: 'Hide character from screen',
          icon: '👥',
          validationMessage: 'No visible characters to hide'
        },
        {
          type: ScriptBlockType.CHANGE_CHARACTER,
          isValid: false,
          category: 'character',
          label: 'Change Character',
          description: 'Switch character image/pose',
          icon: '🔄',
          validationMessage: 'No visible characters to change'
        }
      );
    }
    
    return baseBlocks;
  }, [blocks, flowState, calculateFlowState]);
  
  // Validate blocks
  const validationResults = useMemo(() => {
    const results = new Map<string, ValidationResult>();
    
    blocks.forEach(block => {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Get flow state up to this block
      const blockFlowState = calculateFlowState(block.id);
      
      // Validate based on block type
      if (block.type === ScriptBlockType.MENU_CONTAINER) {
        if (!blockFlowState.lastAskBlockId) {
          errors.push('Menu must be preceded by an Ask block');
        }
      } else if (block.type === ScriptBlockType.HIDE_CHARACTER || 
                 block.type === ScriptBlockType.CHANGE_CHARACTER) {
        const characterName = block.data?.character;
        if (characterName) {
          const characterState = blockFlowState.characterStates.get(characterName);
          if (!characterState || !characterState.isShown) {
            errors.push(`Character "${characterName}" is not visible`);
          }
        }
      }
      
      // Update block metadata with current character for Say/Ask
      if (block.type === ScriptBlockType.SAY || block.type === ScriptBlockType.ASK) {
        const visibleCharacters = Array.from(blockFlowState.characterStates.entries())
          .filter(([_, state]) => state.isShown);
        
        if (visibleCharacters.length === 1) {
          const [charName, charState] = visibleCharacters[0];
          block.metadata = {
            currentCharacter: {
              name: charName,
              image: charState.currentImage
            }
          };
        }
      }
      
      results.set(block.id, {
        isValid: errors.length === 0,
        errors,
        warnings
      });
    });
    
    return results;
  }, [blocks, calculateFlowState]);
  
  // Actions
  const initializeFromScript = useCallback(async (scriptName: string) => {
    try {
      // This would parse script and create blocks
      // For now, create a simple test flow
      const testBlocks: FlowBlock[] = [
        {
          id: uuidv4(),
          type: ScriptBlockType.SHOW_CHARACTER,
          position: { x: 100, y: 100 },
          data: { character: 'tutor', image: 'tutor.png' },
          isValid: true,
          validationErrors: []
        },
        {
          id: uuidv4(),
          type: ScriptBlockType.SAY,
          position: { x: 100, y: 200 },
          data: { text: 'Hello! Welcome to the tutorial.' },
          isValid: true,
          validationErrors: []
        }
      ];
      
      setBlocks(testBlocks);
      setConnections([]);
    } catch (error) {
      console.error('Error loading script:', error);
    }
  }, []);
  
  const generateScript = useCallback(() => {
    // Convert blocks back to script format
    console.log('Generating script from blocks:', blocks);
  }, [blocks]);
  
  const addBlock = useCallback((
    type: ScriptBlockType,
    targetBlockId?: string,
    targetType: 'before' | 'after' | 'inside' = 'after'
  ) => {
    const newBlock: FlowBlock = {
      id: uuidv4(),
      type,
      position: { x: 100, y: blocks.length * 100 + 100 },
      data: {},
      isValid: true,
      validationErrors: []
    };
    
    setBlocks(prev => [...prev, newBlock]);
  }, [blocks]);
  
  const removeBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    setConnections(prev => prev.filter(c => c.source !== blockId && c.target !== blockId));
  }, []);
  
  const updateBlock = useCallback((blockId: string, updates: Partial<FlowBlock>) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
  }, []);
  
  const moveBlock = useCallback((blockId: string, position: Position) => {
    updateBlock(blockId, { position });
  }, [updateBlock]);
  
  const selectBlock = useCallback((blockId: string | undefined) => {
    setSelectedBlockId(blockId);
  }, []);
  
  const startDrag = useCallback((blockId: string, offset: Position) => {
    setDragState({
      isDragging: true,
      draggedBlockId: blockId,
      dragOffset: offset,
      validDropZones: []
    });
  }, []);
  
  const updateDrag = useCallback((position: Position) => {
    if (!dragState.isDragging) return;
    
    // Update drag position logic here
    setDragState(prev => ({ ...prev }));
  }, [dragState.isDragging]);
  
  const endDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      validDropZones: []
    });
  }, []);
  
  const openAddBlockMenu = useCallback((
    position: Position,
    targetBlockId?: string,
    targetType: 'before' | 'after' | 'inside' = 'after'
  ) => {
    const availableBlocks = getAvailableBlocks(targetBlockId, targetType);
    
    setAddBlockMenuState({
      isOpen: true,
      position,
      targetBlockId,
      targetType,
      availableBlocks
    });
  }, [getAvailableBlocks]);
  
  const closeAddBlockMenu = useCallback(() => {
    setAddBlockMenuState(prev => ({ ...prev, isOpen: false }));
  }, []);
  
  return {
    // State
    blocks,
    connections,
    flowState,
    dragState,
    addBlockMenuState,
    selectedBlockId,
    validationResults,
    
    // Actions
    initializeFromScript,
    generateScript,
    
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    
    selectBlock,
    
    startDrag,
    updateDrag,
    endDrag,
    
    openAddBlockMenu,
    closeAddBlockMenu
  };
};
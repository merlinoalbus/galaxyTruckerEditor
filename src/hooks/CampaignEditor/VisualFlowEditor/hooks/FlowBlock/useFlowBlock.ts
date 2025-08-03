import { useState, useCallback } from 'react';
import { FlowBlock, FlowBlockType } from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';
import { CampaignScript } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';

// Costanti per il layout con spacing migliorato
const VERTICAL_SPACING = 50;
const CONTAINER_SPACING = 60;
const BLOCK_WIDTH = 320;
const CONTAINER_MIN_HEIGHT = 300;
const ATOMIC_HEIGHT = 100;
const CONTAINER_PADDING = 30;

// Funzione per convertire i blocchi del backend in FlowBlocks per UI con layout spaziale
function convertBackendBlocksToFlowBlocks(backendBlocks: any[]): FlowBlock[] {
  const flowBlocks: FlowBlock[] = [];
  let currentY = 50;
  const baseX = 50;

  const processBlock = (block: any, index: number): string | null => {
    const position = { x: baseX, y: currentY };
    let flowBlock: FlowBlock | null = null;

    switch (block.type) {
      case 'conditional':
        flowBlock = {
          id: block.id || `if-${Date.now()}-${index}`,
          type: 'if_container',
          position,
          data: {
            condition: block.condition,
            conditionType: block.ifType,
            hasElse: block.hasElse
          },
          metadata: block.metadata,
          children: [],
          elseBranch: []
        };
        
        // Raccogli solo gli IDs per il riferimento interno (non creiamo layout annidato)
        if (block.children && block.children.length > 0) {
          flowBlock.children = block.children.map((child: any, i: number) => 
            child.id || `true-${Date.now()}-${i}`
          );
        }
        
        if (block.hasElse && block.elseBranch && block.elseBranch.length > 0) {
          flowBlock.elseBranch = block.elseBranch.map((elseChild: any, i: number) => 
            elseChild.id || `else-${Date.now()}-${i}`
          );
        }
        
        // Spazio per container che deve contenere aree interne
        currentY += CONTAINER_MIN_HEIGHT + CONTAINER_SPACING;
        break;

      case 'menu':
        flowBlock = {
          id: block.id || `menu-${Date.now()}-${index}`,
          type: 'menu_container',
          position,
          data: {},
          metadata: block.metadata,
          children: []
        };
        
        // Raccogli solo gli IDs delle opzioni
        if (block.options && block.options.length > 0) {
          flowBlock.children = block.options.map((option: any, i: number) => 
            option.id || `opt-${Date.now()}-${i}`
          );
        }
        
        currentY += CONTAINER_MIN_HEIGHT + CONTAINER_SPACING;
        break;

      case 'option':
        flowBlock = {
          id: block.id || `option-${Date.now()}-${index}`,
          type: 'menu_option',
          position,
          data: {
            text: block.parameters?.localizedText?.EN || block.parameters?.text || 'Menu Option',
            condition: block.parameters?.condition,
            conditionType: block.parameters?.conditionType
          },
          metadata: block.metadata,
          children: []
        };
        
        currentY += ATOMIC_HEIGHT + VERTICAL_SPACING;
        break;

      case 'atomic':
        const atomicTypeMap: Record<string, FlowBlockType> = {
          'dialogue': 'say',
          'question': 'ask',
          'announce': 'announce',
          'show_character': 'show_character',
          'hide_character': 'hide_character',
          'change_character': 'change_character',
          'semaforo_set': 'set_variable',
          'semaforo_reset': 'reset_variable',
          'variable_set': 'set_to_variable',
          'label': 'label',
          'goto': 'goto',
          'return': 'return',
          'delay': 'delay',
          'script_call': 'script_call',
          'unknown_command': 'unknown'
        };

        const uiType = atomicTypeMap[block.subtype] || 'unknown';
        
        flowBlock = {
          id: block.id || `${uiType}-${Date.now()}-${index}`,
          type: uiType as FlowBlockType,
          position,
          data: {
            ...block.parameters,
            text: block.parameters?.localizedText?.EN || block.parameters?.text,
            originalLine: block.parameters?.originalLine
          },
          metadata: {
            ...block.metadata,
            currentCharacter: block.parameters?.character
          }
        };
        
        currentY += ATOMIC_HEIGHT + VERTICAL_SPACING;
        break;

      default:
        flowBlock = {
          id: block.id || `unknown-${Date.now()}-${index}`,
          type: 'unknown' as FlowBlockType,
          position,
          data: {
            originalType: block.type,
            originalLine: block.originalLine || JSON.stringify(block),
            ...block.parameters
          },
          metadata: block.metadata
        };
        
        currentY += ATOMIC_HEIGHT + VERTICAL_SPACING;
    }

    if (flowBlock) {
      flowBlocks.push(flowBlock);
      return flowBlock.id;
    }
    return null;
  };

  // Processa i blocchi in ordine sequenziale con spacing appropriato
  backendBlocks.forEach((block, index) => {
    processBlock(block, index);
  });
  
  return flowBlocks;
}

export interface UseFlowBlockReturn {
  blocks: FlowBlock[];
  selectedBlockId: string | undefined;
  setSelectedBlockId: (id: string | undefined) => void;
  initializeFromScript: (script: CampaignScript) => void;
  addBlock: (type: FlowBlockType, targetBlockId?: string, position?: 'before' | 'after') => void;
  updateBlock: (blockId: string, updates: Partial<FlowBlock>) => void;
  removeBlock: (blockId: string) => void;
  moveBlock: (blockId: string, targetBlockId: string, position: 'before' | 'after') => void;
  duplicateBlock: (blockId: string) => void;
}

export const useFlowBlock = (): UseFlowBlockReturn => {
  const [blocks, setBlocks] = useState<FlowBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>();

  const initializeFromScript = useCallback((script: CampaignScript) => {
    // Controlla se lo script ha blocchi parsati dal backend
    if (script.blocks && Array.isArray(script.blocks)) {
      const flowBlocks: FlowBlock[] = convertBackendBlocksToFlowBlocks(script.blocks);
      setBlocks(flowBlocks);
    } else {
      // Demo data per test visualizzazione con layout migliorato e spacing
      const demoBlocks: FlowBlock[] = [
        {
          id: 'if-block-1',
          type: 'if_container',
          position: { x: 100, y: 100 },
          data: { 
            condition: 'class3',
            conditionType: 'standard',
            hasElse: false
          },
          children: ['script-call-1', 'return-1']
        },
        {
          id: 'script-call-1',
          type: 'script_call',
          position: { x: 100, y: 460 },
          data: { script: 'tutorClass3Dlg' }
        },
        {
          id: 'return-1',
          type: 'return',
          position: { x: 100, y: 610 },
          data: {}
        },
        {
          id: 'delay-1',
          type: 'delay',
          position: { x: 100, y: 760 },
          data: { milliseconds: 200 }
        },
        {
          id: 'say-1',
          type: 'say',
          position: { x: 100, y: 910 },
          data: { 
            text: "Can't you see I'm busy? Get lost!",
            localizedText: {
              EN: "Can't you see I'm busy? Get lost!",
              IT: "Non vedi che sono occupato? Sparisci!",
              DE: "Siehst du nicht, dass ich beschäftigt bin?"
            }
          },
          metadata: { currentCharacter: 'tutor' }
        },
        {
          id: 'menu-1',
          type: 'menu_container',
          position: { x: 100, y: 1060 },
          data: {},
          children: ['option-1', 'option-2']
        },
        {
          id: 'option-1',
          type: 'menu_option',
          position: { x: 100, y: 1380 },
          data: { 
            text: "Yes, I just wanted to say hello.",
            localizedText: {
              EN: "Yes, I just wanted to say hello.",
              IT: "Sì, volevo solo salutare."
            }
          },
          children: ['return-2']
        },
        {
          id: 'option-2',
          type: 'menu_option',
          position: { x: 100, y: 1530 },
          data: { 
            text: "Could you recommend a different route?"
          },
          children: ['goto-1']
        },
        {
          id: 'return-2',
          type: 'return',
          position: { x: 100, y: 1680 },
          data: {}
        },
        {
          id: 'goto-1',
          type: 'goto',
          position: { x: 100, y: 1830 },
          data: { label: 'more_missions' }
        },
        {
          id: 'label-1',
          type: 'label',
          position: { x: 100, y: 1980 },
          data: { label: 'more_missions' }
        },
        {
          id: 'unknown-1',
          type: 'unknown',
          position: { x: 100, y: 2130 },
          data: { 
            originalLine: 'CENTERMAPWITHTRANSITION outpost',
            commandType: 'CENTERMAPWITHTRANSITION'
          }
        }
      ];
      setBlocks(demoBlocks);
    }
  }, []);

  const addBlock = useCallback((type: FlowBlockType, targetBlockId?: string, position?: 'before' | 'after') => {
    const newBlock: FlowBlock = {
      id: `block-${Date.now()}`,
      type,
      position: { x: 100, y: blocks.length * 110 + 50 },
      data: {}
    };
    
    if (targetBlockId && position) {
      const targetIndex = blocks.findIndex(b => b.id === targetBlockId);
      if (targetIndex !== -1) {
        const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
        const newBlocks = [...blocks];
        newBlocks.splice(insertIndex, 0, newBlock);
        setBlocks(newBlocks);
        return;
      }
    }
    
    setBlocks(prev => [...prev, newBlock]);
  }, [blocks]);

  const updateBlock = useCallback((blockId: string, updates: Partial<FlowBlock>) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
  }, []);

  const removeBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(undefined);
    }
  }, [selectedBlockId]);

  const moveBlock = useCallback((blockId: string, targetBlockId: string, position: 'before' | 'after') => {
    const sourceIndex = blocks.findIndex(b => b.id === blockId);
    const targetIndex = blocks.findIndex(b => b.id === targetBlockId);
    
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(sourceIndex, 1);
    
    const insertIndex = position === 'after' ? 
      (sourceIndex < targetIndex ? targetIndex : targetIndex + 1) :
      (sourceIndex < targetIndex ? targetIndex - 1 : targetIndex);
    
    newBlocks.splice(Math.max(0, insertIndex), 0, movedBlock);
    setBlocks(newBlocks);
  }, [blocks]);

  const duplicateBlock = useCallback((blockId: string) => {
    const blockToDuplicate = blocks.find(b => b.id === blockId);
    if (!blockToDuplicate) return;
    
    const duplicatedBlock: FlowBlock = {
      ...blockToDuplicate,
      id: `block-${Date.now()}`,
      position: {
        x: blockToDuplicate.position.x + 20,
        y: blockToDuplicate.position.y + 20
      }
    };
    
    setBlocks(prev => [...prev, duplicatedBlock]);
  }, [blocks]);

  return {
    blocks,
    selectedBlockId,
    setSelectedBlockId,
    initializeFromScript,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    duplicateBlock
  };
};
import { useMemo, useEffect } from 'react';
import { 
  FlowState, 
  ValidationResult,
  FlowBlockType,
  Position
} from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';
import { CampaignScript, MapNode } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { flowStateManagerService } from '@/services/CampaignEditor/VisualFlowEditor/services/FlowStateManager/flowStateManagerService';
import { validationEngineService } from '@/services/CampaignEditor/VisualFlowEditor/services/ValidationEngine/validationEngineService';
import { useFlowBlock } from './hooks/FlowBlock/useFlowBlock';
import { useDragOperations } from './useDragOperations';
import { useAddBlockMenu } from './hooks/AddBlockMenu/useAddBlockMenu';

interface UseVisualFlowEditorProps {
  selectedScript?: CampaignScript | null;
  selectedNode?: MapNode | null;
  onScriptChange?: (script: CampaignScript) => void;
}

export const useVisualFlowEditor = ({ selectedScript, selectedNode, onScriptChange }: UseVisualFlowEditorProps) => {
  
  // Mock characters data - TODO: get from context
  const characters = [
    { name: 'character1', images: ['image1.png'], displayName: 'Character 1' },
    { name: 'character2', images: ['image2.png'], displayName: 'Character 2' }
  ];

  // Decomposed hooks
  const {
    blocks,
    selectedBlockId,
    setSelectedBlockId,
    initializeFromScript,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    duplicateBlock
  } = useFlowBlock();
  
  // Effect per caricare lo script quando viene selezionato
  useEffect(() => {
    if (selectedScript) {
      const loadScriptBlocks = async () => {
        try {
          // Se lo script ha già i blocchi parsati, usali
          if (selectedScript.blocks && Array.isArray(selectedScript.blocks)) {
            initializeFromScript(selectedScript);
            return;
          }
          
          // Altrimenti richiedi il parsing al backend
          const response = await fetch('http://localhost:3001/api/campaign/script/convert-to-blocks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              scriptName: selectedScript.name,
              includeAllLanguages: true
            }),
          });
          
          if (response.ok) {
            const parsed = await response.json();
            console.log('Parsed script from backend:', parsed);
            
            // Aggiorna lo script con i blocchi parsati
            const scriptWithBlocks = {
              ...selectedScript,
              blocks: parsed.blocks
            };
            
            initializeFromScript(scriptWithBlocks);
            onScriptChange?.(scriptWithBlocks);
          } else {
            console.error('Failed to parse script:', response.statusText);
            // Fallback ai demo data
            initializeFromScript(selectedScript);
          }
        } catch (error) {
          console.error('Error parsing script:', error);
          // Fallback ai demo data
          initializeFromScript(selectedScript);
        }
      };
      
      loadScriptBlocks();
    }
  }, [selectedScript, initializeFromScript, onScriptChange]);

  const {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    calculateAnchorPoints
  } = useDragOperations(blocks, characters);

  const {
    addBlockMenuState,
    openAddBlockMenu: openMenu,
    closeAddBlockMenu
  } = useAddBlockMenu();

  // Calculate flow state for current selected block
  const currentFlowState = useMemo((): FlowState => {
    if (!selectedBlockId) {
      return flowStateManagerService.calculateFlowStateAtBlock(blocks, '', characters);
    }
    return flowStateManagerService.calculateFlowStateAtBlock(blocks, selectedBlockId, characters);
  }, [blocks, selectedBlockId, characters]);

  // Validation results
  const validationResults = useMemo((): ValidationResult[] => {
    return validationEngineService.validateBlocks(blocks, characters);
  }, [blocks, characters]);






  const openAddBlockMenu = (position: Position, targetBlockId?: string, targetType?: 'before' | 'after') => {
    const flowState = targetBlockId 
      ? flowStateManagerService.calculateFlowStateAtBlock(blocks, targetBlockId, characters)
      : currentFlowState;
    
    const availableTypes = validationEngineService.getAvailableBlockTypes(
      flowState, 
      targetType || 'after'
    );
    
    const availableBlockTypes = availableTypes.map(type => ({
      type,
      label: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: getBlockIcon(type),
      isEnabled: true
    }));
    
    openMenu(position, availableBlockTypes);
  };

  const generateScript = () => {
    console.log('Generating script from blocks:', blocks);
    return blocks;
  };

  return {
    // State
    blocks,
    connections: [], // TODO: Calculate connections from blocks
    flowState: currentFlowState,
    dragState,
    addBlockMenuState,
    selectedBlockId,
    validationResults,
    
    // Actions
    initializeFromScript,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock: (blockId: string, newPosition: Position) => updateBlock(blockId, { position: newPosition }),
    duplicateBlock,
    selectBlock: setSelectedBlockId,
    startDrag,
    updateDrag,
    endDrag,
    openAddBlockMenu,
    closeAddBlockMenu,
    generateScript
  };
};

function getBlockIcon(type: FlowBlockType): string {
  const icons: Record<FlowBlockType, string> = {
    'say': '💬',
    'ask': '❓',
    'announce': '📢',
    'show_character': '👤',
    'hide_character': '👻',
    'change_character': '🎭',
    'set_variable': '🔧',
    'reset_variable': '🔄',
    'set_to_variable': '📊',
    'dialog_container': '📝',
    'menu_container': '📋',
    'if_container': '🔀',
    'menu_option': '☰',
    'label': '🏷️',
    'goto': '➡️',
    'return': '↩️',
    'delay': '⏱️',
    'script_call': '📞',
    'unknown': '❓'
  };
  return icons[type] || '❔';
}
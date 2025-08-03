import { useMemo } from 'react';
import { 
  FlowState, 
  ValidationResult,
  FlowBlockType,
  Position
} from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';
import { CampaignScript, MapNode } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { flowStateManagerService } from '@/services/CampaignEditor/VisualFlowEditor/services/FlowStateManager/flowStateManagerService';
import { validationEngineService } from '@/services/CampaignEditor/VisualFlowEditor/services/ValidationEngine/validationEngineService';
import { useFlowBlocks } from './useFlowBlocks';
import { useDragOperations } from './useDragOperations';
import { useAddBlockMenu } from './useAddBlockMenu';

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
  } = useFlowBlocks();

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
    'if_container': '🔀'
  };
  return icons[type] || '❔';
}
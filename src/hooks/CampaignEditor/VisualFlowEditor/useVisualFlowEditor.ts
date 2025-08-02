import { useState, useCallback, useMemo } from 'react';
import { 
  FlowBlock, 
  FlowState, 
  DragState, 
  AddBlockMenuState, 
  ValidationResult,
  AnchorPoint,
  Position,
  FlowBlockType,
  AvailableBlockType
} from '../../../types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';
import { flowStateManagerService } from '../../../services/CampaignEditor/VisualFlowEditor/services/FlowStateManager/flowStateManagerService';
import { validationEngineService } from '../../../services/CampaignEditor/VisualFlowEditor/services/ValidationEngine/validationEngineService';

interface UseVisualFlowEditorProps {
  selectedScript?: any;
  selectedNode?: any;
  onScriptChange?: (script: any) => void;
}

export const useVisualFlowEditor = ({ selectedScript, selectedNode, onScriptChange }: UseVisualFlowEditorProps) => {
  // Core state
  const [blocks, setBlocks] = useState<FlowBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>();
  
  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    availableAnchors: []
  });
  
  // Add block menu state
  const [addBlockMenuState, setAddBlockMenuState] = useState<AddBlockMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    availableBlockTypes: []
  });

  // Mock characters data - TODO: get from context
  const characters = [
    { name: 'character1', images: ['image1.png'], displayName: 'Character 1' },
    { name: 'character2', images: ['image2.png'], displayName: 'Character 2' }
  ];

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

  // Calculate anchor points for drag operations
  const calculateAnchorPoints = useCallback((draggedBlockId: string): AnchorPoint[] => {
    const anchors: AnchorPoint[] = [];
    
    blocks.forEach((block, index) => {
      if (block.id === draggedBlockId) return;
      
      // Calculate flow state at this position to validate insertion
      const flowStateAtBlock = flowStateManagerService.calculateFlowStateAtBlock(blocks, block.id, characters);
      const availableTypes = validationEngineService.getAvailableBlockTypes(flowStateAtBlock, 'before', block);
      const draggedBlock = blocks.find(b => b.id === draggedBlockId);
      
      if (draggedBlock && availableTypes.includes(draggedBlock.type)) {
        anchors.push({
          id: `before-${block.id}`,
          blockId: block.id,
          position: 'before',
          coordinates: { x: block.position.x, y: block.position.y - 20 },
          isValid: true
        });
      }
      
      // After position
      const flowStateAfterBlock = flowStateManagerService.calculateFlowStateAtBlock(blocks, '', characters); // Calculate full state
      const availableTypesAfter = validationEngineService.getAvailableBlockTypes(flowStateAfterBlock, 'after', block);
      
      if (draggedBlock && availableTypesAfter.includes(draggedBlock.type)) {
        anchors.push({
          id: `after-${block.id}`,
          blockId: block.id,
          position: 'after',
          coordinates: { x: block.position.x, y: block.position.y + 80 },
          isValid: true
        });
      }
    });
    
    return anchors;
  }, [blocks, characters]);

  // Actions
  const initializeFromScript = useCallback((script: any) => {
    // TODO: Parse script into blocks
    const parsedBlocks: FlowBlock[] = [
      {
        id: 'block-1',
        type: 'say',
        position: { x: 100, y: 100 },
        data: { text: 'Hello World' }
      }
    ];
    setBlocks(parsedBlocks);
  }, []);

  const addBlock = useCallback((type: FlowBlockType, targetBlockId?: string, position?: 'before' | 'after') => {
    const newBlock: FlowBlock = {
      id: `block-${Date.now()}`,
      type,
      position: { x: 100, y: blocks.length * 100 + 100 },
      data: {}
    };
    
    if (targetBlockId && position) {
      // Insert at specific position
      const targetIndex = blocks.findIndex(b => b.id === targetBlockId);
      if (targetIndex !== -1) {
        const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
        const newBlocks = [...blocks];
        newBlocks.splice(insertIndex, 0, newBlock);
        setBlocks(newBlocks);
        return;
      }
    }
    
    // Add at end
    setBlocks(prev => [...prev, newBlock]);
  }, [blocks]);

  const updateBlock = useCallback((blockId: string, data: Partial<FlowBlock>) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...data } : block
    ));
  }, []);

  const removeBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(undefined);
    }
  }, [selectedBlockId]);

  const moveBlock = useCallback((blockId: string, newPosition: Position) => {
    updateBlock(blockId, { position: newPosition });
  }, [updateBlock]);

  const selectBlock = useCallback((blockId: string | undefined) => {
    setSelectedBlockId(blockId);
  }, []);

  // Drag operations
  const startDrag = useCallback((blockId: string, startPosition: Position) => {
    const anchors = calculateAnchorPoints(blockId);
    setDragState({
      isDragging: true,
      draggedBlockId: blockId,
      startPosition,
      currentPosition: startPosition,
      availableAnchors: anchors
    });
  }, [calculateAnchorPoints]);

  const updateDrag = useCallback((currentPosition: Position) => {
    if (!dragState.isDragging) return;
    
    // Find closest anchor
    const targetAnchor = dragState.availableAnchors.reduce((closest, anchor) => {
      const distance = Math.sqrt(
        Math.pow(anchor.coordinates.x - currentPosition.x, 2) + 
        Math.pow(anchor.coordinates.y - currentPosition.y, 2)
      );
      return distance < 50 && (!closest || distance < closest.distance) 
        ? { anchor, distance } 
        : closest;
    }, null as { anchor: AnchorPoint; distance: number } | null);

    setDragState(prev => ({
      ...prev,
      currentPosition,
      targetAnchor: targetAnchor?.anchor
    }));
  }, [dragState.isDragging, dragState.availableAnchors]);

  const endDrag = useCallback(() => {
    if (dragState.isDragging && dragState.draggedBlockId && dragState.targetAnchor) {
      // Perform the move operation
      const targetIndex = blocks.findIndex(b => b.id === dragState.targetAnchor!.blockId);
      const draggedIndex = blocks.findIndex(b => b.id === dragState.draggedBlockId);
      
      if (targetIndex !== -1 && draggedIndex !== -1) {
        const newBlocks = [...blocks];
        const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
        
        const insertIndex = dragState.targetAnchor.position === 'after' ? targetIndex + 1 : targetIndex;
        newBlocks.splice(insertIndex, 0, draggedBlock);
        
        setBlocks(newBlocks);
      }
    }
    
    setDragState({
      isDragging: false,
      availableAnchors: []
    });
  }, [dragState, blocks]);

  // Add block menu operations
  const openAddBlockMenu = useCallback((position: Position, targetBlockId?: string, targetType?: 'before' | 'after') => {
    // Calculate available block types based on position and flow state
    const flowState = targetBlockId 
      ? flowStateManagerService.calculateFlowStateAtBlock(blocks, targetBlockId, characters)
      : currentFlowState;
    
    const availableTypes = validationEngineService.getAvailableBlockTypes(
      flowState, 
      targetType || 'after'
    );
    
    const availableBlockTypes: AvailableBlockType[] = availableTypes.map(type => ({
      type,
      label: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: getBlockIcon(type),
      isEnabled: true
    }));
    
    setAddBlockMenuState({
      isOpen: true,
      position,
      availableBlockTypes,
      targetAnchor: targetBlockId ? {
        id: `${targetType}-${targetBlockId}`,
        blockId: targetBlockId,
        position: targetType || 'after',
        coordinates: position,
        isValid: true
      } : undefined
    });
  }, [blocks, currentFlowState, characters]);

  const closeAddBlockMenu = useCallback(() => {
    setAddBlockMenuState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const generateScript = useCallback(() => {
    // TODO: Convert blocks back to script format
    console.log('Generating script from blocks:', blocks);
    return blocks;
  }, [blocks]);

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
    moveBlock,
    selectBlock,
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
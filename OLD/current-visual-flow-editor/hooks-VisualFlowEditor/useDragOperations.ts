import { useState, useCallback } from 'react';
import { 
  FlowBlock, 
  DragState, 
  AnchorPoint,
  Position
} from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';
import { flowStateManagerService } from '@/services/CampaignEditor/VisualFlowEditor/services/FlowStateManager/flowStateManagerService';
import { validationEngineService } from '@/services/CampaignEditor/VisualFlowEditor/services/ValidationEngine/validationEngineService';

export interface UseDragOperationsReturn {
  dragState: DragState;
  startDrag: (blockId: string, startPosition?: Position) => void;
  updateDrag: (currentPosition: Position) => void;
  endDrag: () => void;
  calculateAnchorPoints: (draggedBlockId: string) => AnchorPoint[];
}

export const useDragOperations = (
  blocks: FlowBlock[],
  characters: Array<{ name: string; images: string[]; displayName: string }>
): UseDragOperationsReturn => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    availableAnchors: []
  });

  const calculateAnchorPoints = useCallback((draggedBlockId: string): AnchorPoint[] => {
    const anchors: AnchorPoint[] = [];
    
    blocks.forEach((block) => {
      if (block.id === draggedBlockId) return;
      
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
      
      const flowStateAfterBlock = flowStateManagerService.calculateFlowStateAtBlock(blocks, '', characters);
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

  const startDrag = useCallback((blockId: string, startPosition?: Position) => {
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
    setDragState({
      isDragging: false,
      availableAnchors: []
    });
  }, []);

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    calculateAnchorPoints
  };
};
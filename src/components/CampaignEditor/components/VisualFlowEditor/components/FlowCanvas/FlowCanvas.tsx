import React, { forwardRef, useCallback } from 'react';
import { 
  FlowBlock as FlowBlockType, 
  FlowConnection,
  BlockData,
  DragState, 
  ValidationResult, 
  Position,
  AnchorPoint as AnchorPointType 
} from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';
import { FlowBlock } from '../FlowBlock';
import { AnchorPoint } from '../AnchorPoint';

interface FlowCanvasProps {
  blocks: FlowBlockType[];
  connections: FlowConnection[];
  dragState: DragState;
  selectedBlockId?: string;
  validationResults: ValidationResult[];
  onClick: (event: React.MouseEvent) => void;
  onContextMenu: (event: React.MouseEvent) => void;
  onBlockSelect: (blockId: string) => void;
  onBlockMove: (blockId: string, position: Position) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockUpdate: (blockId: string, updates: Partial<FlowBlockType>) => void;
  onDragStart: (blockId: string, position: Position) => void;
  onDragUpdate: (position: Position) => void;
  onDragEnd: () => void;
  onDropZoneClick: (blockId: string, position: 'before' | 'after') => void;
}

export const FlowCanvas = forwardRef<HTMLDivElement, FlowCanvasProps>(({
  blocks,
  dragState,
  selectedBlockId,
  validationResults,
  onClick,
  onContextMenu,
  onBlockSelect,
  onBlockMove,
  onBlockDelete,
  onBlockUpdate,
  onDragStart,
  onDragUpdate,
  onDragEnd,
  onDropZoneClick
}, ref) => {
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (dragState.isDragging) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      onDragUpdate({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
  }, [dragState.isDragging, onDragUpdate]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      onDragEnd();
    }
  }, [dragState.isDragging, onDragEnd]);

  const getBlockValidation = (blockId: string): ValidationResult[] => {
    return validationResults.filter(result => result.blockId === blockId);
  };

  return (
    <div
      ref={ref}
      className="relative w-full h-full bg-gray-900 overflow-auto"
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Anchor points during drag */}
      {dragState.isDragging && dragState.availableAnchors.map(anchor => (
        <AnchorPoint
          key={anchor.id}
          anchor={anchor}
          isTarget={dragState.targetAnchor?.id === anchor.id}
        />
      ))}

      {/* Flow blocks */}
      {blocks.map(block => (
        <FlowBlock
          key={block.id}
          block={block}
          isSelected={selectedBlockId === block.id}
          isDragging={dragState.isDragging && dragState.draggedBlockId === block.id}
          validationResults={getBlockValidation(block.id)}
          onSelect={() => onBlockSelect(block.id)}
          onDelete={() => onBlockDelete(block.id)}
          onUpdate={(data) => onBlockUpdate(block.id, data)}
          onDragStart={(position) => onDragStart(block.id, position)}
          onDropZoneClick={(position) => onDropZoneClick(block.id, position)}
        />
      ))}

      {/* Drop zones between blocks */}
      {blocks.map((block, index) => (
        <React.Fragment key={`dropzones-${block.id}`}>
          {/* Before first block */}
          {index === 0 && (
            <div
              className="absolute w-full h-2 bg-blue-500 opacity-0 hover:opacity-50 cursor-pointer transition-opacity"
              style={{ 
                top: block.position.y - 10,
                left: 0
              }}
              onClick={(e) => {
                e.stopPropagation();
                onDropZoneClick(block.id, 'before');
              }}
            />
          )}
          
          {/* After each block */}
          <div
            className="absolute w-full h-2 bg-blue-500 opacity-0 hover:opacity-50 cursor-pointer transition-opacity"
            style={{ 
              top: block.position.y + 70,
              left: 0
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDropZoneClick(block.id, 'after');
            }}
          />
        </React.Fragment>
      ))}

      {/* Canvas background grid */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />
    </div>
  );
});
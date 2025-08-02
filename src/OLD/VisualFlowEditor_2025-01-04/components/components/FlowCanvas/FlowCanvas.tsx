import React, { forwardRef } from 'react';
import { FlowBlock } from '../FlowBlock/FlowBlock';
import { FlowConnection } from '../FlowConnection/FlowConnection';
import { DropZone } from '../DropZone/DropZone';
import type { 
  FlowBlock as FlowBlockType,
  FlowConnection as FlowConnectionType,
  DragState,
  ValidationResult,
  Position
} from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';

interface FlowCanvasProps {
  blocks: FlowBlockType[];
  connections: FlowConnectionType[];
  dragState: DragState;
  selectedBlockId?: string;
  validationResults: Map<string, ValidationResult>;
  onClick: (event: React.MouseEvent) => void;
  onContextMenu: (event: React.MouseEvent) => void;
  onBlockSelect: (blockId: string | undefined) => void;
  onBlockMove: (blockId: string, position: Position) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockUpdate: (blockId: string, updates: Partial<FlowBlockType>) => void;
  onDragStart: (blockId: string, offset: Position) => void;
  onDragUpdate: (position: Position) => void;
  onDragEnd: () => void;
  onDropZoneClick: (blockId: string, position: 'before' | 'after' | 'inside') => void;
}

export const FlowCanvas = forwardRef<HTMLDivElement, FlowCanvasProps>(({
  blocks,
  connections,
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
  const handleMouseMove = (event: React.MouseEvent) => {
    if (dragState.isDragging) {
      const rect = (ref as React.RefObject<HTMLDivElement>).current?.getBoundingClientRect();
      if (rect) {
        onDragUpdate({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (dragState.isDragging) {
      onDragEnd();
    }
  };

  return (
    <div
      ref={ref}
      className="absolute inset-0 bg-gray-800 overflow-auto"
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, #374151 1px, transparent 1px),
            linear-gradient(to bottom, #374151 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* Flow Content */}
      <div className="relative p-8 min-h-full">
        {blocks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-4">
              No blocks in flow
            </div>
            <div className="text-gray-500 text-sm mb-6">
              Right-click to add your first block
            </div>
          </div>
        ) : (
          <>
            {/* Render connections */}
            <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
              {connections.map(connection => (
                <FlowConnection
                  key={connection.id}
                  connection={connection}
                  blocks={blocks}
                />
              ))}
            </svg>
            
            {/* Render drop zones when dragging */}
            {dragState.isDragging && dragState.validDropZones.map(dropZone => (
              <DropZone
                key={dropZone.id}
                dropZone={dropZone}
                isActive={dragState.hoveredDropZone === dropZone.id}
                onClick={() => {
                  if (!dragState.isDragging) {
                    onDropZoneClick(dropZone.blockId, dropZone.type);
                  }
                }}
              />
            ))}
            
            {/* Render blocks */}
            {blocks.map(block => (
              <FlowBlock
                key={block.id}
                block={block}
                isSelected={selectedBlockId === block.id}
                isDragging={dragState.draggedBlockId === block.id}
                validationResult={validationResults.get(block.id)}
                onSelect={() => onBlockSelect(block.id)}
                onDelete={() => onBlockDelete(block.id)}
                onUpdate={(updates) => onBlockUpdate(block.id, updates)}
                onDragStart={(offset) => onDragStart(block.id, offset)}
                onDropZoneClick={(position) => onDropZoneClick(block.id, position)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
});

FlowCanvas.displayName = 'FlowCanvas';
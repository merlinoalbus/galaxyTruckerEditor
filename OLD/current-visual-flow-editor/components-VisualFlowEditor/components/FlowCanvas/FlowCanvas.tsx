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
import { FlowBlock } from '../FlowBlock/FlowBlock';
import { AnchorPoint } from '../AnchorPoint/AnchorPoint';

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

  // Calcola le dimensioni del canvas basandosi sui blocchi
  const getCanvasDimensions = () => {
    if (blocks.length === 0) {
      return { width: 1400, height: 1000 };
    }
    
    const maxX = Math.max(...blocks.map(b => b.position.x + 850)); // Spazio per container larghi
    const maxY = Math.max(...blocks.map(b => b.position.y + 500)); // Spazio per container alti
    
    return {
      width: Math.max(1400, maxX + 200),
      height: Math.max(1000, maxY + 200)
    };
  };
  
  const canvasDimensions = getCanvasDimensions();

  return (
    <div
      ref={ref}
      className="relative w-full h-full bg-gray-900 overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        minWidth: `${canvasDimensions.width}px`,
        minHeight: `${canvasDimensions.height}px`,
        scrollBehavior: 'smooth'
      }}
    >
      {/* Anchor points during drag */}
      {dragState.isDragging && dragState.availableAnchors.map(anchor => (
        <AnchorPoint
          key={anchor.id}
          anchor={anchor}
          isTarget={dragState.targetAnchor?.id === anchor.id}
        />
      ))}

      {/* Connection lines between blocks */}
      <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {blocks.map((block, index) => {
          // Disegna linea al blocco successivo (sequenziale)
          if (index < blocks.length - 1 && !block.children?.length) {
            const nextBlock = blocks[index + 1];
            return (
              <line
                key={`line-${block.id}-next`}
                x1={block.position.x + 128}
                y1={block.position.y + 64}
                x2={nextBlock.position.x + 128}
                y2={nextBlock.position.y}
                stroke="#4B5563"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            );
          }
          
          // Disegna linee ai figli
          if (block.children && block.children.length > 0) {
            return block.children.map(childId => {
              const childBlock = blocks.find(b => b.id === childId);
              if (!childBlock) return null;
              
              return (
                <line
                  key={`line-${block.id}-${childId}`}
                  x1={block.position.x + 128}
                  y1={block.position.y + 80}
                  x2={childBlock.position.x + 128}
                  y2={childBlock.position.y}
                  stroke="#3B82F6"
                  strokeWidth="2"
                  strokeDasharray={block.type === 'menu_option' ? "5,5" : ""}
                  markerEnd="url(#arrowhead-blue)"
                />
              );
            });
          }
          
          return null;
        }).filter(Boolean)}
        
        {/* Arrow markers */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 5, 0 10"
              fill="#4B5563"
            />
          </marker>
          <marker
            id="arrowhead-blue"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 5, 0 10"
              fill="#3B82F6"
            />
          </marker>
        </defs>
      </svg>

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

      {/* Canvas background grid adattivo */}
      <div 
        className="absolute pointer-events-none"
        style={{
          width: `${canvasDimensions.width}px`,
          height: `${canvasDimensions.height}px`,
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px),
            linear-gradient(rgba(59, 130, 246, 0.15) 2px, transparent 2px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.15) 2px, transparent 2px)
          `,
          backgroundSize: '40px 40px, 40px 40px, 200px 200px, 200px 200px',
          top: 0,
          left: 0
        }}
      />
      
      {/* Canvas work area indicator e helper visivi */}
      <div 
        className="absolute border-2 border-dashed border-blue-500/15 pointer-events-none rounded-lg"
        style={{
          width: `${canvasDimensions.width - 200}px`,
          height: `${canvasDimensions.height - 200}px`,
          top: '100px',
          left: '100px'
        }}
      />
      
      {/* Indicators di navigazione */}
      <div className="absolute top-4 left-4 text-sm text-gray-400 pointer-events-none">
        📐 Canvas: {canvasDimensions.width} × {canvasDimensions.height}
      </div>
      
      <div className="absolute top-4 right-4 text-sm text-gray-400 pointer-events-none">
        🎯 Blocks: {blocks.length}
      </div>
    </div>
  );
});
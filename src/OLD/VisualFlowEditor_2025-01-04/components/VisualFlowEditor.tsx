import React, { useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { useVisualFlowEditor } from '@/hooks/CampaignEditor/VisualFlowEditor/useVisualFlowEditor';
import { FlowCanvas } from './components/FlowCanvas/FlowCanvas';
import { AddBlockMenu } from './components/VisualFlowEditor/components/AddBlockMenu/AddBlockMenu';
import { FlowHeader } from './components/FlowHeader/FlowHeader';
import { ValidationPanel } from './components/VisualFlowEditor/components/ValidationPanel/ValidationPanel';
import { VisualFlowEditorProps } from '@/types/CampaignEditor';

export const VisualFlowEditor: React.FC<VisualFlowEditorProps> = ({
  selectedScript,
  selectedNode,
  onScriptChange
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const {
    // Flow state
    blocks,
    connections,
    flowState,
    
    // Drag state
    dragState,
    
    // Menu state
    addBlockMenuState,
    
    // Selection
    selectedBlockId,
    
    // Validation
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
  } = useVisualFlowEditor({
    selectedScript,
    selectedNode,
    onScriptChange
  });

  // Initialize from selected script
  useEffect(() => {
    if (selectedScript) {
      initializeFromScript(selectedScript);
    }
  }, [selectedScript, initializeFromScript]);

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      selectBlock(undefined);
      closeAddBlockMenu();
    }
  };

  const handleCanvasRightClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (event.target === event.currentTarget) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        openAddBlockMenu(
          { x: event.clientX - rect.left, y: event.clientY - rect.top },
          undefined,
          'after'
        );
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <FlowHeader
        blockCount={blocks.length}
        selectedNode={selectedNode}
        onRefresh={() => selectedScript && initializeFromScript(selectedScript)}
        onExport={generateScript}
      />
      
      <div className="flex-1 relative overflow-hidden">
        <FlowCanvas
          ref={canvasRef}
          blocks={blocks}
          connections={connections}
          dragState={dragState}
          selectedBlockId={selectedBlockId}
          validationResults={validationResults}
          onClick={handleCanvasClick}
          onContextMenu={handleCanvasRightClick}
          onBlockSelect={selectBlock}
          onBlockMove={moveBlock}
          onBlockDelete={removeBlock}
          onBlockUpdate={updateBlock}
          onDragStart={startDrag}
          onDragUpdate={updateDrag}
          onDragEnd={endDrag}
          onDropZoneClick={(blockId, position) => {
            openAddBlockMenu(
              { x: 0, y: 0 }, // Position will be calculated by menu
              blockId,
              position
            );
          }}
        />
        
        <AddBlockMenu
          isOpen={addBlockMenuState.isOpen}
          position={addBlockMenuState.position}
          availableBlocks={addBlockMenuState.availableBlocks}
          onClose={closeAddBlockMenu}
          onBlockSelect={(type) => {
            addBlock(
              type,
              addBlockMenuState.targetBlockId,
              addBlockMenuState.targetType
            );
            closeAddBlockMenu();
          }}
        />
        
        <ValidationPanel
          validationResults={validationResults}
          onBlockClick={selectBlock}
        />
      </div>
    </div>
  );
};
import React, { useEffect, useRef } from 'react';

import { VisualFlowEditorProps } from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';
import { useVisualFlowEditor } from '@/hooks/CampaignEditor/VisualFlowEditor/useVisualFlowEditor';

import { FlowCanvas } from './components/FlowCanvas/FlowCanvas';
import { AddBlockMenu } from './components/AddBlockMenu/AddBlockMenu';

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
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-700 border-b border-gray-600">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-200">Visual Flow Editor</h2>
          {selectedScript ? (
            <>
              <div className="text-sm text-blue-400 bg-blue-900 px-2 py-1 rounded">
                {selectedScript.name} ({selectedScript.fileName})
              </div>
              <div className="text-sm text-gray-400">
                Blocks: {blocks.length}
              </div>
              {validationResults.length > 0 && (
                <div className="text-sm text-red-400">
                  Issues: {validationResults.length}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-400">
              No script selected - Select a script from the Interactive Map
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => selectedScript && initializeFromScript(selectedScript)}
            disabled={!selectedScript}
            className="px-3 py-1 text-sm bg-gray-600 text-gray-200 rounded hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Refresh
          </button>
          <button
            onClick={generateScript}
            disabled={!selectedScript}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export
          </button>
        </div>
      </div>
      
      {/* Canvas */}
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
          availableBlocks={addBlockMenuState.availableBlockTypes}
          onClose={closeAddBlockMenu}
          onBlockSelect={(type) => {
            addBlock(
              type,
              addBlockMenuState.targetAnchor?.blockId,
              addBlockMenuState.targetAnchor?.position === 'before' ? 'before' : 'after'
            );
            closeAddBlockMenu();
          }}
        />
      </div>
    </div>
  );
};
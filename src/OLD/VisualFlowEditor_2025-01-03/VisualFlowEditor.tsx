import React, { useEffect } from 'react';
import { Play, Settings, Download, RefreshCw } from 'lucide-react';
import { VisualFlowEditorProps, BlockType } from '../../../types/CampaignEditor';
import { useVisualFlowEditor } from '../../../hooks/CampaignEditor/VisualFlowEditor/useVisualFlowEditor';
import { useValidationEngine } from '../../../hooks/CampaignEditor/VisualFlowEditor/hooks/ValidationEngine/useValidationEngine';
import { ValidationEngine } from '../../CampaignEditor/components/VisualFlowEditor/components/ValidationEngine/ValidationEngine';
import { DragDropManager } from '../../CampaignEditor/components/VisualFlowEditor/components/DragDropManager/DragDropManager';
import { ContextMenu } from '../../CampaignEditor/components/VisualFlowEditor/components/ContextMenu/ContextMenu';

export const VisualFlowEditor: React.FC<VisualFlowEditorProps> = ({
  selectedScript,
  selectedNode,
  onScriptChange
}) => {
  const {
    flowState,
    selectedBlocks,
    hoveredBlock,
    isContextMenuOpen,
    contextMenuPosition,
    contextMenuTarget,
    canvasRef,
    addBlock,
    moveBlock,
    deleteBlock,
    updateBlockParameters,
    selectBlock,
    hoverBlock,
    openContextMenu,
    closeContextMenu,
    initializeFromScript,
    generateScriptFromBlocks
  } = useVisualFlowEditor({ selectedScript, selectedNode, onScriptChange });

  const {
    getInsertableBlocks,
    isBlockValid,
    getBlockErrors,
    getBlockWarnings,
    getValidationSummary
  } = useValidationEngine(
    flowState.blocks,
    flowState.characterStates,
    flowState.variables,
    flowState.semafori
  );

  // Initialize from selected script
  useEffect(() => {
    if (selectedScript) {
      initializeFromScript(selectedScript);
    }
  }, [selectedScript, initializeFromScript]);

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      selectBlock('', false);
    }
  };

  const handleCanvasContextMenu = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      openContextMenu(event);
    }
  };

  const handleBlockContextMenu = (event: React.MouseEvent, blockId: string) => {
    event.stopPropagation();
    openContextMenu(event, blockId, 'after');
  };

  const getAvailableBlocks = (): BlockType[] => {
    if (contextMenuTarget.blockId && contextMenuTarget.position) {
      return getInsertableBlocks(contextMenuTarget.blockId, contextMenuTarget.position) as BlockType[];
    }
    
    // Default blocks for empty canvas
    return [
      'dialogue', 'question', 'announce', 'show_character',
      'variable_set', 'menu_start', 'condition_start'
    ];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-gray-900">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-400" />
              Visual Flow Editor
            </h3>
            
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-400">
                {flowState.blocks.length} blocks
              </div>
              
              <button
                onClick={() => initializeFromScript(selectedScript)}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                title="Refresh from script"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <button
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                title="Export script"
              >
                <Download className="w-4 h-4" />
              </button>
              
              <button
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {selectedNode && (
            <div className="text-sm text-gray-400">
              Editing: <span className="text-white font-medium">{selectedNode.name}</span>
            </div>
          )}
        </div>
        
        {/* Validation Engine */}
        <ValidationEngine
          blocks={flowState.blocks}
          characterStates={flowState.characterStates}
          variables={flowState.variables}
          semafori={flowState.semafori}
          onValidationChange={(blockId, validation) => {}}
        />
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          className="absolute inset-0 bg-gray-800 overflow-auto"
          onClick={handleCanvasClick}
          onContextMenu={handleCanvasContextMenu}
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
          
          {/* Flow Blocks */}
          <div className="relative p-8">
            {flowState.blocks.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 text-lg mb-4">
                  No blocks in flow
                </div>
                <div className="text-gray-500 text-sm mb-6">
                  Right-click to add your first block
                </div>
                <button
                  onClick={(e) => {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect) {
                      openContextMenu({
                        ...e,
                        clientX: rect.left + rect.width / 2,
                        clientY: rect.top + rect.height / 2
                      } as React.MouseEvent);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  Add Block
                </button>
              </div>
            ) : (
              flowState.blocks.map((block, index) => (
                <div
                  key={block.id}
                  className={`absolute border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedBlocks.has(block.id)
                      ? 'border-blue-500 bg-blue-900/20'
                      : hoveredBlock === block.id
                      ? 'border-gray-500 bg-gray-700/50'
                      : isBlockValid(block.id)
                      ? 'border-gray-600 bg-gray-900/80'
                      : 'border-red-500 bg-red-900/20'
                  }`}
                  style={{
                    left: block.position.x,
                    top: block.position.y,
                    width: block.position.width,
                    minHeight: block.position.height
                  }}
                  draggable
                  onClick={(e) => {
                    e.stopPropagation();
                    selectBlock(block.id, e.ctrlKey || e.metaKey);
                  }}
                  onMouseEnter={() => hoverBlock(block.id)}
                  onMouseLeave={() => hoverBlock(undefined)}
                  onContextMenu={(e) => handleBlockContextMenu(e, block.id)}
                >
                  {/* Block Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white capitalize">
                        {block.type.replace('_', ' ')}
                      </span>
                      
                      {!isBlockValid(block.id) && (
                        <span className="w-2 h-2 bg-red-500 rounded-full" title="Has errors" />
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      #{index + 1}
                    </div>
                  </div>
                  
                  {/* Block Content */}
                  <div className="text-sm text-gray-300">
                    {block.parameters.text && (
                      <div className="mb-1 italic">
                        "{block.parameters.text}"
                      </div>
                    )}
                    
                    {block.parameters.character && (
                      <div className="text-xs text-blue-400">
                        Character: {block.parameters.character}
                      </div>
                    )}
                    
                    {block.parameters.variable && (
                      <div className="text-xs text-green-400">
                        Variable: {block.parameters.variable}
                      </div>
                    )}
                  </div>
                  
                  {/* Block Errors */}
                  {getBlockErrors(block.id).length > 0 && (
                    <div className="mt-2 text-xs text-red-400">
                      {getBlockErrors(block.id)[0].message}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Drag & Drop Manager */}
        <DragDropManager
          blocks={flowState.blocks}
          onBlockMove={moveBlock}
          onBlockReorder={(blockId, targetBlockId, position) => {}}
          canvasRef={canvasRef}
        />
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={isContextMenuOpen}
        position={contextMenuPosition}
        targetBlockId={contextMenuTarget.blockId}
        insertPosition={contextMenuTarget.position}
        availableBlocks={getAvailableBlocks()}
        onBlockInsert={addBlock}
        onClose={closeContextMenu}
      />
    </div>
  );
};
import { useState, useCallback } from 'react';
import { ToolItem } from '@/types/CampaignEditor/VisualFlowEditor/BlockTypes';

interface UseDragAndDropProps {
  addBlockToContainer: (blocks: any[], containerId: string, containerType: string, newBlock: any) => any[];
  addBlockAtIndex: (blocks: any[], containerId: string, containerType: string, newBlock: any, index: number) => any[];
  removeBlockRecursive: (blocks: any[], blockId: string) => any[];
  updateBlocks: (updater: (prev: any[]) => any[]) => void;
}

export const useDragAndDrop = ({ 
  addBlockToContainer, 
  addBlockAtIndex, 
  removeBlockRecursive,
  updateBlocks
}: UseDragAndDropProps) => {
  const [draggedTool, setDraggedTool] = useState<ToolItem | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<any>(null);
  const [dropTarget, setDropTarget] = useState<{ containerId: string; containerType: string } | null>(null);

  // Handler per drag start di un blocco esistente
  const handleDragStart = useCallback((e: React.DragEvent, block: any) => {
    setDraggedBlock(block);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // Handler per drag start di un tool dalla palette
  const handleToolDragStart = useCallback((e: React.DragEvent, tool: ToolItem) => {
    setDraggedTool(tool);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // Handler per drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedTool ? 'copy' : 'move';
  }, [draggedTool]);

  // Reset dei drag state
  const resetDragState = useCallback(() => {
    setDraggedTool(null);
    setDraggedBlock(null);
    setDropTarget(null);
  }, []);

  // Funzione per creare un nuovo blocco da un tool
  const createNewBlock = useCallback((tool: ToolItem) => {
    const newBlock: any = {
      id: `${tool.blockType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: tool.blockType,
      position: { x: 0, y: 0 },
      isContainer: tool.isContainer
    };
    
    // Configurazione specifica per blocchi IF
    if (tool.blockType === 'IF') {
      newBlock.ifType = 'IF';
      newBlock.thenBlocks = [];
      newBlock.numThen = 0;
      newBlock.numElse = 0;
      // ELSE non incluso di default
    }
    
    // Configurazione per container generici
    if (tool.isContainer && tool.blockType !== 'IF') {
      newBlock.children = [];
    }
    
    // Configurazione per blocchi comando
    if (!tool.isContainer) {
      newBlock.parameters = {};
    }
    
    return newBlock;
  }, []);

  // Handler per drop generico
  const handleDrop = useCallback((
    e: React.DragEvent, 
    containerId: string, 
    containerType: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedTool) {
      // Crea nuovo blocco dal tool usando createNewBlock
      const newBlock = createNewBlock(draggedTool);
      
      
      updateBlocks(prev => addBlockToContainer(prev, containerId, containerType, newBlock));
    } else if (draggedBlock) {
      // Sposta blocco esistente
      updateBlocks(prev => {
        // Prima rimuovi il blocco dalla posizione attuale
        const withoutBlock = removeBlockRecursive(prev, draggedBlock.id);
        // Poi aggiungilo nella nuova posizione
        return addBlockToContainer(withoutBlock, containerId, containerType, draggedBlock);
      });
    }
    
    resetDragState();
    setDropTarget(null);
  }, [draggedTool, draggedBlock, addBlockToContainer, removeBlockRecursive, createNewBlock, resetDragState, updateBlocks]);

  // Handler per drop con indice specifico
  const handleDropAtIndex = useCallback((
    e: React.DragEvent, 
    containerId: string, 
    containerType: string, 
    index: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    
    // Se è un tool, crea nuovo blocco con ID univoco
    // Se è un blocco esistente, mantieni l'ID originale
    const newBlock = draggedTool
      ? createNewBlock(draggedTool)
      : draggedBlock; // MANTIENI L'ID ORIGINALE!
    
    if (draggedBlock && !draggedTool) {
      
      // Prima rimuovi il blocco dalla posizione attuale
      updateBlocks(prev => {
        const withoutBlock = removeBlockRecursive(prev, draggedBlock.id);
        // Poi aggiungilo nella nuova posizione con l'ID originale
        const result = addBlockAtIndex(withoutBlock, containerId, containerType, draggedBlock, index);
        return result;
      });
    } else if (draggedTool) {
      // Aggiungi nuovo blocco dal tool
      updateBlocks(prev => addBlockAtIndex(prev, containerId, containerType, newBlock, index));
    }
    
    resetDragState();
  }, [draggedTool, draggedBlock, addBlockAtIndex, removeBlockRecursive, createNewBlock, resetDragState, updateBlocks]);

  return {
    draggedTool,
    draggedBlock,
    dropTarget,
    setDropTarget,
    handleDragStart,
    handleToolDragStart,
    handleDragOver,
    createNewBlock,
    handleDrop,
    handleDropAtIndex,
    resetDragState
  };
};
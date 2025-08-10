import { useState, useCallback } from 'react';
import { ToolItem } from '@/types/CampaignEditor/VisualFlowEditor/BlockTypes';

interface UseDragAndDropProps {
  addBlockToContainer: (blocks: any[], containerId: string, containerType: string, newBlock: any) => any[];
  addBlockAtIndex: (blocks: any[], containerId: string, containerType: string, newBlock: any, index: number) => any[];
  removeBlockRecursive: (blocks: any[], blockId: string) => any[];
  canDropBlock: (blockType: string, containerId: string, containerType: string, blocks: any[], index?: number) => boolean;
  currentScriptBlocks: any[];
  updateBlocks: (updater: (prev: any[]) => any[]) => void;
}

export const useDragAndDrop = ({ 
  addBlockToContainer, 
  addBlockAtIndex, 
  removeBlockRecursive,
  canDropBlock,
  currentScriptBlocks,
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

  // Handler per drag over semplice (senza validazione specifica)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Per ora permetti sempre il drag over base
    e.dataTransfer.dropEffect = draggedTool ? 'copy' : 'move';
  }, [draggedTool]);

  // Handler per drag over con validazione specifica per container
  const handleDragOverWithValidation = useCallback((e: React.DragEvent, containerId: string, containerType: string, index?: number) => {
    e.preventDefault();
    
    // Determina il tipo di blocco che si sta trascinando
    const blockType = draggedTool?.blockType || draggedBlock?.type;
    
    if (blockType) {
      // Verifica se il drop è valido
      const isValidDrop = canDropBlock(blockType, containerId, containerType, currentScriptBlocks, index);
      
      // Imposta l'effetto del cursore in base alla validità
      e.dataTransfer.dropEffect = isValidDrop 
        ? (draggedTool ? 'copy' : 'move')
        : 'none'; // 'none' mostra il cursore di divieto
    }
  }, [draggedTool, draggedBlock, canDropBlock, currentScriptBlocks]);

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
      
      // Configurazione specifica per OPT
      if (tool.blockType === 'OPT') {
        newBlock.optType = 'OPT_SIMPLE';
        newBlock.condition = null;
        newBlock.text = {
          EN: '',
          CS: null,
          DE: null,
          ES: null,
          FR: null,
          PL: null,
          RU: null
        };
      }
    }
    
    // Configurazione per blocchi comando
    if (!tool.isContainer) {
      newBlock.parameters = {};
      
      // Inizializza parametri specifici per ASK
      if (tool.blockType === 'ASK') {
        newBlock.parameters.text = { EN: '' };
      }
      
      // Inizializza parametri specifici per SAY
      if (tool.blockType === 'SAY') {
        newBlock.parameters.text = { EN: '' };
      }
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
    
    // Determina il tipo di blocco
    const blockType = draggedTool?.blockType || draggedBlock?.type;
    
    // Verifica se il drop è valido prima di eseguirlo
    if (blockType && !canDropBlock(blockType, containerId, containerType, currentScriptBlocks)) {
      resetDragState();
      return; // Blocca il drop silenziosamente
    }
    
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
  }, [draggedTool, draggedBlock, addBlockToContainer, removeBlockRecursive, createNewBlock, resetDragState, updateBlocks, canDropBlock, currentScriptBlocks]);

  // Handler per drop con indice specifico
  const handleDropAtIndex = useCallback((
    e: React.DragEvent, 
    containerId: string, 
    containerType: string, 
    index: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Determina il tipo di blocco
    const blockType = draggedTool?.blockType || draggedBlock?.type;
    
    // Verifica se il drop è valido prima di eseguirlo
    if (blockType && !canDropBlock(blockType, containerId, containerType, currentScriptBlocks, index)) {
      resetDragState();
      return; // Blocca il drop silenziosamente
    }
    
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
  }, [draggedTool, draggedBlock, addBlockAtIndex, removeBlockRecursive, createNewBlock, resetDragState, updateBlocks, canDropBlock, currentScriptBlocks]);

  return {
    draggedTool,
    draggedBlock,
    dropTarget,
    setDropTarget,
    handleDragStart,
    handleToolDragStart,
    handleDragOver,
    handleDragOverWithValidation,
    createNewBlock,
    handleDrop,
    handleDropAtIndex,
    resetDragState
  };
};
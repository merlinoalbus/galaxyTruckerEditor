import { useState, useCallback } from 'react';
import { ToolItem } from '@/types/CampaignEditor/VisualFlowEditor/BlockTypes';
import { Tool } from '@/types/CampaignEditor/VisualFlowEditor/ToolCategories';

interface UseDragAndDropProps {
  addBlockToContainer: (blocks: any[], containerId: string, containerType: string, newBlock: any) => any[];
  addBlockAtIndex: (blocks: any[], containerId: string, containerType: string, newBlock: any, index: number) => any[];
  removeBlockRecursive: (blocks: any[], blockId: string) => any[];
  canDropBlock: (blockType: string, containerId: string, containerType: string, blocks: any[], index?: number) => boolean;
  getDropErrorMessage?: (blockType: string, containerId: string, containerType: string, blocks: any[], index?: number) => string | null;
  currentScriptBlocks: any[];
  updateBlocks: (updater: (prev: any[]) => any[]) => void;
  onDropError?: (message: string) => void;
}

export const useDragAndDrop = ({ 
  addBlockToContainer, 
  addBlockAtIndex, 
  removeBlockRecursive,
  canDropBlock,
  getDropErrorMessage,
  currentScriptBlocks,
  updateBlocks,
  onDropError
}: UseDragAndDropProps) => {
  const [draggedTool, setDraggedTool] = useState<ToolItem | Tool | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<any>(null);
  const [dropTarget, setDropTarget] = useState<{ containerId: string; containerType: string } | null>(null);

  // Handler per drag start di un blocco esistente
  const handleDragStart = useCallback((e: React.DragEvent, block: any) => {
    setDraggedBlock(block);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // Handler per drag start di un tool dalla palette (supporta sia ToolItem che Tool)
  const handleToolDragStart = useCallback((e: React.DragEvent, tool: ToolItem | Tool) => {
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

  // Funzione per creare un nuovo blocco da un tool (supporta sia ToolItem che Tool)
  const createNewBlock = useCallback((tool: ToolItem | Tool) => {
    // Determina il tipo di blocco e se è un container
    const blockType = tool.blockType;
    const isContainer = 'isContainer' in tool ? tool.isContainer : 
                       ['IF', 'MENU', 'OPT', 'SCRIPT', 'MISSION', 'BUILD', 'FLIGHT'].includes(blockType);
    
    const newBlock: any = {
      id: `${blockType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: blockType,
      position: { x: 0, y: 0 },
      isContainer: isContainer
    };
    
    // Configurazione specifica per blocchi IF
    if (blockType === 'IF') {
      newBlock.ifType = 'IF';
      newBlock.thenBlocks = [];
      newBlock.numThen = 0;
      newBlock.numElse = 0;
      // ELSE non incluso di default
    }
    
    // Configurazione specifica per BUILD
    if (blockType === 'BUILD') {
      newBlock.blockInit = [];
      newBlock.blockStart = [];
      newBlock.numBlockInit = 0;
      newBlock.numBlockStart = 0;
    }
    
    // Configurazione specifica per FLIGHT
    if (blockType === 'FLIGHT') {
      newBlock.blockInit = [];
      newBlock.blockStart = [];
      newBlock.blockEvaluate = [];
      newBlock.numBlockInit = 0;
      newBlock.numBlockStart = 0;
      newBlock.numBlockEvaluate = 0;
    }
    
    // Configurazione per container generici (non BUILD/FLIGHT)
    if (isContainer && blockType !== 'IF' && blockType !== 'BUILD' && blockType !== 'FLIGHT') {
      newBlock.children = [];
      
      // Configurazione specifica per OPT
      if (blockType === 'OPT') {
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
    if (!isContainer) {
      newBlock.parameters = {};
      
      // Inizializza parametri specifici per ASK
      if (blockType === 'ASK') {
        newBlock.parameters.text = { EN: '' };
      }
      
      // Inizializza parametri specifici per SAY
      if (blockType === 'SAY') {
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
      // Genera messaggio di errore specifico
      if (onDropError && getDropErrorMessage) {
        const errorMsg = getDropErrorMessage(blockType, containerId, containerType, currentScriptBlocks);
        if (errorMsg) {
          onDropError(errorMsg);
        }
      } else if (onDropError) {
        // Messaggio generico se non c'è getDropErrorMessage
        onDropError(`Il blocco ${blockType} non può essere inserito in questa posizione.`);
      }
      resetDragState();
      return;
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
  }, [draggedTool, draggedBlock, addBlockToContainer, removeBlockRecursive, createNewBlock, resetDragState, updateBlocks, canDropBlock, currentScriptBlocks, getDropErrorMessage, onDropError]);

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
      // Genera messaggio di errore specifico
      if (onDropError && getDropErrorMessage) {
        const errorMsg = getDropErrorMessage(blockType, containerId, containerType, currentScriptBlocks, index);
        if (errorMsg) {
          onDropError(errorMsg);
        }
      } else if (onDropError) {
        // Messaggio generico se non c'è getDropErrorMessage
        onDropError(`Il blocco ${blockType} non può essere inserito in questa posizione.`);
      }
      resetDragState();
      return;
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
  }, [draggedTool, draggedBlock, addBlockAtIndex, removeBlockRecursive, createNewBlock, resetDragState, updateBlocks, canDropBlock, currentScriptBlocks, getDropErrorMessage, onDropError]);

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
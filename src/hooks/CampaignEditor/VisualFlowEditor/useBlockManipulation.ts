import { useCallback } from 'react';

export const useBlockManipulation = () => {
  // Funzione helper per ottenere l'ultimo blocco di una lista
  const getLastBlock = (blocks: any[]): any | null => {
    if (!blocks || blocks.length === 0) return null;
    return blocks[blocks.length - 1];
  };

  // Funzione ricorsiva per verificare se un blocco termina con ASK in tutti i percorsi
  const blockEndsWithAsk = useCallback((block: any): boolean => {
    if (!block) return false;
    
    // Caso base: il blocco è ASK
    if (block.type === 'ASK') {
      return true;
    }
    
    // Caso IF: TUTTI i rami attivi devono terminare con ASK
    if (block.type === 'IF') {
      // Verifica il ramo then
      const lastThenBlock = getLastBlock(block.thenBlocks);
      if (!lastThenBlock || !blockEndsWithAsk(lastThenBlock)) {
        return false;
      }
      
      // Se else è attivo, deve anch'esso terminare con ASK
      if (block.elseBlocks && block.elseBlocks.length > 0) {
        const lastElseBlock = getLastBlock(block.elseBlocks);
        if (!lastElseBlock || !blockEndsWithAsk(lastElseBlock)) {
          return false;
        }
      }
      
      return true;
    }
    
    // Caso MENU: TUTTE le OPT devono terminare con ASK
    if (block.type === 'MENU') {
      if (!block.children || block.children.length === 0) {
        return false;
      }
      
      // Ogni OPT deve terminare con ASK
      for (const opt of block.children) {
        if (opt.type !== 'OPT') continue;
        
        const lastOptBlock = getLastBlock(opt.children || []);
        if (!lastOptBlock || !blockEndsWithAsk(lastOptBlock)) {
          return false;
        }
      }
      
      return true;
    }
    
    // Altri blocchi non terminano con ASK
    return false;
  }, []);

  // Funzione per verificare se un blocco MENU può essere inserito dopo un determinato blocco
  const canInsertMenuAfterBlock = useCallback((prevBlock: any): boolean => {
    if (!prevBlock) return false;
    
    // Verifica ricorsivamente se il blocco precedente garantisce un ASK nel flusso
    return blockEndsWithAsk(prevBlock);
  }, [blockEndsWithAsk]);

  // Funzione helper per trovare il blocco che precede un container IF nel suo parent
  const findBlockBeforeContainer = useCallback((allBlocks: any[], containerId: string): any | null => {
    const searchInBlocks = (blocks: any[]): any | null => {
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        
        // Se troviamo il container, ritorna il blocco precedente
        if (block.id === containerId && i > 0) {
          return blocks[i - 1];
        }
        
        // Cerca ricorsivamente nei children
        if (block.children) {
          const found = searchInBlocks(block.children);
          if (found) return found;
        }
        
        // Cerca nei rami IF
        if (block.type === 'IF') {
          if (block.thenBlocks) {
            const found = searchInBlocks(block.thenBlocks);
            if (found) return found;
          }
          if (block.elseBlocks) {
            const found = searchInBlocks(block.elseBlocks);
            if (found) return found;
          }
        }
        
        // Cerca nei container MISSION
        if (block.type === 'MISSION') {
          if (block.blocksMission) {
            const found = searchInBlocks(block.blocksMission);
            if (found) return found;
          }
          if (block.blocksFinish) {
            const found = searchInBlocks(block.blocksFinish);
            if (found) return found;
          }
        }
        
        // Cerca nei container BUILD
        if (block.type === 'BUILD') {
          if (block.blockInit) {
            const found = searchInBlocks(block.blockInit);
            if (found) return found;
          }
          if (block.blockStart) {
            const found = searchInBlocks(block.blockStart);
            if (found) return found;
          }
        }
        
        // Cerca nei container FLIGHT
        if (block.type === 'FLIGHT') {
          if (block.blockInit) {
            const found = searchInBlocks(block.blockInit);
            if (found) return found;
          }
          if (block.blockStart) {
            const found = searchInBlocks(block.blockStart);
            if (found) return found;
          }
          if (block.blockEvaluate) {
            const found = searchInBlocks(block.blockEvaluate);
            if (found) return found;
          }
        }
      }
      return null;
    };
    
    return searchInBlocks(allBlocks);
  }, []);

  // Funzione per validare l'inserimento di un blocco
  const validateBlockInsertion = useCallback((blockType: string, targetContainer: any, targetContainerType: string, index?: number, allBlocks?: any[]): boolean => {
    // Validazione specifica per MENU
    if (blockType === 'MENU') {
      let prevBlock = null;
      let blocks: any[] = [];
      
      // Gestione uniforme per tutti i tipi di container
      if (targetContainerType === 'thenBlocks' || targetContainerType === 'elseBlocks' || 
          targetContainerType === 'children' || targetContainerType === 'blocksMission' || 
          targetContainerType === 'blocksFinish' || targetContainerType === 'blockInit' ||
          targetContainerType === 'blockStart' || targetContainerType === 'blockEvaluate') {
        
        blocks = targetContainer[targetContainerType] || [];
        
        if (index !== undefined && index > 0) {
          // C'è un blocco prima nell'array
          prevBlock = blocks[index - 1];
        } else if (index === 0 || (index === undefined && blocks.length === 0)) {
          // È il primo blocco del container - controlla il blocco prima del container
          if (allBlocks) {
            prevBlock = findBlockBeforeContainer(allBlocks, targetContainer.id);
          }
        } else if (index === undefined && blocks.length > 0) {
          // Aggiunto alla fine
          prevBlock = blocks[blocks.length - 1];
        }
      }

      // Se non c'è blocco precedente (inserimento in container vuoto o primo blocco)
      // O se il blocco precedente non permette MENU dopo di esso
      if (!prevBlock || !canInsertMenuAfterBlock(prevBlock)) {
        return false;
      }
    }

    // Validazione per OPT - può essere inserito solo dentro MENU
    if (blockType === 'OPT') {
      if (targetContainer.type !== 'MENU') {
        return false;
      }
    }

    // Validazione per blocchi dentro MENU - solo OPT permessi
    if (targetContainer.type === 'MENU' && blockType !== 'OPT') {
      return false;
    }
    
    // OPT può essere inserito solo in MENU
    if (blockType === 'OPT' && targetContainer.type !== 'MENU') {
      return false;
    }

    return true;
  }, [canInsertMenuAfterBlock, findBlockBeforeContainer]);

  // Funzione per aggiornare un blocco specifico in modo ricorsivo
  const updateBlockRecursive = useCallback((blocks: any[], blockId: string, updates: any): any[] => {
    return blocks.map(block => {
      if (block.id === blockId) {
        return { ...block, ...updates };
      }
      
      let updated = { ...block };
      let hasChanges = false;
      
      // Ricorsione per container normali
      if (block.children) {
        const newChildren = updateBlockRecursive(block.children, blockId, updates);
        if (newChildren !== block.children) {
          updated.children = newChildren;
          hasChanges = true;
        }
      }
      
      // Ricorsione per blocchi IF
      if (block.type === 'IF') {
        if (block.thenBlocks) {
          const newThenBlocks = updateBlockRecursive(block.thenBlocks, blockId, updates);
          if (newThenBlocks !== block.thenBlocks) {
            updated.thenBlocks = newThenBlocks;
            hasChanges = true;
          }
        }
        if (block.elseBlocks) {
          const newElseBlocks = updateBlockRecursive(block.elseBlocks, blockId, updates);
          if (newElseBlocks !== block.elseBlocks) {
            updated.elseBlocks = newElseBlocks;
            hasChanges = true;
          }
        }
      }
      
      // Ricorsione per blocchi MISSION
      if (block.type === 'MISSION') {
        if (block.blocksMission) {
          const newBlocksMission = updateBlockRecursive(block.blocksMission, blockId, updates);
          if (newBlocksMission !== block.blocksMission) {
            updated.blocksMission = newBlocksMission;
            hasChanges = true;
          }
        }
        if (block.blocksFinish) {
          const newBlocksFinish = updateBlockRecursive(block.blocksFinish, blockId, updates);
          if (newBlocksFinish !== block.blocksFinish) {
            updated.blocksFinish = newBlocksFinish;
            hasChanges = true;
          }
        }
      }
      
      // Ricorsione per blocchi BUILD
      if (block.type === 'BUILD') {
        if (block.blockInit) {
          const newBlockInit = updateBlockRecursive(block.blockInit, blockId, updates);
          if (newBlockInit !== block.blockInit) {
            updated.blockInit = newBlockInit;
            hasChanges = true;
          }
        }
        if (block.blockStart) {
          const newBlockStart = updateBlockRecursive(block.blockStart, blockId, updates);
          if (newBlockStart !== block.blockStart) {
            updated.blockStart = newBlockStart;
            hasChanges = true;
          }
        }
      }
      
      // Ricorsione per blocchi FLIGHT
      if (block.type === 'FLIGHT') {
        if (block.blockInit) {
          const newBlockInit = updateBlockRecursive(block.blockInit, blockId, updates);
          if (newBlockInit !== block.blockInit) {
            updated.blockInit = newBlockInit;
            hasChanges = true;
          }
        }
        if (block.blockStart) {
          const newBlockStart = updateBlockRecursive(block.blockStart, blockId, updates);
          if (newBlockStart !== block.blockStart) {
            updated.blockStart = newBlockStart;
            hasChanges = true;
          }
        }
        if (block.blockEvaluate) {
          const newBlockEvaluate = updateBlockRecursive(block.blockEvaluate, blockId, updates);
          if (newBlockEvaluate !== block.blockEvaluate) {
            updated.blockEvaluate = newBlockEvaluate;
            hasChanges = true;
          }
        }
      }
      
      return hasChanges ? updated : block;
    });
  }, []);

  // Funzione per rimuovere un blocco in modo ricorsivo
  const removeBlockRecursive = useCallback((blocks: any[], blockId: string): any[] => {
    return blocks.reduce((acc: any[], block) => {
      if (block.id === blockId) {
        return acc; // Skip this block
      }
      
      let updated = { ...block };
      let hasChanges = false;
      
      // Ricorsione per container normali
      if (block.children) {
        const newChildren = removeBlockRecursive(block.children, blockId);
        if (newChildren !== block.children) {
          updated.children = newChildren;
          hasChanges = true;
        }
      }
      
      // Ricorsione per blocchi IF
      if (block.type === 'IF') {
        if (block.thenBlocks) {
          const newThenBlocks = removeBlockRecursive(block.thenBlocks, blockId);
          if (newThenBlocks !== block.thenBlocks) {
            updated.thenBlocks = newThenBlocks;
            updated.numThen = newThenBlocks.length;
            hasChanges = true;
          }
        }
        if (block.elseBlocks) {
          const newElseBlocks = removeBlockRecursive(block.elseBlocks, blockId);
          if (newElseBlocks !== block.elseBlocks) {
            updated.elseBlocks = newElseBlocks;
            updated.numElse = newElseBlocks.length;
            hasChanges = true;
          }
        }
      }
      
      // Ricorsione per blocchi MISSION
      if (block.type === 'MISSION') {
        if (block.blocksMission) {
          const newBlocksMission = removeBlockRecursive(block.blocksMission, blockId);
          if (newBlocksMission !== block.blocksMission) {
            updated.blocksMission = newBlocksMission;
            hasChanges = true;
          }
        }
        if (block.blocksFinish) {
          const newBlocksFinish = removeBlockRecursive(block.blocksFinish, blockId);
          if (newBlocksFinish !== block.blocksFinish) {
            updated.blocksFinish = newBlocksFinish;
            hasChanges = true;
          }
        }
      }
      
      // Ricorsione per blocchi BUILD
      if (block.type === 'BUILD') {
        if (block.blockInit) {
          const newBlockInit = removeBlockRecursive(block.blockInit, blockId);
          if (newBlockInit !== block.blockInit) {
            updated.blockInit = newBlockInit;
            updated.numBlockInit = newBlockInit.length;
            hasChanges = true;
          }
        }
        if (block.blockStart) {
          const newBlockStart = removeBlockRecursive(block.blockStart, blockId);
          if (newBlockStart !== block.blockStart) {
            updated.blockStart = newBlockStart;
            updated.numBlockStart = newBlockStart.length;
            hasChanges = true;
          }
        }
      }
      
      // Ricorsione per blocchi FLIGHT
      if (block.type === 'FLIGHT') {
        if (block.blockInit) {
          const newBlockInit = removeBlockRecursive(block.blockInit, blockId);
          if (newBlockInit !== block.blockInit) {
            updated.blockInit = newBlockInit;
            updated.numBlockInit = newBlockInit.length;
            hasChanges = true;
          }
        }
        if (block.blockStart) {
          const newBlockStart = removeBlockRecursive(block.blockStart, blockId);
          if (newBlockStart !== block.blockStart) {
            updated.blockStart = newBlockStart;
            updated.numBlockStart = newBlockStart.length;
            hasChanges = true;
          }
        }
        if (block.blockEvaluate) {
          const newBlockEvaluate = removeBlockRecursive(block.blockEvaluate, blockId);
          if (newBlockEvaluate !== block.blockEvaluate) {
            updated.blockEvaluate = newBlockEvaluate;
            updated.numBlockEvaluate = newBlockEvaluate.length;
            hasChanges = true;
          }
        }
      }
      
      acc.push(hasChanges ? updated : block);
      return acc;
    }, []);
  }, []);

  // Funzione per aggiungere un blocco a un indice specifico
  const addBlockAtIndex = useCallback((blocks: any[], containerId: string, containerType: string, newBlock: any, index: number): any[] => {
    // Trova il container per la validazione
    const findContainer = (blocks: any[], id: string): any => {
      for (const block of blocks) {
        if (block.id === id) return block;
        if (block.children) {
          const found = findContainer(block.children, id);
          if (found) return found;
        }
        if (block.type === 'IF') {
          if (block.thenBlocks) {
            const found = findContainer(block.thenBlocks, id);
            if (found) return found;
          }
          if (block.elseBlocks) {
            const found = findContainer(block.elseBlocks, id);
            if (found) return found;
          }
        }
        if (block.type === 'MISSION') {
          if (block.blocksMission) {
            const found = findContainer(block.blocksMission, id);
            if (found) return found;
          }
          if (block.blocksFinish) {
            const found = findContainer(block.blocksFinish, id);
            if (found) return found;
          }
        }
        if (block.type === 'BUILD') {
          if (block.blockInit) {
            const found = findContainer(block.blockInit, id);
            if (found) return found;
          }
          if (block.blockStart) {
            const found = findContainer(block.blockStart, id);
            if (found) return found;
          }
        }
        if (block.type === 'FLIGHT') {
          if (block.blockInit) {
            const found = findContainer(block.blockInit, id);
            if (found) return found;
          }
          if (block.blockStart) {
            const found = findContainer(block.blockStart, id);
            if (found) return found;
          }
          if (block.blockEvaluate) {
            const found = findContainer(block.blockEvaluate, id);
            if (found) return found;
          }
        }
      }
      return null;
    };

    const targetContainer = findContainer(blocks, containerId);
    if (targetContainer && !validateBlockInsertion(newBlock.type, targetContainer, containerType, index, blocks)) {
      return blocks; // Non inserire se la validazione fallisce
    }

    return blocks.map(block => {
      if (block.id === containerId) {
        if (containerType === 'thenBlocks') {
          const newBlocks = [...(block.thenBlocks || [])];
          newBlocks.splice(index, 0, newBlock);
          return {
            ...block,
            thenBlocks: newBlocks,
            numThen: newBlocks.length
          };
        } else if (containerType === 'elseBlocks') {
          // Inizializza elseBlocks se non esiste
          if (!block.elseBlocks) {
            block.elseBlocks = [];
          }
          const newBlocks = [...block.elseBlocks];
          newBlocks.splice(index, 0, newBlock);
          return {
            ...block,
            elseBlocks: newBlocks,
            numElse: newBlocks.length
          };
        } else if (containerType === 'children') {
          const newChildren = [...(block.children || [])];
          newChildren.splice(index, 0, newBlock);
          return {
            ...block,
            children: newChildren
          };
        } else if (containerType === 'blocksMission') {
          const newBlocks = [...(block.blocksMission || [])];
          newBlocks.splice(index, 0, newBlock);
          return {
            ...block,
            blocksMission: newBlocks
          };
        } else if (containerType === 'blocksFinish') {
          const newBlocks = [...(block.blocksFinish || [])];
          newBlocks.splice(index, 0, newBlock);
          return {
            ...block,
            blocksFinish: newBlocks
          };
        } else if (containerType === 'blockInit') {
          const newBlocks = [...(block.blockInit || [])];
          newBlocks.splice(index, 0, newBlock);
          return {
            ...block,
            blockInit: newBlocks,
            numBlockInit: newBlocks.length
          };
        } else if (containerType === 'blockStart') {
          const newBlocks = [...(block.blockStart || [])];
          newBlocks.splice(index, 0, newBlock);
          return {
            ...block,
            blockStart: newBlocks,
            numBlockStart: newBlocks.length
          };
        } else if (containerType === 'blockEvaluate') {
          const newBlocks = [...(block.blockEvaluate || [])];
          newBlocks.splice(index, 0, newBlock);
          return {
            ...block,
            blockEvaluate: newBlocks,
            numBlockEvaluate: newBlocks.length
          };
        }
      }
      
      // Ricorsione
      const updated = { ...block };
      if (block.children) {
        updated.children = addBlockAtIndex(block.children, containerId, containerType, newBlock, index);
      }
      if (block.type === 'IF') {
        if (block.thenBlocks) {
          updated.thenBlocks = addBlockAtIndex(block.thenBlocks, containerId, containerType, newBlock, index);
        }
        if (block.elseBlocks) {
          updated.elseBlocks = addBlockAtIndex(block.elseBlocks, containerId, containerType, newBlock, index);
        }
      }
      if (block.type === 'MISSION') {
        if (block.blocksMission) {
          updated.blocksMission = addBlockAtIndex(block.blocksMission, containerId, containerType, newBlock, index);
        }
        if (block.blocksFinish) {
          updated.blocksFinish = addBlockAtIndex(block.blocksFinish, containerId, containerType, newBlock, index);
        }
      }
      if (block.type === 'BUILD') {
        if (block.blockInit) {
          updated.blockInit = addBlockAtIndex(block.blockInit, containerId, containerType, newBlock, index);
        }
        if (block.blockStart) {
          updated.blockStart = addBlockAtIndex(block.blockStart, containerId, containerType, newBlock, index);
        }
      }
      if (block.type === 'FLIGHT') {
        if (block.blockInit) {
          updated.blockInit = addBlockAtIndex(block.blockInit, containerId, containerType, newBlock, index);
        }
        if (block.blockStart) {
          updated.blockStart = addBlockAtIndex(block.blockStart, containerId, containerType, newBlock, index);
        }
        if (block.blockEvaluate) {
          updated.blockEvaluate = addBlockAtIndex(block.blockEvaluate, containerId, containerType, newBlock, index);
        }
      }
      
      return updated;
    });
  }, [validateBlockInsertion]);

  // Funzione per aggiungere un blocco in un container specifico
  const addBlockToContainer = useCallback((blocks: any[], containerId: string, containerType: string, newBlock: any): any[] => {
    // Trova il container per la validazione
    const findContainer = (blocks: any[], id: string): any => {
      for (const block of blocks) {
        if (block.id === id) return block;
        if (block.children) {
          const found = findContainer(block.children, id);
          if (found) return found;
        }
        if (block.type === 'IF') {
          if (block.thenBlocks) {
            const found = findContainer(block.thenBlocks, id);
            if (found) return found;
          }
          if (block.elseBlocks) {
            const found = findContainer(block.elseBlocks, id);
            if (found) return found;
          }
        }
        if (block.type === 'MISSION') {
          if (block.blocksMission) {
            const found = findContainer(block.blocksMission, id);
            if (found) return found;
          }
          if (block.blocksFinish) {
            const found = findContainer(block.blocksFinish, id);
            if (found) return found;
          }
        }
        if (block.type === 'BUILD') {
          if (block.blockInit) {
            const found = findContainer(block.blockInit, id);
            if (found) return found;
          }
          if (block.blockStart) {
            const found = findContainer(block.blockStart, id);
            if (found) return found;
          }
        }
        if (block.type === 'FLIGHT') {
          if (block.blockInit) {
            const found = findContainer(block.blockInit, id);
            if (found) return found;
          }
          if (block.blockStart) {
            const found = findContainer(block.blockStart, id);
            if (found) return found;
          }
          if (block.blockEvaluate) {
            const found = findContainer(block.blockEvaluate, id);
            if (found) return found;
          }
        }
      }
      return null;
    };

    const targetContainer = findContainer(blocks, containerId);
    if (targetContainer && !validateBlockInsertion(newBlock.type, targetContainer, containerType, undefined, blocks)) {
      return blocks; // Non inserire se la validazione fallisce
    }

    return blocks.map(block => {
      if (block.id === containerId) {
        if (containerType === 'thenBlocks') {
          return {
            ...block,
            thenBlocks: [...(block.thenBlocks || []), newBlock],
            numThen: (block.thenBlocks?.length || 0) + 1
          };
        } else if (containerType === 'elseBlocks') {
          // Inizializza elseBlocks se non esiste
          const elseBlocks = block.elseBlocks || [];
          return {
            ...block,
            elseBlocks: [...elseBlocks, newBlock],
            numElse: elseBlocks.length + 1
          };
        } else if (containerType === 'children') {
          return {
            ...block,
            children: [...(block.children || []), newBlock]
          };
        } else if (containerType === 'blocksMission') {
          return {
            ...block,
            blocksMission: [...(block.blocksMission || []), newBlock]
          };
        } else if (containerType === 'blocksFinish') {
          return {
            ...block,
            blocksFinish: [...(block.blocksFinish || []), newBlock]
          };
        } else if (containerType === 'blockInit') {
          const newBlocks = [...(block.blockInit || []), newBlock];
          return {
            ...block,
            blockInit: newBlocks,
            numBlockInit: newBlocks.length
          };
        } else if (containerType === 'blockStart') {
          const newBlocks = [...(block.blockStart || []), newBlock];
          return {
            ...block,
            blockStart: newBlocks,
            numBlockStart: newBlocks.length
          };
        } else if (containerType === 'blockEvaluate') {
          const newBlocks = [...(block.blockEvaluate || []), newBlock];
          return {
            ...block,
            blockEvaluate: newBlocks,
            numBlockEvaluate: newBlocks.length
          };
        }
      }
      
      // Ricorsione
      const updated = { ...block };
      if (block.children) {
        updated.children = addBlockToContainer(block.children, containerId, containerType, newBlock);
      }
      if (block.type === 'IF') {
        if (block.thenBlocks) {
          updated.thenBlocks = addBlockToContainer(block.thenBlocks, containerId, containerType, newBlock);
        }
        if (block.elseBlocks) {
          updated.elseBlocks = addBlockToContainer(block.elseBlocks, containerId, containerType, newBlock);
        }
      }
      if (block.type === 'MISSION') {
        if (block.blocksMission) {
          updated.blocksMission = addBlockToContainer(block.blocksMission, containerId, containerType, newBlock);
        }
        if (block.blocksFinish) {
          updated.blocksFinish = addBlockToContainer(block.blocksFinish, containerId, containerType, newBlock);
        }
      }
      if (block.type === 'BUILD') {
        if (block.blockInit) {
          updated.blockInit = addBlockToContainer(block.blockInit, containerId, containerType, newBlock);
        }
        if (block.blockStart) {
          updated.blockStart = addBlockToContainer(block.blockStart, containerId, containerType, newBlock);
        }
      }
      if (block.type === 'FLIGHT') {
        if (block.blockInit) {
          updated.blockInit = addBlockToContainer(block.blockInit, containerId, containerType, newBlock);
        }
        if (block.blockStart) {
          updated.blockStart = addBlockToContainer(block.blockStart, containerId, containerType, newBlock);
        }
        if (block.blockEvaluate) {
          updated.blockEvaluate = addBlockToContainer(block.blockEvaluate, containerId, containerType, newBlock);
        }
      }
      
      return updated;
    });
  }, [validateBlockInsertion]);

  // Funzione per verificare se un drop è valido SENZA effettuarlo
  // Usata per il feedback visivo durante il drag
  const canDropBlock = useCallback((blockType: string, containerId: string, containerType: string, blocks: any[], index?: number): boolean => {
    const findContainer = (blocks: any[], id: string): any => {
      for (const block of blocks) {
        if (block.id === id) return block;
        if (block.children) {
          const found = findContainer(block.children, id);
          if (found) return found;
        }
        if (block.type === 'IF') {
          if (block.thenBlocks) {
            const found = findContainer(block.thenBlocks, id);
            if (found) return found;
          }
          if (block.elseBlocks) {
            const found = findContainer(block.elseBlocks, id);
            if (found) return found;
          }
        }
        if (block.type === 'MISSION') {
          if (block.blocksMission) {
            const found = findContainer(block.blocksMission, id);
            if (found) return found;
          }
          if (block.blocksFinish) {
            const found = findContainer(block.blocksFinish, id);
            if (found) return found;
          }
        }
        if (block.type === 'BUILD') {
          if (block.blockInit) {
            const found = findContainer(block.blockInit, id);
            if (found) return found;
          }
          if (block.blockStart) {
            const found = findContainer(block.blockStart, id);
            if (found) return found;
          }
        }
        if (block.type === 'FLIGHT') {
          if (block.blockInit) {
            const found = findContainer(block.blockInit, id);
            if (found) return found;
          }
          if (block.blockStart) {
            const found = findContainer(block.blockStart, id);
            if (found) return found;
          }
          if (block.blockEvaluate) {
            const found = findContainer(block.blockEvaluate, id);
            if (found) return found;
          }
        }
      }
      return null;
    };

    const targetContainer = findContainer(blocks, containerId);
    if (!targetContainer) return true; // Se non trova il container, permetti (verrà gestito dopo)
    
    return validateBlockInsertion(blockType, targetContainer, containerType, index, blocks);
  }, [validateBlockInsertion]);

  // Funzione per validare tutti i blocchi esistenti e contare gli errori
  const validateAllBlocks = useCallback((blocks: any[]): { errors: number; invalidBlocks: string[] } => {
    let errors = 0;
    const invalidBlocks: string[] = [];
    
    const validateRecursive = (blocks: any[], parentBlock?: any, allRootBlocks?: any[]): void => {
      blocks.forEach((block, index) => {
        // Valida blocchi MENU
        if (block.type === 'MENU') {
          let prevBlock = null;
          
          if (index > 0) {
            // C'è un blocco prima nello stesso livello
            prevBlock = blocks[index - 1];
          } else if (parentBlock && parentBlock.type === 'IF' && allRootBlocks) {
            // È il primo blocco in un ramo IF - controlla il blocco prima dell'IF
            prevBlock = findBlockBeforeContainer(allRootBlocks, parentBlock.id);
          } else if (parentBlock && parentBlock.type === 'SCRIPT' && index === 0) {
            // È il primo blocco dello script - non può essere MENU
            prevBlock = null;
          }
          
          if (!prevBlock || !canInsertMenuAfterBlock(prevBlock)) {
            errors++;
            invalidBlocks.push(block.id);
          }
        }
        
        // Valida blocchi OPT (devono essere dentro MENU)
        if (block.type === 'OPT' && (!parentBlock || parentBlock.type !== 'MENU')) {
          errors++;
          invalidBlocks.push(block.id);
        }
        
        // Valida contenuto dei MENU (solo OPT permessi)
        if (block.type === 'MENU' && block.children) {
          block.children.forEach((child: any) => {
            if (child.type !== 'OPT') {
              errors++;
              invalidBlocks.push(child.id);
            }
          });
        }
        
        // Ricorsione per container
        if (block.children) {
          // Per i container normali, passa il blocco corrente come parent e mantieni allRootBlocks
          validateRecursive(block.children, block, allRootBlocks || blocks);
        }
        
        // Ricorsione per IF
        if (block.type === 'IF') {
          if (block.thenBlocks) {
            // Per i rami IF, passa il blocco IF come parent e i blocchi root originali
            validateRecursive(block.thenBlocks, block, allRootBlocks || blocks);
          }
          if (block.elseBlocks && block.elseBlocks.length > 0) {
            validateRecursive(block.elseBlocks, block, allRootBlocks || blocks);
          }
        }
        
        // Ricorsione per MISSION
        if (block.type === 'MISSION') {
          if (block.blocksMission) {
            validateRecursive(block.blocksMission, block, allRootBlocks || blocks);
          }
          if (block.blocksFinish) {
            validateRecursive(block.blocksFinish, block, allRootBlocks || blocks);
          }
        }
        
        // Ricorsione per BUILD
        if (block.type === 'BUILD') {
          if (block.blockInit) {
            validateRecursive(block.blockInit, block, allRootBlocks || blocks);
          }
          if (block.blockStart) {
            validateRecursive(block.blockStart, block, allRootBlocks || blocks);
          }
        }
        
        // Ricorsione per FLIGHT
        if (block.type === 'FLIGHT') {
          if (block.blockInit) {
            validateRecursive(block.blockInit, block, allRootBlocks || blocks);
          }
          if (block.blockStart) {
            validateRecursive(block.blockStart, block, allRootBlocks || blocks);
          }
          if (block.blockEvaluate) {
            validateRecursive(block.blockEvaluate, block, allRootBlocks || blocks);
          }
        }
      });
    };
    
    // Inizia la validazione dal blocco principale (SCRIPT o MISSION)
    const scriptBlock = blocks.find(b => b.type === 'SCRIPT');
    const missionBlock = blocks.find(b => b.type === 'MISSION');
    
    if (scriptBlock && scriptBlock.children) {
      validateRecursive(scriptBlock.children, scriptBlock, blocks);
    } else if (missionBlock) {
      if (missionBlock.blocksMission) {
        validateRecursive(missionBlock.blocksMission, missionBlock, blocks);
      }
      if (missionBlock.blocksFinish) {
        validateRecursive(missionBlock.blocksFinish, missionBlock, blocks);
      }
    } else {
      // Se non c'è un blocco principale, valida tutti i blocchi come root
      validateRecursive(blocks, null, blocks);
    }
    
    return { errors, invalidBlocks };
  }, [canInsertMenuAfterBlock, findBlockBeforeContainer]);

  return {
    updateBlockRecursive,
    removeBlockRecursive,
    addBlockAtIndex,
    addBlockToContainer,
    canDropBlock,
    validateAllBlocks
  };
};
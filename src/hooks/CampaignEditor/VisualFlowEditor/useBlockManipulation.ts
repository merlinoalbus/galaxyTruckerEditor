import { useCallback } from 'react';

export const useBlockManipulation = () => {
  // Funzione per aggiornare un blocco specifico in modo ricorsivo
  const updateBlockRecursive = useCallback((blocks: any[], blockId: string, updates: any): any[] => {
    return blocks.map(block => {
      if (block.id === blockId) {
        return { ...block, ...updates };
      }
      
      // Ricorsione per container normali
      if (block.children) {
        return {
          ...block,
          children: updateBlockRecursive(block.children, blockId, updates)
        };
      }
      
      // Ricorsione per blocchi IF
      if (block.type === 'IF') {
        const updated = { ...block };
        if (block.thenBlocks) {
          updated.thenBlocks = updateBlockRecursive(block.thenBlocks, blockId, updates);
        }
        if (block.elseBlocks) {
          updated.elseBlocks = updateBlockRecursive(block.elseBlocks, blockId, updates);
        }
        return updated;
      }
      
      return block;
    });
  }, []);

  // Funzione per rimuovere un blocco in modo ricorsivo
  const removeBlockRecursive = useCallback((blocks: any[], blockId: string): any[] => {
    return blocks.reduce((acc: any[], block) => {
      if (block.id === blockId) {
        return acc; // Skip this block
      }
      
      // Per container normali
      if (block.children) {
        acc.push({
          ...block,
          children: removeBlockRecursive(block.children, blockId)
        });
      }
      // Per blocchi IF
      else if (block.type === 'IF') {
        const updated = { ...block };
        if (block.thenBlocks) {
          updated.thenBlocks = removeBlockRecursive(block.thenBlocks, blockId);
          updated.numThen = updated.thenBlocks.length;
        }
        if (block.elseBlocks) {
          updated.elseBlocks = removeBlockRecursive(block.elseBlocks, blockId);
          updated.numElse = updated.elseBlocks.length;
        }
        acc.push(updated);
      }
      else {
        acc.push(block);
      }
      
      return acc;
    }, []);
  }, []);

  // Funzione per aggiungere un blocco a un indice specifico
  const addBlockAtIndex = useCallback((blocks: any[], containerId: string, containerType: string, newBlock: any, index: number): any[] => {
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
      
      return updated;
    });
  }, []);

  // Funzione per aggiungere un blocco in un container specifico
  const addBlockToContainer = useCallback((blocks: any[], containerId: string, containerType: string, newBlock: any): any[] => {
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
      
      return updated;
    });
  }, []);

  return {
    updateBlockRecursive,
    removeBlockRecursive,
    addBlockAtIndex,
    addBlockToContainer
  };
};
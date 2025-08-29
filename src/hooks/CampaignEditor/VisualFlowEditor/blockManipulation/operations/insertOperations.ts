/**
 * Insert Operations Module
 * Funzioni per inserire blocchi nell'albero a indici specifici o alla fine di container
 */

import { findContainer } from '../search';
import { validateBlockInsertion } from '../validation/validateOperations';
import { traverseBlockContainersSimple } from './blockTraversal';

/**
 * Aggiunge un blocco a un indice specifico in un container
 * Valida l'operazione prima di eseguirla e gestisce tutti i tipi di container
 * 
 * @param blocks - Array di blocchi da attraversare
 * @param containerId - ID del container di destinazione
 * @param containerType - Tipo di container (thenBlocks, elseBlocks, children, etc.)
 * @param newBlock - Nuovo blocco da inserire
 * @param index - Indice dove inserire il blocco
 * @returns Nuovo array di blocchi con il blocco inserito
 */
export const addBlockAtIndex = (
  blocks: any[],
  containerId: string,
  containerType: string,
  newBlock: any,
  index: number
): any[] => {
  // Gestione speciale per il container root
  if (containerId === 'root' && containerType === 'children') {
    // Valida l'inserimento nel container root
    if (!validateBlockInsertion(newBlock.type, null, 'root', index, blocks)) {
      return blocks; // Non inserire se la validazione fallisce
    }
    // Inserisci direttamente nell'array principale
    const newBlocks = [...blocks];
    newBlocks.splice(index, 0, newBlock);
    return newBlocks;
  }

  // Trova il container per la validazione usando la funzione importata
  const targetContainer = findContainer(blocks, containerId);
  if (targetContainer && !validateBlockInsertion(newBlock.type, targetContainer, containerType, index, blocks)) {
    return blocks; // Non inserire se la validazione fallisce
  }

  return blocks.map(block => {
    // Gestione speciale per blocchi virtuali
    if (block.id === containerId && (block as any).isVirtualContainer) {
      // Per i blocchi virtuali, aggiungi sempre ai children indipendentemente dal containerType
      const newChildren = [...((block as any).children || [])];
      newChildren.splice(index, 0, newBlock);
      return {
        ...block,
        children: newChildren
      };
    }
    
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
        const elseBlocks = block.elseBlocks || [];
        const newBlocks = [...elseBlocks];
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
    
    // Utilizza la logica comune di attraversamento
    return traverseBlockContainersSimple(
      block,
      (childBlocks) => addBlockAtIndex(childBlocks, containerId, containerType, newBlock, index),
      []
    );
  });
};

/**
 * Aggiunge un blocco alla fine di un container specifico
 * Valida l'operazione prima di eseguirla e gestisce tutti i tipi di container
 * 
 * @param blocks - Array di blocchi da attraversare
 * @param containerId - ID del container di destinazione
 * @param containerType - Tipo di container (thenBlocks, elseBlocks, children, etc.)
 * @param newBlock - Nuovo blocco da inserire
 * @returns Nuovo array di blocchi con il blocco aggiunto
 */
export const addBlockToContainer = (
  blocks: any[],
  containerId: string,
  containerType: string,
  newBlock: any
): any[] => {
  // Gestione speciale per il container root
  if (containerId === 'root' && containerType === 'children') {
    // Valida l'inserimento nel container root
    if (!validateBlockInsertion(newBlock.type, null, 'root', undefined, blocks)) {
      return blocks; // Non inserire se la validazione fallisce
    }
    // Aggiungi direttamente alla fine dell'array principale
    return [...blocks, newBlock];
  }

  // Trova il container per la validazione usando la funzione importata
  const targetContainer = findContainer(blocks, containerId);
  if (targetContainer && !validateBlockInsertion(newBlock.type, targetContainer, containerType, undefined, blocks)) {
    return blocks; // Non inserire se la validazione fallisce
  }

  return blocks.map(block => {
    // Gestione speciale per blocchi virtuali
    if (block.id === containerId && (block as any).isVirtualContainer) {
      // Per i blocchi virtuali, aggiungi sempre ai children
      return {
        ...block,
        children: [...((block as any).children || []), newBlock]
      };
    }
    
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
    
    // Utilizza la logica comune di attraversamento
    return traverseBlockContainersSimple(
      block,
      (childBlocks) => addBlockToContainer(childBlocks, containerId, containerType, newBlock),
      []
    );
  });
};
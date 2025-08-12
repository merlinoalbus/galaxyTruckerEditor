/**
 * Remove Operations Module
 * Funzioni per rimuovere blocchi in modo ricorsivo dall'albero
 */

import { traverseBlockContainersWithTracking } from './blockTraversal';

/**
 * Rimuove un blocco specifico in modo ricorsivo dall'albero dei blocchi
 * Attraversa tutti i tipi di container e aggiorna i contatori quando necessario
 * 
 * @param blocks - Array di blocchi da attraversare
 * @param blockId - ID del blocco da rimuovere
 * @returns Nuovo array di blocchi con il blocco rimosso
 */
export const removeBlockRecursive = (blocks: any[], blockId: string): any[] => {
  return blocks.reduce((acc: any[], block) => {
    if (block.id === blockId) {
      return acc; // Skip this block
    }
    
    // Utilizza la logica comune di attraversamento con change tracking per ottimizzazioni
    const traversalResult = traverseBlockContainersWithTracking(
      block,
      (childBlocks) => removeBlockRecursive(childBlocks, blockId),
      []
    );
    
    acc.push(traversalResult.result);
    return acc;
  }, []);
};
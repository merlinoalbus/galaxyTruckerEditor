/**
 * Update Operations Module
 * Funzioni per aggiornare blocchi in modo ricorsivo nell'albero
 */

import { traverseBlockContainersWithTracking } from './blockTraversal';

/**
 * Aggiorna un blocco specifico in modo ricorsivo nell'albero dei blocchi
 * Attraversa tutti i tipi di container (IF, MISSION, BUILD, FLIGHT) per trovare e aggiornare il blocco
 * 
 * @param blocks - Array di blocchi da attraversare
 * @param blockId - ID del blocco da aggiornare
 * @param updates - Oggetto con le proprietà da aggiornare
 * @returns Nuovo array di blocchi con l'aggiornamento applicato
 */
export const updateBlockRecursive = (blocks: any[], blockId: string, updates: any): any[] => {
  return blocks.map(block => {
    if (block.id === blockId) {
      return { ...block, ...updates };
    }
    
    // Utilizza la logica comune di attraversamento con change tracking per ottimizzazioni
    const traversalResult = traverseBlockContainersWithTracking(
      block,
      (childBlocks) => updateBlockRecursive(childBlocks, blockId, updates),
      []
    );
    
    return traversalResult.result;
  });
};
/**
 * ASK Validation Module
 * Validazioni specifiche per blocchi ASK
 */

/**
 * Verifica se due blocchi adiacenti sono entrambi ASK
 * Utilizzato per validazione di blocchi esistenti
 * 
 * @param currentBlock - Blocco corrente
 * @param previousBlock - Blocco precedente
 * @returns true se sono ASK consecutivi, false altrimenti
 */
export const areConsecutiveAsks = (currentBlock: any, previousBlock: any): boolean => {
  return currentBlock?.type === 'ASK' && previousBlock?.type === 'ASK';
};

/**
 * Valida che non ci siano ASK consecutivi
 * Due blocchi ASK uno dopo l'altro non sono permessi
 * 
 * @param targetContainer - Container di destinazione
 * @param targetContainerType - Tipo di container
 * @param index - Indice di inserimento (opzionale)
 * @returns true se l'inserimento è valido, false se ci sono ASK consecutivi
 */
export const validateAskInsertion = (
  targetContainer: any,
  targetContainerType: string,
  index?: number
): boolean => {
  let prevBlock = null;
  let blocks: any[] = [];
  
  // Determina il blocco precedente
  if (targetContainerType === 'thenBlocks' || targetContainerType === 'elseBlocks' || 
      targetContainerType === 'children' || targetContainerType === 'blocksMission' || 
      targetContainerType === 'blocksFinish' || targetContainerType === 'blockInit' ||
      targetContainerType === 'blockStart' || targetContainerType === 'blockEvaluate') {
    
    blocks = targetContainer[targetContainerType] || [];
    
    if (index !== undefined && index > 0) {
      prevBlock = blocks[index - 1];
    } else if (index === undefined && blocks.length > 0) {
      prevBlock = blocks[blocks.length - 1];
    }
  }
  
  // Se il blocco precedente è ASK, non permettere
  if (prevBlock && prevBlock.type === 'ASK') {
    return false;
  }
  
  return true;
};
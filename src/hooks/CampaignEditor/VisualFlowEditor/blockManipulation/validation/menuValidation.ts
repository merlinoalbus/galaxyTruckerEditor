/**
 * Menu Validation Module
 * Validazioni specifiche per blocchi MENU e OPT
 */

import { blockEndsWithAsk } from './blockValidators';
import { findBlockBeforeContainer } from '../search';

/**
 * Verifica se un blocco MENU può essere inserito dopo un determinato blocco
 * Il blocco precedente deve garantire che termini con ASK
 * 
 * @param prevBlock - Il blocco che precede il MENU
 * @returns true se il MENU può essere inserito, false altrimenti
 */
export const canInsertMenuAfterBlock = (prevBlock: any): boolean => {
  if (!prevBlock) return false;
  
  // Verifica ricorsivamente se il blocco precedente garantisce un ASK nel flusso
  return blockEndsWithAsk(prevBlock);
};

/**
 * Valida l'inserimento di un blocco MENU in una posizione specifica
 * 
 * @param targetContainer - Container di destinazione
 * @param targetContainerType - Tipo di container (children, thenBlocks, etc.)
 * @param index - Indice di inserimento (opzionale)
 * @param allBlocks - Tutti i blocchi per ricerca del predecessore
 * @returns true se l'inserimento è valido, false altrimenti
 */
export const validateMenuInsertion = (
  targetContainer: any,
  targetContainerType: string,
  index?: number,
  allBlocks?: any[]
): boolean => {
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
  
  return true;
};

/**
 * Valida l'inserimento di blocchi OPT
 * OPT può essere inserito solo dentro MENU
 * 
 * @param targetContainer - Container di destinazione
 * @returns true se l'inserimento è valido
 */
export const validateOptInsertion = (targetContainer: any): boolean => {
  return targetContainer.type === 'MENU';
};

/**
 * Valida che solo blocchi OPT possano essere inseriti in MENU
 * 
 * @param targetContainer - Container di destinazione
 * @param blockType - Tipo di blocco da inserire
 * @returns true se l'inserimento è valido
 */
export const validateMenuContent = (targetContainer: any, blockType: string): boolean => {
  if (targetContainer.type === 'MENU') {
    return blockType === 'OPT';
  }
  return true; // Non è un MENU, non applicare questa validazione
};
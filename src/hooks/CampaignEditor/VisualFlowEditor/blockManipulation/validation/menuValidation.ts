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
 * NOTA: La logica per IF è gestita direttamente in validateMenuInsertion 
 * per garantire consistenza con la validazione globale
 * 
 * @param prevBlock - Il blocco che precede il MENU
 * @returns true se il MENU può essere inserito, false altrimenti
 */
export const canInsertMenuAfterBlock = (prevBlock: any): boolean => {
  if (!prevBlock) return false;
  
  // Per blocchi IF, la logica è gestita in validateMenuInsertion
  // Qui ritorniamo false per evitare duplicazione della logica
  if (prevBlock.type === 'IF') {
    return false;
  }
  
  // Verifica ricorsivamente se il blocco precedente garantisce un ASK nel flusso
  const result = blockEndsWithAsk(prevBlock);
  return result;
};

/**
 * Valida l'inserimento di un blocco MENU in una posizione specifica
 * Usa la stessa logica della validazione globale per garantire consistenza
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
    } else if (index === 0) {
      // È il primo blocco del container - controlla il blocco prima del container
      if (allBlocks) {
        prevBlock = findBlockBeforeContainer(allBlocks, targetContainer.id);
      }
    } else if (index === undefined) {
      if (blocks.length > 0) {
        // Aggiunto alla fine
        prevBlock = blocks[blocks.length - 1];
      } else {
        // Container vuoto - controlla il blocco prima del container
        if (allBlocks) {
          prevBlock = findBlockBeforeContainer(allBlocks, targetContainer.id);
        }
      }
    }
  }

  
  if (!prevBlock) {
    return false;
  }
  
  // USA LA STESSA LOGICA DELLA VALIDAZIONE GLOBALE
  // Per blocchi IF: entrambi i rami devono terminare con ASK
  if (prevBlock.type === 'IF') {
    // LOGICA SPECIALE: Se stiamo spostando un MENU dall'interno dell'IF verso l'esterno,
    // dobbiamo controllare se i rami finiranno con ASK DOPO la rimozione del MENU
    
    let thenEndsWithAsk = false;
    let elseEndsWithAsk = false;
    
    // Controlla ramo THEN
    if (prevBlock.thenBlocks && prevBlock.thenBlocks.length > 0) {
      const lastThenBlock = prevBlock.thenBlocks[prevBlock.thenBlocks.length - 1];
      if (lastThenBlock.type === 'MENU' && prevBlock.thenBlocks.length > 1) {
        // Se l'ultimo blocco è MENU, controlla il penultimo
        const secondToLastThen = prevBlock.thenBlocks[prevBlock.thenBlocks.length - 2];
        thenEndsWithAsk = blockEndsWithAsk(secondToLastThen);
      } else {
        thenEndsWithAsk = blockEndsWithAsk(lastThenBlock);
      }
    }
    
    // Controlla ramo ELSE  
    if (!prevBlock.elseBlocks || prevBlock.elseBlocks.length === 0) {
      elseEndsWithAsk = true; // ELSE vuoto è valido
    } else {
      const lastElseBlock = prevBlock.elseBlocks[prevBlock.elseBlocks.length - 1];
      if (lastElseBlock.type === 'MENU' && prevBlock.elseBlocks.length > 1) {
        // Se l'ultimo blocco è MENU, controlla il penultimo
        const secondToLastElse = prevBlock.elseBlocks[prevBlock.elseBlocks.length - 2];
        elseEndsWithAsk = blockEndsWithAsk(secondToLastElse);
      } else {
        elseEndsWithAsk = blockEndsWithAsk(lastElseBlock);
      }
    }
    
    
    const canInsert = thenEndsWithAsk && elseEndsWithAsk;
    return canInsert;
  }
  
  // Per altri blocchi, usa la logica esistente
  const canInsert = canInsertMenuAfterBlock(prevBlock);
  
  if (!canInsert) {
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
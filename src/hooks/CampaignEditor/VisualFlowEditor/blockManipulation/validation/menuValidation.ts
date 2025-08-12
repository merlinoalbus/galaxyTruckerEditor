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
  
  console.log('🔍 canInsertMenuAfterBlock:', prevBlock.type, prevBlock.id?.slice(0, 8));
  
  // Per blocchi IF, la logica è gestita in validateMenuInsertion
  // Qui ritorniamo false per evitare duplicazione della logica
  if (prevBlock.type === 'IF') {
    console.log('🔍 IF block - logic handled in validateMenuInsertion');
    return false;
  }
  
  // Verifica ricorsivamente se il blocco precedente garantisce un ASK nel flusso
  const result = blockEndsWithAsk(prevBlock);
  console.log('🔍 blockEndsWithAsk result:', result);
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
  
  console.log('🔍 MENU validation:', {
    targetContainerType,
    containerId: targetContainer?.id,
    containerType: targetContainer?.type,
    index,
    hasAllBlocks: !!allBlocks
  });
  
  // Gestione uniforme per tutti i tipi di container
  if (targetContainerType === 'thenBlocks' || targetContainerType === 'elseBlocks' || 
      targetContainerType === 'children' || targetContainerType === 'blocksMission' || 
      targetContainerType === 'blocksFinish' || targetContainerType === 'blockInit' ||
      targetContainerType === 'blockStart' || targetContainerType === 'blockEvaluate') {
    
    blocks = targetContainer[targetContainerType] || [];
    console.log('🔍 Blocks in container:', blocks.length, blocks.map(b => b.type));
    
    if (index !== undefined && index > 0) {
      // C'è un blocco prima nell'array
      prevBlock = blocks[index - 1];
      console.log('🔍 Case 1: prevBlock from index', index - 1, ':', prevBlock?.type, prevBlock?.id?.slice(0, 8));
    } else if (index === 0) {
      // È il primo blocco del container - controlla il blocco prima del container
      if (allBlocks) {
        prevBlock = findBlockBeforeContainer(allBlocks, targetContainer.id);
        console.log('🔍 Case 2: findBlockBeforeContainer:', prevBlock?.type, prevBlock?.id?.slice(0, 8));
      }
    } else if (index === undefined) {
      if (blocks.length > 0) {
        // Aggiunto alla fine
        prevBlock = blocks[blocks.length - 1];
        console.log('🔍 Case 3: last block:', prevBlock?.type, prevBlock?.id?.slice(0, 8));
      } else {
        // Container vuoto - controlla il blocco prima del container
        if (allBlocks) {
          prevBlock = findBlockBeforeContainer(allBlocks, targetContainer.id);
          console.log('🔍 Case 4: findBlockBeforeContainer (empty):', prevBlock?.type, prevBlock?.id?.slice(0, 8));
        }
      }
    }
  }

  console.log('🔍 Final prevBlock:', prevBlock?.type, prevBlock?.id?.slice(0, 8));
  
  if (!prevBlock) {
    console.log('🔴 FAILED: No prevBlock');
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
        console.log('🔍 THEN: ultimo è MENU, controllo penultimo:', secondToLastThen.type, 'endsWithAsk:', thenEndsWithAsk);
      } else {
        thenEndsWithAsk = blockEndsWithAsk(lastThenBlock);
        console.log('🔍 THEN: ultimo non è MENU:', lastThenBlock.type, 'endsWithAsk:', thenEndsWithAsk);
      }
    }
    
    // Controlla ramo ELSE  
    if (!prevBlock.elseBlocks || prevBlock.elseBlocks.length === 0) {
      elseEndsWithAsk = true; // ELSE vuoto è valido
      console.log('🔍 ELSE: vuoto, considerato valido');
    } else {
      const lastElseBlock = prevBlock.elseBlocks[prevBlock.elseBlocks.length - 1];
      if (lastElseBlock.type === 'MENU' && prevBlock.elseBlocks.length > 1) {
        // Se l'ultimo blocco è MENU, controlla il penultimo
        const secondToLastElse = prevBlock.elseBlocks[prevBlock.elseBlocks.length - 2];
        elseEndsWithAsk = blockEndsWithAsk(secondToLastElse);
        console.log('🔍 ELSE: ultimo è MENU, controllo penultimo:', secondToLastElse.type, 'endsWithAsk:', elseEndsWithAsk);
      } else {
        elseEndsWithAsk = blockEndsWithAsk(lastElseBlock);
        console.log('🔍 ELSE: ultimo non è MENU:', lastElseBlock.type, 'endsWithAsk:', elseEndsWithAsk);
      }
    }
    
    console.log('🔍 IF analysis (drag&drop con logica MENU):', {
      ifId: prevBlock.id?.slice(0, 8),
      thenBlocks: prevBlock.thenBlocks?.length || 0,
      elseBlocks: prevBlock.elseBlocks?.length || 0,
      thenEndsWithAsk,
      elseEndsWithAsk,
      lastThenType: prevBlock.thenBlocks?.[prevBlock.thenBlocks.length - 1]?.type,
      lastElseType: prevBlock.elseBlocks?.[prevBlock.elseBlocks.length - 1]?.type
    });
    
    const canInsert = thenEndsWithAsk && elseEndsWithAsk;
    console.log(canInsert ? '🟢 SUCCESS: IF validation passed' : '🔴 FAILED: IF validation failed');
    return canInsert;
  }
  
  // Per altri blocchi, usa la logica esistente
  const canInsert = canInsertMenuAfterBlock(prevBlock);
  console.log('🔍 canInsertMenuAfterBlock result:', canInsert);
  
  if (!canInsert) {
    console.log('🔴 FAILED: canInsertMenuAfterBlock returned false');
    return false;
  }
  
  console.log('🟢 SUCCESS: MENU insertion valid');
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
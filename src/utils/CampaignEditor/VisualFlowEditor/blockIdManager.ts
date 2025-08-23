/**
 * Utility module per la gestione degli ID univoci dei blocchi
 * Fornisce funzioni per aggiungere ID univoci a tutti i blocchi in modo ricorsivo
 */

/**
 * Genera un ID univoco per un blocco
 * @param blockType - Il tipo del blocco
 * @returns Un ID univoco nel formato: tipo-timestamp-random
 */
export const generateBlockId = (blockType: string): string => {
  return `${blockType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Aggiunge ID univoci a tutti i blocchi in modo ricorsivo
 * @param blocks - Array di blocchi da processare
 * @returns Array di blocchi con ID univoci
 */
export const addUniqueIds = (blocks: any[]): any[] => {
  if (!blocks || blocks.length === 0) return [];
  
  return blocks.map(block => {
    const newBlock = { ...block };
    
    // Aggiungi ID se manca
    if (!newBlock.id) {
      newBlock.id = generateBlockId(block.type || 'BLOCK');
    }
    
    // Ricorsivamente aggiungi ID ai children
    if (newBlock.children) {
      newBlock.children = addUniqueIds(newBlock.children);
    }
    if (newBlock.thenBlocks) {
      newBlock.thenBlocks = addUniqueIds(newBlock.thenBlocks);
    }
    if (newBlock.elseBlocks) {
      newBlock.elseBlocks = addUniqueIds(newBlock.elseBlocks);
    }
    // Aggiungi ID per i blocchi specifici delle missions
    if (newBlock.blocksMission) {
      newBlock.blocksMission = addUniqueIds(newBlock.blocksMission);
    }
    if (newBlock.blocksFinish) {
      newBlock.blocksFinish = addUniqueIds(newBlock.blocksFinish);
    }
    if (newBlock.blockInit) {
      newBlock.blockInit = addUniqueIds(newBlock.blockInit);
    }
    if (newBlock.blockStart) {
      newBlock.blockStart = addUniqueIds(newBlock.blockStart);
    }
    if (newBlock.blockEvaluate) {
      newBlock.blockEvaluate = addUniqueIds(newBlock.blockEvaluate);
    }
    if (newBlock.finishSection) {
      newBlock.finishSection = addUniqueIds(newBlock.finishSection);
    }
    
    return newBlock;
  });
};

/**
 * Verifica se un blocco ha un ID valido
 * @param block - Il blocco da verificare
 * @returns true se il blocco ha un ID valido
 */
export const hasValidId = (block: any): boolean => {
  return block && block.id && typeof block.id === 'string' && block.id.length > 0;
};

/**
 * Verifica ricorsivamente che tutti i blocchi abbiano ID validi
 * @param blocks - Array di blocchi da verificare
 * @returns true se tutti i blocchi hanno ID validi
 */
export const allBlocksHaveIds = (blocks: any[]): boolean => {
  if (!blocks || blocks.length === 0) return true;
  
  return blocks.every(block => {
    if (!hasValidId(block)) return false;
    
    // Verifica ricorsivamente i children
    const childrenValid = !block.children || allBlocksHaveIds(block.children);
    const thenBlocksValid = !block.thenBlocks || allBlocksHaveIds(block.thenBlocks);
    const elseBlocksValid = !block.elseBlocks || allBlocksHaveIds(block.elseBlocks);
    const blocksMissionValid = !block.blocksMission || allBlocksHaveIds(block.blocksMission);
    const blocksFinishValid = !block.blocksFinish || allBlocksHaveIds(block.blocksFinish);
    const blockInitValid = !block.blockInit || allBlocksHaveIds(block.blockInit);
    const blockStartValid = !block.blockStart || allBlocksHaveIds(block.blockStart);
    const blockEvaluateValid = !block.blockEvaluate || allBlocksHaveIds(block.blockEvaluate);
    const finishSectionValid = !block.finishSection || allBlocksHaveIds(block.finishSection);
    
    return childrenValid && thenBlocksValid && elseBlocksValid && 
           blocksMissionValid && blocksFinishValid &&
           blockInitValid && blockStartValid && blockEvaluateValid && finishSectionValid;
  });
};

/**
 * Conta il numero totale di blocchi nell'albero
 * @param blocks - Array di blocchi da contare
 * @returns Il numero totale di blocchi
 */
export const countBlocks = (blocks: any[]): number => {
  if (!blocks || blocks.length === 0) return 0;
  
  return blocks.reduce((count, block) => {
    let total = 1; // Conta il blocco corrente
    
    // Conta ricorsivamente i children
    if (block.children) total += countBlocks(block.children);
    if (block.thenBlocks) total += countBlocks(block.thenBlocks);
    if (block.elseBlocks) total += countBlocks(block.elseBlocks);
    if (block.blocksMission) total += countBlocks(block.blocksMission);
    if (block.blocksFinish) total += countBlocks(block.blocksFinish);
    if (block.blockInit) total += countBlocks(block.blockInit);
    if (block.blockStart) total += countBlocks(block.blockStart);
    if (block.blockEvaluate) total += countBlocks(block.blockEvaluate);
    if (block.finishSection) total += countBlocks(block.finishSection);
    
    return count + total;
  }, 0);
};

/**
 * Trova un blocco per ID nell'albero
 * @param blocks - Array di blocchi dove cercare
 * @param blockId - L'ID del blocco da trovare
 * @returns Il blocco trovato o null
 */
export const findBlockById = (blocks: any[], blockId: string): any | null => {
  if (!blocks || blocks.length === 0) return null;
  
  for (const block of blocks) {
    if (block.id === blockId) return block;
    
    // Cerca ricorsivamente nei children
    const foundInChildren = findBlockById(block.children || [], blockId);
    if (foundInChildren) return foundInChildren;
    
    const foundInThen = findBlockById(block.thenBlocks || [], blockId);
    if (foundInThen) return foundInThen;
    
    const foundInElse = findBlockById(block.elseBlocks || [], blockId);
    if (foundInElse) return foundInElse;
    
    const foundInBlocksMission = findBlockById(block.blocksMission || [], blockId);
    if (foundInBlocksMission) return foundInBlocksMission;
    
    const foundInBlocksFinish = findBlockById(block.blocksFinish || [], blockId);
    if (foundInBlocksFinish) return foundInBlocksFinish;
    
    const foundInInit = findBlockById(block.blockInit || [], blockId);
    if (foundInInit) return foundInInit;
    
    const foundInStart = findBlockById(block.blockStart || [], blockId);
    if (foundInStart) return foundInStart;
    
    const foundInEvaluate = findBlockById(block.blockEvaluate || [], blockId);
    if (foundInEvaluate) return foundInEvaluate;
    
    const foundInFinish = findBlockById(block.finishSection || [], blockId);
    if (foundInFinish) return foundInFinish;
  }
  
  return null;
};
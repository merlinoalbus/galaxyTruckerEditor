/**
 * Block Validators Module
 * Validatori specifici per verificare condizioni sui blocchi
 */

import { getLastBlock } from '../search';

/**
 * Verifica ricorsivamente se un blocco termina con ASK in tutti i percorsi
 * Utilizzato per validare i requisiti dei blocchi MENU
 * 
 * @param block - Il blocco da verificare
 * @returns true se tutti i percorsi terminano con ASK, false altrimenti
 */
export const blockEndsWithAsk = (block: any): boolean => {
  if (!block) return false;
  
  // Caso base: il blocco è ASK
  if (block.type === 'ASK' || block.type === 'ASKCHAR') {
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
};
/**
 * GO Block Validation Module
 * Funzioni per validare l'inserimento di blocchi GO
 */

/**
 * Cerca ricorsivamente se esiste almeno un blocco LABEL nello script
 */
export const hasLabelInScript = (blocks: any[]): boolean => {
  for (const block of blocks) {
    if (block.type === 'LABEL') {
      return true;
    }
    
    // Cerca nei figli
    if (block.children && hasLabelInScript(block.children)) {
      return true;
    }
    
    // Cerca nei rami IF
    if (block.type === 'IF') {
      if (block.thenBlocks && hasLabelInScript(block.thenBlocks)) {
        return true;
      }
      if (block.elseBlocks && hasLabelInScript(block.elseBlocks)) {
        return true;
      }
    }
    
    // Cerca nei blocchi MISSION
    if (block.type === 'MISSION') {
      if (block.blocksMission && hasLabelInScript(block.blocksMission)) {
        return true;
      }
      if (block.blocksFinish && hasLabelInScript(block.blocksFinish)) {
        return true;
      }
    }
    
    // Cerca nei blocchi BUILD
    if (block.type === 'BUILD') {
      if (block.blockInit && hasLabelInScript(block.blockInit)) {
        return true;
      }
      if (block.blockStart && hasLabelInScript(block.blockStart)) {
        return true;
      }
    }
    
    // Cerca nei blocchi FLIGHT
    if (block.type === 'FLIGHT') {
      if (block.blockInit && hasLabelInScript(block.blockInit)) {
        return true;
      }
      if (block.blockStart && hasLabelInScript(block.blockStart)) {
        return true;
      }
      if (block.blockEvaluate && hasLabelInScript(block.blockEvaluate)) {
        return true;
      }
    }
    
    // Cerca nei blocchi OPT dentro MENU
    if (block.type === 'OPT' && block.children && hasLabelInScript(block.children)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Valida se un blocco GO può essere inserito
 * GO richiede che esista almeno un blocco LABEL nello script
 */
export const validateGoInsertion = (allBlocks: any[]): boolean => {
  // Trova il blocco principale SCRIPT o MISSION
  const scriptBlock = allBlocks.find(b => b.type === 'SCRIPT');
  const missionBlock = allBlocks.find(b => b.type === 'MISSION');
  
  if (scriptBlock) {
    return hasLabelInScript([scriptBlock]);
  } else if (missionBlock) {
    return hasLabelInScript([missionBlock]);
  } else {
    // Cerca in tutti i blocchi
    return hasLabelInScript(allBlocks);
  }
};
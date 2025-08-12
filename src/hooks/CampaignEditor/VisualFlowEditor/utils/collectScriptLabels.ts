/**
 * Utility per raccogliere tutte le LABEL presenti fisicamente nello script
 */

/**
 * Raccoglie ricorsivamente tutti i nomi delle LABEL presenti nei blocchi
 */
export const collectScriptLabels = (blocks: any[]): string[] => {
  const labels: string[] = [];
  
  const collectRecursive = (blockList: any[]) => {
    for (const block of blockList) {
      // Se è un blocco LABEL, aggiungi il suo nome
      if (block.type === 'LABEL' && block.parameters?.name) {
        if (!labels.includes(block.parameters.name)) {
          labels.push(block.parameters.name);
        }
      }
      
      // Cerca nei figli
      if (block.children) {
        collectRecursive(block.children);
      }
      
      // Cerca nei rami IF
      if (block.type === 'IF') {
        if (block.thenBlocks) {
          collectRecursive(block.thenBlocks);
        }
        if (block.elseBlocks) {
          collectRecursive(block.elseBlocks);
        }
      }
      
      // Cerca nei blocchi MISSION
      if (block.type === 'MISSION') {
        if (block.blocksMission) {
          collectRecursive(block.blocksMission);
        }
        if (block.blocksFinish) {
          collectRecursive(block.blocksFinish);
        }
      }
      
      // Cerca nei blocchi BUILD
      if (block.type === 'BUILD') {
        if (block.blockInit) {
          collectRecursive(block.blockInit);
        }
        if (block.blockStart) {
          collectRecursive(block.blockStart);
        }
      }
      
      // Cerca nei blocchi FLIGHT
      if (block.type === 'FLIGHT') {
        if (block.blockInit) {
          collectRecursive(block.blockInit);
        }
        if (block.blockStart) {
          collectRecursive(block.blockStart);
        }
        if (block.blockEvaluate) {
          collectRecursive(block.blockEvaluate);
        }
      }
      
      // Cerca nei blocchi OPT dentro MENU
      if (block.type === 'OPT' && block.children) {
        collectRecursive(block.children);
      }
    }
  };
  
  collectRecursive(blocks);
  return labels.sort(); // Ritorna le label ordinate alfabeticamente
};
/**
 * Block Search Module
 * Funzioni per la ricerca e navigazione nell'albero dei blocchi
 */

/**
 * Trova un container specifico nell'albero dei blocchi tramite il suo ID
 * Questa funzione unifica le 4 copie duplicate precedentemente presenti nel file monolitico
 * 
 * @param blocks - Array di blocchi da cercare
 * @param id - ID del container da trovare
 * @returns Il blocco container trovato o null se non trovato
 */
export const findContainer = (blocks: any[], id: string): any => {
  for (const block of blocks) {
    // Controlla se il blocco corrente è quello cercato
    if (block.id === id) return block;
    
    // Cerca ricorsivamente nei children generici
    if (block.children) {
      const found = findContainer(block.children, id);
      if (found) return found;
    }
    
    // Cerca nei rami IF (then/else)
    if (block.type === 'IF') {
      if (block.thenBlocks) {
        const found = findContainer(block.thenBlocks, id);
        if (found) return found;
      }
      if (block.elseBlocks) {
        const found = findContainer(block.elseBlocks, id);
        if (found) return found;
      }
    }
    
    // Cerca nei blocchi MISSION (blocksMission/blocksFinish)
    if (block.type === 'MISSION') {
      if (block.blocksMission) {
        const found = findContainer(block.blocksMission, id);
        if (found) return found;
      }
      if (block.blocksFinish) {
        const found = findContainer(block.blocksFinish, id);
        if (found) return found;
      }
    }
    
    // Cerca nei blocchi BUILD (blockInit/blockStart)
    if (block.type === 'BUILD') {
      if (block.blockInit) {
        const found = findContainer(block.blockInit, id);
        if (found) return found;
      }
      if (block.blockStart) {
        const found = findContainer(block.blockStart, id);
        if (found) return found;
      }
    }
    
    // Cerca nei blocchi FLIGHT (blockInit/blockStart/blockEvaluate)
    if (block.type === 'FLIGHT') {
      if (block.blockInit) {
        const found = findContainer(block.blockInit, id);
        if (found) return found;
      }
      if (block.blockStart) {
        const found = findContainer(block.blockStart, id);
        if (found) return found;
      }
      if (block.blockEvaluate) {
        const found = findContainer(block.blockEvaluate, id);
        if (found) return found;
      }
    }
  }
  
  return null;
};

/**
 * Trova il blocco che precede un container IF nel suo parent
 * Utilizzato per validazioni MENU che dipendono dal blocco precedente
 * NOTA: Estratta da useBlockManipulation.ts righe 70-142, senza useCallback perché non è più in un hook
 * 
 * @param allBlocks - Array di tutti i blocchi root
 * @param containerId - ID del container di cui trovare il predecessore
 * @returns Il blocco precedente o null se non trovato
 */
export const findBlockBeforeContainer = (allBlocks: any[], containerId: string): any | null => {
  const searchInBlocks = (blocks: any[]): any | null => {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Se troviamo il container, ritorna il blocco precedente
      if (block.id === containerId && i > 0) {
        return blocks[i - 1];
      }
      
      // Cerca ricorsivamente nei children
      if (block.children) {
        const found = searchInBlocks(block.children);
        if (found) return found;
      }
      
      // Cerca nei rami IF
      if (block.type === 'IF') {
        if (block.thenBlocks) {
          const found = searchInBlocks(block.thenBlocks);
          if (found) return found;
        }
        if (block.elseBlocks) {
          const found = searchInBlocks(block.elseBlocks);
          if (found) return found;
        }
      }
      
      // Cerca nei container MISSION
      if (block.type === 'MISSION') {
        if (block.blocksMission) {
          const found = searchInBlocks(block.blocksMission);
          if (found) return found;
        }
        if (block.blocksFinish) {
          const found = searchInBlocks(block.blocksFinish);
          if (found) return found;
        }
      }
      
      // Cerca nei container BUILD
      if (block.type === 'BUILD') {
        if (block.blockInit) {
          const found = searchInBlocks(block.blockInit);
          if (found) return found;
        }
        if (block.blockStart) {
          const found = searchInBlocks(block.blockStart);
          if (found) return found;
        }
      }
      
      // Cerca nei container FLIGHT
      if (block.type === 'FLIGHT') {
        if (block.blockInit) {
          const found = searchInBlocks(block.blockInit);
          if (found) return found;
        }
        if (block.blockStart) {
          const found = searchInBlocks(block.blockStart);
          if (found) return found;
        }
        if (block.blockEvaluate) {
          const found = searchInBlocks(block.blockEvaluate);
          if (found) return found;
        }
      }
    }
    return null;
  };
  
  return searchInBlocks(allBlocks);
};
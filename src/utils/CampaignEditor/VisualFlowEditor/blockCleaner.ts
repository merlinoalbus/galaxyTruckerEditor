/**
 * Utility module per la pulizia e normalizzazione dei blocchi
 * Fornisce funzioni per rimuovere duplicazioni e normalizzare la struttura dei blocchi
 */

/**
 * Rimuove blocchi SCRIPT annidati duplicati
 * Se trova un blocco SCRIPT anonimo (senza scriptName), estrae i suoi children
 * @param blocks - Array di blocchi da pulire
 * @returns Array di blocchi puliti
 */
export const cleanupScriptBlocks = (blocks: any[]): any[] => {
  if (!blocks || blocks.length === 0) return [];
  
  const cleanedBlocks: any[] = [];
  
  for (const block of blocks) {
    // Se troviamo un blocco SCRIPT anonimo (senza scriptName), estrai i suoi children
    if (block.type === 'SCRIPT' && !block.scriptName) {
      console.log('Trovato blocco SCRIPT anonimo, estraggo i children:', block);
      if (block.children && block.children.length > 0) {
        // Ricorsivamente pulisci i children e aggiungili direttamente
        cleanedBlocks.push(...cleanupScriptBlocks(block.children));
      }
    } else {
      // Per altri blocchi, pulisci ricorsivamente i loro children
      const cleanedBlock = { ...block };
      if (cleanedBlock.children) {
        cleanedBlock.children = cleanupScriptBlocks(cleanedBlock.children);
      }
      if (cleanedBlock.thenBlocks) {
        cleanedBlock.thenBlocks = cleanupScriptBlocks(cleanedBlock.thenBlocks);
      }
      // IMPORTANTE: Mantieni elseBlocks anche se è un array vuoto (non undefined)
      // per preservare lo stato del checkbox "Includi ramo ELSE"
      if (cleanedBlock.elseBlocks !== undefined) {
        cleanedBlock.elseBlocks = cleanupScriptBlocks(cleanedBlock.elseBlocks);
      }
      cleanedBlocks.push(cleanedBlock);
    }
  }
  
  return cleanedBlocks;
};

/**
 * Rimuove blocchi vuoti ricorsivamente
 * @param blocks - Array di blocchi da pulire
 * @returns Array di blocchi senza elementi vuoti
 */
export const removeEmptyBlocks = (blocks: any[]): any[] => {
  if (!blocks || blocks.length === 0) return [];
  
  return blocks.filter(block => {
    // Mantieni sempre blocchi con contenuto
    if (block.type === 'SAY' || block.type === 'DELAY' || block.type === 'GO' || block.type === 'LABEL') {
      return true;
    }
    
    // Per container, verifica che abbiano contenuto
    if (block.type === 'SCRIPT' || block.type === 'MENU' || block.type === 'OPT') {
      const hasChildren = block.children && block.children.length > 0;
      if (hasChildren) {
        block.children = removeEmptyBlocks(block.children);
        return block.children.length > 0;
      }
      return false;
    }
    
    // Per IF blocks, mantieni se hanno contenuto in THEN o ELSE
    if (block.type === 'IF') {
      const hasThen = block.thenBlocks && block.thenBlocks.length > 0;
      const hasElse = block.elseBlocks && block.elseBlocks.length > 0;
      
      if (hasThen) {
        block.thenBlocks = removeEmptyBlocks(block.thenBlocks);
      }
      if (hasElse) {
        block.elseBlocks = removeEmptyBlocks(block.elseBlocks);
      }
      
      return (block.thenBlocks && block.thenBlocks.length > 0) || 
             (block.elseBlocks && block.elseBlocks.length > 0);
    }
    
    return true;
  });
};

/**
 * Normalizza la struttura dei blocchi
 * Assicura che tutti i container abbiano gli array necessari
 * @param blocks - Array di blocchi da normalizzare
 * @returns Array di blocchi normalizzati
 */
export const normalizeBlockStructure = (blocks: any[]): any[] => {
  if (!blocks || blocks.length === 0) return [];
  
  return blocks.map(block => {
    const normalizedBlock = { ...block };
    
    // Assicura che i container abbiano l'array children
    if ((block.type === 'SCRIPT' || block.type === 'MENU' || block.type === 'OPT') && !block.children) {
      normalizedBlock.children = [];
    }
    
    // Assicura che gli IF blocks abbiano thenBlocks
    if (block.type === 'IF' && !block.thenBlocks) {
      normalizedBlock.thenBlocks = [];
    }
    
    // NON aggiungiamo elseBlocks di default per preservare lo stato del checkbox
    
    // Ricorsivamente normalizza i children
    if (normalizedBlock.children) {
      normalizedBlock.children = normalizeBlockStructure(normalizedBlock.children);
    }
    if (normalizedBlock.thenBlocks) {
      normalizedBlock.thenBlocks = normalizeBlockStructure(normalizedBlock.thenBlocks);
    }
    if (normalizedBlock.elseBlocks) {
      normalizedBlock.elseBlocks = normalizeBlockStructure(normalizedBlock.elseBlocks);
    }
    
    return normalizedBlock;
  });
};

/**
 * Valida la struttura di un blocco SCRIPT
 * @param scriptBlock - Il blocco SCRIPT da validare
 * @returns true se il blocco è valido
 */
export const isValidScriptBlock = (scriptBlock: any): boolean => {
  if (!scriptBlock || scriptBlock.type !== 'SCRIPT') return false;
  if (!scriptBlock.scriptName || !scriptBlock.fileName) return false;
  if (!scriptBlock.id) return false;
  
  return true;
};

/**
 * Conta il numero di blocchi per tipo
 * @param blocks - Array di blocchi da contare
 * @returns Oggetto con il conteggio per tipo
 */
export const countBlocksByType = (blocks: any[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  
  if (!blocks || blocks.length === 0) return counts;
  
  const countRecursive = (blockList: any[]) => {
    for (const block of blockList) {
      const type = block.type || 'UNKNOWN';
      counts[type] = (counts[type] || 0) + 1;
      
      if (block.children) countRecursive(block.children);
      if (block.thenBlocks) countRecursive(block.thenBlocks);
      if (block.elseBlocks) countRecursive(block.elseBlocks);
    }
  };
  
  countRecursive(blocks);
  return counts;
};
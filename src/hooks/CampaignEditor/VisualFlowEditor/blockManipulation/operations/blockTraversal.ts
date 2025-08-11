/**
 * Block Traversal Module
 * Funzioni comuni per attraversare ricorsivamente l'albero dei blocchi
 * Utilizzate dalle operations per evitare duplicazione di codice
 */

/**
 * Callback function type per le operazioni di attraversamento
 * @param blocks - Array di blocchi da processare
 * @param args - Argomenti aggiuntivi specifici per l'operazione
 */
type TraversalCallback<T extends any[]> = (blocks: any[], ...args: T) => any[];

/**
 * Interface per il risultato di attraversamento con change tracking
 */
interface TraversalResult {
  result: any[];
  hasChanges: boolean;
}

/**
 * Attraversa ricorsivamente tutti i container di un blocco applicando una callback
 * Gestisce tutti i tipi di container: children, IF (thenBlocks/elseBlocks), 
 * MISSION (blocksMission/blocksFinish), BUILD/FLIGHT (blockInit/blockStart/blockEvaluate)
 * 
 * @param block - Blocco da attraversare
 * @param callback - Funzione da applicare a ciascun array di blocchi
 * @param args - Argomenti da passare alla callback
 * @param withChangeTracking - Se true, traccia i cambiamenti per ottimizzazione
 * @returns Blocco aggiornato con i risultati della callback
 */
export const traverseBlockContainers = <T extends any[]>(
  block: any,
  callback: TraversalCallback<T>,
  args: T,
  withChangeTracking: boolean = false
): any => {
  let updated = { ...block };
  let hasChanges = false;

  // Attraversa container normali (children)
  if (block.children) {
    const newChildren = callback(block.children, ...args);
    if (withChangeTracking && newChildren !== block.children) {
      updated.children = newChildren;
      hasChanges = true;
    } else if (!withChangeTracking) {
      updated.children = newChildren;
    }
  }

  // Attraversa blocchi IF
  if (block.type === 'IF') {
    if (block.thenBlocks) {
      const newThenBlocks = callback(block.thenBlocks, ...args);
      if (withChangeTracking && newThenBlocks !== block.thenBlocks) {
        updated.thenBlocks = newThenBlocks;
        updated.numThen = newThenBlocks.length;
        hasChanges = true;
      } else if (!withChangeTracking) {
        updated.thenBlocks = newThenBlocks;
        updated.numThen = newThenBlocks.length;
      }
    }
    if (block.elseBlocks) {
      const newElseBlocks = callback(block.elseBlocks, ...args);
      if (withChangeTracking && newElseBlocks !== block.elseBlocks) {
        updated.elseBlocks = newElseBlocks;
        updated.numElse = newElseBlocks.length;
        hasChanges = true;
      } else if (!withChangeTracking) {
        updated.elseBlocks = newElseBlocks;
        updated.numElse = newElseBlocks.length;
      }
    }
  }

  // Attraversa blocchi MISSION
  if (block.type === 'MISSION') {
    if (block.blocksMission) {
      const newBlocksMission = callback(block.blocksMission, ...args);
      if (withChangeTracking && newBlocksMission !== block.blocksMission) {
        updated.blocksMission = newBlocksMission;
        hasChanges = true;
      } else if (!withChangeTracking) {
        updated.blocksMission = newBlocksMission;
      }
    }
    if (block.blocksFinish) {
      const newBlocksFinish = callback(block.blocksFinish, ...args);
      if (withChangeTracking && newBlocksFinish !== block.blocksFinish) {
        updated.blocksFinish = newBlocksFinish;
        hasChanges = true;
      } else if (!withChangeTracking) {
        updated.blocksFinish = newBlocksFinish;
      }
    }
  }

  // Attraversa blocchi BUILD
  if (block.type === 'BUILD') {
    if (block.blockInit) {
      const newBlockInit = callback(block.blockInit, ...args);
      if (withChangeTracking && newBlockInit !== block.blockInit) {
        updated.blockInit = newBlockInit;
        updated.numBlockInit = newBlockInit.length;
        hasChanges = true;
      } else if (!withChangeTracking) {
        updated.blockInit = newBlockInit;
        updated.numBlockInit = newBlockInit.length;
      }
    }
    if (block.blockStart) {
      const newBlockStart = callback(block.blockStart, ...args);
      if (withChangeTracking && newBlockStart !== block.blockStart) {
        updated.blockStart = newBlockStart;
        updated.numBlockStart = newBlockStart.length;
        hasChanges = true;
      } else if (!withChangeTracking) {
        updated.blockStart = newBlockStart;
        updated.numBlockStart = newBlockStart.length;
      }
    }
  }

  // Attraversa blocchi FLIGHT
  if (block.type === 'FLIGHT') {
    if (block.blockInit) {
      const newBlockInit = callback(block.blockInit, ...args);
      if (withChangeTracking && newBlockInit !== block.blockInit) {
        updated.blockInit = newBlockInit;
        updated.numBlockInit = newBlockInit.length;
        hasChanges = true;
      } else if (!withChangeTracking) {
        updated.blockInit = newBlockInit;
        updated.numBlockInit = newBlockInit.length;
      }
    }
    if (block.blockStart) {
      const newBlockStart = callback(block.blockStart, ...args);
      if (withChangeTracking && newBlockStart !== block.blockStart) {
        updated.blockStart = newBlockStart;
        updated.numBlockStart = newBlockStart.length;
        hasChanges = true;
      } else if (!withChangeTracking) {
        updated.blockStart = newBlockStart;
        updated.numBlockStart = newBlockStart.length;
      }
    }
    if (block.blockEvaluate) {
      const newBlockEvaluate = callback(block.blockEvaluate, ...args);
      if (withChangeTracking && newBlockEvaluate !== block.blockEvaluate) {
        updated.blockEvaluate = newBlockEvaluate;
        updated.numBlockEvaluate = newBlockEvaluate.length;
        hasChanges = true;
      } else if (!withChangeTracking) {
        updated.blockEvaluate = newBlockEvaluate;
        updated.numBlockEvaluate = newBlockEvaluate.length;
      }
    }
  }

  return withChangeTracking ? { updated: hasChanges ? updated : block, hasChanges } : updated;
};

/**
 * Helper function per operazioni che non necessitano change tracking
 * Versione semplificata di traverseBlockContainers
 */
export const traverseBlockContainersSimple = <T extends any[]>(
  block: any,
  callback: TraversalCallback<T>,
  args: T
): any => {
  return traverseBlockContainers(block, callback, args, false);
};

/**
 * Helper function per operazioni che necessitano change tracking (per ottimizzazioni)
 * Utilizzata da removeOperations e updateOperations per evitare clonazioni inutili
 */
export const traverseBlockContainersWithTracking = <T extends any[]>(
  block: any,
  callback: TraversalCallback<T>,
  args: T
): TraversalResult => {
  const result = traverseBlockContainers(block, callback, args, true);
  return {
    result: result.updated,
    hasChanges: result.hasChanges
  };
};
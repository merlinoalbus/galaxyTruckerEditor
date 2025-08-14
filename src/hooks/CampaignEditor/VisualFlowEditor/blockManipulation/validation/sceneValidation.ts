/**
 * Scene Validation Module
 * Validatori per i blocchi che richiedono scene di dialogo attive
 */

import type { IFlowBlock } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

/**
 * Verifica se un blocco può essere eseguito solo all'interno di una scena di dialogo
 * @param blockType - Il tipo di blocco da verificare
 * @returns true se il blocco richiede una scena di dialogo attiva
 */
export const requiresDialogScene = (blockType: string): boolean => {
  const dialogCommands = [
    'SAY',
    'ASK', 
    'SHOWCHAR', 
    'HIDECHAR', 
    'CHANGECHAR', 
    'SAYCHAR', 
    'ASKCHAR', 
    'FOCUSCHAR'
  ];
  
  return dialogCommands.includes(blockType);
};

/**
 * Verifica se il blocco HIDEDLGSCENE può essere utilizzato
 * @param blockType - Il tipo di blocco
 * @returns true se è HIDEDLGSCENE
 */
export const isHideDialogScene = (blockType: string): boolean => {
  return blockType === 'HIDEDLGSCENE';
};

/**
 * Conta le scene di dialogo attualmente aperte analizzando lo script dall'inizio fino al blocco corrente
 * @param allBlocks - Tutti i blocchi dello script
 * @param currentBlockIndex - Indice del blocco corrente
 * @returns Il numero di scene attualmente aperte
 */
export const countOpenDialogScenes = (allBlocks: IFlowBlock[], currentBlockIndex: number): number => {
  let openScenes = 0;
  
  for (let i = 0; i < currentBlockIndex; i++) {
    const block = allBlocks[i];
    if (block.type === 'SHOWDLGSCENE') {
      openScenes++;
    } else if (block.type === 'HIDEDLGSCENE') {
      openScenes = Math.max(0, openScenes - 1);
    }
  }
  
  return openScenes;
};

/**
 * Analizza ricorsivamente tutti i blocchi per contare le scene di dialogo
 * CORRETTO: Gestisce correttamente BUILD/FLIGHT con blockInit/blockStart/blockEvaluate
 * @param blocks - Array di blocchi da analizzare
 * @param targetBlock - Il blocco target per cui stiamo verificando
 * @param currentOpenScenes - Numero corrente di scene aperte
 * @returns { openScenes: number, found: boolean }
 */
const analyzeBlocksRecursively = (
  blocks: IFlowBlock[], 
  targetBlock: IFlowBlock,
  currentOpenScenes: number = 0
): { openScenes: number, found: boolean } => {
  
  for (const block of blocks) {
    
    // Se troviamo il blocco target, restituiamo il conteggio corrente
    if (block.id === targetBlock.id) {
      return { openScenes: currentOpenScenes, found: true };
    }
    
    // Aggiorna il conteggio per questo blocco (solo se non è il target)
    let sceneCount = currentOpenScenes;
    if (block.type === 'SHOWDLGSCENE') {
      sceneCount++;
    } else if (block.type === 'HIDEDLGSCENE') {
      sceneCount = Math.max(0, sceneCount - 1);
    }
    
    // IMPORTANTE: Aggiorna currentOpenScenes per la prossima iterazione
    currentOpenScenes = sceneCount;
    
    // CORREZIONE CRITICA: Verifica ricorsivamente nei contenitori con struttura corretta
    if (block.type === 'IF') {
      // Verifica nel ramo then
      if (block.thenBlocks) {
        const thenResult = analyzeBlocksRecursively(block.thenBlocks, targetBlock, sceneCount);
        if (thenResult.found) {
          return thenResult;
        }
      }
      
      // Verifica nel ramo else
      if (block.elseBlocks) {
        const elseResult = analyzeBlocksRecursively(block.elseBlocks, targetBlock, sceneCount);
        if (elseResult.found) {
          return elseResult;
        }
      }
    } else if (block.type === 'MENU' && block.children) {
      // Verifica nelle opzioni del menu
      const menuResult = analyzeBlocksRecursively(block.children, targetBlock, sceneCount);
      if (menuResult.found) {
        return menuResult;
      }
    } else if (block.type === 'OPT' && block.children) {
      // Verifica nei figli dell'opzione
      const optResult = analyzeBlocksRecursively(block.children, targetBlock, sceneCount);
      if (optResult.found) {
        return optResult;
      }
    } else if (block.type === 'BUILD') {
      // CORREZIONE: BUILD usa blockInit e blockStart, non children
      if (block.blockInit) {
        const initResult = analyzeBlocksRecursively(block.blockInit, targetBlock, sceneCount);
        if (initResult.found) {
          return initResult;
        }
      }
      if (block.blockStart) {
        const startResult = analyzeBlocksRecursively(block.blockStart, targetBlock, sceneCount);
        if (startResult.found) {
          return startResult;
        }
      }
    } else if (block.type === 'FLIGHT') {
      // CORREZIONE: FLIGHT usa blockInit, blockStart e blockEvaluate, non children
      if (block.blockInit) {
        const initResult = analyzeBlocksRecursively(block.blockInit, targetBlock, sceneCount);
        if (initResult.found) {
          return initResult;
        }
      }
      if (block.blockStart) {
        const startResult = analyzeBlocksRecursively(block.blockStart, targetBlock, sceneCount);
        if (startResult.found) {
          return startResult;
        }
      }
      if (block.blockEvaluate) {
        const evalResult = analyzeBlocksRecursively(block.blockEvaluate, targetBlock, sceneCount);
        if (evalResult.found) {
          return evalResult;
        }
      }
    } else if (block.type === 'MISSION') {
      // CORREZIONE: MISSION usa blocksMission e blocksFinish
      if (block.blocksMission) {
        const missionResult = analyzeBlocksRecursively(block.blocksMission, targetBlock, sceneCount);
        if (missionResult.found) {
          return missionResult;
        }
      }
      if (block.blocksFinish) {
        const finishResult = analyzeBlocksRecursively(block.blocksFinish, targetBlock, sceneCount);
        if (finishResult.found) {
          return finishResult;
        }
      }
    } else if (block.children) {
      // Per altri tipi di blocchi con children generici
      const childResult = analyzeBlocksRecursively(block.children, targetBlock, sceneCount);
      if (childResult.found) {
        return childResult;
      }
    }
  }
  
  return { openScenes: currentOpenScenes, found: false };
};

/**
 * Verifica se un blocco è valido nel contesto delle scene di dialogo
 * @param block - Il blocco da validare
 * @param allBlocks - Tutti i blocchi dello script (lista flat)
 * @returns true se il blocco è valido nel contesto corrente
 */
export const isValidInDialogContext = (block: IFlowBlock, allBlocks: IFlowBlock[]): boolean => {
  
  // Analizza ricorsivamente per trovare il conteggio delle scene aperte
  const result = analyzeBlocksRecursively(allBlocks, block);
  const openScenes = result.found ? result.openScenes : 0;
  
  // I comandi che richiedono scene di dialogo sono validi solo se c'è almeno una scena aperta
  if (requiresDialogScene(block.type)) {
    const isValid = openScenes > 0;
    return isValid;
  }
  
  // HIDEDLGSCENE è valido solo se c'è almeno una scena aperta
  if (isHideDialogScene(block.type)) {
    const isValid = openScenes > 0;
    return isValid;
  }
  
  // Altri comandi sono sempre validi
  return true;
};

/**
 * Ottiene un messaggio di errore per un blocco non valido nel contesto delle scene
 * @param block - Il blocco non valido
 * @returns Il messaggio di errore appropriato
 */
export const getSceneValidationError = (block: IFlowBlock): string => {
  if (requiresDialogScene(block.type)) {
    return `Il comando ${block.type} può essere utilizzato solo all'interno di una scena di dialogo (dopo SHOWDLGSCENE)`;
  }
  
  if (isHideDialogScene(block.type)) {
    return `Il comando HIDEDLGSCENE può essere utilizzato solo quando c'è una scena di dialogo attiva`;
  }
  
  return 'Errore di validazione sconosciuto';
};
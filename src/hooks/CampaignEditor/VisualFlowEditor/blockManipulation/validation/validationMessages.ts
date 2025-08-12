/**
 * Validation Messages Module
 * Genera messaggi di errore specifici per validazioni di drag&drop fallite
 */

import { findContainer } from '../search';
import { validateBlockInsertion } from './validateOperations';

/**
 * Genera un messaggio di errore specifico per drop non validi
 * Analizza il tipo di errore e fornisce un messaggio utile all'utente
 * 
 * @param blockType - Tipo di blocco che si sta tentando di inserire
 * @param containerId - ID del container di destinazione
 * @param containerType - Tipo di container (children, thenBlocks, etc.)
 * @param blocks - Array di tutti i blocchi per context
 * @param index - Indice di inserimento (opzionale)
 * @returns Messaggio di errore specifico o null se l'operazione è valida
 */
export const getDropErrorMessage = (
  blockType: string,
  containerId: string,
  containerType: string,
  blocks: any[],
  index?: number,
  t?: (key: any) => string
): string | null => {
  // Trova il container target usando la funzione importata
  const targetContainer = findContainer(blocks, containerId);
  if (!targetContainer) return null;

  // Controlla ASK consecutivi usando la funzione di validazione generale
  if (blockType === 'ASK') {
    if (!validateBlockInsertion(blockType, targetContainer, containerType, index, blocks)) {
      return t ? t('visualFlowEditor.validation.consecutiveAskError') : '🚫 Two consecutive ASK blocks are not allowed. Insert another type of block between the two ASK blocks.';
    }
  }
  
  // Controlla BUILD/FLIGHT dentro BUILD
  if ((blockType === 'BUILD' || blockType === 'FLIGHT') && targetContainer.type === 'BUILD') {
    return t ? t('visualFlowEditor.validation.blockInBuildError').replace('{blockType}', blockType) : `🚫 The ${blockType} block cannot be inserted inside a BUILD block. BUILD and FLIGHT blocks cannot be nested.`;
  }
  
  // Controlla BUILD/FLIGHT dentro FLIGHT
  if ((blockType === 'BUILD' || blockType === 'FLIGHT') && targetContainer.type === 'FLIGHT') {
    return t ? t('visualFlowEditor.validation.blockInFlightError').replace('{blockType}', blockType) : `🚫 The ${blockType} block cannot be inserted inside a FLIGHT block. BUILD and FLIGHT blocks cannot be nested.`;
  }
  
  // Controlla MENU senza ASK precedente
  if (blockType === 'MENU') {
    // Per MENU, usa la logica esistente di validateBlockInsertion
    if (!validateBlockInsertion(blockType, targetContainer, containerType, index, blocks)) {
      return t ? t('visualFlowEditor.validation.menuWithoutAskError') : '🚫 The MENU block must be preceded by an ASK block to function properly.';
    }
  }
  
  // Controlla OPT fuori da MENU
  if (blockType === 'OPT' && targetContainer.type !== 'MENU') {
    return t ? t('visualFlowEditor.validation.optOutsideMenuError') : '🚫 The OPT block can only be inserted inside a MENU block.';
  }
  
  // Controlla EXIT_MENU fuori da OPT
  if (blockType === 'EXIT_MENU' && targetContainer.type !== 'OPT') {
    return t ? t('visualFlowEditor.validation.exitMenuOutsideOptError') : '🚫 The EXIT_MENU block can only be inserted inside an OPT block.';
  }
  
  // Controlla blocchi non-OPT dentro MENU
  if (targetContainer.type === 'MENU' && blockType !== 'OPT') {
    return t ? t('visualFlowEditor.validation.onlyOptInMenuError').replace('{blockType}', blockType) : `🚫 Only OPT blocks can be inserted in a MENU. The ${blockType} block is not allowed.`;
  }
  
  return null;
};
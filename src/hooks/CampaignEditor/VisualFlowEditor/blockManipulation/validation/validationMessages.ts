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
      return t ? t('visualFlowEditor.validation.consecutiveAskError') : '🚫 Due blocchi ASK consecutivi non sono permessi. Inserisci un altro tipo di blocco tra i due ASK.';
    }
  }
  
  // Controlla BUILD/FLIGHT dentro BUILD
  if ((blockType === 'BUILD' || blockType === 'FLIGHT') && targetContainer.type === 'BUILD') {
    return t ? t('visualFlowEditor.validation.blockInBuildError').replace('{blockType}', blockType) : `🚫 Il blocco ${blockType} non può essere inserito dentro un blocco BUILD. I blocchi BUILD e FLIGHT non possono essere annidati.`;
  }
  
  // Controlla BUILD/FLIGHT dentro FLIGHT
  if ((blockType === 'BUILD' || blockType === 'FLIGHT') && targetContainer.type === 'FLIGHT') {
    return t ? t('visualFlowEditor.validation.blockInFlightError').replace('{blockType}', blockType) : `🚫 Il blocco ${blockType} non può essere inserito dentro un blocco FLIGHT. I blocchi BUILD e FLIGHT non possono essere annidati.`;
  }
  
  // Controlla MENU senza ASK precedente
  if (blockType === 'MENU') {
    // Per MENU, usa la logica esistente di validateBlockInsertion
    if (!validateBlockInsertion(blockType, targetContainer, containerType, index, blocks)) {
      return t ? t('visualFlowEditor.validation.menuWithoutAskError') : '🚫 Il blocco MENU deve essere preceduto da un blocco ASK per funzionare correttamente.';
    }
  }
  
  // Controlla OPT fuori da MENU
  if (blockType === 'OPT' && targetContainer.type !== 'MENU') {
    return t ? t('visualFlowEditor.validation.optOutsideMenuError') : '🚫 Il blocco OPT può essere inserito solo all\'interno di un blocco MENU.';
  }
  
  // Controlla blocchi non-OPT dentro MENU
  if (targetContainer.type === 'MENU' && blockType !== 'OPT') {
    return t ? t('visualFlowEditor.validation.onlyOptInMenuError').replace('{blockType}', blockType) : `🚫 Solo blocchi OPT possono essere inseriti in un MENU. Il blocco ${blockType} non è permesso.`;
  }
  
  return null;
};
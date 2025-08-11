/**
 * Drop Validation Module
 * Funzioni per validare operazioni di drop durante il drag&drop
 * Utilizzate per fornire feedback visivo in tempo reale
 */

import { findContainer } from '../search';
import { validateBlockInsertion } from './validateOperations';

/**
 * Verifica se un drop di un blocco è valido SENZA effettuarlo
 * Usata per il feedback visivo durante il drag&drop
 * 
 * Questa funzione:
 * - Trova il container di destinazione
 * - Valida l'inserimento usando le regole di validazione esistenti
 * - Restituisce true se il drop è permesso, false altrimenti
 * 
 * @param blockType - Tipo del blocco che si vuole droppare
 * @param containerId - ID del container di destinazione
 * @param containerType - Tipo di container (thenBlocks, elseBlocks, children, etc.)
 * @param blocks - Array completo dei blocchi per la validazione
 * @param index - Indice opzionale dove inserire il blocco
 * @returns true se il drop è valido, false altrimenti
 */
export const canDropBlock = (
  blockType: string, 
  containerId: string, 
  containerType: string, 
  blocks: any[], 
  index?: number
): boolean => {
  // Usa la funzione importata per trovare il container
  const targetContainer = findContainer(blocks, containerId);
  if (!targetContainer) return true; // Se non trova il container, permetti (verrà gestito dopo)
  
  // Usa la validazione completa per determinare se il drop è permesso
  return validateBlockInsertion(blockType, targetContainer, containerType, index, blocks);
};
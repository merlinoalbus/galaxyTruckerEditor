/**
 * Search Helpers Module
 * Funzioni helper per operazioni di ricerca e accesso ai blocchi
 */

/**
 * Ottiene l'ultimo blocco di una lista
 * Utilizzato per verifiche di validazione dove serve l'ultimo elemento
 * 
 * @param blocks - Array di blocchi
 * @returns L'ultimo blocco della lista o null se la lista è vuota o non valida
 */
export const getLastBlock = (blocks: any[]): any | null => {
  if (!blocks || blocks.length === 0) return null;
  return blocks[blocks.length - 1];
};
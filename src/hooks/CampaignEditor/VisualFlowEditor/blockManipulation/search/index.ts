/**
 * Search Module Re-exports
 * Centralizza tutti gli export del modulo search per import più puliti
 */

// Re-export funzioni di ricerca blocchi
export { findContainer, findBlockBeforeContainer } from './blockSearch';

// Re-export helper functions
export { getLastBlock } from './searchHelpers';
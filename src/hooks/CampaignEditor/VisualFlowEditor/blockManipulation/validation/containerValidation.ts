/**
 * Container Validation Module
 * Validazioni per annidamento di blocchi container BUILD e FLIGHT
 */

/**
 * Valida che BUILD e FLIGHT non possano essere annidati dentro BUILD
 * 
 * @param blockType - Tipo di blocco da inserire
 * @param targetContainer - Container di destinazione
 * @returns true se l'inserimento è valido, false se viola le regole di annidamento
 */
export const validateBuildContainerRules = (
  blockType: string,
  targetContainer: any
): boolean => {
  // BUILD non può contenere BUILD o FLIGHT
  if ((blockType === 'BUILD' || blockType === 'FLIGHT') && targetContainer.type === 'BUILD') {
    return false;
  }
  return true;
};

/**
 * Valida che BUILD e FLIGHT non possano essere annidati dentro FLIGHT
 * 
 * @param blockType - Tipo di blocco da inserire
 * @param targetContainer - Container di destinazione
 * @returns true se l'inserimento è valido, false se viola le regole di annidamento
 */
export const validateFlightContainerRules = (
  blockType: string,
  targetContainer: any
): boolean => {
  // FLIGHT non può contenere BUILD o FLIGHT
  if ((blockType === 'BUILD' || blockType === 'FLIGHT') && targetContainer.type === 'FLIGHT') {
    return false;
  }
  return true;
};

/**
 * Valida tutte le regole di annidamento per container BUILD/FLIGHT
 * 
 * @param blockType - Tipo di blocco da inserire
 * @param targetContainer - Container di destinazione
 * @returns true se l'inserimento è valido, false se viola qualsiasi regola
 */
export const validateContainerNesting = (
  blockType: string,
  targetContainer: any
): boolean => {
  return validateBuildContainerRules(blockType, targetContainer) &&
         validateFlightContainerRules(blockType, targetContainer);
};
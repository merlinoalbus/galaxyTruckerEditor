/**
 * Parameter Validation Module
 * Funzioni per validare che i parametri dei blocchi siano valorizzati correttamente
 */

import { simulateSceneExecution } from '@/utils/CampaignEditor/VisualFlowEditor/sceneSimulation';
import type { IFlowBlock } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

/**
 * Verifica se un testo multilingua è valorizzato (deve avere almeno EN)
 */
const isMultilingualTextValid = (text: any): boolean => {
  if (!text) return false;
  
  // Se è una stringa semplice, considerala come EN
  if (typeof text === 'string') {
    return text.trim().length > 0;
  }
  
  // Se è un oggetto, deve avere almeno EN valorizzato
  if (typeof text === 'object') {
    return text.EN && text.EN.trim().length > 0;
  }
  
  return false;
};

/**
 * Valida i parametri di un blocco DELAY
 */
export const validateDelayParameters = (block: any): { valid: boolean; error?: string } => {
  if (!block.parameters?.duration || block.parameters.duration <= 0) {
    return { 
      valid: false, 
      error: 'DELAY_NO_DURATION' 
    };
  }
  return { valid: true };
};

/**
 * Valida i parametri di un blocco SAY
 */
export const validateSayParameters = (block: any, allBlocks?: IFlowBlock[], characters?: any[]): { valid: boolean; error?: string } => {
  if (!isMultilingualTextValid(block.parameters?.text)) {
    return { 
      valid: false, 
      error: 'SAY_NO_TEXT' 
    };
  }
  
  // SAY può essere anonimo (senza personaggio) ma deve esserci una scena
  if (allBlocks && block.id) {
    const sceneState = simulateSceneExecution(allBlocks, block.id, characters);
    if (!sceneState.isInDialogScene) {
      return {
        valid: false,
        error: 'SAY_NO_SCENE'
      };
    }
  }
  
  return { valid: true };
};

/**
 * Valida i parametri di un blocco ANNOUNCE
 */
export const validateAnnounceParameters = (block: any): { valid: boolean; error?: string } => {
  if (!isMultilingualTextValid(block.parameters?.text)) {
    return { 
      valid: false, 
      error: 'ANNOUNCE_NO_TEXT' 
    };
  }
  
  // ANNOUNCE non richiede una scena visibile, quindi è sempre valido se ha il testo
  return { valid: true };
};

/**
 * Valida i parametri di un blocco ASK
 */
export const validateAskParameters = (block: any, allBlocks?: IFlowBlock[], characters?: any[]): { valid: boolean; error?: string } => {
  if (!isMultilingualTextValid(block.parameters?.text)) {
    return { 
      valid: false, 
      error: 'ASK_NO_TEXT' 
    };
  }
  
  // ASK può essere anonimo (senza personaggio) ma deve esserci una scena
  if (allBlocks && block.id) {
    const sceneState = simulateSceneExecution(allBlocks, block.id, characters);
    if (!sceneState.isInDialogScene) {
      return {
        valid: false,
        error: 'ASK_NO_SCENE'
      };
    }
  }
  
  return { valid: true };
};

/**
 * Valida che dopo un ASK ci sia un IF con MENU/GO come primi elementi
 */
export const validateAskIfStructure = (askBlock: any, allBlocks: IFlowBlock[]): { valid: boolean; error?: string } => {
  // Trova il prossimo blocco dopo ASK
  const askIndex = allBlocks.findIndex(b => b.id === askBlock.id);
  if (askIndex === -1 || askIndex === allBlocks.length - 1) {
    return { valid: true }; // Non c'è nulla dopo, è ok
  }
  
  const nextBlock = allBlocks[askIndex + 1];
  
  // Se dopo ASK c'è un IF
  if (nextBlock.type === 'IF') {
    // Controlla il ramo THEN
    if (nextBlock.thenBlocks && nextBlock.thenBlocks.length > 0) {
      const firstThenBlock = nextBlock.thenBlocks[0];
      if (firstThenBlock.type !== 'MENU' && firstThenBlock.type !== 'GO') {
        return {
          valid: false,
          error: 'ASK_IF_INVALID_THEN'
        };
      }
    }
    
    // Controlla il ramo ELSE se esiste
    if (nextBlock.elseBlocks && nextBlock.elseBlocks.length > 0) {
      const firstElseBlock = nextBlock.elseBlocks[0];
      if (firstElseBlock.type !== 'MENU' && firstElseBlock.type !== 'GO') {
        return {
          valid: false,
          error: 'ASK_IF_INVALID_ELSE'
        };
      }
    }
  }
  
  return { valid: true };
};

/**
 * Valida i parametri di un blocco GO
 */
export const validateGoParameters = (block: any): { valid: boolean; error?: string } => {
  if (!block.parameters?.label || block.parameters.label.trim().length === 0) {
    return { 
      valid: false, 
      error: 'GO_NO_LABEL' 
    };
  }
  return { valid: true };
};

/**
 * Valida i parametri di un blocco LABEL
 */
export const validateLabelParameters = (block: any): { valid: boolean; error?: string } => {
  if (!block.parameters?.name || block.parameters.name.trim().length === 0) {
    return { 
      valid: false, 
      error: 'LABEL_NO_NAME' 
    };
  }
  return { valid: true };
};

/**
 * Valida i parametri di un blocco SUB_SCRIPT
 */
export const validateSubScriptParameters = (block: any): { valid: boolean; error?: string } => {
  // SUB_SCRIPT usa 'script' come nome del parametro, non 'scriptName'
  if (!block.parameters?.script || block.parameters.script.trim().length === 0) {
    return { 
      valid: false, 
      error: 'SUB_SCRIPT_NO_NAME' 
    };
  }
  return { valid: true };
};

/**
 * Valida i parametri di un blocco SAYCHAR
 */
export const validateSayCharParameters = (block: any, allBlocks?: IFlowBlock[], characters?: any[]): { valid: boolean; error?: string } => {
  // Prima controlla che sia selezionato un personaggio
  if (!block.parameters?.character || block.parameters.character.trim().length === 0) {
    return { 
      valid: false, 
      error: 'SAYCHAR_NO_CHARACTER' 
    };
  }
  
  // Poi controlla che ci sia il testo
  if (!isMultilingualTextValid(block.parameters?.text)) {
    return { 
      valid: false, 
      error: 'SAYCHAR_NO_TEXT' 
    };
  }
  
  // Se abbiamo il contesto, verifica che siamo in una scena
  if (allBlocks && block.id) {
    const sceneState = simulateSceneExecution(allBlocks, block.id, characters);
    if (!sceneState.isInDialogScene) {
      return {
        valid: false,
        error: 'SAYCHAR_NO_SCENE'
      };
    }
  }
  
  return { valid: true };
};

/**
 * Valida i parametri di un blocco CHANGECHAR
 */
export const validateChangeCharParameters = (block: any, allBlocks?: IFlowBlock[], characters?: any[]): { valid: boolean; error?: string } => {
  // Prima controlla i parametri base
  if (!block.parameters?.character || block.parameters.character.trim().length === 0) {
    return { 
      valid: false, 
      error: 'CHANGECHAR_NO_CHARACTER' 
    };
  }
  if (!block.parameters?.image || block.parameters.image.trim().length === 0) {
    return { 
      valid: false, 
      error: 'CHANGECHAR_NO_IMAGE' 
    };
  }
  
  // Se abbiamo il contesto, verifica che siamo in una scena
  if (allBlocks && block.id) {
    const sceneState = simulateSceneExecution(allBlocks, block.id, characters);
    
    // Verifica che siamo in una scena (warning)
    if (!sceneState.isInDialogScene) {
      return {
        valid: false,
        error: 'CHANGECHAR_NO_SCENE'
      };
    }
    
    // Verifica che ci siano personaggi visibili (warning)
    if (sceneState.currentScene) {
      const visibleCharacters = sceneState.currentScene.personaggi.filter(p => p.visible);
      if (visibleCharacters.length === 0) {
        return {
          valid: false,
          error: 'CHANGECHAR_NO_VISIBLE_CHARACTERS'
        };
      }
      
      // Verifica che il personaggio selezionato sia visibile nella scena (warning)
      const selectedCharVisible = visibleCharacters.find(p => p.nomepersonaggio === block.parameters.character);
      if (!selectedCharVisible) {
        return {
          valid: false,
          error: 'CHANGECHAR_CHARACTER_NOT_VISIBLE'
        };
      }
    }
  }
  
  // Verifica che l'immagine selezionata faccia parte della lista immagini del personaggio (warning)
  if (characters && block.parameters?.character && block.parameters?.image) {
    const character = characters.find((c: any) => c.nomepersonaggio === block.parameters.character);
    if (character && character.listaimmagini) {
      const imageExists = character.listaimmagini.find((img: any) => 
        img.percorso === block.parameters.image || 
        img.nomefile === block.parameters.image // fallback per compatibilità
      );
      if (!imageExists) {
        return {
          valid: false,
          error: 'CHANGECHAR_IMAGE_NOT_IN_LIST'
        };
      }
    }
  }
  
  return { valid: true };
};

/**
 * Valida i parametri di un blocco OPT
 */
export const validateOptParameters = (block: any): { valid: boolean; error?: string } => {
  // Nel blocco OPT, il testo è salvato direttamente in block.text, non in block.parameters.text
  if (!isMultilingualTextValid(block.text)) {
    return { 
      valid: false, 
      error: 'OPT_NO_TEXT' 
    };
  }
  return { valid: true };
};

/**
 * Valida i parametri di un blocco SHOWCHAR
 */
export const validateShowCharParameters = (block: any, allBlocks?: IFlowBlock[], characters?: any[]): { valid: boolean; error?: string } => {
  // Prima controlla i parametri base
  if (!block.parameters?.character || block.parameters.character.trim().length === 0) {
    return { 
      valid: false, 
      error: 'SHOWCHAR_NO_CHARACTER' 
    };
  }
  if (!block.parameters?.position) {
    return { 
      valid: false, 
      error: 'SHOWCHAR_NO_POSITION' 
    };
  }
  
  // Se abbiamo il contesto, verifica che siamo in una scena
  if (allBlocks && block.id) {
    const sceneState = simulateSceneExecution(allBlocks, block.id, characters);
    if (!sceneState.isInDialogScene) {
      return {
        valid: false,
        error: 'SHOWCHAR_NO_SCENE'
      };
    }
  }
  
  return { valid: true };
};

/**
 * Valida i parametri di un blocco HIDECHAR
 */
export const validateHideCharParameters = (block: any, allBlocks?: IFlowBlock[], characters?: any[]): { valid: boolean; error?: string } => {
  // Se abbiamo il contesto, facciamo prima le validazioni di contesto
  if (allBlocks && block.id) {
    const sceneState = simulateSceneExecution(allBlocks, block.id, characters);
    
    // Verifica che siamo in una scena
    if (!sceneState.isInDialogScene) {
      return {
        valid: false,
        error: 'HIDECHAR_NO_SCENE'
      };
    }
    
    // Verifica che ci sia almeno un personaggio visibile nella scena
    if (sceneState.currentScene) {
      const visibleCharacters = sceneState.currentScene.personaggi.filter(p => p.visible);
      if (visibleCharacters.length === 0) {
        return {
          valid: false,
          error: 'HIDECHAR_NO_VISIBLE_CHARACTERS'
        };
      }
      
      // Se un personaggio è già selezionato, verifica che sia effettivamente visibile
      if (block.parameters?.character) {
        const selectedChar = visibleCharacters.find(p => p.nomepersonaggio === block.parameters.character);
        if (!selectedChar) {
          return {
            valid: false,
            error: 'HIDECHAR_CHARACTER_NOT_VISIBLE'
          };
        }
      }
    }
  }
  
  // Verifica che sia selezionato un personaggio
  if (!block.parameters?.character || block.parameters.character.trim().length === 0) {
    return { 
      valid: false, 
      error: 'HIDECHAR_NO_CHARACTER' 
    };
  }
  
  return { valid: true };
};

/**
 * Valida i parametri di un blocco ADDOPPONENT
 */
export const validateAddOpponentParameters = (block: any): { valid: boolean; error?: string } => {
  // Il parametro character è obbligatorio
  if (!block.parameters?.character || block.parameters.character.trim().length === 0) {
    return { 
      valid: false, 
      error: 'ADDOPPONENT_NO_CHARACTER' 
    };
  }
  
  return { valid: true };
};

/**
 * Valida i parametri di un blocco SETSHIPTYPE
 */
export const validateSetShipTypeParameters = (block: any): { valid: boolean; error?: string } => {
  // Il parametro type è obbligatorio
  if (!block.parameters?.type || block.parameters.type.trim().length === 0) {
    return { 
      valid: false, 
      error: 'SETSHIPTYPE_NO_TYPE' 
    };
  }
  
  return { valid: true };
};

/**
 * Valida i parametri di un blocco RETURN
 * RETURN non ha parametri obbligatori, quindi è sempre valido
 * Il warning per root level dovrebbe essere gestito altrove con accesso al navigationPath
 */
export const validateReturnParameters = (block: any): { valid: boolean; error?: string } => {
  // RETURN non ha parametri obbligatori
  return { valid: true };
};

/**
 * Valida i parametri di un blocco SET
 */
export const validateSetParameters = (block: any): { valid: boolean; error?: string } => {
  if (!block.parameters?.semaphore || block.parameters.semaphore.trim() === '') {
    return { 
      valid: false, 
      error: 'SET_NO_SEMAPHORE' 
    };
  }
  return { valid: true };
};

/**
 * Valida i parametri di un blocco RESET
 */
export const validateResetParameters = (block: any): { valid: boolean; error?: string } => {
  if (!block.parameters?.semaphore || block.parameters.semaphore.trim() === '') {
    return { 
      valid: false, 
      error: 'RESET_NO_SEMAPHORE' 
    };
  }
  return { valid: true };
};

/**
 * Valida i parametri di un blocco ADDPARTTOSHIP
 */
export const validateAddPartToShipParameters = (block: any): { valid: boolean; error?: string } => {
  if (!block.parameters?.params || block.parameters.params.trim() === '') {
    return { 
      valid: false, 
      error: 'ADDPARTTOSHIP_NO_PARAMS' 
    };
  }
  return { valid: true };
};

/**
 * Valida i parametri di un blocco ADDPARTTOASIDESLOT
 */
export const validateAddPartToAsideSlotParameters = (block: any): { valid: boolean; error?: string } => {
  if (!block.parameters?.params || block.parameters.params.trim() === '') {
    return { 
      valid: false, 
      error: 'ADDPARTTOASIDESLOT_NO_PARAMS' 
    };
  }
  return { valid: true };
};

/**
 * Valida i parametri di un blocco ADDSHIPPARTS
 */
export const validateAddShipPartsParameters = (block: any): { valid: boolean; error?: string } => {
  if (!block.parameters?.params || block.parameters.params.trim() === '') {
    return { 
      valid: false, 
      error: 'ADDSHIPPARTS_NO_PARAMS' 
    };
  }
  return { valid: true };
};

/**
 * Valida i parametri di un blocco ACT_MISSION
 */
export const validateActMissionParameters = (block: any): { valid: boolean; error?: string } => {
  if (!block.parameters?.mission || block.parameters.mission.trim() === '') {
    return { 
      valid: false, 
      error: 'ACT_MISSION_NO_MISSION' 
    };
  }
  return { valid: true };
};

/**
 * Valida i parametri di un blocco in base al suo tipo
 */
export const validateBlockParameters = (block: any, allBlocks?: IFlowBlock[], characters?: any[]): { valid: boolean; error?: string } => {
  switch (block.type) {
    case 'DELAY':
      return validateDelayParameters(block);
    case 'SAY':
      return validateSayParameters(block, allBlocks, characters);
    case 'ANNOUNCE':
      return validateAnnounceParameters(block);
    case 'SAYCHAR':
      return validateSayCharParameters(block, allBlocks, characters);
    case 'ASK': {
      // Prima valida i parametri di ASK
      const askValidation = validateAskParameters(block, allBlocks, characters);
      if (!askValidation.valid) return askValidation;
      
      // Poi valida la struttura ASK-IF se abbiamo il contesto
      if (allBlocks) {
        return validateAskIfStructure(block, allBlocks);
      }
      return askValidation;
    }
    case 'GO':
      return validateGoParameters(block);
    case 'LABEL':
      return validateLabelParameters(block);
    case 'SUB_SCRIPT':
      return validateSubScriptParameters(block);
    case 'OPT':
      return validateOptParameters(block);
    case 'SHOWCHAR':
      return validateShowCharParameters(block, allBlocks, characters);
    case 'HIDECHAR':
      return validateHideCharParameters(block, allBlocks, characters);
    case 'CHANGECHAR':
      return validateChangeCharParameters(block, allBlocks, characters);
    case 'ADDOPPONENT':
      return validateAddOpponentParameters(block);
    case 'SETSHIPTYPE':
      return validateSetShipTypeParameters(block);
    case 'RETURN':
      return validateReturnParameters(block);
    case 'SET':
      return validateSetParameters(block);
    case 'RESET':
      return validateResetParameters(block);
    case 'ADDPARTTOSHIP':
      return validateAddPartToShipParameters(block);
    case 'ADDPARTTOASIDESLOT':
      return validateAddPartToAsideSlotParameters(block);
    case 'ADDSHIPPARTS':
      return validateAddShipPartsParameters(block);
    case 'ACT_MISSION':
      return validateActMissionParameters(block);
    case 'SETDECKPREPARATIONSCRIPT':
      return (!block.parameters?.script || String(block.parameters.script).trim() === '')
        ? { valid: false, error: 'SETDECKPREPARATIONSCRIPT_NO_SCRIPT' }
        : { valid: true };
    case 'SETFLIGHTDECKPREPARATIONSCRIPT':
      return (!block.parameters?.script || String(block.parameters.script).trim() === '')
        ? { valid: false, error: 'SETFLIGHTDECKPREPARATIONSCRIPT_NO_SCRIPT' }
        : { valid: true };
    // EXIT_MENU, SHOWDLGSCENE, HIDEDLGSCENE non hanno parametri da validare
    default:
      return { valid: true };
  }
};
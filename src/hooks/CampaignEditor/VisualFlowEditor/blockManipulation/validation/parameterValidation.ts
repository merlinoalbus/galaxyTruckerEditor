/**
 * Parameter Validation Module
 * Funzioni per validare che i parametri dei blocchi siano valorizzati correttamente
 */

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
export const validateSayParameters = (block: any): { valid: boolean; error?: string } => {
  if (!isMultilingualTextValid(block.parameters?.text)) {
    return { 
      valid: false, 
      error: 'SAY_NO_TEXT' 
    };
  }
  return { valid: true };
};

/**
 * Valida i parametri di un blocco ASK
 */
export const validateAskParameters = (block: any): { valid: boolean; error?: string } => {
  if (!isMultilingualTextValid(block.parameters?.text)) {
    return { 
      valid: false, 
      error: 'ASK_NO_TEXT' 
    };
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
 * Valida i parametri di un blocco in base al suo tipo
 */
export const validateBlockParameters = (block: any): { valid: boolean; error?: string } => {
  switch (block.type) {
    case 'DELAY':
      return validateDelayParameters(block);
    case 'SAY':
      return validateSayParameters(block);
    case 'ASK':
      return validateAskParameters(block);
    case 'GO':
      return validateGoParameters(block);
    case 'LABEL':
      return validateLabelParameters(block);
    case 'SUB_SCRIPT':
      return validateSubScriptParameters(block);
    case 'OPT':
      return validateOptParameters(block);
    // EXIT_MENU non ha parametri da validare
    default:
      return { valid: true };
  }
};
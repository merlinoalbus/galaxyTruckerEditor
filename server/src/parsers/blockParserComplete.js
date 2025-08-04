// blockParserComplete.js - Parser completo bidirezionale per script e mission
const { getLogger } = require('../utils/logger');
const logger = getLogger();

// CATALOGO COMPLETO BLOCCHI CONTAINER
const BLOCK_CATALOG = {
  'SCRIPT': {
    type: 'CONTAINER',
    openPattern: /^SCRIPT\s+(.+)$/,
    closePattern: /^END_OF_SCRIPT$/,
    canContain: ['ALL'],
    structure: { name: 'string', children: 'array' }
  },
  
  'MISSION': {
    type: 'CONTAINER', 
    openPattern: /^MISSION\s+(.+)$/,
    closePattern: /^END_OF_MISSION$/,
    hasFinishSection: /^FINISH_MISSION$/,
    canContain: ['ALL'],
    structure: { name: 'string', children: 'array', finishSection: 'array' }
  },
  
  'IF': {
    type: 'CONDITIONAL_BLOCK',
    variants: [
      { pattern: /^IF\s+(.+)$/, type: 'IF_SEMAPHORE' },
      { pattern: /^IFNOT\s+(.+)$/, type: 'IFNOT_SEMAPHORE' },
      { pattern: /^IF_DEBUG$/, type: 'IF_SYSTEM', systemVar: 'debug' },
      { pattern: /^IF_FROM_CAMPAIGN$/, type: 'IF_SYSTEM', systemVar: 'from_campaign' },
      { pattern: /^IF_HAS_CREDITS\s+(\d+)$/, type: 'IF_CREDITS' },
      { pattern: /^IF_IS\s+(\w+)\s+(\d+)$/, type: 'IF_VARIABLE_EXACT' },
      { pattern: /^IF_MIN\s+(\w+)\s+(\d+)$/, type: 'IF_VARIABLE_MIN' },
      { pattern: /^IF_MAX\s+(\w+)\s+(\d+)$/, type: 'IF_VARIABLE_MAX' },
      { pattern: /^IF_MISSION_WON$/, type: 'IF_SYSTEM', systemVar: 'mission_won' },
      { pattern: /^IF_ORDER\s+(.+)$/, type: 'IF_ORDER' },
      { pattern: /^IF_PROB\s+(\d+)$/, type: 'IF_PROBABILITY' },
      { pattern: /^IF_TUTORIAL_SEEN$/, type: 'IF_SYSTEM', systemVar: 'tutorial_seen' },
      { pattern: /^IFMISSIONRESULTIS\s+(\d+)$/, type: 'IF_MISSION_RESULT_EXACT' },
      { pattern: /^IFMISSIONRESULTMIN\s+(\d+)$/, type: 'IF_MISSION_RESULT_MIN' }
    ],
    closePattern: /^END_OF_IF$/,
    hasElse: /^ELSE$/,
    canContain: ['ALL'],
    structure: { ifType: 'string', condition: 'mixed', thenBranch: 'array', elseBranch: 'array' }
  },
  
  'MENU': {
    type: 'MENU_BLOCK',
    openPattern: /^MENU$/,
    closePattern: /^END_OF_MENU$/,
    canContain: ['OPT_BLOCKS_ONLY'],
    requiresPrecedingASK: true,
    structure: { options: 'array' }
  },
  
  'OPT': {
    type: 'OPTION_BLOCK',
    variants: [
      { pattern: /^OPT\s+"(.+)"$/, type: 'OPT_SIMPLE' },
      { pattern: /^OPT_IF\s+(\w+)\s+"(.+)"$/, type: 'OPT_CONDITIONAL' },
      { pattern: /^OPT_IFNOT\s+(\w+)\s+"(.+)"$/, type: 'OPT_CONDITIONAL_NOT' }
    ],
    closePattern: /^END_OF_OPT$/,
    parentMustBe: 'MENU',
    canContain: ['ALL'],
    structure: { optType: 'string', condition: 'string', text: 'multilingual', children: 'array' }
  },
  
  'BUILD': {
    type: 'MISSION_PHASE_BLOCK',
    phases: [
      { pattern: /^INIT_BUILD$/, phase: 'init' },
      { pattern: /^START_BUILDING$/, phase: 'start' },
      { pattern: /^END_BUILDING$/, phase: 'end' }
    ],
    parentMustBe: 'MISSION',
    canContain: ['ALL'],
    structure: { phase: 'string', children: 'array' }
  },
  
  'FLIGHT': {
    type: 'MISSION_PHASE_BLOCK', 
    phases: [
      { pattern: /^INIT_FLIGHT$/, phase: 'init' },
      { pattern: /^START_FLIGHT$/, phase: 'start' },
      { pattern: /^EVALUATE_FLIGHT$/, phase: 'evaluate' },
      { pattern: /^END_FLIGHT$/, phase: 'end' }
    ],
    parentMustBe: 'MISSION',
    canContain: ['ALL'],
    structure: { phase: 'string', children: 'array' }
  }
};

// CATALOGO COMPLETO COMANDI ATOMICI
const COMMAND_CATALOG = {
  // DIALOGO (multilingua)
  'SAY': { params: ['text:multilingual'], pattern: /^Say\s+"(.+)"$/ },
  'ASK': { params: ['text:multilingual'], pattern: /^Ask\s+"(.+)"$/ },
  'SAYCHAR': { params: ['character', 'text:multilingual'], pattern: /^SayChar\s+(\w+)\s+"(.+)"$/ },
  'ASKCHAR': { params: ['character', 'text:multilingual'], pattern: /^AskChar\s+(\w+)\s+"(.+)"$/ },
  'ANNOUNCE': { params: ['text:multilingual'], pattern: /^Announce\s+"(.+)"$/ },
  'SETFLIGHTSTATUSBAR': { params: ['text:multilingual'], pattern: /^SetFlightStatusBar\s+"(.+)"$/ },
  
  // PERSONAGGI
  'SHOWCHAR': { params: ['character', 'position:enum'], pattern: /^ShowChar\s+(\w+)\s+(left|center|right)$/ },
  'HIDECHAR': { params: ['character'], pattern: /^HideChar\s+(\w+)$/ },
  'CHANGECHAR': { params: ['character', 'image'], pattern: /^ChangeChar\s+(\w+)\s+(.+)$/ },
  'FOCUSCHAR': { params: ['character'], pattern: /^FocusChar\s+(\w+)$/ },
  
  // FINESTRA DIALOGO
  'SHOWDLGSCENE': { params: [], pattern: /^ShowDlgScene$/ },
  'HIDEDLGSCENE': { params: [], pattern: /^HideDlgScene$/ },
  
  // VARIABILI/SEMAFORI
  'SET': { params: ['semaphore'], pattern: /^SET\s+(\w+)$/ },
  'RESET': { params: ['semaphore'], pattern: /^RESET\s+(\w+)$/ },
  'SET_TO': { params: ['variable', 'value:number'], pattern: /^SET_TO\s+(\w+)\s+(\d+)$/ },
  'ADD': { params: ['variable', 'value:number'], pattern: /^ADD\s+(\w+)\s+(\d+)$/ },
  
  // CONTROLLO FLUSSO
  'LABEL': { params: ['name'], pattern: /^LABEL\s+(\w+)$/i },
  'GO': { params: ['label'], pattern: /^GO\s+(\w+)$/i },
  'SUB_SCRIPT': { params: ['script'], pattern: /^SUB_SCRIPT\s+(\w+)$/i },
  'RETURN': { params: [], pattern: /^RETURN$/i },
  'EXIT_MENU': { params: [], pattern: /^EXIT_MENU$/i },
  'DELAY': { params: ['milliseconds:number'], pattern: /^DELAY\s+(\d+)$/i },
  
  // MAPPA/NAVIGAZIONE
  'SHOWPATH': { params: ['route'], pattern: /^SHOWPATH\s+(.+)$/i },
  'HIDEPATH': { params: ['route'], pattern: /^HIDEPATH\s+(.+)$/i },
  'HIDEALLPATHS': { params: ['node1', 'node2'], pattern: /^HIDEALLPATHS\s+(\w+)\s+(\w+)$/i },
  'SHOWNODE': { params: ['node'], pattern: /^SHOWNODE\s+(.+)$/i },
  'HIDENODE': { params: ['node'], pattern: /^HIDENODE\s+(.+)$/i },
  'SHOWBUTTON': { params: ['button'], pattern: /^SHOWBUTTON\s+(\w+)$/i },
  'HIDEBUTTON': { params: ['button'], pattern: /^HIDEBUTTON\s+(\w+)$/i },
  'CENTERMAPBYNODE': { params: ['node'], pattern: /^CENTERMAPBYNODE\s+(\w+)$/i },
  'CENTERMAPBYPATH': { params: ['route'], pattern: /^CENTERMAPBYPATH\s+(.+)$/i },
  'MOVEPLAYERTONODE': { params: ['node'], pattern: /^MOVEPLAYERTONODE\s+(\w+)$/i },
  
  // MISSION MANAGEMENT  
  'ADDOPPONENT': { params: ['character'], pattern: /^ADDOPPONENT\s+(\w+)$/ },
  'ACT_MISSION': { params: ['mission'], pattern: /^ACT_MISSION\s+(\w+)$/ },
  'ADDOPPONENTSCREDITS': { params: ['index:number', 'credits:number'], pattern: /^ADDOPPONENTSCREDITS\s+(\d+)\s+(\d+)$/ },
  'MODIFYOPPONENTSBUILDSPEED': { params: ['percentage:number'], pattern: /^MODIFYOPPONENTSBUILDSPEED\s+(\d+)$/ },
  'SETSHIPTYPE': { params: ['type'], pattern: /^SETSHIPTYPE\s+(\w+)$/ },
  'SETDECKPREPARATIONSCRIPT': { params: ['script'], pattern: /^SETDECKPREPARATIONSCRIPT\s+(\w+)$/ },
  'SETFLIGHTDECKPREPARATIONSCRIPT': { params: ['script'], pattern: /^SETFLIGHTDECKPREPARATIONSCRIPT\s+(\w+)$/ },
  'SETTURNBASED': { params: [], pattern: /^SETTURNBASED$/ },
  
  // CREDITI
  'ADDCREDITS': { params: ['amount:number'], pattern: /^ADDCREDITS\s+(\d+)$/ },
  'SETCREDITS': { params: ['amount:number'], pattern: /^SETCREDITS\s+(\d+)$/ },
  'ADDMISSIONCREDITS': { params: ['amount:number'], pattern: /^ADDMISSIONCREDITS\s+(\d+)$/ },
  'ADDMISSIONCREDITSBYRESULT': { params: [], pattern: /^ADDMISSIONCREDITSBYRESULT$/ },
  'SUBOPPONENTCREDITSBYRESULT': { params: [], pattern: /^SUBOPPONENTCREDITSBYRESULT$/ },
  
  // FOCUS E UI
  'SETFOCUS': { params: ['button'], pattern: /^SETFOCUS\s+(\w+)$/i },
  'RESETFOCUS': { params: ['button'], pattern: /^RESETFOCUS\s+(\w+)$/i },
  'SETFOCUSIFCREDITS': { params: ['button', 'credits:number'], pattern: /^SETFOCUSIFCREDITS\s+(\w+)\s+(\d+)$/i },
  'SETNODEKNOWN': { params: ['node'], pattern: /^SETNODEKNOWN\s+(\w+)$/ },
  'ADDINFOWINDOW': { params: ['image'], pattern: /^ADDINFOWINDOW\s+(.+)$/ },
  'SHOWINFOWINDOW': { params: ['image'], pattern: /^SHOWINFOWINDOW\s+(.+)$/ },
  
  // ACHIEVEMENTS
  'SETACHIEVEMENTPROGRESS': { params: ['achievement', 'value:number'], pattern: /^SETACHIEVEMENTPROGRESS\s+(\w+)\s+(\d+)$/ },
  'SETACHIEVEMENTATTEMPT': { params: ['achievement', 'value:number'], pattern: /^SETACHIEVEMENTATTEMPT\s+(\w+)\s+(\d+)$/ },
  'UNLOCKACHIEVEMENT': { params: ['achievement'], pattern: /^UNLOCKACHIEVEMENT\s+(\w+)$/ },
  'UNLOCKSHIPPLAN': { params: ['plan'], pattern: /^UNLOCKSHIPPLAN\s+(\w+)$/ },
  'UNLOCKSHUTTLES': { params: [], pattern: /^UNLOCKSHUTTLES$/ },
  
  // HELP SCRIPTS
  'BUILDINGHELPSCRIPT': { params: ['delay:number', 'script'], pattern: /^BUILDINGHELPSCRIPT\s+(\d+)\s+(\w+)$/ },
  'FLIGHTHELPSCRIPT': { params: ['script'], pattern: /^FLIGHTHELPSCRIPT\s+(\w+)$/ },
  'ALIENHELPSCRIPT': { params: ['script'], pattern: /^ALIENHELPSCRIPT\s+(\w+)$/ },
  
  // MISSION STATUS
  'SETMISSIONASFAILED': { params: [], pattern: /^SETMISSIONASFAILED$/ },
  'SETMISSIONASCOMPLETED': { params: [], pattern: /^SETMISSIONASCOMPLETED$/ },
  'ALLSHIPSGIVEUP': { params: [], pattern: /^ALLSHIPSGIVEUP$/ },
  'GIVEUPFLIGHT': { params: [], pattern: /^GIVEUPFLIGHT$/ },
  
  // STATO
  'SAVESTATE': { params: [], pattern: /^SAVESTATE$/ },
  'LOADSTATE': { params: [], pattern: /^LOADSTATE$/ },
  'ADDNODE': { params: ['node'], pattern: /^ADDNODE\s+(\w+)$/ },
  'QUITCAMPAIGN': { params: [], pattern: /^QUITCAMPAIGN$/ },
  
  // PARAMETRI COMPLESSI (gestiti come stringa unica)
  'ADDPARTTOSHIP': { params: ['params:complex'], pattern: /^ADDPARTTOSHIP\s+(.+)$/, example: '1 7 alienEngine 3333 0' },
  'ADDPARTTOASIDESLOT': { params: ['params:complex'], pattern: /^ADDPARTTOASIDESLOT\s+(.+)$/, example: 'alienGun 2 1 2 0' },
  'SETADVPILE': { params: ['params:complex'], pattern: /^SETADVPILE\s+(.+)$/, example: '1 3' },
  'SETSECRETADVPILE': { params: ['params:complex'], pattern: /^SETSECRETADVPILE\s+(.+)$/, example: '2 1' },
  'SETSPECCONDITION': { params: ['params:complex'], pattern: /^SETSPECCONDITION\s+(.+)$/, example: 'bet' },
  'ADDSHIPPARTS': { params: ['params:complex'], pattern: /^ADDSHIPPARTS\s+(.+)$/, example: 'parts/allParts.yaml' },
  'SHOWHELPIMAGE': { params: ['params:complex'], pattern: /^SHOWHELPIMAGE\s+(.+)$/, example: '40 50 70 campaign/tutorial-purple.png' }
};

/**
 * Parser ricorsivo principale - TEXT to BLOCKS
 */
function parseScriptToBlocks(lines, language = 'EN', recursionDepth = 0) {
  if (!Array.isArray(lines)) {
    throw new Error('Lines must be an array');
  }
  
  const result = { blocks: [], errors: [] };
  let currentIndex = 0;
  
  // Stato del parser sequenziale
  let currentBlock = null; // Blocco attualmente in lavorazione
  let parserData = []; // Array temporaneo per raccogliere righe del parser delegato
  let parserCount = 0; // Contatore livelli blocco per parser delegato
  let blockFamily = null; // Famiglia del blocco in raccolta (IF, MENU, etc.)
  
  while (currentIndex < lines.length) {
    const line = lines[currentIndex]?.trim();
    
    // Skip righe vuote e commenti
    if (!line || line.startsWith('//')) {
      currentIndex++;
      continue;
    }
    
    try {
      // Controlla se è un blocco
      const blockMatch = identifyBlock(line);
      
      if (blockMatch) {
        // È UN BLOCCO
        if (!currentBlock && parserCount === 0) {
          // NON HO OGGETTO IN LAVORAZIONE - INIZIO A LAVORARLO IO
          currentBlock = createBlockObject(blockMatch, currentIndex + 1);
          currentIndex++;
          continue;
          
        } else if (currentBlock && parserCount === 0) {
          // HO GIà UN BLOCCO IN LAVORAZIONE - CHIAMO PARSER PER QUESTO NUOVO BLOCCO
          parserData = [line];
          parserCount = 1;
          blockFamily = blockMatch.blockName;
          currentIndex++;
          continue;
          
        } else {
          // STO GIà RACCOGLIENDO PER UN PARSER - AGGIUNGO ALL'ARRAY TEMPORANEO
          parserData.push(line);
          if (blockMatch.blockName === blockFamily) {
            parserCount++;
          }
          currentIndex++;
          continue;
        }
      }
      
      // Controlla se è la chiusura del MIO blocco corrente
      if (currentBlock && parserCount === 0) {
        const myCloseMatch = identifyCloseElement(line, currentBlock.type);
        if (myCloseMatch) {
          // NON aggiungo ai children, uso solo per validazione
          // Il blocco è completo, sarà aggiunto alla fine
          currentIndex++;
          continue;
        }
      }
      
      // Controlla se è un elemento di chiusura per parser delegato
      const closeMatch = identifyCloseElement(line, blockFamily);
      if (closeMatch && parserCount > 0) {
        parserData.push(line);
        parserCount--;
        
        if (parserCount === 0) {
          // RACCOLTA COMPLETATA - CHIAMO IL PARSER
          const parserResult = parseScriptToBlocks(parserData, language, recursionDepth + 1);
          if (parserResult.blocks.length > 0) {
            currentBlock.children.push(...parserResult.blocks);
          }
          if (parserResult.errors.length > 0) {
            result.errors.push(...parserResult.errors);
          }
          
          // Reset stato raccolta
          parserData = [];
          blockFamily = null;
        }
        currentIndex++;
        continue;
      }
      
      // È UN COMANDO NORMALE
      if (parserCount > 0) {
        // STO RACCOGLIENDO - AGGIUNGO ALL'ARRAY TEMPORANEO
        parserData.push(line);
      } else if (currentBlock) {
        // HO UN BLOCCO IN LAVORAZIONE - AGGIUNGO COMANDO AL MIO BLOCCO
        const commandObj = parseSimpleCommand(line, currentIndex + 1, language);
        if (commandObj) {
          currentBlock.children.push(commandObj);
        }
      } else {
        // NON HO BLOCCHI - COMANDO DIRETTO AL RISULTATO
        const commandObj = parseSimpleCommand(line, currentIndex + 1, language);
        if (commandObj) {
          result.blocks.push(commandObj);
        }
      }
      
      currentIndex++;
      
    } catch (error) {
      result.errors.push(`Parse error at line ${currentIndex + 1}: ${error.message}`);
      currentIndex++;
    }
  }
  
  // Finalizzazione
  if (currentBlock) {
    result.blocks.push(currentBlock);
  }
  
  if (parserCount > 0) {
    result.errors.push(`Unclosed block collection for ${blockFamily}, missing ${parserCount} closing elements`);
  }
  
  return result;
}

/**
 * Identifica elemento di chiusura per famiglia blocco
 */
function identifyCloseElement(line, blockFamily) {
  if (!blockFamily) return null;
  
  const closePatterns = {
    'SCRIPT': /^END_OF_SCRIPT$/,
    'MISSION': /^END_OF_MISSION$/,
    'IF': /^END_OF_IF$/,
    'MENU': /^END_OF_MENU$/,
    'OPT': /^END_OF_OPT$/
  };
  
  const pattern = closePatterns[blockFamily];
  if (!pattern) return null;
  
  return line.match(pattern) ? { blockFamily, pattern } : null;
}

/**
 * Crea oggetto blocco iniziale
 */
function createBlockObject(blockMatch, lineNumber) {
  const { blockName, blockDef, match, variant } = blockMatch;
  
  const baseBlock = {
    type: blockName,
    line: lineNumber,
    children: []
  };
  
  switch (blockName) {
    case 'SCRIPT':
      baseBlock.name = match[1];
      break;
    case 'MISSION':
      baseBlock.name = match[1];
      break;
    case 'IF':
      baseBlock.ifType = variant?.type || 'IF_SEMAPHORE';
      if (variant?.type === 'IF_SEMAPHORE' || variant?.type === 'IFNOT_SEMAPHORE') {
        baseBlock.condition = match[1];
        baseBlock.negated = variant.type === 'IFNOT_SEMAPHORE';
      }
      // Altri tipi IF...
      break;
    case 'MENU':
      // Menu non ha parametri iniziali
      break;
    case 'OPT':
      if (variant?.type === 'OPT_SIMPLE') {
        baseBlock.text = match[1];
      }
      // Altri tipi OPT...
      break;
  }
  
  return baseBlock;
}

/**
 * Parser comando semplice
 */
function parseSimpleCommand(line, lineNumber, language) {
  // Usa il sistema esistente per i comandi
  const commandMatch = identifyCommand(line);
  if (commandMatch) {
    return parseCommand(line, commandMatch, language, lineNumber - 1);
  }
  
  // Comando generico
  return {
    type: 'UNKNOWN_COMMAND',
    line: lineNumber,
    content: line,
    originalLine: line
  };
}

/**
 * Parser elemento singolo con gestione ricorsiva blocchi
 */
function parseNextElement(lines, startIndex, language = 'EN', recursionDepth = 0) {
  const line = lines[startIndex]?.trim();
  if (!line) {
    return { nextIndex: startIndex + 1, object: null };
  }
  
  // BLACKLIST: Delimitatori strutturali che non devono essere parsati come comandi
  const structuralDelimiters = [
    /^END_OF_IF$/i,
    /^END_OF_MENU$/i, 
    /^END_OF_OPT$/i,
    /^END_OF_SCRIPT$/i,
    /^END_OF_SCRIPTS$/i,
    /^END_OF_MISSION$/i,
    /^FINISH_MISSION$/i,
    /^ELSE$/i
  ];
  
  for (const delimiter of structuralDelimiters) {
    if (line.match(delimiter)) {
      // Delimitatore strutturale trovato fuori contesto - errore di parsing
      return {
        nextIndex: startIndex + 1,
        object: null,
        error: `Structural delimiter '${line}' found outside of proper block context at line ${startIndex + 1}`
      };
    }
  }
  
  // 1. Controlla se è un BLOCCO
  const blockMatch = identifyBlock(line);
  if (blockMatch) {
    return parseBlock(lines, startIndex, blockMatch, language, recursionDepth);
  }
  
  // 2. Controlla se è un COMANDO
  const commandMatch = identifyCommand(line);
  if (commandMatch) {
    return parseCommand(line, commandMatch, language, startIndex, recursionDepth);
  }
  
  // 3. Fallback comando generico
  return parseGenericCommand(line, startIndex, recursionDepth);
}

/**
 * Identifica tipo di BLOCCO
 */
function identifyBlock(line) {
  for (const [blockName, blockDef] of Object.entries(BLOCK_CATALOG)) {
    // Controllo pattern apertura standard
    if (blockDef.openPattern) {
      const match = line.match(blockDef.openPattern);
      if (match) {
        return { blockName, blockDef, match, type: 'standard' };
      }
    }
    
    // Controllo varianti (per IF)
    if (blockDef.variants) {
      for (const variant of blockDef.variants) {
        const match = line.match(variant.pattern);
        if (match) {
          return { blockName, blockDef, match, variant, type: 'variant' };
        }
      }
    }
    
    // Controllo fasi (per BUILD/FLIGHT)
    if (blockDef.phases) {
      for (const phase of blockDef.phases) {
        const match = line.match(phase.pattern);
        if (match) {
          return { blockName, blockDef, match, phase, type: 'phase' };
        }
      }
    }
  }
  
  return null;
}

/**
 * Parser blocco con gestione ricorsiva
 */
function parseBlock(lines, startIndex, blockMatch, language, recursionDepth = 0) {
  const depthId = recursionDepth === 0 ? 'ROOT' : `PARSER${recursionDepth.toString().padStart(2, '0')}`;
  const { blockName, blockDef, match, variant, phase } = blockMatch;
  let blockContent = [];
  let elseContent = [];
  let finishContent = [];
  let currentIndex = startIndex + 1;
  let blockLevel = 1;
  let inElse = false;
  let inFinish = false;
  
  const startLine = lines[startIndex]?.trim() || '';
  logger.info(`${depthId}: [${startIndex + 1}] 🔵 PARSING BLOCK: ${blockName} at line ${startIndex + 1}, blockLevel=${blockLevel} ---> [NEXT: ${startIndex + 2}]`);
  logger.info(`${depthId}: [${startIndex + 1}] 🔵 START LINE: "${startLine}"`);
  
  // Determina pattern di chiusura
  let closePattern = blockDef.closePattern;
  logger.info(`${depthId}: [${startIndex + 1}] 🔵 Close pattern for ${blockName}: ${closePattern}`);
  
  while (currentIndex < lines.length && blockLevel > 0) {
    const currentLine = lines[currentIndex]?.trim();
    if (!currentLine || currentLine.startsWith('//')) {
      currentIndex++;
      continue;
    }
    
    // Controllo elementi speciali
    if (blockDef.hasElse && currentLine.match(blockDef.hasElse) && blockLevel === 1) {
      logger.info(`${depthId}: [${currentIndex + 1}] 🟡 ELSE found for ${blockName} at line ${currentIndex + 1}, switching to else branch ---> [NEXT: ${currentIndex + 2}]`);
      inElse = true;
      currentIndex++;
      continue;
    }
    
    if (blockDef.hasFinishSection && currentLine.match(blockDef.hasFinishSection) && blockLevel === 1) {
      logger.info(`${depthId}: [${currentIndex + 1}] 🟡 FINISH section found for ${blockName} at line ${currentIndex + 1} ---> [NEXT: ${currentIndex + 2}]`);
      inFinish = true;
      currentIndex++;
      continue;  
    }
    
    // Controllo chiusura blocco
    if (currentLine.match(closePattern)) {
      blockLevel--;
      logger.info(`${depthId}: [${currentIndex + 1}] 🔴 CLOSING ${blockName} at line ${currentIndex + 1}, blockLevel now=${blockLevel} ---> [NEXT: ${currentIndex + 2}]`);
      logger.info(`${depthId}: [${currentIndex + 1}] 🔴 CLOSING LINE: "${currentLine}"`);
      if (blockLevel === 0) {
        logger.info(`${depthId}: [${currentIndex + 1}] ✅ BLOCK ${blockName} COMPLETED from line ${startIndex + 1} to ${currentIndex + 1}`);
        currentIndex++;
        break;
      }
    }
    
    // Controllo apertura blocchi della stessa famiglia (per tracking livello)
    const innerBlockMatch = identifyBlock(currentLine);
    if (innerBlockMatch && innerBlockMatch.blockName === blockName) {
      // Solo incrementa se è della stessa famiglia (es. IF dentro IF)
      blockLevel++;
      logger.info(`${depthId}: [${currentIndex + 1}] 🟢 NESTED ${blockName} found at line ${currentIndex + 1}, blockLevel now=${blockLevel} ---> [NEXT: ${currentIndex + 2}]`);
      logger.info(`${depthId}: [${currentIndex + 1}] 🟢 NESTED LINE: "${currentLine}"`);
    } else if (innerBlockMatch) {
      logger.info(`${depthId}: [${currentIndex + 1}] 🟠 OTHER BLOCK ${innerBlockMatch.blockName} found at line ${currentIndex + 1}, delegating to parseNextElement ---> [NEXT: ?]`);
      logger.info(`${depthId}: [${currentIndex + 1}] 🟠 OTHER LINE: "${currentLine}"`);
    }
    
    // Parsing ricorsivo contenuto
    try {
      const element = parseNextElement(lines, currentIndex, language, recursionDepth + 1);
      if (element.object) {
        const target = inFinish ? 'finish' : inElse ? 'else' : 'main';
        logger.info(`${depthId}: [${currentIndex + 1}] 📝 Adding element ${element.object.type} to ${target} branch of ${blockName} ---> [NEXT: ${element.nextIndex + 1}]`);
        if (inFinish) {
          finishContent.push(element.object);
        } else if (inElse) {
          elseContent.push(element.object);
        } else {
          blockContent.push(element.object);
        }
      }
      currentIndex = element.nextIndex;
    } catch (error) {
      return {
        nextIndex: currentIndex + 1,
        error: `Block parse error at line ${currentIndex + 1}: ${error.message}`,
        object: null
      };
    }
  }
  
  // Costruzione oggetto blocco
  const blockObject = buildBlockObject(blockName, blockDef, match, variant, phase, blockContent, elseContent, finishContent);
  
  if (blockLevel > 0) {
    logger.error(`${depthId}: [${startIndex + 1}] ❌ UNCLOSED BLOCK ${blockName} from line ${startIndex + 1}, blockLevel=${blockLevel}`);
    logger.error(`${depthId}: [${startIndex + 1}] ❌ Started with: "${startLine}"`);
    logger.error(`${depthId}: [${startIndex + 1}] ❌ Expected close pattern: ${closePattern}`);
  } else {
    logger.info(`${depthId}: [${startIndex + 1}] ✅ parseBlock ENDED successfully {${startIndex + 1} || ${currentIndex}}`);
  }
  
  return {
    nextIndex: currentIndex,
    object: blockObject,
    error: blockLevel > 0 ? `Unclosed block ${blockName} starting at line ${startIndex + 1}` : null
  };
}

/**
 * Costruisce oggetto blocco in base al tipo
 */
function buildBlockObject(blockName, blockDef, match, variant, phase, content, elseContent, finishContent) {
  switch (blockName) {
    case 'SCRIPT':
      return {
        type: 'SCRIPT',
        name: match[1],
        children: content
      };
      
    case 'MISSION':
      const missionObj = {
        type: 'MISSION',
        name: match[1],
        children: content
      };
      if (finishContent.length > 0) {
        missionObj.finishSection = finishContent;
      }
      return missionObj;
      
    case 'IF':
      const ifObj = {
        type: 'IF',
        ifType: variant.type,
        thenBranch: content
      };
      
      // Parametri specifici per tipo IF
      if (variant.type === 'IF_SEMAPHORE' || variant.type === 'IFNOT_SEMAPHORE') {
        ifObj.condition = match[1];
        ifObj.negated = variant.type === 'IFNOT_SEMAPHORE';
      } else if (variant.type === 'IF_VARIABLE_EXACT' || variant.type === 'IF_VARIABLE_MIN' || variant.type === 'IF_VARIABLE_MAX') {
        ifObj.variable = match[1];
        ifObj.value = parseInt(match[2]);
      } else if (variant.type === 'IF_CREDITS' || variant.type === 'IF_PROBABILITY') {
        ifObj.value = parseInt(match[1]);
      } else if (variant.type === 'IF_ORDER') {
        ifObj.positions = match[1].split(' ').map(p => parseInt(p));
      } else if (variant.systemVar) {
        ifObj.systemVariable = variant.systemVar;
      }
      
      if (elseContent.length > 0) {
        ifObj.elseBranch = elseContent;
      }
      
      return ifObj;
      
    case 'MENU':
      return {
        type: 'MENU',
        options: content
      };
      
    case 'OPT':
      const optObj = {
        type: 'OPT',
        optType: variant.type,
        children: content
      };
      
      if (variant.type === 'OPT_SIMPLE') {
        optObj.text = { EN: match[1] }; // Will be merged with other languages later
      } else {
        optObj.condition = match[1];
        optObj.text = { EN: match[2] };
      }
      
      return optObj;
      
    case 'BUILD':
    case 'FLIGHT':
      return {
        type: blockName,
        phase: phase.phase,
        children: content
      };
      
    default:
      return {
        type: 'UNKNOWN_BLOCK',
        name: blockName,
        children: content
      };
  }
}

/**
 * Identifica tipo di COMANDO
 */
function identifyCommand(line) {
  for (const [commandName, commandDef] of Object.entries(COMMAND_CATALOG)) {
    const match = line.match(commandDef.pattern);
    if (match) {
      return { commandName, commandDef, match };
    }
  }
  return null;
}

/**
 * Parser comando atomico
 */
function parseCommand(line, commandMatch, language, lineIndex) {
  const { commandName, commandDef, match } = commandMatch;
  
  try {
    const commandObject = {
      type: commandName,
      parameters: {}
    };
    
    // Mapping parametri
    if (commandDef.params && match.length > 1) {
      commandDef.params.forEach((paramDef, index) => {
        const paramValue = match[index + 1];
        const [paramName, paramType] = paramDef.split(':');
        
        if (paramType === 'multilingual') {
          commandObject.parameters[paramName] = { [language]: paramValue };
        } else if (paramType === 'number') {
          commandObject.parameters[paramName] = parseInt(paramValue);
        } else if (paramType === 'complex') {
          commandObject.parameters[paramName] = paramValue;
          if (commandDef.example) {
            commandObject.example = commandDef.example;
          }
        } else {
          commandObject.parameters[paramName] = paramValue;
        }
      });
    }
    
    return {
      nextIndex: lineIndex + 1,
      object: commandObject,
      error: null
    };
  } catch (error) {
    return {
      nextIndex: lineIndex + 1,
      object: null,
      error: `Command parse error at line ${lineIndex + 1}: ${error.message}`
    };
  }
}

/**
 * Parser comando generico per comandi non riconosciuti
 */
function parseGenericCommand(line, lineIndex) {
  const parts = line.split(' ');
  const commandName = parts[0];
  const parameters = parts.slice(1).join(' ');
  
  return {
    nextIndex: lineIndex + 1,
    object: {
      type: 'UNKNOWN_COMMAND',
      name: commandName,
      parameters: { raw: parameters }
    },
    error: `Unknown command: ${commandName} at line ${lineIndex + 1}`
  };
}

/**
 * Serializer bidirezionale - BLOCKS to TEXT
 */
function convertBlocksToScript(blocks) {
  if (!Array.isArray(blocks)) {
    throw new Error('Blocks must be an array');
  }
  
  return blocks.map(block => serializeElement(block)).join('\\n');
}

/**
 * Serializza elemento singolo
 */
function serializeElement(element) {
  if (!element || !element.type) {
    return '';
  }
  
  switch (element.type) {
    case 'SCRIPT':
      const scriptLines = [`SCRIPT ${element.name}`];
      if (element.children) {
        scriptLines.push(...element.children.map(child => serializeElement(child)));
      }
      scriptLines.push('END_OF_SCRIPTS');
      return scriptLines.join('\\n');
      
    case 'MISSION':
      const missionLines = [`MISSION ${element.name}`];
      if (element.children) {
        missionLines.push(...element.children.map(child => serializeElement(child)));
      }
      if (element.finishSection) {
        missionLines.push('FINISH_MISSION');
        missionLines.push(...element.finishSection.map(child => serializeElement(child)));
      }
      missionLines.push('END_OF_MISSION');
      return missionLines.join('\\n');
      
    case 'IF':
      return serializeIfBlock(element);
      
    case 'MENU':
      const menuLines = ['MENU'];
      if (element.options) {
        menuLines.push(...element.options.map(opt => serializeElement(opt)));
      }
      menuLines.push('END_OF_MENU');
      return menuLines.join('\\n');
      
    case 'OPT':
      return serializeOptBlock(element);
      
    case 'BUILD':
    case 'FLIGHT':
      const phaseCommand = getPhaseCommand(element.type, element.phase);
      const phaseLines = [phaseCommand];
      if (element.children) {
        phaseLines.push(...element.children.map(child => serializeElement(child)));
      }
      return phaseLines.join('\\n');
      
    default:
      return serializeCommand(element);
  }
}

/**
 * Serializza blocco IF
 */
function serializeIfBlock(ifElement) {
  const lines = [];
  
  // Comando apertura IF
  const ifCommand = buildIfCommand(ifElement);
  lines.push(ifCommand);
  
  // Contenuto then
  if (ifElement.thenBranch) {
    lines.push(...ifElement.thenBranch.map(child => serializeElement(child)));
  }
  
  // Contenuto else
  if (ifElement.elseBranch && ifElement.elseBranch.length > 0) {
    lines.push('ELSE');
    lines.push(...ifElement.elseBranch.map(child => serializeElement(child)));
  }
  
  lines.push('END_OF_IF');
  return lines.join('\\n');
}

/**
 * Costruisce comando IF in base al tipo
 */
function buildIfCommand(ifElement) {
  switch (ifElement.ifType) {
    case 'IF_SEMAPHORE':
      return `IF ${ifElement.condition}`;
    case 'IFNOT_SEMAPHORE':
      return `IFNOT ${ifElement.condition}`;
    case 'IF_VARIABLE_EXACT':
      return `IF_IS ${ifElement.variable} ${ifElement.value}`;
    case 'IF_VARIABLE_MIN':
      return `IF_MIN ${ifElement.variable} ${ifElement.value}`;
    case 'IF_VARIABLE_MAX':
      return `IF_MAX ${ifElement.variable} ${ifElement.value}`;
    case 'IF_CREDITS':
      return `IF_HAS_CREDITS ${ifElement.value}`;
    case 'IF_PROBABILITY':
      return `IF_PROB ${ifElement.value}`;
    case 'IF_ORDER':
      return `IF_ORDER ${ifElement.positions.join(' ')}`;
    case 'IF_SYSTEM':
      return getSystemIfCommand(ifElement.systemVariable);
    default:
      return `IF ${ifElement.condition || 'UNKNOWN'}`;
  }
}

/**
 * Comandi IF di sistema
 */
function getSystemIfCommand(systemVar) {
  switch (systemVar) {
    case 'debug': return 'IF_DEBUG';
    case 'from_campaign': return 'IF_FROM_CAMPAIGN';
    case 'mission_won': return 'IF_MISSION_WON';
    case 'tutorial_seen': return 'IF_TUTORIAL_SEEN';
    default: return `IF_${systemVar.toUpperCase()}`;
  }
}

/**
 * Serializza blocco OPT
 */
function serializeOptBlock(optElement) {
  const lines = [];
  
  // Comando apertura OPT
  let optCommand;
  switch (optElement.optType) {
    case 'OPT_SIMPLE':
      optCommand = `OPT "${getTextForLanguage(optElement.text, 'EN')}"`;
      break;
    case 'OPT_CONDITIONAL':
      optCommand = `OPT_IF ${optElement.condition} "${getTextForLanguage(optElement.text, 'EN')}"`;
      break;
    case 'OPT_CONDITIONAL_NOT':
      optCommand = `OPT_IFNOT ${optElement.condition} "${getTextForLanguage(optElement.text, 'EN')}"`;
      break;
    default:
      optCommand = `OPT "${getTextForLanguage(optElement.text, 'EN')}"`;
  }
  
  lines.push(optCommand);
  
  // Contenuto OPT
  if (optElement.children) {
    lines.push(...optElement.children.map(child => serializeElement(child)));
  }
  
  lines.push('END_OF_OPT');
  return lines.join('\\n');
}

/**
 * Ottiene comando fase per BUILD/FLIGHT
 */
function getPhaseCommand(blockType, phase) {
  if (blockType === 'BUILD') {
    switch (phase) {
      case 'init': return 'INIT_BUILD';
      case 'start': return 'START_BUILDING';
      case 'end': return 'END_BUILDING';
      default: return 'INIT_BUILD';
    }
  } else if (blockType === 'FLIGHT') {
    switch (phase) {
      case 'init': return 'INIT_FLIGHT';
      case 'start': return 'START_FLIGHT';
      case 'evaluate': return 'EVALUATE_FLIGHT';
      case 'end': return 'END_FLIGHT';
      default: return 'INIT_FLIGHT';
    }
  }
  return 'UNKNOWN_PHASE';
}

/**
 * Serializza comando atomico
 */
function serializeCommand(element) {
  if (element.type === 'UNKNOWN_COMMAND') {
    return `${element.name} ${element.parameters.raw || ''}`.trim();
  }
  
  const commandDef = COMMAND_CATALOG[element.type];
  if (!commandDef) {
    return `${element.type} ${JSON.stringify(element.parameters)}`;
  }
  
  // Ricostruzione comando da parametri
  const parts = [element.type];
  
  if (commandDef.params && element.parameters) {
    commandDef.params.forEach(paramDef => {
      const [paramName, paramType] = paramDef.split(':');
      const paramValue = element.parameters[paramName];
      
      if (paramType === 'multilingual') {
        parts.push(`"${getTextForLanguage(paramValue, 'EN')}"`);
      } else {
        parts.push(paramValue);
      }
    });
  }
  
  return parts.join(' ');
}

/**
 * Ottiene testo per lingua specifica
 */
function getTextForLanguage(textObj, language) {
  if (typeof textObj === 'string') return textObj;
  if (typeof textObj === 'object' && textObj !== null) {
    return textObj[language] || textObj['EN'] || Object.values(textObj)[0] || '';
  }
  return '';
}

module.exports = {
  parseScriptToBlocks,
  convertBlocksToScript,
  BLOCK_CATALOG,
  COMMAND_CATALOG
};
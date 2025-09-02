// blockParser.js - Parser completo bidirezionale per script e mission
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
      { pattern: /^IfMissionResultIs\s+(-?\d+)$/, type: 'IF_MISSION_RESULT_EXACT' },
      { pattern: /^IFMISSIONRESULTIS\s+(-?\d+)$/, type: 'IF_MISSION_RESULT_EXACT' },
      { pattern: /^IfMissionResultMin\s+(-?\d+)$/, type: 'IF_MISSION_RESULT_MIN' },
      { pattern: /^IFMISSIONRESULTMIN\s+(-?\d+)$/, type: 'IF_MISSION_RESULT_MIN' }
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
    type: 'MISSION_BUILD_BLOCK',
    openPattern: /^INIT_BUILD$/,
    closePattern: /^END_BUILDING$/,
    phaseMarkers: {
      start: /^START_BUILDING$/
    },
    parentMustBe: 'MISSION',
    canContain: ['ALL'],
    structure: { blockInit: 'array', blockStart: 'array' }
  },
  
  'FLIGHT': {
    type: 'MISSION_FLIGHT_BLOCK', 
    openPattern: /^INIT_FLIGHT$/,
    closePattern: /^END_FLIGHT$/,
    phaseMarkers: {
      start: /^START_FLIGHT$/,
      evaluate: /^EVALUATE_FLIGHT$/
    },
    parentMustBe: 'MISSION',
    canContain: ['ALL'],
    structure: { blockInit: 'array', blockStart: 'array', blockEvaluate: 'array' }
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
  // Reso case-insensitive, esteso a tutte le posizioni note e con immagine opzionale (terzo parametro)
  'SHOWCHAR': { params: ['character', 'position:enum', 'image'], pattern: /^ShowChar\s+(\w+)\s+(left|center|right|top|bottom|lefttop|leftbottom|righttop|rightbottom)(?:\s+(?:"(.+)"|(\S+)))?$/i },
  'HIDECHAR': { params: ['character'], pattern: /^HideChar\s+(\w+)$/ },
  'CHANGECHAR': { params: ['character', 'image'], pattern: /^ChangeChar\s+(\w+)\s+(?:"(.+)"|(\S+))$/ },
  'FOCUSCHAR': { params: ['character'], pattern: /^FocusChar\s+(\w+)$/i },
  
  // FINESTRA DIALOGO
  'SHOWDLGSCENE': { params: [], pattern: /^ShowDlgScene$/ },
  'HIDEDLGSCENE': { params: [], pattern: /^HideDlgScene$/ },
  
  // VARIABILI/SEMAFORI
  'SET': { params: ['semaphore'], pattern: /^SET\s+(\w+)$/ },
  'RESET': { params: ['semaphore'], pattern: /^RESET\s+(\w+)$/ },
  'SET_TO': { params: ['variable', 'value:number'], pattern: /^SET_TO\s+(\w+)\s+(\d+)$/i },
  'ADD': { params: ['variable', 'value:number'], pattern: /^ADD\s+(\w+)\s+(\d+)$/i },
  
  // CONTROLLO FLUSSO
  'LABEL': { params: ['name'], pattern: /^LABEL\s+(\w+)$/i },
  'GO': { params: ['label'], pattern: /^GO\s+(\w+)$/i },
  'SUB_SCRIPT': { params: ['script:string'], pattern: /^SUB_SCRIPT\s+(\w+)$/i },
  'RETURN': { params: [], pattern: /^RETURN$/i },
  'EXIT_MENU': { params: [], pattern: /^EXIT_MENU$/i },
  'DELAY': { params: ['duration:number'], pattern: /^DELAY\s+(\d+)$/i },
  
  // MAPPA/NAVIGAZIONE
  'SHOWPATH': { params: ['route'], pattern: /^ShowPath\s+(.+)$/ },
  'HIDEPATH': { params: ['route'], pattern: /^HidePath\s+(.+)$/i },
  'HIDEALLPATHS': { params: ['node1', 'node2'], pattern: /^HIDEALLPATHS\s+(\w+)\s+(\w+)$/i },
  'SHOWNODE': { params: ['node'], pattern: /^ShowNode\s+(.+)$/i },
  'HIDENODE': { params: ['node'], pattern: /^HIDENODE\s+(.+)$/i },
  'SHOWBUTTON': { params: ['button'], pattern: /^ShowButton\s+(\w+)$/i },
  'HIDEBUTTON': { params: ['button'], pattern: /^HideButton\s+(\w+)$/i },
  'CENTERMAPBYNODE': { params: ['node'], pattern: /^CenterMapByNode\s+(\w+)$/i },
  'CENTERMAPBYPATH': { params: ['route'], pattern: /^CenterMapByPath\s+(.+)$/i },
  'MOVEPLAYERTONODE': { params: ['node'], pattern: /^MOVEPLAYERTONODE\s+(\w+)$/i },
  
  // MISSION MANAGEMENT  
  'ADDOPPONENT': { params: ['character'], pattern: /^AddOpponent\s+([\w-]+)$/ },
  'ACT_MISSION': { params: ['mission'], pattern: /^ACT_MISSION\s+([\w-]+)$/ },
  'ADDOPPONENTSCREDITS': { params: ['index:number', 'credits:number'], pattern: /^AddOpponentsCredits\s+(\d+)\s+(-?\d+)$/ },
  'MODIFYOPPONENTSBUILDSPEED': { params: ['percentage:number'], pattern: /^ModifyOpponentsBuildSpeed\s+(\d+)$/i },
  'SETSHIPTYPE': { params: ['type'], pattern: /^SetShipType\s+([\w-]+)$/ },
  'SETDECKPREPARATIONSCRIPT': { params: ['script:string'], pattern: /^SetDeckPreparationScript\s+"?(\w+)"?$/ },
  'SETFLIGHTDECKPREPARATIONSCRIPT': { params: ['script:string'], pattern: /^SetFlightDeckPreparationScript\s+"?(\w+)"?$/i },
  'SETTURNBASED': { params: [], pattern: /^SetTurnBased$/ },
  
  // CREDITI
  'ADDCREDITS': { params: ['amount:number'], pattern: /^AddCredits\s+(-?\d+)$/i },
  'SETCREDITS': { params: ['amount:number'], pattern: /^SetCredits\s+(-?\d+)$/ },
  'ADDMISSIONCREDITS': { params: ['amount:number'], pattern: /^AddMissionCredits\s+(-?\d+)$/ },
  'ADDMISSIONCREDITSBYRESULT': { params: [], pattern: /^AddMissionCreditsByResult$/i },
  'SUBOPPONENTCREDITSBYRESULT': { params: [], pattern: /^SubOpponentCreditsByResult$/i },
  
  // FOCUS E UI
  'SETFOCUS': { params: ['button'], pattern: /^SetFocus\s+(\w+)$/i },
  'RESETFOCUS': { params: ['button'], pattern: /^ResetFocus\s+(\w+)$/i },
  'SETFOCUSIFCREDITS': { params: ['button', 'credits:number'], pattern: /^SETFOCUSIFCREDITS\s+(\w+)\s+(\d+)$/i },
  'SETNODEKNOWN': { params: ['node'], pattern: /^SETNODEKNOWN\s+(\w+)$/i },
  'ADDINFOWINDOW': { params: ['image'], pattern: /^AddInfoWindow\s+(?:"(.+)"|(\S+))$/i },
  'SHOWINFOWINDOW': { params: ['image'], pattern: /^SHOWINFOWINDOW\s+(?:"(.+)"|(\S+))$/i },
  
  // ACHIEVEMENTS
  'SETACHIEVEMENTPROGRESS': { params: ['achievement', 'value:number'], pattern: /^SetAchievementProgress\s+([\w_]+)\s+(\d+)$/i },
  'SETACHIEVEMENTATTEMPT': { params: ['achievement', 'value:number'], pattern: /^SetAchievementAttempt\s+([\w_]+)\s+(\d+)$/i },
  'UNLOCKACHIEVEMENT': { params: ['achievement'], pattern: /^UnlockAchievement\s+([\w_]+)$/i },
  'UNLOCKSHIPPLAN': { params: ['plan'], pattern: /^UnlockShipPlan\s+"?([^"]+)"?$/i },
  'UNLOCKSHUTTLES': { params: [], pattern: /^UnlockShuttles$/i },
  
  // HELP SCRIPTS
  'BUILDINGHELPSCRIPT': { params: ['value:number', 'script:string'], pattern: /^BuildingHelpScript\s+(\d+)\s+"?([\\/\w-]+)"?$/i },
  'FLIGHTHELPSCRIPT': { params: ['script:string'], pattern: /^FlightHelpScript\s+"?(\w+)"?$/ },
  'ALIENHELPSCRIPT': { params: ['script:string'], pattern: /^AlienHelpScript\s+"?(\w+)"?$/ },
  
  // MISSION STATUS
  'SETMISSIONASFAILED': { params: [], pattern: /^SetMissionAsFailed$/ },
  'SETMISSIONASCOMPLETED': { params: [], pattern: /^SetMissionAsCompleted$/ },
  'ALLSHIPSGIVEUP': { params: [], pattern: /^AllShipsGiveUp$/ },
  'GIVEUPFLIGHT': { params: [], pattern: /^GiveUpFlight$/ },
  'SETSPECCONDITION': { params: ['condition:string'], pattern: /^SetSpecCondition\s+"?(\w+)"?$/ },
  
  // STATO
  'SAVESTATE': { params: [], pattern: /^SAVESTATE$/i },
  'LOADSTATE': { params: [], pattern: /^LOADSTATE$/i },
  'ADDNODE': { params: ['node'], pattern: /^ADDNODE\s+(\w+)$/i },
  'QUITCAMPAIGN': { params: [], pattern: /^QUITCAMPAIGN$/i },
  
  // PARAMETRI COMPLESSI (gestiti come stringa unica)
  'ADDPARTTOSHIP': { params: ['params:complex'], pattern: /^AddPartToShip\s+(.+)$/i, example: '1 7 alienEngine 3333 0' },
  'ADDPARTTOASIDESLOT': { params: ['params:complex'], pattern: /^AddPartToAsideSlot\s+(.+)$/i, example: 'alienGun 2 1 2 0' },
  'SETADVPILE': { params: ['params:complex'], pattern: /^SetAdvPile\s+(.+)$/i, example: '1 3' },
  'SETSECRETADVPILE': { params: ['params:complex'], pattern: /^SetSecretAdvPile\s+(.+)$/i, example: '2 1' },
  'ADDSHIPPARTS': { params: ['params:string'], pattern: /^AddShipParts\s+(.+)$/i, example: 'parts/allParts.yaml' },
  'SHOWHELPIMAGE': { params: ['params:complex'], pattern: /^SHOWHELPIMAGE\s+(.+)$/i, example: '40 50 70 campaign/tutorial-purple.png' },

  // DECK MANAGEMENT (gestiti principalmente come stringa unica per massima compatibilità)
  'DECKADDCARDTYPE': { params: ['params:complex'], pattern: /^DeckAddCardType\s+(.+)$/i },
  'DECKADDALLCARDS': { params: [], pattern: /^DeckAddAllCards$/i },
  'DECKADDCARDROUND': { params: ['params:complex'], pattern: /^DeckAddCardRound\s+(.+)$/i },
  'DECKADDRULEPOSITION': { params: ['params:complex'], pattern: /^DeckAddRulePosition\s+(.+)$/i },
  'DECKADDRULERANGE': { params: ['params:complex'], pattern: /^DeckAddRuleRange\s+(.+)$/i },
  'DECKSHUFFLE': { params: [], pattern: /^DeckShuffle$/i },
  'SETSUPERCARDSCNT': { params: ['params:complex'], pattern: /^SetSuperCardsCnt\s+(.+)$/i }
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
  let isInElseBranch = false; // Indica se stiamo raccogliendo nel ramo else
  let currentPhase = 'init'; // Per BUILD e FLIGHT: fase corrente (init, start, evaluate)
  let isInFinishSection = false; // Per MISSION: indica se siamo dopo FINISH_MISSION
  
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
          // Reset fase per BUILD e FLIGHT
          if (blockMatch.blockName === 'BUILD' || blockMatch.blockName === 'FLIGHT') {
            currentPhase = 'init';
          }
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
      
      // Controlla se è ELSE (elemento strutturale speciale)
      if (line.match(/^ELSE$/)) {
        if (parserCount > 0) {
          // STO RACCOGLIENDO - AGGIUNGO ALL'ARRAY TEMPORANEO
          parserData.push(line);
        } else {
          // ELSE del mio blocco corrente - switch al ramo else
          if (currentBlock && currentBlock.type === 'IF') {
            isInElseBranch = true;
          }
        }
        currentIndex++;
        continue;
      }
      
      // Controlla se è FINISH_MISSION (per blocchi MISSION)
      if (line.match(/^FINISH_MISSION$/)) {
        if (parserCount > 0) {
          // STO RACCOGLIENDO - AGGIUNGO ALL'ARRAY TEMPORANEO
          parserData.push(line);
        } else if (currentBlock && currentBlock.type === 'MISSION') {
          // FINISH_MISSION del mio blocco MISSION
          isInFinishSection = true;
          if (!currentBlock.finishSection) {
            currentBlock.finishSection = [];
          }
        }
        currentIndex++;
        continue;
      }
      
      // Controlla marcatori di fase per BUILD
      if (currentBlock && currentBlock.type === 'BUILD' && parserCount === 0) {
        if (line.match(/^START_BUILDING$/)) {
          currentPhase = 'start';
          currentIndex++;
          continue;
        }
      }
      
      // Controlla marcatori di fase per FLIGHT
      if (currentBlock && currentBlock.type === 'FLIGHT' && parserCount === 0) {
        if (line.match(/^START_FLIGHT$/)) {
          currentPhase = 'start';
          currentIndex++;
          continue;
        }
        if (line.match(/^EVALUATE_FLIGHT$/)) {
          currentPhase = 'evaluate';
          currentIndex++;
          continue;
        }
      }
      
      // Controlla se è la chiusura del MIO blocco corrente
      if (currentBlock && parserCount === 0) {
        const myCloseMatch = identifyCloseElement(line, currentBlock.type);
        if (myCloseMatch) {
          // Il blocco è completo, lo aggiungo al risultato
          result.blocks.push(currentBlock);
          currentBlock = null;
          isInElseBranch = false; // Reset stato ELSE
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
            // Aggiungi al ramo appropriato per blocchi IF
            if (currentBlock && currentBlock.type === 'IF') {
              if (isInElseBranch) {
                currentBlock.elseBlocks.push(...parserResult.blocks);
                currentBlock.numElse = currentBlock.elseBlocks.length;
              } else {
                currentBlock.thenBlocks.push(...parserResult.blocks);
                currentBlock.numThen = currentBlock.thenBlocks.length;
              }
            } 
            // Gestione BUILD: aggiungi alla fase corrente
            else if (currentBlock && currentBlock.type === 'BUILD') {
              if (currentPhase === 'start') {
                currentBlock.blockStart.push(...parserResult.blocks);
                currentBlock.numBlockStart = currentBlock.blockStart.length;
              } else {
                currentBlock.blockInit.push(...parserResult.blocks);
                currentBlock.numBlockInit = currentBlock.blockInit.length;
              }
            }
            // Gestione FLIGHT: aggiungi alla fase corrente
            else if (currentBlock && currentBlock.type === 'FLIGHT') {
              if (currentPhase === 'evaluate') {
                currentBlock.blockEvaluate.push(...parserResult.blocks);
                currentBlock.numBlockEvaluate = currentBlock.blockEvaluate.length;
              } else if (currentPhase === 'start') {
                currentBlock.blockStart.push(...parserResult.blocks);
                currentBlock.numBlockStart = currentBlock.blockStart.length;
              } else {
                currentBlock.blockInit.push(...parserResult.blocks);
                currentBlock.numBlockInit = currentBlock.blockInit.length;
              }
            }
            // Gestione MISSION: aggiungi a children o finishSection
            else if (currentBlock && currentBlock.type === 'MISSION') {
              if (isInFinishSection) {
                if (!currentBlock.finishSection) {
                  currentBlock.finishSection = [];
                }
                currentBlock.finishSection.push(...parserResult.blocks);
              } else {
                currentBlock.children.push(...parserResult.blocks);
              }
            } 
            else {
              currentBlock.children.push(...parserResult.blocks);
            }
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
          // Aggiungi al ramo appropriato per blocchi IF
          if (currentBlock.type === 'IF') {
            if (isInElseBranch) {
              currentBlock.elseBlocks.push(commandObj);
              currentBlock.numElse = currentBlock.elseBlocks.length;
            } else {
              currentBlock.thenBlocks.push(commandObj);
              currentBlock.numThen = currentBlock.thenBlocks.length;
            }
          } 
          // Gestione BUILD: aggiungi alla fase corrente
          else if (currentBlock.type === 'BUILD') {
            if (currentPhase === 'start') {
              currentBlock.blockStart.push(commandObj);
              currentBlock.numBlockStart = currentBlock.blockStart.length;
            } else {
              currentBlock.blockInit.push(commandObj);
              currentBlock.numBlockInit = currentBlock.blockInit.length;
            }
          }
          // Gestione FLIGHT: aggiungi alla fase corrente
          else if (currentBlock.type === 'FLIGHT') {
            if (currentPhase === 'evaluate') {
              currentBlock.blockEvaluate.push(commandObj);
              currentBlock.numBlockEvaluate = currentBlock.blockEvaluate.length;
            } else if (currentPhase === 'start') {
              currentBlock.blockStart.push(commandObj);
              currentBlock.numBlockStart = currentBlock.blockStart.length;
            } else {
              currentBlock.blockInit.push(commandObj);
              currentBlock.numBlockInit = currentBlock.blockInit.length;
            }
          }
          // Gestione MISSION: aggiungi a children o finishSection
          else if (currentBlock.type === 'MISSION') {
            if (isInFinishSection) {
              if (!currentBlock.finishSection) {
                currentBlock.finishSection = [];
              }
              currentBlock.finishSection.push(commandObj);
            } else {
              currentBlock.children.push(commandObj);
            }
          }
          else {
            currentBlock.children.push(commandObj);
          }
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
    'OPT': /^END_OF_OPT$/,
    'BUILD': /^END_BUILDING$/,
    'FLIGHT': /^END_FLIGHT$/
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
    line: lineNumber
  };
  
  // Solo i blocchi non-IF hanno children
  if (blockName !== 'IF') {
    baseBlock.children = [];
  }
  
  switch (blockName) {
    case 'SCRIPT':
      baseBlock.name = match[1];
      break;
    case 'MISSION':
      baseBlock.name = match[1];
      break;
    case 'IF':
      // TUTTI i blocchi IF hanno type: 'IF' come richiesto
      baseBlock.type = 'IF';
      baseBlock.ifType = variant?.type || 'IF_SEMAPHORE';
      // Inizializza i rami then e else per TUTTI i tipi di IF
      baseBlock.thenBlocks = [];
      baseBlock.elseBlocks = [];
      baseBlock.numThen = 0;
      baseBlock.numElse = 0;
      
      // Gestione parametri per ciascun tipo di IF
      if (variant?.type === 'IF_SEMAPHORE') {
        baseBlock.ifType = 'IF';
        baseBlock.variabile = match[1];
        baseBlock.valore = null;
      } else if (variant?.type === 'IFNOT_SEMAPHORE') {
        baseBlock.ifType = 'IFNOT';
        baseBlock.variabile = match[1];
        baseBlock.valore = null;
      } else if (variant?.type === 'IF_SYSTEM') {
        // Gestione IF di sistema basati su systemVar
        switch (variant.systemVar) {
          case 'debug':
            baseBlock.ifType = 'IF_DEBUG';
            break;
          case 'mission_won':
            baseBlock.ifType = 'IF_MISSION_WON';
            break;
          case 'from_campaign':
            baseBlock.ifType = 'IF_FROM_CAMPAIGN';
            break;
          case 'tutorial_seen':
            baseBlock.ifType = 'IF_TUTORIAL_SEEN';
            break;
          default:
            baseBlock.ifType = 'IF_SYSTEM';
            break;
        }
        baseBlock.variabile = null;
        baseBlock.valore = null;
      } else if (variant?.type === 'IF_VARIABLE_EXACT') {
        baseBlock.ifType = 'IF_IS';
        baseBlock.variabile = match[1];
        baseBlock.valore = parseInt(match[2]);
      } else if (variant?.type === 'IF_VARIABLE_MIN') {
        baseBlock.ifType = 'IF_MIN';
        baseBlock.variabile = match[1];
        baseBlock.valore = parseInt(match[2]);
      } else if (variant?.type === 'IF_VARIABLE_MAX') {
        baseBlock.ifType = 'IF_MAX';
        baseBlock.variabile = match[1];
        baseBlock.valore = parseInt(match[2]);
      } else if (variant?.type === 'IF_PROBABILITY') {
        baseBlock.ifType = 'IF_PROB';
        baseBlock.variabile = null;
        baseBlock.valore = parseInt(match[1]);
      } else if (variant?.type === 'IF_MISSION_RESULT_EXACT') {
        baseBlock.ifType = 'IFMISSIONRESULTIS';
        baseBlock.variabile = null;
        baseBlock.valore = parseInt(match[1]);
      } else if (variant?.type === 'IF_MISSION_RESULT_MIN') {
        baseBlock.ifType = 'IFMISSIONRESULTMIN';
        baseBlock.variabile = null;
        baseBlock.valore = parseInt(match[1]);
      } else if (variant?.type === 'IF_CREDITS') {
        baseBlock.ifType = 'IF_HAS_CREDITS';
        baseBlock.variabile = null;
        baseBlock.valore = parseInt(match[1]);
      } else if (variant?.type === 'IF_ORDER') {
        baseBlock.ifType = 'IF_ORDER';
        baseBlock.variabile = null;
        // IF_ORDER ha un array di posizioni
        const positions = match[1].split(/\s+/).map(p => parseInt(p));
        baseBlock.valore = positions;
      }
      
      break;
    case 'MENU':
      // Menu non ha parametri iniziali
      break;
    case 'OPT':
      if (variant?.type === 'OPT_SIMPLE') {
        baseBlock.text = match[1];
        baseBlock.optType = 'OPT_SIMPLE';
      } else if (variant?.type === 'OPT_CONDITIONAL') {
        baseBlock.condition = match[1];
        baseBlock.text = match[2];
        baseBlock.optType = 'OPT_CONDITIONAL';
      } else if (variant?.type === 'OPT_CONDITIONAL_NOT') {
        baseBlock.condition = match[1];
        baseBlock.text = match[2];
        baseBlock.optType = 'OPT_CONDITIONAL_NOT';
      }
      break;
      
    case 'BUILD':
      baseBlock.type = 'BUILD';
      baseBlock.blockInit = [];
      baseBlock.blockStart = [];
      baseBlock.numBlockInit = 0;
      baseBlock.numBlockStart = 0;
      delete baseBlock.children; // BUILD non usa children
      break;
      
    case 'FLIGHT':
      baseBlock.type = 'FLIGHT';
      baseBlock.blockInit = [];
      baseBlock.blockStart = [];
      baseBlock.blockEvaluate = [];
      baseBlock.numBlockInit = 0;
      baseBlock.numBlockStart = 0;
      baseBlock.numBlockEvaluate = 0;
      delete baseBlock.children; // FLIGHT non usa children
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
    const result = parseCommand(line, commandMatch, language, lineNumber - 1);
    // Restituisci solo l'oggetto comando, non il wrapper con nextIndex
    return result.object;
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
    return parseCommand(line, commandMatch, language, startIndex);
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
  
  // Per BUILD e FLIGHT: gestione fasi
  let blockInit = [];
  let blockStart = [];
  let blockEvaluate = [];
  let currentPhase = 'init'; // Per BUILD e FLIGHT iniziamo da init
  
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
    
    // Per BUILD e FLIGHT: controllo marcatori di fase
    if ((blockName === 'BUILD' || blockName === 'FLIGHT') && blockDef.phaseMarkers) {
      if (blockDef.phaseMarkers.start && currentLine.match(blockDef.phaseMarkers.start)) {
        logger.info(`${depthId}: [${currentIndex + 1}] 🟡 Phase START found for ${blockName}`);
        currentPhase = 'start';
        currentIndex++;
        continue;
      }
      if (blockDef.phaseMarkers.evaluate && currentLine.match(blockDef.phaseMarkers.evaluate)) {
        logger.info(`${depthId}: [${currentIndex + 1}] 🟡 Phase EVALUATE found for ${blockName}`);
        currentPhase = 'evaluate';
        currentIndex++;
        continue;
      }
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
        // Per BUILD e FLIGHT, aggiungi alla fase corrente
        if (blockName === 'BUILD' || blockName === 'FLIGHT') {
          const phaseName = currentPhase;
          logger.info(`${depthId}: [${currentIndex + 1}] 📝 Adding element ${element.object.type} to ${phaseName} phase of ${blockName}`);
          if (currentPhase === 'init') {
            blockInit.push(element.object);
          } else if (currentPhase === 'start') {
            blockStart.push(element.object);
          } else if (currentPhase === 'evaluate') {
            blockEvaluate.push(element.object);
          }
        } else {
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
  const blockObject = buildBlockObject(blockName, blockDef, match, variant, phase, blockContent, elseContent, finishContent, {
    blockInit,
    blockStart,
    blockEvaluate
  });
  
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
function buildBlockObject(blockName, blockDef, match, variant, phase, content, elseContent, finishContent, phaseContent = {}) {
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
      return {
        type: 'BUILD',
        blockInit: phaseContent.blockInit || [],
        blockStart: phaseContent.blockStart || [],
        numBlockInit: (phaseContent.blockInit || []).length,
        numBlockStart: (phaseContent.blockStart || []).length
      };
      
    case 'FLIGHT':
      return {
        type: 'FLIGHT',
        blockInit: phaseContent.blockInit || [],
        blockStart: phaseContent.blockStart || [],
        blockEvaluate: phaseContent.blockEvaluate || [],
        numBlockInit: (phaseContent.blockInit || []).length,
        numBlockStart: (phaseContent.blockStart || []).length,
        numBlockEvaluate: (phaseContent.blockEvaluate || []).length
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
        let paramValue = match[index + 1];
        const [paramName, paramType] = paramDef.split(':');
        
        // Gestione speciale per comandi che supportano sia con che senza virgolette
        if ((commandName === 'ADDINFOWINDOW' || commandName === 'SHOWINFOWINDOW') && index === 0) {
          // Il pattern ha due gruppi: uno per con virgolette, uno per senza
          // match[1] è per con virgolette, match[2] è per senza
          paramValue = match[1] || match[2];
        }
        // SHOWCHAR ha il parametro image opzionale come terzo parametro con doppio gruppo
        else if (commandName === 'SHOWCHAR' && index === 2 && paramName === 'image') {
          // match[3] è per con virgolette, match[4] è per senza
          paramValue = match[3] || match[4] || undefined;
        }
        // CHANGECHAR ha il parametro image come secondo parametro con doppio gruppo
        else if (commandName === 'CHANGECHAR' && index === 1 && paramName === 'image') {
          // match[2] è per con virgolette, match[3] è per senza
          paramValue = match[2] || match[3];
        }
        
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
    
    // Alias e normalizzazioni post-mapping
    if (commandName === 'UNLOCKSHIPPLAN') {
      // Normalizza: esponi anche 'shipPlan' come alias di 'plan'
      if (commandObject.parameters && commandObject.parameters.plan && commandObject.parameters.shipPlan === undefined) {
        commandObject.parameters.shipPlan = commandObject.parameters.plan;
      }
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
function convertBlocksToScript(blocks, targetLanguage = null) {
  if (!Array.isArray(blocks)) {
    throw new Error('Blocks must be an array');
  }
  
  // Se il primo blocco è SCRIPT e l'ultimo è END_OF_SCRIPTS, serializza normalmente
  // Altrimenti aggiungi wrapper SCRIPTS/END_OF_SCRIPTS
  const hasScriptsWrapper = blocks.length > 0 && 
    blocks[blocks.length - 1].type === 'END_OF_SCRIPTS';
  
  if (hasScriptsWrapper) {
    // Già ha la struttura corretta, serializza direttamente
    return blocks.map(block => serializeElement(block, targetLanguage)).filter(line => line).join('\n');
  } else {
    // Aggiungi wrapper SCRIPTS/END_OF_SCRIPTS
    const lines = ['SCRIPTS'];
    blocks.forEach(block => {
      const serialized = serializeElement(block, targetLanguage);
      if (serialized) lines.push(serialized);
    });
    lines.push('END_OF_SCRIPTS');
    return lines.join('\n');
  }
}

/**
 * Serializza elemento singolo
 */
function serializeElement(element, targetLanguage = null) {
  if (!element || !element.type) {
    return '';
  }
  
  
  switch (element.type) {
    case 'SCRIPT':
      const scriptLines = [`SCRIPT ${element.scriptName || element.name || ''}`];
      if (element.children) {
        element.children.forEach(child => {
          const childLines = serializeElement(child, targetLanguage).split('\n');
          childLines.forEach(line => {
            if (line.trim()) scriptLines.push(`  ${line}`); // Aggiungi indentazione di 2 spazi
          });
        });
      }
      scriptLines.push('END_OF_SCRIPT');
      return scriptLines.join('\n');
    
    case 'END_OF_SCRIPTS':
      return 'END_OF_SCRIPTS';
      
    case 'MISSION':
      const missionLines = [`MISSION ${element.name}`];
      if (element.children) {
        element.children.forEach(child => {
          const childLines = serializeElement(child, targetLanguage).split('\n');
          childLines.forEach(line => {
            if (line.trim()) missionLines.push(`  ${line}`); // Aggiungi indentazione di 2 spazi
          });
        });
      }
      if (element.finishSection) {
        missionLines.push('FINISH_MISSION');
        element.finishSection.forEach(child => {
          const childLines = serializeElement(child, targetLanguage).split('\n');
          childLines.forEach(line => {
            if (line.trim()) missionLines.push(`  ${line}`); // Aggiungi indentazione di 2 spazi
          });
        });
      }
      missionLines.push('END_OF_MISSION');
      return missionLines.join('\n');
      
    case 'IF':
      // Supporta sia il nuovo formato (thenBlocks/elseBlocks) che il vecchio (thenBranch/elseBranch)
      if (!element.thenBlocks && element.thenBranch) {
        element.thenBlocks = element.thenBranch;
      }
      if (!element.elseBlocks && element.elseBranch) {
        element.elseBlocks = element.elseBranch;
      }
      return serializeIfBlock(element, targetLanguage);
      
    case 'MENU':
      const menuLines = ['MENU'];
      // Supporta sia 'options' (legacy) che 'children' (nuovo formato)
      const menuContent = element.options || element.children || [];
      if (menuContent.length > 0) {
        menuContent.forEach(opt => {
          const optLines = serializeElement(opt, targetLanguage).split('\n');
          optLines.forEach(line => {
            if (line.trim()) menuLines.push(`  ${line}`); // Aggiungi indentazione di 2 spazi
          });
        });
      }
      menuLines.push('END_OF_MENU');
      return menuLines.join('\n');
      
    case 'OPT':
      return serializeOptBlock(element, targetLanguage);
      
    case 'BUILD':
      const buildLines = ['INIT_BUILD'];
      if (element.blockInit) {
        element.blockInit.forEach(child => {
          const serialized = serializeElement(child, targetLanguage);
          if (serialized) buildLines.push(serialized);
        });
      }
      buildLines.push('START_BUILDING');
      if (element.blockStart) {
        element.blockStart.forEach(child => {
          const serialized = serializeElement(child, targetLanguage);
          if (serialized) buildLines.push(serialized);
        });
      }
      buildLines.push('END_BUILDING');
      return buildLines.join('\n');
      
    case 'FLIGHT':
      const flightLines = ['INIT_FLIGHT'];
      if (element.blockInit) {
        element.blockInit.forEach(child => {
          const serialized = serializeElement(child, targetLanguage);
          if (serialized) flightLines.push(serialized);
        });
      }
      flightLines.push('START_FLIGHT');
      if (element.blockStart) {
        element.blockStart.forEach(child => {
          const serialized = serializeElement(child, targetLanguage);
          if (serialized) flightLines.push(serialized);
        });
      }
      flightLines.push('EVALUATE_FLIGHT');
      if (element.blockEvaluate) {
        element.blockEvaluate.forEach(child => {
          const serialized = serializeElement(child, targetLanguage);
          if (serialized) flightLines.push(serialized);
        });
      }
      flightLines.push('END_FLIGHT');
      return flightLines.join('\n');
      
    default:
      return serializeCommand(element, targetLanguage);
  }
}

/**
 * Serializza blocco IF
 */
function serializeIfBlock(ifElement, targetLanguage = 'EN') {
  const lines = [];
  
  // Comando apertura IF
  const ifCommand = buildIfCommand(ifElement);
  lines.push(ifCommand);
  
  // Contenuto then - usa thenBlocks
  const thenContent = ifElement.thenBlocks || [];
  if (thenContent.length > 0) {
    thenContent.forEach(child => {
      const childLines = serializeElement(child, targetLanguage).split('\n');
      childLines.forEach(line => {
        if (line.trim()) lines.push(`  ${line}`); // Aggiungi indentazione di 2 spazi
      });
    });
  }
  
  // Contenuto else
  if (ifElement.elseBlocks && ifElement.elseBlocks.length > 0) {
    lines.push('ELSE');
    ifElement.elseBlocks.forEach(child => {
      const childLines = serializeElement(child, targetLanguage).split('\n');
      childLines.forEach(line => {
        if (line.trim()) lines.push(`  ${line}`); // Aggiungi indentazione di 2 spazi
      });
    });
  }
  
  lines.push('END_OF_IF');
  return lines.join('\n');
}

/**
 * Costruisce comando IF in base al tipo
 */
function buildIfCommand(ifElement) {
  switch (ifElement.ifType) {
    case 'IF':
      return `IF ${ifElement.variabile}`;
    case 'IFNOT':
      return `IFNOT ${ifElement.variabile}`;
    case 'IF_DEBUG':
      return 'IF_DEBUG';
    case 'IF_FROM_CAMPAIGN':
      return 'IF_FROM_CAMPAIGN';
    case 'IF_MISSION_WON':
      return 'IF_MISSION_WON';
    case 'IF_TUTORIAL_SEEN':
      return 'IF_TUTORIAL_SEEN';
    case 'IF_IS':
      return `IF_IS ${ifElement.variabile} ${ifElement.valore}`;
    case 'IF_MIN':
      return `IF_MIN ${ifElement.variabile} ${ifElement.valore}`;
    case 'IF_MAX':
      return `IF_MAX ${ifElement.variabile} ${ifElement.valore}`;
    case 'IF_HAS_CREDITS':
      return `IF_HAS_CREDITS ${ifElement.valore}`;
    case 'IF_PROB':
      return `IF_PROB ${ifElement.valore}`;
    case 'IFMISSIONRESULTIS':
      return `IfMissionResultIs ${ifElement.valore}`;
    case 'IFMISSIONRESULTMIN':
      return `IfMissionResultMin ${ifElement.valore}`;
    case 'IF_ORDER':
      // IF_ORDER ha un array di posizioni
      if (Array.isArray(ifElement.valore)) {
        return `IF_ORDER ${ifElement.valore.join(' ')}`;
      }
      return `IF_ORDER ${ifElement.valore}`;
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
function serializeOptBlock(optElement, targetLanguage = 'EN') {
  const lines = [];
  
  // Estrai il testo dell'OPT - supporta diversi formati
  let optText = '';
  if (optElement.text) {
    optText = getTextForLanguage(optElement.text, targetLanguage);
  } else if (optElement.parameters && optElement.parameters.text) {
    optText = getTextForLanguage(optElement.parameters.text, targetLanguage);
  }
  
  // Comando apertura OPT
  let optCommand;
  switch (optElement.optType) {
    case 'OPT_SIMPLE':
      optCommand = `OPT "${optText}"`;
      break;
    case 'OPT_CONDITIONAL':
      optCommand = `OPT_IF ${optElement.condition} "${optText}"`;
      break;
    case 'OPT_CONDITIONAL_NOT':
      optCommand = `OPT_IFNOT ${optElement.condition} "${optText}"`;
      break;
    default:
      optCommand = `OPT "${optText}"`;
  }
  
  lines.push(optCommand);
  
  // Contenuto OPT
  if (optElement.children) {
    optElement.children.forEach(child => {
      const childLines = serializeElement(child, targetLanguage).split('\n');
      childLines.forEach(line => {
        if (line.trim()) lines.push(`  ${line}`); // Aggiungi indentazione di 2 spazi
      });
    });
  }
  
  lines.push('END_OF_OPT');
  return lines.join('\n');
}


// Mapping da tipo comando (maiuscolo) a sintassi corretta del gioco
const COMMAND_SYNTAX_MAP = {
  // Dialog commands
  'SHOWDLGSCENE': 'ShowDlgScene',
  'HIDEDLGSCENE': 'HideDlgScene',
  'SHOWCHAR': 'ShowChar',
  'HIDECHAR': 'HideChar',
  'CHANGECHAR': 'ChangeChar',
  'SAY': 'Say',
  'SAYCHAR': 'SayChar',
  'ASK': 'Ask',
  
  // Map/UI commands
  'SHOWNODE': 'ShowNode',
  'HIDENODE': 'HideNode',
  'SHOWPATH': 'ShowPath',
  'HIDEPATH': 'HidePath',
  'SHOWBUTTON': 'ShowButton',
  'HIDEBUTTON': 'HideButton',
  'SETFOCUS': 'SetFocus',
  'RESETFOCUS': 'ResetFocus',
  'CENTERMAPBYNODE': 'CenterMapByNode',
  'CENTERMAPBYPATH': 'CenterMapByPath',
  'MOVEPLAYERTONODE': 'MovePlayerToNode',
  'ADDNODE': 'AddNode',
  'FOCUSCHAR': 'FocusChar',
  
  // Control flow
  'DELAY': 'Delay',
  'GO': 'GO',
  'LABEL': 'LABEL',
  'RETURN': 'RETURN',
  'SUB_SCRIPT': 'SUB_SCRIPT',
  'EXIT_MENU': 'EXIT_MENU',
  'SET': 'SET',
  'RESET': 'RESET',
  'ADD': 'ADD',
  'ANNOUNCE': 'Announce',
  'ADDCREDITS': 'AddCredits',
  
  // System commands
  'SETACHIEVEMENTPROGRESS': 'SetAchievementProgress',
  'UNLOCKACHIEVEMENT': 'UnlockAchievement',
  'UNLOCKSHIPPLAN': 'UnlockShipPlan',
  
  // Mission commands
  'ADDOPPONENT': 'AddOpponent',
  'SETDECKPREPARATIONSCRIPT': 'SetDeckPreparationScript',
  'SETSPECCONDITION': 'SetSpecCondition',
  'BUILDINGHELPSCRIPT': 'BuildingHelpScript',
  'MODIFYOPPONENTSBUILDSPEED': 'ModifyOpponentsBuildSpeed',
  'SETSHIPTYPE': 'SetShipType',
  'FLIGHTHELPSCRIPT': 'FlightHelpScript',
  'ADDMISSIONCREDITS': 'AddMissionCredits',
  'ADDOPPONENTSCREDITS': 'AddOpponentsCredits',
  'IFMISSIONRESULTIS': 'IfMissionResultIs',
  'IFMISSIONRESULTMIN': 'IfMissionResultMin',
  // Aggiunti i mapping mancanti
  'ASKCHAR': 'AskChar',
  'SETFLIGHTSTATUSBAR': 'SetFlightStatusBar',
  'SET_TO': 'SET_TO',
  'HIDEALLPATHS': 'HideAllPaths',
  'ACT_MISSION': 'ACT_MISSION',
  'SETFLIGHTDECKPREPARATIONSCRIPT': 'SetFlightDeckPreparationScript',
  'SETTURNBASED': 'SetTurnBased',
  'SETCREDITS': 'SetCredits',
  'ADDMISSIONCREDITSBYRESULT': 'AddMissionCreditsByResult',
  'SUBOPPONENTCREDITSBYRESULT': 'SubOpponentCreditsByResult',
  'SETFOCUSIFCREDITS': 'SetFocusIfCredits',
  'SETNODEKNOWN': 'SetNodeKnown',
  'ADDINFOWINDOW': 'AddInfoWindow',
  'SHOWINFOWINDOW': 'ShowInfoWindow',
  'SETACHIEVEMENTATTEMPT': 'SetAchievementAttempt',
  'UNLOCKSHUTTLES': 'UnlockShuttles',
  'ALIENHELPSCRIPT': 'AlienHelpScript',
  'SETMISSIONASFAILED': 'SetMissionAsFailed',
  'SETMISSIONASCOMPLETED': 'SetMissionAsCompleted',
  'ALLSHIPSGIVEUP': 'AllShipsGiveUp',
  'GIVEUPFLIGHT': 'GiveUpFlight',
  'SAVESTATE': 'SaveState',
  'LOADSTATE': 'LoadState',
  'QUITCAMPAIGN': 'QuitCampaign',
  'ADDPARTTOSHIP': 'AddPartToShip',
  'ADDPARTTOASIDESLOT': 'AddPartToAsideSlot',
  'SETADVPILE': 'SetAdvPile',
  'SETSECRETADVPILE': 'SetSecretAdvPile',
  'ADDSHIPPARTS': 'AddShipParts',
  'SHOWHELPIMAGE': 'ShowHelpImage',

  // Deck commands
  'DECKADDCARDTYPE': 'DeckAddCardType',
  'DECKADDALLCARDS': 'DeckAddAllCards',
  'DECKADDCARDROUND': 'DeckAddCardRound',
  'DECKADDRULEPOSITION': 'DeckAddRulePosition',
  'DECKADDRULERANGE': 'DeckAddRuleRange',
  'DECKSHUFFLE': 'DeckShuffle',
  'SETSUPERCARDSCNT': 'SetSuperCardsCnt'
};

/**
 * Serializza comando atomico
 */
function serializeCommand(element, targetLanguage = 'EN') {
  if (element.type === 'UNKNOWN_COMMAND') {
    // Per UNKNOWN_COMMAND usa content o originalLine
    return element.content || element.originalLine || '';
  }
  
  const commandDef = COMMAND_CATALOG[element.type];
  if (!commandDef) {
    return `${element.type} ${JSON.stringify(element.parameters)}`;
  }
  
  // Usa la sintassi corretta del gioco invece del tipo maiuscolo
  const commandSyntax = COMMAND_SYNTAX_MAP[element.type] || element.type;
  const parts = [commandSyntax];
  
  // Gestione parametri - supporta sia element.parameters che campi diretti come element.text
  if (commandDef.params) {
    commandDef.params.forEach(paramDef => {
      const [paramName, paramType] = paramDef.split(':');
      
      // Prima cerca in element.parameters, poi direttamente in element
      let paramValue = element.parameters ? element.parameters[paramName] : undefined;
      // Compatibilità: accetta 'shipPlan' come alias di 'plan'
      if (paramValue === undefined && paramName === 'plan' && element.parameters && element.parameters.shipPlan !== undefined) {
        paramValue = element.parameters.shipPlan;
      }
      if (paramValue === undefined && element[paramName] !== undefined) {
        paramValue = element[paramName];
      }
      
      if (paramValue !== undefined) {
        if (paramType === 'multilingual') {
          // Non processare le virgolette esterne del comando, solo il contenuto
          const processedText = getTextForLanguage(paramValue, targetLanguage);
          parts.push(`"${processedText}"`);
        } else if (typeof paramValue === 'object' && paramValue !== null && !Array.isArray(paramValue)) {
          // Se è un oggetto, potrebbe essere multilingua anche se non marcato
          // Controlla se ha chiavi che sembrano codici lingua
          const hasLangKeys = Object.keys(paramValue).some(key => 
            ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'].includes(key)
          );
          if (hasLangKeys) {
            // È multilingua, usa getTextForLanguage
            const text = getTextForLanguage(paramValue, targetLanguage);
            // Aggiungi virgolette se il parametro sembra essere testo
            if (paramName === 'text' || paramName === 'message' || paramName === 'script') {
              parts.push(`"${text}"`);
            } else {
              parts.push(text);
            }
          } else {
            parts.push(JSON.stringify(paramValue));
          }
        } else {
          // Per parametri stringa che necessitano virgolette
          // NON aggiungere virgolette per: achievement, shiptype, condition, pile, progress, node, image, script
          const noQuoteParams = ['achievement', 'shiptype', 'pile', 'progress', 'node', 'image', 'script'];
          const needQuoteParams = ['path', 'file', 'plan']; // Parametri che necessitano sempre virgolette
          
          // Eccezione: per SetDeckPreparationScript e SetFlightDeckPreparationScript, il parametro 'script' deve SEMPRE essere tra virgolette
          if ((element.type === 'SETDECKPREPARATIONSCRIPT' || element.type === 'SETFLIGHTDECKPREPARATIONSCRIPT') && paramName === 'script') {
            parts.push(`"${paramValue}"`);
          }
          // Eccezione: ADDINFOWINDOW e SHOWINFOWINDOW devono SEMPRE avere virgolette per il parametro 'image'
          else if ((element.type === 'ADDINFOWINDOW' || element.type === 'SHOWINFOWINDOW') && paramName === 'image') {
            parts.push(`"${paramValue}"`);
          } else if ((paramType === 'string' && !noQuoteParams.includes(paramName)) || needQuoteParams.includes(paramName)) {
            parts.push(`"${paramValue}"`);
          } else {
            parts.push(paramValue);
          }
        }
      }
    });
  }
  
  return parts.join(' ');
}

/**
 * Ottiene testo per lingua specifica
 */
function getTextForLanguage(textObj, language) {
  let text = '';
  
  if (typeof textObj === 'string') {
    text = textObj;
  } else if (typeof textObj === 'object' && textObj !== null) {
    text = textObj[language] || textObj['EN'] || Object.values(textObj)[0] || '';
  } else {
    return '';
  }
  
  // Applica trasformazioni al testo
  text = processTextForSerialization(text);
  
  return text;
}

/**
 * Processa il testo per la serializzazione:
 * 1. Sostituisce virgolette dritte INTERNE con virgolette curve
 * 2. Capitalizza vocali accentate all'inizio o dopo punto
 */
function processTextForSerialization(text) {
  if (!text) return text;
  
  // 1. Sostituisce " con virgolette curve (solo quelle interne al testo)
  // Usa " all'apertura e " alla chiusura
  let result = '';
  let quoteCount = 0;
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"') {
      // Sostituisce con U+201C per apertura e U+201D per chiusura
      result += (quoteCount % 2 === 0) ? '\u201C' : '\u201D';
      quoteCount++;
    } else {
      result += text[i];
    }
  }
  
  // 2. Capitalizza vocali accentate all'inizio o dopo punto
  // Mappa vocali accentate minuscole -> maiuscole
  const accentMap = {
    'à': 'À', 'è': 'È', 'é': 'É', 'ì': 'Ì', 'ò': 'Ò', 'ù': 'Ù',
    'á': 'Á', 'í': 'Í', 'ó': 'Ó', 'ú': 'Ú', 
    'â': 'Â', 'ê': 'Ê', 'î': 'Î', 'ô': 'Ô', 'û': 'Û',
    'ä': 'Ä', 'ë': 'Ë', 'ï': 'Ï', 'ö': 'Ö', 'ü': 'Ü',
    'ã': 'Ã', 'õ': 'Õ', 'ñ': 'Ñ'
  };
  
  // Capitalizza SOLO se è veramente una vocale accentata all'inizio
  // Non capitalizzare se c'è già una lettera maiuscola prima
  if (result.length > 0 && accentMap[result[0]]) {
    // Verifica che sia davvero l'inizio di una frase
    result = accentMap[result[0]] + result.substring(1);
  }
  
  // Capitalizza dopo punto e spazio
  for (let i = 2; i < result.length; i++) {
    if (result[i-2] === '.' && result[i-1] === ' ' && accentMap[result[i]]) {
      result = result.substring(0, i) + accentMap[result[i]] + result.substring(i + 1);
    }
  }
  
  return result;
}

module.exports = {
  parseScriptToBlocks,
  convertBlocksToScript,
  serializeElement,
  BLOCK_CATALOG,
  COMMAND_CATALOG
};
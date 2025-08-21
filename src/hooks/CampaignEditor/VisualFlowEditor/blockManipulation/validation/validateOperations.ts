/**
 * Validate Operations Module
 * Funzioni principali per la validazione di inserimento e validazione globale dei blocchi
 */

import { findBlockBeforeContainer } from '../search';
import { validateAskInsertion } from './askValidation';
import { validateContainerNesting } from './containerValidation';
import { validateMenuInsertion, validateOptInsertion, validateMenuContent } from './menuValidation';
import { blockEndsWithAsk } from './blockValidators';
import { validateGoInsertion, hasLabelInScript } from './goValidation';
import { validateBlockParameters } from './parameterValidation';
import { isValidInDialogContext } from './sceneValidation';

/**
 * Valida l'inserimento di un blocco in una posizione specifica
 * Controlla tutte le regole di validazione (ASK consecutivi, MENU dopo ASK, BUILD/FLIGHT nesting, etc.)
 * 
 * @param blockType - Tipo di blocco da inserire
 * @param targetContainer - Container di destinazione
 * @param targetContainerType - Tipo di container
 * @param index - Indice di inserimento (opzionale)
 * @param allBlocks - Tutti i blocchi per ricerche contestuali
 * @returns true se l'inserimento è valido, false altrimenti
 */
export const validateBlockInsertion = (
  blockType: string,
  targetContainer: any,
  targetContainerType: string,
  index?: number,
  allBlocks?: any[]
): boolean => {
  // Validazione ASK consecutivi
  if (blockType === 'ASK') {
    if (!validateAskInsertion(targetContainer, targetContainerType, index)) {
      return false;
    }
  }
  
  // Validazione annidamento BUILD/FLIGHT
  if (!validateContainerNesting(blockType, targetContainer)) {
    return false;
  }
  
  // Validazione specifica per MENU
  if (blockType === 'MENU') {
    if (!validateMenuInsertion(targetContainer, targetContainerType, index, allBlocks)) {
      return false;
    }
  }

  // Validazione per OPT - può essere inserito solo dentro MENU
  if (blockType === 'OPT') {
    if (!validateOptInsertion(targetContainer)) {
      return false;
    }
  }
  
  // Validazione per EXIT_MENU - può essere inserito solo dentro OPT
  if (blockType === 'EXIT_MENU') {
    if (!targetContainer || targetContainer.type !== 'OPT') {
      return false;
    }
  }

  // Validazione per blocchi dentro MENU - solo OPT permessi
  if (!validateMenuContent(targetContainer, blockType)) {
    return false;
  }

  // Validazione per GO - richiede presenza di LABEL
  if (blockType === 'GO') {
    if (allBlocks && !validateGoInsertion(allBlocks)) {
      return false;
    }
  }

  return true;
};

/**
 * Crea una lista flat di tutti i blocchi nell'ordine di esecuzione
 * Considera la struttura annidata: IF (then/else), MENU (opts), BUILD/FLIGHT/MISSION (init/start/evaluate)
 * 
 * @param blocks - Array di blocchi da elaborare
 * @returns Array flat di tutti i blocchi nell'ordine
 */
const createFlatBlockList = (blocks: any[]): any[] => {
  const flatBlocks: any[] = [];
  
  const addBlocksRecursively = (blocks: any[]): void => {
    blocks.forEach(block => {
      flatBlocks.push(block);
      
      // Aggiungi blocchi figli in base al tipo
      if (block.type === 'IF') {
        if (block.thenBlocks) addBlocksRecursively(block.thenBlocks);
        if (block.elseBlocks) addBlocksRecursively(block.elseBlocks);
      } else if (block.type === 'MENU' && block.children) {
        addBlocksRecursively(block.children);
      } else if (block.type === 'OPT' && block.children) {
        addBlocksRecursively(block.children);
      } else if (block.type === 'BUILD') {
        if (block.blockInit) addBlocksRecursively(block.blockInit);
        if (block.blockStart) addBlocksRecursively(block.blockStart);
      } else if (block.type === 'FLIGHT') {
        if (block.blockInit) addBlocksRecursively(block.blockInit);
        if (block.blockStart) addBlocksRecursively(block.blockStart);
        if (block.blockEvaluate) addBlocksRecursively(block.blockEvaluate);
      } else if (block.type === 'MISSION') {
        if (block.blocksMission) addBlocksRecursively(block.blocksMission);
        if (block.blocksFinish) addBlocksRecursively(block.blocksFinish);
      } else if (block.children) {
        addBlocksRecursively(block.children);
      }
    });
  };
  
  addBlocksRecursively(blocks);
  return flatBlocks;
};

/**
 * Valida tutti i blocchi esistenti e conta gli errori
 * Esegue una validazione completa ricorsiva su tutto l'albero dei blocchi
 * CORRETTO: Ora analizza ricorsivamente TUTTI i blocchi inclusi quelli annidati
 * 
 * @param blocks - Array di blocchi da validare
 * @returns Oggetto con numero di errori, blocchi invalidi e dettagli errori
 */
export const validateAllBlocks = (blocks: any[], t?: (key: any) => string, characters?: any[], navigationPath?: any[]): { errors: number; warnings: number; invalidBlocks: string[]; details: any[] } => {
  let errors = 0;
  let warnings = 0;
  const invalidBlocks: string[] = [];
  const errorDetails: any[] = [];
  
  // CORREZIONE CRITICA: Crea una lista flat di TUTTI i blocchi per analisi corretta
  const scriptBlock = blocks.find(b => b.type === 'SCRIPT');
  const missionBlock = blocks.find(b => b.type === 'MISSION');
  
  let allFlatBlocks: any[] = [];
  if (scriptBlock && scriptBlock.children) {
    allFlatBlocks = createFlatBlockList(scriptBlock.children);
  } else if (missionBlock) {
    if (missionBlock.blocksMission) {
      allFlatBlocks = allFlatBlocks.concat(createFlatBlockList(missionBlock.blocksMission));
    }
    if (missionBlock.blocksFinish) {
      allFlatBlocks = allFlatBlocks.concat(createFlatBlockList(missionBlock.blocksFinish));
    }
  } else {
    allFlatBlocks = createFlatBlockList(blocks);
  }
  
  const validateRecursive = (blocks: any[], parentBlock?: any, allRootBlocks?: any[], path: string[] = []): void => {
    blocks.forEach((block, index) => {
      // VALIDAZIONE PARAMETRI: Controlla che i blocchi abbiano i parametri obbligatori valorizzati
  let paramValidation = validateBlockParameters(block, allFlatBlocks, characters) as { valid: boolean; error?: string; severity?: string };

      // Helper: estrai il primo testo disponibile da un oggetto di testi multilingue
      const extractFirstText = (textObj: any): string | null => {
        if (!textObj) return null;
        if (typeof textObj === 'string') return textObj;
        try {
          for (const key of Object.keys(textObj)) {
            const v = textObj[key];
            if (v && typeof v === 'string' && v.trim() !== '') return v;
          }
        } catch (e) {
          return null;
        }
        return null;
      };
      
      // Gestione speciale per RETURN: controlla se siamo al livello root
      if (block.type === 'RETURN' && paramValidation.valid) {
        // Se navigationPath è vuoto o non definito, siamo al livello root
        if (!navigationPath || navigationPath.length === 0) {
          paramValidation = { 
            valid: false,
            error: 'RETURN_AT_ROOT_LEVEL' 
          };
        }
      }
      
  // (helper rimosso: getAnyLanguageText non utilizzato)

    // Gestione speciale per ADDOPPONENT, SETSHIPTYPE (MISSION context) e blocchi di ship parts (BUILD context)
    // Inoltre: SETDECKPREPARATIONSCRIPT e SETFLIGHTDECKPREPARATIONSCRIPT devono stare in MISSION/BUILD/FLIGHT (warning)
  if ((block.type === 'ADDOPPONENT' || block.type === 'SETSHIPTYPE' || block.type === 'FINISH_MISSION' || block.type === 'ADDPARTTOSHIP' || block.type === 'ADDPARTTOASIDESLOT' || block.type === 'ADDSHIPPARTS' || block.type === 'SETADVPILE' || block.type === 'SETSECRETADVPILE' || block.type === 'SETDECKPREPARATIONSCRIPT' || block.type === 'SETFLIGHTDECKPREPARATIONSCRIPT' || block.type === 'SETSPECCONDITION' || block.type === 'SETTURNBASED' || block.type === 'SETMISSIONASFAILED' || block.type === 'SETMISSIONASCOMPLETED' || block.type === 'ALLSHIPSGIVEUP' || block.type === 'GIVEUPFLIGHT' || block.type === 'MODIFYOPPONENTSBUILDSPEED') && paramValidation.valid) {
        // Verifica se siamo dentro un blocco MISSION
        let isInsideMission = false;
        
        // Controlla il path per vedere se c'è un MISSION
        if (path && path.length > 0) {
          isInsideMission = path.some(p => p.includes('MISSION'));
        }
        
        // Se parentBlock esiste, controlla anche quello
        if (!isInsideMission && parentBlock) {
          let currentParent = parentBlock;
          while (currentParent && !isInsideMission) {
            if (currentParent.type === 'MISSION') {
              isInsideMission = true;
            }
            currentParent = currentParent.parent;
          }
        }
        
  // Per ADDPARTTOSHIP, ADDPARTTOASIDESLOT e ADDSHIPPARTS verifica se sono dentro BUILD
  if (block.type === 'ADDPARTTOSHIP' || block.type === 'ADDPARTTOASIDESLOT' || block.type === 'ADDSHIPPARTS' || block.type === 'SETADVPILE' || block.type === 'SETSECRETADVPILE') {
          // Verifica se siamo dentro un blocco BUILD
          let isInsideBuild = false;
          
          // Controlla il path per vedere se c'è un BUILD
          if (path && path.length > 0) {
            isInsideBuild = path.some(p => p.includes('BUILD'));
          }
          
          // Se parentBlock esiste, controlla anche quello
          if (!isInsideBuild && parentBlock) {
            let currentParent = parentBlock;
            while (currentParent && !isInsideBuild) {
              if (currentParent.type === 'BUILD') {
                isInsideBuild = true;
              }
              currentParent = currentParent.parent;
            }
          }
          
          // Se non è dentro BUILD, genera un warning
          if (!isInsideBuild) {
            let errorKey = '';
            if (block.type === 'ADDPARTTOSHIP') {
              errorKey = 'addPartToShipNotInBuild';
            } else if (block.type === 'ADDPARTTOASIDESLOT') {
              errorKey = 'addPartToAsideSlotNotInBuild';
            } else if (block.type === 'ADDSHIPPARTS') {
              errorKey = 'addShipPartsNotInBuild';
            } else if (block.type === 'SETADVPILE') {
              errorKey = 'setAdvPileNotInBuild';
            } else if (block.type === 'SETSECRETADVPILE') {
              errorKey = 'setSecretAdvPileNotInBuild';
            }
            // Explicit severity to help downstream consumers decide warning vs error
            paramValidation = { 
              valid: false,
              error: errorKey,
              severity: 'warning'
            };
          }
  } else if (block.type === 'SETDECKPREPARATIONSCRIPT' || block.type === 'SETFLIGHTDECKPREPARATIONSCRIPT' || block.type === 'SETSPECCONDITION' || block.type === 'SETTURNBASED' || block.type === 'SETMISSIONASFAILED' || block.type === 'SETMISSIONASCOMPLETED' || block.type === 'ALLSHIPSGIVEUP' || block.type === 'GIVEUPFLIGHT' || block.type === 'MODIFYOPPONENTSBUILDSPEED') {
          // Questi due comandi sono validi solo in MISSION, BUILD o FLIGHT
          let isInAllowedContainer = false;
          // Controlla il path
          if (path && path.length > 0) {
            isInAllowedContainer = path.some(p => p.includes('MISSION') || p.includes('BUILD') || p.includes('FLIGHT'));
          }
          // Controlla i parent
          if (!isInAllowedContainer && parentBlock) {
            let currentParent = parentBlock;
            while (currentParent && !isInAllowedContainer) {
              if (currentParent.type === 'MISSION' || currentParent.type === 'BUILD' || currentParent.type === 'FLIGHT') {
                isInAllowedContainer = true;
              }
              currentParent = currentParent.parent;
            }
          }
          if (!isInAllowedContainer) {
            let errorKey = '';
            switch (block.type) {
              case 'SETDECKPREPARATIONSCRIPT':
                errorKey = 'SETDECKPREPARATIONSCRIPT_OUTSIDE_CONTEXT';
                break;
              case 'SETFLIGHTDECKPREPARATIONSCRIPT':
                errorKey = 'SETFLIGHTDECKPREPARATIONSCRIPT_OUTSIDE_CONTEXT';
                break;
              case 'SETSPECCONDITION':
                errorKey = 'SETSPECCONDITION_OUTSIDE_CONTEXT';
                break;
              case 'SETTURNBASED':
                errorKey = 'SETTURNBASED_OUTSIDE_CONTEXT';
                break;
              case 'SETMISSIONASFAILED':
                errorKey = 'SETMISSIONASFAILED_OUTSIDE_CONTEXT';
                break;
              case 'SETMISSIONASCOMPLETED':
                errorKey = 'SETMISSIONASCOMPLETED_OUTSIDE_CONTEXT';
                break;
              case 'ALLSHIPSGIVEUP':
                errorKey = 'ALLSHIPSGIVEUP_OUTSIDE_CONTEXT';
                break;
              case 'GIVEUPFLIGHT':
                errorKey = 'GIVEUPFLIGHT_OUTSIDE_CONTEXT';
                break;
              case 'MODIFYOPPONENTSBUILDSPEED':
                errorKey = 'MODIFYOPPONENTSBUILDSPEED_OUTSIDE_CONTEXT';
                break;
            }
            paramValidation = {
              valid: false,
              error: errorKey,
              severity: 'warning'
            };
          }
        } else {
      // Se non è dentro MISSION (per ADDOPPONENT, SETSHIPTYPE e FINISH_MISSION), genera un warning
          if (!isInsideMission) {
            let errorKey = '';
            if (block.type === 'ADDOPPONENT') errorKey = 'ADDOPPONENT_NOT_IN_MISSION';
            else if (block.type === 'SETSHIPTYPE') errorKey = 'SETSHIPTYPE_NOT_IN_MISSION';
        else if (block.type === 'FINISH_MISSION') errorKey = 'finishMissionNotInMission';

            // Mark these contextual problems as warnings explicitly
            paramValidation = { 
              valid: false,
              error: errorKey,
              severity: 'warning'
            };
          }
        }
      }
      if (!paramValidation.valid) {
        // Determina se è un warning o error
  const isWarning = [
          'SHOWCHAR_NO_SCENE',
          'HIDECHAR_NO_SCENE', 
          'HIDECHAR_NO_VISIBLE_CHARACTERS',
          'HIDECHAR_CHARACTER_NOT_VISIBLE',
          'CHANGECHAR_NO_SCENE',
          'CHANGECHAR_NO_VISIBLE_CHARACTERS',
          'CHANGECHAR_CHARACTER_NOT_VISIBLE',
          'CHANGECHAR_IMAGE_NOT_IN_LIST',
          'SAY_NO_SCENE',
          'ASK_NO_SCENE',
          'ASK_IF_INVALID_THEN',
          'ASK_IF_INVALID_ELSE',
          'RETURN_AT_ROOT_LEVEL',
          'ADDOPPONENT_NOT_IN_MISSION',
          'SETSHIPTYPE_NOT_IN_MISSION',
          'finishMissionNotInMission',
          'addPartToShipNotInBuild',
          'addPartToAsideSlotNotInBuild',
          'addShipPartsNotInBuild',
          'setAdvPileNotInBuild',
          'setSecretAdvPileNotInBuild',
          'SETDECKPREPARATIONSCRIPT_OUTSIDE_CONTEXT',
          'SETFLIGHTDECKPREPARATIONSCRIPT_OUTSIDE_CONTEXT',
          'SETSPECCONDITION_OUTSIDE_CONTEXT',
          'SETTURNBASED_OUTSIDE_CONTEXT',
          'SETMISSIONASFAILED_OUTSIDE_CONTEXT',
          'SETMISSIONASCOMPLETED_OUTSIDE_CONTEXT',
          'ALLSHIPSGIVEUP_OUTSIDE_CONTEXT',
          'GIVEUPFLIGHT_OUTSIDE_CONTEXT',
          'MODIFYOPPONENTSBUILDSPEED_OUTSIDE_CONTEXT'
        ].includes(paramValidation.error || '');
        
        if (isWarning) {
          warnings++;
        } else {
          errors++;
        }
        invalidBlocks.push(block.id);
        
        // Genera messaggio specifico in base al tipo di errore
        let message = '';
        switch (paramValidation.error) {
          case 'ADDINFOWINDOW_NO_IMAGE':
            message = t ?
              t('visualFlowEditor.validation.ADDINFOWINDOW_NO_IMAGE')
              : 'ADDINFOWINDOW requires an image. Please select one.';
            break;
          case 'SHOWINFOWINDOW_NO_IMAGE':
            message = t ?
              t('visualFlowEditor.validation.SHOWINFOWINDOW_NO_IMAGE')
              : 'SHOWINFOWINDOW requires an image. Please select one.';
            break;
          case 'SHOWNODE_NO_NODE':
            message = t ?
              t('visualFlowEditor.validation.SHOWNODE_NO_NODE')
              : 'Select a node.';
            break;
          case 'HIDENODE_NO_NODE':
            message = t ?
              t('visualFlowEditor.validation.HIDENODE_NO_NODE')
              : 'Select a node.';
            break;
          case 'ADDNODE_NO_NODE':
            message = t ?
              t('visualFlowEditor.validation.ADDNODE_NO_NODE')
              : 'Select a node.';
            break;
          case 'SETNODEKNOWN_NO_NODE':
            message = t ?
              t('visualFlowEditor.validation.SETNODEKNOWN_NO_NODE')
              : 'Select a node.';
            break;
          case 'CENTERMAPBYNODE_NO_NODE':
            message = t ?
              t('visualFlowEditor.validation.CENTERMAPBYNODE_NO_NODE')
              : 'Select a node.';
            break;
          case 'SHOWPATH_NO_ROUTE':
            message = t ?
              t('visualFlowEditor.validation.SHOWPATH_NO_ROUTE')
              : 'Select a route.';
            break;
          case 'HIDEPATH_NO_ROUTE':
            message = t ?
              t('visualFlowEditor.validation.HIDEPATH_NO_ROUTE')
              : 'Select a route.';
            break;
          case 'CENTERMAPBYPATH_NO_ROUTE':
            message = t ?
              t('visualFlowEditor.validation.CENTERMAPBYPATH_NO_ROUTE')
              : 'Select a route.';
            break;
          case 'HIDEALLPATHS_NO_NODE1':
            message = t ?
              t('visualFlowEditor.validation.HIDEALLPATHS_NO_NODE1')
              : 'Select the first node.';
            break;
          case 'HIDEALLPATHS_NO_NODE2':
            message = t ?
              t('visualFlowEditor.validation.HIDEALLPATHS_NO_NODE2')
              : 'Select the second node.';
            break;
          case 'SHOWBUTTON_NO_BUTTON':
            message = t ?
              t('visualFlowEditor.validation.SHOWBUTTON_NO_BUTTON')
              : 'Select a button.';
            break;
          case 'HIDEBUTTON_NO_BUTTON':
            message = t ?
              t('visualFlowEditor.validation.HIDEBUTTON_NO_BUTTON')
              : 'Select a button.';
            break;
          case 'SETFOCUS_NO_BUTTON':
            message = t ?
              t('visualFlowEditor.validation.SETFOCUS_NO_BUTTON')
              : 'Select a button.';
            break;
          case 'RESETFOCUS_NO_BUTTON':
            message = t ?
              t('visualFlowEditor.validation.RESETFOCUS_NO_BUTTON')
              : 'Select a button.';
            break;
          case 'SETFOCUSIFCREDITS_NO_BUTTON':
            message = t ?
              t('visualFlowEditor.validation.SETFOCUSIFCREDITS_NO_BUTTON')
              : 'Select a button.';
            break;
          case 'SETFOCUSIFCREDITS_NO_CREDITS':
            message = t ?
              t('visualFlowEditor.validation.SETFOCUSIFCREDITS_NO_CREDITS')
              : 'Set minimum credits required.';
            break;
          case 'MOVEPLAYERTONODE_NO_NODE':
            message = t ?
              t('visualFlowEditor.validation.MOVEPLAYERTONODE_NO_NODE')
              : 'Select a node.';
            break;
          case 'DELAY_NO_DURATION':
            message = t ? 
              t('visualFlowEditor.validation.delayNoDuration')
              : 'DELAY block must have a duration value. Set the duration in milliseconds.';
            break;
          case 'SAY_NO_TEXT':
            message = t ? 
              t('visualFlowEditor.validation.sayNoText')
              : 'SAY block must have text. Add at least the English text.';
            break;
          case 'ASK_NO_TEXT':
            message = t ? 
              t('visualFlowEditor.validation.askNoText')
              : 'ASK block must have text. Add at least the English text.';
            break;
          case 'GO_NO_LABEL':
            message = t ? 
              t('visualFlowEditor.validation.goNoLabel')
              : 'GO block must have a label selected. Choose a target label.';
            break;
          case 'LABEL_NO_NAME':
            message = t ? 
              t('visualFlowEditor.validation.labelNoName')
              : 'LABEL block must have a name. Set the anchor name.';
            break;
          case 'SUB_SCRIPT_NO_NAME':
            message = t ? 
              t('visualFlowEditor.validation.subScriptNoName')
              : 'SUB_SCRIPT block must have a script name. Select a script to execute.';
            break;
          case 'OPT_NO_TEXT':
            message = t ? 
              t('visualFlowEditor.validation.optNoText')
              : 'OPT block must have text. Add at least the English text.';
            break;
          case 'ANNOUNCE_NO_TEXT':
            message = t ? 
              t('visualFlowEditor.validation.announceNoText')
              : 'ANNOUNCE block must have text. Add at least the English text.';
            break;
          case 'SET_NO_SEMAPHORE':
            message = t ? 
              t('visualFlowEditor.validation.setNoSemaphore')
              : 'SET block must have a semaphore selected. Choose a semaphore to set.';
            break;
          case 'RESET_NO_SEMAPHORE':
            message = t ? 
              t('visualFlowEditor.validation.resetNoSemaphore')
              : 'RESET block must have a semaphore selected. Choose a semaphore to reset.';
            break;
          case 'SET_TO_NO_VARIABLE':
            message = t ?
              t('visualFlowEditor.validation.setToNoVariable')
              : 'SET_TO block must have a variable selected. Choose a variable to set.';
            break;
          case 'SET_TO_NO_VALUE':
            message = t ?
              t('visualFlowEditor.validation.setToNoValue')
              : 'SET_TO block must have a value specified. Enter a numeric value.';
            break;
          case 'ADD_NO_VARIABLE':
            message = t ?
              t('visualFlowEditor.validation.addNoVariable')
              : 'ADD block must have a variable selected. Choose a variable to modify.';
            break;
          case 'ADD_NO_VALUE':
            message = t ?
              t('visualFlowEditor.validation.addNoValue')
              : 'ADD block must have a value specified. Enter a numeric value to add.';
            break;
          case 'RETURN_AT_ROOT_LEVEL':
            message = t ? 
              t('visualFlowEditor.validation.returnAtRootLevel')
              : 'Warning: RETURN at root level will exit the entire script.';
            break;
          case 'SHOWCHAR_NO_CHARACTER':
            message = t ?
              t('visualFlowEditor.validation.showcharNoCharacter')
              : 'SHOWCHAR block must specify which character to show. Select a character from the list.';
            break;
          case 'SHOWCHAR_NO_POSITION':
            message = t ?
              t('visualFlowEditor.validation.showcharNoPosition')
              : 'SHOWCHAR block must specify a position for the character.';
            break;
          case 'HIDECHAR_NO_CHARACTER':
            message = t ?
              t('visualFlowEditor.validation.hidecharNoCharacter')
              : 'HIDECHAR block must specify which character to hide. Select a character from the list.';
            break;
          case 'SHOWCHAR_NO_SCENE':
            message = t ?
              t('visualFlowEditor.validation.showcharNoScene')
              : 'SHOWCHAR requires an active scene. Add SHOWDLGSCENE before this block.';
            break;
          case 'HIDECHAR_NO_SCENE':
            message = t ?
              t('visualFlowEditor.validation.hidecharNoScene')
              : 'HIDECHAR requires an active scene. Add SHOWDLGSCENE before this block.';
            break;
          case 'HIDECHAR_NO_VISIBLE_CHARACTERS':
            message = t ?
              t('visualFlowEditor.validation.hidecharNoVisibleCharacters')
              : 'HIDECHAR cannot be used: no visible characters in the scene.';
            break;
          case 'HIDECHAR_CHARACTER_NOT_VISIBLE':
            message = t ?
              t('visualFlowEditor.validation.hidecharCharacterNotVisible')
              : 'The selected character is not visible in the scene.';
            break;
          case 'CHANGECHAR_NO_CHARACTER':
            message = t ?
              t('visualFlowEditor.validation.changecharNoCharacter')
              : 'CHANGECHAR block must specify which character to change. Select a character from the list.';
            break;
          case 'CHANGECHAR_NO_IMAGE':
            message = t ?
              t('visualFlowEditor.validation.changecharNoImage')
              : 'CHANGECHAR block must specify the new image. Select an image from the list.';
            break;
          case 'CHANGECHAR_NO_SCENE':
            message = t ?
              t('visualFlowEditor.validation.changecharNoScene')
              : 'CHANGECHAR requires an active scene. Add SHOWDLGSCENE before this block.';
            break;
          case 'CHANGECHAR_NO_VISIBLE_CHARACTERS':
            message = t ?
              t('visualFlowEditor.validation.changecharNoVisibleCharacters')
              : 'CHANGECHAR cannot be used: no visible characters in the scene.';
            break;
          case 'CHANGECHAR_CHARACTER_NOT_VISIBLE':
            message = t ?
              t('visualFlowEditor.validation.changecharCharacterNotVisible')
              : 'The selected character is not visible in the scene.';
            break;
          case 'CHANGECHAR_IMAGE_NOT_IN_LIST':
            message = t ?
              t('visualFlowEditor.validation.changecharImageNotInList')
              : 'The selected image is not available for this character.';
            break;
          case 'SAY_NO_SCENE':
            message = t ?
              t('visualFlowEditor.validation.sayNoScene')
              : 'SAY requires an active scene. Add SHOWDLGSCENE before this block.';
            break;
          case 'ASK_NO_SCENE':
            message = t ?
              t('visualFlowEditor.validation.askNoScene')
              : 'ASK requires an active scene. Add SHOWDLGSCENE before this block.';
            break;
          case 'ASK_IF_INVALID_THEN':
            message = t ?
              t('visualFlowEditor.validation.askIfInvalidThen')
              : 'After ASK, IF block\'s THEN branch must start with MENU or GO.';
            break;
          case 'ASK_IF_INVALID_ELSE':
            message = t ?
              t('visualFlowEditor.validation.askIfInvalidElse')
              : 'After ASK, IF block\'s ELSE branch must start with MENU or GO.';
            break;
          case 'ADDOPPONENT_NO_CHARACTER':
            message = t ?
              t('visualFlowEditor.validation.addOpponentNoCharacter')
              : 'ADDOPPONENT block must have a character selected. Choose an opponent character.';
            break;
          case 'ADDOPPONENT_NOT_IN_MISSION':
            message = t ?
              t('visualFlowEditor.validation.addOpponentNotInMission')
              : 'ADDOPPONENT should be inside a MISSION block. Consider moving this block inside a mission.';
            break;
          case 'SETSHIPTYPE_NO_TYPE':
            message = t ?
              t('visualFlowEditor.validation.setShipTypeNoType')
              : 'SETSHIPTYPE block must have a ship type selected. Choose a ship class (STI, STII, or STIII).';
            break;
          case 'SETSHIPTYPE_NOT_IN_MISSION':
            message = t ?
              t('visualFlowEditor.validation.setShipTypeNotInMission')
              : 'SETSHIPTYPE should be inside a MISSION block. Consider moving this block inside a mission.';
            break;
          case 'ADDPARTTOSHIP_NO_PARAMS':
            message = t ?
              t('visualFlowEditor.validation.addPartToShipNoParams')
              : 'ADDPARTTOSHIP block must have parameters. Specify the part to add.';
            break;
          case 'addPartToShipNotInBuild':
            message = t ?
              t('visualFlowEditor.validation.addPartToShipNotInBuild')
              : 'ADDPARTTOSHIP should be inside a BUILD block. Consider moving this block inside a build phase.';
            break;
          case 'ADDPARTTOASIDESLOT_NO_PARAMS':
            message = t ?
              t('visualFlowEditor.validation.addPartToAsideSlotNoParams')
              : 'ADDPARTTOASIDESLOT block must have parameters. Specify the part to add.';
            break;
          case 'addPartToAsideSlotNotInBuild':
            message = t ?
              t('visualFlowEditor.validation.addPartToAsideSlotNotInBuild')
              : 'ADDPARTTOASIDESLOT should be inside a BUILD block. Consider moving this block inside a build phase.';
            break;
          case 'ADDSHIPPARTS_NO_PARAMS':
            message = t ?
              t('visualFlowEditor.validation.addShipPartsNoParams')
              : 'ADDSHIPPARTS block must have a parts file selected. Select a YAML file from the parts folder.';
            break;
          case 'addShipPartsNotInBuild':
            message = t ?
              t('visualFlowEditor.validation.addShipPartsNotInBuild')
              : 'ADDSHIPPARTS should be inside a BUILD block. Consider moving this block inside a build phase.';
            break;
          case 'SETADVPILE_NO_PARAMS':
            message = t ?
              t('visualFlowEditor.validation.setAdvPileNoParams')
              : 'SETADVPILE block must have parameters. Provide the two-int string, unquoted.';
            break;
          case 'SETSECRETADVPILE_NO_PARAMS':
            message = t ?
              t('visualFlowEditor.validation.setSecretAdvPileNoParams')
              : 'SETSECRETADVPILE block must have parameters. Provide the two-int string, unquoted.';
            break;
          case 'setAdvPileNotInBuild':
            message = t ?
              t('visualFlowEditor.validation.setAdvPileNotInBuild')
              : 'SETADVPILE should be inside a BUILD block. Consider moving this block inside a build phase.';
            break;
          case 'setSecretAdvPileNotInBuild':
            message = t ?
              t('visualFlowEditor.validation.setSecretAdvPileNotInBuild')
              : 'SETSECRETADVPILE should be inside a BUILD block. Consider moving this block inside a build phase.';
            break;
          case 'finishMissionNotInMission':
            message = t ?
              t('visualFlowEditor.validation.finishMissionNotInMission')
              : 'FINISH_MISSION should be inside a MISSION block.';
            break;
          case 'ACT_MISSION_NO_MISSION':
            message = t ?
              t('visualFlowEditor.validation.actMissionNoMission')
              : 'ACT_MISSION block must have a mission selected. Choose a mission to activate.';
            break;
          case 'SETDECKPREPARATIONSCRIPT_NO_SCRIPT':
            message = t ?
              t('visualFlowEditor.validation.setDeckPreparationScriptNoScript')
              : 'SETDECKPREPARATIONSCRIPT block must have a script selected.';
            break;
          case 'SETFLIGHTDECKPREPARATIONSCRIPT_NO_SCRIPT':
            message = t ?
              t('visualFlowEditor.validation.setFlightDeckPreparationScriptNoScript')
              : 'SETFLIGHTDECKPREPARATIONSCRIPT block must have a script selected.';
            break;
          case 'SETDECKPREPARATIONSCRIPT_OUTSIDE_CONTEXT':
            message = t ?
              t('visualFlowEditor.validation.setDeckPreparationScriptOutsideContext')
              : 'SETDECKPREPARATIONSCRIPT should be inside a MISSION, BUILD or FLIGHT block.';
            break;
          case 'SETFLIGHTDECKPREPARATIONSCRIPT_OUTSIDE_CONTEXT':
            message = t ?
              t('visualFlowEditor.validation.setFlightDeckPreparationScriptOutsideContext')
              : 'SETFLIGHTDECKPREPARATIONSCRIPT should be inside a MISSION, BUILD or FLIGHT block.';
            break;
          case 'SETTURNBASED_OUTSIDE_CONTEXT':
            message = t ?
              t('visualFlowEditor.validation.setTurnBasedOutsideContext')
              : 'SETTURNBASED should be inside a MISSION, BUILD or FLIGHT block.';
            break;
          case 'SETMISSIONASFAILED_OUTSIDE_CONTEXT':
            message = t ?
              t('visualFlowEditor.validation.setMissionAsFailedOutsideContext')
              : 'SETMISSIONASFAILED should be inside a MISSION, BUILD or FLIGHT block.';
            break;
          case 'SETMISSIONASCOMPLETED_OUTSIDE_CONTEXT':
            message = t ?
              t('visualFlowEditor.validation.setMissionAsCompletedOutsideContext')
              : 'SETMISSIONASCOMPLETED should be inside a MISSION, BUILD or FLIGHT block.';
            break;
          case 'ALLSHIPSGIVEUP_OUTSIDE_CONTEXT':
            message = t ?
              t('visualFlowEditor.validation.allShipsGiveUpOutsideContext')
              : 'ALLSHIPSGIVEUP should be inside a MISSION, BUILD or FLIGHT block.';
            break;
          case 'GIVEUPFLIGHT_OUTSIDE_CONTEXT':
            message = t ?
              t('visualFlowEditor.validation.giveUpFlightOutsideContext')
              : 'GIVEUPFLIGHT should be inside a MISSION, BUILD or FLIGHT block.';
            break;
          case 'MODIFYOPPONENTSBUILDSPEED_NO_PERCENTAGE':
            message = t ?
              t('visualFlowEditor.validation.modifyOpponentsBuildSpeedNoPercentage')
              : 'MODIFYOPPONENTSBUILDSPEED block must have a percentage value (1-200).';
            break;
          case 'MODIFYOPPONENTSBUILDSPEED_OUT_OF_RANGE':
            message = t ?
              t('visualFlowEditor.validation.modifyOpponentsBuildSpeedOutOfRange')
              : 'MODIFYOPPONENTSBUILDSPEED percentage must be between 1 and 200.';
            break;
          case 'MODIFYOPPONENTSBUILDSPEED_OUTSIDE_CONTEXT':
            message = t ?
              t('visualFlowEditor.validation.modifyOpponentsBuildSpeedOutsideContext')
              : 'MODIFYOPPONENTSBUILDSPEED should be inside a MISSION, BUILD or FLIGHT block.';
            break;
          case 'SETSPECCONDITION_NO_CONDITION':
            message = t ?
              t('visualFlowEditor.validation.setSpecConditionNoCondition')
              : 'SETSPECCONDITION block must have a condition selected.';
            break;
          case 'SETSPECCONDITION_OUTSIDE_CONTEXT':
            message = t ?
              t('visualFlowEditor.validation.setSpecConditionOutsideContext')
              : 'SETSPECCONDITION should be inside a MISSION, BUILD or FLIGHT block.';
            break;
          default:
            message = t ? 
              t('visualFlowEditor.validation.error')
              : 'Validation error';
        }
        
        // isWarning è già definito sopra, lo riutilizzo
        
        // ... costruzione di message già avvenuta sopra
        errorDetails.push({
          blockId: block.id,
          blockType: block.type,
          errorType: paramValidation.error,
          message: message,
          path: [...path],
          type: isWarning ? 'warning' : 'error'
        });
      }
      // NUOVA VALIDAZIONE: ASK non può seguire un altro ASK
      if (block.type === 'ASK' && index > 0 && blocks[index - 1].type === 'ASK') {
        warnings++; // Warning, non error
        invalidBlocks.push(block.id);
        const prevAsk = blocks[index - 1];
        // usa il primo testo disponibile in qualsiasi lingua
        const firstAskText = extractFirstText(prevAsk.parameters?.text) || (t ? t('visualFlowEditor.validation.noText') : 'no text');
        errorDetails.push({
          blockId: block.id,
          blockType: block.type,
          errorType: 'CONSECUTIVE_ASK',
          message: t ? 
            t('visualFlowEditor.validation.consecutiveAskDetailed').replace('{firstAsk}', firstAskText)
            : `Two consecutive ASK blocks are not allowed. The first ASK (${firstAskText}) is followed directly by this ASK. Insert a SAY, MENU or other command between the two ASK blocks.`,
          path: [...path],
          relatedBlockId: prevAsk.id,
          type: 'warning' // Warning - non bloccante per integrità strutturale
        });
      }
      
      // NUOVA VALIDAZIONE: Ad un blocco ASK deve seguire un blocco MENU o LABEL
      if (block.type === 'ASK') {
        let isValidAsk = false;
        const nextBlock = index < blocks.length - 1 ? blocks[index + 1] : null;
        
        // Controllo 1: Blocco successivo è MENU o LABEL
        if (nextBlock && (nextBlock.type === 'MENU' || nextBlock.type === 'LABEL')) {
          isValidAsk = true;
        }
        
        // Controllo 2: Blocco successivo è GO la cui LABEL è seguita da MENU
        if (!isValidAsk && nextBlock && nextBlock.type === 'GO' && allRootBlocks) {
          const labelName = nextBlock.parameters?.label;
          if (labelName) {
            // Trova il blocco LABEL con questo nome
            const findLabelAndCheck = (blocks: any[]): boolean => {
              for (let i = 0; i < blocks.length; i++) {
                const b = blocks[i];
                if (b.type === 'LABEL' && b.parameters?.name === labelName) {
                  // Controlla se il blocco dopo LABEL è MENU
                  const nextAfterLabel = i < blocks.length - 1 ? blocks[i + 1] : null;
                  if (nextAfterLabel && nextAfterLabel.type === 'MENU') {
                    return true;
                  }
                }
                // Cerca ricorsivamente
                if (b.children && findLabelAndCheck(b.children)) return true;
                if (b.thenBlocks && findLabelAndCheck(b.thenBlocks)) return true;
                if (b.elseBlocks && findLabelAndCheck(b.elseBlocks)) return true;
                if (b.blockInit && findLabelAndCheck(b.blockInit)) return true;
                if (b.blockStart && findLabelAndCheck(b.blockStart)) return true;
                if (b.blockEvaluate && findLabelAndCheck(b.blockEvaluate)) return true;
                if (b.blocksMission && findLabelAndCheck(b.blocksMission)) return true;
                if (b.blocksFinish && findLabelAndCheck(b.blocksFinish)) return true;
              }
              return false;
            };
            if (findLabelAndCheck(allRootBlocks)) {
              isValidAsk = true;
            }
          }
        }
        
        // Controllo 3: Blocco successivo è IF con MENU o LABEL come primo elemento in THEN/ELSE
        if (!isValidAsk && nextBlock && nextBlock.type === 'IF') {
          let thenValid = false;
          let elseValid = false;
          
          // Controlla THEN branch
          if (nextBlock.thenBlocks && nextBlock.thenBlocks.length > 0) {
            const firstThen = nextBlock.thenBlocks[0];
            if (firstThen.type === 'MENU' || firstThen.type === 'LABEL') {
              thenValid = true;
            }
          }
          
          // Controlla ELSE branch (se esiste)
          if (nextBlock.elseBlocks && nextBlock.elseBlocks.length > 0) {
            const firstElse = nextBlock.elseBlocks[0];
            if (firstElse.type === 'MENU' || firstElse.type === 'LABEL') {
              elseValid = true;
            }
          } else {
            // Se ELSE non esiste, consideriamo valido
            elseValid = true;
          }
          
          if (thenValid && elseValid) {
            isValidAsk = true;
          }
        }
        
        // Se ASK è l'ultimo blocco in un ramo IF, controlla dopo l'IF
        if (!isValidAsk && !nextBlock && parentBlock && parentBlock.type === 'IF' && allRootBlocks) {
          const findBlockAfterIf = (blocks: any[], ifBlock: any): any | null => {
            for (let i = 0; i < blocks.length; i++) {
              if (blocks[i].id === ifBlock.id) {
                return i < blocks.length - 1 ? blocks[i + 1] : null;
              }
              // Cerca ricorsivamente
              if (blocks[i].children) {
                const found = findBlockAfterIf(blocks[i].children, ifBlock);
                if (found) return found;
              }
              if (blocks[i].thenBlocks) {
                const found = findBlockAfterIf(blocks[i].thenBlocks, ifBlock);
                if (found) return found;
              }
              if (blocks[i].elseBlocks) {
                const found = findBlockAfterIf(blocks[i].elseBlocks, ifBlock);
                if (found) return found;
              }
            }
            return null;
          };
          
          const blockAfterIf = findBlockAfterIf(allRootBlocks, parentBlock);
          if (blockAfterIf && (blockAfterIf.type === 'MENU' || blockAfterIf.type === 'LABEL')) {
            isValidAsk = true;
          }
        }
        
        if (!isValidAsk) {
          warnings++; // Warning, non error
          invalidBlocks.push(block.id);
          errorDetails.push({
            blockId: block.id,
            blockType: block.type,
            errorType: nextBlock ? 'ASK_NOT_FOLLOWED_BY_MENU' : 'ASK_WITHOUT_MENU',
            message: t ? 
              (nextBlock ? 
                t('visualFlowEditor.validation.askMustBeFollowedByMenu')
                : t('visualFlowEditor.validation.askWithoutMenu')
              )
              : (nextBlock ? 
                'ASK block must be followed by a MENU, LABEL, or GO to a LABEL with MENU. Current next block is ' + (nextBlock?.type || 'none') + '.'
                : 'ASK block must be followed by a MENU or LABEL block. This ASK is the last block.'
              ),
            path: [...path],
            relatedBlockId: nextBlock?.id,
            type: 'warning' // Warning - non bloccante per integrità strutturale
          });
        }
      }
      
      // NUOVA VALIDAZIONE: BUILD/FLIGHT dentro BUILD
      if ((block.type === 'BUILD' || block.type === 'FLIGHT') && parentBlock && parentBlock.type === 'BUILD') {
        warnings++; // Warning, non error
        invalidBlocks.push(block.id);
        const containerArea = t ? 
          (path[path.length - 1]?.includes('Init') ? t('visualFlowEditor.validation.areaInitialPhase') : t('visualFlowEditor.validation.areaBuildStart'))
          : (path[path.length - 1]?.includes('Init') ? 'Initial Phase' : 'Build Start');
        errorDetails.push({
          blockId: block.id,
          blockType: block.type,
          errorType: block.type === 'BUILD' ? 'BUILD_CONTAINS_BUILD' : 'BUILD_CONTAINS_FLIGHT',
          message: t ?
            t('visualFlowEditor.validation.blockInBuildDetailed')
              .replace('{blockType}', block.type)
              .replace('{area}', containerArea)
            : `The ${block.type} block is inside the "${containerArea}" area of a BUILD block. BUILD and FLIGHT blocks cannot be nested. Move this block out of the BUILD or use other block types.`,
          path: [...path],
          relatedBlockId: parentBlock.id,
          type: 'warning' // Warning - non bloccante per integrità strutturale
        });
      }
      
      // NUOVA VALIDAZIONE: BUILD/FLIGHT dentro FLIGHT
      if ((block.type === 'BUILD' || block.type === 'FLIGHT') && parentBlock && parentBlock.type === 'FLIGHT') {
        warnings++; // Warning, non error
        invalidBlocks.push(block.id);
        let containerArea = 'FLIGHT';
        if (t) {
          if (path[path.length - 1]?.includes('Init')) containerArea = t('visualFlowEditor.validation.areaInitialPhase');
          else if (path[path.length - 1]?.includes('Start')) containerArea = t('visualFlowEditor.validation.areaFlightStart');
          else if (path[path.length - 1]?.includes('Evaluate')) containerArea = t('visualFlowEditor.validation.areaEvaluation');
        } else {
          if (path[path.length - 1]?.includes('Init')) containerArea = 'Initial Phase';
          else if (path[path.length - 1]?.includes('Start')) containerArea = 'Flight Start';
          else if (path[path.length - 1]?.includes('Evaluate')) containerArea = 'Evaluation';
        }
        
        errorDetails.push({
          blockId: block.id,
          blockType: block.type,
          errorType: block.type === 'BUILD' ? 'FLIGHT_CONTAINS_BUILD' : 'FLIGHT_CONTAINS_FLIGHT',
          message: t ?
            t('visualFlowEditor.validation.blockInFlightDetailed')
              .replace('{blockType}', block.type)
              .replace('{area}', containerArea)
            : `The ${block.type} block is inside the "${containerArea}" area of a FLIGHT block. BUILD and FLIGHT blocks cannot be nested. Move this block out of the FLIGHT.`,
          path: [...path],
          relatedBlockId: parentBlock.id,
          type: 'warning' // Warning - non bloccante per integrità strutturale
        });
      }
      
      // Valida blocchi MENU - Regole complete
      if (block.type === 'MENU') {
        let isValidMenu = false;
        let prevBlock = null;
        
        if (index > 0) {
          prevBlock = blocks[index - 1];
        } else if (parentBlock && parentBlock.type === 'IF' && allRootBlocks) {
          // È il primo blocco in un ramo IF - controlla il blocco prima dell'IF
          prevBlock = findBlockBeforeContainer(allRootBlocks, parentBlock.id);
        }
        
        // Regola 1: MENU preceduto da ASK (diretto o nello stesso ramo IF)
        if (prevBlock && prevBlock.type === 'ASK') {
          isValidMenu = true;
        }
        
        // Se MENU è dentro IF, controlla se c'è un ASK prima dell'IF
        if (!isValidMenu && parentBlock && parentBlock.type === 'IF' && allRootBlocks) {
          const blockBeforeIf = findBlockBeforeContainer(allRootBlocks, parentBlock.id);
          if (blockBeforeIf && blockBeforeIf.type === 'ASK') {
            isValidMenu = true;
          }
        }
        
        // Regola 2: MENU preceduto da IF con ultimo elemento di THEN ed ELSE che sia ASK
        if (!isValidMenu && prevBlock && prevBlock.type === 'IF') {
          const thenEndsWithAsk = prevBlock.thenBlocks && prevBlock.thenBlocks.length > 0 && 
                                 blockEndsWithAsk(prevBlock.thenBlocks[prevBlock.thenBlocks.length - 1]);
          const elseEndsWithAsk = !prevBlock.elseBlocks || prevBlock.elseBlocks.length === 0 || 
                                 blockEndsWithAsk(prevBlock.elseBlocks[prevBlock.elseBlocks.length - 1]);
          if (thenEndsWithAsk && elseEndsWithAsk) {
            isValidMenu = true;
          }
        }
        
        // Regola 3: MENU preceduto da LABEL che a sua volta è preceduto da ASK
        if (!isValidMenu && prevBlock && prevBlock.type === 'LABEL' && index > 1) {
          const blockBeforeLabel = blocks[index - 2];
          if (blockBeforeLabel && blockBeforeLabel.type === 'ASK') {
            isValidMenu = true;
          }
        }
        
        // Regola 4: MENU preceduto da altro MENU le cui OPT terminano con ASK
        if (!isValidMenu && prevBlock && prevBlock.type === 'MENU') {
          // Verifica che tutte le OPT del MENU precedente terminino con ASK o configurazioni valide
          let allOptEndWithAsk = true;
          if (prevBlock.children) {
            for (const opt of prevBlock.children) {
              if (opt.type === 'OPT' && opt.children && opt.children.length > 0) {
                const lastInOpt = opt.children[opt.children.length - 1];
                if (!blockEndsWithAsk(lastInOpt)) {
                  // Controlla anche se termina con GO a una LABEL preceduta da ASK
                  if (lastInOpt.type === 'GO' && allRootBlocks) {
                    const labelName = lastInOpt.parameters?.label;
                    if (labelName) {
                      // Trova la LABEL e controlla se è preceduta da ASK
                      const findLabelPrecededByAsk = (blocks: any[]): boolean => {
                        for (let i = 0; i < blocks.length; i++) {
                          if (blocks[i].type === 'LABEL' && blocks[i].parameters?.name === labelName) {
                            if (i > 0 && blocks[i - 1].type === 'ASK') {
                              return true;
                            }
                          }
                          // Cerca ricorsivamente
                          if (blocks[i].children && findLabelPrecededByAsk(blocks[i].children)) return true;
                          if (blocks[i].thenBlocks && findLabelPrecededByAsk(blocks[i].thenBlocks)) return true;
                          if (blocks[i].elseBlocks && findLabelPrecededByAsk(blocks[i].elseBlocks)) return true;
                        }
                        return false;
                      };
                      if (!findLabelPrecededByAsk(allRootBlocks)) {
                        allOptEndWithAsk = false;
                        break;
                      }
                    } else {
                      allOptEndWithAsk = false;
                      break;
                    }
                  } else {
                    allOptEndWithAsk = false;
                    break;
                  }
                }
              } else if (opt.type === 'OPT') {
                // OPT vuota non termina con ASK
                allOptEndWithAsk = false;
                break;
              }
            }
          }
          if (allOptEndWithAsk) {
            isValidMenu = true;
          }
        }
        
        if (!isValidMenu) {
          warnings++; // Warning, non error
          invalidBlocks.push(block.id);
          
          // Genera messaggio specifico in base al blocco precedente
          let specificMessage = t ? t('visualFlowEditor.validation.menuNeedsAsk') : 'The MENU block must be preceded by an ASK block.';
          if (prevBlock) {
            if (prevBlock.type === 'IF') {
              // Analizza i rami dell'IF per capire cosa manca
              const thenEndsWithAsk = prevBlock.thenBlocks && prevBlock.thenBlocks.length > 0 && 
                                     blockEndsWithAsk(prevBlock.thenBlocks[prevBlock.thenBlocks.length - 1]);
              const elseEndsWithAsk = !prevBlock.elseBlocks || prevBlock.elseBlocks.length === 0 || 
                                     blockEndsWithAsk(prevBlock.elseBlocks[prevBlock.elseBlocks.length - 1]);
              
              if (!thenEndsWithAsk && !elseEndsWithAsk) {
                specificMessage = t ? t('visualFlowEditor.validation.menuAfterIfNoBranch') : 'The MENU follows an IF block where neither THEN nor ELSE branch ends with ASK. Both branches must end with ASK.';
              } else if (!thenEndsWithAsk) {
                specificMessage = t ? t('visualFlowEditor.validation.menuAfterIfNoThen') : 'The MENU follows an IF block where the THEN branch doesn\'t end with ASK. Add an ASK at the end of the THEN branch.';
              } else if (!elseEndsWithAsk) {
                specificMessage = t ? t('visualFlowEditor.validation.menuAfterIfNoElse') : 'The MENU follows an IF block where the ELSE branch doesn\'t end with ASK. Add an ASK at the end of the ELSE branch.';
              }
            } else if (prevBlock.type === 'MENU') {
              specificMessage = t ? t('visualFlowEditor.validation.menuAfterMenu') : 'The MENU follows another MENU. MENU blocks don\'t end with ASK, so you need to insert an ASK between the two MENUs.';
            } else {
              specificMessage = t ? 
                t('visualFlowEditor.validation.menuAfterBlock').replace('{blockType}', prevBlock.type)
                : `The MENU follows a ${prevBlock.type} block that doesn't end with ASK. Insert an ASK before the MENU.`;
            }
          } else if (index === 0) {
            specificMessage = t ? t('visualFlowEditor.validation.menuFirstBlock') : 'The MENU is the first block in the script. It must be preceded by at least one ASK block.';
          }
          
          errorDetails.push({
            blockId: block.id,
            blockType: block.type,
            errorType: 'MENU_WITHOUT_ASK',
            message: specificMessage,
            path: [...path],
            relatedBlockId: prevBlock?.id, // ID del blocco che causa il problema
            type: 'warning' // Warning - non bloccante per integrità strutturale
          });
        }
      }
      
      // Valida blocchi OPT (devono essere dentro MENU)
      if (block.type === 'OPT' && (!parentBlock || parentBlock.type !== 'MENU')) {
        errors++; // Error - OPT deve essere dentro MENU
        invalidBlocks.push(block.id);
        errorDetails.push({
          blockId: block.id,
          blockType: block.type,
          errorType: 'OPT_OUTSIDE_MENU',
          message: t ? t('visualFlowEditor.validation.optOnlyInMenu') : 'The OPT block can only be inserted inside a MENU block.',
          path: [...path],
          type: 'error' // Error - OPT deve essere dentro MENU
        });
      }
      
      // Valida blocchi EXIT_MENU (devono essere dentro OPT)
      if (block.type === 'EXIT_MENU' && (!parentBlock || parentBlock.type !== 'OPT')) {
        errors++; // Error - EXIT_MENU deve essere dentro OPT
        invalidBlocks.push(block.id);
        errorDetails.push({
          blockId: block.id,
          blockType: block.type,
          errorType: 'EXIT_MENU_OUTSIDE_OPT',
          message: t ? t('visualFlowEditor.validation.exitMenuOnlyInOpt') : 'The EXIT_MENU block can only be inserted inside an OPT block.',
          path: [...path],
          type: 'error' // Error - EXIT_MENU deve essere dentro OPT
        });
      }
      
      // Valida blocchi GO (richiedono presenza di LABEL)
      if (block.type === 'GO') {
        // Verifica se esiste almeno un LABEL nello script
        const rootBlocks = allRootBlocks || blocks;
        if (!hasLabelInScript(rootBlocks)) {
          errors++;
          invalidBlocks.push(block.id);
          errorDetails.push({
            blockId: block.id,
            blockType: block.type,
            errorType: 'GO_WITHOUT_LABEL',
            message: t ? 
              t('visualFlowEditor.validation.goWithoutLabel')
              : 'GO block requires at least one LABEL block in the script. Add a LABEL block before using GO.',
            path: [...path],
            type: 'error' // Error - GO senza LABEL è un errore grave
          });
        }
      }
      
      // NUOVA VALIDAZIONE: Controlli per scene di dialogo - USA LA LISTA FLAT CORRETTA
      if (!isValidInDialogContext(block, allFlatBlocks)) {
        warnings++; // Warning per contesto dialogo
        invalidBlocks.push(block.id);
        
        let errorType = '';
        let message = '';
        
        if (block.type === 'SAY' || block.type === 'ASK') {
          errorType = 'DIALOG_OUTSIDE_SCENE';
          message = t ? 
            t('visualFlowEditor.validation.dialogOutsideScene').replace('{blockType}', block.type)
            : `${block.type} block can only be used inside a dialog scene. Add a SHOWDLGSCENE block before using ${block.type}.`;
        } else if (block.type === 'SHOWCHAR' || block.type === 'HIDECHAR' || block.type === 'CHANGECHAR' || 
                   block.type === 'SAYCHAR' || block.type === 'ASKCHAR' || block.type === 'FOCUSCHAR') {
          errorType = 'CHARACTER_OUTSIDE_SCENE';
          message = t ? 
            t('visualFlowEditor.validation.characterOutsideScene').replace('{blockType}', block.type)
            : `${block.type} block can only be used inside a dialog scene. Add a SHOWDLGSCENE block before using ${block.type}.`;
        } else if (block.type === 'HIDEDLGSCENE') {
          errorType = 'HIDE_SCENE_WITHOUT_SHOW';
          message = t ? 
            t('visualFlowEditor.validation.hideSceneWithoutShow')
            : 'HIDEDLGSCENE block can only be used when there is an active dialog scene. Add a SHOWDLGSCENE block before using HIDEDLGSCENE.';
        }
        
        errorDetails.push({
          blockId: block.id,
          blockType: block.type,
          errorType: errorType,
          message: message,
          path: [...path],
          type: 'warning' // Warning per i blocchi di dialogo fuori contesto
        });
      }
      
      // NUOVA VALIDAZIONE: MENU non può essere senza OPT
      if (block.type === 'MENU') {
        if (!block.children || block.children.length === 0) {
          errors++;
          invalidBlocks.push(block.id);
          errorDetails.push({
            blockId: block.id,
            blockType: block.type,
            errorType: 'MENU_WITHOUT_OPT',
            message: t ? 
              t('visualFlowEditor.validation.menuWithoutOpt')
              : 'MENU block cannot be empty. Add at least one OPT block to the MENU.',
            path: [...path],
            type: 'error' // Error - MENU vuoto è un errore grave
          });
        } else {
          // NUOVA VALIDAZIONE: MENU deve avere almeno un OPT semplice
          const hasSimpleOpt = block.children.some((child: any) => 
            child.type === 'OPT' && 
            (!child.optType || child.optType === 'OPT_SIMPLE')
          );
          
          if (!hasSimpleOpt) {
            errors++;
            invalidBlocks.push(block.id);
            errorDetails.push({
              blockId: block.id,
              blockType: block.type,
              errorType: 'MENU_NO_SIMPLE_OPT',
              message: t ? 
                t('visualFlowEditor.validation.menuNoSimpleOpt')
                : 'MENU block must contain at least one simple OPT block (without conditions).',
              path: [...path],
              type: 'error' // Error - MENU senza OPT semplice è un errore grave
            });
          }
          
          // Valida contenuto dei MENU (solo OPT permessi)
          block.children.forEach((child: any) => {
            if (child.type !== 'OPT') {
              errors++;
              invalidBlocks.push(child.id);
              errorDetails.push({
                blockId: child.id,
                blockType: child.type,
                errorType: 'NON_OPT_IN_MENU',
                message: t ? 
                  t('visualFlowEditor.validation.onlyOptInMenu').replace('{blockType}', child.type)
                  : `The ${child.type} block cannot be inserted in a MENU. Only OPT blocks are allowed.`,
                path: [...path, 'MENU'],
                type: 'error' // Error - blocchi non-OPT in MENU sono errori gravi
              });
            }
          });
        }
      }
      if (block.type === 'BUILDINGHELPSCRIPT') {
        const v = block.parameters?.value;
        const s = block.parameters?.script;
        if (typeof v !== 'number' || isNaN(v) || v < 0 || !s) {
          errors++;
          invalidBlocks.push(block.id);
          errorDetails.push({
            blockId: block.id,
            blockType: block.type,
            errorType: 'BUILDINGHELPSCRIPT_PARAMS_INVALID',
            message: t ? t('visualFlowEditor.validation.buildingHelpScriptParams') : 'BUILDINGHELPSCRIPT requires a numeric value (>= 0) and a script.',
            path: [...path],
            type: 'error'
          });
        }
      }
      if (block.type === 'FLIGHTHELPSCRIPT' || block.type === 'ALIENHELPSCRIPT') {
        const s = block.parameters?.script;
        if (!s) {
          errors++;
          invalidBlocks.push(block.id);
          errorDetails.push({
            blockId: block.id,
            blockType: block.type,
            errorType: 'HELPSCRIPT_PARAMS_INVALID',
            message: t ? t('visualFlowEditor.validation.helpScriptParams') : 'This command requires the script parameter.',
            path: [...path],
            type: 'error'
          });
        }
      }
      // Ricorsione per container
      if (block.children) {
        // Per i container normali, passa il blocco corrente come parent e mantieni allRootBlocks
        const newPath = [...path, `${block.type}${block.id ? '#' + block.id.slice(0, 8) : ''}`];
        validateRecursive(block.children, block, allRootBlocks || blocks, newPath);
      }
      
      // NUOVA VALIDAZIONE: IF non può avere ramo THEN vuoto
      if (block.type === 'IF') {
        if (!block.thenBlocks || block.thenBlocks.length === 0) {
          errors++;
          invalidBlocks.push(block.id);
          errorDetails.push({
            blockId: block.id,
            blockType: block.type,
            errorType: 'IF_EMPTY_THEN',
            message: t ? 
              t('visualFlowEditor.validation.ifEmptyThen') 
              : 'IF block cannot have an empty THEN branch. Add at least one block to the THEN branch.',
            path: [...path],
            type: 'error' // Error - IF senza THEN è un errore grave
          });
        }
      }
      
      // Ricorsione per IF
      if (block.type === 'IF') {
        if (block.thenBlocks) {
          // Per i rami IF, passa il blocco IF come parent e i blocchi root originali
          validateRecursive(block.thenBlocks, block, allRootBlocks || blocks);
        }
        if (block.elseBlocks && block.elseBlocks.length > 0) {
          validateRecursive(block.elseBlocks, block, allRootBlocks || blocks);
        }
      }
      
      // Ricorsione per MISSION
      if (block.type === 'MISSION') {
        if (block.blocksMission) {
          validateRecursive(block.blocksMission, block, allRootBlocks || blocks);
        }
        if (block.blocksFinish) {
          validateRecursive(block.blocksFinish, block, allRootBlocks || blocks);
        }
      }
      
      // Ricorsione per BUILD
      if (block.type === 'BUILD') {
        if (block.blockInit) {
          validateRecursive(block.blockInit, block, allRootBlocks || blocks);
        }
        if (block.blockStart) {
          validateRecursive(block.blockStart, block, allRootBlocks || blocks);
        }
      }
      
      // Ricorsione per FLIGHT
      if (block.type === 'FLIGHT') {
        if (block.blockInit) {
          validateRecursive(block.blockInit, block, allRootBlocks || blocks);
        }
        if (block.blockStart) {
          validateRecursive(block.blockStart, block, allRootBlocks || blocks);
        }
        if (block.blockEvaluate) {
          validateRecursive(block.blockEvaluate, block, allRootBlocks || blocks);
        }
      }
    });
  };
  
  // Inizia la validazione dal blocco principale (SCRIPT o MISSION)
  // scriptBlock e missionBlock già dichiarati sopra alle righe 137-138
  
  if (scriptBlock && scriptBlock.children) {
    validateRecursive(scriptBlock.children, scriptBlock, blocks);
  } else if (missionBlock) {
    if (missionBlock.blocksMission) {
      validateRecursive(missionBlock.blocksMission, missionBlock, blocks);
    }
    if (missionBlock.blocksFinish) {
      validateRecursive(missionBlock.blocksFinish, missionBlock, blocks);
    }
  } else {
    // Se non c'è un blocco principale, valida tutti i blocchi come root
    validateRecursive(blocks, null, blocks);
  }
  
  return { errors, warnings, invalidBlocks, details: errorDetails };
};
/**
 * Validate Operations Module
 * Funzioni principali per la validazione di inserimento e validazione globale dei blocchi
 */

import { findBlockBeforeContainer } from '../search';
import { validateAskInsertion } from './askValidation';
import { validateContainerNesting } from './containerValidation';
import { validateMenuInsertion, validateOptInsertion, validateMenuContent, canInsertMenuAfterBlock } from './menuValidation';
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
export const validateAllBlocks = (blocks: any[], t?: (key: any) => string, characters?: any[]): { errors: number; invalidBlocks: string[]; details: any[] } => {
  let errors = 0;
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
      const paramValidation = validateBlockParameters(block, allFlatBlocks, characters);
      if (!paramValidation.valid) {
        errors++;
        invalidBlocks.push(block.id);
        
        // Genera messaggio specifico in base al tipo di errore
        let message = '';
        switch (paramValidation.error) {
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
          default:
            message = t ? 
              t('visualFlowEditor.validation.error')
              : 'Validation error';
        }
        
        errorDetails.push({
          blockId: block.id,
          blockType: block.type,
          errorType: paramValidation.error,
          message: message,
          path: [...path]
        });
      }
      // NUOVA VALIDAZIONE: ASK non può seguire un altro ASK
      if (block.type === 'ASK' && index > 0 && blocks[index - 1].type === 'ASK') {
        errors++;
        invalidBlocks.push(block.id);
        const prevAsk = blocks[index - 1];
        errorDetails.push({
          blockId: block.id,
          blockType: block.type,
          errorType: 'CONSECUTIVE_ASK',
          message: t ? 
            t('visualFlowEditor.validation.consecutiveAskDetailed')
              .replace('{firstAsk}', prevAsk.parameters?.text?.EN || t('visualFlowEditor.validation.noText'))
            : `Two consecutive ASK blocks are not allowed. The first ASK (${prevAsk.parameters?.text?.EN || 'no text'}) is followed directly by this ASK. Insert a SAY, MENU or other command between the two ASK blocks.`,
          path: [...path],
          relatedBlockId: prevAsk.id
        });
      }
      
      // NUOVA VALIDAZIONE: Ad un blocco ASK deve seguire un blocco MENU
      if (block.type === 'ASK') {
        let hasValidMenu = false;
        
        // Controllo 1: Blocco successivo nello stesso container è MENU
        const nextBlock = index < blocks.length - 1 ? blocks[index + 1] : null;
        if (nextBlock && nextBlock.type === 'MENU') {
          hasValidMenu = true;
        }
        
        // Controllo 2: Se ASK è l'ultimo blocco in un ramo IF, 
        // il MENU può essere fuori dall'IF come primo blocco dopo l'IF
        if (!hasValidMenu && !nextBlock && parentBlock && parentBlock.type === 'IF') {
          // Trova il blocco IF nell'albero completo e controlla cosa viene dopo
          if (allRootBlocks) {
            const findBlockAfterIf = (blocks: any[], ifBlock: any): any | null => {
              for (let i = 0; i < blocks.length; i++) {
                if (blocks[i].id === ifBlock.id) {
                  return i < blocks.length - 1 ? blocks[i + 1] : null;
                }
                // Cerca ricorsivamente nei figli
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
            if (blockAfterIf && blockAfterIf.type === 'MENU') {
              hasValidMenu = true;
            }
          }
        }
        
        if (!hasValidMenu) {
          errors++;
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
                'ASK block must be followed by a MENU block. Insert a MENU block after this ASK.'
                : 'ASK block must be followed by a MENU block. This ASK is the last block and has no following MENU.'
              ),
            path: [...path],
            relatedBlockId: nextBlock?.id
          });
        }
      }
      
      // NUOVA VALIDAZIONE: BUILD/FLIGHT dentro BUILD
      if ((block.type === 'BUILD' || block.type === 'FLIGHT') && parentBlock && parentBlock.type === 'BUILD') {
        errors++;
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
          relatedBlockId: parentBlock.id
        });
      }
      
      // NUOVA VALIDAZIONE: BUILD/FLIGHT dentro FLIGHT
      if ((block.type === 'BUILD' || block.type === 'FLIGHT') && parentBlock && parentBlock.type === 'FLIGHT') {
        errors++;
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
          relatedBlockId: parentBlock.id
        });
      }
      
      // Valida blocchi MENU
      if (block.type === 'MENU') {
        let prevBlock = null;
        
        if (index > 0) {
          // C'è un blocco prima nello stesso livello
          prevBlock = blocks[index - 1];
        } else if (parentBlock && parentBlock.type === 'IF' && allRootBlocks) {
          // È il primo blocco in un ramo IF - controlla il blocco prima dell'IF
          prevBlock = findBlockBeforeContainer(allRootBlocks, parentBlock.id);
        } else if (parentBlock && parentBlock.type === 'SCRIPT' && index === 0) {
          // È il primo blocco dello script - non può essere MENU
          prevBlock = null;
        }
        
        // Controlla se il MENU può essere inserito usando la logica unificata
        let canInsertMenu = false;
        
        if (prevBlock) {
          if (prevBlock.type === 'IF') {
            // Logica per IF: entrambi i rami devono terminare con ASK
            const thenEndsWithAsk = prevBlock.thenBlocks && prevBlock.thenBlocks.length > 0 && 
                                   blockEndsWithAsk(prevBlock.thenBlocks[prevBlock.thenBlocks.length - 1]);
            const elseEndsWithAsk = !prevBlock.elseBlocks || prevBlock.elseBlocks.length === 0 || 
                                   blockEndsWithAsk(prevBlock.elseBlocks[prevBlock.elseBlocks.length - 1]);
            canInsertMenu = thenEndsWithAsk && elseEndsWithAsk;
          } else {
            // Per altri blocchi usa la funzione esistente
            canInsertMenu = canInsertMenuAfterBlock(prevBlock);
          }
        }
        
        if (!canInsertMenu) {
          errors++;
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
            relatedBlockId: prevBlock?.id // ID del blocco che causa il problema
          });
        }
      }
      
      // Valida blocchi OPT (devono essere dentro MENU)
      if (block.type === 'OPT' && (!parentBlock || parentBlock.type !== 'MENU')) {
        errors++;
        invalidBlocks.push(block.id);
        errorDetails.push({
          blockId: block.id,
          blockType: block.type,
          errorType: 'OPT_OUTSIDE_MENU',
          message: t ? t('visualFlowEditor.validation.optOnlyInMenu') : 'The OPT block can only be inserted inside a MENU block.',
          path: [...path]
        });
      }
      
      // Valida blocchi EXIT_MENU (devono essere dentro OPT)
      if (block.type === 'EXIT_MENU' && (!parentBlock || parentBlock.type !== 'OPT')) {
        errors++;
        invalidBlocks.push(block.id);
        errorDetails.push({
          blockId: block.id,
          blockType: block.type,
          errorType: 'EXIT_MENU_OUTSIDE_OPT',
          message: t ? t('visualFlowEditor.validation.exitMenuOnlyInOpt') : 'The EXIT_MENU block can only be inserted inside an OPT block.',
          path: [...path]
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
            path: [...path]
          });
        }
      }
      
      // NUOVA VALIDAZIONE: Controlli per scene di dialogo - USA LA LISTA FLAT CORRETTA
      if (!isValidInDialogContext(block, allFlatBlocks)) {
        errors++;
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
          path: [...path]
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
            path: [...path]
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
              path: [...path]
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
                path: [...path, 'MENU']
              });
            }
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
            path: [...path]
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
  
  return { errors, invalidBlocks, details: errorDetails };
};
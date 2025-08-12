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
 * Valida tutti i blocchi esistenti e conta gli errori
 * Esegue una validazione completa ricorsiva su tutto l'albero dei blocchi
 * 
 * @param blocks - Array di blocchi da validare
 * @returns Oggetto con numero di errori, blocchi invalidi e dettagli errori
 */
export const validateAllBlocks = (blocks: any[], t?: (key: any) => string): { errors: number; invalidBlocks: string[]; details: any[] } => {
  let errors = 0;
  const invalidBlocks: string[] = [];
  const errorDetails: any[] = [];
  
  const validateRecursive = (blocks: any[], parentBlock?: any, allRootBlocks?: any[], path: string[] = []): void => {
    blocks.forEach((block, index) => {
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
  const scriptBlock = blocks.find(b => b.type === 'SCRIPT');
  const missionBlock = blocks.find(b => b.type === 'MISSION');
  
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
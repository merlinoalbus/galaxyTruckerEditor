/**
 * Validate Operations Module
 * Funzioni principali per la validazione di inserimento e validazione globale dei blocchi
 */

import { findBlockBeforeContainer } from '../search';
import { validateAskInsertion } from './askValidation';
import { validateContainerNesting } from './containerValidation';
import { validateMenuInsertion, validateOptInsertion, validateMenuContent, canInsertMenuAfterBlock } from './menuValidation';
import { blockEndsWithAsk } from './blockValidators';

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
            : `Due blocchi ASK consecutivi non sono permessi. Il primo ASK (${prevAsk.parameters?.text?.EN || 'senza testo'}) è seguito direttamente da questo ASK. Inserisci un blocco SAY, MENU o altro comando tra i due ASK per separarli.`,
          path: [...path],
          relatedBlockId: prevAsk.id
        });
      }
      
      // NUOVA VALIDAZIONE: BUILD/FLIGHT dentro BUILD
      if ((block.type === 'BUILD' || block.type === 'FLIGHT') && parentBlock && parentBlock.type === 'BUILD') {
        errors++;
        invalidBlocks.push(block.id);
        const containerArea = path[path.length - 1]?.includes('Init') ? 'Fase Iniziale' : 'Inizio Build';
        errorDetails.push({
          blockId: block.id,
          blockType: block.type,
          errorType: block.type === 'BUILD' ? 'BUILD_CONTAINS_BUILD' : 'BUILD_CONTAINS_FLIGHT',
          message: t ?
            t('visualFlowEditor.validation.blockInBuildDetailed')
              .replace('{blockType}', block.type)
              .replace('{area}', containerArea)
            : `Il blocco ${block.type} si trova dentro l'area "${containerArea}" di un blocco BUILD. I blocchi BUILD e FLIGHT non possono essere annidati. Sposta questo blocco fuori dal BUILD o usa altri tipi di blocchi.`,
          path: [...path],
          relatedBlockId: parentBlock.id
        });
      }
      
      // NUOVA VALIDAZIONE: BUILD/FLIGHT dentro FLIGHT
      if ((block.type === 'BUILD' || block.type === 'FLIGHT') && parentBlock && parentBlock.type === 'FLIGHT') {
        errors++;
        invalidBlocks.push(block.id);
        let containerArea = 'FLIGHT';
        if (path[path.length - 1]?.includes('Init')) containerArea = 'Fase Iniziale';
        else if (path[path.length - 1]?.includes('Start')) containerArea = 'Inizio Volo';
        else if (path[path.length - 1]?.includes('Evaluate')) containerArea = 'Valutazione';
        
        errorDetails.push({
          blockId: block.id,
          blockType: block.type,
          errorType: block.type === 'BUILD' ? 'FLIGHT_CONTAINS_BUILD' : 'FLIGHT_CONTAINS_FLIGHT',
          message: t ?
            t('visualFlowEditor.validation.blockInFlightDetailed')
              .replace('{blockType}', block.type)
              .replace('{area}', containerArea)
            : `Il blocco ${block.type} si trova dentro l'area "${containerArea}" di un blocco FLIGHT. I blocchi BUILD e FLIGHT non possono essere annidati tra loro. Sposta questo blocco fuori dal FLIGHT.`,
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
        
        if (!prevBlock || !canInsertMenuAfterBlock(prevBlock)) {
          errors++;
          invalidBlocks.push(block.id);
          
          // Genera messaggio specifico in base al blocco precedente
          let specificMessage = 'Il blocco MENU deve essere preceduto da un blocco ASK.';
          if (prevBlock) {
            if (prevBlock.type === 'IF') {
              // Analizza i rami dell'IF per capire cosa manca
              const thenEndsWithAsk = prevBlock.thenBlocks && prevBlock.thenBlocks.length > 0 && 
                                     blockEndsWithAsk(prevBlock.thenBlocks[prevBlock.thenBlocks.length - 1]);
              const elseEndsWithAsk = !prevBlock.elseBlocks || prevBlock.elseBlocks.length === 0 || 
                                     blockEndsWithAsk(prevBlock.elseBlocks[prevBlock.elseBlocks.length - 1]);
              
              if (!thenEndsWithAsk && !elseEndsWithAsk) {
                specificMessage = `Il MENU segue un blocco IF dove né il ramo THEN né il ramo ELSE terminano con ASK. Entrambi i rami devono terminare con ASK.`;
              } else if (!thenEndsWithAsk) {
                specificMessage = `Il MENU segue un blocco IF dove il ramo THEN non termina con ASK. Aggiungi un ASK alla fine del ramo THEN.`;
              } else if (!elseEndsWithAsk) {
                specificMessage = `Il MENU segue un blocco IF dove il ramo ELSE non termina con ASK. Aggiungi un ASK alla fine del ramo ELSE.`;
              }
            } else if (prevBlock.type === 'MENU') {
              specificMessage = `Il MENU segue un altro MENU. I blocchi MENU non terminano con ASK, quindi devi inserire un ASK tra i due MENU.`;
            } else {
              specificMessage = `Il MENU segue un blocco ${prevBlock.type} che non termina con ASK. Inserisci un ASK prima del MENU.`;
            }
          } else if (index === 0) {
            specificMessage = 'Il MENU è il primo blocco dello script. Deve essere preceduto da almeno un blocco ASK.';
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
          message: 'Il blocco OPT può essere inserito solo all\'interno di un blocco MENU.',
          path: [...path]
        });
      }
      
      // Valida contenuto dei MENU (solo OPT permessi)
      if (block.type === 'MENU' && block.children) {
        block.children.forEach((child: any) => {
          if (child.type !== 'OPT') {
            errors++;
            invalidBlocks.push(child.id);
            errorDetails.push({
              blockId: child.id,
              blockType: child.type,
              errorType: 'NON_OPT_IN_MENU',
              message: `Il blocco ${child.type} non può essere inserito in un MENU. Solo blocchi OPT sono permessi.`,
              path: [...path, 'MENU']
            });
          }
        });
      }
      
      // Ricorsione per container
      if (block.children) {
        // Per i container normali, passa il blocco corrente come parent e mantieni allRootBlocks
        const newPath = [...path, `${block.type}${block.id ? '#' + block.id.slice(0, 8) : ''}`];
        validateRecursive(block.children, block, allRootBlocks || blocks, newPath);
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
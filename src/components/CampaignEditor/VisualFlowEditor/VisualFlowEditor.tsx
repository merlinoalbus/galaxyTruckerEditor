import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Code2 } from 'lucide-react';

import { useVisualFlowEditor } from '@/hooks/CampaignEditor/VisualFlowEditor/useVisualFlowEditor';
import { visualFlowEditorStyles } from '@/styles/CampaignEditor/VisualFlowEditor/VisualFlowEditor.styles';
import { useFullscreen } from '@/contexts/FullscreenContext';
import type { VisualFlowEditorProps } from '@/types/CampaignEditor/VisualFlowEditor/VisualFlowEditor.types';
import { useTranslation } from '@/locales';
import { useLanguage } from '@/contexts/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import type { IFlowBlock, ValidationResult, ScriptContext, OpenedScript } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';
import { TIMEOUT_CONSTANTS, PERFORMANCE_CONSTANTS, UI_CONSTANTS, API_CONSTANTS } from '@/constants/VisualFlowEditor.constants';
import { SceneProvider, useScene } from '@/contexts/SceneContext';

// Import componenti modulari
import { BlockRenderer } from './components/BlockRenderer/BlockRenderer';
import { Toolbar } from './components/Toolbar/Toolbar';
import { ScriptsList, type ScriptItem } from './components/ScriptsList';
import { MissionsList } from './components/MissionsList';
import { JsonView } from '@/components/shared/JsonView';
import { NewScriptDialog } from './components/NewScriptDialog';
import { ToolsPanel } from './components/ToolsPanel';
import { ErrorModal } from './components/ErrorModal/ErrorModal';
import { ValidationErrorsModal } from './components/ValidationErrorsModal/ValidationErrorsModal';
import { collectScriptLabels } from '@/hooks/CampaignEditor/VisualFlowEditor/utils/collectScriptLabels';
// Import hooks custom modulari
import { useBlockManipulation } from '@/hooks/CampaignEditor/VisualFlowEditor/useBlockManipulation';
import { useDragAndDrop } from '@/hooks/CampaignEditor/VisualFlowEditor/useDragAndDrop';
import { useZoomNavigation } from '@/hooks/CampaignEditor/VisualFlowEditor/useZoomNavigation';
import { useScriptManagement } from '@/hooks/CampaignEditor/VisualFlowEditor/useScriptManagement';
import { useJsonConversion } from '@/hooks/CampaignEditor/VisualFlowEditor/useJsonConversion';
import { useSessionData } from '@/hooks/CampaignEditor/VisualFlowEditor/useSessionData';

/**
 * Visual Flow Editor - Architettura Modulare
 * 
 * Questo componente utilizza un'architettura completamente modulare con:
 * - Hook separati per ogni responsabilità (zoom navigation, script management, JSON conversion, drag&drop, block manipulation)
 * - Moduli utility integrati negli hook: blockIdManager e blockCleaner (useScriptManagement), jsonConverter (useJsonConversion)
 * - Componenti atomici riutilizzabili: NavigationBreadcrumb (Toolbar), ZoomControls (tutti i blocchi)
 * - Separazione netta tra logica di business (hook) e presentazione (componente)
 */

// Componente interno che usa il SceneContext
const VisualFlowEditorInternal: React.FC<VisualFlowEditorProps> = ({ 
  analysis,
  scriptId 
}) => {
  const { isFlowFullscreen, toggleFlowFullscreen } = useFullscreen();
  const { isLoading } = useVisualFlowEditor(analysis || null);
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { state: sceneState, showDialogScene, hideDialogScene, clearScenes } = useScene();

  // Script management state
  const [availableScripts, setAvailableScripts] = useState<ScriptItem[]>([]);
  const [showScriptsList, setShowScriptsList] = useState(false);
  const [showMissionsList, setShowMissionsList] = useState(false);
  const [showJsonView, setShowJsonView] = useState(false);
  
  // Editor state
  const [currentScriptBlocks, setCurrentScriptBlocks] = useState<IFlowBlock[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationResult>({ errors: 0, invalidBlocks: [] });
  const [dropError, setDropError] = useState<string | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState<'errors' | 'warnings' | false>(false);
  
  // Mappa per tracciare il tipo di validazione per ogni blocco
  const [blockValidationTypes, setBlockValidationTypes] = useState<Map<string, 'error' | 'warning'>>(new Map());
  
  // Multi-script management - tiene traccia di tutti gli script aperti
  const [openedScripts, setOpenedScripts] = useState<Map<string, OpenedScript>>(new Map());
  
  // Script corrente in visualizzazione (può essere main o sub-script)
  const [currentScriptContext, setCurrentScriptContext] = useState<ScriptContext | null>(null);
  
  // Path di navigazione tra script (diverso da navigationPath che è per zoom interno)
  const [scriptNavigationPath, setScriptNavigationPath] = useState<Array<{
    scriptName: string;
    parentBlockId?: string;
  }>>([]);
  
  // Button refs per posizionamento contestuale
  const scriptsButtonRef = React.useRef<HTMLButtonElement>(null);
  const missionsButtonRef = React.useRef<HTMLButtonElement>(null);

  // Usa hook per dati di sessione (variabili, semafori, labels, scripts, missions)
  const sessionData = useSessionData();
  
  // Raccogli le label presenti nello script corrente
  const scriptLabels = React.useMemo(() => {
    return collectScriptLabels(currentScriptBlocks);
  }, [currentScriptBlocks]);
  
  // Funzione per navigare a un blocco LABEL
  const goToLabel = useCallback((labelName: string) => {
    // Funzione per trovare il blocco LABEL con limite di ricorsione
    const findLabelBlock = (blocks: IFlowBlock[], path: IFlowBlock[] = [], depth: number = 0): { block: IFlowBlock, path: IFlowBlock[] } | null => {
      // Limite di ricorsione per prevenire stack overflow
      const MAX_RECURSION_DEPTH = PERFORMANCE_CONSTANTS.MAX_RECURSION_DEPTH;
      if (depth > MAX_RECURSION_DEPTH) {
        console.warn(`Maximum recursion depth (${MAX_RECURSION_DEPTH}) reached while searching for label: ${labelName}`);
        return null;
      }
      for (const block of blocks) {
        if (block.type === 'LABEL' && block.parameters?.name === labelName) {
          return { block, path };
        }
        
        // Cerca nei figli
        if (block.children) {
          const found = findLabelBlock(block.children, [...path, block], depth + 1);
          if (found) return found;
        }
        
        // Cerca nei rami IF
        if (block.type === 'IF') {
          if (block.thenBlocks) {
            const found = findLabelBlock(block.thenBlocks, [...path, block], depth + 1);
            if (found) return found;
          }
          if (block.elseBlocks) {
            const found = findLabelBlock(block.elseBlocks, [...path, block], depth + 1);
            if (found) return found;
          }
        }
        
        // Cerca nei blocchi MISSION
        if (block.type === 'MISSION') {
          if (block.blocksMission) {
            const found = findLabelBlock(block.blocksMission, [...path, block], depth + 1);
            if (found) return found;
          }
          if (block.blocksFinish) {
            const found = findLabelBlock(block.blocksFinish, [...path, block], depth + 1);
            if (found) return found;
          }
        }
        
        // Cerca nei blocchi BUILD
        if (block.type === 'BUILD') {
          if (block.blockInit) {
            const found = findLabelBlock(block.blockInit, [...path, block], depth + 1);
            if (found) return found;
          }
          if (block.blockStart) {
            const found = findLabelBlock(block.blockStart, [...path, block], depth + 1);
            if (found) return found;
          }
        }
        
        // Cerca nei blocchi FLIGHT
        if (block.type === 'FLIGHT') {
          if (block.blockInit) {
            const found = findLabelBlock(block.blockInit, [...path, block], depth + 1);
            if (found) return found;
          }
          if (block.blockStart) {
            const found = findLabelBlock(block.blockStart, [...path, block], depth + 1);
            if (found) return found;
          }
          if (block.blockEvaluate) {
            const found = findLabelBlock(block.blockEvaluate, [...path, block], depth + 1);
            if (found) return found;
          }
        }
        
        // Cerca nei blocchi OPT
        if (block.type === 'OPT' && block.children) {
          const found = findLabelBlock(block.children, [...path, block], depth + 1);
          if (found) return found;
        }
      }
      return null;
    };
    
    const result = findLabelBlock(currentScriptBlocks);
    if (result) {
      // Scrolla al blocco
      const element = document.querySelector(`[data-block-id="${result.block.id}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Evidenzia temporaneamente il blocco con safe timeout
        element.classList.add(`ring-${UI_CONSTANTS.RING_WIDTH_HIGHLIGHT}`, 'ring-blue-500', `ring-offset-${UI_CONSTANTS.RING_OFFSET}`, 'ring-offset-slate-900');
        addSafeTimeout(() => {
          element.classList.remove(`ring-${UI_CONSTANTS.RING_WIDTH_HIGHLIGHT}`, 'ring-blue-500', `ring-offset-${UI_CONSTANTS.RING_OFFSET}`, 'ring-offset-slate-900');
        }, TIMEOUT_CONSTANTS.HIGHLIGHT_DURATION);
      }
    }
  }, [currentScriptBlocks]);
  
  // Usa hook per manipolazione blocchi
  const {
    updateBlockRecursive,
    removeBlockRecursive,
    addBlockAtIndex,
    addBlockToContainer,
    canDropBlock,
    validateAllBlocks,
    getDropErrorMessage
  } = useBlockManipulation();
  
  // Usa hook per zoom navigation
  const {
    navigationPath,
    setNavigationPath,
    currentFocusedBlockId,
    rootBlocks,
    setRootBlocks,
    handleZoomIn,
    handleZoomOut,
    updateRootBlocksIfNeeded,
    updateBlockInNavigationTree,
    isZoomed,
    resetNavigationState
  } = useZoomNavigation({
    currentScriptBlocks,
    setCurrentScriptBlocks
  });

  // Usa hook per drag & drop
  const {
    draggedTool,
    draggedBlock,
    handleDragStart,
    handleToolDragStart,
    handleDragOver,
    handleDrop,
    handleDropAtIndex
  } = useDragAndDrop({
    addBlockToContainer,
    addBlockAtIndex,
    removeBlockRecursive,
    canDropBlock,
    getDropErrorMessage,
    currentScriptBlocks,
    onDropError: (message) => setDropError(message),
    updateBlocks: (updater) => {
      setCurrentScriptBlocks(prev => {
        try {
          const updated = updater(prev);
          
          // Controllo di sicurezza: assicurati che updated sia valido
          if (!updated || !Array.isArray(updated)) {
            console.error('[VisualFlowEditor] Invalid block update: result is not an array', { updated });
            setDropError('Errore nell\'aggiornamento dei blocchi: risultato non valido');
            return prev; // Mantieni lo stato precedente se c'è un errore
          }
          
          // Se siamo in modalità zoom, non dovremmo mai avere un array vuoto
          if (updated.length === 0 && isZoomed) {
            console.warn('[VisualFlowEditor] Attempted to clear blocks while in zoom mode');
            return prev;
          }
          
          // Aggiorna i rootBlocks se siamo in navigazione
          updateRootBlocksIfNeeded(updated);
          
          return updated;
        } catch (error) {
          // Log dettagliato dell'errore per debugging
          console.error('[VisualFlowEditor] Error updating blocks:', error);
          console.error('[VisualFlowEditor] Stack trace:', error instanceof Error ? error.stack : 'N/A');
          console.error('[VisualFlowEditor] Previous state:', prev);
          
          // Feedback all'utente per errori recuperabili
          const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
          setDropError(`Errore durante l'aggiornamento: ${errorMessage}`);
          
          return prev; // Mantieni lo stato precedente in caso di errore
        }
      });
    }
  });

  // Usa hook per gestione script
  const {
    currentScript,
    newScriptDialog,
    setNewScriptDialog,
    handleNewScript,
    confirmNewScript,
    confirmNewMission,
    loadScript,
    loadMission,
    saveScript,
    saveMission
  } = useScriptManagement({
    setCurrentScriptBlocks,
    setShowScriptsList,
    currentScriptBlocks,
    rootBlocks,
    isZoomed,
    resetNavigationState,
    setValidationErrors,
    setDropError
  });

  // Usa hook per conversione JSON
  const { scriptJson } = useJsonConversion({ 
    currentScriptBlocks,
    rootBlocks,
    isZoomed 
  });

  // Funzione helper per verificare se un drop è valido (per AnchorPoint)
  const createDropValidator = (containerId: string, containerType: string, index?: number) => {
    return (e: React.DragEvent) => {
      const blockType = draggedTool?.blockType || draggedBlock?.type;
      if (!blockType) return true;
      return canDropBlock(blockType, containerId, containerType, currentScriptBlocks, index);
    };
  };

  // Carica lista script disponibili al mount
  useEffect(() => {
    if (analysis?.scripts) {
      const scriptItems: ScriptItem[] = analysis.scripts.map(script => ({
        id: script.name || script.fileName,
        name: script.name || script.fileName,
        fileName: script.fileName
      }));
      setAvailableScripts(scriptItems);
    }
  }, [analysis]);


  // Wrapper per loadScript con reset completo dello stato
  const loadScriptWithReset = useCallback(async (scriptId: string) => {
    // Reset completo di tutti gli stati
    setValidationErrors({ errors: 0, invalidBlocks: [] });
    setDropError(null);
    resetNavigationState();
    
    // IMPORTANTE: Pulisci completamente la memoria degli script aperti
    setOpenedScripts(new Map());
    setCurrentScriptContext(null);
    setScriptNavigationPath([]);
    
    return loadScript(scriptId);
  }, [loadScript, resetNavigationState]);

  // Wrapper per loadMission con reset completo dello stato
  const loadMissionWithReset = useCallback(async (missionId: string) => {
    // Reset completo di tutti gli stati
    setValidationErrors({ errors: 0, invalidBlocks: [] });
    setDropError(null);
    resetNavigationState();
    
    // IMPORTANTE: Pulisci completamente la memoria degli script aperti
    setOpenedScripts(new Map());
    setCurrentScriptContext(null);
    setScriptNavigationPath([]);
    
    return loadMission(missionId);
  }, [loadMission, resetNavigationState]);

  // Funzione per navigare a un sub-script - carica un nuovo script mantenendo quello precedente
  const handleNavigateToSubScript = useCallback(async (scriptName: string, parentBlock: IFlowBlock) => {
    try {
      // Controlla se lo script è già stato caricato
      let scriptData = openedScripts.get(scriptName);
      
      if (!scriptData) {
        // Carica lo script via API solo se non è già in cache
        const response = await fetch(`http://localhost:${API_CONSTANTS.DEFAULT_PORT}/api/scripts/${scriptName}?multilingua=true&format=blocks`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success && result.data && result.data.blocks) {
          // Importa le funzioni necessarie per pulire e aggiungere ID
          const { addUniqueIds } = await import('@/utils/CampaignEditor/VisualFlowEditor/blockIdManager');
          const { cleanupScriptBlocks } = await import('@/utils/CampaignEditor/VisualFlowEditor/blockCleaner');
          
          // Pulisci e aggiungi ID ai blocchi
          let blocksToLoad = result.data.blocks || [];
          blocksToLoad = cleanupScriptBlocks(blocksToLoad);
          blocksToLoad = addUniqueIds(blocksToLoad);
          
          // Aggiungi flag isContainer dove necessario
          const addContainerFlags = (blocks: IFlowBlock[]): IFlowBlock[] => {
            return blocks.map(block => {
              const newBlock = { ...block } as IFlowBlock;
              if (block.children || block.thenBlocks || block.elseBlocks || block.blocksMission || block.blocksFinish) {
                newBlock.isContainer = true;
              }
              if (newBlock.children) newBlock.children = addContainerFlags(newBlock.children);
              if (newBlock.thenBlocks) newBlock.thenBlocks = addContainerFlags(newBlock.thenBlocks);
              if (newBlock.elseBlocks) newBlock.elseBlocks = addContainerFlags(newBlock.elseBlocks);
              if (newBlock.blocksMission) newBlock.blocksMission = addContainerFlags(newBlock.blocksMission);
              if (newBlock.blocksFinish) newBlock.blocksFinish = addContainerFlags(newBlock.blocksFinish);
              return newBlock;
            });
          };
          blocksToLoad = addContainerFlags(blocksToLoad);
          
          // Salva lo script nella mappa degli script aperti
          scriptData = {
            scriptName: result.data.name || scriptName,
            fileName: result.data.fileName || scriptName,
            blocks: blocksToLoad,
            isModified: false
          };
          setOpenedScripts(prev => new Map(prev).set(scriptName, scriptData!));
        } else {
          throw new Error('Nessun dato ricevuto dal server');
        }
      }
      
      // Prima di navigare, salva sempre lo stato corrente
      const blocksToSave = isZoomed && rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
      
      if (currentScriptContext && currentScriptContext.isSubScript) {
        // Salva i blocchi correnti del sub-script
        setOpenedScripts(prev => {
          const updated = new Map(prev);
          const current = updated.get(currentScriptContext.scriptName);
          if (current) {
            current.blocks = blocksToSave;
            current.isModified = true;
          }
          return updated;
        });
      } else {
        // Salva lo script principale (o quello che stiamo visualizzando)
        const scriptNameToSave = currentScriptContext?.scriptName || currentScript?.name || 'main';
        setOpenedScripts(prev => {
          const updated = new Map(prev);
          
          // Se lo script esiste già, aggiorna i suoi blocchi
          if (updated.has(scriptNameToSave)) {
            const existing = updated.get(scriptNameToSave)!;
            existing.blocks = blocksToSave;
            existing.isModified = true;
          } else {
            // Altrimenti crea una nuova entry
            updated.set(scriptNameToSave, {
              scriptName: scriptNameToSave,
              fileName: currentScript?.fileName || scriptNameToSave + '.txt',
              blocks: blocksToSave,
              isModified: true
            });
          }
          return updated;
        });
      }
      
      // Reset dello stato di zoom per il nuovo script
      resetNavigationState();
      setRootBlocks([]); // Reset rootBlocks per il nuovo script
      
      // Imposta il nuovo contesto dello script
      setCurrentScriptContext({
        scriptName: scriptName,
        isSubScript: true
      });
      
      // Carica i blocchi del sub-script
      // Se lo script ha un wrapper SCRIPT, usalo, altrimenti creane uno
      let blocksToLoad = scriptData.blocks;
      if (!blocksToLoad.some(b => b.type === 'SCRIPT')) {
        // Crea un wrapper SCRIPT per permettere la navigazione
        blocksToLoad = [{
          id: `script-wrapper-${scriptName}`,
          type: 'SCRIPT',
          scriptName: scriptData.scriptName,
          fileName: scriptData.fileName,
          isContainer: true,
          children: scriptData.blocks
        }];
      }
      
      // Mostra i blocchi del sub-script
      setCurrentScriptBlocks(blocksToLoad);
      
      // Aggiorna il path di navigazione tra script
      setScriptNavigationPath(prev => {
        // Se è vuoto, aggiungi prima lo script principale
        if (prev.length === 0) {
          const mainScriptName = currentScript?.name || 'main';
          return [
            { scriptName: mainScriptName },
            { scriptName: scriptName, parentBlockId: parentBlock.id }
          ];
        }
        
        // Aggiungi sempre il nuovo script al path corrente
        // Questo permette navigazione annidata: A -> B -> C -> D ...
        return [...prev, {
          scriptName: scriptName,
          parentBlockId: parentBlock.id
        }];
      });
      
    } catch (error) {
      console.error('[VisualFlowEditor] Error loading sub-script:', error);
      setDropError(`Errore nel caricamento del sub-script: ${scriptName}`);
    }
  }, [currentScriptBlocks, currentScriptContext, openedScripts, rootBlocks, setRootBlocks, setCurrentScriptBlocks, currentScript, isZoomed, resetNavigationState]);

  // Funzione per navigare indietro tra script
  const handleNavigateBackToScript = useCallback((targetIndex: number) => {
    // NON salvare lo stato corrente se stiamo tornando indietro (come da specifica)
    // Questo significa che le modifiche non salvate del sub-script vanno perse
    
    // Rimuovi dalla memoria tutti gli script dopo il target
    const scriptsToRemove: string[] = [];
    if (targetIndex < 0) {
      // Tornando allo script principale, rimuovi tutti i sub-script
      scriptNavigationPath.forEach(item => {
        if (item.scriptName !== currentScript?.name) {
          scriptsToRemove.push(item.scriptName);
        }
      });
    } else {
      // Tornando a uno script intermedio, rimuovi tutti quelli dopo
      for (let i = targetIndex + 1; i < scriptNavigationPath.length; i++) {
        scriptsToRemove.push(scriptNavigationPath[i].scriptName);
      }
    }
    
    // Rimuovi gli script dalla memoria
    setOpenedScripts(prev => {
      const updated = new Map(prev);
      scriptsToRemove.forEach(scriptName => {
        updated.delete(scriptName);
      });
      return updated;
    });
    
    // Determina quale script caricare
    if (targetIndex < 0) {
      // Torna allo script principale
      const mainScriptName = currentScript?.name || 'main';
      const mainScriptData = openedScripts.get(mainScriptName);
      
      if (mainScriptData) {
        resetNavigationState();
        setRootBlocks([]);
        setCurrentScriptBlocks(mainScriptData.blocks);
        setCurrentScriptContext(null);
        setScriptNavigationPath([]);
      }
    } else if (targetIndex < scriptNavigationPath.length) {
      // Naviga a uno script specifico nel path
      const targetScript = scriptNavigationPath[targetIndex];
      const scriptData = openedScripts.get(targetScript.scriptName);
      
      if (scriptData) {
        resetNavigationState();
        setRootBlocks([]);
        setCurrentScriptBlocks(scriptData.blocks);
        setCurrentScriptContext({
          scriptName: targetScript.scriptName,
          isSubScript: targetIndex > 0 // È sub-script solo se non è il primo nel path
        });
        setScriptNavigationPath(prev => prev.slice(0, targetIndex + 1));
      }
    }
  }, [openedScripts, currentScript, resetNavigationState, scriptNavigationPath, setRootBlocks]);

  // Estendi sessionData con le label dello script, availableScripts e la funzione di navigazione
  const extendedSessionData = React.useMemo(() => ({
    ...sessionData,
    scriptLabels,
    goToLabel,
    availableScripts,
    onNavigateToSubScript: handleNavigateToSubScript
  }), [sessionData, scriptLabels, goToLabel, availableScripts, handleNavigateToSubScript]);

  // Carica script se viene passato uno scriptId dal componente chiamante
  useEffect(() => {
    if (scriptId) {
      loadScriptWithReset(scriptId);
    }
  }, [scriptId, loadScriptWithReset]);

  // Ref per il timeout di debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref per i timeout di highlighting (per evitare memory leak)
  const highlightTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  
  // Ref per tracking del numero massimo di timeout attivi
  const maxActiveTimeouts = useRef<number>(0);
  
  // Funzione helper per gestione sicura dei timeout
  const addSafeTimeout = useCallback((callback: () => void, delay: number): NodeJS.Timeout | null => {
    // Limit massimo di timeout attivi per prevenire accumulo
    const MAX_CONCURRENT_TIMEOUTS = PERFORMANCE_CONSTANTS.MAX_CONCURRENT_TIMEOUTS;
    
    if (highlightTimeoutsRef.current.size >= MAX_CONCURRENT_TIMEOUTS) {
      console.warn(`[VisualFlowEditor] Maximum timeout limit reached (${MAX_CONCURRENT_TIMEOUTS}), skipping timeout`);
      return null;
    }
    
    const timeoutId = setTimeout(() => {
      try {
        callback();
      } catch (error) {
        console.error('[VisualFlowEditor] Error in timeout callback:', error);
        // Notifica l'utente dell'errore nel timeout callback
        const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
        setDropError(`Errore durante l'operazione: ${errorMessage}`);
      } finally {
        highlightTimeoutsRef.current.delete(timeoutId);
      }
    }, delay);
    
    highlightTimeoutsRef.current.add(timeoutId);
    
    // Track maximum number for monitoring
    if (highlightTimeoutsRef.current.size > maxActiveTimeouts.current) {
      maxActiveTimeouts.current = highlightTimeoutsRef.current.size;
      if (maxActiveTimeouts.current > PERFORMANCE_CONSTANTS.HIGH_TIMEOUT_WARNING) {
        console.warn(`[VisualFlowEditor] High timeout count detected: ${maxActiveTimeouts.current}`);
      }
    }
    
    return timeoutId;
  }, []);
  
  // Cleanup function per tutti i timeout attivi
  const clearAllTimeouts = useCallback(() => {
    highlightTimeoutsRef.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    highlightTimeoutsRef.current.clear();
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);
  
  // Validazione automatica con debouncing e performance monitoring per script grandi
  useEffect(() => {
    // Cancella timeout precedente per implementare vero debouncing
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      const blocksToValidate = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
      if (blocksToValidate.length > 0) {
        let validationResult;
        if (blocksToValidate.length > PERFORMANCE_CONSTANTS.LARGE_SCRIPT_THRESHOLD) {
          const startTime = performance.now();
          validationResult = validateAllBlocks(blocksToValidate);
          const endTime = performance.now();
          // Performance monitoring: ${blocksToValidate.length} blocks validated in ${(endTime - startTime).toFixed(2)}ms
        } else {
          validationResult = validateAllBlocks(blocksToValidate);
        }
        setValidationErrors(validationResult);
        
        // Popola la mappa dei tipi di validazione
        const typeMap = new Map<string, 'error' | 'warning'>();
        if (validationResult.details) {
          validationResult.details.forEach(detail => {
            if (!typeMap.has(detail.blockId) || detail.type === 'error') {
              // Se un blocco ha sia error che warning, priorità a error
              typeMap.set(detail.blockId, detail.type || 'error');
            }
          });
        }
        setBlockValidationTypes(typeMap);
      } else {
        setValidationErrors({ errors: 0, invalidBlocks: [] });
        setBlockValidationTypes(new Map());
      }
    }, TIMEOUT_CONSTANTS.VALIDATION_DEBOUNCE); // Debounce come da specifica
    
    // Cleanup del timeout
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [currentScriptBlocks, rootBlocks, currentLanguage]); // validateAllBlocks rimosso per evitare loop
  
  // Cleanup al unmount del componente
  useEffect(() => {
    return clearAllTimeouts;
  }, [clearAllTimeouts]);

  // Ricostruisce lo stato delle scene quando cambiano i blocchi o viene caricato uno script
  useEffect(() => {
    // Pulisci le scene precedenti
    clearScenes();
    
    // Funzione ricorsiva per analizzare i blocchi e ricostruire lo stato delle scene
    const reconstructScenes = (blocks: IFlowBlock[]) => {
      for (const block of blocks) {
        // Se troviamo SHOWDLGSCENE, aggiungi una nuova scena
        if (block.type === 'SHOWDLGSCENE') {
          showDialogScene();
        }
        // Se troviamo HIDEDLGSCENE, chiudi la scena corrente
        else if (block.type === 'HIDEDLGSCENE') {
          hideDialogScene();
        }
        
        // Ricorsione per blocchi annidati
        if (block.type === 'IF') {
          if (block.thenBlocks) reconstructScenes(block.thenBlocks);
          if (block.elseBlocks) reconstructScenes(block.elseBlocks);
        } else if (block.type === 'MENU' && block.children) {
          reconstructScenes(block.children);
        } else if (block.type === 'OPT' && block.children) {
          reconstructScenes(block.children);
        } else if (block.type === 'BUILD') {
          if (block.blockInit) reconstructScenes(block.blockInit);
          if (block.blockStart) reconstructScenes(block.blockStart);
        } else if (block.type === 'FLIGHT') {
          if (block.blockInit) reconstructScenes(block.blockInit);
          if (block.blockStart) reconstructScenes(block.blockStart);
          if (block.blockEvaluate) reconstructScenes(block.blockEvaluate);
        } else if (block.type === 'MISSION') {
          if (block.blocksMission) reconstructScenes(block.blocksMission);
          if (block.blocksFinish) reconstructScenes(block.blocksFinish);
        } else if (block.children) {
          reconstructScenes(block.children);
        }
      }
    };
    
    // Ricostruisci le scene dai blocchi correnti
    const blocksToAnalyze = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
    if (blocksToAnalyze.length > 0) {
      reconstructScenes(blocksToAnalyze);
    }
  }, [currentScriptBlocks, rootBlocks, clearScenes, showDialogScene, hideDialogScene]); // Dipende dai blocchi e dalle funzioni del context

  if (isLoading) {
    return (
      <div className={visualFlowEditorStyles.loadingState}>
        <Code2 className="w-8 h-8 animate-pulse" />
        <span>{t('visualFlowEditor.loading')}</span>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`${visualFlowEditorStyles.container} ${isFlowFullscreen ? 'h-full overflow-hidden' : ''}`}>
      <Toolbar
        isFlowFullscreen={isFlowFullscreen}
        toggleFlowFullscreen={toggleFlowFullscreen}
        showScriptsList={showScriptsList}
        setShowScriptsList={setShowScriptsList}
        showMissionsList={showMissionsList}
        setShowMissionsList={setShowMissionsList}
        showJsonView={showJsonView}
        setShowJsonView={setShowJsonView}
        handleNewScript={handleNewScript}
        currentScript={currentScript}
        isZoomed={isZoomed}
        onZoomOut={handleZoomOut}
        navigationPath={navigationPath}
        scriptNavigationPath={scriptNavigationPath}
        onNavigateToScript={handleNavigateBackToScript}
        validationErrors={validationErrors.errors}
        validationWarnings={validationErrors.warnings}
        onValidationErrorsClick={() => setShowValidationDetails('errors')}
        onValidationWarningsClick={() => setShowValidationDetails('warnings')}
        scriptsButtonRef={scriptsButtonRef}
        missionsButtonRef={missionsButtonRef}
        onSaveScript={() => {
          // Aggiorna lo stato corrente nella mappa prima di salvare
          const updatedOpenedScripts = new Map(openedScripts);
          
          if (currentScriptContext && currentScriptContext.isSubScript) {
            // Salva lo stato corrente del sub-script
            const blocksToSave = isZoomed && rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
            const current = updatedOpenedScripts.get(currentScriptContext.scriptName);
            if (current) {
              current.blocks = blocksToSave;
              current.isModified = true;
            }
          } else {
            // Salva lo stato dello script principale
            const mainScriptName = currentScript?.name || 'main';
            const blocksToSave = isZoomed && rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
            
            // Solo se lo script principale non è già nella mappa, aggiungilo
            if (!updatedOpenedScripts.has(mainScriptName)) {
              updatedOpenedScripts.set(mainScriptName, {
                scriptName: mainScriptName,
                fileName: currentScript?.fileName || 'main.txt',
                blocks: blocksToSave,
                isModified: true
              });
            } else {
              // Aggiorna i blocchi dello script principale esistente
              const mainScript = updatedOpenedScripts.get(mainScriptName);
              if (mainScript) {
                mainScript.blocks = blocksToSave;
                mainScript.isModified = true;
              }
            }
          }
          
          // Determina se salvare come Script o Mission basandosi sul tipo del blocco principale
          const mainBlock = currentScriptBlocks[0];
          if (mainBlock && mainBlock.type === 'MISSION') {
            return saveMission();
          } else {
            // Se siamo in un sub-script, salva tutti gli script modificati
            // Altrimenti salva solo lo script corrente
            if (currentScriptContext && currentScriptContext.isSubScript) {
              return saveScript(updatedOpenedScripts);
            } else {
              // Salva solo lo script principale
              const mainOnlyMap = new Map();
              const mainScriptName = currentScript?.name || 'main';
              const mainScript = updatedOpenedScripts.get(mainScriptName);
              if (mainScript) {
                mainOnlyMap.set(mainScriptName, mainScript);
              }
              return saveScript(mainOnlyMap);
            }
          }
        }}
      />

      <ScriptsList
        showScriptsList={showScriptsList}
        setShowScriptsList={setShowScriptsList}
        availableScripts={availableScripts}
        loadScript={loadScriptWithReset}
        buttonRef={scriptsButtonRef}
      />
      
      <MissionsList
        showMissionsList={showMissionsList}
        setShowMissionsList={setShowMissionsList}
        loadMission={loadMissionWithReset}
        buttonRef={missionsButtonRef}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Nuovo pannello strumenti con categorie */}
        <ToolsPanel onToolDragStart={handleToolDragStart} />

        {/* Canvas area */}
        <div className="flex-1 bg-slate-900 p-8 overflow-auto">
          {currentScriptBlocks.length > 0 ? (
            <div className="max-w-6xl mx-auto">
              {currentScriptBlocks.map(block => (
                <BlockRenderer
                  key={block.id}
                  block={block}
                  invalidBlocks={validationErrors.invalidBlocks}
                  blockValidationTypes={blockValidationTypes}
                  allBlocks={currentScriptBlocks}
                  onUpdateBlock={(id, updates) => {
                    setCurrentScriptBlocks(prev => {
                      const updated = updateBlockRecursive(prev, id, updates);
                      // Sincronizza con rootBlocks se siamo in zoom
                      if (isZoomed && updated.length > 0) {
                        updateRootBlocksIfNeeded(updated);
                      }
                      return updated;
                    });
                  }}
                  onRemoveBlock={(id) => {
                    setCurrentScriptBlocks(prev => {
                      const updated = removeBlockRecursive(prev, id);
                      // Sincronizza con rootBlocks se siamo in zoom
                      if (isZoomed && updated.length > 0) {
                        updateRootBlocksIfNeeded(updated);
                      }
                      return updated;
                    });
                  }}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDropAtIndex={handleDropAtIndex}
                  isDragActive={!!draggedBlock || !!draggedTool}
                  onZoomIn={handleZoomIn}
                  onZoomOut={() => handleZoomOut()}
                  isZoomed={isZoomed}
                  currentFocusedBlockId={currentFocusedBlockId}
                  sessionData={extendedSessionData}
                  createDropValidator={createDropValidator}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <Code2 className={`w-${UI_CONSTANTS.ICON_SIZE} h-${UI_CONSTANTS.ICON_SIZE} mx-auto mb-4 opacity-50`} />
                <p>{t('visualFlowEditor.noScriptLoaded')}</p>
              </div>
            </div>
          )}
        </div>
        
        <JsonView
          showJsonView={showJsonView}
          scriptJson={scriptJson}
        />
      </div>

      <NewScriptDialog
        newScriptDialog={newScriptDialog}
        setNewScriptDialog={setNewScriptDialog}
        confirmNewScript={confirmNewScript}
        confirmNewMission={confirmNewMission}
      />
      
      {/* Modal per errori di drop */}
      {dropError && (
        <ErrorModal
          message={dropError}
          duration={TIMEOUT_CONSTANTS.ERROR_MODAL_DURATION}
          onClose={() => setDropError(null)}
        />
      )}
      
      {/* Modal dettagli errori di validazione */}
      {showValidationDetails && validationErrors.details && (
        <ValidationErrorsModal
          errors={validationErrors.details}
          displayType={showValidationDetails}
          onClose={() => setShowValidationDetails(false)}
          onNavigateToBlock={(blockId) => {
            // Cerca il blocco nell'albero e naviga ad esso
            const findAndNavigate = (blocks: IFlowBlock[], targetId: string, path: IFlowBlock[] = []): boolean => {
              for (const block of blocks) {
                if (block.id === targetId) {
                  // Se il blocco è in un container zoomato, prima esci dallo zoom
                  if (isZoomed && path.length > 0) {
                    // Naviga al container che contiene il blocco
                    handleZoomIn(path[path.length - 1].id);
                  }
                  // Scrolla al blocco dopo un breve delay per permettere il rendering con safe timeout
                  addSafeTimeout(() => {
                    const element = document.querySelector(`[data-block-id="${targetId}"]`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // Aggiungi un'animazione di highlight
                      element.classList.add(`ring-${UI_CONSTANTS.RING_WIDTH_ERROR}`, 'ring-red-500', 'ring-opacity-75');
                      addSafeTimeout(() => {
                        element.classList.remove(`ring-${UI_CONSTANTS.RING_WIDTH_ERROR}`, 'ring-red-500', 'ring-opacity-75');
                      }, TIMEOUT_CONSTANTS.HIGHLIGHT_DURATION);
                    }
                  }, TIMEOUT_CONSTANTS.SCROLL_DELAY);
                  return true;
                }
                
                // Cerca nei children
                if (block.children) {
                  if (findAndNavigate(block.children, targetId, [...path, block])) return true;
                }
                // Cerca nei blocchi IF
                if (block.type === 'IF') {
                  if (block.thenBlocks && findAndNavigate(block.thenBlocks, targetId, [...path, block])) return true;
                  if (block.elseBlocks && findAndNavigate(block.elseBlocks, targetId, [...path, block])) return true;
                }
                // Cerca nei blocchi MISSION
                if (block.type === 'MISSION') {
                  if (block.blocksMission && findAndNavigate(block.blocksMission, targetId, [...path, block])) return true;
                  if (block.blocksFinish && findAndNavigate(block.blocksFinish, targetId, [...path, block])) return true;
                }
                // Cerca nei blocchi BUILD
                if (block.type === 'BUILD') {
                  if (block.blockInit && findAndNavigate(block.blockInit, targetId, [...path, block])) return true;
                  if (block.blockStart && findAndNavigate(block.blockStart, targetId, [...path, block])) return true;
                }
                // Cerca nei blocchi FLIGHT
                if (block.type === 'FLIGHT') {
                  if (block.blockInit && findAndNavigate(block.blockInit, targetId, [...path, block])) return true;
                  if (block.blockStart && findAndNavigate(block.blockStart, targetId, [...path, block])) return true;
                  if (block.blockEvaluate && findAndNavigate(block.blockEvaluate, targetId, [...path, block])) return true;
                }
              }
              return false;
            };
            
            const blocksToSearch = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
            findAndNavigate(blocksToSearch, blockId);
            setShowValidationDetails(false);
          }}
        />
      )}
    </div>
    </ErrorBoundary>
  );
};

// Export del componente wrappato con SceneProvider
export const VisualFlowEditor: React.FC<VisualFlowEditorProps> = (props) => {
  return (
    <SceneProvider>
      <VisualFlowEditorInternal {...props} />
    </SceneProvider>
  );
};
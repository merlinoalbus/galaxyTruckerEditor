import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Code2 } from 'lucide-react';

import { useVisualFlowEditor } from '@/hooks/CampaignEditor/VisualFlowEditor/useVisualFlowEditor';
import { visualFlowEditorStyles } from '@/styles/CampaignEditor/VisualFlowEditor/VisualFlowEditor.styles';
import { useFullscreen } from '@/contexts/FullscreenContext';
import type { VisualFlowEditorProps } from '@/types/CampaignEditor/VisualFlowEditor/VisualFlowEditor.types';
import { useTranslation } from '@/locales';
import { useLanguage } from '@/contexts/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { logger } from '@/utils/logger';
import type { IFlowBlock, ValidationResult, ScriptContext, OpenedScript } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';
import { TIMEOUT_CONSTANTS, PERFORMANCE_CONSTANTS, UI_CONSTANTS } from '@/constants/VisualFlowEditor.constants';
import { API_CONFIG } from '@/config/constants';
import { SceneProvider, useScene } from '@/contexts/SceneContext';
import { ScriptMetadataProvider } from '@/contexts/ScriptMetadataContext';
import { AchievementsImagesProvider } from '@/contexts/AchievementsImagesContext';

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
import { collectAllBlocks } from '@/utils/CampaignEditor/VisualFlowEditor/collectAllBlocks';
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
  const { showDialogScene, hideDialogScene, clearScenes } = useScene();

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
  
  // Collapse/Expand All state
  const [collapseAllTrigger, setCollapseAllTrigger] = useState(0);
  const [expandAllTrigger, setExpandAllTrigger] = useState(0);
  const [globalCollapseState, setGlobalCollapseState] = useState<'collapsed' | 'expanded' | 'manual'>('manual');
  
  // Mappa per tracciare il tipo di validazione per ogni blocco
  const [blockValidationTypes, setBlockValidationTypes] = useState<Map<string, 'error' | 'warning'>>(new Map());
  
  // Set per tracciare gli errori bypassati
  const [bypassedErrors, setBypassedErrors] = useState<Set<string>>(new Set());
  
  // Multi-script management - tiene traccia di tutti gli script aperti
  const [openedScripts, setOpenedScripts] = useState<Map<string, OpenedScript>>(new Map());
  
  // Script corrente in visualizzazione (può essere main o sub-script)
  const [currentScriptContext, setCurrentScriptContext] = useState<ScriptContext | null>(null);
  
  // Button refs per posizionamento contestuale
  const scriptsButtonRef = React.useRef<HTMLButtonElement>(null);
  const missionsButtonRef = React.useRef<HTMLButtonElement>(null);

  // Usa hook per dati di sessione (variabili, semafori, labels, scripts, missions)
  const sessionData = useSessionData();
  
  // Raccogli le label presenti nello script corrente
  const scriptLabels = React.useMemo(() => {
    return collectScriptLabels(currentScriptBlocks);
  }, [currentScriptBlocks]);
  
  // Funzioni per Collapse/Expand All
  const handleCollapseAll = useCallback(() => {
    setGlobalCollapseState('collapsed');
    setCollapseAllTrigger(prev => prev + 1);
  }, []);
  
  const handleExpandAll = useCallback(() => {
    setGlobalCollapseState('expanded');
    setExpandAllTrigger(prev => prev + 1);
  }, []);
  
  // Funzione per gestire il bypass degli errori
  const handleToggleBypass = useCallback((blockId: string) => {
    setBypassedErrors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  }, []);
  
  // Funzione per navigare a un blocco LABEL
  const goToLabel = useCallback((labelName: string) => {
    // Funzione per trovare il blocco LABEL con limite di ricorsione
    const findLabelBlock = (blocks: IFlowBlock[], path: IFlowBlock[] = [], depth: number = 0): { block: IFlowBlock, path: IFlowBlock[] } | null => {
      // Limite di ricorsione per prevenire stack overflow
      const MAX_RECURSION_DEPTH = PERFORMANCE_CONSTANTS.MAX_RECURSION_DEPTH;
      if (depth > MAX_RECURSION_DEPTH) {
  logger.warn(`Maximum recursion depth (${MAX_RECURSION_DEPTH}) reached while searching for label: ${labelName}`);
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
        // Evidenzia temporaneamente il blocco
        element.classList.add(`ring-${UI_CONSTANTS.RING_WIDTH_HIGHLIGHT}`, 'ring-blue-500', `ring-offset-${UI_CONSTANTS.RING_OFFSET}`, 'ring-offset-slate-900');
        window.setTimeout(() => {
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

  // Usa hook per gestione script (prima di useZoomNavigation che lo usa)
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
    rootBlocks: [],  // Temporaneo, verrà aggiornato dopo
    isZoomed: false,  // Temporaneo, verrà aggiornato dopo
    resetNavigationState: () => {},  // Temporaneo, verrà aggiornato dopo
    setValidationErrors,
    setDropError
  });
  
  // Usa hook per zoom navigation con supporto unificato per script e sub-script
  const {
    navigationPath,
    setNavigationPath,
    currentFocusedBlockId,
    rootBlocks,
    setRootBlocks,
    handleZoomIn,
    handleZoomOut,
    updateRootBlocksIfNeeded,
    isZoomed,
    resetNavigationState,
    scriptNavigationPath,
    setScriptNavigationPath,
    handleNavigateToSubScript,
    handleNavigateBackToScript
  } = useZoomNavigation({
    currentScriptBlocks,
    setCurrentScriptBlocks,
    openedScripts,
    setOpenedScripts,
    currentScriptContext,
    setCurrentScriptContext,
    currentScript
  });

  // Listener globale per richieste di navigazione a script (es. dai blocchi HelpScript)
  useEffect(() => {
    const onNavigateToScript = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.scriptName) {
        // parentBlockId non è obbligatorio per la navigazione
        handleNavigateToSubScript(detail.scriptName, { id: detail.parentBlockId || '', type: 'SUB_SCRIPT' } as any);
      }
    };
    window.addEventListener('VFE:navigateToScript', onNavigateToScript as EventListener);
    return () => window.removeEventListener('VFE:navigateToScript', onNavigateToScript as EventListener);
  }, [handleNavigateToSubScript]);

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
            logger.error('[VisualFlowEditor] Invalid block update: result is not an array', { updated });
            setDropError('Errore nell\'aggiornamento dei blocchi: risultato non valido');
            return prev; // Mantieni lo stato precedente se c'è un errore
          }
          
          // Se siamo in modalità zoom, non dovremmo mai avere un array vuoto
          if (updated.length === 0 && isZoomed) {
            logger.warn('[VisualFlowEditor] Attempted to clear blocks while in zoom mode');
            return prev;
          }
          
          // Aggiorna i rootBlocks se siamo in navigazione
          updateRootBlocksIfNeeded(updated);
          
          return updated;
        } catch (error) {
          // Log dettagliato dell'errore per debugging
          logger.error('[VisualFlowEditor] Error updating blocks:', error);
          logger.error('[VisualFlowEditor] Stack trace:', error instanceof Error ? error.stack : 'N/A');
          logger.error('[VisualFlowEditor] Previous state:', prev);
          
          // Feedback all'utente per errori recuperabili
          const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
          setDropError(`Errore durante l'aggiornamento: ${errorMessage}`);
          
          return prev; // Mantieni lo stato precedente in caso di errore
        }
      });
    }
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
    
    // IMPORTANTE: Pulisci completamente la memoria degli script aperti ma prepara per salvare lo script principale
    const newOpenedScripts = new Map<string, OpenedScript>();
    setOpenedScripts(newOpenedScripts);
    setCurrentScriptContext(null);
  setScriptNavigationPath([]);
    
    const scriptData = await loadScript(scriptId);
    return scriptData;
  }, [loadScript, resetNavigationState, setScriptNavigationPath]);

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
  }, [loadMission, resetNavigationState, setScriptNavigationPath]);

  // Funzione per navigare a una missione specifica - DEVE funzionare ESATTAMENTE come sub_script
  const handleNavigateToMission = useCallback(async (missionName: string, parentBlock: IFlowBlock) => {
    try {
      // Il backend si aspetta il nome della missione senza .txt
      const cleanMissionName = missionName.endsWith('.txt') ? missionName.slice(0, -4) : missionName;
      
      // PRIMA di qualsiasi reset, calcola il nuovo path di navigazione
  // PRIMA di qualsiasi reset, eventuali riferimenti per la navigazione verranno gestiti più avanti
      
  // Salva il path di zoom corrente PRIMA di navigare alla missione (non utilizzato direttamente)
      
      // Controlla se la missione è già stata caricata
      let missionData = openedScripts.get(cleanMissionName);
      
      if (!missionData) {
        // Carica la missione via API solo se non è già in cache
        const response = await fetch(`${API_CONFIG.API_BASE_URL}/missions/${cleanMissionName}?multilingua=true&format=blocks`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success && result.data) {
          // Importa le funzioni necessarie per pulire e aggiungere ID
          const { addUniqueIds } = await import('@/utils/CampaignEditor/VisualFlowEditor/blockIdManager');
          const { cleanupScriptBlocks } = await import('@/utils/CampaignEditor/VisualFlowEditor/blockCleaner');
          
          // Processa blocksMission e blocksFinish
          let blocksMission = result.data.blocksMission ? result.data.blocksMission : [];
          let blocksFinish = result.data.blocksFinish ? result.data.blocksFinish : [];
          
          blocksMission = cleanupScriptBlocks(blocksMission);
          blocksMission = addUniqueIds(blocksMission);
          blocksFinish = cleanupScriptBlocks(blocksFinish);
          blocksFinish = addUniqueIds(blocksFinish);
          
          // Crea il blocco MISSION principale con tipizzazione corretta
          const missionBlock: IFlowBlock = {
            id: `mission-${cleanMissionName}`,
            type: 'MISSION' as const,
            isContainer: true,
            blocksMission: blocksMission,
            blocksFinish: blocksFinish,
            name: result.data.name,
            missionName: result.data.name,
            fileName: result.data.fileName
          };
          
          const blocksToLoad = [missionBlock];
          
          // Salva la missione nella mappa degli script aperti
          missionData = {
            scriptName: cleanMissionName,
            fileName: result.data.fileName || cleanMissionName,
            blocks: blocksToLoad,
            originalBlocks: JSON.parse(JSON.stringify(blocksToLoad)),
            isModified: false
          };
          const updatedScripts = new Map(openedScripts);
          updatedScripts.set(cleanMissionName, missionData);
          
          // Salva lo stato corrente dello script USANDO LA MAPPA GIÀ AGGIORNATA
          const blocksToSave = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
          
          if (currentScriptContext && (currentScriptContext.isSubScript || currentScriptContext.isMission)) {
            // Salva i blocchi correnti del sub-script o missione
            const current = updatedScripts.get(currentScriptContext.scriptName);
            if (current) {
              current.blocks = blocksToSave;
              current.isModified = true;
            }
          } else {
            // Salva lo script principale
            const scriptNameToSave = currentScriptContext?.scriptName || currentScript?.name || 'main';
            
            if (updatedScripts.has(scriptNameToSave)) {
              const existing = updatedScripts.get(scriptNameToSave)!;
              existing.blocks = blocksToSave;
              existing.isModified = true;
            } else {
              updatedScripts.set(scriptNameToSave, {
                scriptName: scriptNameToSave,
                fileName: currentScript?.fileName || scriptNameToSave + '.txt',
                blocks: blocksToSave,
                isModified: true
              });
            }
          }
          
          // Salva la mappa aggiornata
          setOpenedScripts(updatedScripts);
        } else {
          throw new Error('Nessun dato ricevuto dal server');
        }
      } else {
        // Missione già caricata, salva comunque lo stato corrente
        const blocksToSave = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
        const updatedScripts = new Map(openedScripts);
        
        if (currentScriptContext && (currentScriptContext.isSubScript || currentScriptContext.isMission)) {
          const current = updatedScripts.get(currentScriptContext.scriptName);
          if (current) {
            current.blocks = blocksToSave;
            current.isModified = true;
          }
        } else {
          const scriptNameToSave = currentScriptContext?.scriptName || currentScript?.name || 'main';
          
          if (updatedScripts.has(scriptNameToSave)) {
            const existing = updatedScripts.get(scriptNameToSave)!;
            existing.blocks = blocksToSave;
            existing.isModified = true;
          } else {
            updatedScripts.set(scriptNameToSave, {
              scriptName: scriptNameToSave,
              fileName: currentScript?.fileName || scriptNameToSave + '.txt',
              blocks: blocksToSave,
              isModified: true
            });
          }
        }
        
        setOpenedScripts(updatedScripts);
      }
      
      // Reset solo degli stati di validazione ed errori, NON del path di navigazione
      setValidationErrors({ errors: 0, invalidBlocks: [] });
      setDropError(null);
      
  // Non azzerare il breadcrumb: preserva l'attuale path (solo elementi con nome)
  const preservedPath = navigationPath.filter(i => i.name);
  setRootBlocks([]);
      
      // Imposta il nuovo contesto della missione
      setCurrentScriptContext({
        scriptName: cleanMissionName,
        isSubScript: false, // Le missioni sono script di primo livello
        isMission: true
      });
      
      // Usa i blocchi della missione - ora missionData è garantito non essere undefined
      const sourceBlocks = missionData.originalBlocks || missionData.blocks;
      let blocksToLoad = JSON.parse(JSON.stringify(sourceBlocks));
      
  // Mantieni i marker esistenti e aggiungi il nuovo marker della missione.
  // Nota: non ricalcoliamo basePath perché non utilizzato
      const newNavigationPath = [
        ...preservedPath,
        {
          id: `mission-${cleanMissionName}`,
          name: cleanMissionName,
          block: blocksToLoad[0]
        }
      ];
  try { if ((window as any).__VFE_NAV_DEBUG__) { logger.debug('[NAV] -> enter mission', { from: navigationPath, to: newNavigationPath }); } } catch {}
      setNavigationPath(newNavigationPath);
      setCurrentScriptBlocks(blocksToLoad);
      
      // Aggiorna anche lo scriptNavigationPath mantenendo la catena, come per i subscript
      setScriptNavigationPath(prev => {
        if (prev.length === 0) {
          const main = currentScript?.name || 'main';
          return [
            { scriptName: main },
            { scriptName: cleanMissionName, parentBlockId: parentBlock.id }
          ];
        }
        return [
          ...prev,
          { scriptName: cleanMissionName, parentBlockId: parentBlock.id }
        ];
      });
      
    } catch (error) {
  logger.error('[VisualFlowEditor] Error loading mission:', error);
      throw error;
    }
  }, [currentScriptBlocks, currentScriptContext, openedScripts, rootBlocks, setOpenedScripts, setCurrentScriptContext, currentScript, navigationPath, setCurrentScriptBlocks, setScriptNavigationPath, setNavigationPath, setRootBlocks, setValidationErrors, setDropError]);

  // Wrapper per handleZoomIn che gestisce anche ACT_MISSION
  const handleZoomInWithMissionSupport = useCallback((blockId: string) => {
    // Prima cerca il blocco per vedere se è ACT_MISSION
    const searchIn = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
    
    // Funzione helper per trovare un blocco per ID
    const findBlockById = (blocks: any[], targetId: string): any => {
      for (const block of blocks) {
        if (block.id === targetId) {
          return block;
        }
        
        // Cerca ricorsivamente
        if (block.children) {
          const found = findBlockById(block.children, targetId);
          if (found) return found;
        }
        if (block.thenBlocks) {
          const found = findBlockById(block.thenBlocks, targetId);
          if (found) return found;
        }
        if (block.elseBlocks) {
          const found = findBlockById(block.elseBlocks, targetId);
          if (found) return found;
        }
        if (block.blocksMission) {
          const found = findBlockById(block.blocksMission, targetId);
          if (found) return found;
        }
        if (block.blocksFinish) {
          const found = findBlockById(block.blocksFinish, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    
    const targetBlock = findBlockById(searchIn, blockId);
    
    // Se il blocco è ACT_MISSION, naviga alla missione invece di fare zoom
    if (targetBlock && targetBlock.type === 'ACT_MISSION') {
      const missionName = targetBlock.parameters?.missionName || targetBlock.missionName;
      if (missionName) {
        handleNavigateToMission(missionName, targetBlock);
        return;
      }
    }
    
    // Altrimenti, usa la logica normale di zoom
    handleZoomIn(blockId);
  }, [rootBlocks, currentScriptBlocks, handleNavigateToMission, handleZoomIn]);

  // Le funzioni handleNavigateToSubScript e handleNavigateBackToScript sono ora gestite dall'hook useZoomNavigation
  // Rimangono solo come wrapper per mantenere compatibilità

  // Estendi sessionData con le label dello script, availableScripts e la funzione di navigazione
  const extendedSessionData = React.useMemo(() => {
    // Calcola nome script corrente (main o sub/mission) e nome mission corrente se in contesto missione
    const currentScriptNameComputed = currentScriptContext?.scriptName || currentScript?.name || 'main';
    let currentMissionNameComputed: string | undefined;
    if (currentScriptContext?.isMission) {
      currentMissionNameComputed = currentScriptContext.scriptName;
    } else if (currentScriptBlocks?.[0]?.type === 'MISSION') {
      currentMissionNameComputed = (currentScriptBlocks?.[0] as any)?.missionName || (currentScriptBlocks?.[0] as any)?.name;
    }

    return ({
      ...sessionData,
      scriptLabels,
      goToLabel,
      availableScripts,
      currentScriptName: currentScriptNameComputed,
      currentMissionName: currentMissionNameComputed,
      onNavigateToSubScript: handleNavigateToSubScript,
      onNavigateToMission: handleNavigateToMission,
      navigationPath: scriptNavigationPath, // Usa scriptNavigationPath invece di navigationPath
      onNavigateBack: () => {
      // Naviga al livello precedente nel path degli script
      if (scriptNavigationPath && scriptNavigationPath.length > 1) {
        // Trova l'indice del subscript corrente nel navigationPath
        const subscriptIndex = navigationPath.findIndex(item => item.id.startsWith('subscript-'));
        
        if (subscriptIndex > 0) {
          // Abbiamo un percorso prima del subscript, torna al blocco che contiene il GO
          // Usa handleZoomOut per navigare al blocco che contiene il comando GO
          handleZoomOut(subscriptIndex - 1);
        } else {
          // Fallback: torna allo script precedente
          const targetLevel = scriptNavigationPath.length - 2;
          handleNavigateBackToScript(targetLevel);
        }
      }
      }
    });
  }, [
    sessionData,
    scriptLabels,
    goToLabel,
    availableScripts,
    handleNavigateToSubScript,
    handleNavigateToMission,
    scriptNavigationPath,
    handleNavigateBackToScript,
    navigationPath,
    handleZoomOut,
    currentScriptContext,
    currentScript?.name,
    currentScriptBlocks
  ]);

  // Carica script se viene passato uno scriptId dal componente chiamante
  useEffect(() => {
    if (scriptId) {
      loadScriptWithReset(scriptId);
    }
  }, [scriptId, loadScriptWithReset]);
  
  // Salva lo script principale nella mappa quando viene caricato per la prima volta
  useEffect(() => {
    if (currentScript && currentScriptBlocks.length > 0 && !currentScriptContext) {
      const scriptName = currentScript.name || scriptId || 'main';
      
      setOpenedScripts(prevScripts => {
        // Solo se la mappa è vuota (primo caricamento)
        // Non modificare se ci sono già script nella mappa
        if (prevScripts.size === 0 && !prevScripts.has(scriptName)) {
          const newOpenedScripts = new Map(prevScripts);
          newOpenedScripts.set(scriptName, {
            scriptName: scriptName,
            fileName: currentScript.fileName || scriptName + '.txt',
            blocks: currentScriptBlocks,
            isModified: false
          });
          return newOpenedScripts;
        }
        return prevScripts; // Non modificare se ci sono già script
      });
    }
  }, [currentScript, currentScriptBlocks, currentScriptContext, scriptId, setOpenedScripts]);

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
  logger.warn(`[VisualFlowEditor] Maximum timeout limit reached (${MAX_CONCURRENT_TIMEOUTS}), skipping timeout`);
      return null;
    }
    
    const timeoutId = setTimeout(() => {
      try {
        callback();
      } catch (error) {
  logger.error('[VisualFlowEditor] Error in timeout callback:', error);
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
  logger.warn(`[VisualFlowEditor] High timeout count detected: ${maxActiveTimeouts.current}`);
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
        const validationResult = validateAllBlocks(blocksToValidate, navigationPath);
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
  }, [currentScriptBlocks, rootBlocks, currentLanguage, validateAllBlocks, navigationPath]);
  
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
        validationErrors={Math.max(0, validationErrors.errors - bypassedErrors.size)}
        validationWarnings={validationErrors.warnings}
        onValidationErrorsClick={() => setShowValidationDetails('errors')}
        onValidationWarningsClick={() => setShowValidationDetails('warnings')}
        scriptsButtonRef={scriptsButtonRef}
        missionsButtonRef={missionsButtonRef}
        onCollapseAll={handleCollapseAll}
        onExpandAll={handleExpandAll}
        bypassedErrorsCount={bypassedErrors.size}
        totalErrors={validationErrors.errors}
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
                isModified: true,
                // Includi i metadati custom dal currentScript
                isCustom: currentScript?.isCustom,
                customPath: currentScript?.customPath,
                availableLanguages: currentScript?.availableLanguages
              });
            } else {
              // Aggiorna i blocchi dello script principale esistente
              const mainScript = updatedOpenedScripts.get(mainScriptName);
              if (mainScript) {
                mainScript.blocks = blocksToSave;
                mainScript.isModified = true;
                // Aggiorna anche i metadati custom se presenti
                if (currentScript?.isCustom !== undefined) {
                  mainScript.isCustom = currentScript.isCustom;
                }
                if (currentScript?.customPath !== undefined) {
                  mainScript.customPath = currentScript.customPath;
                }
                if (currentScript?.availableLanguages !== undefined) {
                  mainScript.availableLanguages = currentScript.availableLanguages;
                }
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
            <ScriptMetadataProvider 
              isCustom={currentScript?.isCustom} 
              availableLanguages={currentScript?.availableLanguages}
            >
              <div className="max-w-6xl mx-auto">
                {currentScriptBlocks.map(block => (
                  <BlockRenderer
                  key={block.id}
                  block={block}
                  invalidBlocks={validationErrors.invalidBlocks}
                  blockValidationTypes={blockValidationTypes}
                  allBlocks={collectAllBlocks(currentScriptBlocks)}
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
                  onZoomIn={handleZoomInWithMissionSupport}
                  onZoomOut={() => handleZoomOut()}
                  isZoomed={isZoomed}
                  currentFocusedBlockId={currentFocusedBlockId}
                  sessionData={extendedSessionData}
                  createDropValidator={createDropValidator}
                  collapseAllTrigger={collapseAllTrigger}
                  expandAllTrigger={expandAllTrigger}
                  globalCollapseState={globalCollapseState}
                  isCustom={currentScript?.isCustom}
                  availableLanguages={currentScript?.availableLanguages}
                />
                ))}
              </div>
            </ScriptMetadataProvider>
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
          bypassedErrors={bypassedErrors}
          onToggleBypass={handleToggleBypass}
          onNavigateToBlock={(blockId) => {
            // Cerca il blocco nell'albero e naviga ad esso
            const findAndNavigate = (blocks: IFlowBlock[], targetId: string, path: IFlowBlock[] = []): boolean => {
              for (const block of blocks) {
                if (block.id === targetId) {
                  // Se il blocco è in un container zoomato, prima esci dallo zoom
                  if (isZoomed && path.length > 0) {
                    // Naviga al container che contiene il blocco
                    handleZoomInWithMissionSupport(path[path.length - 1].id);
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
      <AchievementsImagesProvider>
        <VisualFlowEditorInternal {...props} />
      </AchievementsImagesProvider>
    </SceneProvider>
  );
};
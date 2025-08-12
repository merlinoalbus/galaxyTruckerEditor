import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Code2 } from 'lucide-react';

import { useVisualFlowEditor } from '@/hooks/CampaignEditor/VisualFlowEditor/useVisualFlowEditor';
import { visualFlowEditorStyles } from '@/styles/CampaignEditor/VisualFlowEditor/VisualFlowEditor.styles';
import { useFullscreen } from '@/contexts/FullscreenContext';
import type { VisualFlowEditorProps } from '@/types/CampaignEditor/VisualFlowEditor/VisualFlowEditor.types';
import { useTranslation } from '@/locales';
import { useLanguage } from '@/contexts/LanguageContext';

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



export const VisualFlowEditor: React.FC<VisualFlowEditorProps> = ({ 
  analysis,
  scriptId 
}) => {
  const { isFlowFullscreen, toggleFlowFullscreen } = useFullscreen();
  const { isLoading } = useVisualFlowEditor(analysis || null);
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  // Script management state
  const [availableScripts, setAvailableScripts] = useState<ScriptItem[]>([]);
  const [showScriptsList, setShowScriptsList] = useState(false);
  const [showMissionsList, setShowMissionsList] = useState(false);
  const [showJsonView, setShowJsonView] = useState(false);
  
  // Editor state
  const [currentScriptBlocks, setCurrentScriptBlocks] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ errors: number; invalidBlocks: string[]; details?: any[] }>({ errors: 0, invalidBlocks: [] });
  const [dropError, setDropError] = useState<string | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  
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
    // Funzione per trovare il blocco LABEL
    const findLabelBlock = (blocks: any[], path: any[] = []): { block: any, path: any[] } | null => {
      for (const block of blocks) {
        if (block.type === 'LABEL' && block.parameters?.name === labelName) {
          return { block, path };
        }
        
        // Cerca nei figli
        if (block.children) {
          const found = findLabelBlock(block.children, [...path, block]);
          if (found) return found;
        }
        
        // Cerca nei rami IF
        if (block.type === 'IF') {
          if (block.thenBlocks) {
            const found = findLabelBlock(block.thenBlocks, [...path, block]);
            if (found) return found;
          }
          if (block.elseBlocks) {
            const found = findLabelBlock(block.elseBlocks, [...path, block]);
            if (found) return found;
          }
        }
        
        // Cerca nei blocchi MISSION
        if (block.type === 'MISSION') {
          if (block.blocksMission) {
            const found = findLabelBlock(block.blocksMission, [...path, block]);
            if (found) return found;
          }
          if (block.blocksFinish) {
            const found = findLabelBlock(block.blocksFinish, [...path, block]);
            if (found) return found;
          }
        }
        
        // Cerca nei blocchi BUILD
        if (block.type === 'BUILD') {
          if (block.blockInit) {
            const found = findLabelBlock(block.blockInit, [...path, block]);
            if (found) return found;
          }
          if (block.blockStart) {
            const found = findLabelBlock(block.blockStart, [...path, block]);
            if (found) return found;
          }
        }
        
        // Cerca nei blocchi FLIGHT
        if (block.type === 'FLIGHT') {
          if (block.blockInit) {
            const found = findLabelBlock(block.blockInit, [...path, block]);
            if (found) return found;
          }
          if (block.blockStart) {
            const found = findLabelBlock(block.blockStart, [...path, block]);
            if (found) return found;
          }
          if (block.blockEvaluate) {
            const found = findLabelBlock(block.blockEvaluate, [...path, block]);
            if (found) return found;
          }
        }
        
        // Cerca nei blocchi OPT
        if (block.type === 'OPT' && block.children) {
          const found = findLabelBlock(block.children, [...path, block]);
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
        element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'ring-offset-slate-900');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2', 'ring-offset-slate-900');
        }, 2000);
      }
    }
  }, [currentScriptBlocks]);
  
  // Estendi sessionData con le label dello script e la funzione di navigazione
  const extendedSessionData = React.useMemo(() => ({
    ...sessionData,
    scriptLabels,
    goToLabel
  }), [sessionData, scriptLabels, goToLabel]);
  
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
    currentFocusedBlockId,
    rootBlocks,
    handleZoomIn,
    handleZoomOut,
    updateRootBlocksIfNeeded,
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
            return prev; // Mantieni lo stato precedente se c'è un errore
          }
          
          // Se siamo in modalità zoom, non dovremmo mai avere un array vuoto
          if (updated.length === 0 && isZoomed) {
            return prev;
          }
          
          // Aggiorna i rootBlocks se siamo in navigazione
          updateRootBlocksIfNeeded(updated);
          
          return updated;
        } catch (error) {
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
    return loadScript(scriptId);
  }, [loadScript, resetNavigationState]);

  // Wrapper per loadMission con reset completo dello stato
  const loadMissionWithReset = useCallback(async (missionId: string) => {
    // Reset completo di tutti gli stati
    setValidationErrors({ errors: 0, invalidBlocks: [] });
    setDropError(null);
    resetNavigationState();
    return loadMission(missionId);
  }, [loadMission, resetNavigationState]);

  // Carica script se viene passato uno scriptId dal componente chiamante
  useEffect(() => {
    if (scriptId) {
      loadScriptWithReset(scriptId);
    }
  }, [scriptId, loadScriptWithReset]);

  // Validazione automatica quando cambiano i blocchi o la lingua
  // NOTA: validateAllBlocks NON è memoizzato, quindi usa sempre la funzione t corrente
  useEffect(() => {
    const blocksToValidate = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
    if (blocksToValidate.length > 0) {
      const validation = validateAllBlocks(blocksToValidate);
      setValidationErrors(validation);
    }
  }, [currentScriptBlocks, rootBlocks, currentLanguage]); // Solo currentLanguage, NON validateAllBlocks!

  if (isLoading) {
    return (
      <div className={visualFlowEditorStyles.loadingState}>
        <Code2 className="w-8 h-8 animate-pulse" />
        <span>{t('visualFlowEditor.loading')}</span>
      </div>
    );
  }

  return (
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
        validationErrors={validationErrors.errors}
        onValidationErrorsClick={() => setShowValidationDetails(true)}
        scriptsButtonRef={scriptsButtonRef}
        missionsButtonRef={missionsButtonRef}
        onSaveScript={() => {
          // Determina se salvare come Script o Mission basandosi sul tipo del blocco principale
          const mainBlock = rootBlocks.length > 0 ? rootBlocks[0] : currentScriptBlocks[0];
          if (mainBlock && mainBlock.type === 'MISSION') {
            return saveMission();
          } else {
            return saveScript();
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
                <Code2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
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
          duration={5000}
          onClose={() => setDropError(null)}
        />
      )}
      
      {/* Modal dettagli errori di validazione */}
      {showValidationDetails && validationErrors.details && (
        <ValidationErrorsModal
          errors={validationErrors.details}
          onClose={() => setShowValidationDetails(false)}
          onNavigateToBlock={(blockId) => {
            // Cerca il blocco nell'albero e naviga ad esso
            const findAndNavigate = (blocks: any[], targetId: string, path: any[] = []): boolean => {
              for (const block of blocks) {
                if (block.id === targetId) {
                  // Se il blocco è in un container zoomato, prima esci dallo zoom
                  if (isZoomed && path.length > 0) {
                    // Naviga al container che contiene il blocco
                    handleZoomIn(path[path.length - 1].id);
                  }
                  // Scrolla al blocco dopo un breve delay per permettere il rendering
                  setTimeout(() => {
                    const element = document.querySelector(`[data-block-id="${targetId}"]`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // Aggiungi un'animazione di highlight
                      element.classList.add('ring-4', 'ring-red-500', 'ring-opacity-75');
                      setTimeout(() => {
                        element.classList.remove('ring-4', 'ring-red-500', 'ring-opacity-75');
                      }, 2000);
                    }
                  }, 100);
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
  );
};
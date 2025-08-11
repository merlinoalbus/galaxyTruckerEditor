import React, { useState, useEffect } from 'react';
import { Code2 } from 'lucide-react';

import { useVisualFlowEditor } from '@/hooks/CampaignEditor/VisualFlowEditor/useVisualFlowEditor';
import { visualFlowEditorStyles } from '@/styles/CampaignEditor/VisualFlowEditor/VisualFlowEditor.styles';
import { useFullscreen } from '@/contexts/FullscreenContext';
import type { VisualFlowEditorProps } from '@/types/CampaignEditor/VisualFlowEditor/VisualFlowEditor.types';
import { AVAILABLE_TOOLS } from '@/types/CampaignEditor/VisualFlowEditor/BlockTypes';

// Import componenti modulari
import { BlockRenderer } from './components/BlockRenderer/BlockRenderer';
import { Toolbar } from './components/Toolbar/Toolbar';
import { ScriptsList, type ScriptItem } from './components/ScriptsList';
import { MissionsList } from './components/MissionsList';
import { JsonView } from '@/components/shared/JsonView';
import { NewScriptDialog } from './components/NewScriptDialog';
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

  // Script management state
  const [availableScripts, setAvailableScripts] = useState<ScriptItem[]>([]);
  const [showScriptsList, setShowScriptsList] = useState(false);
  const [showMissionsList, setShowMissionsList] = useState(false);
  const [showJsonView, setShowJsonView] = useState(false);
  
  // Editor state
  const [currentScriptBlocks, setCurrentScriptBlocks] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ errors: number; invalidBlocks: string[] }>({ errors: 0, invalidBlocks: [] });
  
  // Button refs per posizionamento contestuale
  const scriptsButtonRef = React.useRef<HTMLButtonElement>(null);
  const missionsButtonRef = React.useRef<HTMLButtonElement>(null);

  // Usa hook per dati di sessione (variabili, semafori, labels, scripts, missions)
  const sessionData = useSessionData();
  
  // Usa hook per manipolazione blocchi
  const {
    updateBlockRecursive,
    removeBlockRecursive,
    addBlockAtIndex,
    addBlockToContainer,
    canDropBlock,
    validateAllBlocks
  } = useBlockManipulation();
  
  // Usa hook per zoom navigation
  const {
    navigationPath,
    currentFocusedBlockId,
    rootBlocks,
    handleZoomIn,
    handleZoomOut,
    updateRootBlocksIfNeeded,
    isZoomed
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
    currentScriptBlocks,
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
    isZoomed
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


  // Carica script se viene passato uno scriptId dal componente chiamante
  useEffect(() => {
    if (scriptId) {
      loadScript(scriptId);
    }
  }, [scriptId, loadScript]);

  // Valida sempre l'albero completo dei blocchi, non solo quello visualizzato
  useEffect(() => {
    // Usa sempre rootBlocks per la validazione globale
    const blocksToValidate = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
    if (blocksToValidate.length > 0) {
      const validation = validateAllBlocks(blocksToValidate);
      setValidationErrors(validation);
    }
  }, [currentScriptBlocks, rootBlocks, validateAllBlocks]);

  if (isLoading) {
    return (
      <div className={visualFlowEditorStyles.loadingState}>
        <Code2 className="w-8 h-8 animate-pulse" />
        <span>Caricamento Visual Flow Editor...</span>
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
        loadScript={loadScript}
        buttonRef={scriptsButtonRef}
      />
      
      <MissionsList
        showMissionsList={showMissionsList}
        setShowMissionsList={setShowMissionsList}
        loadMission={loadMission}
        buttonRef={missionsButtonRef}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar con tools */}
        <div className="w-64 bg-slate-800 p-4 overflow-y-auto">
          <h4 className="text-white font-bold mb-4">Strumenti</h4>
          <div className="space-y-2">
            {AVAILABLE_TOOLS.map(tool => (
              <div
                key={tool.id}
                draggable
                onDragStart={(e) => handleToolDragStart(e, tool)}
                className="bg-slate-700 hover:bg-slate-600 rounded p-3 cursor-move transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{tool.icon}</span>
                  <span className="text-white text-sm">{tool.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 bg-slate-900 p-8 overflow-auto">
          {currentScriptBlocks.length > 0 ? (
            <div className="max-w-6xl mx-auto">
              {currentScriptBlocks.map(block => (
                <BlockRenderer
                  key={block.id}
                  block={block}
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
                  sessionData={sessionData}
                  createDropValidator={createDropValidator}
                  invalidBlocks={validationErrors.invalidBlocks}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <Code2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nessuno script caricato</p>
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
    </div>
  );
};
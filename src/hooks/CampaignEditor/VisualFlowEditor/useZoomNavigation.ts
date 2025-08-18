import { useState, useCallback } from 'react';
import type { IFlowBlock, OpenedScript, ScriptContext } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';
import { API_CONSTANTS } from '@/constants/VisualFlowEditor.constants';
import { API_CONFIG } from '@/config/constants';

export interface NavigationPathItem {
  id: string;
  name: string;
  block: any;
}

interface UseZoomNavigationProps {
  currentScriptBlocks: any[];
  setCurrentScriptBlocks: (blocks: any[]) => void;
  openedScripts?: Map<string, OpenedScript>;
  setOpenedScripts?: (scripts: Map<string, OpenedScript>) => void;
  currentScriptContext?: ScriptContext | null;
  setCurrentScriptContext?: (context: ScriptContext | null) => void;
  currentScript?: { name: string; fileName: string } | null;
}

export const useZoomNavigation = ({
  currentScriptBlocks,
  setCurrentScriptBlocks,
  openedScripts = new Map(),
  setOpenedScripts = () => {},
  currentScriptContext = null,
  setCurrentScriptContext = () => {},
  currentScript = null
}: UseZoomNavigationProps) => {
  const [navigationPath, setNavigationPath] = useState<NavigationPathItem[]>([]);
  const [currentFocusedBlock, setCurrentFocusedBlock] = useState<any>(null);
  const [rootBlocks, setRootBlocks] = useState<any[]>([]);
  
  // Path di navigazione tra script (unificato con zoom)
  const [scriptNavigationPath, setScriptNavigationPath] = useState<Array<{
    scriptName: string;
    parentBlockId?: string;
  }>>([]);

  // Funzione per resettare completamente lo stato della navigazione
  const resetNavigationState = useCallback(() => {
    setNavigationPath([]);
    setCurrentFocusedBlock(null);
    setRootBlocks([]);
    setScriptNavigationPath([]);
  }, []);

  // Funzione ricorsiva per trovare e aggiornare un blocco nell'albero
  const updateBlockInNavigationTree = useCallback((blocks: any[], blockId: string, newBlock: any): any[] => {
    return blocks.map(block => {
      if (block.id === blockId) {
        return newBlock;
      }
      
      const updatedBlock = { ...block };
      if (block.children) {
        updatedBlock.children = updateBlockInNavigationTree(block.children, blockId, newBlock);
      }
      if (block.thenBlocks) {
        updatedBlock.thenBlocks = updateBlockInNavigationTree(block.thenBlocks, blockId, newBlock);
      }
      if (block.elseBlocks) {
        updatedBlock.elseBlocks = updateBlockInNavigationTree(block.elseBlocks, blockId, newBlock);
      }
      return updatedBlock;
    });
  }, []);

  // Trova un blocco nell'albero e restituisce il path completo fino ad esso
  const findBlockInTree = useCallback((blocks: any[], blockId: string, path: any[] = []): { block: any, path: any[] } | null => {
    for (const block of blocks) {
      if (block.id === blockId) {
        return { block, path };
      }
      
      // Cerca nei children
      if (block.children) {
        const result = findBlockInTree(block.children, blockId, [...path, block]);
        if (result) return result;
      }
      
      // Cerca nei thenBlocks
      if (block.thenBlocks) {
        const result = findBlockInTree(block.thenBlocks, blockId, [...path, block]);
        if (result) return result;
      }
      
      // Cerca negli elseBlocks
      if (block.elseBlocks) {
        const result = findBlockInTree(block.elseBlocks, blockId, [...path, block]);
        if (result) return result;
      }
      
      // Cerca nei blocksMission
      if (block.blocksMission) {
        const result = findBlockInTree(block.blocksMission, blockId, [...path, block]);
        if (result) return result;
      }
      
      // Cerca nei blocksFinish
      if (block.blocksFinish) {
        const result = findBlockInTree(block.blocksFinish, blockId, [...path, block]);
        if (result) return result;
      }

      // Cerca nelle sezioni di BUILD/FLIGHT
      if (block.blockInit) {
        const result = findBlockInTree(block.blockInit, blockId, [...path, block]);
        if (result) return result;
      }
      if (block.blockStart) {
        const result = findBlockInTree(block.blockStart, blockId, [...path, block]);
        if (result) return result;
      }
      if (block.blockEvaluate) {
        const result = findBlockInTree(block.blockEvaluate, blockId, [...path, block]);
        if (result) return result;
      }
    }
    return null;
  }, []);

  const getBlockDisplayName = (block: any): string => {
    switch (block.type) {
      case 'SCRIPT': return ''; // Non mostrare il nome dello script nel path
      case 'SUB_SCRIPT': return block.scriptName || 'Sub-Script';
      case 'MISSION': return block.missionName || 'Mission';
      case 'IF': 
        const ifType = block.parameters?.ifType || block.ifType || '';
        return ifType ? `IF ${ifType}` : 'IF';
      case 'MENU': return 'MENU';
      case 'OPT': 
        const optText = block.parameters?.optionText || block.optionText || '';
        return optText ? `OPT ${optText}` : 'OPT';
      case 'SAY': return 'SAY';
      case 'DELAY': return 'DELAY';
      case 'GO': return 'GO';
      case 'LABEL': 
        const labelName = block.parameters?.name || block.label || '';
        return labelName ? `LABEL ${labelName}` : 'LABEL';
      default: return block.type || 'Block';
    }
  };

  // Utility: indici dei marker (subscript/mission) nel breadcrumb corrente
  const getMarkerIndices = useCallback((path: NavigationPathItem[]) => {
    const indices: number[] = [];
    path.forEach((item, idx) => {
      if (item.id.startsWith('subscript-') || item.id.startsWith('mission-')) {
        indices.push(idx);
      }
    });
    return indices;
  }, []);

  // Funzione per navigare a un sub-script (definita prima per essere usata in handleZoomIn)
  const handleNavigateToSubScript = useCallback(async (scriptName: string, parentBlock: IFlowBlock) => {
    try {
      // Salva il path di zoom corrente PRIMA di navigare al sub-script
      const currentZoomPath = [...navigationPath];
      
      // Controlla se lo script è già stato caricato
      let scriptData = openedScripts.get(scriptName);
      
      if (!scriptData) {
        // Carica lo script via API solo se non è già in cache
        const response = await fetch(`${API_CONFIG.API_BASE_URL}/scripts/${scriptName}?multilingua=true&format=blocks`);
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
          // IMPORTANTE: Salva una copia deep dei blocchi originali per preservare lo stato iniziale
          scriptData = {
            scriptName: scriptName,  // Usa sempre scriptName come chiave consistente
            fileName: result.data.fileName || scriptName,
            blocks: blocksToLoad,
            originalBlocks: JSON.parse(JSON.stringify(blocksToLoad)), // Copia deep immutabile
            isModified: false
          };
          const updatedScripts = new Map(openedScripts);
          updatedScripts.set(scriptName, scriptData);  // Usa scriptName come chiave
          
          // Salva lo stato corrente dello script USANDO LA MAPPA GIÀ AGGIORNATA
          const blocksToSave = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
          
          if (currentScriptContext && currentScriptContext.isSubScript) {
            // Salva i blocchi correnti del sub-script
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
          
          // Salva la mappa aggiornata UNA SOLA VOLTA
          setOpenedScripts(updatedScripts);
        } else {
          throw new Error('Nessun dato ricevuto dal server');
        }
      } else {
        // Script già caricato, salva comunque lo stato corrente
        const blocksToSave = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
        const updatedScripts = new Map(openedScripts);
        
        if (currentScriptContext && currentScriptContext.isSubScript) {
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
      
      // Imposta il nuovo contesto dello script
      setCurrentScriptContext({
        scriptName: scriptName,
        isSubScript: true
      });
      
      // IMPORTANTE: Usa sempre i blocchi originali completi dallo scriptData
      // per garantire che partiamo dalla vista root del subscript
      // Se abbiamo originalBlocks (script caricato dal server), usa quelli
      // Altrimenti usa blocks (compatibilità con script già in memoria)
      const sourceBlocks = (scriptData as any).originalBlocks || scriptData.blocks;
      let blocksToLoad = JSON.parse(JSON.stringify(sourceBlocks)); // Deep copy per evitare mutazioni
      
      // Se i blocchi non hanno già un wrapper SCRIPT, creane uno
      if (!blocksToLoad.some((b: any) => b.type === 'SCRIPT')) {
        // Crea un wrapper SCRIPT per permettere la navigazione
        blocksToLoad = [{
          id: `script-wrapper-${scriptName}`,
          type: 'SCRIPT',
          scriptName: scriptData.scriptName,
          fileName: scriptData.fileName,
          isContainer: true,
          children: JSON.parse(JSON.stringify(sourceBlocks)) // Deep copy dei blocchi originali
        } as IFlowBlock];
      }
      
  // Preserva l'intero path corrente (zoom pre-marker INCLUSO) e aggiungi il nuovo marker in coda
  const basePath: NavigationPathItem[] = navigationPath.filter(item => item.name);

      const newNavigationPath = [
        ...basePath,
        {
          id: `subscript-${scriptName}`,
          name: scriptName,
          block: blocksToLoad[0]
        }
      ];
      // Debug opzionale
  try { if ((window as any).__VFE_NAV_DEBUG__) { console.debug('[NAV] -> enter subscript', { from: navigationPath, to: newNavigationPath }); } } catch {}
      setNavigationPath(newNavigationPath);
      setRootBlocks([]);  // Reset rootBlocks per il nuovo contesto
      setCurrentScriptBlocks(blocksToLoad);
      setCurrentFocusedBlock(null); // Reset il focus per partire dalla vista root
      
      // Aggiorna il path di navigazione tra script
      setScriptNavigationPath(prev => {
        if (prev.length === 0) {
          const mainScriptName = currentScript?.name || 'main';
          return [
            { scriptName: mainScriptName },
            { scriptName: scriptName, parentBlockId: parentBlock.id }
          ];
        }
        return [...prev, {
          scriptName: scriptName,
          parentBlockId: parentBlock.id
        }];
      });
      
    } catch (error) {
      console.error('[useZoomNavigation] Error loading sub-script:', error);
      throw error;
    }
  }, [currentScriptBlocks, currentScriptContext, openedScripts, rootBlocks, setOpenedScripts, setCurrentScriptContext, currentScript, navigationPath, setCurrentScriptBlocks, getMarkerIndices]);

  const handleZoomIn = useCallback((blockId: string) => {
  // Determina se siamo in un sub-script o in una mission e trova l'ULTIMO marker
  const markerIndices = getMarkerIndices(navigationPath);
  const isInContext = markerIndices.length > 0;
  const lastMarkerIndex = markerIndices.length > 0 ? markerIndices[markerIndices.length - 1] : -1;
    
    // Se è il primo zoom o siamo appena entrati in subscript/mission, salva i blocchi attuali come root
  if (navigationPath.length === 0 || (isInContext && lastMarkerIndex === navigationPath.length - 1)) {
      setRootBlocks([...currentScriptBlocks]);
    }
    
    // IMPORTANTE: Cerca sempre dai blocchi root quando esistono
    const searchIn = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
    
    const result = findBlockInTree(searchIn, blockId);
    
    // Se il blocco è un SUB_SCRIPT, naviga al sub-script invece di fare zoom
    if (result && result.block && result.block.type === 'SUB_SCRIPT') {
      // Delega alla funzione di navigazione sub-script
      const scriptName = result.block.parameters?.scriptName || result.block.scriptName;
      if (scriptName) {
        handleNavigateToSubScript(scriptName, result.block);
        return;
      }
    }
    
    if (!result || !result.block) {
      return;
    }
    
  // Verifica che sia un container: basato su presenza di sotto-array noti o flag
  const rb = result.block;
  const isContainer = rb.isContainer ||
            (Array.isArray(rb.children) && rb.children.length >= 0) ||
            (Array.isArray(rb.thenBlocks) && rb.thenBlocks.length >= 0) ||
            (Array.isArray(rb.elseBlocks) && rb.elseBlocks.length >= 0) ||
            (Array.isArray(rb.blocksMission) && rb.blocksMission.length >= 0) ||
            (Array.isArray(rb.blocksFinish) && rb.blocksFinish.length >= 0) ||
            (Array.isArray(rb.blockInit) && rb.blockInit.length >= 0) ||
            (Array.isArray(rb.blockStart) && rb.blockStart.length >= 0) ||
            (Array.isArray(rb.blockEvaluate) && rb.blockEvaluate.length >= 0);
    
    if (!isContainer) {
      return;
    }
    
    // Costruisci il path di zoom escludendo blocchi SCRIPT wrapper
  const buildZoomPath = (path: any[], targetBlock: any) => {
      const fullPath = [...path, targetBlock];
      return fullPath
    .filter(block => block.type !== 'SCRIPT' && block.type !== 'MISSION') // Escludi SCRIPT e MISSION (marker già presente)
        .map(block => ({
          id: block.id,
          name: getBlockDisplayName(block),
          block: block
        }))
        .filter(item => item.name !== ''); // Rimuovi elementi con nome vuoto
    };
    
    let newPath: NavigationPathItem[];
    if (isInContext) {
      // Ricostruisci il path di zoom DOPO l'ultimo marker (subscript/mission)
      const zoomPath = buildZoomPath(result.path, result.block);
      const baseBefore = navigationPath.slice(0, lastMarkerIndex + 1);
      newPath = [...baseBefore, ...zoomPath];
    } else {
      // Siamo nello script principale, costruisci il path normale (sostituisce eventuale zoom precedente)
      newPath = buildZoomPath(result.path, result.block);
    }
    
  try { if ((window as any).__VFE_NAV_DEBUG__) { console.debug('[NAV] -> zoom in', { from: navigationPath, to: newPath, blockId }); } } catch {}
  setNavigationPath(newPath);
    setCurrentFocusedBlock(result.block);
    
    // Mostra SOLO il blocco selezionato come root dell'editor
    setCurrentScriptBlocks([result.block]);
    
  }, [currentScriptBlocks, rootBlocks, findBlockInTree, navigationPath, setCurrentScriptBlocks, handleNavigateToSubScript, getMarkerIndices]);
  
  // Funzione per navigare indietro tra script con supporto per zoom diretto
  const handleNavigateBackToScript = useCallback((targetIndex: number, zoomToBlockIndex?: number) => {
    // Rimuovi dalla memoria tutti gli script dopo il target
    const scriptsToRemove: string[] = [];
  if (targetIndex < 0) {
      // Tornando allo script principale
      scriptNavigationPath.forEach(item => {
        if (item.scriptName !== currentScript?.name) {
          scriptsToRemove.push(item.scriptName);
        }
      });
    } else {
      // Tornando a uno script intermedio
      for (let i = targetIndex + 1; i < scriptNavigationPath.length; i++) {
        scriptsToRemove.push(scriptNavigationPath[i].scriptName);
      }
    }
    
    // Rimuovi gli script dalla memoria
    const updated = new Map(openedScripts);
    scriptsToRemove.forEach(scriptName => {
      updated.delete(scriptName);
    });
    setOpenedScripts(updated);
    
    // Determina quale script caricare
  if (targetIndex < 0) {
      // Torna allo script principale
      const mainScriptName = currentScript?.name || 'main';
      const mainScriptData = openedScripts.get(mainScriptName);
      
      if (mainScriptData) {
        // Se zoomToBlockIndex è -1, vai alla vista root completa
        if (zoomToBlockIndex === -1) {
          // Vista root completa dello script principale
          setNavigationPath([]);
          setRootBlocks([]);
          setCurrentScriptBlocks(mainScriptData.blocks);
          setCurrentFocusedBlock(null);
          setCurrentScriptContext(null);
          setScriptNavigationPath([]);
          return; // Esci subito
        }
        
        // Se è specificato zoomToBlockIndex, vai direttamente a quel livello di zoom
        if (zoomToBlockIndex !== undefined && zoomToBlockIndex >= 0) {
          // Trova il marker (subscript o mission) nel path
          const markerIndices = getMarkerIndices(navigationPath);
          const markerIdx = markerIndices.length > 0 ? markerIndices[0] : -1;
          
          // Prendi il path fino al marker (escluso)
          const pathBeforeMarker = markerIdx > 0 ? navigationPath.slice(0, markerIdx) : [];
          
          // Se abbiamo un path valido e l'indice richiesto esiste
          if (pathBeforeMarker.length > zoomToBlockIndex) {
            const targetBlock = pathBeforeMarker[zoomToBlockIndex];
            
            // Imposta il path fino al blocco target
            const newPath = pathBeforeMarker.slice(0, zoomToBlockIndex + 1);
            setNavigationPath(newPath);
            
            // Cerca il blocco aggiornato nello script principale
            const result = findBlockInTree(mainScriptData.blocks, targetBlock.id);
            if (result && result.block) {
              setCurrentScriptBlocks([result.block]);
              setRootBlocks(mainScriptData.blocks);
              setCurrentFocusedBlock(result.block);
            } else {
              // Fallback: mostra i blocchi completi
              setCurrentScriptBlocks(mainScriptData.blocks);
              setRootBlocks([]);
            }
          } else {
            // Se l'indice non è valido, torna alla vista completa
            setNavigationPath([]);
            setRootBlocks([]);
            setCurrentScriptBlocks(mainScriptData.blocks);
          }
        } else {
          // Comportamento standard senza zoom specifico
          // Rileva l'eventuale primo marker (mission o subscript) per capire se c'era uno zoom prima
          const markerIndices2 = getMarkerIndices(navigationPath);
          const firstMarkerIdx = markerIndices2.length > 0 ? markerIndices2[0] : -1;

          if (firstMarkerIdx > 0) {
            // C'era zoom nello script principale prima del marker
            const pathBeforeSubscript = navigationPath.slice(0, firstMarkerIdx);
            setNavigationPath(pathBeforeSubscript);
            
            // Recupera l'ultimo blocco zoomato
            const lastMainScriptBlock = pathBeforeSubscript[pathBeforeSubscript.length - 1];
            if (lastMainScriptBlock) {
              const result = findBlockInTree(mainScriptData.blocks, lastMainScriptBlock.id);
              if (result && result.block) {
                setCurrentScriptBlocks([result.block]);
                setRootBlocks(mainScriptData.blocks);
              } else {
                setCurrentScriptBlocks(mainScriptData.blocks);
                setRootBlocks([]);
              }
            }
          } else {
            // Non c'era zoom prima del subscript
            setNavigationPath([]);
            setRootBlocks([]);
            setCurrentScriptBlocks(mainScriptData.blocks);
          }
        }
        
        setCurrentScriptContext(null);
        setScriptNavigationPath([]);
      }
    } else if (targetIndex < scriptNavigationPath.length) {
      // Naviga a uno script specifico nel path
      const targetScript = scriptNavigationPath[targetIndex];
      const scriptData = openedScripts.get(targetScript.scriptName);
      
      if (scriptData) {
        // Preserva TUTTO il path fino al marker target incluso, aggiungendolo se manca
        const markerId = `subscript-${targetScript.scriptName}`;
        // Cerca l'ULTIMA occorrenza del marker corrispondente
        const existingMarkerIdx = (() => {
          for (let i = navigationPath.length - 1; i >= 0; i--) {
            const it = navigationPath[i];
            if (it.id === markerId || (it.id.startsWith('mission-') && it.name === targetScript.scriptName)) return i;
          }
          return -1;
        })();
        let newPath = navigationPath.slice();
        if (existingMarkerIdx >= 0) {
          newPath = navigationPath.slice(0, existingMarkerIdx + 1);
        } else {
          newPath = [...navigationPath, { id: markerId, name: targetScript.scriptName, block: scriptData.blocks[0] } as NavigationPathItem];
        }
        try { if ((window as any).__VFE_NAV_DEBUG__) { console.debug('[NAV] -> back to script', { toScript: targetScript.scriptName, path: newPath }); } } catch {}
        setNavigationPath(newPath);
        setRootBlocks(scriptData.blocks);
        setCurrentScriptBlocks(scriptData.blocks);
        // Determina se è missione o subscript in base al marker presente
        const isMissionCtx = newPath[newPath.length - 1]?.id.startsWith('mission-');
        setCurrentScriptContext({
          scriptName: targetScript.scriptName,
          isSubScript: !isMissionCtx && targetIndex > 0,
          isMission: isMissionCtx
        });
        setScriptNavigationPath(prev => prev.slice(0, targetIndex + 1));
      }
    }
  }, [openedScripts, currentScript, scriptNavigationPath, setOpenedScripts, setCurrentScriptContext, setCurrentScriptBlocks]);

  const handleZoomOut = useCallback((targetLevel?: number) => {
    
    if (navigationPath.length === 0) {
      return;
    }
    
  // Determina se siamo in un sub-script o in una mission e individua gli indici dei marker
  const markerIndices = getMarkerIndices(navigationPath);
  const isInContext = markerIndices.length > 0;
  const firstMarkerIndex = markerIndices.length > 0 ? markerIndices[0] : -1;
  const lastMarkerIndex = markerIndices.length > 0 ? markerIndices[markerIndices.length - 1] : -1;
    
    let targetIndex = targetLevel !== undefined ? targetLevel : navigationPath.length - 2;
    
    if (targetIndex < 0) {
      // Torna alla vista root del contesto corrente (sub-script o mission) oppure script principale
      if (isInContext) {
        // Mantieni solo il marker del contesto attivo (ultimo marker)
        setNavigationPath([navigationPath[lastMarkerIndex]]);
        // Carica i blocchi completi del contesto
        const contextName = navigationPath[lastMarkerIndex].name;  // Il nome è già pulito nel path
        const scriptData = openedScripts.get(contextName);
        if (scriptData) {
          setRootBlocks([]);
          setCurrentScriptBlocks(scriptData.blocks);
        }
      } else {
        // Siamo nello script principale, torna alla vista completa
        setNavigationPath([]);
        setCurrentFocusedBlock(null);
        setRootBlocks([]);
        // Carica i blocchi dello script principale
        const mainScriptName = currentScript?.name || 'main';
        const mainScriptData = openedScripts.get(mainScriptName);
        if (mainScriptData) {
          setCurrentScriptBlocks(mainScriptData.blocks);
        } else if (rootBlocks.length > 0) {
          setCurrentScriptBlocks(rootBlocks);
        }
      }
  } else if (isInContext && markerIndices.includes(targetIndex)) {
      // Caso speciale: cliccato esattamente sul marker (sub-script/mission) nel breadcrumb
      // Mostra SEMPRE la vista root del contesto
      const targetItem = navigationPath[targetIndex];
      const contextName = targetItem.name;
      
      const scriptData = openedScripts.get(contextName);
      
      if (scriptData) {
        // Mantieni tutta la catena fino al marker selezionato (incluso) e conserva eventuale pre-zoom già presente
        const pathUpToMarker = navigationPath.slice(0, targetIndex + 1);
        try { if ((window as any).__VFE_NAV_DEBUG__) { console.debug('[NAV] -> click marker', { to: pathUpToMarker }); } } catch {}
        setNavigationPath(pathUpToMarker);
        setRootBlocks([]);
        setCurrentScriptBlocks(scriptData.blocks);
        setCurrentFocusedBlock(null);
        
        // Assicurati che il contesto sia corretto
        if (!currentScriptContext || currentScriptContext.scriptName !== contextName) {
          setCurrentScriptContext({
            scriptName: contextName,
            isSubScript: targetItem.id.startsWith('subscript-'),
            isMission: targetItem.id.startsWith('mission-')
          });
        }

        // Allinea anche la catena degli script in base all'ordinal del marker cliccato
        const markerOrdinal = markerIndices.indexOf(targetIndex); // 0 = primo marker dopo main
        if (markerOrdinal >= 0) {
          const newLength = Math.min(scriptNavigationPath.length, markerOrdinal + 2); // + main
          setScriptNavigationPath(prev => prev.slice(0, newLength));
        }
      }
  } else if (targetIndex < navigationPath.length) {
      // Naviga al livello specificato nel path
      const newPath = navigationPath.slice(0, targetIndex + 1);
      const targetItem = newPath[newPath.length - 1];
      
      // Controlla se stiamo tornando a un punto PRIMA del marker (subscript/mission)
  if (isInContext && targetIndex < firstMarkerIndex) {
        
        // Dobbiamo tornare allo script principale al livello di zoom specificato
        // Prima salva lo stato del subscript corrente se necessario
        const currentContextName = navigationPath[lastMarkerIndex].name;
        const currentContextData = openedScripts.get(currentContextName);
        if (currentContextData) {
          currentContextData.blocks = currentScriptBlocks;
          currentContextData.isModified = true;
        }
        
        // Torna allo script principale
        const mainScriptName = scriptNavigationPath[0]?.scriptName || currentScript?.name || 'main';
        const mainScriptData = openedScripts.get(mainScriptName);
        
        if (mainScriptData) {
          // Imposta il contesto dello script principale
          setCurrentScriptContext(null);
          
          // Imposta il path fino al target (senza il subscript)
          setNavigationPath(newPath);
          
          // Trova il blocco target nello script principale
          const result = findBlockInTree(mainScriptData.blocks, targetItem.id);
          if (result && result.block) {
            setCurrentScriptBlocks([result.block]);
            setRootBlocks(mainScriptData.blocks);
            setCurrentFocusedBlock(result.block);
          } else {
            // Fallback: mostra tutti i blocchi dello script principale
            setCurrentScriptBlocks(mainScriptData.blocks);
            setRootBlocks([]);
          }
          
          // Aggiorna il path di navigazione degli script
          setScriptNavigationPath([{ scriptName: mainScriptName }]);
        }
        return;
      }
      
    // Se il target è il marker (sub-script o mission)
  if (targetItem.id.startsWith('subscript-') || targetItem.id.startsWith('mission-')) {
        const contextName = targetItem.name;
        const scriptData = openedScripts.get(contextName);
        
        if (scriptData) {
      // Vista root del contesto, preservando TUTTA la catena fino al marker selezionato
      const pathUpToMarkerInclusive = navigationPath.slice(0, targetIndex + 1);
      setNavigationPath(pathUpToMarkerInclusive);
          setRootBlocks([]);
          setCurrentScriptBlocks(scriptData.blocks);
          setCurrentFocusedBlock(null);
          
          // Assicurati che il contesto sia corretto
          if (!currentScriptContext || currentScriptContext.scriptName !== contextName) {
            setCurrentScriptContext({
              scriptName: contextName,
              isSubScript: targetItem.id.startsWith('subscript-'),
              isMission: targetItem.id.startsWith('mission-')
            });
          }

          // Allinea la catena degli script (come sopra)
          const markerOrdinal = getMarkerIndices(navigationPath).indexOf(targetIndex);
          if (markerOrdinal >= 0) {
            const newLength = Math.min(scriptNavigationPath.length, markerOrdinal + 2);
            setScriptNavigationPath(prev => prev.slice(0, newLength));
          }
        }
  } else if (isInContext && targetIndex > firstMarkerIndex && targetIndex < lastMarkerIndex) {
        // Clic su un livello di zoom TRA due marker: ripristina il contesto del marker precedente
        const previousMarkerIdx = (() => {
          let prev = firstMarkerIndex;
          for (let i = 0; i < markerIndices.length; i++) {
            if (markerIndices[i] < targetIndex) prev = markerIndices[i];
          }
          return prev;
        })();
        const contextMarker = navigationPath[previousMarkerIdx];
        const contextName = contextMarker.name;
        const scriptData = openedScripts.get(contextName);
        if (scriptData) {
          // Imposta contesto
          setCurrentScriptContext({
            scriptName: contextName,
            isSubScript: contextMarker.id.startsWith('subscript-'),
            isMission: contextMarker.id.startsWith('mission-')
          });
          // Imposta path fino al target cliccato
          setNavigationPath(newPath);
          // Prepara root blocks del contesto e zooma al blocco target
          const searchIn = scriptData.blocks;
          const result = findBlockInTree(searchIn, targetItem.id);
          if (result && result.block) {
            setRootBlocks(searchIn);
            setCurrentScriptBlocks([result.block]);
            setCurrentFocusedBlock(result.block);
          } else {
            // Fallback: mostra la vista root del contesto
            setRootBlocks([]);
            setCurrentScriptBlocks(searchIn);
            setCurrentFocusedBlock(null);
          }
        }
      } else {
        // È un normale livello di zoom
        const targetBlockId = targetItem.id;
        
        // Determina da dove recuperare il blocco
        const searchIn = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
        const result = findBlockInTree(searchIn, targetBlockId);
        
        if (result && result.block) {
          const targetBlock = result.block;
          
          setNavigationPath(newPath);
          setCurrentFocusedBlock(targetBlock);
          
          // Mostra il blocco target
          setCurrentScriptBlocks([targetBlock]);
        }
    }
    }
  }, [navigationPath, rootBlocks, setCurrentScriptBlocks, findBlockInTree, openedScripts, currentScript, currentScriptContext, setCurrentScriptContext, currentScriptBlocks, scriptNavigationPath, setScriptNavigationPath, getMarkerIndices]);

  // Funzione per aggiornare i rootBlocks quando siamo in navigazione
  const updateRootBlocksIfNeeded = useCallback((updatedBlocks: any[]) => {
    if (navigationPath.length > 0 && updatedBlocks.length > 0) {
      const currentBlockId = navigationPath[navigationPath.length - 1].id;
      
      setRootBlocks(prevRoot => {
        // Usa prevRoot invece di rootBlocks per evitare dipendenze cicliche
        if (!prevRoot || prevRoot.length === 0) {
          return prevRoot;
        }
        // Aggiorna il blocco nell'albero con la versione modificata
        const updated = updateBlockInNavigationTree(prevRoot, currentBlockId, updatedBlocks[0]);
        return updated;
      });
      
      // Aggiorna anche il currentFocusedBlock per mantenere la sincronizzazione
      if (currentFocusedBlock && currentFocusedBlock.id === currentBlockId) {
        setCurrentFocusedBlock(updatedBlocks[0]);
      }
      
      // Aggiorna il navigationPath con il blocco aggiornato
      setNavigationPath(prev => prev.map(item => 
        item.id === currentBlockId 
          ? { ...item, block: updatedBlocks[0] }
          : item
      ));
    }
  }, [navigationPath, currentFocusedBlock, updateBlockInNavigationTree]); // Rimossa dipendenza da rootBlocks

  return {
    navigationPath,
    setNavigationPath,
    currentFocusedBlock,
    currentFocusedBlockId: currentFocusedBlock?.id || null,
    rootBlocks,
    setRootBlocks,
    handleZoomIn,
    handleZoomOut,
    updateRootBlocksIfNeeded,
    updateBlockInNavigationTree,
    isZoomed: navigationPath.length > 0,
    resetNavigationState,
    scriptNavigationPath,
    setScriptNavigationPath,
    handleNavigateToSubScript,
    handleNavigateBackToScript
  };
};
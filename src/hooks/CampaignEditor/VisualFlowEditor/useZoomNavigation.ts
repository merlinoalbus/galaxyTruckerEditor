import { useState, useCallback } from 'react';
import type { IFlowBlock, OpenedScript, ScriptContext } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';
import { API_CONSTANTS } from '@/constants/VisualFlowEditor.constants';

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

  // Funzione per navigare a un sub-script (definita prima per essere usata in handleZoomIn)
  const handleNavigateToSubScript = useCallback(async (scriptName: string, parentBlock: IFlowBlock) => {
    try {
      // Salva il path di zoom corrente PRIMA di navigare al sub-script
      const currentZoomPath = [...navigationPath];
      
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
          setOpenedScripts(new Map(openedScripts).set(scriptName, scriptData));
        } else {
          throw new Error('Nessun dato ricevuto dal server');
        }
      }
      
      // Salva lo stato corrente dello script
      const blocksToSave = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
      
      if (currentScriptContext && currentScriptContext.isSubScript) {
        // Salva i blocchi correnti del sub-script
        const updated = new Map(openedScripts);
        const current = updated.get(currentScriptContext.scriptName);
        if (current) {
          current.blocks = blocksToSave;
          current.isModified = true;
        }
        setOpenedScripts(updated);
      } else {
        // Salva lo script principale
        const scriptNameToSave = currentScriptContext?.scriptName || currentScript?.name || 'main';
        const updated = new Map(openedScripts);
        
        if (updated.has(scriptNameToSave)) {
          const existing = updated.get(scriptNameToSave)!;
          existing.blocks = blocksToSave;
          existing.isModified = true;
        } else {
          updated.set(scriptNameToSave, {
            scriptName: scriptNameToSave,
            fileName: currentScript?.fileName || scriptNameToSave + '.txt',
            blocks: blocksToSave,
            isModified: true
          });
        }
        setOpenedScripts(updated);
      }
      
      // Imposta il nuovo contesto dello script
      setCurrentScriptContext({
        scriptName: scriptName,
        isSubScript: true
      });
      
      // Carica i blocchi del sub-script
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
        } as IFlowBlock];
      }
      
      // Mantieni il path di zoom dello script principale e aggiungi il subscript
      // Filtra via eventuali blocchi SCRIPT wrapper dal path corrente
      const cleanCurrentPath = currentZoomPath.filter(item => !item.name.startsWith('Script:') && item.name !== '');
      const newNavigationPath = [
        ...cleanCurrentPath, // Mantieni tutto il percorso di zoom nello script principale (pulito)
        {
          id: `subscript-${scriptName}`,
          name: scriptName, // Solo il nome, senza emoji qui
          block: blocksToLoad[0]
        }
      ];
      setNavigationPath(newNavigationPath);
      setRootBlocks([]);  // Reset rootBlocks per il nuovo contesto
      setCurrentScriptBlocks(blocksToLoad);
      
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
  }, [currentScriptBlocks, currentScriptContext, openedScripts, rootBlocks, setOpenedScripts, setCurrentScriptContext, currentScript, navigationPath, setCurrentScriptBlocks]);

  const handleZoomIn = useCallback((blockId: string) => {
    // Determina se siamo in un sub-script controllando il navigationPath
    const isInSubScript = navigationPath.some(item => item.id.startsWith('subscript-'));
    const subscriptIndex = navigationPath.findIndex(item => item.id.startsWith('subscript-'));
    
    // Se è il primo zoom, salva i blocchi attuali come root
    if (navigationPath.length === 0 || (isInSubScript && subscriptIndex === navigationPath.length - 1)) {
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
    
    // Verifica che sia un container
    const isContainer = result.block.isContainer || 
                       result.block.type === 'IF' || 
                       result.block.type === 'MENU' || 
                       result.block.type === 'OPT' ||
                       result.block.type === 'SCRIPT' ||
                       result.block.type === 'SUB_SCRIPT' ||
                       result.block.type === 'MISSION';
    
    if (!isContainer) {
      return;
    }
    
    // Costruisci il path di zoom escludendo blocchi SCRIPT wrapper
    const buildZoomPath = (path: any[], targetBlock: any) => {
      const fullPath = [...path, targetBlock];
      return fullPath
        .filter(block => block.type !== 'SCRIPT') // Escludi i wrapper SCRIPT
        .map(block => ({
          id: block.id,
          name: getBlockDisplayName(block),
          block: block
        }))
        .filter(item => item.name !== ''); // Rimuovi elementi con nome vuoto
    };
    
    let newPath;
    if (isInSubScript) {
      // Mantieni tutto fino al sub-script incluso, poi aggiungi il nuovo percorso
      const basePathUntilSubscript = navigationPath.slice(0, subscriptIndex + 1);
      const zoomPath = buildZoomPath(result.path, result.block);
      newPath = [...basePathUntilSubscript, ...zoomPath];
    } else {
      // Siamo nello script principale, costruisci il path normale
      newPath = buildZoomPath(result.path, result.block);
    }
    
    setNavigationPath(newPath);
    setCurrentFocusedBlock(result.block);
    
    // Mostra SOLO il blocco selezionato come root dell'editor
    setCurrentScriptBlocks([result.block]);
    
  }, [currentScriptBlocks, rootBlocks, findBlockInTree, navigationPath.length, setCurrentScriptBlocks, handleNavigateToSubScript]);
  
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
          // Trova l'indice del subscript nel path
          const subscriptIdx = navigationPath.findIndex(item => item.id.startsWith('subscript-'));
          
          // Prendi il path fino al subscript (escluso)
          const pathBeforeSubscript = subscriptIdx > 0 ? navigationPath.slice(0, subscriptIdx) : [];
          
          // Se abbiamo un path valido e l'indice richiesto esiste
          if (pathBeforeSubscript.length > zoomToBlockIndex) {
            const targetBlock = pathBeforeSubscript[zoomToBlockIndex];
            
            // Imposta il path fino al blocco target
            const newPath = pathBeforeSubscript.slice(0, zoomToBlockIndex + 1);
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
          const subscriptIdx = navigationPath.findIndex(item => item.id.startsWith('subscript-'));
          
          if (subscriptIdx > 0) {
            // C'era zoom nello script principale prima del subscript
            const pathBeforeSubscript = navigationPath.slice(0, subscriptIdx);
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
        // Reset del path di navigazione per il nuovo script
        setNavigationPath([{
          id: `subscript-${targetScript.scriptName}`,
          name: `📄 ${targetScript.scriptName}`,
          block: scriptData.blocks[0]
        }]);
        setRootBlocks(scriptData.blocks);
        setCurrentScriptBlocks(scriptData.blocks);
        setCurrentScriptContext({
          scriptName: targetScript.scriptName,
          isSubScript: targetIndex > 0
        });
        setScriptNavigationPath(prev => prev.slice(0, targetIndex + 1));
      }
    }
  }, [openedScripts, currentScript, scriptNavigationPath, setOpenedScripts, setCurrentScriptContext, setCurrentScriptBlocks]);

  const handleZoomOut = useCallback((targetLevel?: number) => {
    
    if (navigationPath.length === 0) {
      return;
    }
    
    // Determina se siamo in un sub-script
    const subscriptIndex = navigationPath.findIndex(item => item.id.startsWith('subscript-'));
    const isInSubScript = subscriptIndex >= 0;
    
    let targetIndex = targetLevel !== undefined ? targetLevel : navigationPath.length - 2;
    
    if (targetIndex < 0) {
      // Torna alla vista root dello script corrente
      if (isInSubScript) {
        // Se siamo in un sub-script, mantieni solo il marker del sub-script
        setNavigationPath([navigationPath[subscriptIndex]]);
        // Carica i blocchi completi del sub-script
        const subscriptName = navigationPath[subscriptIndex].name.replace('📄 ', '');
        const scriptData = openedScripts.get(subscriptName);
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
    } else if (targetIndex < navigationPath.length) {
      // Naviga al livello specificato nel path
      const newPath = navigationPath.slice(0, targetIndex + 1);
      const targetItem = newPath[newPath.length - 1];
      
      // Se il target è il sub-script stesso, mostra SEMPRE la vista root del sub-script
      if (targetItem.id.startsWith('subscript-')) {
        // Estrai il nome del sub-script dall'id (subscript-nomescript)
        const subscriptName = targetItem.id.replace('subscript-', '');
        const scriptData = openedScripts.get(subscriptName);
        
        if (scriptData) {
          // Reset completo alla vista root del sub-script
          setNavigationPath([targetItem]); // Mantieni solo il marker del sub-script
          setRootBlocks([]);
          setCurrentScriptBlocks(scriptData.blocks);
          setCurrentFocusedBlock(null);
          
          // Assicurati che il contesto sia corretto
          if (!currentScriptContext || currentScriptContext.scriptName !== subscriptName) {
            setCurrentScriptContext({
              scriptName: subscriptName,
              isSubScript: true
            });
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
  }, [navigationPath, rootBlocks, setCurrentScriptBlocks, findBlockInTree, openedScripts, currentScript, currentScriptContext, setCurrentScriptContext]);

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
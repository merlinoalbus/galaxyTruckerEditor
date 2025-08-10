import { useState, useCallback } from 'react';

export interface NavigationPathItem {
  id: string;
  name: string;
  block: any;
}

interface UseZoomNavigationProps {
  currentScriptBlocks: any[];
  setCurrentScriptBlocks: (blocks: any[]) => void;
}

export const useZoomNavigation = ({
  currentScriptBlocks,
  setCurrentScriptBlocks
}: UseZoomNavigationProps) => {
  const [navigationPath, setNavigationPath] = useState<NavigationPathItem[]>([]);
  const [currentFocusedBlock, setCurrentFocusedBlock] = useState<any>(null);
  const [rootBlocks, setRootBlocks] = useState<any[]>([]);

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
    }
    return null;
  }, []);

  const getBlockDisplayName = (block: any): string => {
    switch (block.type) {
      case 'SCRIPT': return block.scriptName || 'Script';
      case 'IF': return `IF ${block.ifType || ''}`.trim();
      case 'MENU': return 'MENU';
      case 'OPT': return `OPT ${block.optionText || ''}`.trim();
      case 'SAY': return 'SAY';
      case 'DELAY': return 'DELAY';
      case 'GO': return 'GO';
      case 'LABEL': return `LABEL ${block.label || ''}`.trim();
      default: return block.type || 'Block';
    }
  };

  const handleZoomIn = useCallback((blockId: string) => {
    
    // Se è il primo zoom, salva i blocchi attuali come root
    if (navigationPath.length === 0) {
      setRootBlocks([...currentScriptBlocks]);
    }
    
    // IMPORTANTE: Cerca sempre dai blocchi root quando esistono
    const searchIn = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
    
    const result = findBlockInTree(searchIn, blockId);
    
    if (!result || !result.block) {
      return;
    }
    
    // Verifica che sia un container
    const isContainer = result.block.isContainer || 
                       result.block.type === 'IF' || 
                       result.block.type === 'MENU' || 
                       result.block.type === 'OPT' ||
                       result.block.type === 'SCRIPT';
    
    if (!isContainer) {
      return;
    }
    
    // Costruisci il nuovo path di navigazione includendo TUTTO il percorso
    const newPath = [...result.path, result.block].map(block => ({
      id: block.id,
      name: getBlockDisplayName(block),
      block: block
    }));
    
    
    setNavigationPath(newPath);
    setCurrentFocusedBlock(result.block);
    
    // Mostra SOLO il blocco selezionato come root dell'editor
    setCurrentScriptBlocks([result.block]);
    
  }, [currentScriptBlocks, rootBlocks, findBlockInTree, navigationPath.length, setCurrentScriptBlocks]);

  const handleZoomOut = useCallback((targetLevel?: number) => {
    
    if (navigationPath.length === 0) {
      return;
    }
    
    let targetIndex = targetLevel !== undefined ? targetLevel : navigationPath.length - 2;
    
    if (targetIndex < 0) {
      // Torna alla vista root
      setNavigationPath([]);
      setCurrentFocusedBlock(null);
      setCurrentScriptBlocks(rootBlocks);
    } else if (targetIndex < navigationPath.length) {
      // Naviga al livello specificato nel path
      const newPath = navigationPath.slice(0, targetIndex + 1);
      const targetBlockId = newPath[newPath.length - 1].id;
      
      // Recupera il blocco aggiornato dai rootBlocks
      const result = findBlockInTree(rootBlocks, targetBlockId);
      if (result && result.block) {
        const targetBlock = result.block;
        
        setNavigationPath(newPath.map((item, index) => {
          // Aggiorna i blocchi nel path con le versioni aggiornate
          if (index === newPath.length - 1) {
            return { ...item, block: targetBlock };
          }
          const blockResult = findBlockInTree(rootBlocks, item.id);
          return blockResult ? { ...item, block: blockResult.block } : item;
        }));
        setCurrentFocusedBlock(targetBlock);
        
        // Mostra il blocco target aggiornato
        setCurrentScriptBlocks([targetBlock]);
      }
    }
  }, [navigationPath, rootBlocks, setCurrentScriptBlocks, findBlockInTree]);

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
    currentFocusedBlock,
    currentFocusedBlockId: currentFocusedBlock?.id || null,
    rootBlocks,
    handleZoomIn,
    handleZoomOut,
    updateRootBlocksIfNeeded,
    isZoomed: navigationPath.length > 0
  };
};
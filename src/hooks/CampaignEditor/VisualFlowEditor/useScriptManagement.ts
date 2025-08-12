import { useState, useCallback } from 'react';
import { ScriptData } from '@/components/CampaignEditor/VisualFlowEditor/components/ScriptsList';
import { addUniqueIds, generateBlockId } from '@/utils/CampaignEditor/VisualFlowEditor/blockIdManager';
import { cleanupScriptBlocks } from '@/utils/CampaignEditor/VisualFlowEditor/blockCleaner';
import { generateScriptJson, generateMissionJson } from '@/utils/CampaignEditor/VisualFlowEditor/jsonConverter';

export interface NewScriptDialogType {
  isOpen: boolean;
  fileName: string;
  error?: string;
}

interface UseScriptManagementProps {
  setCurrentScriptBlocks: (blocks: any[]) => void;
  setShowScriptsList: (show: boolean) => void;
  currentScriptBlocks?: any[];
  rootBlocks?: any[];
  isZoomed?: boolean;
}

export const useScriptManagement = ({ 
  setCurrentScriptBlocks,
  setShowScriptsList,
  currentScriptBlocks = [],
  rootBlocks = [],
  isZoomed = false
}: UseScriptManagementProps) => {
  const [currentScript, setCurrentScript] = useState<ScriptData | null>(null);
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [newScriptDialog, setNewScriptDialog] = useState<NewScriptDialogType>({ 
    isOpen: false, 
    fileName: '' 
  });

  // Handler per nuovo script
  const handleNewScript = useCallback(() => {
    setNewScriptDialog({ isOpen: true, fileName: '' });
  }, []);

  // Conferma creazione nuovo script
  const confirmNewScript = useCallback(() => {
    const fileName = newScriptDialog.fileName.trim();
    if (!fileName) {
      setNewScriptDialog(prev => ({ ...prev, error: 'Nome file richiesto' }));
      return;
    }
    if (!fileName.endsWith('.txt')) {
      setNewScriptDialog(prev => ({ ...prev, error: 'Il file deve terminare con .txt' }));
      return;
    }
    
    const scriptName = fileName.replace('.txt', '');
    
    const newScriptBlock = {
      id: generateBlockId('SCRIPT'),
      type: 'SCRIPT',
      position: { x: 100, y: 100 },
      isContainer: true,
      children: [],
      scriptName: scriptName,
      fileName: fileName
    };
    
    setCurrentScriptBlocks([newScriptBlock]);
    setCurrentScript({
      name: scriptName,
      fileName: fileName,
      language: 'EN',
      blocks: [],
      metadata: { blockCount: 1, commandCount: 0, errorCount: 0 },
      availableLanguages: ['EN', 'IT']
    });
    
    setNewScriptDialog({ isOpen: false, fileName: '' });
    setShowScriptsList(false);
  }, [newScriptDialog.fileName, setCurrentScriptBlocks, setShowScriptsList]);

  // Conferma creazione nuova mission
  const confirmNewMission = useCallback(() => {
    const fileName = newScriptDialog.fileName.trim();
    if (!fileName) {
      setNewScriptDialog(prev => ({ ...prev, error: 'Nome file richiesto' }));
      return;
    }
    if (!fileName.endsWith('.txt')) {
      setNewScriptDialog(prev => ({ ...prev, error: 'Il file deve terminare con .txt' }));
      return;
    }
    
    const missionName = fileName.replace('.txt', '');
    
    const newMissionBlock = {
      id: generateBlockId('MISSION'),
      type: 'MISSION',
      position: { x: 100, y: 100 },
      isContainer: true,
      blocksMission: [],
      blocksFinish: [],
      missionName: missionName,
      fileName: fileName
    };
    
    setCurrentScriptBlocks([newMissionBlock]);
    setCurrentScript({
      name: missionName,
      fileName: fileName,
      language: 'EN',
      blocks: [],
      metadata: { blockCount: 1, commandCount: 0, errorCount: 0 },
      availableLanguages: ['EN', 'IT']
    });
    
    setNewScriptDialog({ isOpen: false, fileName: '' });
    setShowScriptsList(false);
  }, [newScriptDialog.fileName, setCurrentScriptBlocks, setShowScriptsList]);

  // Carica mission via API
  const loadMission = useCallback(async (missionId: string) => {
    setIsLoadingScript(true);
    try {
      const response = await fetch(`http://localhost:3001/api/missions/${missionId}?multilingua=true&format=blocks`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        setCurrentScript(result.data);
        
        // Aggiungi ID univoci e flag container
        const addContainerFlags = (blocks: any[]): any[] => {
          return blocks.map(block => {
            const newBlock = { ...block };
            
            // Aggiungi ID se manca
            if (!newBlock.id) {
              newBlock.id = generateBlockId(block.type || 'BLOCK');
            }
            
            // Un blocco è container se ha children, thenBlocks, elseBlocks, blocksMission o blocksFinish
            if (block.children || block.thenBlocks || block.elseBlocks || block.blocksMission || block.blocksFinish) {
              newBlock.isContainer = true;
            }
            
            // Ricorsivamente processa i children
            if (newBlock.children) {
              newBlock.children = addContainerFlags(newBlock.children);
            }
            if (newBlock.thenBlocks) {
              newBlock.thenBlocks = addContainerFlags(newBlock.thenBlocks);
            }
            if (newBlock.elseBlocks) {
              newBlock.elseBlocks = addContainerFlags(newBlock.elseBlocks);
            }
            if (newBlock.blocksMission) {
              newBlock.blocksMission = addContainerFlags(newBlock.blocksMission);
            }
            if (newBlock.blocksFinish) {
              newBlock.blocksFinish = addContainerFlags(newBlock.blocksFinish);
            }
            
            return newBlock;
          });
        };
        
        // Processa blocksMission e blocksFinish
        const blocksMission = result.data.blocksMission ? addContainerFlags(result.data.blocksMission) : [];
        const blocksFinish = result.data.blocksFinish ? addContainerFlags(result.data.blocksFinish) : [];
        
        // Crea il blocco MISSION principale
        const missionBlock = {
          id: generateBlockId('MISSION'),
          type: 'MISSION',
          position: { x: 100, y: 100 },
          isContainer: true,
          blocksMission: blocksMission,
          blocksFinish: blocksFinish,
          missionName: result.data.name,
          fileName: result.data.fileName,
          children: [] // MISSION usa blocksMission/blocksFinish, non children
        };
        
        setCurrentScriptBlocks([missionBlock]);
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento della mission:', error);
    } finally {
      setIsLoadingScript(false);
      setShowScriptsList(false);
    }
  }, [setCurrentScriptBlocks, setShowScriptsList]);

  // Carica script via API
  const loadScript = useCallback(async (scriptId: string) => {
    setIsLoadingScript(true);
    try {
      const response = await fetch(`http://localhost:3001/api/scripts/${scriptId}?multilingua=true&format=blocks`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        setCurrentScript(result.data);
        
        let blocksToLoad = result.data.blocks || [];
        
        // Pulisci la struttura rimuovendo blocchi SCRIPT annidati/anonimi
        let cleanedBlocks = cleanupScriptBlocks(blocksToLoad);
        
        // Aggiungi ID univoci a tutti i blocchi
        cleanedBlocks = addUniqueIds(cleanedBlocks);
        
        // Aggiungi proprietà isContainer per tutti i blocchi container
        const addContainerFlags = (blocks: any[]): any[] => {
          return blocks.map(block => {
            const newBlock = { ...block };
            
            // Un blocco è container se ha children, thenBlocks, elseBlocks, blocksMission o blocksFinish
            if (block.children || block.thenBlocks || block.elseBlocks || block.blocksMission || block.blocksFinish) {
              newBlock.isContainer = true;
            }
            
            // Ricorsivamente processa i children
            if (newBlock.children) {
              newBlock.children = addContainerFlags(newBlock.children);
            }
            if (newBlock.thenBlocks) {
              newBlock.thenBlocks = addContainerFlags(newBlock.thenBlocks);
            }
            if (newBlock.elseBlocks) {
              newBlock.elseBlocks = addContainerFlags(newBlock.elseBlocks);
            }
            if (newBlock.blocksMission) {
              newBlock.blocksMission = addContainerFlags(newBlock.blocksMission);
            }
            if (newBlock.blocksFinish) {
              newBlock.blocksFinish = addContainerFlags(newBlock.blocksFinish);
            }
            
            return newBlock;
          });
        };
        
        cleanedBlocks = addContainerFlags(cleanedBlocks);
        
        // Verifica se dopo la pulizia abbiamo già un blocco SCRIPT principale
        let finalScriptBlock;
        
        if (cleanedBlocks.length === 1 && cleanedBlocks[0].type === 'SCRIPT' && cleanedBlocks[0].scriptName) {
          // Usa il blocco SCRIPT esistente ma assicurati che abbia i metadati corretti
          finalScriptBlock = {
            ...cleanedBlocks[0],
            id: cleanedBlocks[0].id || generateBlockId('SCRIPT'),
            scriptName: result.data.name || cleanedBlocks[0].scriptName,
            fileName: result.data.fileName || cleanedBlocks[0].fileName
          };
        } else {
          // Crea un nuovo blocco SCRIPT wrapper con i blocchi puliti come children
          finalScriptBlock = {
            id: generateBlockId('SCRIPT'),
            type: 'SCRIPT',
            position: { x: 100, y: 100 },
            isContainer: true,
            children: cleanedBlocks,
            scriptName: result.data.name,
            fileName: result.data.fileName
          };
        }
        
        // Validazione finale: assicurati che ci sia esattamente un blocco SCRIPT root
        
        setCurrentScriptBlocks([finalScriptBlock]);
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento dello script:', error);
    } finally {
      setIsLoadingScript(false);
      setShowScriptsList(false);
    }
  }, [setCurrentScriptBlocks, setShowScriptsList]);

  // Salva script via API
  const saveScript = useCallback(async () => {
    // Usa sempre rootBlocks se disponibile (contiene l'albero completo), altrimenti currentScriptBlocks
    const blocksToSave = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
    
    if (!blocksToSave || blocksToSave.length === 0) {
      console.error('Nessun blocco da salvare');
      return { success: false, error: 'Nessun blocco da salvare' };
    }

    const scriptJson = generateScriptJson(blocksToSave);
    if (!scriptJson) {
      console.error('Impossibile generare JSON dello script');
      return { success: false, error: 'Impossibile generare JSON' };
    }

    // L'API si aspetta un array di script
    const payload = [scriptJson];

    try {
      const response = await fetch('http://localhost:3001/api/scripts/saveScript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Script salvato con successo');
        return { success: true };
      } else {
        console.error('❌ Errore nel salvataggio:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Errore nella chiamata API:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, [currentScriptBlocks, rootBlocks]);

  // Salva mission via API
  const saveMission = useCallback(async () => {
    // Usa sempre rootBlocks se disponibile (contiene l'albero completo), altrimenti currentScriptBlocks
    const blocksToSave = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
    
    if (!blocksToSave || blocksToSave.length === 0) {
      console.error('Nessun blocco da salvare');
      return { success: false, error: 'Nessun blocco da salvare' };
    }

    const missionJson = generateMissionJson(blocksToSave);
    if (!missionJson) {
      console.error('Impossibile generare JSON della mission');
      return { success: false, error: 'Impossibile generare JSON' };
    }

    // L'API si aspetta un array di mission
    const payload = [missionJson];

    try {
      const response = await fetch('http://localhost:3001/api/missions/saveMission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Mission salvata con successo');
        return { success: true };
      } else {
        console.error('❌ Errore nel salvataggio della mission:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Errore nella chiamata API:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, [currentScriptBlocks, rootBlocks]);

  return {
    currentScript,
    isLoadingScript,
    newScriptDialog,
    setNewScriptDialog,
    handleNewScript,
    confirmNewScript,
    confirmNewMission,
    loadScript,
    loadMission,
    saveScript,
    saveMission
  };
};
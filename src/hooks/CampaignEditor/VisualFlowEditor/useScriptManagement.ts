import { useState, useCallback } from 'react';
import { ScriptData } from '@/components/CampaignEditor/VisualFlowEditor/components/ScriptsList';
import { addUniqueIds, generateBlockId } from '@/utils/CampaignEditor/VisualFlowEditor/blockIdManager';
import { cleanupScriptBlocks } from '@/utils/CampaignEditor/VisualFlowEditor/blockCleaner';

export interface NewScriptDialogType {
  isOpen: boolean;
  fileName: string;
  error?: string;
}

interface UseScriptManagementProps {
  setCurrentScriptBlocks: (blocks: any[]) => void;
  setShowScriptsList: (show: boolean) => void;
}

export const useScriptManagement = ({ 
  setCurrentScriptBlocks,
  setShowScriptsList 
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

  return {
    currentScript,
    isLoadingScript,
    newScriptDialog,
    setNewScriptDialog,
    handleNewScript,
    confirmNewScript,
    loadScript
  };
};
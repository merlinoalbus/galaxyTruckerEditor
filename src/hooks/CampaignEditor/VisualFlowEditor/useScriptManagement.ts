import { logger } from '@/utils/logger';
import { useState, useCallback } from 'react';
import { ScriptData } from '@/components/CampaignEditor/VisualFlowEditor/components/ScriptsList';
import { addUniqueIds, generateBlockId } from '@/utils/CampaignEditor/VisualFlowEditor/blockIdManager';
import { cleanupScriptBlocks } from '@/utils/CampaignEditor/VisualFlowEditor/blockCleaner';
import { generateScriptJson, generateMissionJson, convertBlocksToJson } from '@/utils/CampaignEditor/VisualFlowEditor/jsonConverter';
import type { IFlowBlock, ValidationResult } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';
import { UI_CONSTANTS, SUPPORTED_LANGUAGES } from '@/constants/VisualFlowEditor.constants';
import { API_CONFIG } from '@/config/constants';

export interface NewScriptDialogType {
  isOpen: boolean;
  fileName: string;
  error?: string;
  scriptType?: 'standard' | 'custom' | 'customMultilingual';  // Tipo di script da creare
}

interface UseScriptManagementProps {
  setCurrentScriptBlocks: (blocks: IFlowBlock[]) => void;
  setShowScriptsList: (show: boolean) => void;
  currentScriptBlocks?: IFlowBlock[];
  rootBlocks?: IFlowBlock[];
  isZoomed?: boolean;
  resetNavigationState?: () => void;
  setValidationErrors?: (errors: ValidationResult) => void;
  setDropError?: (error: string | null) => void;
}

export const useScriptManagement = ({ 
  setCurrentScriptBlocks,
  setShowScriptsList,
  currentScriptBlocks = [],
  rootBlocks = [],
  isZoomed = false,
  resetNavigationState,
  setValidationErrors,
  setDropError
}: UseScriptManagementProps) => {
  const [currentScript, setCurrentScript] = useState<ScriptData | null>(null);
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [newScriptDialog, setNewScriptDialog] = useState<NewScriptDialogType>({ 
    isOpen: false, 
    fileName: '' 
  });

  // Handler per nuovo script
  const handleNewScript = useCallback(() => {
    setNewScriptDialog({ isOpen: true, fileName: '', scriptType: 'standard' });
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
    
    // Reset completo dello stato prima di creare il nuovo script
    if (resetNavigationState) resetNavigationState();
    if (setValidationErrors) setValidationErrors({ errors: 0, invalidBlocks: [] });
    if (setDropError) setDropError(null);
    
    // Determina isCustom e customPath in base al tipo selezionato
    const isCustom = newScriptDialog.scriptType !== 'standard';
    const customPath = isCustom 
      ? (newScriptDialog.scriptType === 'customMultilingual' 
          ? `customScripts/EN/${fileName}`  // Path per custom multilingua
          : `customScripts/${fileName}`)     // Path per custom diretto
      : null;
    
    const newScriptBlock: IFlowBlock = {
      id: generateBlockId('SCRIPT'),
      type: 'SCRIPT',
      position: { x: 100, y: 100 },
      isContainer: true,
      children: [],
      scriptName: scriptName,
      fileName: fileName,
      // Salva i metadati custom direttamente nel blocco
      isCustom: isCustom,
      customPath: customPath
    };
    
    setCurrentScriptBlocks([newScriptBlock]);
    
    setCurrentScript({
      name: scriptName,
      fileName: fileName,
      language: 'EN',
      blocks: [],
      metadata: { blockCount: 1, commandCount: 0, errorCount: 0 },
      availableLanguages: newScriptDialog.scriptType === 'standard'
        ? [...SUPPORTED_LANGUAGES]  // Tutte le lingue per standard
        : newScriptDialog.scriptType === 'customMultilingual'
        ? [...SUPPORTED_LANGUAGES]  // Tutte le lingue per custom multilingua
        : ['EN'],  // Solo EN per custom non multilingua
      isCustom: isCustom,
      customPath: customPath
    });
    
    setNewScriptDialog({ isOpen: false, fileName: '' });
    setShowScriptsList(false);
  }, [newScriptDialog.fileName, newScriptDialog.scriptType, setCurrentScriptBlocks, setShowScriptsList, resetNavigationState, setValidationErrors, setDropError]);

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
    
    // Reset completo dello stato prima di creare la nuova mission
    if (resetNavigationState) resetNavigationState();
    if (setValidationErrors) setValidationErrors({ errors: 0, invalidBlocks: [] });
    if (setDropError) setDropError(null);
    
    // Determina isCustom e customPath in base al tipo selezionato
    const isCustom = newScriptDialog.scriptType !== 'standard';
    const customPath = isCustom 
      ? (newScriptDialog.scriptType === 'customMultilingual' 
          ? `customScripts/EN/${fileName}`  // Path per custom multilingua
          : `customScripts/${fileName}`)     // Path per custom diretto
      : null;
    
    const newMissionBlock: IFlowBlock = {
      id: generateBlockId('MISSION'),
      type: 'MISSION',
      position: { x: 100, y: 100 },
      isContainer: true,
      blocksMission: [],
      blocksFinish: [],
      name: missionName,
      fileName: fileName,
      // Salva i metadati custom direttamente nel blocco
      isCustom: isCustom,
      customPath: customPath
    };
    
    setCurrentScriptBlocks([newMissionBlock]);
    setCurrentScript({
      name: missionName,
      fileName: fileName,
      language: 'EN',
      blocks: [],
      metadata: { blockCount: 1, commandCount: 0, errorCount: 0 },
      availableLanguages: newScriptDialog.scriptType === 'standard'
        ? [...SUPPORTED_LANGUAGES]  // Tutte le lingue per standard
        : newScriptDialog.scriptType === 'customMultilingual'
        ? [...SUPPORTED_LANGUAGES]  // Tutte le lingue per custom multilingua
        : ['EN'],  // Solo EN per custom non multilingua
      isCustom: isCustom,
      customPath: customPath
    });
    
    setNewScriptDialog({ isOpen: false, fileName: '' });
    setShowScriptsList(false);
  }, [newScriptDialog.fileName, newScriptDialog.scriptType, setCurrentScriptBlocks, setShowScriptsList, resetNavigationState, setValidationErrors, setDropError]);

  // Carica mission via API
  const loadMission = useCallback(async (missionId: string) => {
    setIsLoadingScript(true);
    
    // Reset completo dello stato del Visual Flow Editor
    setCurrentScriptBlocks([]);
    if (resetNavigationState) resetNavigationState();
    if (setValidationErrors) setValidationErrors({ errors: 0, invalidBlocks: [] });
    if (setDropError) setDropError(null);
    
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/missions/${missionId}?multilingua=true&format=blocks`);
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
        const missionBlock: IFlowBlock = {
          id: generateBlockId('MISSION'),
          type: 'MISSION',
          position: { x: UI_CONSTANTS.DEFAULT_POSITION_X, y: UI_CONSTANTS.DEFAULT_POSITION_Y },
          isContainer: true,
          blocksMission: blocksMission,
          blocksFinish: blocksFinish,
          name: result.data.name,
          missionName: result.data.name, // Aggiungi anche missionName per compatibilità con MissionBlock
          fileName: result.data.fileName,
          children: [] // MISSION usa blocksMission/blocksFinish, non children
        };
        
        setCurrentScriptBlocks([missionBlock]);
      }
    } catch (error) {
  logger.error('[VisualFlowEditor] Error loading mission:', error);
      if (setDropError) {
        setDropError('Errore nel caricamento della mission. Controlla il formato del file.');
      }
    } finally {
      setIsLoadingScript(false);
      setShowScriptsList(false);
    }
  }, [setCurrentScriptBlocks, setShowScriptsList, resetNavigationState, setValidationErrors, setDropError]);

  // Carica script via API
  const loadScript = useCallback(async (scriptId: string) => {
    setIsLoadingScript(true);
    
    // Reset completo dello stato del Visual Flow Editor
    setCurrentScriptBlocks([]);
    if (resetNavigationState) resetNavigationState();
    if (setValidationErrors) setValidationErrors({ errors: 0, invalidBlocks: [] });
    if (setDropError) setDropError(null);
    
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/scripts/${scriptId}?multilingua=true&format=blocks`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        // Salva tutti i metadati inclusi isCustom e customPath
        setCurrentScript({
          ...result.data,
          isCustom: result.data.isCustom || false,
          customPath: result.data.customPath || null
        });
        
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
            position: { x: UI_CONSTANTS.DEFAULT_POSITION_X, y: UI_CONSTANTS.DEFAULT_POSITION_Y },
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
  logger.error('[VisualFlowEditor] Error loading script:', error);
      if (setDropError) {
        setDropError('Errore nel caricamento dello script. Controlla il formato del file.');
      }
    } finally {
      setIsLoadingScript(false);
      setShowScriptsList(false);
    }
  }, [setCurrentScriptBlocks, setShowScriptsList, resetNavigationState, setValidationErrors, setDropError]);

  // Salva script via API - ora può salvare multipli script
  const saveScript = useCallback(async (openedScripts?: Map<string, any>) => {
    const scriptsToSave = [];
    const savedScriptNames = new Set<string>(); // Per evitare duplicati
    
    // Se abbiamo script aperti, salva tutti quelli modificati
    if (openedScripts && openedScripts.size > 0) {
      openedScripts.forEach((scriptData, scriptName) => {
        if (scriptData.blocks && scriptData.blocks.length > 0) {
          // Genera JSON per ogni script
          let scriptJson;
          
          // Verifica se è uno script normale o una mission
          const firstBlock = scriptData.blocks[0];
          if (firstBlock && firstBlock.type === 'SCRIPT') {
            scriptJson = generateScriptJson(scriptData.blocks);
          } else if (firstBlock && firstBlock.type === 'MISSION') {
            scriptJson = generateMissionJson(scriptData.blocks);
          } else {
            // Fallback per blocchi senza wrapper
            scriptJson = {
              name: scriptData.scriptName || scriptName,
              fileName: scriptData.fileName,
              blocks: convertBlocksToJson(scriptData.blocks)
            };
          }
          
          if (scriptJson && !savedScriptNames.has(scriptJson.name)) {
            // Determina metadati/flag per salvataggio coerente multilingua
            const isCustom = (scriptData.isCustom !== undefined ? scriptData.isCustom : (currentScript?.isCustom ?? false)) as boolean;
            const availableLangs = (scriptData.availableLanguages && scriptData.availableLanguages.length > 0)
              ? scriptData.availableLanguages
              : (currentScript?.availableLanguages && currentScript.availableLanguages.length > 0)
                ? currentScript.availableLanguages
                : (isCustom ? ['EN'] : [...SUPPORTED_LANGUAGES]);
            // Regola: Standard sempre multilingua; Custom solo se multilingua
            const isMultilingual = isCustom ? (availableLangs?.length > 1) : true;

            const scriptWithMetadata = {
              ...scriptJson,
              isCustom,
              ...(scriptData.customPath !== undefined ? { customPath: scriptData.customPath } : (currentScript?.customPath !== undefined ? { customPath: currentScript.customPath } : {})),
              ...(isMultilingual ? { isMultilingual: true, availableLanguages: availableLangs } : {})
            };
            scriptsToSave.push(scriptWithMetadata);
            savedScriptNames.add(scriptJson.name);
          }
        }
      });
    } else {
      // Se non ci sono script aperti, salva solo lo script corrente
      const mainBlocks = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
      if (mainBlocks && mainBlocks.length > 0) {
        const mainScriptJson = generateScriptJson(mainBlocks);
        if (mainScriptJson && !savedScriptNames.has(mainScriptJson.name)) {
          // Estrai i metadati custom dal blocco SCRIPT se esiste
          const scriptBlock = mainBlocks.find(b => b.type === 'SCRIPT');
          
          // Aggiungi i metadati custom dal blocco SCRIPT o da currentScript
          const computedIsCustom = (scriptBlock?.isCustom !== undefined ? scriptBlock.isCustom : (currentScript?.isCustom ?? false)) as boolean;
          const computedAvailableLangs = (currentScript?.availableLanguages && currentScript.availableLanguages.length > 0)
            ? currentScript.availableLanguages
            : (computedIsCustom ? ['EN'] : [...SUPPORTED_LANGUAGES]);
          const computedIsMultilingual = computedIsCustom ? (computedAvailableLangs.length > 1) : true;

          const scriptWithMetadata = {
            ...mainScriptJson,
            isCustom: computedIsCustom,
            ...((scriptBlock?.customPath !== undefined || currentScript?.customPath !== undefined) && { 
              customPath: scriptBlock?.customPath ?? currentScript?.customPath 
            }),
            ...(computedIsMultilingual ? { isMultilingual: true, availableLanguages: computedAvailableLangs } : {})
          };
          scriptsToSave.push(scriptWithMetadata);
          savedScriptNames.add(mainScriptJson.name);
        }
      }
    }
    
    if (scriptsToSave.length === 0) {
  logger.error('[VisualFlowEditor] No scripts to save');
      return { success: false, error: 'Nessun script da salvare' };
    }

  // Salvataggio script in corso (debug disabilitato in produzione)

    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/scripts/saveScript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scriptsToSave)
      });

      const result = await response.json();
      
      if (result.success) {
        // ${scriptsToSave.length} script salvati con successo
        
        // Reset flag isModified per tutti gli script salvati
        if (openedScripts) {
          openedScripts.forEach((scriptData) => {
            scriptData.isModified = false;
          });
        }
        
        return { success: true };
      } else {
  logger.error('[VisualFlowEditor] Save error:', result.error);
      if (setDropError) {
        setDropError('Errore durante il salvataggio dello script.');
      }
        return { success: false, error: result.error };
      }
    } catch (error) {
  logger.error('[VisualFlowEditor] API call error:', error);
      if (setDropError) {
        setDropError('Errore nella comunicazione con il server.');
      }
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, [currentScriptBlocks, rootBlocks, currentScript, setDropError]);

  // Salva mission via API
  const saveMission = useCallback(async () => {
    // Usa sempre rootBlocks se disponibile (contiene l'albero completo), altrimenti currentScriptBlocks
    const blocksToSave = rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
    
    if (!blocksToSave || blocksToSave.length === 0) {
  logger.error('Nessun blocco da salvare');
      return { success: false, error: 'Nessun blocco da salvare' };
    }

    const missionJson = generateMissionJson(blocksToSave);
    if (!missionJson) {
  logger.error('Impossibile generare JSON della mission');
      return { success: false, error: 'Impossibile generare JSON' };
    }

    // Estrai i metadati custom dal blocco MISSION se esiste
    const missionBlock = blocksToSave.find(b => b.type === 'MISSION');
    
    // Aggiungi i metadati custom se presenti
    const computedIsCustom = (missionBlock?.isCustom !== undefined ? missionBlock.isCustom : (currentScript?.isCustom ?? false)) as boolean;
    const computedAvailableLangs = (currentScript?.availableLanguages && currentScript.availableLanguages.length > 0)
      ? currentScript.availableLanguages
      : (computedIsCustom ? ['EN'] : [...SUPPORTED_LANGUAGES]);
    // Regola: Standard sempre multilingua; Custom solo se multilingua
    const computedIsMultilingual = computedIsCustom ? (computedAvailableLangs.length > 1) : true;

    const missionWithMetadata = {
      ...missionJson,
      isCustom: computedIsCustom,
      ...((missionBlock?.customPath !== undefined || currentScript?.customPath !== undefined) && { 
        customPath: missionBlock?.customPath ?? currentScript?.customPath 
      }),
      ...(computedIsMultilingual ? { isMultilingual: true, availableLanguages: computedAvailableLangs } : {})
    };

    // L'API si aspetta un array di mission
    const payload = [missionWithMetadata];

    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/missions/saveMission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        // Mission salvata con successo
        return { success: true };
      } else {
  logger.error('[VisualFlowEditor] Mission save error:', result.error);
      if (setDropError) {
        setDropError('Errore durante il salvataggio della mission.');
      }
        return { success: false, error: result.error };
      }
    } catch (error) {
  logger.error('[VisualFlowEditor] API call error:', error);
      if (setDropError) {
        setDropError('Errore nella comunicazione con il server.');
      }
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, [currentScriptBlocks, rootBlocks, currentScript, setDropError]);

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
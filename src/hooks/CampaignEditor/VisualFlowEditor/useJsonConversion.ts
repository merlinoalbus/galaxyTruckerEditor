import { useState, useEffect } from 'react';
import { ScriptJson } from '@/types/CampaignEditor/VisualFlowEditor/ScriptJson';
import { convertBlocksToJson } from '@/utils/CampaignEditor/VisualFlowEditor/jsonConverter';

interface UseJsonConversionProps {
  currentScriptBlocks: any[];
  rootBlocks?: any[];
  isZoomed?: boolean;
}

/**
 * Hook per gestire la conversione dei blocchi in formato JSON
 * Aggiorna automaticamente il JSON quando i blocchi cambiano
 */
export const useJsonConversion = ({ 
  currentScriptBlocks, 
  rootBlocks = [], 
  isZoomed = false 
}: UseJsonConversionProps) => {
  const [scriptJson, setScriptJson] = useState<ScriptJson | null>(null);

  // Aggiorna JSON quando i blocchi cambiano e logga ogni modifica
  useEffect(() => {
    // Mostra sempre i currentScriptBlocks che sono i blocchi attualmente visualizzati
    const blocksToUse = currentScriptBlocks;
    
    if (blocksToUse.length > 0) {
      const scriptBlock = blocksToUse.find(b => b.type === 'SCRIPT');
      const missionBlock = blocksToUse.find(b => b.type === 'MISSION');
      
      if (scriptBlock) {
        const json: any = {
          name: scriptBlock.scriptName,
          fileName: scriptBlock.fileName,
          blocks: convertBlocksToJson(scriptBlock.children || [])
        };
        setScriptJson(json);
      } else if (missionBlock) {
        const json: any = {
          name: missionBlock.missionName,
          fileName: missionBlock.fileName,
          blocksMission: convertBlocksToJson(missionBlock.blocksMission || []),
          blocksFinish: convertBlocksToJson(missionBlock.blocksFinish || [])
        };
        setScriptJson(json);
      } else {
        // Gestione per blocchi BUILD e FLIGHT standalone
        const buildBlock = blocksToUse.find(b => b.type === 'BUILD');
        const flightBlock = blocksToUse.find(b => b.type === 'FLIGHT');
        
        if (buildBlock) {
          const json: any = {
            type: 'BUILD',
            name: buildBlock.name || 'Build Script',
            fileName: buildBlock.fileName || 'build.txt',
            blockInit: convertBlocksToJson(buildBlock.blockInit || []),
            blockStart: convertBlocksToJson(buildBlock.blockStart || []),
            numBlockInit: buildBlock.numBlockInit || 0,
            numBlockStart: buildBlock.numBlockStart || 0
          };
          setScriptJson(json);
        } else if (flightBlock) {
          const json: any = {
            type: 'FLIGHT',
            name: flightBlock.name || 'Flight Script',
            fileName: flightBlock.fileName || 'flight.txt',
            blockInit: convertBlocksToJson(flightBlock.blockInit || []),
            blockStart: convertBlocksToJson(flightBlock.blockStart || []),
            blockEvaluate: convertBlocksToJson(flightBlock.blockEvaluate || []),
            numBlockInit: flightBlock.numBlockInit || 0,
            numBlockStart: flightBlock.numBlockStart || 0,
            numBlockEvaluate: flightBlock.numBlockEvaluate || 0
          };
          setScriptJson(json);
        }
      }
    }
  }, [currentScriptBlocks, rootBlocks, isZoomed]);

  /**
   * Esporta il JSON corrente come stringa formattata
   * @returns JSON formattato come stringa
   */
  const exportJsonString = (): string => {
    if (!scriptJson) return '{}';
    return JSON.stringify(scriptJson, null, 2);
  };

  /**
   * Esporta il JSON corrente come file scaricabile
   * @param filename - Nome del file da scaricare
   */
  const downloadJson = (filename?: string) => {
    if (!scriptJson) return;
    
    const jsonString = exportJsonString();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${scriptJson.name || 'script'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Valida il JSON corrente
   * @returns true se il JSON è valido
   */
  const isValidJson = (): boolean => {
    if (scriptJson === null || (scriptJson as any).name === undefined) return false;
    
    const json = scriptJson as any;
    
    // Validazione per SCRIPT normale
    if (json.blocks !== undefined) return true;
    
    // Validazione per MISSION
    if (json.blocksMission !== undefined && json.blocksFinish !== undefined) return true;
    
    // Validazione per BUILD
    if (json.type === 'BUILD' && json.blockInit !== undefined && json.blockStart !== undefined) return true;
    
    // Validazione per FLIGHT
    if (json.type === 'FLIGHT' && json.blockInit !== undefined && json.blockStart !== undefined && json.blockEvaluate !== undefined) return true;
    
    return false;
  };

  /**
   * Conta il numero totale di blocchi nel JSON
   * @returns Il numero di blocchi
   */
  const getBlockCount = (): number => {
    if (!scriptJson) return 0;
    
    const json = scriptJson as any;
    
    const countRecursive = (blocks: any[]): number => {
      let count = blocks.length;
      for (const block of blocks) {
        if (block.children) count += countRecursive(block.children);
        if (block.thenBlocks) count += countRecursive(block.thenBlocks);
        if (block.elseBlocks) count += countRecursive(block.elseBlocks);
        if (block.blockInit) count += countRecursive(block.blockInit);
        if (block.blockStart) count += countRecursive(block.blockStart);
        if (block.blockEvaluate) count += countRecursive(block.blockEvaluate);
        if (block.blocksMission) count += countRecursive(block.blocksMission);
        if (block.blocksFinish) count += countRecursive(block.blocksFinish);
      }
      return count;
    };
    
    // Gestione per diversi tipi di JSON
    if (json.blocks) {
      // SCRIPT normale
      return countRecursive(json.blocks);
    } else if (json.blocksMission && json.blocksFinish) {
      // MISSION
      return countRecursive(json.blocksMission) + countRecursive(json.blocksFinish);
    } else if (json.type === 'BUILD' && json.blockInit && json.blockStart) {
      // BUILD
      return countRecursive(json.blockInit) + countRecursive(json.blockStart);
    } else if (json.type === 'FLIGHT' && json.blockInit && json.blockStart && json.blockEvaluate) {
      // FLIGHT
      return countRecursive(json.blockInit) + countRecursive(json.blockStart) + countRecursive(json.blockEvaluate);
    }
    
    return 0;
  };

  return {
    scriptJson,
    exportJsonString,
    downloadJson,
    isValidJson,
    getBlockCount
  };
};
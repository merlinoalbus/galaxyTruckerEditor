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
    // Usa rootBlocks quando siamo in zoom, altrimenti usa currentScriptBlocks
    const blocksToUse = isZoomed && rootBlocks.length > 0 ? rootBlocks : currentScriptBlocks;
    
    if (blocksToUse.length > 0) {
      const scriptBlock = blocksToUse.find(b => b.type === 'SCRIPT');
      if (scriptBlock) {
        const json: any = {
          scriptName: scriptBlock.scriptName,
          filePath: scriptBlock.fileName, // ScriptJson usa filePath non fileName
          blocks: convertBlocksToJson(scriptBlock.children || [])
        };
        setScriptJson(json);
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
    a.download = filename || `${scriptJson.scriptName || 'script'}.json`;
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
    return scriptJson !== null && 
           scriptJson.scriptName !== undefined &&
           scriptJson.blocks !== undefined;
  };

  /**
   * Conta il numero totale di blocchi nel JSON
   * @returns Il numero di blocchi
   */
  const getBlockCount = (): number => {
    if (!scriptJson || !scriptJson.blocks) return 0;
    
    const countRecursive = (blocks: any[]): number => {
      let count = blocks.length;
      for (const block of blocks) {
        if (block.children) count += countRecursive(block.children);
        if (block.thenBlocks) count += countRecursive(block.thenBlocks);
        if (block.elseBlocks) count += countRecursive(block.elseBlocks);
      }
      return count;
    };
    
    return countRecursive(scriptJson.blocks);
  };

  return {
    scriptJson,
    exportJsonString,
    downloadJson,
    isValidJson,
    getBlockCount
  };
};
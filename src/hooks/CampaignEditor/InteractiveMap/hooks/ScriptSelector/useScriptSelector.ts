import { useState, useMemo } from 'react';
import { CampaignScript } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { scriptSelectorService } from '@/services/CampaignEditor/InteractiveMap/services/ScriptSelector/scriptSelectorService';

export interface UseScriptSelectorReturn {
  searchTerm: string;
  filteredScripts: CampaignScript[];
  setSearchTerm: (term: string) => void;
  getScriptPreview: (script: CampaignScript) => string;
  isStartScript: (script: CampaignScript) => boolean;
}

export const useScriptSelector = (
  scripts: CampaignScript[], 
  startScripts: string[] = []
): UseScriptSelectorReturn => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredScripts = useMemo(() => {
    const filtered = scriptSelectorService.filterScripts(scripts, searchTerm);
    return scriptSelectorService.sortScripts(filtered, startScripts);
  }, [scripts, searchTerm, startScripts]);

  const getScriptPreview = (script: CampaignScript): string => {
    return scriptSelectorService.getScriptPreview(script);
  };

  const isStartScript = (script: CampaignScript): boolean => {
    return scriptSelectorService.isStartScript(script, startScripts);
  };

  return {
    searchTerm,
    filteredScripts,
    setSearchTerm,
    getScriptPreview,
    isStartScript
  };
};
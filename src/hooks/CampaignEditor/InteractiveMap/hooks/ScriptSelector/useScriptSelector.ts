import { useState, useMemo } from 'react';
import { CampaignScript } from '../../../../../types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { scriptSelectorService } from '../../../../../services/CampaignEditor/InteractiveMap/services/ScriptSelector/scriptSelectorService';

export interface UseScriptSelectorReturn {
  searchTerm: string;
  filteredScripts: CampaignScript[];
  setSearchTerm: (term: string) => void;
  getScriptPreview: (script: CampaignScript) => string;
}

export const useScriptSelector = (scripts: CampaignScript[]): UseScriptSelectorReturn => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredScripts = useMemo(() => {
    const filtered = scriptSelectorService.filterScripts(scripts, searchTerm);
    return scriptSelectorService.sortScripts(filtered);
  }, [scripts, searchTerm]);

  const getScriptPreview = (script: CampaignScript): string => {
    return scriptSelectorService.getScriptPreview(script);
  };

  return {
    searchTerm,
    filteredScripts,
    setSearchTerm,
    getScriptPreview
  };
};
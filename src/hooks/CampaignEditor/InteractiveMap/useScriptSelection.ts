import { useState, useCallback } from 'react';
import { MapNode, MapConnection, CampaignScript } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';

export interface UseScriptSelectionReturn {
  scriptSelectorOpen: boolean;
  scriptSelectorData: {
    scripts: CampaignScript[];
    title: string;
    startScripts?: string[];
  };
  handleScriptSelect: (script: CampaignScript) => void;
  handleScriptSelectorClose: () => void;
  openScriptSelector: (scripts: CampaignScript[], title: string, startScripts?: string[]) => void;
}

export const useScriptSelection = (
  onScriptSelect?: (script: CampaignScript) => void
): UseScriptSelectionReturn => {
  const [scriptSelectorOpen, setScriptSelectorOpen] = useState(false);
  const [scriptSelectorData, setScriptSelectorData] = useState<{
    scripts: CampaignScript[];
    title: string;
    startScripts?: string[];
  }>({ scripts: [], title: '' });

  const handleScriptSelect = useCallback((script: CampaignScript) => {
    setScriptSelectorOpen(false);
    if (onScriptSelect) {
      onScriptSelect(script);
    }
  }, [onScriptSelect]);

  const handleScriptSelectorClose = useCallback(() => {
    setScriptSelectorOpen(false);
  }, []);

  const openScriptSelector = useCallback((
    scripts: CampaignScript[], 
    title: string, 
    startScripts?: string[]
  ) => {
    setScriptSelectorData({
      scripts,
      title,
      startScripts
    });
    setScriptSelectorOpen(true);
  }, []);

  return {
    scriptSelectorOpen,
    scriptSelectorData,
    handleScriptSelect,
    handleScriptSelectorClose,
    openScriptSelector
  };
};
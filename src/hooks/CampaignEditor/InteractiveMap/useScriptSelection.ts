import { useState, useCallback } from 'react';
import { CampaignScript, Mission } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';

export interface UseScriptSelectionReturn {
  scriptSelectorOpen: boolean;
  scriptSelectorData: {
    scripts: CampaignScript[];
    missions: Mission[];
    title: string;
    startScripts?: string[];
  };
  handleScriptSelect: (script: CampaignScript) => void;
  handleMissionSelect: (mission: Mission) => void;
  handleScriptSelectorClose: () => void;
  openScriptSelector: (scripts: CampaignScript[], title: string, startScripts?: string[], missions?: Mission[]) => void;
}

export const useScriptSelection = (
  onScriptSelect?: (script: CampaignScript) => void,
  onMissionSelect?: (mission: Mission) => void
): UseScriptSelectionReturn => {
  const [scriptSelectorOpen, setScriptSelectorOpen] = useState(false);
  const [scriptSelectorData, setScriptSelectorData] = useState<{
    scripts: CampaignScript[];
    missions: Mission[];
    title: string;
    startScripts?: string[];
  }>({ scripts: [], missions: [], title: '' });

  const handleScriptSelect = useCallback((script: CampaignScript) => {
    setScriptSelectorOpen(false);
    if (onScriptSelect) {
      onScriptSelect(script);
    }
  }, [onScriptSelect]);

  const handleMissionSelect = useCallback((mission: Mission) => {
    setScriptSelectorOpen(false);
    if (onMissionSelect) {
      onMissionSelect(mission);
    }
  }, [onMissionSelect]);

  const handleScriptSelectorClose = useCallback(() => {
    setScriptSelectorOpen(false);
  }, []);

  const openScriptSelector = useCallback((
    scripts: CampaignScript[], 
    title: string, 
    startScripts?: string[],
    missions: Mission[] = []
  ) => {
    setScriptSelectorData({
      scripts,
      missions,
      title,
      startScripts
    });
    setScriptSelectorOpen(true);
  }, []);

  return {
    scriptSelectorOpen,
    scriptSelectorData,
    handleScriptSelect,
    handleMissionSelect,
    handleScriptSelectorClose,
    openScriptSelector
  };
};
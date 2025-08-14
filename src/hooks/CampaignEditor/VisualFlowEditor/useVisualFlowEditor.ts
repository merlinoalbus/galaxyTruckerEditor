import { useState, useEffect } from 'react';
import type { CampaignAnalysis } from '@/types/CampaignEditor';
import { TIMEOUT_CONSTANTS } from '@/constants/VisualFlowEditor.constants';

export const useVisualFlowEditor = (analysis: CampaignAnalysis | null) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState<string | null>(null);

  useEffect(() => {
    // Simula l'inizializzazione dell'editor
    const initializeEditor = async () => {
      setIsLoading(true);
      
      // Placeholder per logica di inizializzazione
      await new Promise(resolve => setTimeout(resolve, TIMEOUT_CONSTANTS.SAFE_TIMEOUT_DEFAULT));
      
      setIsInitialized(true);
      setIsLoading(false);
    };

    if (analysis) {
      initializeEditor();
    } else {
      setIsLoading(false);
    }
  }, [analysis]);

  return {
    isInitialized,
    isLoading,
    selectedScript,
    setSelectedScript
  };
};
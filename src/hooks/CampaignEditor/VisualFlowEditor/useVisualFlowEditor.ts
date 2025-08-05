import { useState, useEffect } from 'react';
import { CampaignAnalysis } from '@/types/CampaignEditor';

export const useVisualFlowEditor = (analysis: CampaignAnalysis | null) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState<string | null>(null);

  useEffect(() => {
    // Simula l'inizializzazione dell'editor
    const initializeEditor = async () => {
      setIsLoading(true);
      
      // Placeholder per logica di inizializzazione
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
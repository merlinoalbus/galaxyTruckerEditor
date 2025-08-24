import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { API_CONFIG } from '@/config/constants';

export interface ButtonItem {
  id: string;
  tipo: 'node_button' | 'route_button';
  sourceId: string;
  script: string;
  mission?: string;
  localizedLabels: Record<string, string>;
  sourceDetails: {
    name: string;
    localizedCaptions?: Record<string, string>;
  };
  utilizzi_totali?: number;
  script_che_lo_usano?: string[];
  comandi_utilizzati?: string[];
}

export interface ButtonItemForSelect {
  key: string;
  label: string;
}

let BUTTONS_CACHE: ButtonItem[] | null = null;
let BUTTONS_LOADING = false;

export const useButtonsList = (currentLanguage: string = 'EN') => {
  const [buttons, setButtons] = useState<ButtonItem[]>(BUTTONS_CACHE || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchButtons = async () => {
      if (BUTTONS_CACHE || BUTTONS_LOADING) {
        // Already have cache or in progress
        if (BUTTONS_CACHE) setButtons(BUTTONS_CACHE);
        return;
      }
      setIsLoading(true);
      setError(null);
      BUTTONS_LOADING = true;
      try {
        const response = await fetch(`${API_CONFIG.API_BASE_URL}/game/buttons`);
        const result = await response.json();
        
        if (result.success && result.data) {
          BUTTONS_CACHE = result.data as ButtonItem[];
          setButtons(BUTTONS_CACHE);
        } else {
          throw new Error(result.message || 'Failed to fetch buttons');
        }
      } catch (err) {
        logger.error('Error fetching buttons:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch buttons');
      } finally {
        setIsLoading(false);
        BUTTONS_LOADING = false;
      }
    };

    fetchButtons();
  }, []);

  // Helper function to get localized button label
  const getLocalizedButtonLabel = (button: ButtonItem, allButtons: ButtonItem[]): string => {
    const localizedLabel = button.localizedLabels[currentLanguage] || 
                           button.localizedLabels['EN'] || 
                           button.id;
    
    // Controlla se ci sono altre button con la stessa label
    const duplicateLabels = allButtons.filter(b => {
      const otherLabel = b.localizedLabels[currentLanguage] || 
                         b.localizedLabels['EN'] || 
                         b.id;
      return otherLabel === localizedLabel && b.id !== button.id;
    });
    
    // Se la label è duplicata, aggiungi l'ID
    if (duplicateLabels.length > 0) {
      return `${button.id} - ${localizedLabel}`;
    }
    
    return localizedLabel; // Solo la label se è unica
  };

  // Convert buttons to format expected by SelectWithModal
  const getButtonsForSelect = (): ButtonItemForSelect[] => {
    // Rimuovi duplicati basandoti sull'ID
    const uniqueButtons = buttons.filter((button, index, self) => 
      index === self.findIndex(b => b.id === button.id)
    );
    
    return uniqueButtons.map(button => ({
      key: button.id,
      label: getLocalizedButtonLabel(button, uniqueButtons)
    }));
  };

  return {
    buttons,
    isLoading,
    error,
    getButtonsForSelect
  };
};

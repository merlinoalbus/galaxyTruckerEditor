// useCampaignTranslations.ts - Hook per gestire le traduzioni di missions e nodes
import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '@/config/constants';

// Types per i dati di traduzione di campaign
export interface CampaignTranslation {
  id: string;
  index: number;
  translations: {
    [language: string]: {
      caption: string;
      description: string;
    };
  };
}

export interface CampaignTranslationData {
  fileName: string;
  numItems: number;
  items: CampaignTranslation[];
}

export interface CampaignTranslationResponse {
  success: boolean;
  data: CampaignTranslationData;
  error?: string;
  message?: string;
}

export interface CampaignSaveResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Lingue supportate per campaign files
export const CAMPAIGN_LANGUAGES = ['EN', 'DE', 'FR', 'ES', 'PL', 'CS', 'RU', 'IT'];

export type CampaignFileType = 'missions' | 'nodes';

export const useCampaignTranslations = () => {
  const [missionsData, setMissionsData] = useState<CampaignTranslationData | null>(null);
  const [nodesData, setNodesData] = useState<CampaignTranslationData | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<CampaignFileType>('missions');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('EN');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Carica i dati di un tipo di file (missions o nodes)
  const loadCampaignFile = useCallback(async (fileType: CampaignFileType) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.BE_BASE_URL}/api/localization/${fileType}`);
      const result: CampaignTranslationResponse = await response.json();

      if (result.success && result.data) {
        if (fileType === 'missions') {
          setMissionsData(result.data);
        } else {
          setNodesData(result.data);
        }
      } else {
        setError(result.error || `Errore nel caricamento di ${fileType}`);
      }
    } catch (err) {
      setError('Errore di connessione al server');
      console.error(`Error loading ${fileType}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salva le modifiche per un tipo di file
  const saveCampaignFile = useCallback(async (
    fileType: CampaignFileType, 
    items: CampaignTranslation[]
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.BE_BASE_URL}/api/localization/${fileType}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      const result: CampaignSaveResponse = await response.json();

      if (result.success) {
        // Aggiorna i dati locali
        const updatedData = fileType === 'missions' ? missionsData : nodesData;
        if (updatedData) {
          const newData = { ...updatedData, items };
          if (fileType === 'missions') {
            setMissionsData(newData);
          } else {
            setNodesData(newData);
          }
        }
        
        setSuccessMessage(result.message || `${fileType} salvato con successo`);
        setTimeout(() => setSuccessMessage(null), 3000);
        
        return { success: true, message: result.message };
      } else {
        setError(result.error || 'Errore nel salvataggio');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'Errore di connessione durante il salvataggio';
      setError(errorMsg);
      console.error(`Error saving ${fileType}:`, err);
      return { success: false, error: errorMsg };
    } finally {
      setIsSaving(false);
    }
  }, [missionsData, nodesData]);

  // Aggiorna una traduzione specifica
  const updateTranslation = useCallback((
    itemId: string, 
    language: string, 
    field: 'caption' | 'description', 
    value: string
  ) => {
    const currentData = selectedFileType === 'missions' ? missionsData : nodesData;
    if (!currentData) return;

    const updatedItems = currentData.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          translations: {
            ...item.translations,
            [language]: {
              ...item.translations[language],
              [field]: value
            }
          }
        };
      }
      return item;
    });

    const updatedData = { ...currentData, items: updatedItems };
    
    if (selectedFileType === 'missions') {
      setMissionsData(updatedData);
    } else {
      setNodesData(updatedData);
    }
  }, [selectedFileType, missionsData, nodesData]);

  // Ottiene i dati correnti basati sul tipo selezionato
  const currentData = selectedFileType === 'missions' ? missionsData : nodesData;

  // Filtra gli items in base al termine di ricerca
  const filteredItems = currentData?.items.filter(item => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Cerca nell'ID
    if (item.id.toLowerCase().includes(searchLower)) return true;
    
    // Cerca nelle traduzioni
    return Object.values(item.translations).some(translation => 
      translation.caption?.toLowerCase().includes(searchLower) ||
      translation.description?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Statistiche per lingua
  const languageStats = currentData ? CAMPAIGN_LANGUAGES.reduce((stats, lang) => {
    const translatedCount = currentData.items.filter(item => {
      const translation = item.translations[lang];
      return translation && (translation.caption || translation.description);
    }).length;
    
    stats[lang] = {
      translated: translatedCount,
      missing: currentData.items.length - translatedCount,
      percentage: currentData.items.length > 0 ? 
        Math.round((translatedCount / currentData.items.length) * 100) : 0
    };
    
    return stats;
  }, {} as { [key: string]: { translated: number; missing: number; percentage: number } }) : {};

  // Carica i dati iniziali
  useEffect(() => {
    loadCampaignFile('missions');
    loadCampaignFile('nodes');
  }, [loadCampaignFile]);

  // Cambia tipo di file
  const setFileType = useCallback((fileType: CampaignFileType) => {
    setSelectedFileType(fileType);
    setSearchTerm(''); // Reset search when changing file type
  }, []);

  return {
    // Stato
    missionsData,
    nodesData,
    currentData,
    selectedFileType,
    isLoading,
    isSaving,
    error,
    successMessage,
    searchTerm,
    selectedLanguage,
    filteredItems,
    languageStats,
    
    // Actions
    setFileType,
    setSearchTerm,
    setSelectedLanguage,
    setError,
    setSuccessMessage,
    loadCampaignFile,
    saveCampaignFile,
    updateTranslation,
    
    // Constants
    CAMPAIGN_LANGUAGES
  };
};
// useLocalizationStrings.ts - Hook per gestire le localization_strings
import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '@/config/constants';

// Types per i dati di localizzazione
export interface LocalizationString {
  id: string;
  values: {
    [language: string]: string;
  };
}

export interface LocalizationCategory {
  id: string;
  nome: string;
  numKeys: number;
  listKeys: LocalizationString[];
}

export interface LocalizationData {
  num_categorystring: number;
  category: LocalizationCategory[];
}

export interface LocalizationResponse {
  success: boolean;
  data: LocalizationData;
  error?: string;
  message?: string;
}

export interface CategoryResponse {
  success: boolean;
  data: LocalizationCategory;
  error?: string;
  message?: string;
}

export interface SaveResponse {
  success: boolean;
  message?: string;
  savedFiles?: string[];
  error?: string;
}

export interface AITranslateResponse {
  success: boolean;
  data?: {
    originalText: string;
    translatedText: string;
    fromLanguage: string;
    toLanguage: string;
    context?: string;
  };
  error?: string;
  message?: string;
}

export interface AICategoryTranslateResponse {
  success: boolean;
  data?: {
    category: string;
    fromLanguage: string;
    toLanguage: string;
    translations: Array<{
      key: string;
      originalText: string;
      translatedText: string;
    }>;
  };
  error?: string;
  message?: string;
}

// Lingue supportate
export const SUPPORTED_LANGUAGES = ['EN', 'DE', 'FR', 'ES', 'PL', 'CS', 'RU', 'IT'];

export const useLocalizationStrings = () => {
  const [categories, setCategories] = useState<LocalizationCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<LocalizationCategory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingCategory, setIsLoadingCategory] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('EN');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Carica tutte le categorie
  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/localization/strings`);
      const result: LocalizationResponse = await response.json();

      if (result.success && result.data) {
        setCategories(result.data.category);
      } else {
        setError(result.error || 'Errore nel caricamento delle categorie');
      }
    } catch (err) {
      setError('Errore di connessione al server');
      console.error('Error loading categories:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carica una categoria specifica
  const loadCategory = useCallback(async (categoryId: string) => {
    setIsLoadingCategory(true);
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/localization/strings/${encodeURIComponent(categoryId)}`);
      const result: CategoryResponse = await response.json();

      if (result.success && result.data) {
        setSelectedCategory(result.data);
        // Aggiorna anche la categoria nell'array principale
        setCategories(prev => 
          prev.map(cat => cat.id === categoryId ? result.data : cat)
        );
      } else {
        setError(result.error || `Errore nel caricamento della categoria ${categoryId}`);
      }
    } catch (err) {
      setError('Errore di connessione al server');
      console.error('Error loading category:', err);
    } finally {
      setIsLoadingCategory(false);
    }
  }, []);

  // Salva le modifiche per una categoria
  const saveCategory = useCallback(async (categoryId: string, listKeys: LocalizationString[]) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/localization/strings/${encodeURIComponent(categoryId)}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listKeys }),
      });

      const result: SaveResponse = await response.json();

      if (result.success) {
        // Aggiorna la categoria con i nuovi dati
        if (selectedCategory) {
          const updatedCategory = { ...selectedCategory, listKeys };
          setSelectedCategory(updatedCategory);
          
          // Aggiorna anche nell'array delle categorie
          setCategories(prev => 
            prev.map(cat => cat.id === categoryId ? updatedCategory : cat)
          );
        }
        
        return { success: true, message: result.message, savedFiles: result.savedFiles };
      } else {
        setError(result.error || 'Errore nel salvataggio');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'Errore di connessione durante il salvataggio';
      setError(errorMsg);
      console.error('Error saving category:', err);
      return { success: false, error: errorMsg };
    } finally {
      setIsSaving(false);
    }
  }, [selectedCategory]);

  // Traduce una singola stringa con AI
  const translateString = useCallback(async (
    text: string, 
    fromLanguage: string, 
    toLanguage: string, 
    context?: string
  ) => {
    setIsTranslating(true);
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/localization/ai-translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, fromLanguage, toLanguage, context }),
      });

      const result: AITranslateResponse = await response.json();

      if (result.success && result.data) {
        return { success: true, translatedText: result.data.translatedText };
      } else {
        setError(result.error || 'Errore nella traduzione AI');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'Errore di connessione durante la traduzione';
      setError(errorMsg);
      console.error('Error translating string:', err);
      return { success: false, error: errorMsg };
    } finally {
      setIsTranslating(false);
    }
  }, []);

  // Traduce un'intera categoria con AI
  const translateCategory = useCallback(async (
    categoryId: string,
    fromLanguage: string,
    toLanguage: string
  ) => {
    setIsTranslating(true);
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/localization/ai-translate-category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: categoryId, fromLanguage, toLanguage }),
      });

      const result: AICategoryTranslateResponse = await response.json();

      if (result.success && result.data) {
        return { success: true, translations: result.data.translations };
      } else {
        setError(result.error || 'Errore nella traduzione AI della categoria');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'Errore di connessione durante la traduzione della categoria';
      setError(errorMsg);
      console.error('Error translating category:', err);
      return { success: false, error: errorMsg };
    } finally {
      setIsTranslating(false);
    }
  }, []);

  // Aggiorna una stringa specifica nella categoria selezionata
  const updateString = useCallback((stringId: string, language: string, value: string) => {
    setSelectedCategory(prevCategory => {
      if (!prevCategory) return prevCategory;

      const updatedListKeys = prevCategory.listKeys.map(item => {
        if (item.id === stringId) {
          return {
            ...item,
            values: {
              ...item.values,
              [language]: value
            }
          };
        }
        return item;
      });

      return {
        ...prevCategory,
        listKeys: updatedListKeys
      };
    });
  }, []);

  // Filtra le stringhe in base al termine di ricerca
  const filteredStrings = selectedCategory?.listKeys.filter(item => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Cerca nell'ID
    if (item.id.toLowerCase().includes(searchLower)) return true;
    
    // Cerca nei valori delle traduzioni
    return Object.values(item.values).some(value => 
      value.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Statistiche per la categoria selezionata
  const categoryStats = selectedCategory ? {
    totalKeys: selectedCategory.numKeys,
    translatedKeys: SUPPORTED_LANGUAGES.reduce((acc, lang) => {
      acc[lang] = selectedCategory.listKeys.filter(item => {
        const value = item.values[lang];
        const enValue = item.values['EN'] || '';
        // Tradotta se: esiste, è stringa, non è vuota, ed è diversa da EN
        return value && typeof value === 'string' && value.trim() !== '' && value.trim() !== enValue.trim();
      }).length;
      return acc;
    }, {} as { [key: string]: number })
  } : null;

  // Carica le categorie al mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    // Stato
    categories,
    selectedCategory,
    isLoading,
    isLoadingCategory,
    isSaving,
    isTranslating,
    error,
    searchTerm,
    selectedLanguage,
    filteredStrings,
    categoryStats,
    
    // Actions
    setSearchTerm,
    setSelectedLanguage,
    setError,
    loadCategories,
    loadCategory,
    saveCategory,
    translateString,
    translateCategory,
    updateString,
    setSelectedCategory,
    
    // Constants
    SUPPORTED_LANGUAGES
  };
};
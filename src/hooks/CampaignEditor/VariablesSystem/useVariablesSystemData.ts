import { useState, useEffect, useCallback, useMemo } from 'react';
import { variablesSystemApiService } from '@/services/CampaignEditor/VariablesSystem/variablesSystemApiService';
import { 
  VariablesSystemState, 
  ElementType 
} from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';

export const useVariablesSystemData = () => {
  const [state, setState] = useState<VariablesSystemState>({
    activeTab: 'variables',
    searchTerm: '',
    sortBy: 'name',
    selectedItem: null,
    loading: true,
    error: null,
    data: {
      semafori: [],
      labels: [],
      characters: [],
      variables: [],
      images: [],
      achievements: []
    }
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await variablesSystemApiService.loadAllData();
      setState(prev => ({ ...prev, data, loading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load data' 
      }));
    }
  };

  const setActiveTab = useCallback((tab: ElementType) => {
    setState(prev => ({ ...prev, activeTab: tab, selectedItem: null }));
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const setSortBy = useCallback((sortBy: string) => {
    setState(prev => ({ ...prev, sortBy }));
  }, []);

  const setSelectedItem = useCallback((item: any) => {
    setState(prev => ({ ...prev, selectedItem: item }));
  }, []);

  // Get filtered and sorted items for current tab
  const currentItems = useMemo(() => {
    const items = state.data[state.activeTab] as any[];
    if (!items) return [];

    // Filter by search term
    let filtered = items.filter((item: any) => {
      const searchFields = [
        item.name || item.nomevariabile || item.nomesemaforo || item.nomelabel || 
        item.nomepersonaggio || item.nomefile || '',
        ...(item.script_che_lo_usano || item.listascriptchelausano || item.listascriptchelousano || [])
      ];
      
      return searchFields.some(field => 
        field.toLowerCase().includes(state.searchTerm.toLowerCase())
      );
    });

    // Sort items
    filtered.sort((a: any, b: any) => {
      switch (state.sortBy) {
        case 'name':
          const nameA = a.name || a.nomevariabile || a.nomesemaforo || 
                       a.nomelabel || a.nomepersonaggio || a.nomefile || '';
          const nameB = b.name || b.nomevariabile || b.nomesemaforo || 
                       b.nomelabel || b.nomepersonaggio || b.nomefile || '';
          return nameA.localeCompare(nameB);
        case 'usage':
          const usageA = a.utilizzi_totali || 0;
          const usageB = b.utilizzi_totali || 0;
          return usageB - usageA;
        default:
          return 0;
      }
    });

    return filtered;
  }, [state.data, state.activeTab, state.searchTerm, state.sortBy]);

  // Get counts for each tab
  const tabCounts = useMemo(() => ({
    semafori: state.data.semafori.length,
    labels: state.data.labels.length,
    characters: state.data.characters.length,
    variables: state.data.variables.length,
    images: state.data.images.length,
    achievements: state.data.achievements.length
  }), [state.data]);

  return {
    ...state,
    currentItems,
    tabCounts,
    setActiveTab,
    setSearchTerm,
    setSortBy,
    setSelectedItem,
    refreshData: loadAllData
  };
};
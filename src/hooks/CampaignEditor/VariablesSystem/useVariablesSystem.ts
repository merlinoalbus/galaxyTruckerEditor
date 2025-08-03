import { useMemo, useState } from 'react';
import { CampaignAnalysis } from '@/types/CampaignEditor';

export const useVariablesSystem = (analysis: CampaignAnalysis | null) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'semafori' | 'variables'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'type'>('name');

  const variableData = useMemo(() => {
    if (!analysis) return { semafori: [], realVariables: [], allVariables: [] };

    const semafori = Array.from(analysis.semafori || []).map(name => ({
      name,
      type: 'semaforo' as const,
      usage: getVariableUsage(name, analysis)
    }));

    const realVariables = Array.from(analysis.realVariables || []).map(name => ({
      name,
      type: 'variable' as const,
      usage: getVariableUsage(name, analysis)
    }));

    const allVariables = [...semafori, ...realVariables];

    return { semafori, realVariables, allVariables };
  }, [analysis]);

  const filteredVariables = useMemo(() => {
    let variables = variableData.allVariables;

    // Filter by category
    if (selectedCategory === 'semafori') {
      variables = variableData.semafori;
    } else if (selectedCategory === 'variables') {
      variables = variableData.realVariables;
    }

    // Filter by search term
    if (searchTerm) {
      variables = variables.filter(v => 
        v.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    variables = [...variables].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return b.usage.length - a.usage.length;
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return variables;
  }, [variableData, selectedCategory, searchTerm, sortBy]);

  const getVariableUsage = (variableName: string, analysis: CampaignAnalysis) => {
    const usage: string[] = [];
    
    analysis.scripts?.forEach(script => {
      script.commands?.forEach(cmd => {
        const cmdStr = JSON.stringify(cmd);
        if (cmdStr.includes(variableName)) {
          usage.push(script.name);
        }
      });
    });

    return [...new Set(usage)];
  };

  const statistics = useMemo(() => ({
    totalVariables: variableData.allVariables.length,
    semaforiCount: variableData.semafori.length,
    realVariablesCount: variableData.realVariables.length,
    mostUsedVariable: variableData.allVariables.reduce((prev, current) => 
      current.usage.length > prev.usage.length ? current : prev, 
      variableData.allVariables[0] || { name: '', usage: [] }
    )
  }), [variableData]);

  return {
    variableData,
    filteredVariables,
    statistics,
    selectedCategory,
    setSelectedCategory,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    isLoading: !analysis,
    hasData: !!analysis && variableData.allVariables.length > 0
  };
};
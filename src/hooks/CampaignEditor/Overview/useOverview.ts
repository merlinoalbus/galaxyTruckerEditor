import { useMemo } from 'react';
import { CampaignAnalysis } from '@/types/CampaignEditor';

export const useOverview = (analysis: CampaignAnalysis | null) => {
  const statistics = useMemo(() => {
    if (!analysis) return null;

    return {
      totalScripts: analysis.scripts?.length || 0,
      totalVariables: analysis.variables?.size || 0,
      totalCharacters: analysis.characters?.size || 0,
      totalMissions: analysis.missions?.size || 0,
      scriptsPerLanguage: getScriptsPerLanguage(analysis),
      complexityMetrics: getComplexityMetrics(analysis)
    };
  }, [analysis]);

  const getScriptsPerLanguage = (analysis: CampaignAnalysis) => {
    const languages = new Map<string, number>();
    analysis.scripts?.forEach(script => {
      const count = languages.get(script.language) || 0;
      languages.set(script.language, count + 1);
    });
    return Array.from(languages.entries()).map(([language, count]) => ({
      language,
      count
    }));
  };

  const getComplexityMetrics = (analysis: CampaignAnalysis) => {
    if (!analysis.scripts) return { average: 0, max: 0, total: 0 };
    
    const commandCounts = analysis.scripts.map(script => script.commands?.length || 0);
    const total = commandCounts.reduce((sum, count) => sum + count, 0);
    const max = Math.max(...commandCounts, 0);
    const average = commandCounts.length > 0 ? Math.round(total / commandCounts.length) : 0;

    return { average, max, total };
  };

  return {
    statistics,
    isLoading: !analysis,
    hasData: !!analysis && analysis.scripts && analysis.scripts.length > 0
  };
};
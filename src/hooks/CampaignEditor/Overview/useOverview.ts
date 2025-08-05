import { useMemo } from 'react';
import type { CampaignAnalysis } from '@/types/CampaignEditor';

const getScriptsPerLanguage = (analysis: CampaignAnalysis) => {
  const languages = new Map<string, number>();
  analysis.scripts?.forEach(script => {
    const lang = script.language || 'Unknown';
    const count = languages.get(lang) || 0;
    languages.set(lang, count + 1);
  });
  return Array.from(languages.entries())
    .map(([language, count]) => ({
      language,
      count,
      percentage: Math.round((count / (analysis.scripts?.length || 1)) * 100)
    }))
    .sort((a, b) => b.count - a.count);
};

const getComplexityMetrics = (analysis: CampaignAnalysis) => {
  if (!analysis.scripts) return { average: 0, max: 0, total: 0, mostComplex: null };
  
  const scriptComplexity = analysis.scripts.map(script => ({
    name: script.name,
    commands: script.commands?.length || 0
  }));
  
  const commandCounts = scriptComplexity.map(s => s.commands);
  const total = commandCounts.reduce((sum, count) => sum + count, 0);
  const max = Math.max(...commandCounts, 0);
  const average = commandCounts.length > 0 ? Math.round(total / commandCounts.length) : 0;
  const mostComplex = scriptComplexity.find(s => s.commands === max);

  return { average, max, total, mostComplex: mostComplex?.name || null };
};

const getContentMetrics = (analysis: CampaignAnalysis) => {
  const totalScripts = analysis.scripts?.length || 0;
  const totalMissions = analysis.missions?.size || 0;
  const totalCharacters = analysis.characters?.size || 0;
  const totalVariables = analysis.realVariables?.size || 0;
  const totalSemaphores = analysis.semafori?.size || 0;
  const totalLabels = analysis.labels?.size || 0;
  
  // Script stellati (starred scripts)
  const starredScripts = analysis.scripts?.filter(script => 
    script.name.includes('star') || script.name.includes('Star')
  ).length || 0;
  
  return {
    totalScripts,
    totalMissions,
    totalCharacters,
    totalVariables,
    totalSemaphores,
    totalLabels,
    starredScripts,
    scriptConnections: analysis.scriptConnections?.size || 0
  };
};

export const useOverview = (analysis: CampaignAnalysis | null) => {
  const statistics = useMemo(() => {
    if (!analysis) return null;

    return {
      ...getContentMetrics(analysis),
      scriptsPerLanguage: getScriptsPerLanguage(analysis),
      complexityMetrics: getComplexityMetrics(analysis)
    };
  }, [analysis]);

  return {
    statistics,
    isLoading: !analysis,
    hasData: !!analysis && analysis.scripts && analysis.scripts.length > 0
  };
};
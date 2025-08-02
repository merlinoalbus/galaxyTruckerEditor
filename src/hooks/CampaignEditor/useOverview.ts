import { CampaignAnalysis } from '../../types/CampaignEditor';

export const useOverview = (analysis: CampaignAnalysis | null) => {
  const getOverviewStats = () => {
    if (!analysis) return null;

    return {
      scriptsCount: analysis.scripts?.length || 0,
      variablesCount: analysis.variables?.size || 0,
      charactersCount: analysis.characters?.size || 0,
      missionsCount: analysis.missions?.size || 0
    };
  };

  const generateReport = () => {
    // TODO: Generate detailed overview report
    console.log('Generating overview report...');
  };

  return {
    getOverviewStats,
    generateReport
  };
};
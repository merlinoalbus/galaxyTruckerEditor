import { CampaignAnalysis } from '@/types/CampaignEditor';

export const overviewService = {
  formatStatistics(analysis: CampaignAnalysis | null) {
    if (!analysis) return null;

    return {
      scripts: {
        total: analysis.scripts?.length || 0,
        byLanguage: this.groupScriptsByLanguage(analysis.scripts || [])
      },
      variables: {
        total: analysis.variables?.size || 0,
        semafori: analysis.semafori?.size || 0,
        realVariables: analysis.realVariables?.size || 0
      },
      entities: {
        characters: analysis.characters?.size || 0,
        missions: analysis.missions?.size || 0,
        labels: analysis.labels?.size || 0
      },
      connections: {
        totalConnections: this.countTotalConnections(analysis.scriptConnections || new Map()),
        averageConnectionsPerScript: this.calculateAverageConnections(analysis.scriptConnections || new Map())
      }
    };
  },

  groupScriptsByLanguage(scripts: any[]) {
    const groups = new Map<string, number>();
    scripts.forEach(script => {
      const count = groups.get(script.language) || 0;
      groups.set(script.language, count + 1);
    });
    return Array.from(groups.entries()).map(([language, count]) => ({
      language,
      count,
      percentage: Math.round((count / scripts.length) * 100)
    }));
  },

  countTotalConnections(scriptConnections: Map<string, string[]>) {
    return Array.from(scriptConnections.values()).reduce((total, connections) => 
      total + connections.length, 0);
  },

  calculateAverageConnections(scriptConnections: Map<string, string[]>) {
    const scripts = scriptConnections.size;
    if (scripts === 0) return 0;
    
    const totalConnections = this.countTotalConnections(scriptConnections);
    return Math.round((totalConnections / scripts) * 10) / 10;
  },

  exportStatistics(analysis: CampaignAnalysis | null): string {
    const stats = this.formatStatistics(analysis);
    if (!stats) return 'No data available';

    return JSON.stringify(stats, null, 2);
  }
};
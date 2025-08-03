import React from 'react';
import { BarChart3, Users, MapPin, Settings } from 'lucide-react';

import { CampaignAnalysis } from '@/types/CampaignEditor';
import { useOverview } from '@/hooks/CampaignEditor/Overview/useOverview';
import { overviewService } from '@/services/CampaignEditor/Overview/overviewService';
import { overviewStyles } from '@/styles/CampaignEditor/Overview/Overview.styles';

interface OverviewProps {
  analysis?: CampaignAnalysis | null;
}

export const Overview: React.FC<OverviewProps> = ({ analysis }) => {
  const { statistics, isLoading, hasData } = useOverview(analysis || null);
  const formattedStats = overviewService.formatStatistics(analysis || null);

  if (isLoading) {
    return (
      <div className={overviewStyles.loadingState}>
        Loading overview data...
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={overviewStyles.emptyState.container}>
        <BarChart3 className={`w-16 h-16 ${overviewStyles.emptyState.icon}`} />
        <h3 className={overviewStyles.emptyState.title}>No Campaign Data</h3>
        <p className={overviewStyles.emptyState.subtitle}>
          Load campaign scripts to see overview statistics
        </p>
      </div>
    );
  }

  return (
    <div className={overviewStyles.container}>
      <div className={overviewStyles.header.title}>Campaign Overview</div>
      <p className={overviewStyles.header.subtitle}>
        Comprehensive analysis of your campaign structure and content
      </p>

      {/* Main Statistics */}
      <div className={overviewStyles.statsGrid}>
        <div className={overviewStyles.statCard.base}>
          <div className={overviewStyles.statCard.title}>Scripts</div>
          <div className={overviewStyles.statCard.value}>{statistics?.totalScripts || 0}</div>
          <div className={overviewStyles.statCard.subtitle}>
            {statistics?.complexityMetrics.total || 0} total commands
          </div>
        </div>

        <div className={overviewStyles.statCard.base}>
          <div className={overviewStyles.statCard.title}>Variables</div>
          <div className={overviewStyles.statCard.value}>{statistics?.totalVariables || 0}</div>
          <div className={overviewStyles.statCard.subtitle}>
            {formattedStats?.variables.semafori || 0} semafori, {formattedStats?.variables.realVariables || 0} numeric
          </div>
        </div>

        <div className={overviewStyles.statCard.base}>
          <div className={overviewStyles.statCard.title}>Characters</div>
          <div className={overviewStyles.statCard.value}>{statistics?.totalCharacters || 0}</div>
          <div className={overviewStyles.statCard.subtitle}>
            {statistics?.totalMissions || 0} missions referenced
          </div>
        </div>
      </div>

      {/* Language Distribution */}
      {formattedStats?.scripts.byLanguage && formattedStats.scripts.byLanguage.length > 0 && (
        <div className={overviewStyles.section.container}>
          <div className={overviewStyles.section.title}>
            <Users className="w-5 h-5 inline mr-2" />
            Language Distribution
          </div>
          <div className={overviewStyles.section.content}>
            <div className={overviewStyles.list.container}>
              {formattedStats.scripts.byLanguage.map(({ language, count, percentage }) => (
                <div key={language} className={overviewStyles.list.item}>
                  <span className={overviewStyles.list.label}>{language}</span>
                  <div className="flex items-center space-x-3">
                    <span className={overviewStyles.list.value}>{count} scripts</span>
                    <div className={overviewStyles.progress.container} style={{ width: '60px' }}>
                      <div 
                        className={overviewStyles.progress.bar}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8">{percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Complexity Metrics */}
      {statistics?.complexityMetrics && (
        <div className={overviewStyles.section.container}>
          <div className={overviewStyles.section.title}>
            <Settings className="w-5 h-5 inline mr-2" />
            Complexity Analysis
          </div>
          <div className={overviewStyles.section.content}>
            <div className={overviewStyles.list.container}>
              <div className={overviewStyles.list.item}>
                <span className={overviewStyles.list.label}>Average Commands per Script</span>
                <span className={overviewStyles.list.value}>{statistics.complexityMetrics.average}</span>
              </div>
              <div className={overviewStyles.list.item}>
                <span className={overviewStyles.list.label}>Most Complex Script</span>
                <span className={overviewStyles.list.value}>{statistics.complexityMetrics.max} commands</span>
              </div>
              <div className={overviewStyles.list.item}>
                <span className={overviewStyles.list.label}>Script Connections</span>
                <span className={overviewStyles.list.value}>
                  {formattedStats?.connections.averageConnectionsPerScript || 0} avg per script
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entity Summary */}
      {formattedStats?.entities && (
        <div className={overviewStyles.section.container}>
          <div className={overviewStyles.section.title}>
            <MapPin className="w-5 h-5 inline mr-2" />
            Campaign Entities
          </div>
          <div className={overviewStyles.section.content}>
            <div className={overviewStyles.list.container}>
              <div className={overviewStyles.list.item}>
                <span className={overviewStyles.list.label}>Characters</span>
                <span className={overviewStyles.list.value}>{formattedStats.entities.characters}</span>
              </div>
              <div className={overviewStyles.list.item}>
                <span className={overviewStyles.list.label}>Missions</span>
                <span className={overviewStyles.list.value}>{formattedStats.entities.missions}</span>
              </div>
              <div className={overviewStyles.list.item}>
                <span className={overviewStyles.list.label}>Labels</span>
                <span className={overviewStyles.list.value}>{formattedStats.entities.labels}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
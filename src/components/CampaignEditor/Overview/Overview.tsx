import React from 'react';
import { 
  FileText, 
  Users, 
  Settings, 
  Tag, 
  Target,
  Code,
  Activity,
  Zap,
  Star
} from 'lucide-react';

import { useOverview } from '@/hooks/CampaignEditor/Overview/useOverview';
import { overviewStyles } from '@/styles/CampaignEditor/Overview/Overview.styles';
import { useTranslation } from '@/locales/translations';
import { MetricCard } from './components/MetricCard/MetricCard';
import { LanguageDistribution } from './components/LanguageDistribution/LanguageDistribution';
import { ComplexityAnalysis } from './components/ComplexityAnalysis/ComplexityAnalysis';
import type { CampaignAnalysis } from '@/types/CampaignEditor';

interface OverviewProps {
  analysis?: CampaignAnalysis | null;
}

export const Overview: React.FC<OverviewProps> = ({ analysis }) => {
  const { t } = useTranslation();
  const { statistics, isLoading, hasData } = useOverview(analysis || null);

  if (isLoading) {
    return (
      <div className={overviewStyles.loadingState}>
        <Activity className={overviewStyles.loadingSpinner} />
        <div className={overviewStyles.loadingText}>{t('overview.loading')}</div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={overviewStyles.emptyState.container}>
        <FileText className={overviewStyles.emptyState.icon} />
        <h3 className={overviewStyles.emptyState.title}>{t('overview.noCampaignData')}</h3>
        <p className={overviewStyles.emptyState.subtitle}>
          {t('overview.loadCampaignMessage')}
        </p>
      </div>
    );
  }

  return (
    <div className={overviewStyles.container}>
      {/* Hero Section */}
      <div className={overviewStyles.hero.container}>
        <div className={overviewStyles.hero.decoration}></div>
        <h1 className={overviewStyles.hero.title}>{t('overview.title')}</h1>
        <p className={overviewStyles.hero.subtitle}>
          {t('overview.description')}
        </p>
      </div>

      {/* Main Metrics */}
      <div className={overviewStyles.metricsGrid}>
        <MetricCard 
          icon={FileText}
          value={statistics?.totalScripts || 0}
          label={t('overview.scripts')}
        />
        <MetricCard 
          icon={Settings}
          value={statistics?.totalVariables || 0}
          label={t('overview.variables')}
        />
        <MetricCard 
          icon={Users}
          value={statistics?.totalCharacters || 0}
          label={t('overview.characters')}
        />
        <MetricCard 
          icon={Target}
          value={statistics?.totalMissions || 0}
          label={t('overview.missions')}
        />
      </div>

      {/* Additional Metrics Row */}
      <div className={overviewStyles.metricsGrid}>
        <MetricCard 
          icon={Zap}
          value={statistics?.totalSemaphores || 0}
          label={t('overview.semaphores')}
        />
        <MetricCard 
          icon={Tag}
          value={statistics?.totalLabels || 0}
          label={t('overview.labels')}
        />
        <MetricCard 
          icon={Star}
          value={statistics?.starredScripts || 0}
          label="Script Stellati"
        />
        <MetricCard 
          icon={Code}
          value={statistics?.complexityMetrics.total || 0}
          label={t('overview.totalCommands')}
        />
      </div>

      {/* Language Distribution */}
      <LanguageDistribution 
        scriptsPerLanguage={statistics?.scriptsPerLanguage || []}
      />

      {/* Complexity Analysis */}
      {statistics?.complexityMetrics && (
        <ComplexityAnalysis 
          complexityMetrics={statistics.complexityMetrics}
          scriptConnections={statistics.scriptConnections}
        />
      )}
    </div>
  );
};
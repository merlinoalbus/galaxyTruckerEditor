import React from 'react';
import { 
  FileText, 
  Users, 
  Settings, 
  Tag, 
  Target,
  Code,
  Globe,
  Activity,
  TrendingUp,
  Zap,
  Star
} from 'lucide-react';

import { useOverview } from '@/hooks/CampaignEditor/Overview/useOverview';
import { overviewStyles } from '@/styles/CampaignEditor/Overview/Overview.styles';
import { useTranslation } from '@/locales/translations';
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
        <div className={overviewStyles.metricCard.container}>
          <div className={overviewStyles.metricCard.accent}></div>
          <div className={overviewStyles.metricCard.iconContainer}>
            <FileText className={overviewStyles.metricCard.icon} />
          </div>
          <div className={overviewStyles.metricCard.value}>
            {statistics?.totalScripts || 0}
          </div>
          <div className={overviewStyles.metricCard.label}>
            {t('overview.scripts')}
          </div>
        </div>

        <div className={overviewStyles.metricCard.container}>
          <div className={overviewStyles.metricCard.accent}></div>
          <div className={overviewStyles.metricCard.iconContainer}>
            <Settings className={overviewStyles.metricCard.icon} />
          </div>
          <div className={overviewStyles.metricCard.value}>
            {statistics?.totalVariables || 0}
          </div>
          <div className={overviewStyles.metricCard.label}>
            {t('overview.variables')}
          </div>
        </div>

        <div className={overviewStyles.metricCard.container}>
          <div className={overviewStyles.metricCard.accent}></div>
          <div className={overviewStyles.metricCard.iconContainer}>
            <Users className={overviewStyles.metricCard.icon} />
          </div>
          <div className={overviewStyles.metricCard.value}>
            {statistics?.totalCharacters || 0}
          </div>
          <div className={overviewStyles.metricCard.label}>
            {t('overview.characters')}
          </div>
        </div>

        <div className={overviewStyles.metricCard.container}>
          <div className={overviewStyles.metricCard.accent}></div>
          <div className={overviewStyles.metricCard.iconContainer}>
            <Target className={overviewStyles.metricCard.icon} />
          </div>
          <div className={overviewStyles.metricCard.value}>
            {statistics?.totalMissions || 0}
          </div>
          <div className={overviewStyles.metricCard.label}>
            {t('overview.missions')}
          </div>
        </div>
      </div>

      {/* Additional Metrics Row */}
      <div className={overviewStyles.metricsGrid}>
        <div className={overviewStyles.metricCard.container}>
          <div className={overviewStyles.metricCard.accent}></div>
          <div className={overviewStyles.metricCard.iconContainer}>
            <Zap className={overviewStyles.metricCard.icon} />
          </div>
          <div className={overviewStyles.metricCard.value}>
            {statistics?.totalSemaphores || 0}
          </div>
          <div className={overviewStyles.metricCard.label}>
            {t('overview.semaphores')}
          </div>
        </div>

        <div className={overviewStyles.metricCard.container}>
          <div className={overviewStyles.metricCard.accent}></div>
          <div className={overviewStyles.metricCard.iconContainer}>
            <Tag className={overviewStyles.metricCard.icon} />
          </div>
          <div className={overviewStyles.metricCard.value}>
            {statistics?.totalLabels || 0}
          </div>
          <div className={overviewStyles.metricCard.label}>
            {t('overview.labels')}
          </div>
        </div>

        <div className={overviewStyles.metricCard.container}>
          <div className={overviewStyles.metricCard.accent}></div>
          <div className={overviewStyles.metricCard.iconContainer}>
            <Star className={overviewStyles.metricCard.icon} />
          </div>
          <div className={overviewStyles.metricCard.value}>
            {statistics?.starredScripts || 0}
          </div>
          <div className={overviewStyles.metricCard.label}>
            Script Stellati
          </div>
        </div>

        <div className={overviewStyles.metricCard.container}>
          <div className={overviewStyles.metricCard.accent}></div>
          <div className={overviewStyles.metricCard.iconContainer}>
            <Code className={overviewStyles.metricCard.icon} />
          </div>
          <div className={overviewStyles.metricCard.value}>
            {statistics?.complexityMetrics.total || 0}
          </div>
          <div className={overviewStyles.metricCard.label}>
            {t('overview.totalCommands')}
          </div>
        </div>
      </div>

      {/* Language Distribution */}
      {statistics?.scriptsPerLanguage && statistics.scriptsPerLanguage.length > 0 && (
        <div className={overviewStyles.section.container}>
          <div className={overviewStyles.section.header}>
            <Globe className={overviewStyles.section.icon} />
            <h2 className={overviewStyles.section.title}>
              {t('overview.languageDistribution')}
            </h2>
          </div>
          <div className={overviewStyles.section.content}>
            <div className={overviewStyles.languageGrid}>
              {statistics.scriptsPerLanguage.slice(0, 6).map(({ language, count, percentage }) => (
                <div key={language} className={overviewStyles.languageItem.container}>
                  <div className={overviewStyles.languageItem.left}>
                    <div className={overviewStyles.languageItem.flag}>
                      {language.slice(0, 2).toUpperCase()}
                    </div>
                    <span className={overviewStyles.languageItem.language}>
                      {language}
                    </span>
                  </div>
                  <div className={overviewStyles.languageItem.right}>
                    <span className={overviewStyles.languageItem.count}>
                      {count} scripts
                    </span>
                    <span className={overviewStyles.languageItem.percentage}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Complexity Analysis */}
      {statistics?.complexityMetrics && (
        <div className={overviewStyles.section.container}>
          <div className={overviewStyles.section.header}>
            <TrendingUp className={overviewStyles.section.icon} />
            <h2 className={overviewStyles.section.title}>
              {t('overview.complexityAnalysis')}
            </h2>
          </div>
          <div className={overviewStyles.section.content}>
            <div className={overviewStyles.complexityList.container}>
              <div className={overviewStyles.complexityList.item}>
                <span className={overviewStyles.complexityList.label}>
                  {t('overview.averageCommandsPerScript')}
                </span>
                <span className={overviewStyles.complexityList.value}>
                  {statistics.complexityMetrics.average}
                </span>
              </div>
              <div className={overviewStyles.complexityList.item}>
                <span className={overviewStyles.complexityList.label}>
                  {t('overview.mostComplexScript')}
                </span>
                <span className={overviewStyles.complexityList.highlight}>
                  {statistics.complexityMetrics.mostComplex || 'N/A'}
                </span>
              </div>
              <div className={overviewStyles.complexityList.item}>
                <span className={overviewStyles.complexityList.label}>
                  Massimo {t('overview.commands')} per Script
                </span>
                <span className={overviewStyles.complexityList.value}>
                  {statistics.complexityMetrics.max}
                </span>
              </div>
              <div className={overviewStyles.complexityList.item}>
                <span className={overviewStyles.complexityList.label}>
                  {t('overview.scriptConnections')}
                </span>
                <span className={overviewStyles.complexityList.value}>
                  {statistics.scriptConnections || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
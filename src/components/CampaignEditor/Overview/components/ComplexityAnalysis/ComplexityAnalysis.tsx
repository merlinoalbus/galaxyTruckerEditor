import React from 'react';
import { TrendingUp } from 'lucide-react';
import { overviewStyles } from '@/styles/CampaignEditor/Overview/Overview.styles';
import { useTranslation } from '@/locales';

interface ComplexityAnalysisProps {
  complexityMetrics: {
    total: number;
    average: number;
    max: number;
    mostComplex?: string | null;
  };
  scriptConnections?: number;
}

export const ComplexityAnalysis: React.FC<ComplexityAnalysisProps> = ({ 
  complexityMetrics,
  scriptConnections 
}) => {
  const { t } = useTranslation();
  
  if (!complexityMetrics) {
    return null;
  }

  return (
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
              {complexityMetrics.average}
            </span>
          </div>
          <div className={overviewStyles.complexityList.item}>
            <span className={overviewStyles.complexityList.label}>
              {t('overview.mostComplexScript')}
            </span>
            <span className={overviewStyles.complexityList.highlight}>
              {complexityMetrics.mostComplex || 'N/A'}
            </span>
          </div>
          <div className={overviewStyles.complexityList.item}>
            <span className={overviewStyles.complexityList.label}>
              Massimo {t('overview.commands')} per Script
            </span>
            <span className={overviewStyles.complexityList.value}>
              {complexityMetrics.max}
            </span>
          </div>
          <div className={overviewStyles.complexityList.item}>
            <span className={overviewStyles.complexityList.label}>
              {t('overview.scriptConnections')}
            </span>
            <span className={overviewStyles.complexityList.value}>
              {scriptConnections || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
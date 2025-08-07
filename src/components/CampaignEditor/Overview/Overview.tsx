// Overview Component - Analisi avanzata campagna

import React from 'react';
import { 
  FileText, 
  Activity,
  Download,
  AlertTriangle
} from 'lucide-react';

import { useOverview } from '@/hooks/CampaignEditor/Overview/useOverview';
import { overviewStyles } from '@/styles/CampaignEditor/Overview/Overview.styles';
import { useTranslation } from '@/locales/translations';

// Import componenti
import { LanguageCoverageCard } from './components/LanguageCoverageCard/LanguageCoverageCard';
import { ComplexityAnalysisCard } from './components/ComplexityAnalysisCard/ComplexityAnalysisCard';
import { QualityIssuesCard } from './components/QualityIssuesCard/QualityIssuesCard';
import { MaintenanceMetricsCard } from './components/MaintenanceMetricsCard/MaintenanceMetricsCard';
import { RefactoringRecommendationsCard } from './components/RefactoringRecommendationsCard/RefactoringRecommendationsCard';

import type { CampaignAnalysis } from '@/types/CampaignEditor';

interface OverviewProps {
  analysis?: CampaignAnalysis | null;
}

export const Overview: React.FC<OverviewProps> = ({ analysis }) => {
  const { t } = useTranslation();
  const { 
    statistics, 
    isLoading, 
    hasData,
    exportData
  } = useOverview(analysis || null);

  if (isLoading) {
    return (
      <div className={overviewStyles.loadingState}>
        <Activity className={overviewStyles.loadingSpinner} />
        <div className={overviewStyles.loadingText}>{t('overview.loading')}</div>
      </div>
    );
  }

  if (!hasData || !statistics) {
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
      {/* Header con export */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analisi Avanzata Campagna</h1>
          <p className="text-gray-400 text-sm mt-1">
            Metriche dettagliate e suggerimenti per migliorare la qualità del codice
          </p>
        </div>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Esporta Report
        </button>
      </div>

      {/* Warnings */}
      {statistics.warnings.length > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-red-400">Avvisi Importanti</h3>
          </div>
          <div className="space-y-1">
            {statistics.warnings.map((warning, idx) => (
              <div key={idx} className="text-sm text-red-300">• {warning}</div>
            ))}
          </div>
        </div>
      )}

      {/* Griglia principale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Copertura linguistica */}
        <LanguageCoverageCard
          coverage={statistics.languageCoverage}
          overallCoverage={statistics.overallCoverage}
          criticalGaps={statistics.criticalGaps}
        />

        {/* Analisi complessità */}
        <ComplexityAnalysisCard
          topScripts={statistics.topComplexScripts}
          orphanScripts={statistics.orphanScripts}
          circularDependencies={statistics.circularDependencies}
          hotspots={statistics.hotspots}
        />

        {/* Qualità codice */}
        <QualityIssuesCard
          issues={statistics.qualityIssues}
          qualityScore={statistics.qualityScore}
          issuesBySeverity={statistics.issuesBySeverity}
        />

        {/* Metriche manutenibilità */}
        <MaintenanceMetricsCard
          metrics={statistics.maintenanceMetrics}
        />
      </div>

      {/* Suggerimenti refactoring (full width) */}
      <div className="mt-6">
        <RefactoringRecommendationsCard
          recommendations={statistics.refactoringRecommendations}
        />
      </div>

      {/* Ottimizzazioni suggerite */}
      {statistics.optimizations.length > 0 && (
        <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h3 className="font-semibold text-blue-400 mb-2">Ottimizzazioni Suggerite</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {statistics.optimizations.map((opt, idx) => (
              <div key={idx} className="text-sm text-blue-300">• {opt}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
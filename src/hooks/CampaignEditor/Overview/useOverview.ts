import { logger } from '@/utils/logger';
// Overview Hook - Business logic principale

import { useMemo, useState, useCallback } from 'react';
import type { CampaignAnalysis } from '@/types/CampaignEditor';
import type { OverviewStatistics } from '@/types/CampaignEditor/Overview/Overview.types';
import { overviewService } from '@/services/CampaignEditor/Overview/overviewService';

export const useOverview = (analysis: CampaignAnalysis | null) => {
  const [activeTab, setActiveTab] = useState<string>('coverage');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  
  const statistics = useMemo<OverviewStatistics | null>(() => {
    if (!analysis) return null;
    
    try {
      return overviewService.generateStatistics(analysis);
    } catch (error) {
  logger.error('Error generating overview statistics:', error);
      return null;
    }
  }, [analysis]);
  
  const isLoading = !analysis;
  const hasData = !!statistics;
  
  const exportData = useCallback(() => {
    if (!statistics) return;
    
    const blob = new Blob(
      [JSON.stringify(statistics, null, 2)],
      { type: 'application/json' }
    );
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaign-overview.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [statistics]);
  
  const getMetricValue = useCallback((metric: string) => {
    if (!statistics) return null;
    
    switch (metric) {
      case 'coverage':
        return statistics.overallCoverage;
      case 'quality':
        return statistics.qualityScore;
      case 'modularity':
        return statistics.maintenanceMetrics.modularityIndex;
      case 'coupling':
        return statistics.maintenanceMetrics.couplingScore;
      case 'cohesion':
        return statistics.maintenanceMetrics.cohesionScore;
      case 'debt':
        return statistics.maintenanceMetrics.technicalDebtScore;
      default:
        return null;
    }
  }, [statistics]);
  
  const getMetricColor = useCallback((value: number, type: string) => {
    if (type === 'debt') {
      // Per il debito tecnico, valori bassi sono buoni
      if (value < 30) return 'text-green-600';
      if (value < 60) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    // Per altre metriche, valori alti sono buoni
    if (value > 70) return 'text-green-600';
    if (value > 40) return 'text-yellow-600';
    return 'text-red-600';
  }, []);
  
  return {
    statistics,
    isLoading,
    hasData,
    activeTab,
    setActiveTab,
    selectedMetric,
    setSelectedMetric,
    exportData,
    getMetricValue,
    getMetricColor
  };
};
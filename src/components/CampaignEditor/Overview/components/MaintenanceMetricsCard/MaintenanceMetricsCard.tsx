// Maintenance Metrics Card Component

import React from 'react';
import { Wrench, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/locales';
import type { MaintenanceMetrics } from '@/types/CampaignEditor/Overview/Overview.types';

interface MaintenanceMetricsCardProps {
  metrics: MaintenanceMetrics;
}

export const MaintenanceMetricsCard: React.FC<MaintenanceMetricsCardProps> = ({ metrics }) => {
  const { t } = useTranslation();
  const getMetricColor = (value: number, inverted = false) => {
    if (inverted) {
      if (value < 30) return 'text-green-400';
      if (value < 60) return 'text-yellow-400';
      return 'text-red-400';
    }
    if (value >= 70) return 'text-green-400';
    if (value >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const getMetricBar = (value: number, inverted = false) => {
    const color = inverted
      ? value < 30 ? 'bg-green-500' : value < 60 ? 'bg-yellow-500' : 'bg-red-500'
      : value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    );
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold">{t('overview.maintenanceMetrics')}</h3>
      </div>
      
      {/* Metriche principali */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">{t('overview.modularity')}</span>
            <span className={`text-sm font-semibold ${getMetricColor(metrics.modularityIndex)}`}>
              {metrics.modularityIndex}%
            </span>
          </div>
          {getMetricBar(metrics.modularityIndex)}
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">{t('overview.coupling')}</span>
            <span className={`text-sm font-semibold ${getMetricColor(metrics.couplingScore)}`}>
              {metrics.couplingScore}%
            </span>
          </div>
          {getMetricBar(metrics.couplingScore)}
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">{t('overview.cohesion')}</span>
            <span className={`text-sm font-semibold ${getMetricColor(metrics.cohesionScore)}`}>
              {metrics.cohesionScore}%
            </span>
          </div>
          {getMetricBar(metrics.cohesionScore)}
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">{t('overview.technicalDebt')}</span>
            <span className={`text-sm font-semibold ${getMetricColor(metrics.technicalDebtScore, true)}`}>
              {metrics.technicalDebtScore}%
            </span>
          </div>
          {getMetricBar(metrics.technicalDebtScore, true)}
        </div>
      </div>
      
      {/* Statistiche dimensioni */}
      <div className="bg-gray-700/30 rounded p-3">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          {t('overview.scriptSizeDistribution')}
        </h4>
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="text-center">
            <div className="text-gray-500">{t('overview.size.tiny')}</div>
            <div className="font-semibold">{metrics.scriptSizeDistribution.tiny}</div>
            <div className="text-gray-600">&lt;50</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">{t('overview.size.small')}</div>
            <div className="font-semibold">{metrics.scriptSizeDistribution.small}</div>
            <div className="text-gray-600">50-100</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">{t('overview.size.medium')}</div>
            <div className="font-semibold">{metrics.scriptSizeDistribution.medium}</div>
            <div className="text-gray-600">100-200</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">{t('overview.size.large')}</div>
            <div className="font-semibold">{metrics.scriptSizeDistribution.large}</div>
            <div className="text-gray-600">200-500</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">{t('overview.size.huge')}</div>
            <div className="font-semibold text-red-400">{metrics.scriptSizeDistribution.huge}</div>
            <div className="text-gray-600">&gt;500</div>
          </div>
        </div>
      </div>
      
      {/* Script estremi */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="bg-gray-700/30 rounded p-2">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <TrendingUp className="w-3 h-3" />
            <span>{t('overview.largest')}</span>
          </div>
          <div className="text-xs font-mono">{metrics.largestScript.name}</div>
          <div className="text-xs text-gray-400">{metrics.largestScript.size} {t('overview.lines')}</div>
        </div>
        <div className="bg-gray-700/30 rounded p-2">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <TrendingDown className="w-3 h-3" />
            <span>{t('overview.smallest')}</span>
          </div>
          <div className="text-xs font-mono">{metrics.smallestScript.name}</div>
          <div className="text-xs text-gray-400">{metrics.smallestScript.size} {t('overview.lines')}</div>
        </div>
      </div>
    </div>
  );
};
// Complexity Analysis Card Component

import React from 'react';
import { Activity, AlertCircle, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/locales';
import type { ScriptComplexity, DependencyChain } from '@/types/CampaignEditor/Overview/Overview.types';

interface ComplexityAnalysisCardProps {
  topScripts: ScriptComplexity[];
  orphanScripts: string[];
  circularDependencies: string[][];
  hotspots: string[];
}

export const ComplexityAnalysisCard: React.FC<ComplexityAnalysisCardProps> = ({
  topScripts,
  orphanScripts,
  circularDependencies,
  hotspots
}) => {
  const { t } = useTranslation();
  const getComplexityBadge = (level: string) => {
    const colors = {
      low: 'bg-green-500/20 text-green-400',
      medium: 'bg-yellow-500/20 text-yellow-400',
      high: 'bg-orange-500/20 text-orange-400',
      critical: 'bg-red-500/20 text-red-400'
    };
    return colors[level as keyof typeof colors] || colors.medium;
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold">{t('overview.complexityAnalysisTitle')}</h3>
      </div>
      
      {/* Script più complessi */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-2">{t('overview.mostComplexScripts')}</h4>
        <div className="space-y-2">
          {topScripts.slice(0, 5).map((script, idx) => (
            <div key={script.scriptName} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">#{idx + 1}</span>
                <span className="text-sm font-mono">{script.scriptName}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${getComplexityBadge(script.complexityLevel)}`}>
                  {script.complexityLevel}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{script.commandCount} cmd</span>
                <span>{script.variableCount} var</span>
                <span className="font-semibold text-purple-400">{t('overview.score')}: {script.complexityScore}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Problemi rilevati */}
      <div className="grid grid-cols-2 gap-4">
        {/* Script orfani */}
        {orphanScripts.length > 0 && (
          <div className="bg-gray-700/30 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <h5 className="text-sm font-medium">{t('overview.orphanScripts')}</h5>
            </div>
            <div className="space-y-1">
              {orphanScripts.slice(0, 3).map(script => (
                <div key={script} className="text-xs text-gray-400 font-mono">
                  {script}
                </div>
              ))}
              {orphanScripts.length > 3 && (
                <div className="text-xs text-gray-500">+{orphanScripts.length - 3} {t('overview.others')}</div>
              )}
            </div>
          </div>
        )}
        
        {/* Dipendenze circolari */}
        {circularDependencies.length > 0 && (
          <div className="bg-gray-700/30 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <h5 className="text-sm font-medium">{t('overview.circularDependencies')}</h5>
            </div>
            <div className="space-y-1">
              {circularDependencies.slice(0, 2).map((cycle, idx) => (
                <div key={idx} className="text-xs text-gray-400">
                  {cycle.slice(0, 3).join(' → ')}
                  {cycle.length > 3 && ' ...'}
                </div>
              ))}
              {circularDependencies.length > 2 && (
                <div className="text-xs text-gray-500">+{circularDependencies.length - 2} {t('overview.cycles')}</div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Hotspots */}
      {hotspots.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            <h5 className="text-sm font-medium">{t('overview.mostReferencedScripts')}</h5>
          </div>
          <div className="flex flex-wrap gap-2">
            {hotspots.slice(0, 6).map(script => (
              <span key={script} className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                {script}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
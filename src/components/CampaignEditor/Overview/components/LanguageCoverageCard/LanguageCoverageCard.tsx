// Language Coverage Card Component

import React from 'react';
import { Globe, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/locales';
import type { LanguageCoverage } from '@/types/CampaignEditor/Overview/Overview.types';

interface LanguageCoverageCardProps {
  coverage: LanguageCoverage[];
  overallCoverage: number;
  criticalGaps: number;
}

export const LanguageCoverageCard: React.FC<LanguageCoverageCardProps> = ({
  coverage,
  overallCoverage,
  criticalGaps
}) => {
  const { t } = useTranslation();
  const getStatusIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (percentage >= 50) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <AlertTriangle className="w-4 h-4 text-red-500" />;
  };
  
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold">{t('overview.languageCoverage')}</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">{t('overview.coverage')}:</span>
          <span className={`font-semibold ${
            overallCoverage >= 80 ? 'text-green-400' :
            overallCoverage >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {overallCoverage}%
          </span>
          {criticalGaps > 0 && (
            <span className="text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {criticalGaps} {t('overview.criticalGaps')}
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        {coverage.slice(0, 8).map(lang => (
          <div key={lang.language} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono bg-gray-700 px-2 py-0.5 rounded">
                  {lang.language}
                </span>
                {getStatusIcon(lang.coveragePercentage)}
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span>{lang.translatedMultilanguage}/{lang.totalMultilanguage}</span>
                <span className="font-semibold">{lang.coveragePercentage}%</span>
              </div>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${getProgressColor(lang.coveragePercentage)}`}
                style={{ width: `${lang.coveragePercentage}%` }}
              />
            </div>
            
            {lang.gapAnalysis.critical.length > 0 && (
              <div className="text-xs text-red-400 pl-2">
                {t('overview.criticalScriptsMissing')}: {lang.gapAnalysis.critical.slice(0, 3).join(', ')}
                {lang.gapAnalysis.critical.length > 3 && ` +${lang.gapAnalysis.critical.length - 3}`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
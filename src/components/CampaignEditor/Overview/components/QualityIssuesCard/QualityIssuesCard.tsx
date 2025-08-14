// Quality Issues Card Component

import React from 'react';
import { AlertTriangle, Shield, Bug } from 'lucide-react';
import { useTranslation } from '@/locales';
import type { QualityIssue } from '@/types/CampaignEditor/Overview/Overview.types';

// Helper per interpolazione parametri
const interpolate = (template: string, params: Record<string, any>) => {
  return template.replace(/{(\w+)}/g, (_, key) => params[key] || '');
};

interface QualityIssuesCardProps {
  issues: QualityIssue[];
  qualityScore: number;
  issuesBySeverity: Map<string, number>;
}

export const QualityIssuesCard: React.FC<QualityIssuesCardProps> = ({
  issues,
  qualityScore,
  issuesBySeverity
}) => {
  const { t } = useTranslation();
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };
  
  const getTypeIcon = (type: string) => {
    if (type.includes('circular') || type.includes('dependency')) {
      return <AlertTriangle className="w-3 h-3" />;
    }
    if (type.includes('unused') || type.includes('orphan')) {
      return <Bug className="w-3 h-3" />;
    }
    return <Shield className="w-3 h-3" />;
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold">{t('overview.codeQuality')}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{t('overview.score')}:</span>
          <span className={`text-2xl font-bold ${getScoreColor(qualityScore)}`}>
            {qualityScore}
          </span>
          <span className="text-sm text-gray-500">/100</span>
        </div>
      </div>
      
      {/* Riepilogo per severità */}
      <div className="flex gap-2 mb-4">
        {Array.from(issuesBySeverity.entries())
          .sort((a, b) => {
            const order = { critical: 4, high: 3, medium: 2, low: 1 };
            return (order[b[0] as keyof typeof order] || 0) - (order[a[0] as keyof typeof order] || 0);
          })
          .map(([severity, count]) => (
            <div key={severity} className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(severity)}`}>
              {count} {t(`overview.severity.${severity}` as any)}
            </div>
          ))
        }
      </div>
      
      {/* Lista problemi */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {issues.slice(0, 10).map(issue => (
          <div key={issue.id} className="p-2 bg-gray-700/30 rounded hover:bg-gray-700/50 transition-colors">
            <div className="flex items-start gap-2">
              <div className={`p-1 rounded ${getSeverityColor(issue.severity)}`}>
                {getTypeIcon(issue.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {issue.descriptionKey 
                      ? interpolate(t(issue.descriptionKey as any), issue.descriptionParams || {})
                      : issue.description}
                  </span>
                </div>
                {issue.scriptName && (
                  <div className="text-xs text-gray-400 font-mono">
                    {issue.scriptName}
                    {issue.lineNumber && `:${issue.lineNumber}`}
                  </div>
                )}
                {(issue.suggestionKey || issue.suggestion) && (
                  <div className="text-xs text-blue-400 mt-1">
                    → {issue.suggestionKey 
                      ? interpolate(t(issue.suggestionKey as any), issue.suggestionParams || {})
                      : issue.suggestion}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {issues.length > 10 && (
        <div className="text-center text-sm text-gray-500 mt-2">
          +{issues.length - 10} {t('overview.otherIssues')}
        </div>
      )}
    </div>
  );
};
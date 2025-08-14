// Refactoring Recommendations Card Component

import React from 'react';
import { Lightbulb, ArrowRight, Zap } from 'lucide-react';
import { useTranslation } from '@/locales';
import type { RefactoringRecommendation } from '@/types/CampaignEditor/Overview/Overview.types';

// Helper per interpolazione parametri
const interpolate = (template: string, params: Record<string, any>) => {
  return template.replace(/{(\w+)}/g, (_, key) => params[key] || '');
};

interface RefactoringRecommendationsCardProps {
  recommendations: RefactoringRecommendation[];
}

export const RefactoringRecommendationsCard: React.FC<RefactoringRecommendationsCardProps> = ({
  recommendations
}) => {
  const { t } = useTranslation();
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'split': return '✂️';
      case 'merge': return '🔗';
      case 'extract': return '📤';
      case 'simplify': return '✨';
      case 'remove': return '🗑️';
      default: return '🔧';
    }
  };
  
  const getEffortBadge = (effort: string) => {
    const colors = {
      low: 'text-green-400',
      medium: 'text-yellow-400',
      high: 'text-orange-400'
    };
    return colors[effort as keyof typeof colors] || 'text-gray-400';
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold">{t('overview.refactoringRecommendations')}</h3>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {recommendations.map(rec => (
          <div key={rec.id} className="bg-gray-700/30 rounded-lg p-4 hover:bg-gray-700/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getTypeIcon(rec.type)}</span>
                <span className="font-mono text-sm">{rec.scriptName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(rec.priority)}`}>
                  {t(`overview.priority.${rec.priority}` as any)}
                </span>
                <span className={`text-xs ${getEffortBadge(rec.estimatedEffort)}`}>
                  {rec.estimatedEffort} {t('overview.effort')}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-300 mb-2">
              {rec.reasonKey 
                ? interpolate(t(rec.reasonKey as any), rec.reasonParams || {})
                : rec.reason}
            </p>
            
            {/* Azioni suggerite */}
            <div className="space-y-1 mb-3">
              {rec.suggestedActionsKey ? (
                // Se abbiamo una chiave, le azioni sono un array tradotto
                (t(rec.suggestedActionsKey as any) as unknown as string[])
                  .slice(0, 2)
                  .map((action: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                      <ArrowRight className="w-3 h-3" />
                      <span>
                        {rec.suggestedActionsParams 
                          ? interpolate(action, rec.suggestedActionsParams)
                          : action}
                      </span>
                    </div>
                  ))
              ) : (
                // Fallback ai valori legacy
                (rec.suggestedActions || []).slice(0, 2).map((action, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                    <ArrowRight className="w-3 h-3" />
                    <span>{action}</span>
                  </div>
                ))
              )}
            </div>
            
            {/* Impatto potenziale */}
            <div className="flex items-center gap-4 pt-2 border-t border-gray-700">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-gray-400">{t('overview.impact')}:</span>
              </div>
              <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">{t('overview.maintainability')}</span>
                  <span className="font-semibold text-blue-400">+{rec.potentialImpact.maintainability}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">{t('overview.performance')}</span>
                  <span className="font-semibold text-green-400">+{rec.potentialImpact.performance}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">{t('overview.readability')}</span>
                  <span className="font-semibold text-purple-400">+{rec.potentialImpact.readability}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {recommendations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{t('overview.noRefactoringSuggestions')}</p>
        </div>
      )}
    </div>
  );
};
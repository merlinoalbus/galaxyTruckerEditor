import React from 'react';
import { Trophy, Target, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Achievement } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedString } from '@/utils/localization';
import { useTranslation } from '@/locales/translations';

interface AchievementViewProps {
  achievement: Achievement;
  isSelected: boolean;
  onSelect: (achievement: Achievement) => void;
}

export const AchievementView: React.FC<AchievementViewProps> = ({ 
  achievement, 
  isSelected, 
  onSelect 
}) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'exploring': return 'text-green-400 bg-green-900/30';
      case 'combat': return 'text-red-400 bg-red-900/30';
      case 'trading': return 'text-blue-400 bg-blue-900/30';
      default: return 'text-orange-400 bg-orange-900/30';
    }
  };

  return (
    <div
      className={`
        bg-gray-800 rounded-lg p-4 cursor-pointer transition-all
        ${isSelected ? 'ring-2 ring-blue-500 bg-gray-700' : 'hover:bg-gray-700'}
      `}
      onClick={() => onSelect(achievement)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-orange-400" />
          <h3 className="text-white font-bold">
            {getLocalizedString(achievement.localizedNames, currentLanguage, achievement.name)}
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(achievement.category)}`}>
            {achievement.category}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-yellow-400 font-bold">
            {achievement.points} pts
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs mb-2">
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3 text-gray-400" />
          <span className="text-gray-300">{achievement.objectivesCount} {t('achievementView.objectives')}</span>
        </div>
        {achievement.hidden && (
          <div className="flex items-center gap-1">
            <EyeOff className="w-3 h-3 text-gray-400" />
            <span className="text-gray-300">{t('achievementView.hidden')}</span>
          </div>
        )}
        {achievement.repeatable && (
          <div className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-gray-400" />
            <span className="text-gray-300">{t('achievementView.repeatable')}</span>
          </div>
        )}
      </div>

      {achievement.localizedPreDescriptions && (
        <div className="text-xs text-gray-300 mb-2">
          {getLocalizedString(achievement.localizedPreDescriptions, currentLanguage, '')}
        </div>
      )}

      {achievement.script_che_lo_utilizzano && achievement.script_che_lo_utilizzano.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-1">{t('common.usedIn')}</div>
          <div className="flex flex-wrap gap-1">
            {achievement.script_che_lo_utilizzano.slice(0, 3).map(script => (
              <span key={script} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
                {script}
              </span>
            ))}
            {achievement.script_che_lo_utilizzano.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-400">
                +{achievement.script_che_lo_utilizzano.length - 3} {t('common.others')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
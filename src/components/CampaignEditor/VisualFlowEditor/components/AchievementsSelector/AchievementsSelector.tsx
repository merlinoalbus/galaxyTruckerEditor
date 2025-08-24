import React, { useMemo, useState } from 'react';
import { Search, Check } from 'lucide-react';
import { useTranslation } from '@/locales';
import { useAchievementsImages } from '@/contexts/AchievementsImagesContext';

interface AchievementsSelectorProps {
  value: string;
  onChange: (achievement: string) => void;
  achievements: string[]; // Legacy prop for backward compatibility
  className?: string;
  forceColumns?: number;
  allowNone?: boolean;
}

// Grid selector for achievements with images
export const AchievementsSelector: React.FC<AchievementsSelectorProps> = ({
  value,
  onChange,
  achievements: legacyAchievements, // Legacy prop, we'll use context instead
  className = '',
  forceColumns = 7,
  allowNone = true
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const { achievements, loading, error } = useAchievementsImages();

  const filtered = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    if (!term) return achievements;
    return achievements.filter(a => a.name.toLowerCase().includes(term));
  }, [achievements, searchTerm]);

  if (loading) {
    return (
      <div className={`${className} h-full flex items-center justify-center`}>
        <div className="text-gray-400 text-xs flex items-center gap-2">
          <span className="inline-block w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} h-full flex items-center justify-center`}>
        <div className="text-red-500 text-xs">{error}</div>
      </div>
    );
  }

  return (
    <div className={`${className} h-full flex flex-col`}>
      <div className="mb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={(t as any)('visualFlowEditor.select.searchPlaceholder')}
            className="w-full pl-7 pr-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white placeholder-gray-500"
            style={{ height: '28px' }}
          />
        </div>
      </div>

      <div className="overflow-y-auto bg-slate-800 border border-slate-600 rounded p-1 flex-1" style={{ minHeight: 0, maxHeight: '130px' }}>
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 text-xs py-2">
            {searchTerm ? 'No achievements found' : 'No achievements available'}
          </div>
        ) : (
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${forceColumns}, minmax(0, 1fr))` }}>
            {allowNone && (
              <div
                onClick={() => onChange('')}
                className={`relative cursor-pointer transition-all rounded p-1 flex flex-col items-center ${value === '' ? 'ring-1 ring-purple-500 bg-slate-700/40' : 'hover:bg-slate-700/30'}`}
                title={(t as any)('visualFlowEditor.blocks.achievement.none')}
              >
                <div className="w-full aspect-square mb-0.5 overflow-hidden rounded transform scale-90">
                  <div className="w-full h-full rounded bg-slate-800 border border-slate-600 flex items-center justify-center">
                    <span className="text-[16px] text-gray-400">∅</span>
                  </div>
                </div>
                <div className="text-[9px] text-gray-300 text-center truncate w-full leading-tight">
                  {(t as any)('visualFlowEditor.blocks.achievement.none')}
                </div>
                {value === '' && (
                  <div className="absolute top-0.5 right-0.5">
                    <Check className="w-2.5 h-2.5 text-purple-400" />
                  </div>
                )}
              </div>
            )}

            {filtered.map((achievement) => {
              const isSelected = value === achievement.name;
              return (
                <div
                  key={achievement.name}
                  onClick={() => onChange(achievement.name)}
                  className={`relative cursor-pointer transition-all rounded p-1 flex flex-col items-center ${isSelected ? 'ring-1 ring-purple-500 bg-slate-700/40' : 'hover:bg-slate-700/30'}`}
                  title={achievement.name}
                >
                  <div className="w-full aspect-square mb-0.5 overflow-hidden rounded transform scale-90">
                    {achievement.imageUrl ? (
                      <img 
                        src={achievement.imageUrl}
                        alt={achievement.name}
                        loading="lazy"
                        className="w-full h-full object-cover border border-slate-600"
                      />
                    ) : (
                      <div className="w-full h-full rounded bg-slate-800 border border-slate-600 flex items-center justify-center">
                        <span className="text-[10px] text-gray-200 px-1 text-center break-words">{achievement.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[9px] text-gray-300 text-center truncate w-full leading-tight">{achievement.name}</div>
                  {isSelected && (
                    <div className="absolute top-0.5 right-0.5">
                      <Check className="w-2.5 h-2.5 text-purple-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

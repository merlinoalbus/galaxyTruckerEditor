import React, { useState, useEffect } from 'react';
import { Trophy, Star, EyeOff, Hash, Image as ImageIcon } from 'lucide-react';
import { Achievement } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/locales/translations';

interface AchievementsViewProps {
  achievements: Achievement[];
  onNavigateToScript?: (scriptName: string, achievementName: string) => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({ 
  achievements, 
  onNavigateToScript 
}) => {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [imageCache, setImageCache] = useState<Record<string, string>>({});
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  
  // Funzione helper per ottenere il valore localizzato
  const getLocalizedValue = (achievement: Achievement, field: 'name' | 'preDesc' | 'postDesc') => {
    if (field === 'name') {
      return achievement.localizedNames?.[currentLanguage] || 
             achievement.localizedNames?.EN || 
             achievement.name;
    }
    if (field === 'preDesc') {
      return achievement.localizedPreDescriptions?.[currentLanguage] || 
             achievement.localizedPreDescriptions?.EN || 
             achievement.preDesc;
    }
    if (field === 'postDesc') {
      return achievement.localizedPostDescriptions?.[currentLanguage] || 
             achievement.localizedPostDescriptions?.EN || 
             achievement.postDesc;
    }
    return '';
  };

  // Carica immagini per achievements visibili
  useEffect(() => {
    const loadImages = async () => {
      const imagePaths: string[] = [];
      
      achievements.forEach(ach => {
        if (ach.preImage?.path && ach.preImage.exists) {
          imagePaths.push(ach.preImage.path);
        }
        if (ach.postImage?.path && ach.postImage.exists) {
          imagePaths.push(ach.postImage.path);
        }
      });

      if (imagePaths.length === 0) return;

      try {
        const response = await fetch('http://localhost:3001/api/images/binary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ percorsi: imagePaths })
        });

        if (response.ok) {
          const result = await response.json();
          const newCache: Record<string, string> = {};
          
          if (result.success && result.data) {
            result.data.forEach((item: any) => {
              if (item.binary && item.successo) {
                newCache[item.percorso] = `data:image/png;base64,${item.binary}`;
              }
            });
          }
          
          setImageCache(prev => ({ ...prev, ...newCache }));
        }
      } catch (error) {
        console.error('Error loading achievement images:', error);
      }
    };

    if (achievements.length > 0) {
      loadImages();
    }
  }, [achievements]);

  // Raggruppa per categoria
  const groupedAchievements = achievements.reduce((acc, ach) => {
    const category = ach.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(ach);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'general': 'border-gray-600',
      'campaign': 'border-blue-600',
      'special': 'border-purple-600',
      'hidden': 'border-red-600',
      'multiplayer': 'border-green-600'
    };
    return colors[category.toLowerCase()] || 'border-gray-600';
  };

  return (
    <div className="flex gap-4" style={{ maxHeight: '420px' }}>
      {/* Left Panel - Achievements Grid */}
      <div className="flex-1 overflow-y-auto pr-2">
        {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
          <div key={category} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {category} ({categoryAchievements.length})
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {categoryAchievements.map((achievement) => (
                <div
                  key={achievement.name}
                  onClick={() => setSelectedAchievement(achievement)}
                  className={`
                    bg-gray-900/50 rounded-lg border-2 p-3 cursor-pointer transition-all
                    hover:bg-gray-800/50 hover:scale-[1.02]
                    ${selectedAchievement?.name === achievement.name 
                      ? `${getCategoryColor(category)} shadow-lg` 
                      : 'border-gray-700'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Images Container */}
                    <div className="flex gap-1 flex-shrink-0">
                      {/* Pre Image */}
                      <div className="w-12 h-12 bg-gray-800 rounded overflow-hidden">
                        {achievement.preImage?.path && imageCache[achievement.preImage.path] ? (
                          <img 
                            src={imageCache[achievement.preImage.path]} 
                            alt={t('achievementView.before')}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                      
                      {/* Post Image */}
                      <div className="w-12 h-12 bg-gray-800 rounded overflow-hidden">
                        {achievement.postImage?.path && imageCache[achievement.postImage.path] ? (
                          <img 
                            src={imageCache[achievement.postImage.path]} 
                            alt={t('achievementView.after')}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white text-sm truncate">
                          {getLocalizedValue(achievement, 'name')}
                        </h4>
                        {achievement.hidden && (
                          <span title={t('achievementView.hidden')}>
                            <EyeOff className="w-3 h-3 text-gray-400" />
                          </span>
                        )}
                        {achievement.repeatable && (
                          <span title={t('achievementView.repeatable')}>
                            <Hash className="w-3 h-3 text-gray-400" />
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {achievement.points} {t('achievementView.points')}
                        </span>
                        <span>
                          {achievement.utilizzi_totali || 0} {t('achievementView.uses')}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {getLocalizedValue(achievement, 'preDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Right Panel - Detail View */}
      <div className="w-96 bg-gray-900/30 rounded-lg border border-gray-800 p-4 overflow-y-auto">
        {selectedAchievement ? (
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                {getLocalizedValue(selectedAchievement, 'name')}
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="px-2 py-1 bg-gray-800 rounded">
                  {selectedAchievement.category}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {selectedAchievement.points} {t('achievementView.points')}
                </span>
                {selectedAchievement.hidden && (
                  <span className="flex items-center gap-1">
                    <EyeOff className="w-4 h-4" />
                    {t('achievementView.hidden')}
                  </span>
                )}
              </div>
            </div>

            {/* Images */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">{t('achievementView.before')}</p>
                <div className="bg-gray-800 rounded-lg overflow-hidden aspect-square">
                  {selectedAchievement.preImage?.path && imageCache[selectedAchievement.preImage.path] ? (
                    <img 
                      src={imageCache[selectedAchievement.preImage.path]} 
                      alt={t('achievementView.before')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-400 mb-1">{t('achievementView.after')}</p>
                <div className="bg-gray-800 rounded-lg overflow-hidden aspect-square">
                  {selectedAchievement.postImage?.path && imageCache[selectedAchievement.postImage.path] ? (
                    <img 
                      src={imageCache[selectedAchievement.postImage.path]} 
                      alt={t('achievementView.after')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Trophy className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Descriptions */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">{t('achievementView.preDescription')}</h3>
                <p className="text-sm text-white bg-gray-800 rounded p-2">
                  {getLocalizedValue(selectedAchievement, 'preDesc') || t('achievementView.noDescription')}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">{t('achievementView.postDescription')}</h3>
                <p className="text-sm text-white bg-gray-800 rounded p-2">
                  {getLocalizedValue(selectedAchievement, 'postDesc') || t('achievementView.noDescription')}
                </p>
              </div>
            </div>

            {/* Usage Stats */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">{t('achievementView.usageStatistics')}</h3>
              <div className="bg-gray-800 rounded p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('achievementView.totalUses')}:</span>
                  <span className="text-white font-semibold">
                    {selectedAchievement.utilizzi_totali || 0}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('achievementView.scriptsCount')}:</span>
                  <span className="text-white font-semibold">
                    {selectedAchievement.script_che_lo_utilizzano?.length || 0}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('achievementView.objectives')}:</span>
                  <span className="text-white font-semibold">
                    {selectedAchievement.objectivesCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Scripts List */}
            {selectedAchievement.script_che_lo_utilizzano && 
             selectedAchievement.script_che_lo_utilizzano.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">{t('achievementView.usedInScripts')}</h3>
                <div className="bg-gray-800 rounded p-2">
                  {selectedAchievement.script_che_lo_utilizzano.map(script => (
                    <div 
                      key={script}
                      onClick={() => onNavigateToScript?.(script, selectedAchievement.name)}
                      className="px-2 py-1 text-sm text-blue-400 hover:bg-gray-700 rounded cursor-pointer"
                    >
                      {script}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">{t('achievementView.selectAchievement')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
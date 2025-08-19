import { logger } from '@/utils/logger';
import { useState, useEffect } from 'react';
import { Achievement } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { achievementsViewService } from '@/services/CampaignEditor/VariablesSystem/services/AchievementsView/achievementsViewService';
import { useLanguage } from '@/contexts/LanguageContext';

export const useAchievementsView = (achievements: Achievement[]) => {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [imageCache, setImageCache] = useState<Record<string, string>>({});
  const { currentLanguage } = useLanguage();

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
        const imageData = await achievementsViewService.loadAchievementImages(imagePaths);
        setImageCache(prev => ({ ...prev, ...imageData }));
      } catch (error) {
  logger.error('Error loading achievement images:', error);
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

  return {
    selectedAchievement,
    setSelectedAchievement,
    imageCache,
    groupedAchievements,
    getCategoryColor,
    getLocalizedValue
  };
};
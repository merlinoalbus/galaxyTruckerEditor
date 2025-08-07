import { Achievement } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';

export interface AchievementsViewProps {
  achievements: Achievement[];
  onNavigateToScript?: (scriptName: string, achievementName: string) => void;
}

export interface AchievementsViewState {
  selectedAchievement: Achievement | null;
  imageCache: Record<string, string>;
}

export interface GroupedAchievements {
  [category: string]: Achievement[];
}
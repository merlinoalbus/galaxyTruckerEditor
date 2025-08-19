import { logger } from '@/utils/logger';
import { API_CONFIG } from '@/config/constants';

class AchievementsViewService {
  async loadAchievementImages(imagePaths: string[]): Promise<Record<string, string>> {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/images/binary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percorsi: imagePaths })
      });

      if (!response.ok) {
        throw new Error('Failed to load images');
      }

      const result = await response.json();
      const imageCache: Record<string, string> = {};
      
      if (result.success && result.data) {
        result.data.forEach((item: any) => {
          if (item.binary && item.successo) {
            imageCache[item.percorso] = `data:image/png;base64,${item.binary}`;
          }
        });
      }
      
      return imageCache;
    } catch (error) {
  logger.error('Error in achievementsViewService:', error);
      throw error;
    }
  }
}

export const achievementsViewService = new AchievementsViewService();
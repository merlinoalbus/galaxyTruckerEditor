import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { variablesSystemApiService } from '@/services/CampaignEditor/VariablesSystem/variablesSystemApiService';
import { imagesViewService } from '@/services/CampaignEditor/VariablesSystem/services/ImagesView/imagesViewService';

export interface AchievementWithImage {
  name: string;
  postImagePath?: string;
  imageUrl?: string;
}

interface AchievementsImagesContextType {
  achievements: AchievementWithImage[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const AchievementsImagesContext = createContext<AchievementsImagesContextType | undefined>(undefined);

export const useAchievementsImages = () => {
  const context = useContext(AchievementsImagesContext);
  if (!context) {
    throw new Error('useAchievementsImages must be used within an AchievementsImagesProvider');
  }
  return context;
};

interface AchievementsImagesProviderProps {
  children: ReactNode;
}

export const AchievementsImagesProvider: React.FC<AchievementsImagesProviderProps> = ({ children }) => {
  const [achievements, setAchievements] = useState<AchievementWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Carica la lista degli achievements
      const achievementsList = await variablesSystemApiService.loadAchievements();
      
      // 2. Per ogni achievement con postImage, carica l'immagine binaria
      const achievementsWithImages: AchievementWithImage[] = [];
      const imagesToLoad: string[] = [];
      
      // Prepara la lista delle immagini da caricare
      for (const achievement of achievementsList) {
        if (achievement.postImage?.path) {
          imagesToLoad.push(achievement.postImage.path);
        }
      }
      
      // 3. Carica tutte le immagini in batch
      let imageData: Record<string, string> = {};
      if (imagesToLoad.length > 0) {
        const imagesResponse = await imagesViewService.getImageBinary(imagesToLoad);
        if (imagesResponse.success && Array.isArray(imagesResponse.data)) {
          for (const item of imagesResponse.data) {
            if (item?.percorso && item?.binary) {
              // Determina il MIME type dall'estensione
              const ext = (item.percorso.split('.').pop() || '').toLowerCase();
              const mime = ext === 'jpg' || ext === 'jpeg'
                ? 'image/jpeg'
                : ext === 'webp'
                ? 'image/webp'
                : ext === 'gif'
                ? 'image/gif'
                : ext === 'bmp'
                ? 'image/bmp'
                : 'image/png';
              
              imageData[item.percorso] = `data:${mime};base64,${item.binary}`;
            }
          }
        }
      }
      
      // 4. Combina achievements con le loro immagini
      for (const achievement of achievementsList) {
        achievementsWithImages.push({
          name: achievement.name,
          postImagePath: achievement.postImage?.path,
          imageUrl: achievement.postImage?.path ? imageData[achievement.postImage.path] : undefined,
        });
      }
      
      setAchievements(achievementsWithImages);
    } catch (e) {
      console.error('Errore nel caricamento degli achievement:', e);
      setError('Errore nel caricamento degli achievement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  return (
    <AchievementsImagesContext.Provider value={{ achievements, loading, error, refresh: fetchAchievements }}>
      {children}
    </AchievementsImagesContext.Provider>
  );
};

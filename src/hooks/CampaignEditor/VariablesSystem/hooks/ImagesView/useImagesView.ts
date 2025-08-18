import { logger } from '@/utils/logger';
import { useState, useCallback } from 'react';
import { imagesViewService } from '@/services/CampaignEditor/VariablesSystem/services/ImagesView/imagesViewService';
import { ImageData, ImageCategory } from '@/types/CampaignEditor/VariablesSystem/types/ImagesView/ImagesView.types';

export const useImagesView = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [categories, setCategories] = useState<ImageCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await imagesViewService.getImages(true, 50);
      if (response.success) {
        setImages(response.data);
        
        // Estrai categorie uniche
        const categoryMap = new Map<string, number>();
        
        // Conta per tipo
        response.data.forEach(img => {
          categoryMap.set(img.tipo, (categoryMap.get(img.tipo) || 0) + 1);
        });
        
        // Crea array di categorie
        const categoriesArray: ImageCategory[] = Array.from(categoryMap.entries()).map(([id, count]) => ({
          id,
          label: id, // Mantieni l'id originale, la traduzione sarà nel componente
          count
        }));
        
        setCategories(categoriesArray.sort((a, b) => a.label.localeCompare(b.label)));
      } else {
        setError('Failed to load images');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadImageDetail = useCallback(async (percorso: string): Promise<string | null> => {
    try {
      const response = await imagesViewService.getImageBinary([percorso]);
      if (response.success && response.data.length > 0 && response.data[0].binary) {
        return `data:image/jpeg;base64,${response.data[0].binary}`;
      }
      return null;
    } catch (err) {
  logger.error('Failed to load image detail:', err);
      return null;
    }
  }, []);

  return {
    images,
    categories,
    loading,
    error,
    selectedCategory,
    searchTerm,
    setSelectedCategory,
    setSearchTerm,
    loadImages,
    loadImageDetail
  };
};
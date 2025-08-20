import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { imagesViewService } from '@/services/CampaignEditor/VariablesSystem/services/ImagesView/imagesViewService';
import type { ImageData } from '@/types/CampaignEditor/VariablesSystem/types/ImagesView/ImagesView.types';

interface ImagesContextType {
  images: ImageData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const ImagesContext = createContext<ImagesContextType | undefined>(undefined);

export const useImages = () => {
  const context = useContext(ImagesContext);
  if (!context) {
    throw new Error('useImages must be used within an ImagesProvider');
  }
  return context;
};

interface ImagesProviderProps {
  children: ReactNode;
}

export const ImagesProvider: React.FC<ImagesProviderProps> = ({ children }) => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await imagesViewService.getImages(true);
      if (response.success) {
        setImages(response.data);
      } else {
        setError('Errore nel caricamento delle immagini');
      }
    } catch (e) {
      setError('Errore nel caricamento delle immagini');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <ImagesContext.Provider value={{ images, loading, error, refresh: fetchImages }}>
      {children}
    </ImagesContext.Provider>
  );
};

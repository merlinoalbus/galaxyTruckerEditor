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
  // Cache a livello di modulo per evitare refetch multipli (StrictMode/dev e remount).
  // Nota: questi simboli sono condivisi tra tutte le istanze del provider nel bundle.
  // TTL breve per evitare richieste continue ma mantenere reattività.
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minuti
  // @ts-ignore: dichiarazione su window per hot-reload senza perdere cache
  const globalObj: any = typeof window !== 'undefined' ? window : globalThis;
  const cacheKey = '__IMAGES_CONTEXT_CACHE__';
  const now = Date.now();
  const cached = (globalObj[cacheKey] as { data: ImageData[]; ts: number } | undefined);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    // Usa cache se disponibile e valida
    if (cached && Array.isArray(cached.data) && (now - cached.ts) < CACHE_TTL_MS) {
      setImages(cached.data);
      setLoading(false);
      return;
    }
    try {
  // Recupera SOLO metadati, senza thumbnails (troppo costosi da generare per migliaia di file)
  const response = await imagesViewService.getImages(false, 50);
      if (response.success) {
        setImages(response.data);
        // aggiorna cache globale
        globalObj[cacheKey] = { data: response.data, ts: Date.now() };
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

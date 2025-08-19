// Utility functions for serving images from the Galaxy Trucker game directory
import { API_CONFIG } from '@/config/constants';

const SERVER_URL = API_CONFIG.BE_BASE_URL;

export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  return `${SERVER_URL}/static/${cleanPath}`;
};

export const getCampaignMapImage = (imageName: string): string => {
  return getImageUrl(`campaign/campaignMap/big/${imageName || 'unknown.png'}`);
};

export const getCampaignCharacterImage = (imageName: string): string => {
  if (!imageName) return getImageUrl('campaign/unknown.png');
  
  // Se l'immagine inizia già con "campaign/", non aggiungere il prefisso
  if (imageName.startsWith('campaign/')) {
    return getImageUrl(imageName);
  }
  
  return getImageUrl(`campaign/${imageName}`);
};

export const getPartsImage = (imageName: string): string => {
  return getImageUrl(`parts/${imageName || 'unknown.png'}`);
};

export const getShipsImage = (imageName: string): string => {
  return getImageUrl(`ships/${imageName || 'unknown.png'}`);
};

export const getAdvCardsImage = (imageName: string): string => {
  return getImageUrl(`advCards/${imageName || 'unknown.png'}`);
};

export const getCommonImage = (imageName: string): string => {
  return getImageUrl(`common/${imageName || 'unknown.png'}`);
};

export const getAvatarImage = (imageName: string): string => {
  return getImageUrl(`avatars/${imageName || 'unknown.png'}`);
};

export const getMultiplayerMenuImage = (imageName: string): string => {
  return getImageUrl(`multiplayerMenu/${imageName || 'unknown.png'}`);
};

export const getChatIconImage = (imageName: string): string => {
  return getImageUrl(`chatIcons/${imageName || 'unknown.png'}`);
};

// Generic fallback component for broken images
export const createImageFallback = (fallbackContent: React.ReactElement) => {
  return {
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.currentTarget;
      target.style.display = 'none';
      const parent = target.parentElement;
      if (parent) {
        const fallback = parent.querySelector('.image-fallback');
        if (fallback) {
          (fallback as HTMLElement).style.display = 'flex';
        }
      }
    }
  };
};
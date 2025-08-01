// Utility functions for serving images from the Galaxy Trucker game directory

const SERVER_URL = 'http://localhost:3001';

export function getImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  return `${SERVER_URL}/static/${cleanPath}`;
}

export function getCampaignMapImage(imageName: string): string {
  return getImageUrl(`campaign/campaignMap/big/${imageName || 'unknown.png'}`);
}

export function getCampaignCharacterImage(imageName: string): string {
  return getImageUrl(`campaign/${imageName || 'unknown.png'}`);
}

export function getPartsImage(imageName: string): string {
  return getImageUrl(`parts/${imageName || 'unknown.png'}`);
}

export function getShipsImage(imageName: string): string {
  return getImageUrl(`ships/${imageName || 'unknown.png'}`);
}

export function getAdvCardsImage(imageName: string): string {
  return getImageUrl(`advCards/${imageName || 'unknown.png'}`);
}

export function getCommonImage(imageName: string): string {
  return getImageUrl(`common/${imageName || 'unknown.png'}`);
}

export function getAvatarImage(imageName: string): string {
  return getImageUrl(`avatars/${imageName || 'unknown.png'}`);
}

export function getMultiplayerMenuImage(imageName: string): string {
  return getImageUrl(`multiplayerMenu/${imageName || 'unknown.png'}`);
}

export function getChatIconImage(imageName: string): string {
  return getImageUrl(`chatIcons/${imageName || 'unknown.png'}`);
}

// Generic fallback component for broken images
export function createImageFallback(fallbackContent: React.ReactElement) {
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
}
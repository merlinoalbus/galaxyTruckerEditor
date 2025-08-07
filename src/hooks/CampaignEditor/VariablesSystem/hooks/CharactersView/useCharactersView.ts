import { useState } from 'react';
import { Character } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';

export const useCharactersView = (characters: Character[]) => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Helper per ottenere l'URL dell'immagine
  const getImageUrl = (character: Character) => {
    // Prima prova con l'immagine base
    if (character.immaginebase?.binary) {
      return `data:image/png;base64,${character.immaginebase.binary}`;
    }
    
    // Se non c'è, prova con la prima immagine della lista
    if (character.listaimmagini && character.listaimmagini.length > 0) {
      const firstImage = character.listaimmagini[0];
      if (firstImage.binary) {
        return `data:image/png;base64,${firstImage.binary}`;
      }
    }
    
    return null;
  };

  // Helper per ottenere tutte le immagini associate
  const getAllImages = (character: Character): { name: string; url: string }[] => {
    const images: { name: string; url: string }[] = [];
    
    // Immagine base
    if (character.immaginebase?.binary) {
      images.push({
        name: character.immaginebase.nomefile || 'Base',
        url: `data:image/png;base64,${character.immaginebase.binary}`
      });
    }
    
    // Tutte le altre immagini dalla lista
    if (character.listaimmagini && Array.isArray(character.listaimmagini)) {
      character.listaimmagini.forEach((img) => {
        if (img.binary) {
          // Evita duplicati con l'immagine base
          const isDuplicate = images.some((existing) => 
            existing.name === img.nomefile || 
            existing.url === `data:image/png;base64,${img.binary}`
          );
          
          if (!isDuplicate) {
            images.push({
              name: img.nomefile,
              url: `data:image/png;base64,${img.binary}`
            });
          }
        }
      });
    }
    
    return images;
  };

  return {
    selectedCharacter,
    setSelectedCharacter,
    selectedImage,
    setSelectedImage,
    getImageUrl,
    getAllImages
  };
};
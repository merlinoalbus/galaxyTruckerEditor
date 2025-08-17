import React, { useState } from 'react';
import { API_CONFIG } from '@/config/constants';
import { useScene } from '@/contexts/SceneContext';

interface CharacterAvatarProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  character?: { 
    nomepersonaggio: string; 
    lastImmagine: {
      nomefile: string;
      percorso?: string;
      binary?: string;
    } | string | null;
  } | null;
  isShipType?: boolean;  // Indica se è per SETSHIPTYPE
}

const NO_AVATAR_PATH = '${API_CONFIG.API_BASE_URL}/file/avatars/common/avatar_no_avatar.png';
const DEFAULT_SHIP_PATH = '${API_CONFIG.API_BASE_URL}/file/ships/glowblue-shipII.png';

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({ className = '', size = 'small', character, isShipType = false }) => {
  const { getCurrentScene } = useScene();
  const currentScene = getCurrentScene();
  const [hasError, setHasError] = useState(false);
  
  // Usa il personaggio passato come prop, altrimenti prendi l'ultimo dalla scena
  const lastCharacter = character || (currentScene?.personaggi && currentScene.personaggi.length > 0
    ? currentScene.personaggi[currentScene.personaggi.length - 1]
    : null);
  
  // Determina l'immagine da mostrare - usa fallback diverso per SETSHIPTYPE
  let imagePath = isShipType ? DEFAULT_SHIP_PATH : NO_AVATAR_PATH;
  
  if (lastCharacter?.lastImmagine && !hasError) {
    // Gestisci sia il tipo oggetto (dalla simulazione) che stringa (dal context)
    if (typeof lastCharacter.lastImmagine === 'object') {
      // Se ha il binary base64, usalo direttamente
      if (lastCharacter.lastImmagine.binary) {
        imagePath = `data:image/png;base64,${lastCharacter.lastImmagine.binary}`;
      } 
      // Altrimenti usa il percorso del file
      else if (lastCharacter.lastImmagine.nomefile) {
        imagePath = `${API_CONFIG.API_BASE_URL}/file/${lastCharacter.lastImmagine.percorso || lastCharacter.lastImmagine.nomefile}`;
      }
    } else if (typeof lastCharacter.lastImmagine === 'string') {
      // Compatibilità con il vecchio formato stringa
      imagePath = `${API_CONFIG.API_BASE_URL}/file/${lastCharacter.lastImmagine}`;
    }
  }
  
  // Definisci le dimensioni in base al parametro size
  const sizeClasses = {
    small: 'h-10',  // Solo height per permettere width auto
    medium: 'h-16',
    large: 'h-24'
  };
  
  return (
    <div className={`flex-shrink-0 ${className}`}>
      <div className={`${sizeClasses[size]} rounded overflow-hidden bg-slate-700 border border-slate-600`}>
        <img 
          src={imagePath}
          alt={lastCharacter?.nomepersonaggio || 'No character'}
          className="w-auto h-full object-contain"
          onError={(e) => {
            // Evita loop infinito - setta hasError solo se non stiamo già mostrando il fallback
            const currentSrc = (e.target as HTMLImageElement).src;
            const fallbackPath = isShipType ? DEFAULT_SHIP_PATH : NO_AVATAR_PATH;
            if (!currentSrc.includes('avatar_no_avatar.png') && !currentSrc.includes('glowblue-shipII.png')) {
              setHasError(true);
              (e.target as HTMLImageElement).src = fallbackPath;
            }
          }}
        />
      </div>
    </div>
  );
};
import React, { useState } from 'react';
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
}

const NO_AVATAR_PATH = 'http://localhost:3001/api/file/avatars/common/avatar_no_avatar.png';

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({ className = '', size = 'small', character }) => {
  const { getCurrentScene } = useScene();
  const currentScene = getCurrentScene();
  const [hasError, setHasError] = useState(false);
  
  // Usa il personaggio passato come prop, altrimenti prendi l'ultimo dalla scena
  const lastCharacter = character || (currentScene?.personaggi && currentScene.personaggi.length > 0
    ? currentScene.personaggi[currentScene.personaggi.length - 1]
    : null);
  
  // Determina l'immagine da mostrare
  let imagePath = NO_AVATAR_PATH;
  
  if (lastCharacter?.lastImmagine && !hasError) {
    // Gestisci sia il tipo oggetto (dalla simulazione) che stringa (dal context)
    if (typeof lastCharacter.lastImmagine === 'object') {
      // Se ha il binary base64, usalo direttamente
      if (lastCharacter.lastImmagine.binary) {
        imagePath = `data:image/png;base64,${lastCharacter.lastImmagine.binary}`;
      } 
      // Altrimenti usa il percorso del file
      else if (lastCharacter.lastImmagine.nomefile) {
        imagePath = `http://localhost:3001/api/file/${lastCharacter.lastImmagine.percorso || lastCharacter.lastImmagine.nomefile}`;
      }
    } else if (typeof lastCharacter.lastImmagine === 'string') {
      // Compatibilità con il vecchio formato stringa
      imagePath = `http://localhost:3001/api/file/${lastCharacter.lastImmagine}`;
    }
  }
  
  // Definisci le dimensioni in base al parametro size
  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-16 h-16',
    large: 'w-24 h-24'
  };
  
  return (
    <div className={`flex-shrink-0 ${className}`}>
      <div className={`${sizeClasses[size]} rounded overflow-hidden bg-slate-700 border border-slate-600`}>
        <img 
          src={imagePath}
          alt={lastCharacter?.nomepersonaggio || 'No character'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Evita loop infinito - setta hasError solo se non stiamo già mostrando no_avatar
            const currentSrc = (e.target as HTMLImageElement).src;
            if (!currentSrc.includes('avatar_no_avatar.png')) {
              setHasError(true);
              (e.target as HTMLImageElement).src = NO_AVATAR_PATH;
            }
          }}
        />
      </div>
    </div>
  );
};
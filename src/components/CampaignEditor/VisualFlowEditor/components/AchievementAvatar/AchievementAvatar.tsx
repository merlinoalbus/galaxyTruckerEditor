import React, { useState } from 'react';
import { useAchievementsImages } from '@/contexts/AchievementsImagesContext';

interface AchievementAvatarProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  achievementName?: string;
}

export const AchievementAvatar: React.FC<AchievementAvatarProps> = ({ 
  className = '', 
  size = 'small', 
  achievementName 
}) => {
  const { achievements } = useAchievementsImages();
  const [hasError, setHasError] = useState(false);

  // Trova l'achievement corrispondente
  const achievement = achievements.find(a => a.name === achievementName);
  
  // Usa l'immagine dell'achievement se disponibile, altrimenti usa un'icona di default
  let imagePath = achievement?.imageUrl;
  
  // Se non c'è immagine, usa un'icona placeholder
  if (!imagePath || hasError) {
    imagePath = 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.09 6.26L20 9.27l-6 4.89L12 22l-2-7.84L4 9.27l5.91-1.01L12 2z"/>
      </svg>
    `);
  }
  
  // Definisci le dimensioni in base al parametro size
  const sizeClasses = {
    small: 'h-10',
    medium: 'h-16',
    large: 'h-24'
  };
  
  return (
    <div className={`flex-shrink-0 ${className}`}>
      <div className={`${sizeClasses[size]} rounded overflow-hidden bg-slate-700 border border-slate-600`}>
        <img 
          src={imagePath}
          alt={achievementName || 'Achievement'}
          className="w-auto h-full object-contain"
          onError={(e) => {
            setHasError(true);
            const imgEl = e.target as HTMLImageElement;
            // Fallback to achievement icon
            imgEl.src = 'data:image/svg+xml;base64,' + btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fbbf24">
                <path d="M12 2l2.09 6.26L20 9.27l-6 4.89L12 22l-2-7.84L4 9.27l5.91-1.01L12 2z"/>
              </svg>
            `);
          }}
        />
      </div>
    </div>
  );
};

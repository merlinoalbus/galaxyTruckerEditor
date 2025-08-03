import React from 'react';
import { User } from 'lucide-react';

interface Character {
  name: string;
  displayName?: string;
  images?: string[];
}

interface CharacterSelectorProps {
  blockId: string;
  field: string;
  currentCharacter?: string;
  characters: Character[];
  onOpenCharacterPicker: (blockId: string, field: string, current?: string) => void;
  showImage?: boolean;
  imageType?: 'base' | 'current' | 'new';
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  blockId,
  field,
  currentCharacter,
  characters,
  onOpenCharacterPicker,
  showImage = false,
  imageType = 'base'
}) => {
  const characterData = characters.find(c => c.name === currentCharacter);
  const characterImage = characterData?.images?.[0]; // Base image

  return (
    <div className="flex items-center space-x-3">
      <div 
        className="flex items-center space-x-2 cursor-pointer hover:bg-blue-600/20 px-3 py-2 rounded border border-transparent hover:border-blue-500 transition-colors min-w-0 flex-1"
        onClick={() => onOpenCharacterPicker(blockId, field, currentCharacter)}
      >
        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="text-white truncate">
          {currentCharacter ? (characterData?.displayName || currentCharacter) : 'Select Character'}
        </span>
        <span className="text-xs text-gray-400 flex-shrink-0">👤</span>
      </div>

      {/* Character Image Preview */}
      {showImage && currentCharacter && characterImage && (
        <div className="flex-shrink-0">
          <img 
            src={characterImage}
            alt={`${currentCharacter} (${imageType})`}
            className="w-8 h-8 rounded border border-gray-600 object-cover"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
            }}
          />
          <div className="text-xs text-gray-400 text-center mt-1">{imageType}</div>
        </div>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { EyeOff, User } from 'lucide-react';
import { BaseBlock } from './BaseBlock';
import { BlockProps } from './index';
import { getCampaignCharacterImage } from '../../../../utils/imageUtils';

export const HideCharacterBlock: React.FC<BlockProps> = (props) => {
  const { block, onDeleteBlock, onMoveUp, onMoveDown, characters, characterStates, onOpenCharacterPicker } = props;
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  const characterName = block.command.parameters?.character;
  const characterData = characters.find(c => c.name === characterName);
  
  // SEMPLICE: Se c'è carattere mostrato, non è errore
  const characterState = characterStates?.get(characterName);
  const characterImage = characterState?.currentImage || characterData?.images?.[0];
  
  // DEBUG: Log per vedere cosa stiamo passando
  console.log('HideCharacterBlock DEBUG:', {
    characterName,
    characterState,
    characterData,
    characterImage,
    finalUrl: characterImage ? getCampaignCharacterImage(characterImage) : 'NO IMAGE'
  });
  
  // VALIDAZIONE: Hide Character può essere fatto solo su personaggi con isShown=true
  const hasError = characterName && (!characterState || !characterState.isShown);
  
  return (
    <BaseBlock
      className="bg-red-900/20 border border-red-700"
      icon={<EyeOff className="w-8 h-8 text-red-400" />}
      title="Hide Character"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-4 flex-1 mr-4">
          {/* Character selector - GRANDE QUANTO SHOW CHARACTER (360px = 180+180) */}
          <div 
            className={`flex items-center space-x-3 cursor-pointer hover:bg-red-600/20 px-5 py-3 rounded-lg text-base border w-64 md:w-80 lg:w-96 flex-shrink-0 ${
              hasError ? 'border-red-500 bg-red-900/30' : 'border-red-800/50'
            }`}
            onClick={() => onOpenCharacterPicker(block.id, 'character', characterName)}
          >
            <User className="w-8 h-8" />
            <span className={`font-medium truncate ${hasError ? 'text-red-300' : 'text-white'}`}>
              {characterName || 'Select Character'}
              {hasError && ' (NOT SHOWN!)'}
            </span>
          </div>
          
          {/* SPAZIO RESTANTE RESPONSIVE - SI ESPANDE */}
          <div className="flex-1"></div>
        </div>
        
        {/* Character preview 80x80 - SEMPRE A DESTRA */}
        <div className="w-[80px] h-[80px] bg-gray-800 rounded border border-red-600 flex items-center justify-center overflow-hidden flex-shrink-0">
          {characterImage && !imageErrors.has(characterImage) ? (
            <img 
              src={getCampaignCharacterImage(characterImage)}
              alt={characterName}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                console.log('HideCharacterBlock IMG ERROR:', getCampaignCharacterImage(characterImage));
                setImageErrors(prev => new Set([...prev, characterImage]));
              }}
              onLoad={() => {
                console.log('HideCharacterBlock IMG LOADED:', getCampaignCharacterImage(characterImage));
                setImageErrors(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(characterImage);
                  return newSet;
                });
              }}
            />
          ) : (
            <span className="text-gray-400 text-sm">
              {characterImage ? 'Error' : 'No Image'}
            </span>
          )}
        </div>
      </div>
    </BaseBlock>
  );
};
import React, { useState } from 'react';
import { User } from 'lucide-react';
import { BaseBlock } from './BaseBlock';
import { BlockProps } from './index';
import { CharacterSelector } from '../components/CharacterSelector';
import { getCampaignCharacterImage } from '../../../../utils/imageUtils';

export const ShowCharacterBlock: React.FC<BlockProps> = (props) => {
  const { block, onDeleteBlock, onMoveUp, onMoveDown, characters, onOpenCharacterPicker, onSaveEdit } = props;
  
  const characterName = block.command.parameters?.character;
  const [position, setPosition] = useState(block.command.parameters?.position || 'left');
  const characterData = characters.find(c => c.name === characterName);
  const characterImage = characterData?.images?.[0];

  const handlePositionChange = (newPosition: string) => {
    console.log('Changing position from', position, 'to', newPosition);
    setPosition(newPosition); // FORZA IL RE-RENDER
    if (!block.command.parameters) block.command.parameters = {};
    block.command.parameters.position = newPosition;
    if (onSaveEdit) {
      onSaveEdit();
    }
  };

  return (
    <BaseBlock
      className="bg-blue-900/20 border border-blue-700"
      icon={<User className="w-8 h-8 text-blue-400" />}
      title="Show Character"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-4 flex-1 mr-4">
          {/* Character selector - PIÙ GRANDE */}
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:bg-blue-600/20 px-5 py-3 rounded-lg text-base border border-blue-800/50 w-64 md:w-80 lg:w-96 flex-shrink-0"
            onClick={() => onOpenCharacterPicker(block.id, 'character', characterName)}
          >
            <User className="w-8 h-8" />
            <span className="text-white font-medium truncate">{characterName || 'Select Character'}</span>
          </div>
          
          {/* Position selector - STESSA DIMENSIONE CHARACTER SELECTOR PIÙ GRANDE */}
          <select
            value={position}
            onChange={(e) => handlePositionChange(e.target.value)}
            className="bg-blue-950/50 border border-blue-800 rounded-lg px-5 py-3 text-base text-blue-100 font-medium w-24 md:w-28 lg:w-32 flex-shrink-0"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
          
          {/* SPAZIO RESTANTE RESPONSIVE - SI ESPANDE */}
          <div className="flex-1"></div>
        </div>
        
        {/* Character preview 80x80 - SEMPRE A DESTRA */}
        {characterImage && (
          <div className="w-[80px] h-[80px] bg-gray-800 rounded border border-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img 
              src={getCampaignCharacterImage(characterImage)}
              alt={characterName}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </BaseBlock>
  );
};
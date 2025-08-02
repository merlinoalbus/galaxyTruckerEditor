import React, { useState } from 'react';
import { UserCheck, User } from 'lucide-react';
import { BaseBlock } from './BaseBlock';
import { BlockProps } from './index';
import { getCampaignCharacterImage } from '../../../../utils/imageUtils';
import { ImagePickerPopup } from '../components/ImagePickerPopup';

export const ChangeCharacterBlock: React.FC<BlockProps> = (props) => {
  const { block, onDeleteBlock, onMoveUp, onMoveDown, characters, characterStates, onOpenCharacterPicker, onSaveEdit } = props;
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  const characterName = block.command.parameters?.character;
  const newImage = block.command.parameters?.image;
  const characterData = characters.find(c => c.name === characterName);
  const characterState = characterStates.get(characterName);
  const currentImage = characterState?.currentImage || (characterData?.images[0]);
  
  // VALIDAZIONE: Change Character può essere fatto solo su personaggi con isShown=true
  const hasError = characterName && (!characterState || !characterState.isShown);
  
  // DEBUG: Log per vedere cosa stiamo passando
  console.log('ChangeCharacterBlock DEBUG:', {
    characterName,
    newImage,
    characterState,
    characterData,
    currentImage,
    finalCurrentUrl: currentImage ? getCampaignCharacterImage(currentImage) : 'NO CURRENT IMAGE',
    finalNewUrl: newImage ? getCampaignCharacterImage(newImage) : 'NO NEW IMAGE'
  });

  return (
    <>
      <BaseBlock
        className="bg-purple-900/20 border border-purple-700"
        icon={<UserCheck className="w-3 h-3 text-purple-400" />}
        title="Change Character"
      >
        <div className="flex items-center space-x-6 flex-1">
          {/* Character selector - PIÙ GRANDE */}
          <div 
            className={`flex items-center space-x-3 cursor-pointer hover:bg-purple-600/20 px-5 py-3 rounded-lg text-base border w-64 md:w-80 lg:w-96 flex-shrink-0 ${
              hasError ? 'border-purple-500 bg-purple-900/30' : 'border-purple-800/50'
            }`}
            onClick={() => onOpenCharacterPicker(block.id, 'character', characterName)}
          >
            <User className="w-8 h-8" />
            <span className={`font-medium ${hasError ? 'text-purple-300' : 'text-white'}`}>
              {characterName || 'Select Character'}
              {hasError && ' (NOT VISIBLE!)'}
            </span>
          </div>
           
          {/* SPAZIO RESTANTE RESPONSIVE - SI ESPANDE */}
          <div className="flex-1"></div>
          {/* Current → New image preview IN ORIZZONTALE */}
          {characterName && currentImage ? (
            <div className="flex items-center space-x-4">
              {/* Current image 70x70 */}
              <div className="w-[80px] h-[80px] bg-gray-800 rounded border border-gray-600 flex items-center justify-center overflow-hidden">
                {!imageErrors.has(`current-${currentImage}`) ? (
                  <img 
                    src={getCampaignCharacterImage(currentImage)}
                    alt="Current"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      console.log('ChangeCharacterBlock CURRENT IMG ERROR:', getCampaignCharacterImage(currentImage));
                      setImageErrors(prev => new Set([...prev, `current-${currentImage}`]));
                    }}
                    onLoad={() => {
                      console.log('ChangeCharacterBlock CURRENT IMG LOADED:', getCampaignCharacterImage(currentImage));
                      setImageErrors(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(`current-${currentImage}`);
                        return newSet;
                      });
                    }}
                  />
                ) : (
                  <div className="text-gray-400 text-sm">Error</div>
                )}
              </div>
              
              <span className="text-purple-400 text-2xl font-bold">→</span>
              
              {/* New image 70x70 con pulsante */}
              <div 
                className="w-[80px] h-[80px] bg-gray-800 rounded border-2 border-purple-500 flex items-center justify-center overflow-hidden cursor-pointer hover:border-purple-400 transition-colors"
                onClick={() => setShowImagePicker(true)}
                title="Click to select new image"
              >
                {newImage && newImage.trim() && !imageErrors.has(`new-${newImage}`) ? (
                  <img 
                    src={getCampaignCharacterImage(newImage)}
                    alt="New"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      console.log('ChangeCharacterBlock NEW IMG ERROR:', getCampaignCharacterImage(newImage));
                      setImageErrors(prev => new Set([...prev, `new-${newImage}`]));
                    }}
                    onLoad={() => {
                      console.log('ChangeCharacterBlock NEW IMG LOADED:', getCampaignCharacterImage(newImage));
                      setImageErrors(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(`new-${newImage}`);
                        return newSet;
                      });
                    }}
                  />
                ) : (
                  <div className="text-purple-400 text-2xl">+</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No character or image</div>
          )}
        </div>
      </BaseBlock>
      
      {/* Image picker popup */}
      {showImagePicker && characterData && (
        <ImagePickerPopup
          images={characterData.images}
          currentImage={newImage || currentImage}
          onSelectImage={(image) => {
            block.command.parameters = {
              ...block.command.parameters,
              image: image
            };
            if (onSaveEdit) onSaveEdit();
          }}
          onClose={() => setShowImagePicker(false)}
          characterName={characterName}
        />
      )}
    </>
  );
};
import React from 'react';
import { getCampaignCharacterImage } from '../../../../utils/imageUtils';

interface VisualImageSelectorProps {
  images: string[];
  currentImage?: string;
  selectedImage?: string;
  onImageSelect: (image: string) => void;
  characterName: string;
}

export const VisualImageSelector: React.FC<VisualImageSelectorProps> = ({
  images,
  currentImage,
  selectedImage,
  onImageSelect,
  characterName
}) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {images.map((image) => {
          const isSelected = selectedImage === image;
          const isCurrent = currentImage === image;
          
          return (
            <div
              key={image}
              onClick={() => onImageSelect(image)}
              className={`
                relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                ${isSelected ? 'border-purple-500 shadow-lg' : 'border-gray-600 hover:border-gray-400'}
                ${isCurrent ? 'ring-2 ring-green-500' : ''}
              `}
              title={`${image}${isCurrent ? ' (current)' : ''}`}
            >
              <img
                src={getCampaignCharacterImage(image)}
                alt={`${characterName} - ${image}`}
                className="w-full h-16 object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                }}
              />
              
              {/* Current indicator */}
              {isCurrent && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded-bl">
                  Current
                </div>
              )}
              
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                </div>
              )}
              
              {/* Image name on hover */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-1 py-0.5 opacity-0 hover:opacity-100 transition-opacity">
                {image.replace('.png', '')}
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedImage && (
        <div className="text-xs text-purple-300 text-center">
          Selected: {selectedImage}
        </div>
      )}
    </div>
  );
};
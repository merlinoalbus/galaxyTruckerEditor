import React from 'react';
import { X } from 'lucide-react';
import { getCampaignCharacterImage } from '../../../../utils/imageUtils';

interface ImagePickerPopupProps {
  images: string[];
  currentImage?: string;
  onSelectImage: (image: string) => void;
  onClose: () => void;
  characterName: string;
}

export const ImagePickerPopup: React.FC<ImagePickerPopupProps> = ({
  images,
  currentImage,
  onSelectImage,
  onClose,
  characterName
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-900 rounded-lg p-4 max-w-3xl max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Select Image for {characterName}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {images.map((image) => {
            const isSelected = image === currentImage;
            
            return (
              <div
                key={image}
                onClick={() => {
                  onSelectImage(image);
                  onClose();
                }}
                className={`
                  relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                  ${isSelected ? 'border-purple-500 shadow-lg' : 'border-gray-600 hover:border-gray-400'}
                `}
              >
                <img
                  src={getCampaignCharacterImage(image)}
                  alt={`${characterName} - ${image}`}
                  className="w-full h-[80px] object-contain bg-gray-800"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                  }}
                />
                
                {isSelected && (
                  <div className="absolute top-1 right-1 bg-purple-500 text-white text-xs px-1 rounded">
                    Current
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-2 py-1">
                  {image.replace('.png', '')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
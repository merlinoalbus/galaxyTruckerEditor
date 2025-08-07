import React from 'react';
import { Image } from 'lucide-react';

interface ImageSelectorProps {
  blockId: string;
  field: string;
  currentImage?: string;
  availableImages: string[];
  characterName: string;
  onImageChange?: (blockId: string, field: string, newImage: string) => void;
}

export const ImageSelector: React.FC<ImageSelectorProps> = ({
  blockId,
  field,
  currentImage,
  availableImages,
  characterName,
  onImageChange
}) => {
  const handleImageSelect = (image: string) => {
    if (onImageChange) {
      onImageChange(blockId, field, image);
    }
  };
  return (
    <div className="space-y-2">
      {/* Current Selection */}
      <div className="flex items-center space-x-2">
        <Image className="w-4 h-4 text-gray-400" />
        <select
          value={currentImage || ''}
          onChange={(e) => handleImageSelect(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">Select new image...</option>
          {availableImages.map(image => (
            <option key={image} value={image}>{image}</option>
          ))}
        </select>
      </div>

      {/* Visual Image Grid */}
      <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
        {availableImages.map(image => (
          <div
            key={image}
            className={`relative cursor-pointer rounded border-2 overflow-hidden transition-all ${
              currentImage === image ? 'border-purple-500' : 'border-gray-600 hover:border-gray-400'
            }`}
            onClick={() => handleImageSelect(image)}
          >
            <img
              src={`/campaign/${image}`}
              alt={`${characterName} - ${image}`}
              className="w-full h-12 object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
              }}
            />
            {currentImage === image && (
              <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image Name */}
      {currentImage && (
        <div className="text-xs text-gray-400 text-center">
          {currentImage}
        </div>
      )}
    </div>
  );
};
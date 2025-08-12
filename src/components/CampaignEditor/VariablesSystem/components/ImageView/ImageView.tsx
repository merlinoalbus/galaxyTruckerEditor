import React from 'react';
import { Image as ImageIcon, FileImage } from 'lucide-react';
import { GameImage } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { useTranslation } from '@/locales';

interface ImageViewProps {
  image: GameImage;
  isSelected: boolean;
  onSelect: (image: GameImage) => void;
}

export const ImageView: React.FC<ImageViewProps> = ({ 
  image, 
  isSelected, 
  onSelect 
}) => {
  const { t } = useTranslation();
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT');
  };

  return (
    <div
      className={`
        bg-gray-800 rounded-lg p-4 cursor-pointer transition-all
        ${isSelected ? 'ring-2 ring-blue-500 bg-gray-700' : 'hover:bg-gray-700'}
      `}
      onClick={() => onSelect(image)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileImage className="w-5 h-5 text-pink-400" />
          <h3 className="text-white font-bold">{image.nomefile}</h3>
          <span className="text-xs px-2 py-1 bg-pink-900/30 text-pink-400 rounded-full">
            {image.tipo}
          </span>
          {image.sottotipo && (
            <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full">
              {image.sottotipo}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-400">
          {formatSize(image.dimensione)}
        </div>
      </div>

      <div className="text-xs text-gray-400 mb-2">
        {image.percorso}
      </div>

      <div className="flex gap-4 text-xs">
        <div>
          <span className="text-gray-400">{t('imageView.modified')}: </span>
          <span className="text-gray-300">{formatDate(image.modificato)}</span>
        </div>
        <div>
          <span className="text-gray-400">{t('imageView.depth')}: </span>
          <span className="text-gray-300">{image.profondita}</span>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { X, Image, Search } from 'lucide-react';
import { generateImageCode } from '../utils/metacodeParser';

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
  availableImages: string[];
  existingData?: {
    path: string;
    multiplier?: string;
  };
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  availableImages,
  existingData
}) => {
  const [selectedImage, setSelectedImage] = useState(existingData?.path || '');
  const [multiplier, setMultiplier] = useState(existingData?.multiplier || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [preview, setPreview] = useState('');

  // Immagini di esempio se non fornite
  const defaultImages = [
    'buildScene/point.png',
    'ordinalTokens/1.png',
    'ordinalTokens/2.png',
    'ordinalTokens/3.png',
    'flightScene/dialog_ok.png',
    'parts/gunDouble.png',
    'advCards/icons/flight_day.png',
    'icons/star.png',
    'icons/coin.png',
    'icons/heart.png'
  ];

  const images = availableImages.length > 0 ? availableImages : defaultImages;
  const filteredImages = images.filter(img => 
    img.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (selectedImage) {
      const code = generateImageCode(selectedImage, multiplier);
      setPreview(code);
    } else {
      setPreview('');
    }
  }, [selectedImage, multiplier]);

  const handleInsert = () => {
    if (selectedImage) {
      onInsert(preview);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-4 w-[500px] max-w-[90vw] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Image className="w-5 h-5" />
            Inserisci Immagine
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca immagine..."
            className="w-full bg-slate-900 text-white pl-10 pr-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
          />
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto mb-3">
          <div className="grid grid-cols-3 gap-2">
            {filteredImages.map((img) => (
              <button
                key={img}
                onClick={() => setSelectedImage(img)}
                className={`
                  p-2 rounded border transition-all
                  ${selectedImage === img 
                    ? 'border-blue-500 bg-blue-900/30' 
                    : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
                  }
                `}
              >
                <div className="text-xs text-gray-300 truncate" title={img}>
                  {img.split('/').pop()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {img.split('/').slice(0, -1).join('/')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Multiplier */}
        <div className="mb-3">
          <label className="text-sm text-gray-400 mb-1 block">
            Moltiplicatore (opzionale)
          </label>
          <input
            type="text"
            value={multiplier}
            onChange={(e) => setMultiplier(e.target.value)}
            placeholder="es. n, 3, playerCount"
            className="w-full bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
          />
          <div className="text-xs text-gray-500 mt-1">
            Lascia vuoto per immagine singola, o inserisci una variabile/numero
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="mb-3 p-3 bg-slate-900 rounded border border-slate-700">
            <div className="text-xs text-gray-500 mb-1">Codice generato:</div>
            <code className="text-sm text-green-400 font-mono">{preview}</code>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleInsert}
            disabled={!selectedImage}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded transition-colors"
          >
            Inserisci
          </button>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { useTranslation } from '@/locales';
import type { ImageData } from '@/types/CampaignEditor/VariablesSystem/types/ImagesView/ImagesView.types';
import { useImages } from '@/contexts/ImagesContext';

interface ImageSelectorProps {
  value: string;
  onChange: (imagePath: string) => void;
  className?: string;
  forceColumns?: number;
}

export const ImageSelector: React.FC<ImageSelectorProps> = ({
  value,
  onChange,
  className = '',
  forceColumns = 7
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const { images: allImageData, loading, error } = useImages();

  // Filtra solo le immagini nella cartella campaign/ o tutorial/ (non sottocartelle)
  // Mostra SOLO immagini direttamente in campaign/ o tutorial/ (esclude sottocartelle)
  const filteredByFolder = useMemo(() => {
    return allImageData.filter(imageData => {
      const normalizedPath = imageData.percorso.replace(/\\/g, '/');
      // Path deve terminare con /campaign/<file> oppure /tutorial/<file>
      const campaignMatch = /\/campaign\/[^/]+$/.test(normalizedPath);
      const tutorialMatch = /\/tutorial\/[^/]+$/.test(normalizedPath);
      return campaignMatch || tutorialMatch;
    });
  }, [allImageData]);
  
  // Filtra per ricerca
  const filteredImages = useMemo(() => {
    if (!searchTerm) return filteredByFolder;
    return filteredByFolder.filter(imageData =>
      imageData.percorso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      imageData.nomefile.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredByFolder, searchTerm]);
  
  // Estrai il nome del file per la visualizzazione
  const getImageDisplayName = (imageData: ImageData) => {
    return imageData.nomefile.replace(/\.[^/.]+$/, ''); // Rimuovi estensione
  };
  
  if (loading) {
    return (
      <div className={`${className} h-full flex items-center justify-center`}>
        <div className="text-gray-500 text-xs">Loading images...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={`${className} h-full flex items-center justify-center`}>
        <div className="text-red-500 text-xs">{error}</div>
      </div>
    );
  }
  
  return (
    <div className={`${className} h-full flex flex-col`}>
      {/* Search compatta */}
      <div className="mb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search images..."
            className="w-full pl-7 pr-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white placeholder-gray-500"
            style={{ height: '28px' }}
          />
        </div>
      </div>
      
      {/* Image grid con anteprime */}
  <div className="overflow-y-auto bg-[#8B2C3A] border border-slate-600 rounded p-1 flex-1" style={{ minHeight: 0 }}>
        {filteredImages.length === 0 ? (
          <div className="text-center text-gray-500 text-xs py-2">
            No images found in campaign folder
          </div>
        ) : (
          <div 
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${forceColumns}, minmax(0, 1fr))` }}
          >
            {/* Opzione "Nessuno" per deselezionare */}
            <div
              onClick={() => onChange('')}
              className={`
                relative cursor-pointer transition-all rounded p-1 flex flex-col items-center
                ${value === '' ? 'ring-1 ring-purple-500 bg-[#8B2C3A]' : 'hover:bg-[#8B2C3A]'}
              `}
              title="Nessuno"
            >
              <div className="w-full aspect-square mb-0.5 overflow-hidden rounded transform scale-90">
                <div className="w-full h-full rounded bg-[#8B2C3A] border border-slate-600 flex items-center justify-center">
                  <span className="text-[16px] text-gray-400">∅</span>
                </div>
              </div>
              <div className="text-[9px] text-gray-300 text-center truncate w-full leading-tight">
                Nessuno
              </div>
              {value === '' && (
                <div className="absolute top-0.5 right-0.5">
                  <Check className="w-2.5 h-2.5 text-purple-400" />
                </div>
              )}
            </div>
            
            {filteredImages.map((imageData) => {
              const isSelected = value === imageData.percorso;
              const displayName = getImageDisplayName(imageData);
              // Usa SOLO il thumbnail già caricato, gestendo prefisso duplicato
              let thumbnailUrl: string | null = null;
              if (imageData.thumbnail) {
                if (imageData.thumbnail.startsWith('data:image/')) {
                  thumbnailUrl = imageData.thumbnail;
                } else {
                  // fallback: PNG di default
                  thumbnailUrl = `data:image/png;base64,${imageData.thumbnail}`;
                }
              }
              
              return (
                <div
                  key={imageData.percorso}
                  onClick={() => onChange(imageData.percorso)}
                  className={`
                    relative cursor-pointer transition-all rounded p-1 flex flex-col items-center
                    ${isSelected ? 'ring-1 ring-purple-500 bg-[#8B2C3A]' : 'hover:bg-[#8B2C3A]'}
                  `}
                  title={imageData.percorso}
                >
                  {/* Image preview usando SOLO i thumbnail già caricati */}
                  <div className="w-full aspect-square mb-0.5 overflow-hidden rounded transform scale-90">
                    {thumbnailUrl ? (
                      <img 
                        src={thumbnailUrl}
                        alt={displayName}
                        className="w-full h-full object-cover border border-slate-600"
                      />
                    ) : (
                      <div className="w-full h-full rounded bg-[#8B2C3A] border border-slate-600 flex items-center justify-center">
                        <span className="text-[10px] text-gray-500">?</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Image name */}
                  <div className="text-[9px] text-gray-300 text-center truncate w-full leading-tight">
                    {displayName}
                  </div>
                  
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-0.5 right-0.5">
                      <Check className="w-2.5 h-2.5 text-purple-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

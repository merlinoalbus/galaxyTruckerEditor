import React, { useState, useMemo, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import { useTranslation } from '@/locales';
import type { ImageData } from '@/types/CampaignEditor/VariablesSystem/types/ImagesView/ImagesView.types';
import { useImages } from '@/contexts/ImagesContext';
import { imagesViewService } from '@/services/CampaignEditor/VariablesSystem/services/ImagesView/imagesViewService';

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
  // Cache locale per immagini binarie come in Achievements
  const [imageCache, setImageCache] = useState<Record<string, string>>({});
  const [isFetchingBinary, setIsFetchingBinary] = useState(false);

  // Nessun filtro per cartella: mostra tutte le immagini disponibili (ricerca le restringe).
  const filteredByFolder = allImageData;
  
  // Filtra per ricerca
  const filteredImages = useMemo(() => {
    if (!searchTerm) return filteredByFolder;
    return filteredByFolder.filter(imageData =>
      imageData.percorso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      imageData.nomefile.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredByFolder, searchTerm]);

  // Carica in batch i binari per i primi N risultati filtrati (approccio Achievements)
  useEffect(() => {
    const LIMIT = 200; // batch massimo da caricare velocemente
    if (!filteredImages || filteredImages.length === 0) return;
    // Se molti sono già in cache, evita chiamate inutili
    const toLoad = filteredImages
      .slice(0, LIMIT)
      .map(img => img.percorso)
      .filter(path => !imageCache[path]);
    if (toLoad.length === 0 || isFetchingBinary) return;
    setIsFetchingBinary(true);
    imagesViewService.getImageBinary(toLoad)
      .then(res => {
        if (res?.success && Array.isArray(res.data)) {
          const newEntries: Record<string, string> = {};
          for (const item of res.data) {
            if (!item?.percorso || !item?.binary) continue;
            // Considera anche fallback: se binary esiste, usalo comunque
            // Imposta MIME in base all'estensione del file richiesto
            const ext = (item.percorso.split('.').pop() || '').toLowerCase();
            const mime = ext === 'jpg' || ext === 'jpeg'
              ? 'image/jpeg'
              : ext === 'webp'
              ? 'image/webp'
              : ext === 'gif'
              ? 'image/gif'
              : ext === 'bmp'
              ? 'image/bmp'
              : 'image/png';
            newEntries[item.percorso] = `data:${mime};base64,${item.binary}`;
          }
          if (Object.keys(newEntries).length > 0) {
            setImageCache(prev => ({ ...prev, ...newEntries }));
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsFetchingBinary(false));
  }, [filteredImages, imageCache, isFetchingBinary]);
  
  // Estrai il nome del file per la visualizzazione
  const getImageDisplayName = (imageData: ImageData) => {
    return imageData.nomefile.replace(/\.[^/.]+$/, ''); // Rimuovi estensione
  };
  
  if (loading) {
    return (
      <div className={`${className} h-full flex items-center justify-center`}>
        <div className="text-gray-400 text-xs flex items-center gap-2">
          <span className="inline-block w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
          {t('common.loading')}
        </div>
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
      <div className="overflow-y-auto bg-slate-800 border border-slate-600 rounded p-1 flex-1" style={{ minHeight: 0, maxHeight: '130px' }}>
  {filteredImages.length === 0 ? (
          <div className="text-center text-gray-500 text-xs py-2">
            {t('visualFlowEditor.metacode.noImagesFound')}
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
                ${value === '' ? 'ring-1 ring-purple-500 bg-slate-700/40' : 'hover:bg-slate-700/30'}
              `}
              title={t('visualFlowEditor.metacode.none')}
            >
              <div className="w-full aspect-square mb-0.5 overflow-hidden rounded transform scale-90">
                <div className="w-full h-full rounded bg-slate-800 border border-slate-600 flex items-center justify-center">
                  <span className="text-[16px] text-gray-400">∅</span>
                </div>
              </div>
              <div className="text-[9px] text-gray-300 text-center truncate w-full leading-tight">
                {t('visualFlowEditor.metacode.none')}
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
              // Usa SOLO il thumbnail già caricato; se manca il prefisso data:, applica il MIME corretto
              const buildDataUrl = (base64: string, filename: string): string => {
                const clean = (base64 || '').trim();
                if (!clean) return '';
                if (clean.startsWith('data:image/')) return clean; // già pronto
                const ext = (filename.split('.').pop() || '').toLowerCase();
                const mime = ext === 'jpg' || ext === 'jpeg'
                  ? 'image/jpeg'
                  : ext === 'webp'
                  ? 'image/webp'
                  : ext === 'gif'
                  ? 'image/gif'
                  : 'image/png';
                return `data:${mime};base64,${clean}`;
              };
              // Priorità: cache binaria (più affidabile) -> thumbnail
              const cached = imageCache[imageData.percorso];
              const thumbnailUrl: string | null = cached
                ? cached
                : imageData.thumbnail
                ? buildDataUrl(imageData.thumbnail, imageData.nomefile)
                : null;
              
              return (
                <div
                  key={imageData.percorso}
                  onClick={() => onChange(imageData.percorso)}
                  className={`
                    relative cursor-pointer transition-all rounded p-1 flex flex-col items-center
                    ${isSelected ? 'ring-1 ring-purple-500 bg-slate-700/40' : 'hover:bg-slate-700/30'}
                  `}
                  title={imageData.percorso}
                >
                  {/* Image preview usando SOLO i thumbnail già caricati */}
                  <div className="w-full aspect-square mb-0.5 overflow-hidden rounded transform scale-90">
                    {thumbnailUrl ? (
                      <img 
                        src={thumbnailUrl}
                        alt={displayName}
                        loading="lazy"
                        className="w-full h-full object-cover border border-slate-600"
                      />
                    ) : (
                      <div className="w-full h-full rounded bg-slate-800 border border-slate-600 flex items-center justify-center">
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

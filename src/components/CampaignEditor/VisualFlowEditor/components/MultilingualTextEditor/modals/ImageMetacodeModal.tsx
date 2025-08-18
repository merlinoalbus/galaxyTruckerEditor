import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Image, ChevronDown, Search } from 'lucide-react';
import { ParsedMetacode, generateImageCode } from '../metacodeParser';
import { imagesViewService } from '@/services/CampaignEditor/VariablesSystem/services/ImagesView/imagesViewService';
import { ImageData } from '@/types/CampaignEditor/VariablesSystem/types/ImagesView/ImagesView.types';
import { useTranslation } from '@/locales';

interface ImageMetacodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  metacode: ParsedMetacode | null;
  onSave: (newMetacode: string) => void;
  mousePosition?: { x: number; y: number } | null;
}

export const ImageMetacodeModal: React.FC<ImageMetacodeModalProps> = ({
  isOpen,
  onClose,
  metacode,
  onSave,
  mousePosition
}) => {
  const { t } = useTranslation();
  const [imagePath, setImagePath] = useState('');
  const [count, setCount] = useState(1);
  const [systemImages, setSystemImages] = useState<ImageData[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImageThumbnail, setSelectedImageThumbnail] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (metacode && metacode.type === 'image') {
      const data = metacode.data as any;
      setImagePath(data.path || '');
      setCount(data.count || 1);
    } else {
      setImagePath('');
      setCount(1);
    }
  }, [metacode]);

  // Carica le immagini di sistema quando si apre il picker
  useEffect(() => {
    if (showImagePicker && systemImages.length === 0) {
      setLoadingImages(true);
      setImageError(null);
      // Usa thumbnails piccole per preview compatte (15px)
      imagesViewService.getImages(true, 15)
        .then(response => {
          if (response.success) {
            setSystemImages(response.data);
          } else {
            setImageError(t('visualFlowEditor.metacode.loadImagesError'));
          }
        })
        .catch(err => {
          setImageError(t('visualFlowEditor.metacode.serverConnectionError'));
          logger.error('Failed to load system images:', err);
        })
        .finally(() => setLoadingImages(false));
    }
  }, [showImagePicker, systemImages.length, t]);

  useEffect(() => {
    if (!isOpen) return; // Non fare nulla se la modale non è aperta
    
    if (mousePosition) {
      // Dimensioni approssimative della modale
      const modalWidth = 256; // w-64 = 16rem = 256px
      const modalHeight = 400; // Stima per image modal con picker
      
      // Centra la modale rispetto al cursore
      let x = mousePosition.x - (modalWidth / 2);
      let y = mousePosition.y - (modalHeight / 2);
      
      // Verifica che non esca dai bordi dello schermo
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Assicurati che non esca dai bordi
      if (x < 10) {
        x = 10;
      } else if (x + modalWidth > viewportWidth - 10) {
        x = viewportWidth - modalWidth - 10;
      }
      
      if (y < 10) {
        y = 10;
      } else if (y + modalHeight > viewportHeight - 10) {
        y = viewportHeight - modalHeight - 10;
      }
      
      setPosition({ x, y });
    } else {
      // Centra se non c'è mousePosition
      const centerPos = { 
        x: window.innerWidth / 2 - 128, 
        y: window.innerHeight / 2 - 200 
      };
      setPosition(centerPos);
    }
  }, [isOpen, mousePosition]);

  const handleImageSelect = (image: ImageData) => {
    // Usa il percorso completo invece del solo nome file
    setImagePath(image.percorso || image.nomefile);
    setSelectedImageThumbnail(image.thumbnail || null);
    setShowImagePicker(false);
    setImageError(null);
  };

  // Filtra le immagini in base al termine di ricerca
  const filteredImages = systemImages.filter(img => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return img.nomefile.toLowerCase().includes(term) ||
           img.tipo.toLowerCase().includes(term) ||
           img.sottotipo.toLowerCase().includes(term);
  });

  const handleSave = () => {
    const newCode = generateImageCode(imagePath, count);
    onSave(newCode);
    onClose();
  };

  if (!isOpen) return null;

  const hasValidInput = !!imagePath;
  const preview = `[img(${imagePath || '...'})*${count}]`;

  return ReactDOM.createPortal(
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={onClose}
      />
      
      {/* Modale - posizionata vicino al click */}
      <div 
        className="fixed z-[9999]"
        style={position ? {
          left: `${position.x}px`,
          top: `${position.y}px`
        } : {
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="bg-slate-900 rounded-xl shadow-2xl w-64 border border-slate-700 overflow-hidden max-h-[500px] overflow-y-auto">
            {/* Header compatto con gradiente */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-2">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold text-white">
                  {t('visualFlowEditor.metacode.imageMetacodeTitle')}
                </h3>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="p-2">
              {/* Input percorso con selezione e anteprima */}
              <div className="mb-1.5">
                <label className="block text-[10px] font-semibold text-purple-400 uppercase mb-1">
                  {t('visualFlowEditor.metacode.imagePathLabel')}
                </label>
                <div className="flex gap-1">
                  <div className="flex-1 flex items-center gap-1">
                    {selectedImageThumbnail && (
                      <img 
                        src={selectedImageThumbnail} 
                        alt="" 
                        className="w-4 h-4 object-cover rounded border border-slate-600"
                      />
                    )}
                    <input
                      type="text"
                      value={imagePath}
                      onChange={(e) => {
                        setImagePath(e.target.value);
                        setSelectedImageThumbnail(null); // Reset thumbnail se l'utente modifica manualmente
                      }}
                      className="flex-1 px-1.5 py-0.5 bg-slate-800 text-white text-xs border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                      placeholder={t('visualFlowEditor.metacode.imagePathPlaceholder')}
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowImagePicker(!showImagePicker)}
                    className="px-2 py-0.5 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded transition-colors flex items-center gap-1"
                    title={t('visualFlowEditor.metacode.selectFromSystem')}
                  >
                    <Image className="w-3 h-3" />
                    <ChevronDown className="w-2 h-2" />
                  </button>
                </div>
                
                {/* Pannello selezione immagini */}
                {showImagePicker && (
                  <div className="mt-1 p-1.5 bg-slate-900 border border-slate-700 rounded max-h-48 overflow-hidden flex flex-col">
                    {/* Campo di ricerca */}
                    <div className="relative mb-1.5">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('visualFlowEditor.metacode.filterImages')}
                        className="w-full pl-6 pr-2 py-1 bg-slate-800 text-white text-[10px] border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    {/* Griglia immagini con scroll */}
                    <div className="flex-1 overflow-y-auto">
                      {loadingImages ? (
                        <div className="text-[10px] text-gray-400 text-center py-2">{t('visualFlowEditor.metacode.loadingImages')}</div>
                      ) : imageError ? (
                        <div className="text-[10px] text-red-400 text-center py-2">{imageError}</div>
                      ) : filteredImages.length > 0 ? (
                        <>
                          <div className="text-[9px] text-gray-500 mb-1 px-1">
                            {t('visualFlowEditor.metacode.imagesFound').replace('{count}', String(filteredImages.length))}
                          </div>
                          <div className="grid grid-cols-8 gap-0.5 px-0.5">
                            {filteredImages.map((img, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleImageSelect(img)}
                                className="relative group hover:z-10"
                                title={`${img.tipo}/${img.sottotipo}/${img.nomefile}`}
                              >
                                {img.thumbnail ? (
                                  <img 
                                    src={img.thumbnail}
                                    alt={img.nomefile}
                                    className="w-[15px] h-[15px] object-cover rounded border border-slate-700 group-hover:scale-150 group-hover:border-purple-500 transition-all"
                                  />
                                ) : (
                                  <div className="w-[15px] h-[15px] bg-slate-800 rounded border border-slate-700 flex items-center justify-center group-hover:scale-150 group-hover:border-purple-500 transition-all">
                                    <Image className="w-2 h-2 text-gray-600" />
                                  </div>
                                )}
                                {/* Tooltip al hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-black text-white text-[9px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 transition-opacity">
                                  {img.nomefile.split('/').pop() || img.nomefile}
                                </div>
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-[10px] text-gray-500 text-center py-2">
                          {searchTerm ? t('visualFlowEditor.metacode.noImagesFound') : t('visualFlowEditor.metacode.noImagesAvailable')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Input numero con controlli rapidi */}
              <div className="mb-1.5">
                <label className="block text-[10px] font-semibold text-indigo-400 uppercase mb-1">
                  {t('visualFlowEditor.metacode.repeatLabel')}
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCount(Math.max(1, count - 1))}
                    className="px-1.5 py-0.5 text-xs bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                    min="1"
                    max="99"
                    className="flex-1 px-1.5 py-0.5 bg-slate-800 text-white text-xs text-center border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCount(Math.min(99, count + 1))}
                    className="px-1.5 py-0.5 text-xs bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="my-1.5 border-t border-slate-700"></div>
              
              {/* Risultato */}
              <div className="px-2 py-1">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">{t('visualFlowEditor.metacode.resultLabel')}</p>
                <p className={`text-[11px] font-mono ${hasValidInput ? 'text-purple-400' : 'text-yellow-400'}`}>
                  {preview}
                </p>
              </div>

              {/* Divider */}
              <div className="my-1.5 border-t border-slate-700"></div>

              {/* Pulsanti azione */}
              <div className="flex gap-1.5">
                <button
                  onClick={onClose}
                  className="flex-1 px-2 py-1 text-[10px] text-gray-300 bg-slate-800 rounded hover:bg-slate-700 transition-colors font-medium"
                >
                  {t('visualFlowEditor.metacode.cancelButton')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!imagePath}
                  className="flex-1 px-2 py-1 text-[10px] bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {t('visualFlowEditor.metacode.applyButton')}
                </button>
              </div>
            </div>
          </div>
      </div>
    </>,
    document.body
  );
};
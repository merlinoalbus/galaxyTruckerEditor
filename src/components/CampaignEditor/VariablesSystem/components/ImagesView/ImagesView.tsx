import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Search, Download, Calendar, HardDrive, ChevronDown, ChevronRight } from 'lucide-react';
import { useImagesView } from '@/hooks/CampaignEditor/VariablesSystem/hooks/ImagesView/useImagesView';
import { ImageData } from '@/types/CampaignEditor/VariablesSystem/types/ImagesView/ImagesView.types';

interface ImagesViewProps {
  onNavigateToScript?: (scriptName: string, imageName: string) => void;
}

export const ImagesView: React.FC<ImagesViewProps> = () => {
  const {
    images,
    categories,
    loading,
    error,
    selectedCategory,
    setSelectedCategory,
    loadImages,
    loadImageDetail
  } = useImagesView();

  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [imageDetail, setImageDetail] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  // Carica le immagini all'avvio
  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Carica dettaglio immagine quando selezionata
  useEffect(() => {
    if (selectedImage) {
      setLoadingDetail(true);
      loadImageDetail(selectedImage.percorso)
        .then(detail => {
          setImageDetail(detail);
          setLoadingDetail(false);
        })
        .catch(() => {
          setImageDetail(null);
          setLoadingDetail(false);
        });
    }
  }, [selectedImage, loadImageDetail]);

  // Toggle categoria collassata
  const toggleCategory = (key: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(key)) {
      newCollapsed.delete(key);
    } else {
      newCollapsed.add(key);
    }
    setCollapsedCategories(newCollapsed);
  };

  // Download immagine
  const downloadImage = () => {
    if (imageDetail && selectedImage) {
      const link = document.createElement('a');
      link.href = imageDetail;
      link.download = selectedImage.nomefile;
      link.click();
    }
  };

  // Filtra immagini per categoria e ricerca
  const filteredImages = images.filter(img => {
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || 
      img.tipo === selectedCategory || img.sottotipo === selectedCategory;
    const matchesSearch = !localSearchTerm || 
      img.nomefile.toLowerCase().includes(localSearchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Raggruppa immagini per tipo/sottotipo
  const groupedImages = filteredImages.reduce((acc, img) => {
    const key = `${img.tipo}-${img.sottotipo}`;
    if (!acc[key]) {
      acc[key] = {
        tipo: img.tipo,
        sottotipo: img.sottotipo,
        images: []
      };
    }
    acc[key].images.push(img);
    return acc;
  }, {} as Record<string, { tipo: string; sottotipo: string; images: ImageData[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Loading images...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      {/* Left Panel - Thumbnails Grid */}
      <div className="flex-1 flex flex-col bg-gray-900/30 rounded-lg border border-gray-800 overflow-hidden">
        {/* Search and Filter Bar */}
        <div className="p-3 border-b border-gray-800">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search images..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={selectedCategory || 'all'}
              onChange={(e) => setSelectedCategory(e.target.value === 'all' ? null : e.target.value)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} ({cat.count})
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            {filteredImages.length} images found
          </div>
        </div>

        {/* Thumbnails Grid */}
        <div className="flex-1 overflow-y-auto p-3" style={{ 
          maxHeight: '320px', minHeight: '320px'
        }}>
          {Object.entries(groupedImages).map(([key, group]) => {
            const isCollapsed = collapsedCategories.has(key);
            return (
              <div key={key} className="mb-3">
                <div 
                  onClick={() => toggleCategory(key)}
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-800/50 rounded px-2 py-1 mb-2"
                >
                  {isCollapsed ? 
                    <ChevronRight className="w-3 h-3 text-gray-400" /> : 
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  }
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {group.tipo} / {group.sottotipo} ({group.images.length})
                  </h3>
                </div>
                
                {!isCollapsed && (
                  <div className="ml-4">
                    <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1">
                      {group.images.map((img) => (
                        <div
                          key={`${img.percorso}-${img.nomefile}`}
                          onClick={() => setSelectedImage(img)}
                          className={`
                            relative aspect-square rounded overflow-hidden cursor-pointer
                            border transition-all hover:scale-110
                            ${selectedImage?.percorso === img.percorso 
                              ? 'border-blue-500 shadow-lg shadow-blue-500/30' 
                              : 'border-gray-700 hover:border-gray-600'
                            }
                          `}
                        >
                          {img.thumbnail ? (
                            <img
                              src={img.thumbnail}
                              alt={img.nomefile}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-600" />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-0.5">
                            <div className="text-[9px] text-white truncate">
                              {img.nomefile}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel - Image Preview */}
      <div className="w-80 bg-gray-900/30 rounded-lg border border-gray-800 overflow-hidden flex flex-col">
        {selectedImage ? (
          <>
            {/* Image Preview Header */}
            <div className="p-3 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white truncate flex-1">
                  {selectedImage.nomefile}
                </h3>
                <span className="text-xs text-gray-400 ml-2">
                  {selectedImage.tipo}/{selectedImage.sottotipo}
                </span>
              </div>
            </div>

            {/* Image Display */}
            <div className="flex-1 p-3 flex flex-col">
              <div 
                className="relative bg-gray-800 rounded-lg overflow-hidden mb-3 flex-shrink-0 cursor-pointer"
                onClick={downloadImage}
                title="Click to download"
              >
                {loadingDetail ? (
                  <div className="aspect-square flex items-center justify-center">
                    <div className="text-gray-400 text-sm">Loading...</div>
                  </div>
                ) : imageDetail ? (
                  <img
                    src={imageDetail}
                    alt={selectedImage.nomefile}
                    className="w-full h-auto max-h-64 object-contain hover:opacity-90 transition-opacity"
                  />
                ) : (
                  <div className="aspect-square flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                {imageDetail && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/50 transition-opacity">
                    <Download className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>

              {/* Image Details */}
              <div className="space-y-1 text-xs" style={{ lineHeight: '1.1' }}>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-400">Size:</span>
                  <span className="text-white">
                    {(selectedImage.dimensione / 1024).toFixed(2)} KB
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-400">Modified:</span>
                  <span className="text-white">
                    {new Date(selectedImage.modificato).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Select an image to preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
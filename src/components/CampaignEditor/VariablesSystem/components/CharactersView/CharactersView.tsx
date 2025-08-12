import React from 'react';
import { Users, ChevronRight, Image as ImageIcon, User, FileText, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/locales';
import { useCharactersView } from '@/hooks/CampaignEditor/VariablesSystem/hooks/CharactersView/useCharactersView';
import { CharactersViewProps } from '@/types/CampaignEditor/VariablesSystem/types/CharactersView/CharactersView.types';

export const CharactersView: React.FC<CharactersViewProps> = ({ 
  characters, 
  onNavigateToScript 
}) => {
  const { t } = useTranslation();
  const {
    selectedCharacter,
    setSelectedCharacter,
    selectedImage,
    setSelectedImage,
    getImageUrl,
    getAllImages
  } = useCharactersView(characters);

  return (
    <div className="flex-1 flex gap-4 overflow-hidden">
      {/* Colonna 1: Lista personaggi con immagini piccole */}
      <div className="w-64 bg-gray-900/30 rounded-lg border border-gray-800 overflow-hidden flex flex-col">
        <div className="bg-gray-800/50 px-3 py-2 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t('charactersView.charactersList')}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {characters.map((character, idx) => {
            const imageUrl = getImageUrl(character);
            const isSelected = selectedCharacter === character;
            
            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedCharacter(character);
                  setSelectedImage(imageUrl);
                }}
                className={`
                  flex items-center gap-3 px-3 py-2 cursor-pointer transition-all
                  border-b border-gray-800 hover:bg-gray-800/50
                  ${isSelected ? 'bg-purple-900/30 border-l-4 border-l-purple-500' : ''}
                `}
              >
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={character.nomepersonaggio}
                    className="w-10 h-10 rounded object-cover border border-gray-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-800 border border-gray-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {character.nomepersonaggio}
                  </p>
                  {character.visibile !== undefined && (
                    <p className="text-xs text-gray-500">
                      {character.visibile ? t('charactersView.visible') : t('charactersView.hidden')}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Colonna 2: Dettaglio personaggio */}
      <div className="flex-1 bg-gray-900/30 rounded-lg border border-gray-800 overflow-hidden flex flex-col">
        {selectedCharacter ? (
          <>
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">
                    {selectedCharacter.nomepersonaggio}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedCharacter.visibile ? t('charactersView.visibleInGame') : t('charactersView.hiddenInGame')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Info base - Compatto */}
              <div className="bg-gray-800/20 rounded p-2 border border-gray-700/50">
                <h4 className="text-xs font-semibold text-gray-400 mb-1.5">
                  {t('charactersView.basicInfo')}
                </h4>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">{t('charactersView.internalName')}:</span>
                    <span className="font-mono text-gray-300 truncate">{selectedCharacter.nomepersonaggio}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">{t('charactersView.visibility')}:</span>
                    <span className={`font-medium ${selectedCharacter.visibile ? 'text-green-400' : 'text-gray-500'}`}>
                      {selectedCharacter.visibile ? t('charactersView.visible') : t('charactersView.hidden')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">{t('charactersView.totalUsage')}:</span>
                    <span className="font-medium text-blue-400">{selectedCharacter.utilizzi_totali || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">{t('charactersView.usedInScripts')}:</span>
                    <span className="font-medium text-purple-400">
                      {selectedCharacter.script_che_lo_usano?.length || 0}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <span className="text-gray-500">{t('charactersView.commands')}:</span>
                    <span className="font-medium text-orange-400 truncate">
                      {selectedCharacter.comandi_utilizzati?.join(', ') || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gallery immagini */}
              <div className="bg-gray-800/20 rounded p-3 border border-gray-700/50">
                <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {t('charactersView.imageGallery')}
                  <span className="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded-full">
                    {getAllImages(selectedCharacter).length}
                  </span>
                </h4>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {getAllImages(selectedCharacter).map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImage(img.url)}
                      className={`
                        relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all
                        ${selectedImage === img.url 
                          ? 'border-purple-500 shadow-lg shadow-purple-500/30' 
                          : 'border-gray-700 hover:border-purple-400'
                        }
                      `}
                    >
                      <img 
                        src={img.url}
                        alt={`${selectedCharacter.nomepersonaggio} - ${img.name}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedImage === img.url && (
                        <div className="absolute inset-0 bg-purple-500/20 pointer-events-none" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Scripts che usano il personaggio */}
              {selectedCharacter.script_che_lo_usano && selectedCharacter.script_che_lo_usano.length > 0 && (
                <div className="bg-gray-800/20 rounded p-3 border border-gray-700/50">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {t('charactersView.scriptsUsing')}
                    </span>
                    <span className="bg-gray-700 px-2 py-0.5 rounded-full text-xs text-gray-300">
                      {selectedCharacter.script_che_lo_usano.length}
                    </span>
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedCharacter.script_che_lo_usano.map((script: string, idx: number) => (
                      <div 
                        key={idx}
                        className="group flex items-center justify-between bg-gray-900/50 rounded px-2 py-1.5 hover:bg-gray-800/50 transition-all border border-gray-700/30"
                      >
                        <span className="text-xs font-mono text-gray-300 truncate">{script}</span>
                        {onNavigateToScript && (
                          <button
                            onClick={() => onNavigateToScript(script, selectedCharacter.nomepersonaggio)}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-0.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-all ml-2"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{t('charactersView.goToScript')}</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">{t('charactersView.selectCharacter')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Colonna 3: Visualizzazione immagine grande */}
      <div className="w-96 bg-gray-900/30 rounded-lg border border-gray-800 overflow-hidden flex flex-col">
        <div className="bg-gray-800/50 px-3 py-2 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            {t('charactersView.imagePreview')}
          </h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          {selectedImage ? (
            <>
              {selectedCharacter && (
                <div className="mb-1 text-center">
                  <p className="text-sm font-mono text-gray-300">
                    {getAllImages(selectedCharacter).find(img => img.url === selectedImage)?.name || 'Unknown'}
                  </p>
                </div>
              )}
              <div className="flex-1 flex items-center justify-center w-full">
                <img 
                  src={selectedImage}
                  alt={selectedCharacter?.nomepersonaggio}
                  className="rounded-lg border border-gray-700 shadow-lg"
                  style={{ 
                    objectFit: 'contain',
                    maxWidth: '90%',
                    maxHeight: '70%',
                    width: 'auto',
                    height: 'auto'
                  }}
                />
              </div>
            </>
          ) : (
            <div className="text-center">
              <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">{t('charactersView.noImageSelected')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
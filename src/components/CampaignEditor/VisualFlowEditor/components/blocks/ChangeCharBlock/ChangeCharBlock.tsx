import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BaseBlock } from '../BaseBlock/BaseBlock';
import { getBlockClassName } from '@/utils/CampaignEditor/VisualFlowEditor/blockColors';
import { useTranslation } from '@/locales';
import { SceneDebugButton } from '../../SceneDebugButton';
import { simulateSceneExecution } from '@/utils/CampaignEditor/VisualFlowEditor/sceneSimulation';
import { imagesViewService } from '@/services/CampaignEditor/VariablesSystem/services/ImagesView/imagesViewService';
import type { IFlowBlock, BlockUpdate } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';
import type { Character } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';

interface ChangeCharBlockProps {
  block: IFlowBlock;
  onUpdate: (updates: BlockUpdate) => void;
  onRemove?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  sessionData?: any;
  isInvalid?: boolean;
  validationType?: 'error' | 'warning';
  allBlocks?: IFlowBlock[];
}

export const ChangeCharBlock: React.FC<ChangeCharBlockProps> = ({
  block,
  onUpdate,
  onRemove,
  onDragStart,
  sessionData,
  isInvalid = false,
  validationType,
  allBlocks = []
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // I characters vengono passati da sessionData, wrappati in useMemo per evitare warning
  const characters = useMemo(() => sessionData?.characters || [], [sessionData?.characters]);
  const [noAvatarImage, setNoAvatarImage] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
  // Calcola lo stato simulato della scena fino a questo blocco
  const simulatedSceneState = useMemo(() => {
    if (!allBlocks || allBlocks.length === 0) return null;
    return simulateSceneExecution(allBlocks, block.id, characters);
  }, [allBlocks, block.id, characters]);
  
  // Ottieni i personaggi visibili nella scena simulata
  const visibleCharacters = useMemo(() => {
    if (!simulatedSceneState?.currentScene) return [];
    return simulatedSceneState.currentScene.personaggi
      .filter(p => p.visible)
      .map(p => {
        // Trova il personaggio completo nei dati di sessione
        const fullChar = characters.find((c: Character) => c.nomepersonaggio === p.nomepersonaggio);
        return fullChar;
      })
      .filter(char => char && char.listaimmagini && char.listaimmagini.length > 1);
  }, [simulatedSceneState, characters]);
  
  // Carica no_avatar una volta sola
  useEffect(() => {
    imagesViewService.getImageBinary(['no_avatar.png']).then(noAvatarResponse => {
      if (noAvatarResponse?.data?.[0]?.binary) {
        setNoAvatarImage(`data:image/png;base64,${noAvatarResponse.data[0].binary}`);
      }
    }).catch(console.error);
  }, []);
  
  // Aggiorna il personaggio selezionato quando cambia il parametro
  useEffect(() => {
    if (block.parameters?.character) {
      const char = visibleCharacters.find(c => c.nomepersonaggio === block.parameters?.character);
      setSelectedCharacter(char || null);
    } else {
      setSelectedCharacter(null);
    }
  }, [block.parameters?.character, visibleCharacters]);
  
  
  // Auto-collapse se lo spazio è insufficiente
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      requestAnimationFrame(() => {
        for (const entry of entries) {
          const { width } = entry.contentRect;
          
          if (!isManuallyExpanded && !isCollapsed) {
            const minRequiredWidth = 300;
            
            if (width < minRequiredWidth) {
              setIsCollapsed(true);
            }
          }
        }
      });
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [isManuallyExpanded, isCollapsed]);
  
  const renderParameters = () => {
    return (
      <div className="flex gap-2" style={{ height: '140px' }}>
        {/* Character selector - metà sinistra con griglia 5 colonne */}
        <div className="flex-1">
          <div className="h-full">
            <div className="text-xs text-gray-400 mb-1 text-center">{t('visualFlowEditor.blocks.changeChar.selectCharacter')}</div>
            <div className="grid grid-cols-5 gap-1 p-2 bg-slate-800 rounded border border-slate-600 h-[110px] overflow-y-auto">
              {visibleCharacters.length === 0 ? (
                <div className="col-span-5 flex items-center justify-center text-gray-500 text-xs">
                  {t('visualFlowEditor.blocks.changeChar.noVisibleCharacters')}
                </div>
              ) : (
                <>
                  {/* Opzione "Nessuno" per deselezionare */}
                  <div
                    onClick={() => {
                      onUpdate({ 
                        parameters: { 
                          ...block.parameters, 
                          character: '',
                          image: undefined
                        }
                      });
                    }}
                    className={`
                      relative cursor-pointer transition-all rounded p-1 flex flex-col items-center
                      ${block.parameters?.character === '' ? 'ring-1 ring-purple-500 bg-slate-700' : 'hover:bg-slate-700'}
                    `}
                    title="Nessuno"
                  >
                    <div className="w-full aspect-square mb-0.5 overflow-hidden rounded">
                      <div className="w-full h-full rounded bg-slate-800 border border-slate-600 flex items-center justify-center">
                        <span className="text-[16px] text-gray-400">∅</span>
                      </div>
                    </div>
                    <div className="text-[9px] text-gray-300 text-center truncate w-full leading-tight">
                      Nessuno
                    </div>
                  </div>
                  
                  {/* Personaggi visibili */}
                  {visibleCharacters.map((char: Character) => {
                    const charImage = char.immaginebase?.binary 
                      ? `data:image/png;base64,${char.immaginebase.binary}`
                      : char.listaimmagini?.[0]?.binary 
                        ? `data:image/png;base64,${char.listaimmagini[0].binary}`
                        : null;
                    
                    return (
                      <div
                        key={char.nomepersonaggio}
                        onClick={() => {
                          onUpdate({ 
                            parameters: { 
                              ...block.parameters, 
                              character: char.nomepersonaggio,
                              image: undefined // Reset image when character changes
                            }
                          });
                        }}
                        className={`
                          relative cursor-pointer transition-all rounded p-1 flex flex-col items-center
                          ${block.parameters?.character === char.nomepersonaggio ? 'ring-1 ring-purple-500 bg-slate-700' : 'hover:bg-slate-700'}
                        `}
                        title={char.nomepersonaggio}
                      >
                        <div className="w-full aspect-square mb-0.5 overflow-hidden rounded">
                          {charImage ? (
                            <img 
                              src={charImage}
                              alt={char.nomepersonaggio}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : noAvatarImage ? (
                            <img 
                              src={noAvatarImage}
                              alt="no avatar"
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                              <span className="text-xs text-gray-500">?</span>
                            </div>
                          )}
                        </div>
                        <div className="text-[9px] text-gray-300 text-center truncate w-full leading-tight">
                          {char.nomepersonaggio}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Image selector - metà destra con griglia 5 colonne - invisibile se nessun personaggio selezionato */}
        {selectedCharacter ? (
          <div className="flex-1">
            <div className="h-full">
              <div className="text-xs text-gray-400 mb-1 text-center">{t('visualFlowEditor.blocks.changeChar.selectNewImage')}</div>
              <div className="grid grid-cols-5 gap-1 p-2 bg-slate-800 rounded border border-slate-600 h-[110px] overflow-y-auto">
                {selectedCharacter.listaimmagini && selectedCharacter.listaimmagini.length > 0 ? (
                  selectedCharacter.listaimmagini
                    .filter((img: any) => {
                      // Escludi l'immagine corrente del personaggio
                      const currentImage = selectedCharacter.immaginebase?.nomefile || 
                                         (selectedCharacter.listaimmagini?.[0]?.nomefile);
                      return img.nomefile !== currentImage;
                    })
                    .map((img: any, index: number) => {
                      const imageUrl = img.binary 
                        ? `data:image/png;base64,${img.binary}`
                        : null;
                      const imageName = img.nomefile || `Image ${index + 1}`;
                      
                      return (
                        <div
                          key={imageName}
                          onClick={() => {
                            onUpdate({ 
                              parameters: { 
                                ...block.parameters, 
                                image: img.percorso || imageName // Salva il percorso, non il nomefile
                              }
                            });
                          }}
                          className={`
                            relative cursor-pointer transition-all rounded p-1 flex flex-col items-center
                            ${block.parameters?.image === (img.percorso || imageName) ? 'ring-1 ring-purple-500 bg-slate-700' : 'hover:bg-slate-700'}
                          `}
                          title={imageName}
                        >
                          <div className="w-full aspect-square mb-0.5 overflow-hidden rounded">
                            {imageUrl ? (
                              <img 
                                src={imageUrl}
                                alt={imageName}
                                className="w-full h-full object-cover object-top"
                              />
                            ) : noAvatarImage ? (
                              <img 
                                src={noAvatarImage}
                                alt="no avatar"
                                className="w-full h-full object-cover object-top"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                                <span className="text-xs text-gray-500">?</span>
                              </div>
                            )}
                          </div>
                          <div className="text-[9px] text-gray-300 text-center truncate w-full leading-tight">
                            {imageName}
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="col-span-5 flex items-center justify-center text-gray-500 text-xs">
                    {t('visualFlowEditor.blocks.changeChar.noImagesAvailable')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    );
  };
  
  const getBlockIcon = () => {
    return <span className="text-2xl">🎭</span>;
  };
  
  // Genera i parametri compatti per la visualizzazione collapsed
  const getCompactParams = () => {
    if (block.parameters?.character && block.parameters?.image) {
      const char = visibleCharacters.find(c => c.nomepersonaggio === block.parameters?.character);
      const currentImage = char?.immaginebase?.binary 
        ? `data:image/png;base64,${char.immaginebase.binary}`
        : char?.listaimmagini?.[0]?.binary 
          ? `data:image/png;base64,${char.listaimmagini[0].binary}`
          : null;
      
      const newImageData = char?.listaimmagini?.find((img: any) => 
        img.percorso === block.parameters?.image || 
        img.nomefile === block.parameters?.image // fallback
      );
      const newImage = newImageData?.binary 
        ? `data:image/png;base64,${newImageData.binary}`
        : null;
      
      return (
        <div className="flex items-center justify-between gap-2 w-full bg-slate-800/30 rounded px-2 py-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">{block.parameters.character}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Immagine corrente del personaggio */}
            <div className="w-10 h-10 rounded overflow-hidden border border-slate-600">
              {currentImage ? (
                <img 
                  src={currentImage}
                  alt="current"
                  className="w-full h-full object-cover object-top"
                  title={`Immagine attuale`}
                />
              ) : noAvatarImage ? (
                <img 
                  src={noAvatarImage}
                  alt="current character"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                  <span className="text-xs text-gray-500">?</span>
                </div>
              )}
            </div>
            <span className="text-gray-500">→</span>
            {/* Nuova immagine che verrà impostata */}
            <div className="w-10 h-10 rounded overflow-hidden border border-slate-600">
              {newImage ? (
                <img 
                  src={newImage}
                  alt={block.parameters.image}
                  className="w-full h-full object-cover object-top"
                  title={`Nuova immagine: ${block.parameters.image}`}
                />
              ) : noAvatarImage ? (
                <img 
                  src={noAvatarImage}
                  alt="new character"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                  <span className="text-xs text-gray-500">?</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div ref={containerRef}>
      <BaseBlock
        blockType={block.type}
        blockIcon={getBlockIcon()}
        compactParams={getCompactParams()}
        onRemove={onRemove}
        onDragStart={onDragStart}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => {
          if (isCollapsed) {
            setIsManuallyExpanded(true);
            setIsCollapsed(false);
          } else {
            setIsManuallyExpanded(false);
            setIsCollapsed(true);
          }
        }}
        className={`${getBlockClassName(block.type, isInvalid, validationType)} p-3 mb-2 transition-all hover:shadow-lg`}
        isInvalid={isInvalid}
        validationType={validationType}
        extraControls={allBlocks.length > 0 && <SceneDebugButton block={block} allBlocks={allBlocks} characters={characters} />}
      >
        {renderParameters()}
      </BaseBlock>
    </div>
  );
};
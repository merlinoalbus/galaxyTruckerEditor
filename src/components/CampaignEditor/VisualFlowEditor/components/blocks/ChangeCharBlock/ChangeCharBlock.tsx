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
  collapseAllTrigger?: number;
  expandAllTrigger?: number;
  globalCollapseState?: 'collapsed' | 'expanded' | 'manual';
  isCustom?: boolean;
  availableLanguages?: string[];
}

export const ChangeCharBlock: React.FC<ChangeCharBlockProps> = ({
  block,
  onUpdate,
  onRemove,
  onDragStart,
  sessionData,
  isInvalid = false,
  validationType,
  allBlocks = [],
  collapseAllTrigger = 0,
  expandAllTrigger = 0,
  globalCollapseState = 'manual',
  isCustom,
  availableLanguages
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return globalCollapseState === 'expanded' ? false : true;
  });
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Reagisci ai trigger di collapse/expand all
  useEffect(() => {
    if (collapseAllTrigger > 0) {
      setIsCollapsed(true);
      setIsManuallyExpanded(false);
    }
  }, [collapseAllTrigger]);
  
  useEffect(() => {
    if (expandAllTrigger > 0) {
      setIsCollapsed(false);
      setIsManuallyExpanded(true);
    }
  }, [expandAllTrigger]);
  
  // I characters vengono passati da sessionData, wrappati in useMemo per evitare warning
  const characters = useMemo(() => sessionData?.characters || [], [sessionData?.characters]);
  const [noAvatarImage, setNoAvatarImage] = useState<string | null>(null);
  // Cache temporanea per immagini non presenti nei metadata locali (percorso -> dataURL)
  const [tempImageCache, setTempImageCache] = useState<Record<string, string>>({});
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
  // Calcola lo stato simulato della scena fino a questo blocco
  const simulatedSceneState = useMemo(() => {
    if (!allBlocks || allBlocks.length === 0) return null;
    return simulateSceneExecution(allBlocks, block.id, characters);
  }, [allBlocks, block.id, characters]);
  
  // Lista completa personaggi per selezione (tutti, non solo visibili)
  const allCharacters = useMemo(() => {
    return (characters || []).filter((c: Character) => !!c);
  }, [characters]);
  
  // Carica no_avatar una volta sola
  useEffect(() => {
    imagesViewService.getImageBinary(['no_avatar.png']).then(noAvatarResponse => {
      if (noAvatarResponse?.data?.[0]?.binary) {
        setNoAvatarImage(`data:image/png;base64,${noAvatarResponse.data[0].binary}`);
      }
    }).catch(console.error);
  }, []);
  
  // Aggiorna il personaggio selezionato quando cambia il parametro (dalla lista completa)
  useEffect(() => {
    if (block.parameters?.character) {
      const char = allCharacters.find((c: Character) => c.nomepersonaggio === block.parameters?.character);
      setSelectedCharacter(char || null);
    } else {
      setSelectedCharacter(null);
    }
  }, [block.parameters?.character, allCharacters]);

  // Se l'immagine selezionata non è nella lista del personaggio, prova a caricarla e cache locale
  useEffect(() => {
    const imgPath: string | undefined = block.parameters?.image;
    if (!selectedCharacter || !imgPath) return;
    const existsInList = (selectedCharacter.listaimmagini || []).some(img => img.percorso === imgPath || img.nomefile === imgPath);
    if (existsInList) return;
    if (tempImageCache[imgPath]) return;
    imagesViewService.getImageBinary([imgPath])
      .then(res => {
        const item = res?.data?.find((d: any) => d?.percorso === imgPath || d?.nomefile === imgPath);
        if (item?.binary) {
          const ext = (imgPath.split('.').pop() || '').toLowerCase();
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : ext === 'bmp' ? 'image/bmp' : 'image/png';
          setTempImageCache(prev => ({ ...prev, [imgPath]: `data:${mime};base64,${item.binary}` }));
        }
      })
      .catch(() => {});
  }, [block.parameters?.image, selectedCharacter, tempImageCache]);
  
  
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
              {allCharacters.length === 0 ? (
                <div className="col-span-5 flex items-center justify-center text-gray-500 text-xs">
                  {t('visualFlowEditor.blocks.characterSelector.noAvailable')}
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
                  
                  {/* Tutti i personaggi */}
                  {allCharacters.map((char: Character) => {
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
        
        {/* Image selector - metà destra con griglia 5 colonne - visibile solo se c'è un personaggio selezionato */}
        {selectedCharacter ? (
          <div className="flex-1">
            <div className="h-full">
              <div className="text-xs text-gray-400 mb-1 text-center">{t('visualFlowEditor.blocks.changeChar.selectNewImage')}</div>
              <div className="grid grid-cols-5 gap-1 p-2 bg-slate-800 rounded border border-slate-600 h-[110px] overflow-y-auto">
                {(() => {
                  // Costruisci la lista immagini includendo eventuale immagine esterna selezionata
                  const baseList = selectedCharacter.listaimmagini && selectedCharacter.listaimmagini.length > 0 ? selectedCharacter.listaimmagini : [];
                  const imgPath: string | undefined = block.parameters?.image;
                  const existsInList = imgPath ? baseList.some((i: any) => i.percorso === imgPath || i.nomefile === imgPath) : false;
                  const augmentedList = !existsInList && imgPath
                    ? [
                        // Inserisci prima una voce sintetica per l'immagine esterna attuale
                        { nomefile: imgPath.split('/').pop() || imgPath, percorso: imgPath, binary: tempImageCache[imgPath] }
                      , ...baseList]
                    : baseList;

                  return augmentedList && augmentedList.length > 0 ? (
                    augmentedList
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
                      const imgPathLocal = img.percorso || imageName;
                      const cached = tempImageCache[imgPathLocal];
                      const finalUrl = cached || imageUrl || null;
                      
                      return (
                        <div
                          key={`${imgPathLocal}-${index}`}
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
                            {finalUrl ? (
                              <img 
                                src={finalUrl}
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
                  );
                })()}
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
      const char = allCharacters.find((c: Character) => c.nomepersonaggio === block.parameters?.character);
      const currentImage = char?.immaginebase?.binary 
        ? `data:image/png;base64,${char.immaginebase.binary}`
        : char?.listaimmagini?.[0]?.binary 
          ? `data:image/png;base64,${char.listaimmagini[0].binary}`
          : null;
      
      const newImageData = char?.listaimmagini?.find((img: any) => 
        img.percorso === block.parameters?.image || 
        img.nomefile === block.parameters?.image // fallback
      );
      // Prova temp cache se non trovato nei metadata
      const newImage = newImageData?.binary 
        ? `data:image/png;base64,${newImageData.binary}`
        : (block.parameters?.image && tempImageCache[block.parameters.image])
        ? tempImageCache[block.parameters.image]
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
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Emoji from '@/components/Emoji/Emoji';
import { BaseBlock } from '../BaseBlock/BaseBlock';
import { MultilingualTextEditor } from '../../MultilingualTextEditor';
import { CharacterSelector } from '../../CharacterSelector/CharacterSelector';
import { CharacterAvatar } from '../../CharacterAvatar/CharacterAvatar';
import { SceneDebugButton } from '../../SceneDebugButton';
import { getBlockClassName } from '@/utils/CampaignEditor/VisualFlowEditor/blockColors';
import { useTranslation } from '@/locales';
import { simulateSceneExecution } from '@/utils/CampaignEditor/VisualFlowEditor/sceneSimulation';
import { imagesViewService } from '@/services/CampaignEditor/VariablesSystem/services/ImagesView/imagesViewService';
import type { IFlowBlock, BlockUpdate } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';
import type { Character } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { useLanguage } from '@/contexts/LanguageContext';

interface SayCharBlockProps {
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

export const SayCharBlock: React.FC<SayCharBlockProps> = ({
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
  const { currentLanguage } = useLanguage();
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
  
  const [noAvatarImage, setNoAvatarImage] = useState<string | null>(null);
  const [selectedCharacterImage, setSelectedCharacterImage] = useState<string | null>(null);
  
  // I characters vengono passati da sessionData
  const characters = useMemo(() => sessionData?.characters || [], [sessionData?.characters]);
  
  // Trova il personaggio selezionato
  const selectedCharacter = useMemo(() => {
    if (!block.parameters?.character) return null;
    return characters.find((c: Character) => c.nomepersonaggio === block.parameters?.character) || null;
  }, [block.parameters?.character, characters]);
  
  // Calcola lo stato simulato della scena fino a questo blocco (ESCLUSO)
  // La simulazione si ferma PRIMA di processare questo blocco
  const simulatedSceneState = useMemo(() => {
    if (!allBlocks || allBlocks.length === 0) return null;
    return simulateSceneExecution(allBlocks, block.id, characters);
  }, [allBlocks, block.id, characters]);
  
  // Carica no_avatar una volta sola
  useEffect(() => {
    imagesViewService.getImageBinary(['no_avatar.png']).then(noAvatarResponse => {
      if (noAvatarResponse?.data?.[0]?.binary) {
        setNoAvatarImage(`data:image/png;base64,${noAvatarResponse.data[0].binary}`);
      }
    }).catch(() => {});
  }, []);
  
  // Aggiorna l'immagine del personaggio selezionato
  useEffect(() => {
    if (selectedCharacter) {
      if (selectedCharacter.immaginebase?.binary) {
        setSelectedCharacterImage(`data:image/png;base64,${selectedCharacter.immaginebase.binary}`);
      } else if (selectedCharacter.listaimmagini?.[0]?.binary) {
        setSelectedCharacterImage(`data:image/png;base64,${selectedCharacter.listaimmagini[0].binary}`);
      } else {
        setSelectedCharacterImage(null);
      }
    } else {
      setSelectedCharacterImage(null);
    }
  }, [selectedCharacter]);
  
  // Auto-collapse se lo spazio è insufficiente
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      requestAnimationFrame(() => {
        for (const entry of entries) {
          const { width } = entry.contentRect;
          
          if (!isManuallyExpanded && !isCollapsed) {
            const minRequiredWidth = 400;
            
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
      <div className="space-y-3">
        {/* Selezione personaggio con 10 colonne e altezza max 130px */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">
            {t('visualFlowEditor.blocks.sayChar.selectCharacter')}
          </label>
          <div style={{ height: '160px', overflow: 'hidden' }}>
            <CharacterSelector
              value={block.parameters?.character || ''}
              onChange={(character) => onUpdate({ 
                parameters: { ...block.parameters, character } 
              })}
              characters={characters}
              mode="show"
              className="h-full"
              forceColumns={10}
            />
          </div>
        </div>
        
        {/* Editor testo multilingua con avatar del personaggio */}
        <div className="flex items-start gap-3">
          {/* Avatar a sinistra se il personaggio è selezionato */}
          {selectedCharacter && (
            <div className="flex-shrink-0">
              <CharacterAvatar size="large" character={{
                nomepersonaggio: selectedCharacter.nomepersonaggio,
                lastImmagine: selectedCharacter.immaginebase || selectedCharacter.listaimmagini?.[0] || null
              }} />
            </div>
          )}
          
          {/* Editor testo */}
          <div className="flex-1">
            <MultilingualTextEditor
              value={typeof block.parameters?.text === 'string' 
                ? { EN: block.parameters.text } 
                : (block.parameters?.text || {})}
              onChange={(text) => onUpdate({ 
                parameters: { ...block.parameters, text } 
              })}
              placeholder={t('visualFlowEditor.blocks.sayChar.dialogPlaceholder')}
              label={t('visualFlowEditor.blocks.sayChar.dialogLabel')}
              isCustom={isCustom}
              availableLanguages={availableLanguages}
            />
          </div>
        </div>
      </div>
    );
  };
  
  const getBlockIcon = () => {
  return <Emoji text="🗣️" className="text-2xl leading-none inline-block align-middle" />;
  };
  
  // Genera i parametri compatti per la visualizzazione collapsed
  const getCompactParams = () => {
    // Prima determina se ci sono parametri validi
    const hasCharacter = block.parameters?.character;
    const hasText = block.parameters?.text;
    
    // Se non c'è nulla, restituisci indicatore vuoto
    if (!hasCharacter && !hasText) {
      return (
        <div className="flex items-center gap-2 w-full text-gray-500 italic">
          <span>{t('visualFlowEditor.blocks.sayChar.noParameters')}</span>
        </div>
      );
    }
    
    let text = '';
    if (hasText && block.parameters?.text) {
      if (typeof block.parameters.text === 'string') {
        text = block.parameters.text;
      } else {
        // Prima prova con la lingua dell'interfaccia corrente
        if (block.parameters.text[currentLanguage] && block.parameters.text[currentLanguage].trim()) {
          text = block.parameters.text[currentLanguage];
        } else {
          // Altrimenti usa EN come fallback
          text = block.parameters.text.EN || '';
        }
      }
    }
    
    if (hasCharacter) {
      // Trova il personaggio che è attualmente visibile nella posizione 'left' PRIMA di questo blocco
      let currentVisibleChar = null;
      let currentCharImage = null;
      
      if (simulatedSceneState?.currentScene) {
        // SAYCHAR mette sempre il personaggio nella posizione 'left'
        // Quindi guardiamo chi c'è nella posizione 'left' prima di questo blocco
        currentVisibleChar = simulatedSceneState.currentScene.personaggi.find(
          p => p.posizione === 'left' && p.visible
        );
        
        if (currentVisibleChar && currentVisibleChar.lastImmagine?.binary) {
          currentCharImage = `data:image/png;base64,${currentVisibleChar.lastImmagine.binary}`;
        }
      }
      
      return (
        <div className="flex items-center justify-between gap-2 w-full bg-slate-800/30 rounded px-2 py-1">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-gray-400">{block.parameters?.character}:</span>
            {hasText && (
              <span className="truncate max-w-[200px] text-gray-300" title={text}>
                "{text}"
              </span>
            )}
            {!hasText && (
              <span className="text-gray-500 italic">
                {t('visualFlowEditor.blocks.sayChar.noText')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Immagine del personaggio attualmente visibile (o no_avatar se nessuno) */}
            <div className="w-10 h-10 rounded overflow-hidden border border-slate-600">
              {currentCharImage ? (
                <img 
                  src={currentCharImage}
                  alt="current"
                  className="w-full h-full object-cover object-top"
                  title={`Visibile ora: ${currentVisibleChar?.nomepersonaggio}`}
                />
              ) : noAvatarImage ? (
                <img 
                  src={noAvatarImage}
                  alt="no avatar"
                  className="w-full h-full object-cover object-top"
                  title="Nessun personaggio visibile"
                />
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center" title="Nessun personaggio visibile">
                  <span className="text-xs text-gray-500">∅</span>
                </div>
              )}
            </div>
            <span className="text-gray-500">→</span>
            {/* Immagine del personaggio che parlerà */}
            <div className="w-10 h-10 rounded overflow-hidden border border-slate-600">
              {selectedCharacterImage ? (
                <img 
                  src={selectedCharacterImage}
                  alt={block.parameters?.character || ''}
                  className="w-full h-full object-cover object-top"
                  title={`Parlerà: ${block.parameters?.character}`}
                />
              ) : noAvatarImage ? (
                <img 
                  src={noAvatarImage}
                  alt="no avatar"
                  className="w-full h-full object-cover object-top"
                  title="Seleziona un personaggio"
                />
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center" title="Seleziona un personaggio">
                  <span className="text-xs text-gray-500">?</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // Solo testo senza personaggio
    return (
      <div className="flex items-center gap-2 w-full">
        <span className="text-gray-500 italic">
          {t('visualFlowEditor.blocks.sayChar.noCharacter')}:
        </span>
        <span className="truncate max-w-[250px] text-gray-300" title={text}>
          "{text}"
        </span>
      </div>
    );
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
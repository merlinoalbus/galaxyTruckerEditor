import React, { useState, useEffect, useRef, useMemo } from 'react';
import { API_CONFIG } from '@/config/constants';
import { MessageSquare, ArrowRight, ExternalLink } from 'lucide-react';
import Emoji from '@/components/Emoji/Emoji';
import { StackedEmoji } from '@/components/Emoji/StackedEmoji';
import { CMD_EMOJI } from '@/components/Emoji/cmdEmojiMap';
import { BaseBlock } from '../BaseBlock/BaseBlock';
import { SelectWithModal } from '../../SelectWithModal/SelectWithModal';
import { MultilingualTextEditor } from '../../MultilingualTextEditor';
import { CharacterSelector } from '../../CharacterSelector';
import { NodeSelector } from '../../NodeSelector/NodeSelector';
import { getBlockClassName } from '@/utils/CampaignEditor/VisualFlowEditor/blockColors';
import { useTranslation } from '@/locales';
import { useLanguage } from '@/contexts/LanguageContext';
import { SceneDebugButton } from '../../SceneDebugButton';
import { CharacterAvatar } from '../../CharacterAvatar';
import { simulateSceneExecution, getLastModifiedVisibleCharacter } from '@/utils/CampaignEditor/VisualFlowEditor/sceneSimulation';
import { imagesViewService } from '@/services/CampaignEditor/VariablesSystem/services/ImagesView/imagesViewService';
import { interactiveMapService } from '@/services/CampaignEditor/InteractiveMap/interactiveMapService';
import type { Mission } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { PercentageInput } from '../../PercentageInput';
import { useButtonsList } from '@/hooks/CampaignEditor/VisualFlowEditor/useButtonsList';
import { getLocalizedString } from '@/utils/localization';
import { ImageSelector } from '../../ImageSelector/ImageSelector';
import type { IFlowBlock, BlockUpdate } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';
import type { Character } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';

interface CommandBlockProps {
  block: IFlowBlock;
  onUpdate: (updates: BlockUpdate) => void;
  onRemove?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  sessionData?: any;
  isInvalid?: boolean;
  validationType?: 'error' | 'warning';
  onGoToLabel?: (labelName: string) => void;
  onNavigateToSubScript?: (scriptName: string, parentBlock: IFlowBlock) => void;
  onNavigateToMission?: (missionName: string, parentBlock: IFlowBlock) => void;
  allBlocks?: IFlowBlock[];
  collapseAllTrigger?: number;
  expandAllTrigger?: number;
  globalCollapseState?: 'collapsed' | 'expanded' | 'manual';
  isCustom?: boolean;
  availableLanguages?: string[];
}

export const CommandBlock: React.FC<CommandBlockProps> = ({
  block,
  onUpdate,
  onRemove,
  onDragStart,
  sessionData,
  isInvalid = false,
  validationType,
  onGoToLabel,
  onNavigateToSubScript,
  onNavigateToMission,
  allBlocks = [],
  collapseAllTrigger = 0,
  expandAllTrigger = 0,
  globalCollapseState = 'manual',
  isCustom,
  availableLanguages
}) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  // Stato per collapse/expand - rispetta il globalCollapseState all'inizializzazione
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Command blocks default collapsed, ma rispetta lo stato globale
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
  
  // I characters vengono passati da sessionData, non caricati qui (memo per deps stabili)
  const characters = useMemo(() => sessionData?.characters || [], [sessionData?.characters]);
  // Missions (used as routes list) - load once when needed
  const [missionsList, setMissionsList] = useState<Mission[] | null>(null);
  const [selectedCharacterImage, setSelectedCharacterImage] = useState<string | null>(null);
  const [characterImages, setCharacterImages] = useState<Record<string, string>>({});
  const [noAvatarImage, setNoAvatarImage] = useState<string | null>(null);
  
  // Load buttons list for SHOWBUTTON/HIDEBUTTON commands
  const { buttons, isLoading: buttonsLoading, error: buttonsError, getButtonsForSelect } = useButtonsList();
  
  // Calcola lo stato simulato della scena fino a questo blocco
  const simulatedSceneState = useMemo(() => {
    if (!allBlocks || allBlocks.length === 0) return null;
    return simulateSceneExecution(allBlocks, block.id, characters);
  }, [allBlocks, block.id, characters]);
  
  // Costruisci la mappa delle immagini dai characters e carica no_avatar per SHOWCHAR/HIDECHAR
  useEffect(() => {
    if (block.type === 'SHOWCHAR' || block.type === 'HIDECHAR') {
      // Costruisci la mappa delle immagini dai dati già presenti
      const images: Record<string, string> = {};
      for (const char of characters) {
        if (char.immaginebase?.binary) {
          images[char.nomepersonaggio] = `data:image/png;base64,${char.immaginebase.binary}`;
        } else if (char.listaimmagini?.[0]?.binary) {
          images[char.nomepersonaggio] = `data:image/png;base64,${char.listaimmagini[0].binary}`;
        }
      }
      setCharacterImages(images);
      
      // Carica no_avatar una volta sola
  imagesViewService.getImageBinary(['no_avatar.png']).then(noAvatarResponse => {
        if (noAvatarResponse?.data?.[0]?.binary) {
          setNoAvatarImage(`data:image/png;base64,${noAvatarResponse.data[0].binary}`);
        }
  }).catch(() => {});
    }
  }, [block.type, characters]);
  
  // Aggiorna l'immagine del personaggio selezionato
  useEffect(() => {
    if ((block.type === 'SHOWCHAR' || block.type === 'HIDECHAR') && block.parameters?.character) {
      // Usa l'immagine già caricata dalla mappa
      setSelectedCharacterImage(characterImages[block.parameters.character] || null);
    } else {
      setSelectedCharacterImage(null);
    }
  }, [block.type, block.parameters?.character, characterImages]);

  // Load missions (routes) lazily for route-based commands
  useEffect(() => {
    let mounted = true;
    if (['SHOWPATH', 'HIDEPATH', 'CENTERMAPBYPATH'].includes(block.type) && !missionsList) {
      interactiveMapService.loadMissions().then((m) => {
        if (mounted) setMissionsList(m || []);
      }).catch(() => {
        if (mounted) setMissionsList([]);
      });
    }
    return () => { mounted = false; };
  }, [block.type, missionsList]);
  
  // NON USARE useEffect per aggiornare la scena - non funziona con componenti separati
  // La scena deve essere gestita a livello superiore con esecuzione sequenziale
  
  // Auto-collapse se lo spazio è insufficiente (ma non se l'utente ha espanso manualmente)
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      // Throttle con requestAnimationFrame per evitare DOM reads troppo frequenti
      requestAnimationFrame(() => {
        for (const entry of entries) {
          const { width } = entry.contentRect;
          
          // Solo auto-collapse se non è stato espanso manualmente e non è già collapsed
          if (!isManuallyExpanded && !isCollapsed) {
            // Calcola lo spazio minimo necessario per CommandBlock
            // Icon(40px) + Label(80px) + padding(60px) = ~180px minimo
            const minRequiredWidth = 300;
            
            // Se larghezza insufficiente, collapse automaticamente
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
  // Rimuovo isCollapsed dalle dipendenze per evitare loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManuallyExpanded]);

  // Icona del blocco definita in alto per favorire i test che cercano i case espliciti
  const getBlockIcon = () => {
    switch (block.type) {
      case 'SHOWDLGSCENE':
        return <Emoji text="🗨️" className="text-2xl leading-none inline-block align-middle" />;
      case 'HIDEDLGSCENE':
        return <Emoji text="🫥" className="text-2xl leading-none inline-block align-middle" />;
      default: {
        const emoji = CMD_EMOJI[block.type as keyof typeof CMD_EMOJI];
        if (emoji) {
          // Estrae solo i caratteri emoji (Unicode property Emoji)
          const emojiArr = Array.from(emoji).filter(e => /\p{Emoji}/u.test(e));
          if (emojiArr.length > 1) {
            return <StackedEmoji emojis={emojiArr} size={20} className="inline-block align-middle" />;
          }
          return <Emoji text={emoji} className="text-2xl leading-none inline-block align-middle" />;
        }
        return <MessageSquare className="w-4 h-4" />;
      }
    }
  };
  const renderParameters = () => {
    switch (block.type) {
      // MAP COMMANDS WITH NODE SELECTOR
      case 'SHOWNODE':
      case 'HIDENODE':
      case 'ADDNODE':
      case 'SETNODEKNOWN':
      case 'CENTERMAPBYNODE':
      case 'MOVEPLAYERTONODE': {
        return (
          <div style={{ height: '160px' }}>
                <NodeSelector
                  value={block.parameters?.node || ''}
                  onChange={(nodeName) => onUpdate({ parameters: { ...block.parameters, node: nodeName } })}
                  nodes={sessionData?.nodes}
                  className="h-full w-full"
                  forceColumns={10}
                />
          </div>
        );
        }
        // MAP COMMANDS WITH ROUTE SELECTOR
        case 'SHOWPATH':
        case 'HIDEPATH':
        case 'CENTERMAPBYPATH': {
          // Build items as structured {key,label} using missionsList (route key = mission.name)
          const items = (missionsList || []).map(m => ({ key: m.name, label: getLocalizedString(m.localizedCaptions || {}, currentLanguage, m.name) }));
          return (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 whitespace-nowrap">
                {(t as any)('visualFlowEditor.blocks.map.route')}:
              </label>
              <SelectWithModal
                type="mission"
                value={String(block.parameters?.route || '')}
                onChange={(value) => onUpdate({ parameters: { ...block.parameters, route: value } })}
                placeholder={(t as any)('visualFlowEditor.command.selectRoute')}
                availableItems={items}
                onAddItem={undefined}
                className="flex-1"
              />
            </div>
          );
        }
        case 'HIDEALLPATHS': {
          // Two NodeSelectors side-by-side with mutual exclusion and None option
          return (
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="text-xs text-slate-400">{(t as any)('visualFlowEditor.blocks.map.node1')}</label>
                <NodeSelector
                  value={String(block.parameters?.node1 || '')}
                  onChange={(nodeName) => {
                    // If selecting same as node2, clear node2 to enforce mutual exclusion
                    const node2 = block.parameters?.node2 || '';
                    const updates: any = { ...block.parameters, node1: nodeName };
                    if (nodeName && nodeName === node2) {
                      updates.node2 = '';
                    }
                    // If 'None' (empty string), remove the parameter
                    if (!nodeName) delete updates.node1;
                    onUpdate({ parameters: updates });
                  }}
                  nodes={sessionData?.nodes}
                  excludeNodes={block.parameters?.node2 ? [String(block.parameters.node2)] : []}
                  className="h-48"
                />
              </div>
              <div className="w-1/2">
                <label className="text-xs text-slate-400">{(t as any)('visualFlowEditor.blocks.map.node2')}</label>
                <NodeSelector
                  value={String(block.parameters?.node2 || '')}
                  onChange={(nodeName) => {
                    const node1 = block.parameters?.node1 || '';
                    const updates: any = { ...block.parameters, node2: nodeName };
                    if (nodeName && nodeName === node1) {
                      updates.node1 = '';
                    }
                    if (!nodeName) delete updates.node2;
                    onUpdate({ parameters: updates });
                  }}
                  nodes={sessionData?.nodes}
                  excludeNodes={block.parameters?.node1 ? [String(block.parameters.node1)] : []}
                  className="h-48"
                />
              </div>
            </div>
          );
        }
        // MAP COMMANDS WITH BUTTON SELECTOR
        case 'SHOWBUTTON':
        case 'HIDEBUTTON':
        case 'SETFOCUS':
        case 'RESETFOCUS': {
          const items = getButtonsForSelect();
          
          return (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 whitespace-nowrap">
                {(t as any)('visualFlowEditor.blocks.map.button')}:
              </label>
              <SelectWithModal
                type="parts"
                value={String(block.parameters?.button || '')}
                onChange={(value) => onUpdate({ parameters: { ...block.parameters, button: value } })}
                placeholder={(t as any)('visualFlowEditor.command.selectButton')}
                availableItems={items}
                onAddItem={undefined}
                className="flex-1"
              />
            </div>
          );
        }
        case 'SETFOCUSIFCREDITS': {
          const items = getButtonsForSelect();
          
          return (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-300 whitespace-nowrap">
                  {(t as any)('visualFlowEditor.blocks.map.button')}:
                </label>
                <div className="flex-1">
                  <SelectWithModal
                    type="parts"
                    value={String(block.parameters?.button || '')}
                    onChange={(value) => onUpdate({ parameters: { ...block.parameters, button: value } })}
                    placeholder={(t as any)('visualFlowEditor.command.selectButton')}
                    availableItems={items}
                    onAddItem={undefined}
                  />
                </div>
                <label className="text-sm font-medium text-gray-300 whitespace-nowrap">
                  Crediti Minimi:
                </label>
                <div className="w-32">
                  <input
                    type="number"
                    className="w-full bg-slate-800/50 text-white px-2 py-1 rounded text-sm border border-slate-700 focus:border-blue-600 focus:outline-none"
                    placeholder="0"
                    value={block.parameters?.credits !== undefined ? String(block.parameters.credits) : ''}
                    min="0"
                    onChange={(e) => {
                      const numValue = parseInt(e.target.value, 10);
                      onUpdate({ 
                        parameters: { 
                          ...block.parameters, 
                          credits: isNaN(numValue) ? undefined : numValue 
                        } 
                      });
                    }}
                  />
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                Imposta il focus su un bottone solo se il giocatore ha almeno i crediti specificati
              </div>
            </div>
          );
        }
      case 'ADDINFOWINDOW':
      case 'SHOWINFOWINDOW': {
        return (
          <div className="flex gap-2" style={{ height: '190px' }}>
            <div className="flex-1">
              <ImageSelector
                value={block.parameters?.image || ''}
                onChange={(image) => {
                  onUpdate({ 
                    parameters: { ...block.parameters, image } 
                  });
                }}
                className="h-full"
              />
            </div>
          </div>
        );
      }
      case 'SHOWHELPIMAGE': {
        // Campo con label e esempio valorizzazione, validazione gestita dal sistema standard
        return (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400">
              Parametri immagine (esempio: "40 50 70 campaign/tutorial-purple.png")
            </label>
            <input
              type="text"
              className="w-full p-2 bg-slate-800 text-white rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none"
              placeholder="40 50 70 campaign/tutorial-purple.png"
              value={block.parameters?.params || ''}
              onChange={e => onUpdate({ parameters: { ...block.parameters, params: e.target.value } })}
              onClick={e => e.stopPropagation()}
            />
          </div>
        );
      }
      case 'SAY':
      case 'ASK': {
        // Usa lo stato simulato per trovare l'ultimo personaggio modificato
        const lastCharacter = simulatedSceneState ? getLastModifiedVisibleCharacter(simulatedSceneState) : null;
        
        const isLeftPosition = lastCharacter?.posizione === 'left';
        
        const textEditor = (
          <MultilingualTextEditor
            value={typeof block.parameters?.text === 'string' 
              ? { EN: block.parameters.text } 
              : (block.parameters?.text || {})}
            onChange={(text) => onUpdate({ 
              parameters: { ...block.parameters, text } 
            })}
            placeholder={block.type === 'SAY' 
              ? t('visualFlowEditor.command.dialogText')
              : t('visualFlowEditor.command.questionText')}
            isCustom={isCustom}
            availableLanguages={availableLanguages}
            label={block.type === 'ASK' ? t('visualFlowEditor.command.questionLabel') : ""}
          />
        );
        
        return (
          <div className="flex items-start gap-3">
            {isLeftPosition && (
              <div className="flex-shrink-0">
                <CharacterAvatar size="large" character={lastCharacter} />
              </div>
            )}
            <div className="flex-1">
              {textEditor}
            </div>
            {!isLeftPosition && (
              <div className="flex-shrink-0">
                <CharacterAvatar size="large" character={lastCharacter} />
              </div>
            )}
          </div>
        );
      }
      
      case 'DELAY':
        return (
          <div className="space-y-2">
            <label className="block text-xs text-slate-400">
              {t('visualFlowEditor.blocks.delay.duration')}
            </label>
            <input
              type="number"
              className="w-full p-2 bg-slate-800 text-white rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none"
              placeholder={t('visualFlowEditor.command.milliseconds')}
              value={block.parameters?.duration || ''}
              onChange={(e) => onUpdate({ 
                parameters: { ...block.parameters, duration: parseInt(e.target.value) } 
              })}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="block text-xs text-slate-500">
              {t('visualFlowEditor.blocks.delay.hint')}
            </span>
          </div>
        );
      
      case 'GO':
        return (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">
              {t('visualFlowEditor.blocks.go.anchor')}
            </label>
            <SelectWithModal
              type="label"
              value={block.parameters?.label || ''}
              onChange={(value) => onUpdate({ 
                parameters: { ...block.parameters, label: value } 
              })}
              placeholder={t('visualFlowEditor.command.selectLabel')}
              availableItems={sessionData?.scriptLabels || []}
              onAddItem={undefined} // Non permettere aggiunta di nuove label
              className="flex-1"
            />
            {block.parameters?.label && onGoToLabel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (block.parameters?.label) onGoToLabel(block.parameters.label);
                }}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                title={t('visualFlowEditor.blocks.go.goToLabel')}
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      
      case 'LABEL':
        return (
          <div className="space-y-2">
            <label className="block text-xs text-slate-400">
              {t('visualFlowEditor.blocks.label.anchorName')}
            </label>
            <SelectWithModal
              type="label"
              value={(block.parameters?.name as string) || ''}
              onChange={(value) => {
                // Rimuovi spazi dal nome
                const cleanedValue = value.replace(/\s+/g, '');
                onUpdate({ 
                  parameters: { ...block.parameters, name: cleanedValue } 
                });
                // Aggiungi automaticamente la label quando viene definita
                if (cleanedValue && sessionData?.addLabel && !sessionData?.labels?.includes(cleanedValue)) {
                  sessionData.addLabel(cleanedValue);
                }
              }}
              placeholder={t('visualFlowEditor.command.labelName')}
              availableItems={sessionData?.labels || []}
              onAddItem={(newLabel) => {
                // Rimuovi spazi dal nome quando si aggiunge una nuova label
                const cleanedLabel = newLabel.replace(/\s+/g, '');
                if (cleanedLabel && sessionData?.addLabel) {
                  sessionData.addLabel(cleanedLabel);
                  onUpdate({ 
                    parameters: { ...block.parameters, name: cleanedLabel } 
                  });
                }
              }}
              className="w-full"
            />
            <span className="block text-xs text-slate-500">
              {t('visualFlowEditor.blocks.label.hint')}
            </span>
          </div>
        );
      
      case 'SETDECKPREPARATIONSCRIPT':
      case 'SETFLIGHTDECKPREPARATIONSCRIPT':
        return (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">
              {t('visualFlowEditor.blocks.subScript.scriptName')}:
            </label>
            <SelectWithModal
              type="script"
              value={block.parameters?.script || ''}
              onChange={(value) => onUpdate({ 
                parameters: { ...block.parameters, script: value } 
              })}
              placeholder={t('visualFlowEditor.command.selectScript')}
              availableItems={(sessionData?.availableScripts?.map((s: any) => s.name) || []).filter((name: string) => {
                const norm = (name || '').replace(/\.txt$/i, '');
                const current = (sessionData?.currentScriptName || '').replace(/\.txt$/i, '');
                return name && norm !== current;
              })}
              onAddItem={undefined}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => {
                if (block.parameters?.script && onNavigateToSubScript) {
                  onNavigateToSubScript(block.parameters.script, block);
                }
              }}
              disabled={!block.parameters?.script}
              className="p-1 hover:bg-slate-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('visualFlowEditor.blocks.subScript.navigate')}
            >
              <ArrowRight className="w-4 h-4 text-blue-400" />
            </button>
          </div>
        );
      
  case 'SUB_SCRIPT':
        return (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">
              {t('visualFlowEditor.blocks.subScript.scriptName')}:
            </label>
            <SelectWithModal
              type="script"
              value={block.parameters?.script || ''}
              onChange={(value) => onUpdate({ 
                parameters: { ...block.parameters, script: value } 
              })}
              placeholder={t('visualFlowEditor.command.selectScript')}
              availableItems={(sessionData?.availableScripts?.map((s: any) => s.name) || []).filter((name: string) => {
                const norm = (name || '').replace(/\.txt$/i, '');
                const current = (sessionData?.currentScriptName || '').replace(/\.txt$/i, '');
                return name && norm !== current;
              })}
              onAddItem={undefined} // Non permettere aggiunta di nuovi script
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => {
                if (block.parameters?.script && onNavigateToSubScript) {
                  onNavigateToSubScript(block.parameters.script, block);
                }
              }}
              disabled={!block.parameters?.script}
              className="p-1 hover:bg-slate-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('visualFlowEditor.blocks.subScript.navigate')}
            >
              <ArrowRight className="w-4 h-4 text-blue-400" />
            </button>
          </div>
        );
      
  case 'ACT_MISSION':
        return (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">
              {t('visualFlowEditor.blocks.actMission.missionName')}:
            </label>
            <SelectWithModal
              type="mission"
              value={block.parameters?.mission || ''}
              onChange={(value) => onUpdate({ 
                parameters: { ...block.parameters, mission: value } 
              })}
              placeholder={t('visualFlowEditor.select.selectMission')}
              availableItems={(sessionData?.missions || []).filter((name: string) => {
                const norm = (name || '').replace(/\.txt$/i, '');
                const current = (sessionData?.currentMissionName || '').replace(/\.txt$/i, '');
                return name && norm !== current;
              })}
              onAddItem={undefined} // Non permettere aggiunta di nuove mission
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => {
                if (block.parameters?.mission && onNavigateToMission) {
                  onNavigateToMission(block.parameters.mission, block);
                }
              }}
              disabled={!block.parameters?.mission}
              className="p-1 hover:bg-slate-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('visualFlowEditor.blocks.actMission.navigate')}
            >
              <ArrowRight className="w-4 h-4 text-blue-400" />
            </button>
          </div>
        );
      
      case 'EXIT_MENU':
        return (
          <div className="space-y-2">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-gray-300 leading-relaxed">
                {t('visualFlowEditor.blocks.exitMenu.fullDescription')}
              </p>
            </div>
          </div>
        );
      case 'SETTURNBASED':
        return (
          <div className="space-y-2">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-gray-300 leading-relaxed">
                {t('visualFlowEditor.blocks.setTurnBased.fullDescription')}
              </p>
            </div>
          </div>
        );
      case 'SETMISSIONASFAILED':
        return (
          <div className="space-y-2">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-gray-300 leading-relaxed">
                {t('visualFlowEditor.blocks.setMissionAsFailed.fullDescription')}
              </p>
            </div>
          </div>
        );
      case 'SETMISSIONASCOMPLETED':
        return (
          <div className="space-y-2">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-gray-300 leading-relaxed">
                {t('visualFlowEditor.blocks.setMissionAsCompleted.fullDescription')}
              </p>
            </div>
          </div>
        );
      case 'ALLSHIPSGIVEUP':
        return (
          <div className="space-y-2">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-gray-300 leading-relaxed">
                {t('visualFlowEditor.blocks.allShipsGiveUp.fullDescription')}
              </p>
            </div>
          </div>
        );
      case 'GIVEUPFLIGHT':
        return (
          <div className="space-y-2">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-gray-300 leading-relaxed">
                {t('visualFlowEditor.blocks.giveUpFlight.fullDescription')}
              </p>
            </div>
          </div>
        );
      
      case 'SHOWDLGSCENE':
        return (
          <div className="space-y-2">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-gray-300 leading-relaxed">
                {t('visualFlowEditor.blocks.showDlgScene.fullDescription')}
              </p>
            </div>
          </div>
        );
      
      case 'HIDEDLGSCENE':
        return (
          <div className="space-y-2">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-gray-300 leading-relaxed">
                {t('visualFlowEditor.blocks.hideDlgScene.fullDescription')}
              </p>
            </div>
          </div>
        );
      
      case 'SHOWCHAR': {
        return (
          <div className="flex gap-2" style={{ height: '190px' }}>
            {/* Character selector - metà sinistra con griglia 5 colonne */}
            <div className="flex-2">
              <CharacterSelector
                value={block.parameters?.character || ''}
                onChange={(character) => {
                  onUpdate({ 
                    parameters: { ...block.parameters, character } 
                  });
                }}
                mode="show"
                className="h-full"
                characters={characters}
                simulatedSceneState={simulatedSceneState}
              />
            </div>
            
            {/* Position selector - metà destra, compatto */}
            <div className="flex-1">
              <div className="rounded p-2 h-full flex flex-col">
                <div className="text-xs text-gray-400 mb-1 text-center">{t('visualFlowEditor.blocks.showChar.position')}</div>
                <div className="relative flex-1 flex items-center justify-center">
                  <div className=" bg-slate-800 border border-slate-600  relative" style={{ width: '120px', height: '120px' }}>
                    {/* Layout visuale delle posizioni - pulsanti compatti */}
                    <button
                      onClick={() => onUpdate({ parameters: { ...block.parameters, position: 'lefttop' } })}
                      className={`absolute top-1 left-1  w-8 h-8 rounded text-sm font-bold ${
                        block.parameters?.position === 'lefttop' 
                          ? 'bg-purple-600 text-white shadow-lg' 
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      } transition-all`}
                      title="Top-Left"
                    >
                      ↖
                    </button>
                    <button
                      onClick={() => onUpdate({ parameters: { ...block.parameters, position: 'top' } })}
                      className={`absolute top-1 left-1/2 -translate-x-1/2 w-8 h-8 rounded text-sm font-bold ${
                        block.parameters?.position === 'top' 
                          ? 'bg-purple-600 text-white shadow-lg' 
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      } transition-all`}
                      title="Top"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => onUpdate({ parameters: { ...block.parameters, position: 'righttop' } })}
                      className={`absolute top-1 right-1 w-8 h-8 rounded text-sm font-bold ${
                        block.parameters?.position === 'righttop' 
                          ? 'bg-purple-600 text-white shadow-lg' 
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      } transition-all`}
                      title="Top-Right"
                    >
                      ↗
                    </button>
                    <button
                      onClick={() => onUpdate({ parameters: { ...block.parameters, position: 'left' } })}
                      className={`absolute top-1/2 -translate-y-1/2 left-1 w-8 h-8 rounded text-sm font-bold ${
                        block.parameters?.position === 'left' 
                          ? 'bg-purple-600 text-white shadow-lg' 
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      } transition-all`}
                      title="Left"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => onUpdate({ parameters: { ...block.parameters, position: 'right' } })}
                      className={`absolute top-1/2 -translate-y-1/2 right-1 w-8 h-8 rounded text-sm font-bold ${
                        block.parameters?.position === 'right' 
                          ? 'bg-purple-600 text-white shadow-lg' 
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      } transition-all`}
                      title="Right"
                    >
                      →
                    </button>
                    <button
                      onClick={() => onUpdate({ parameters: { ...block.parameters, position: 'leftbottom' } })}
                      className={`absolute bottom-1 left-1 w-8 h-8 rounded text-sm font-bold ${
                        block.parameters?.position === 'leftbottom' 
                          ? 'bg-purple-600 text-white shadow-lg' 
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      } transition-all`}
                      title="Bottom-Left"
                    >
                      ↙
                    </button>
                    <button
                      onClick={() => onUpdate({ parameters: { ...block.parameters, position: 'bottom' } })}
                      className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 rounded text-sm font-bold ${
                        block.parameters?.position === 'bottom' 
                          ? 'bg-purple-600 text-white shadow-lg' 
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      } transition-all`}
                      title="Bottom"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => onUpdate({ parameters: { ...block.parameters, position: 'rightbottom' } })}
                      className={`absolute bottom-1 right-1 w-8 h-8 rounded text-sm font-bold ${
                        block.parameters?.position === 'rightbottom' 
                          ? 'bg-purple-600 text-white shadow-lg' 
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      } transition-all`}
                      title="Bottom-Right"
                    >
                      ↘
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      
      case 'HIDECHAR':
        return (
          <div className="flex gap-2" style={{ height: '180px' }}>
            {/* Character selector - occupa tutto lo spazio disponibile (nessun position selector) */}
            <CharacterSelector
              value={block.parameters?.character || ''}
              onChange={(character) => {
                onUpdate({ 
                  parameters: { ...block.parameters, character } 
                });
              }}
              mode="hide"
              className="h-full w-full"
              characters={characters}
              simulatedSceneState={simulatedSceneState}
            />
          </div>
        );
      
      case 'ADDOPPONENT':
        return (
          <div style={{ height: '140px' }}>
            <CharacterSelector
              value={block.parameters?.character || ''}
              onChange={(character) => {
                onUpdate({ 
                  parameters: { ...block.parameters, character } 
                });
              }}
              mode="show"
              className="h-full w-full"
              characters={characters}
              forceColumns={12}
            />
          </div>
        );
      
      case 'SETSHIPTYPE':
        return (
          <div className="flex justify-center items-center py-4 gap-[5px]">
            {['STI', 'STII', 'STIII'].map((shipClass) => {
              const isSelected = block.parameters?.type === shipClass;
              const romanNumeral = shipClass.replace('ST', '');
              const shipImage = `${API_CONFIG.BE_BASE_URL}/api/file/campaign/campaignMap/ship${romanNumeral}.cacheship.png`;
              
              return (
                <div
                  key={shipClass}
                  onClick={() => onUpdate({ 
                    parameters: { ...block.parameters, type: shipClass } 
                  })}
                  className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-900/30 scale-105' 
                      : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <img 
                      src={shipImage}
                      alt={`Class ${romanNumeral}`}
                      className="w-16 h-16 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = `${API_CONFIG.BE_BASE_URL}/static/common/unknown.png`;
                      }}
                    />
                    <span className={`text-xs font-medium ${
                      isSelected ? 'text-blue-300' : 'text-slate-400'
                    }`}>
                      {romanNumeral === 'I' ? t('visualFlowEditor.command.shipClassI') :
                       romanNumeral === 'II' ? t('visualFlowEditor.command.shipClassII') :
                       t('visualFlowEditor.command.shipClassIII')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'SETSPECCONDITION': {
    // Lista fissa approvata
    const knownConditions = [
      'bet',
      'booze',
      'explosives',
      'FinalRace',
      'ingots',
      'merchantProtect',
      'Noone',
      'OnlyLoser',
      'OnlyWinner',
      'peopleDelivery',
      'pirateEscort',
      'purplealien',
      'radioactive',
      'specTiles',
      'tilesBet'
    ];
        return (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">
              {t('visualFlowEditor.blocks.setSpecCondition.condition')}
            </label>
            <SelectWithModal
      type="label"
              value={block.parameters?.condition || ''}
              onChange={(value) => onUpdate({ parameters: { ...block.parameters, condition: value } })}
              placeholder={t('visualFlowEditor.command.selectCondition')}
              availableItems={knownConditions}
              className="flex-1"
            />
          </div>
        );
      }
      
      case 'MODIFYOPPONENTSBUILDSPEED':
        return (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">
              {t('visualFlowEditor.blocks.modifyOpponentsBuildSpeed.percentage')}
            </label>
            <PercentageInput
              value={typeof block.parameters?.percentage === 'number' ? block.parameters.percentage : undefined}
              onChange={(value) => onUpdate({ 
                parameters: { ...block.parameters, percentage: value } 
              })}
              min={1}
              max={200}
              placeholder="60"
              className="flex-1"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      
      default:
        // Gestione generica per tutti i blocchi non implementati
        // Mostra tutti i parametri dinamicamente
        const params = block.parameters || {};
        const paramEntries = Object.entries(params);
        
        if (paramEntries.length === 0) {
          return (
            <div className="text-xs text-gray-500 italic">
              No parameters
            </div>
          );
        }
        
        return (
          <div className="space-y-2">
            {paramEntries.map(([key, value]) => {
              // Controlla se è un parametro multilingua (ha una struttura { EN: ..., DE: ..., etc })
              const isMultilingual = typeof value === 'object' && 
                value !== null && 
                !Array.isArray(value) &&
                Object.keys(value).some(k => ['EN', 'DE', 'FR', 'ES', 'PL', 'CS', 'RU'].includes(k));
              
              if (isMultilingual) {
                // Usa MultilingualTextEditor per parametri multilingua
                return (
                  <div key={key} className="flex items-center gap-2">
                    <label className="text-xs text-gray-400 capitalize whitespace-nowrap min-w-[80px]">
                      {key.replace(/_/g, ' ')}:
                    </label>
                    <div className="flex-1">
                      <MultilingualTextEditor
                        value={value as any}
                        onChange={(newValue) => onUpdate({ 
                          parameters: { ...block.parameters, [key]: newValue } 
                        })}
                        placeholder={`${key} value`}
                        isCustom={isCustom}
                        availableLanguages={availableLanguages}
                      />
                    </div>
                  </div>
                );
              } else {
                // Usa input normale per parametri semplici (1 riga)
                return (
                  <div key={key} className="flex items-center gap-2">
                    <label className="text-xs text-gray-400 capitalize whitespace-nowrap min-w-[80px]">
                      {key.replace(/_/g, ' ')}:
                    </label>
                    <input
                      type="text"
                      className="flex-1 px-2 py-1 bg-slate-800 text-white rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none"
                      placeholder={`${key} value`}
                      value={typeof value === 'object' ? JSON.stringify(value) : String(value || '')}
                      onChange={(e) => {
                        let newValue: any = e.target.value;
                        // Prova a parsare come JSON se sembra JSON
                        if (e.target.value.trim().startsWith('{') || e.target.value.trim().startsWith('[')) {
                          try {
                            newValue = JSON.parse(e.target.value);
                          } catch {
                            // Se fallisce, mantieni come stringa
                          }
                        }
                        onUpdate({ 
                          parameters: { ...block.parameters, [key]: newValue } 
                        });
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                );
              }
            })}
          </div>
        );
    }
  };


  // (definizione unica spostata in alto)

  // Genera i parametri compatti per la visualizzazione collapsed
  const getCompactParams = () => {
    switch (block.type) {
      case 'SAY':
        if (block.parameters?.text) {
          let text = '';
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
          return (
            <span className="truncate max-w-[300px]" title={text}>
              "{text}"
            </span>
          );
        }
        break;
      case 'DELAY':
        if (block.parameters?.duration) {
          return <span>{block.parameters.duration}ms</span>;
        }
        break;
      case 'GO':
        if (block.parameters?.label) {
          return (
            <div className="flex items-center gap-2">
              <span>→ {block.parameters.label}</span>
              {onGoToLabel && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (block.parameters?.label) onGoToLabel(block.parameters.label);
                  }}
                  className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                  title={t('visualFlowEditor.blocks.go.goToLabel')}
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        }
        break;
      case 'LABEL':
        if (block.parameters?.name) {
          return <span>[{block.parameters.name}]</span>;
        }
        break;
      case 'ASK':
        if (block.parameters?.text) {
          let text = '';
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
          return (
            <span className="truncate max-w-[300px]" title={text}>
              "{text}"
            </span>
          );
        }
        break;
      case 'SUB_SCRIPT':
        if (block.parameters?.script) {
          return <span>📄 {block.parameters.script}</span>;
        }
        break;
      case 'ACT_MISSION':
        if (block.parameters?.mission) {
          return (
            <div className="flex items-center gap-2">
              <span>🎬 {block.parameters.mission}</span>
              {onNavigateToMission && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (block.parameters?.mission) onNavigateToMission(block.parameters.mission, block);
                  }}
                  className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                  title={t('visualFlowEditor.blocks.actMission.navigate')}
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        }
        break;
      case 'EXIT_MENU':
        return <span className="text-xs text-gray-400">{t('visualFlowEditor.blocks.exitMenu.compact')}</span>;
      case 'SETTURNBASED':
        return <span className="text-xs text-gray-400">{t('visualFlowEditor.blocks.setTurnBased.compact')}</span>;
      case 'SETMISSIONASFAILED':
        return <span className="text-xs text-gray-400">{t('visualFlowEditor.blocks.setMissionAsFailed.compact')}</span>;
      case 'SETMISSIONASCOMPLETED':
        return <span className="text-xs text-gray-400">{t('visualFlowEditor.blocks.setMissionAsCompleted.compact')}</span>;
      case 'ALLSHIPSGIVEUP':
        return <span className="text-xs text-gray-400">{t('visualFlowEditor.blocks.allShipsGiveUp.compact')}</span>;
      case 'GIVEUPFLIGHT':
        return <span className="text-xs text-gray-400">{t('visualFlowEditor.blocks.giveUpFlight.compact')}</span>;
      case 'SHOWDLGSCENE':
        return <span className="text-xs text-gray-400">{t('visualFlowEditor.blocks.showDlgScene.compact')}</span>;
      case 'HIDEDLGSCENE':
        return <span className="text-xs text-gray-400">{t('visualFlowEditor.blocks.hideDlgScene.compact')}</span>;
      case 'SHOWCHAR': {
        if (block.parameters?.character) {
          // Trova il personaggio che è attualmente nella posizione specificata
          const position = block.parameters.position || 'left';
          let charInPosition = null;
          let currentCharImage = null;
          
          if (simulatedSceneState?.currentScene) {
            // Trova il personaggio visibile nella posizione specificata
            charInPosition = simulatedSceneState.currentScene.personaggi.find(
              p => p.posizione === position && p.visible
            );
            
            if (charInPosition && charInPosition.lastImmagine?.binary) {
              currentCharImage = `data:image/png;base64,${charInPosition.lastImmagine.binary}`;
            }
          }
          
          return (
            <div className="flex items-center justify-between gap-2 w-full bg-slate-800/30 rounded px-2 py-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{block.parameters!.character}</span>
                {block.parameters!.position && (
                  <span className="text-gray-600 text-xs">@{block.parameters!.position}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Immagine del personaggio attualmente in quella posizione (o no_avatar se vuota) */}
                <div className="w-10 h-10 rounded overflow-hidden border border-slate-600">
                  {currentCharImage ? (
                    <img 
                      src={currentCharImage}
                      alt="current"
                      className="w-full h-full object-cover object-top"
                      title={`In posizione ${position}: ${charInPosition?.nomepersonaggio}`}
                    />
                  ) : noAvatarImage ? (
                    <img 
                      src={noAvatarImage}
                      alt="no avatar"
                      className="w-full h-full object-cover object-top"
                      title={`Posizione ${position} vuota`}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center" title={`Posizione ${position} vuota`}>
                      <span className="text-xs text-gray-500">∅</span>
                    </div>
                  )}
                </div>
                <span className="text-gray-500">→</span>
                {/* Immagine del personaggio che verrà mostrato */}
                <div className="w-10 h-10 rounded overflow-hidden border border-slate-600">
                  {selectedCharacterImage ? (
                    <img 
                      src={selectedCharacterImage}
                      alt={block.parameters!.character}
                      className="w-full h-full object-cover object-top"
                      title={`Mostrerà: ${block.parameters!.character}`}
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
        break;
      }
      case 'HIDECHAR': {
        if (block.parameters?.character) {
          return (
            <div className="flex items-center justify-between gap-2 w-full bg-slate-800/30 rounded px-2 py-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{block.parameters!.character}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Immagine del personaggio che verrà nascosto */}
                <div className="w-10 h-10 rounded overflow-hidden border border-slate-600">
                  {selectedCharacterImage ? (
                    <img 
                      src={selectedCharacterImage}
                      alt={block.parameters!.character}
                      className="w-full h-full object-cover object-top"
                      title={`Nasconderà: ${block.parameters!.character}`}
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
                <span className="text-gray-500">→</span>
                {/* no_avatar per indicare che sarà nascosto */}
                <div className="w-10 h-10 rounded overflow-hidden border border-slate-600">
                  {noAvatarImage ? (
                    <img 
                      src={noAvatarImage}
                      alt="hidden"
                      className="w-full h-full object-cover object-top"
                      title="Diventerà nascosto"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center" title="Diventerà nascosto">
                      <span className="text-xs text-gray-500">∅</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }
        break;
      }
      case 'ADDOPPONENT': {
        if (block.parameters?.character) {
          return (
            <span className="text-gray-400">
              🎮 {block.parameters.character}
            </span>
          );
        }
        return <span className="text-xs text-gray-500 italic">No opponent</span>;
      }
      case 'SETSHIPTYPE': {
        const shipClass = String(block.parameters?.type || 'STI');
        const romanNumeral = shipClass.replace('ST', '');
        return (
          <span className="text-gray-400">
            {romanNumeral === 'I' ? t('visualFlowEditor.command.shipClassI') :
             romanNumeral === 'II' ? t('visualFlowEditor.command.shipClassII') :
             t('visualFlowEditor.command.shipClassIII')}
          </span>
        );
      }
      case 'SETDECKPREPARATIONSCRIPT': {
        if (block.parameters?.script) {
          return (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">🃏 {block.parameters.script}</span>
              {onNavigateToSubScript && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (block.parameters?.script) onNavigateToSubScript(block.parameters.script, block);
                  }}
                  className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                  title={t('visualFlowEditor.blocks.subScript.navigate')}
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        }
        break;
      }
      case 'SETFLIGHTDECKPREPARATIONSCRIPT': {
        if (block.parameters?.script) {
          return (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">🛩️ {block.parameters.script}</span>
              {onNavigateToSubScript && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (block.parameters?.script) onNavigateToSubScript(block.parameters.script, block);
                  }}
                  className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                  title={t('visualFlowEditor.blocks.subScript.navigate')}
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        }
        break;
      }
      case 'SETSPECCONDITION': {
        if (block.parameters?.condition) {
          return <span className="text-gray-400">🧩 {block.parameters.condition}</span>;
        }
        break;
      }
      case 'MODIFYOPPONENTSBUILDSPEED': {
        if (block.parameters?.percentage) {
          return <span className="text-gray-400">⚡ {String(block.parameters.percentage)}%</span>;
        }
        return <span className="text-xs text-gray-500 italic">No percentage</span>;
      }
      // Map compact summaries
      case 'SHOWNODE':
      case 'HIDENODE':
      case 'ADDNODE':
      case 'SETNODEKNOWN':
      case 'CENTERMAPBYNODE':
      case 'MOVEPLAYERTONODE': {
        const nodeName = block.parameters?.node ? String(block.parameters.node) : '';
        // Prefix localizzato
        const prefix = block.type === 'SHOWNODE' ? t('visualFlowEditor.blocks.map.compact.show') :
          block.type === 'HIDENODE' ? t('visualFlowEditor.blocks.map.compact.hide') :
          block.type === 'ADDNODE' ? t('visualFlowEditor.blocks.map.compact.add') :
          block.type === 'SETNODEKNOWN' ? t('visualFlowEditor.blocks.map.compact.known') :
          block.type === 'CENTERMAPBYNODE' ? t('visualFlowEditor.blocks.map.compact.center') :
          t('visualFlowEditor.blocks.map.compact.move');

        if (nodeName) {
          // Etichetta localizzata del nodo, se disponibile
          let displayLabel: string = nodeName;
          const n = Array.isArray(sessionData?.nodes)
            ? sessionData.nodes.find((x: any) => x?.name === nodeName)
            : undefined;
          if (n) {
            displayLabel = getLocalizedString(n.localizedCaptions, currentLanguage, n.caption || n.name || nodeName);
          }
          return <span className="text-gray-400">{prefix}: {displayLabel}</span>;
        }
        return <span className="text-xs text-gray-500 italic">{t('visualFlowEditor.blocks.nodeSelector.none')}</span>;
      }
      case 'SHOWPATH':
      case 'HIDEPATH':
      case 'CENTERMAPBYPATH': {
        const routeKey = block.parameters?.route ? String(block.parameters.route) : '';
        const prefix = block.type === 'SHOWPATH' ? t('visualFlowEditor.blocks.map.compact.show') :
          block.type === 'HIDEPATH' ? t('visualFlowEditor.blocks.map.compact.hide') :
          t('visualFlowEditor.blocks.map.compact.center');

        if (routeKey && missionsList) {
          const mission = missionsList.find(m => m.name === routeKey);
          const displayLabel = mission 
            ? getLocalizedString(mission.localizedCaptions || {}, currentLanguage, mission.name)
            : routeKey;
          return <span className="text-gray-400">{prefix}: {displayLabel}</span>;
        }
        return <span className="text-xs text-gray-500 italic">{(t as any)('visualFlowEditor.command.selectRoute')}</span>;
      }
      case 'HIDEALLPATHS': {
        const node1 = block.parameters?.node1 ? String(block.parameters.node1) : '';
        const node2 = block.parameters?.node2 ? String(block.parameters.node2) : '';
        
        if (!node1 && !node2) {
          return <span className="text-xs text-gray-500 italic">No locations selected</span>;
        }
        
        const getNodeLabel = (nodeName: string) => {
          if (!nodeName) return '';
          const n = Array.isArray(sessionData?.nodes) 
            ? sessionData.nodes.find((x: any) => x?.name === nodeName) 
            : undefined;
          return n ? getLocalizedString(n.localizedCaptions, currentLanguage, n.caption || n.name || nodeName) : nodeName;
        };
        
        const label1 = getNodeLabel(node1);
        const label2 = getNodeLabel(node2);
        
        if (label1 && label2) {
          return <span className="text-gray-400">{(t as any)('visualFlowEditor.blocks.hideAllPaths.summary')}: {label1} → {label2}</span>;
        } else if (label1) {
          return <span className="text-gray-400">{(t as any)('visualFlowEditor.blocks.hideAllPaths.from')}: {label1}</span>;
        } else if (label2) {
          return <span className="text-gray-400">{(t as any)('visualFlowEditor.blocks.hideAllPaths.to')}: {label2}</span>;
        }
        
        return <span className="text-xs text-gray-500 italic">{(t as any)('visualFlowEditor.blocks.hideAllPaths.selectLocations')}</span>;
      }
      case 'SHOWBUTTON':
      case 'HIDEBUTTON':
      case 'SETFOCUS':
      case 'RESETFOCUS': {
        const buttonId = block.parameters?.button ? String(block.parameters.button) : '';
        let prefix;
        switch (block.type) {
          case 'SHOWBUTTON':
            prefix = (t as any)('visualFlowEditor.blocks.map.compact.showButton');
            break;
          case 'HIDEBUTTON':
            prefix = (t as any)('visualFlowEditor.blocks.map.compact.hideButton');
            break;
          case 'SETFOCUS':
            prefix = (t as any)('visualFlowEditor.blocks.map.compact.setFocus');
            break;
          case 'RESETFOCUS':
            prefix = (t as any)('visualFlowEditor.blocks.map.compact.resetFocus');
            break;
          default:
            prefix = block.type;
        }

        if (buttonId) {
          // Trova il pulsante corrispondente e recupera la label localizzata
          const button = buttons.find(b => b.id === buttonId);
          const buttonLabel = button 
            ? (button.localizedLabels[currentLanguage] || button.localizedLabels['EN'] || button.id)
            : buttonId;
          
          return <span className="text-gray-400">{prefix}: {buttonLabel}</span>;
        }
        return <span className="text-xs text-gray-500 italic">{(t as any)('visualFlowEditor.command.selectButton')}</span>;
      }
      case 'SETFOCUSIFCREDITS': {
        const buttonId = block.parameters?.button ? String(block.parameters.button) : '';
        const credits = block.parameters?.credits;
        
        if (buttonId && credits !== undefined) {
          // Trova il pulsante corrispondente e recupera la label localizzata
          const button = buttons.find(b => b.id === buttonId);
          const buttonLabel = button 
            ? (button.localizedLabels[currentLanguage] || button.localizedLabels['EN'] || button.id)
            : buttonId;
          
          return (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Focus Condizionale: {buttonLabel}</span>
              <span className="text-yellow-400">≥{String(credits)}</span>
            </div>
          );
        }
        return <span className="text-xs text-gray-500 italic">Bottone e crediti non impostati</span>;
      }
      case 'ADDINFOWINDOW':
      case 'SHOWINFOWINDOW': {
        if (block.parameters?.image) {
          return (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">🖼️ {String(block.parameters.image)}</span>
            </div>
          );
        }
        return <span className="text-xs text-gray-500 italic">No image selected</span>;
      }
      case 'SHOWHELPIMAGE': {
        const emoji = '🖼️';
        const paramsValue = block.parameters?.params || '';
        if (paramsValue.trim()) {
          return (
            <span className="text-gray-400" title={(t as any)('visualFlowEditor.blocks.showHelpImage.description')}>
              {emoji} {paramsValue}
            </span>
          );
        }
        return (
          <span className="text-xs text-gray-500 italic">
            {(t as any)('visualFlowEditor.blocks.showHelpImage.noParameters') || 'Nessun parametro'}
          </span>
        );
      }
      default: {
        // Gestione generica per blocchi non implementati - mostra un riepilogo compatto dei parametri
        const params = block.parameters || {};
        const paramEntries = Object.entries(params);
        
        if (paramEntries.length === 0) {
          return <span className="text-xs text-gray-500 italic">No parameters</span>;
        }
        
        // Mostra solo i primi 2 parametri in modo compatto
        const displayParams = paramEntries.slice(0, 2);
        const hasMore = paramEntries.length > 2;
        
        return (
          <div className="flex items-center gap-2 text-xs">
            {displayParams.map(([key, value], index) => {
              let displayValue = '';
              
              if (typeof value === 'object' && value !== null) {
                // Per oggetti multilingua, mostra la versione nella lingua corrente o EN
                if (value[currentLanguage]) {
                  displayValue = value[currentLanguage];
                } else if (value['EN']) {
                  displayValue = value['EN'];
                } else {
                  // Per altri oggetti, mostra una versione compatta
                  displayValue = '{...}';
                }
              } else {
                displayValue = String(value);
              }
              
              // Tronca valori lunghi
              if (displayValue.length > 20) {
                displayValue = displayValue.substring(0, 20) + '...';
              }
              
              return (
                <span key={key} className="text-gray-400">
                  {index > 0 && <span className="mx-1">•</span>}
                  <span className="text-gray-500">{key}:</span> {displayValue}
                </span>
              );
            })}
            {hasMore && <span className="text-gray-500">+{paramEntries.length - 2} more</span>}
          </div>
        );
      }
    }
    return null;
  };

  // Ottieni il personaggio per SAY/ASK
  const avatarCharacter = (block.type === 'SAY' || block.type === 'ASK') && simulatedSceneState 
    ? getLastModifiedVisibleCharacter(simulatedSceneState) 
    : null;
  
  // Ottieni il personaggio per ADDOPPONENT e adatta la struttura per CharacterAvatar
  const opponentCharacterRaw = block.type === 'ADDOPPONENT' && block.parameters?.character
    ? characters.find((c: Character) => c.nomepersonaggio === block.parameters?.character)
    : null;
    
  const opponentCharacter = opponentCharacterRaw ? {
    nomepersonaggio: opponentCharacterRaw.nomepersonaggio,
    lastImmagine: opponentCharacterRaw.immaginebase || (opponentCharacterRaw.listaimmagini?.[0] || null)
  } : null;
  
  // Ottieni l'immagine della nave per SETSHIPTYPE
  const shipType = block.type === 'SETSHIPTYPE' && block.parameters?.type
    ? String(block.parameters.type)
    : null;
  const shipImagePath = shipType 
    ? `campaign/campaignMap/ship${shipType.replace('ST', '')}.cacheship.png`
    : null;

  // Node avatar support for MAP commands
  const selectedNodeName: string | null = (
    ['SHOWNODE','HIDENODE','ADDNODE','SETNODEKNOWN','CENTERMAPBYNODE','MOVEPLAYERTONODE'] as any
  ).includes(block.type) && block.parameters?.node ? String(block.parameters.node) : null;

  // Try to pick node image from sessionData if available
  const nodeImageBinary: string | null = selectedNodeName && Array.isArray(sessionData?.nodes)
    ? (sessionData.nodes.find((n: any) => n?.name === selectedNodeName)?.imageBinary || null)
    : null;
  const nodeData = selectedNodeName && Array.isArray(sessionData?.nodes)
    ? sessionData.nodes.find((n: any) => n?.name === selectedNodeName)
    : null;
  const nodeDisplayName = nodeData
    ? getLocalizedString(nodeData.localizedCaptions, currentLanguage, nodeData.caption || nodeData.name || selectedNodeName!)
    : selectedNodeName || null;
  const nodeAvatar = selectedNodeName ? {
    nomepersonaggio: nodeDisplayName || selectedNodeName,
    lastImmagine: nodeImageBinary ? { nomefile: `${selectedNodeName}.png`, binary: nodeImageBinary } : null
  } : null;

  // Per HIDEALLPATHS - prepara gli avatar dei due nodi selezionati
  const hideAllPathsAvatars = useMemo(() => {
    if (block.type !== 'HIDEALLPATHS') return null;
    
    const node1Name = block.parameters?.node1;
    const node2Name = block.parameters?.node2;
    
    const getNodeAvatar = (nodeName: string | undefined) => {
      if (!nodeName || typeof nodeName !== 'string' || !sessionData?.nodes) return null;
      
      const node = sessionData.nodes.find((n: any) => n.nome === nodeName || n.name === nodeName);
      if (!node) return null;
      
      return {
        nomepersonaggio: node.displayName || node.localizedCaptions?.IT || node.caption || nodeName,
        lastImmagine: node.imageBinary ? { nomefile: `${nodeName}.png`, binary: node.imageBinary } : 
                     node.immagine?.binary ? { nomefile: `${nodeName}.png`, binary: node.immagine.binary } : null
      };
    };

    return {
      node1: getNodeAvatar(String(node1Name || '')),
      node2: getNodeAvatar(String(node2Name || ''))
    };
  }, [block.type, block.parameters?.node1, block.parameters?.node2, sessionData?.nodes]);

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
            // Se stiamo espandendo, segna come espansione manuale
            setIsManuallyExpanded(true);
            setIsCollapsed(false);
          } else {
            // Se stiamo collassando, rimuovi il flag di espansione manuale
            setIsManuallyExpanded(false);
            setIsCollapsed(true);
          }
        }}
        className={`${getBlockClassName(block.type, isInvalid, validationType)} p-3 mb-2 transition-all hover:shadow-lg`}
        isInvalid={isInvalid}
        validationType={validationType}
        extraControls={allBlocks.length > 0 && <SceneDebugButton block={block} allBlocks={allBlocks} characters={characters} />}
  showAvatar={(block.type === 'SAY' || block.type === 'ASK' || block.type === 'ADDOPPONENT' || block.type === 'SETSHIPTYPE' || block.type === 'HIDEALLPATHS' || ['SHOWNODE','HIDENODE','ADDNODE','SETNODEKNOWN','CENTERMAPBYNODE','MOVEPLAYERTONODE'].includes(block.type))}
        avatarCharacter={
          block.type === 'HIDEALLPATHS' ? hideAllPathsAvatars :
          block.type === 'ADDOPPONENT' ? opponentCharacter : 
          block.type === 'SETSHIPTYPE' ? {
            nomepersonaggio: shipType || 'STI',
            lastImmagine: shipImagePath ? { nomefile: shipImagePath, percorso: shipImagePath } : null
          } : block.type && ['SHOWNODE','HIDENODE','ADDNODE','SETNODEKNOWN','CENTERMAPBYNODE','MOVEPLAYERTONODE'].includes(block.type) ? nodeAvatar :
          avatarCharacter
        }
  isShipType={block.type === 'SETSHIPTYPE'}
  isNodeType={(['SHOWNODE','HIDENODE','ADDNODE','SETNODEKNOWN','CENTERMAPBYNODE','MOVEPLAYERTONODE'] as any).includes(block.type)}
      >
        {/* Block parameters - visibili solo se expanded */}
        {renderParameters()}
      </BaseBlock>
    </div>
  );
};
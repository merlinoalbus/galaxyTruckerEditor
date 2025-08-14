import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Clock, ArrowRight, Tag, HelpCircle, ExternalLink } from 'lucide-react';
import { BaseBlock } from '../BaseBlock/BaseBlock';
import { SelectWithModal } from '../../SelectWithModal/SelectWithModal';
import { MultilingualTextEditor } from '../../MultilingualTextEditor';
import { getBlockClassName } from '@/utils/CampaignEditor/VisualFlowEditor/blockColors';
import { useTranslation } from '@/locales';
import { useLanguage } from '@/contexts/LanguageContext';

interface CommandBlockProps {
  block: any;
  onUpdate: (updates: any) => void;
  onRemove?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  sessionData?: any;
  isInvalid?: boolean;
  onGoToLabel?: (labelName: string) => void;
  onNavigateToSubScript?: (scriptName: string, parentBlock: any) => void;
}

export const CommandBlock: React.FC<CommandBlockProps> = ({
  block,
  onUpdate,
  onRemove,
  onDragStart,
  sessionData,
  isInvalid = false,
  onGoToLabel,
  onNavigateToSubScript
}) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  // Stato per collapse/expand - command blocks default collapsed
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-collapse se lo spazio è insufficiente (ma non se l'utente ha espanso manualmente)
  useEffect(() => {
    const checkSpace = () => {
      if (containerRef.current && !isCollapsed && !isManuallyExpanded) {
        const container = containerRef.current;
        const width = container.offsetWidth;
        
        // Calcola lo spazio minimo necessario per CommandBlock
        // Icon(40px) + Label(80px) + padding(60px) = ~180px minimo
        const minRequiredWidth = 300;
        
        // Se larghezza insufficiente, collapse automaticamente
        if (width < minRequiredWidth) {
          setIsCollapsed(true);
        }
      }
    };
    
    checkSpace();
    // Ricontrolla quando il container viene ridimensionato
    const resizeObserver = new ResizeObserver(checkSpace);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [isCollapsed, isManuallyExpanded]);
  const renderParameters = () => {
    switch (block.type) {
      case 'SAY':
        return (
          <MultilingualTextEditor
            value={typeof block.parameters?.text === 'string' 
              ? { EN: block.parameters.text } 
              : (block.parameters?.text || {})}
            onChange={(text) => onUpdate({ 
              parameters: { ...block.parameters, text } 
            })}
            placeholder={t('visualFlowEditor.command.dialogText')}
            label=""
          />
        );
      
      case 'ASK':
        return (
          <MultilingualTextEditor
            value={typeof block.parameters?.text === 'string' 
              ? { EN: block.parameters.text } 
              : (block.parameters?.text || {})}
            onChange={(text) => onUpdate({ 
              parameters: { ...block.parameters, text } 
            })}
            placeholder={t('visualFlowEditor.command.questionText')}
            label={t('visualFlowEditor.command.questionLabel')}
          />
        );
      
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
                  onGoToLabel(block.parameters.label);
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
              value={block.parameters?.name || ''}
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
              availableItems={sessionData?.availableScripts?.map((s: any) => s.name) || []}
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
      
      default:
        return null;
    }
  };


  const getBlockIcon = () => {
    switch (block.type) {
      case 'SAY': return <span className="text-2xl">💬</span>;
      case 'ASK': return <span className="text-2xl">❓</span>;
      case 'DELAY': return <span className="text-2xl">⏱️</span>;
      case 'GO': return <span className="text-2xl">➡️</span>;
      case 'LABEL': return <span className="text-2xl">🏷️</span>;
      case 'SUB_SCRIPT': return <span className="text-2xl">📄</span>;
      case 'EXIT_MENU': return <span className="text-2xl">🚪</span>;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

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
                    onGoToLabel(block.parameters.label);
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
      case 'EXIT_MENU':
        return <span className="text-xs text-gray-400">{t('visualFlowEditor.blocks.exitMenu.compact')}</span>;
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
            // Se stiamo espandendo, segna come espansione manuale
            setIsManuallyExpanded(true);
            setIsCollapsed(false);
          } else {
            // Se stiamo collassando, rimuovi il flag di espansione manuale
            setIsManuallyExpanded(false);
            setIsCollapsed(true);
          }
        }}
        className={`${getBlockClassName(block.type, isInvalid)} p-3 mb-2 transition-all hover:shadow-lg`}
        isInvalid={isInvalid}
      >
        {/* Block parameters - visibili solo se expanded */}
        {renderParameters()}
      </BaseBlock>
    </div>
  );
};
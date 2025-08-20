import React, { useState, useEffect, useRef } from 'react';
import { BaseBlock } from '../BaseBlock/BaseBlock';
import { SelectWithModal } from '../../SelectWithModal/SelectWithModal';
import { getBlockClassName } from '@/utils/CampaignEditor/VisualFlowEditor/blockColors';
import { useTranslation } from '@/locales';
import { useLanguage } from '@/contexts/LanguageContext';
import { useButtonsList } from '@/hooks/CampaignEditor/VisualFlowEditor/useButtonsList';
import { Target, Coins } from 'lucide-react';
import { CMD_EMOJI } from '@/components/Emoji/cmdEmojiMap';
import Emoji from '@/components/Emoji/Emoji';
import type { IFlowBlock, BlockUpdate } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

interface SetFocusIfCreditsBlockProps {
  block: IFlowBlock;
  onUpdate: (updates: BlockUpdate) => void;
  onRemove?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isInvalid?: boolean;
  validationType?: 'error' | 'warning';
  collapseAllTrigger?: number;
  expandAllTrigger?: number;
  globalCollapseState?: 'collapsed' | 'expanded' | 'manual';
  isCustom?: boolean;
  availableLanguages?: string[];
}

export const SetFocusIfCreditsBlock: React.FC<SetFocusIfCreditsBlockProps> = ({
  block,
  onUpdate,
  onRemove,
  onDragStart,
  isInvalid = false,
  validationType,
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
  const { buttons, getButtonsForSelect } = useButtonsList();
  
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

  // Auto-collapse se lo spazio è insufficiente
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      requestAnimationFrame(() => {
        for (const entry of entries) {
          const { width } = entry.contentRect;
          
          if (!isManuallyExpanded && !isCollapsed) {
            const minRequiredWidth = 500; // Più spazio per button + credits
            
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
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-300 whitespace-nowrap">
            {(t as any)('visualFlowEditor.blocks.map.button')}:
          </label>
          <div className="flex-1">
            <SelectWithModal
              type="parts"
              value={typeof block.parameters?.button === 'string' ? block.parameters.button : ''}
              onChange={(value) => onUpdate({ 
                parameters: { ...block.parameters, button: value } 
              })}
              placeholder={(t as any)('visualFlowEditor.command.selectButton')}
              availableItems={getButtonsForSelect()}
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
  };

  const getBlockIcon = () => {
    return <Emoji text={CMD_EMOJI['SETFOCUSIFCREDITS']} className="text-lg" />;
  };

  // Genera i parametri compatti per la visualizzazione collapsed
  const getCompactParams = () => {
    const buttonId = typeof block.parameters?.button === 'string' ? block.parameters.button : '';
    const credits = block.parameters?.credits;
    
    return (
      <div className="flex items-center gap-2 w-full">
        {buttonId ? (
          <>
            <Target className="w-3 h-3 text-blue-400" />
            <span className="text-blue-400 text-sm font-mono">
              {/* Trova il pulsante corrispondente e recupera la label localizzata */}
              {(() => {
                const button = buttons.find(b => b.id === buttonId);
                return button 
                  ? (button.localizedLabels[currentLanguage] || button.localizedLabels['EN'] || button.id)
                  : buttonId;
              })()}
            </span>
            <Coins className="w-3 h-3 text-yellow-400 ml-2" />
            <span className="text-yellow-400 text-sm font-mono">
              {credits !== undefined ? String(credits) : '?'}
            </span>
          </>
        ) : (
          <span className="text-red-400 text-sm">
            Bottone e crediti non impostati
          </span>
        )}
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
      >
        {renderParameters()}
      </BaseBlock>
    </div>
  );
};

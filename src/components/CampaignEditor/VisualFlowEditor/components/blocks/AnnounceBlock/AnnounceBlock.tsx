import React, { useState, useEffect, useRef } from 'react';
import { BaseBlock } from '../BaseBlock/BaseBlock';
import { MultilingualTextEditor } from '../../MultilingualTextEditor';
import { getBlockClassName } from '@/utils/CampaignEditor/VisualFlowEditor/blockColors';
import { useTranslation } from '@/locales';
import { useLanguage } from '@/contexts/LanguageContext';
import type { IFlowBlock, BlockUpdate } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

interface AnnounceBlockProps {
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

export const AnnounceBlock: React.FC<AnnounceBlockProps> = ({
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
        <MultilingualTextEditor
          value={typeof block.parameters?.text === 'string' 
            ? { EN: block.parameters.text } 
            : (block.parameters?.text || {})}
          onChange={(text) => onUpdate({ 
            parameters: { ...block.parameters, text } 
          })}
          placeholder={t('visualFlowEditor.blocks.announce.placeholder')}
          label={t('visualFlowEditor.blocks.announce.textLabel')}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
        />
      </div>
    );
  };

  const getBlockIcon = () => {
    return <span className="text-lg">📢</span>;
  };

  // Genera i parametri compatti per la visualizzazione collapsed
  const getCompactParams = () => {
    if (!block.parameters?.text) return null;
    
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
    
    if (!text) return null;
    
    return (
      <div className="flex items-center gap-2 w-full">
        <span className="truncate max-w-[400px] text-gray-300" title={text}>
          {text}
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
      >
        {renderParameters()}
      </BaseBlock>
    </div>
  );
};
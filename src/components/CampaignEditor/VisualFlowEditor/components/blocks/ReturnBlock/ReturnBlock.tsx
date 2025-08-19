import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BaseBlock } from '../BaseBlock/BaseBlock';
import { ArrowLeft } from 'lucide-react';
import { getBlockClassName } from '@/utils/CampaignEditor/VisualFlowEditor/blockColors';
import { useTranslation } from '@/locales';
import type { IFlowBlock, BlockUpdate } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

interface ReturnBlockProps {
  block: IFlowBlock;
  onUpdate: (updates: BlockUpdate) => void;
  onRemove?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isInvalid?: boolean;
  validationType?: 'error' | 'warning';
  navigationPath?: Array<{ scriptName: string; parentBlockId?: string }>; // Path di navigazione tra script
  onNavigateBack?: () => void; // Callback per navigare al livello superiore
  collapseAllTrigger?: number;
  expandAllTrigger?: number;
  globalCollapseState?: 'collapsed' | 'expanded' | 'manual';
  isCustom?: boolean;
  availableLanguages?: string[];
}

export const ReturnBlock: React.FC<ReturnBlockProps> = ({
  block,
  onUpdate,
  onRemove,
  onDragStart,
  isInvalid = false,
  validationType,
  navigationPath = [],
  onNavigateBack,
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

  // Determina se siamo in un subscript (più di un elemento nel navigationPath)
  // Il primo elemento è lo script principale, quindi siamo in un subscript se ce ne sono almeno 2
  const isInSubscript = navigationPath && navigationPath.length > 1;

  // Gestione del click sul pulsante di navigazione
  const handleNavigateBack = useCallback(() => {
    if (isInSubscript && onNavigateBack) {
      onNavigateBack();
    }
  }, [isInSubscript, onNavigateBack]);

  const renderParameters = () => {
    // Mostra la descrizione multilingua di cosa fa il comando RETURN
    const descriptionKey = isInSubscript 
      ? 'visualFlowEditor.blocks.return.descriptionSubscript'
      : 'visualFlowEditor.blocks.return.descriptionRoot';
    
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-400">
          {t(descriptionKey)}
        </div>
      </div>
    );
  };

  const getBlockIcon = () => {
    return <span className="text-lg">↩️</span>;
  };

  // Genera i parametri compatti per la visualizzazione collapsed
  const getCompactParams = () => {
    // Mostra il pulsante di navigazione se siamo in un subscript
    if (isInSubscript && onNavigateBack) {
      return (
        <div className="flex items-center gap-2 w-full">
          <span className="text-gray-400 text-sm">
            {t('visualFlowEditor.blocks.return.returnToParent')}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNavigateBack();
            }}
            className="ml-auto px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded flex items-center gap-1 transition-colors"
            title={t('visualFlowEditor.blocks.return.navigateToParent')}
          >
            <ArrowLeft className="w-3 h-3" />
            {t('visualFlowEditor.blocks.return.goBack')}
          </button>
        </div>
      );
    }
    
    // Se siamo al livello root, non mostra niente (il warning viene dal sistema di validazione)
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
      >
        {renderParameters()}
      </BaseBlock>
    </div>
  );
};
import React, { useState, useEffect, useRef } from 'react';
import { BaseBlock } from '../BaseBlock/BaseBlock';
import { SelectWithModal } from '../../SelectWithModal/SelectWithModal';
import { getBlockClassName } from '@/utils/CampaignEditor/VisualFlowEditor/blockColors';
import { useTranslation } from '@/locales';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSessionData } from '@/hooks/CampaignEditor/VisualFlowEditor/useSessionData';
import { Circle } from 'lucide-react';
import type { IFlowBlock, BlockUpdate } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

interface ResetBlockProps {
  block: IFlowBlock;
  onUpdate: (updates: BlockUpdate) => void;
  onRemove?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isInvalid?: boolean;
  validationType?: 'error' | 'warning';
}

export const ResetBlock: React.FC<ResetBlockProps> = ({
  block,
  onUpdate,
  onRemove,
  onDragStart,
  isInvalid = false,
  validationType
}) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { semaphores, addSemaphore } = useSessionData();

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
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            {t('visualFlowEditor.blocks.reset.semaphoreLabel')}
          </label>
          <SelectWithModal
            type="semaphore"
            value={typeof block.parameters?.semaphore === 'string' ? block.parameters.semaphore : ''}
            onChange={(value) => onUpdate({ 
              parameters: { ...block.parameters, semaphore: value } 
            })}
            placeholder={t('visualFlowEditor.blocks.reset.selectSemaphore')}
            availableItems={semaphores}
            onAddItem={addSemaphore}
          />
        </div>
        <div className="text-xs text-gray-500">
          {t('visualFlowEditor.blocks.reset.description')}
        </div>
      </div>
    );
  };

  const getBlockIcon = () => {
    return <span className="text-lg">❌</span>;
  };

  // Genera i parametri compatti per la visualizzazione collapsed
  const getCompactParams = () => {
    const semaphore = typeof block.parameters?.semaphore === 'string' ? block.parameters.semaphore : '';
    
    return (
      <div className="flex items-center gap-2 w-full">
        {semaphore ? (
          <>
            <span className="text-gray-400 text-sm">
              {semaphore}
            </span>
            <div className="ml-auto flex items-center gap-1" title="Semaphore: RED">
              <div className="relative">
                <Circle className="w-5 h-5 text-red-500 fill-red-900/30 relative" strokeWidth={2} />
              </div>
              <span className="text-xs text-red-400 font-semibold">OFF</span>
            </div>
          </>
        ) : (
          <span className="text-red-400 text-sm">
            {t('visualFlowEditor.blocks.reset.noSemaphore')}
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
import React, { useState, useEffect, useRef } from 'react';
import { BaseBlock } from '../BaseBlock/BaseBlock';
import { SelectWithModal } from '../../SelectWithModal/SelectWithModal';
import { getBlockClassName } from '@/utils/CampaignEditor/VisualFlowEditor/blockColors';
import { useTranslation } from '@/locales';
import { useSessionData } from '@/hooks/CampaignEditor/VisualFlowEditor/useSessionData';
import { Plus, Calculator } from 'lucide-react';
import type { IFlowBlock, BlockUpdate } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

interface AddBlockProps {
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

export const AddBlock: React.FC<AddBlockProps> = ({
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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return globalCollapseState === 'expanded' ? false : true;
  });
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { variables, addVariable } = useSessionData();
  
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
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-300 whitespace-nowrap">
            {t('visualFlowEditor.command.variableLabel')}
          </label>
          <div className="flex-1">
            <SelectWithModal
              type="variable"
              value={typeof block.parameters?.variable === 'string' ? block.parameters.variable : ''}
              onChange={(value) => onUpdate({ 
                parameters: { ...block.parameters, variable: value } 
              })}
              placeholder={t('visualFlowEditor.command.selectVariable')}
              availableItems={variables}
              onAddItem={addVariable}
            />
          </div>
          <div className="flex-1">
            <input
              type="number"
              className="w-full bg-slate-800/50 text-white px-2 py-1 rounded text-sm border border-slate-700 focus:border-blue-600 focus:outline-none"
              placeholder={t('visualFlowEditor.blocks.add.valuePlaceholder')}
              value={block.parameters?.value !== undefined ? String(block.parameters.value) : ''}
              onChange={(e) => {
                const numValue = parseInt(e.target.value, 10);
                onUpdate({ 
                  parameters: { 
                    ...block.parameters, 
                    value: isNaN(numValue) ? undefined : numValue 
                  } 
                });
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          {t('visualFlowEditor.blocks.add.description')}
        </div>
      </div>
    );
  };

  const getBlockIcon = () => {
    return <Plus className="w-4 h-4" />;
  };

  // Genera i parametri compatti per la visualizzazione collapsed
  const getCompactParams = () => {
    const variable = typeof block.parameters?.variable === 'string' ? block.parameters.variable : '';
    const value = block.parameters?.value;
    
    return (
      <div className="flex items-center gap-2 w-full">
        {variable ? (
          <>
            <span className="text-blue-400 text-sm font-mono">
              {variable}
            </span>
            <Plus className="w-3 h-3 text-green-500" />
            <span className="text-yellow-400 text-sm font-mono">
              {value !== undefined ? value : '?'}
            </span>
          </>
        ) : (
          <span className="text-red-400 text-sm">
            {t('visualFlowEditor.blocks.add.noVariable')}
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

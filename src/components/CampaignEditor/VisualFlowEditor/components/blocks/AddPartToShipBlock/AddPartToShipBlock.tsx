import React, { useState, useEffect, useRef } from 'react';
import { BaseBlock } from '../BaseBlock/BaseBlock';
import { getBlockClassName } from '@/utils/CampaignEditor/VisualFlowEditor/blockColors';
import { useTranslation } from '@/locales';
import type { IFlowBlock, BlockUpdate } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

interface AddPartToShipBlockProps {
  block: IFlowBlock;
  onUpdate: (updates: BlockUpdate) => void;
  onRemove?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isInvalid?: boolean;
  validationType?: 'error' | 'warning';
  collapseAllTrigger?: number;
  expandAllTrigger?: number;
  globalCollapseState?: 'collapsed' | 'expanded' | 'manual';
}

export const AddPartToShipBlock: React.FC<AddPartToShipBlockProps> = ({
  block,
  onUpdate,
  onRemove,
  onDragStart,
  isInvalid = false,
  validationType,
  collapseAllTrigger = 0,
  expandAllTrigger = 0,
  globalCollapseState = 'manual'
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
  
  // Base chiave i18n dinamica per supportare blocchi diversi che condividono questo UI
  const getI18nBaseKey = () => {
    switch (block.type) {
      case 'SETADVPILE':
        return 'visualFlowEditor.blocks.setAdvPile';
      case 'SETSECRETADVPILE':
        return 'visualFlowEditor.blocks.setSecretAdvPile';
      case 'ADDPARTTOSHIP':
      default:
        return 'visualFlowEditor.blocks.addPartToShip';
    }
  };
  const i18nBase = getI18nBaseKey();
  
  const renderParameters = () => {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-slate-400 mb-2">
            {t(`${i18nBase}.parameters` as any)}
          </label>
          <input
            type="text"
            value={(block.parameters?.params as string) || ''}
            onChange={(e) => onUpdate({ 
              parameters: { ...block.parameters, params: e.target.value } 
            })}
            placeholder={t(`${i18nBase}.placeholder` as any)}
            className="w-full bg-slate-700/50 text-white px-3 py-2 rounded text-sm border border-slate-600 focus:border-blue-500 focus:outline-none"
          />
          <div className="mt-1 text-xs text-slate-500">
            {t(`${i18nBase}.hint` as any)}
          </div>
        </div>
      </div>
    );
  };
  
  const getBlockIcon = () => {
    let icon = '🔧';
    if (block.type === 'SETADVPILE') icon = '📚';
    if (block.type === 'SETSECRETADVPILE') icon = '🔒';
    return <span className="text-2xl">{icon}</span>;
  };
  
  const getCompactParams = () => {
    const params = block.parameters?.params as string;
    
    if (!params) {
      return (
        <div className="flex items-center gap-2 w-full text-gray-500 italic">
          <span>{t(`${i18nBase}.noParameters` as any)}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-between gap-2 w-full bg-slate-800/30 rounded px-2 py-1">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-gray-400">
            {t(`${i18nBase}.params` as any)}:
          </span>
          <span className="text-gray-300 font-mono text-xs truncate" title={params}>
            {params}
          </span>
        </div>
      </div>
    );
  };
  
  return (
    <div ref={containerRef}>
      <BaseBlock
        blockType={block.type}
        blockIcon={getBlockIcon()}
        onRemove={onRemove}
        onDragStart={onDragStart}
        onToggleCollapse={() => {
          setIsCollapsed(!isCollapsed);
          setIsManuallyExpanded(!isCollapsed);
        }}
        className={getBlockClassName(block.type, isInvalid, validationType)}
        isCollapsed={isCollapsed}
        isInvalid={isInvalid}
        validationType={validationType}
        compactParams={isCollapsed ? getCompactParams() : null}
      >
        {!isCollapsed && renderParameters()}
      </BaseBlock>
    </div>
  );
};
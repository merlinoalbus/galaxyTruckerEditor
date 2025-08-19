import { logger } from '@/utils/logger';
import React, { useState, useEffect, useRef } from 'react';
import { BaseBlock } from '../BaseBlock/BaseBlock';
import { getBlockClassName } from '@/utils/CampaignEditor/VisualFlowEditor/blockColors';
import { useTranslation } from '@/locales';
import { SelectWithModal } from '../../SelectWithModal/SelectWithModal';
import { API_CONFIG } from '@/config/constants';
import type { IFlowBlock, BlockUpdate } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

interface PartOption {
  id: string;
  descrizione: string;
  valore: string;
}

interface AddShipPartsBlockProps {
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

export const AddShipPartsBlock: React.FC<AddShipPartsBlockProps> = ({
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
  const [partOptions, setPartOptions] = useState<PartOption[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  
  // Carica la lista dei file parts dal backend
  useEffect(() => {
    const loadParts = async () => {
      setIsLoadingParts(true);
      try {
        const response = await fetch(`${API_CONFIG.API_BASE_URL}/missions/parts`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success && data.data) {
          setPartOptions(data.data);
        }
      } catch (error) {
  logger.error('Error loading parts:', error);
      } finally {
        setIsLoadingParts(false);
      }
    };
    loadParts();
  }, []);
  
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
    // Prepara la lista di parti come array di stringhe per SelectWithModal
    const partsArray = partOptions.map(option => option.descrizione);
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 whitespace-nowrap">
            {t('visualFlowEditor.blocks.addShipParts.partsFileLabel')}:
          </label>
          <SelectWithModal
            type="parts"
            value={block.parameters?.params || ''}
            onChange={(value) => {
              // Trova l'opzione corrispondente per ottenere il valore corretto
              const selectedOption = partOptions.find(option => option.descrizione === value);
              const actualValue = selectedOption ? selectedOption.valore : value;
              
              onUpdate({ 
                parameters: { 
                  ...block.parameters, 
                  params: actualValue
                } 
              });
            }}
            placeholder={isLoadingParts 
              ? t('visualFlowEditor.blocks.addShipParts.loading')
              : t('visualFlowEditor.blocks.addShipParts.selectParts')
            }
            availableItems={partsArray}
            onAddItem={undefined} // Non permettere aggiunta di nuove parti
            className="flex-1"
          />
        </div>
        <div className="text-xs text-gray-500">
          {t('visualFlowEditor.blocks.addShipParts.description')}
        </div>
      </div>
    );
  };

  const getBlockIcon = () => {
    // Use the same emoji as the tools palette for visual consistency
    return <span className="text-xl">⚙️</span>;
  };

  // Genera i parametri compatti per la visualizzazione collapsed
  const getCompactParams = () => {
    const raw = block.parameters?.params ?? '';

    // Normalize the stored raw value: trim, remove surrounding quotes
    const normalize = (v: any) => {
      if (v === null || v === undefined) return '';
      let s = String(v).trim();
      // Remove surrounding double quotes if present
  s = s.replace(/^"|"$/g, '');
      return s;
    };

    const normalized = normalize(raw);

    // Try to find the matching option in a robust, case-insensitive way
    const findMatch = () => {
      if (!normalized) return null;
      const lower = normalized.toLowerCase();
      // 1) exact match on valore
      let match = partOptions.find(o => String(o.valore).toLowerCase() === lower);
      if (match) return match;
      // 2) exact match on descrizione
      match = partOptions.find(o => String(o.descrizione).toLowerCase() === lower);
      if (match) return match;
      // 3) endsWith match on valore (helps if stored value is filename only)
      match = partOptions.find(o => String(o.valore).toLowerCase().endsWith(lower));
      if (match) return match;
      // 4) partial contains match on descrizione
      match = partOptions.find(o => String(o.descrizione).toLowerCase().includes(lower));
      if (match) return match;
      return null;
    };

  const matched = findMatch();
  let displayValue = normalized;
  if (matched) displayValue = matched.valore || normalized;

    // Fallback: if still empty, show localized 'noParts'
    const hasValue = !!displayValue;

    // For compactness show only filename without path and extension
  const pretty = (v: string) => {
      if (!v) return v;
      const last = v.split('/').pop() || v;
      return last.replace(/\.(yaml|yml)$/i, '');
    };

    return (
      <div className="flex items-center gap-2 w-full">
        {hasValue ? (
          <span className="text-gray-400 text-sm truncate" title={displayValue}>
            {`"${pretty(displayValue)}"`}
          </span>
        ) : (
          <span className="text-red-400 text-sm">
            {t('visualFlowEditor.blocks.addShipParts.noParts')}
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
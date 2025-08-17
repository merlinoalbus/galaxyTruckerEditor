import React, { useState, useEffect, useRef } from 'react';
import { BaseBlock } from '../BaseBlock/BaseBlock';
import { getBlockClassName } from '@/utils/CampaignEditor/VisualFlowEditor/blockColors';
import { useTranslation } from '@/locales';
import { Package } from 'lucide-react';
import { API_CONSTANTS } from '@/constants/VisualFlowEditor.constants';
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
        console.error('Error loading parts:', error);
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
    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            {t('visualFlowEditor.blocks.addShipParts.partsFileLabel')}
          </label>
          <select
            className="w-full bg-slate-800/50 text-gray-200 px-2 py-1.5 rounded-md text-xs border border-slate-700 hover:border-purple-500 focus:border-purple-500 focus:outline-none"
            value={block.parameters?.params || ''}
            onChange={(e) => {
              onUpdate({ 
                parameters: { 
                  ...block.parameters, 
                  params: e.target.value 
                } 
              });
            }}
            disabled={isLoadingParts}
          >
            <option value="">
              {isLoadingParts 
                ? t('visualFlowEditor.blocks.addShipParts.loading')
                : t('visualFlowEditor.blocks.addShipParts.selectParts')
              }
            </option>
            {partOptions.map(option => (
              <option key={option.id} value={option.valore}>
                {option.descrizione}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-gray-500">
          {t('visualFlowEditor.blocks.addShipParts.description')}
        </div>
      </div>
    );
  };

  const getBlockIcon = () => {
    return <Package className="w-4 h-4" />;
  };

  // Genera i parametri compatti per la visualizzazione collapsed
  const getCompactParams = () => {
    const partsFile = block.parameters?.params || '';
    
    return (
      <div className="flex items-center gap-2 w-full">
        {partsFile ? (
          <span className="text-gray-400 text-sm truncate" title={partsFile}>
            {partsFile.split('/').pop()?.replace(/\.(yaml|yml)$/, '') || partsFile}
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
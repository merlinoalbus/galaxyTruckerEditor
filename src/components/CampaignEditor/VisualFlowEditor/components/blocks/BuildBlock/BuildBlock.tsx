import React, { useState, useEffect, useRef } from 'react';
import { AnchorPoint } from '../../AnchorPoint/AnchorPoint';
import { ContainerBlock } from '../ContainerBlock/ContainerBlock';
import { useTranslation } from '@/locales';
import type { IFlowBlock, BlockUpdate } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

interface BuildBlockProps {
  block: IFlowBlock;
  onUpdate: (updates: BlockUpdate) => void;
  onRemove?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropInit: (e: React.DragEvent) => void;
  onDropStart: (e: React.DragEvent) => void;
  onDropInitAtIndex: (e: React.DragEvent, index: number) => void;
  onDropStartAtIndex: (e: React.DragEvent, index: number) => void;
  renderChildren: (blocks: IFlowBlock[]) => React.ReactNode;
  isDragActive?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  isZoomed?: boolean;
  isInvalid?: boolean;
  validationType?: 'error' | 'warning';
  collapseAllTrigger?: number;
  expandAllTrigger?: number;
  globalCollapseState?: 'collapsed' | 'expanded' | 'manual';
}

export const BuildBlock: React.FC<BuildBlockProps> = ({
  block,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDropInit,
  onDropStart,
  onDropInitAtIndex,
  onDropStartAtIndex,
  renderChildren,
  isDragActive = false,
  onZoomIn,
  onZoomOut,
  isZoomed = false,
  isInvalid = false,
  validationType,
  collapseAllTrigger = 0,
  expandAllTrigger = 0,
  globalCollapseState = 'manual'
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return globalCollapseState === 'collapsed';
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
    const checkSpace = () => {
      if (isManuallyExpanded) return;
      
      if (containerRef.current && !isCollapsed) {
        const container = containerRef.current;
        const width = container.offsetWidth;
        const minRequiredWidth = 500;
        
        if (width < minRequiredWidth) {
          setIsCollapsed(true);
        }
      }
    };
    
    checkSpace();
    const resizeObserver = new ResizeObserver(checkSpace);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      if (containerRef.current) {
        resizeObserver.disconnect();
      }
    };
  }, [isCollapsed, isManuallyExpanded]);

  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    setIsManuallyExpanded(!newCollapsedState);
  };

  // Aggiorna i contatori quando cambiano i blocchi
  useEffect(() => {
    const numBlockInit = block.blockInit?.length || 0;
    const numBlockStart = block.blockStart?.length || 0;
    
    if (block.numBlockInit !== numBlockInit || block.numBlockStart !== numBlockStart) {
      onUpdate({
        numBlockInit,
        numBlockStart
      });
    }
  }, [block.blockInit, block.blockStart, block.numBlockInit, block.numBlockStart, onUpdate]);

  // Genera i parametri compatti per la visualizzazione collapsed
  const getCompactParams = () => {
    const initCount = block.blockInit?.length || 0;
    const startCount = block.blockStart?.length || 0;
    
    return {
      params: null, // BUILD non ha parametri aggiuntivi
      elementCount: (
        <span className="text-gray-500 whitespace-nowrap" title={`${t('visualFlowEditor.build.initPhase')}: ${initCount} ${t('visualFlowEditor.build.elements')}, ${t('visualFlowEditor.build.startPhase')}: ${startCount} ${t('visualFlowEditor.build.elements')}`}>
          I:{initCount} S:{startCount}
        </span>
      )
    };
  };

  return (
    <div ref={containerRef}>
      <ContainerBlock
        blockType="BUILD"
        blockIcon={<span>🔨</span>}
        compactParams={getCompactParams()}
        onRemove={onRemove}
        onDragStart={onDragStart}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        className={`bg-teal-950/90 border-2 ${isInvalid ? 'border-red-500' : 'border-teal-700/80'} rounded-lg shadow-xl p-4 transition-all duration-300`}
        isInvalid={isInvalid}
        validationType={validationType}
        blockColor="bg-teal-700"
        iconBgColor="bg-teal-900/80"
      >

        {/* Contenuto BUILD - visibile solo se non collapsed */}
        {!isCollapsed && (
        <div className="space-y-4">
          {/* Area INIT */}
          <div className="relative">
            <div className="text-xs font-semibold text-teal-300 mb-2 uppercase">{t('visualFlowEditor.build.initPhase')}</div>
            
            <div className="bg-teal-900/30 rounded-lg p-3 min-h-[60px] border border-teal-700/50">
              {block.blockInit && block.blockInit.length > 0 ? (
                <div className="space-y-2">
                  {/* Prima ancora per inserire all'inizio */}
                  <AnchorPoint
                    onDrop={(e) => onDropInitAtIndex(e, 0)}
                    onDragOver={onDragOver}
                    label=""
                  />
                  {block.blockInit.map((child: any, index: number) => (
                    <React.Fragment key={child.id || index}>
                      {renderChildren([child])}
                      <AnchorPoint
                        onDrop={(e) => onDropInitAtIndex(e, index + 1)}
                        onDragOver={onDragOver}
                        label=""
                      />
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <>
                  <AnchorPoint
                    onDrop={(e) => onDropInitAtIndex(e, 0)}
                    onDragOver={onDragOver}
                    label={t('visualFlowEditor.build.insertHere')}
                  />
                  <div className="text-center text-teal-500 text-lg py-4">
                    +
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Area START */}
          <div className="relative">
            <div className="text-xs font-semibold text-teal-300 mb-2 uppercase">{t('visualFlowEditor.build.startPhase')}</div>
            
            <div className="bg-teal-900/30 rounded-lg p-3 min-h-[60px] border border-teal-700/50">
              {block.blockStart && block.blockStart.length > 0 ? (
                <div className="space-y-2">
                  {/* Prima ancora per inserire all'inizio */}
                  <AnchorPoint
                    onDrop={(e) => onDropStartAtIndex(e, 0)}
                    onDragOver={onDragOver}
                    label=""
                  />
                  {block.blockStart.map((child: any, index: number) => (
                    <React.Fragment key={child.id || index}>
                      {renderChildren([child])}
                      <AnchorPoint
                        onDrop={(e) => onDropStartAtIndex(e, index + 1)}
                        onDragOver={onDragOver}
                        label=""
                      />
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <>
                  <AnchorPoint
                    onDrop={(e) => onDropStartAtIndex(e, 0)}
                    onDragOver={onDragOver}
                    label={t('visualFlowEditor.build.insertHere')}
                  />
                  <div className="text-center text-teal-500 text-lg py-4">
                    +
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      </ContainerBlock>
    </div>
  );
};
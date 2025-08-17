import React, { useState, useEffect, useRef } from 'react';
import { AnchorPoint } from '../../AnchorPoint/AnchorPoint';
import { ContainerBlock } from '../ContainerBlock/ContainerBlock';
import { getBlockClassName } from '@/utils/CampaignEditor/VisualFlowEditor/blockColors';
import { useTranslation } from '@/locales';

interface FlightBlockProps {
  block: any;
  onUpdate: (updates: any) => void;
  onRemove?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropInit: (e: React.DragEvent) => void;
  onDropStart: (e: React.DragEvent) => void;
  onDropEvaluate: (e: React.DragEvent) => void;
  onDropInitAtIndex: (e: React.DragEvent, index: number) => void;
  onDropStartAtIndex: (e: React.DragEvent, index: number) => void;
  onDropEvaluateAtIndex: (e: React.DragEvent, index: number) => void;
  renderChildren: (blocks: any[]) => React.ReactNode;
  isDragActive?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  isZoomed?: boolean;
  isInvalid?: boolean;
  validationType?: 'error' | 'warning';
  collapseAllTrigger?: number;
  expandAllTrigger?: number;
  globalCollapseState?: 'collapsed' | 'expanded' | 'manual';
  isCustom?: boolean;
  availableLanguages?: string[];
}

export const FlightBlock: React.FC<FlightBlockProps> = ({
  block,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDropInit,
  onDropStart,
  onDropEvaluate,
  onDropInitAtIndex,
  onDropStartAtIndex,
  onDropEvaluateAtIndex,
  renderChildren,
  isDragActive = false,
  onZoomIn,
  onZoomOut,
  isZoomed = false,
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
    const numBlockEvaluate = block.blockEvaluate?.length || 0;
    
    if (block.numBlockInit !== numBlockInit || 
        block.numBlockStart !== numBlockStart ||
        block.numBlockEvaluate !== numBlockEvaluate) {
      onUpdate({
        numBlockInit,
        numBlockStart,
        numBlockEvaluate
      });
    }
  }, [block.blockInit, block.blockStart, block.blockEvaluate, 
      block.numBlockInit, block.numBlockStart, block.numBlockEvaluate, onUpdate]);

  // Genera i parametri compatti per la visualizzazione collapsed
  const getCompactParams = () => {
    const initCount = block.blockInit?.length || 0;
    const startCount = block.blockStart?.length || 0;
    const evalCount = block.blockEvaluate?.length || 0;
    
    return {
      params: null, // FLIGHT non ha parametri aggiuntivi
      elementCount: (
        <span className="text-gray-500 whitespace-nowrap" title={`${t('visualFlowEditor.flight.initPhase')}: ${initCount} ${t('visualFlowEditor.flight.elements')}, ${t('visualFlowEditor.flight.startPhase')}: ${startCount} ${t('visualFlowEditor.flight.elements')}, ${t('visualFlowEditor.flight.evaluatePhase')}: ${evalCount} ${t('visualFlowEditor.flight.elements')}`}>
          I:{initCount} S:{startCount} E:{evalCount}
        </span>
      )
    };
  };

  return (
    <div ref={containerRef}>
      <ContainerBlock
        blockType="FLIGHT"
        blockIcon={<span>✈️</span>}
        compactParams={getCompactParams()}
        onRemove={onRemove}
        onDragStart={onDragStart}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        className={`${getBlockClassName('FLIGHT', isInvalid, validationType)} shadow-xl p-4 transition-all duration-300`}
        isInvalid={isInvalid}
        validationType={validationType}
      >

        {/* Contenuto FLIGHT - visibile solo se non collapsed */}
        {!isCollapsed && (
        <div className="space-y-4">
          {/* Area INIT */}
          <div className="relative">
            <div className="text-xs font-semibold text-sky-300 mb-2 uppercase">{t('visualFlowEditor.flight.initPhase')}</div>
            
            <div className="bg-sky-900/30 rounded-lg p-3 min-h-[50px] border border-sky-800/50">
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
                    label={t('visualFlowEditor.flight.insertHere')}
                  />
                  <div className="text-center text-sky-500 text-lg py-2">
                    +
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Area START */}
          <div className="relative">
            <div className="text-xs font-semibold text-sky-300 mb-2 uppercase">{t('visualFlowEditor.flight.startPhase')}</div>
            
            <div className="bg-sky-900/30 rounded-lg p-3 min-h-[50px] border border-sky-800/50">
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
                    label={t('visualFlowEditor.flight.insertHere')}
                  />
                  <div className="text-center text-sky-500 text-lg py-2">
                    +
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Area EVALUATE */}
          <div className="relative">
            <div className="text-xs font-semibold text-sky-300 mb-2 uppercase">{t('visualFlowEditor.flight.evaluatePhase')}</div>
            
            <div className="bg-sky-900/30 rounded-lg p-3 min-h-[50px] border border-sky-800/50">
              {block.blockEvaluate && block.blockEvaluate.length > 0 ? (
                <div className="space-y-2">
                  {/* Prima ancora per inserire all'inizio */}
                  <AnchorPoint
                    onDrop={(e) => onDropEvaluateAtIndex(e, 0)}
                    onDragOver={onDragOver}
                    label=""
                  />
                  {block.blockEvaluate.map((child: any, index: number) => (
                    <React.Fragment key={child.id || index}>
                      {renderChildren([child])}
                      <AnchorPoint
                        onDrop={(e) => onDropEvaluateAtIndex(e, index + 1)}
                        onDragOver={onDragOver}
                        label=""
                      />
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <>
                  <AnchorPoint
                    onDrop={(e) => onDropEvaluateAtIndex(e, 0)}
                    onDragOver={onDragOver}
                    label={t('visualFlowEditor.flight.insertHere')}
                  />
                  <div className="text-center text-sky-500 text-lg py-2">
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
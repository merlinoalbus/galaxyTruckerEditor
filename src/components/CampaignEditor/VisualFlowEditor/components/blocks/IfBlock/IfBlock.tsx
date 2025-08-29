import React, { useState, useEffect, useRef } from 'react';
import { IfBlockParameters } from './IfBlockParameters';
import { AnchorPoint } from '../../AnchorPoint/AnchorPoint';
import { ContainerBlock } from '../ContainerBlock/ContainerBlock';
import { ZoomControls } from '../../ZoomControls/ZoomControls';
import { useTranslation } from '@/locales';

const IF_TYPES = [
  { value: 'IF', label: 'IF' },
  { value: 'IFNOT', label: 'IF NOT' },
  { value: 'IF_DEBUG', label: 'IF DEBUG' },
  { value: 'IF_FROM_CAMPAIGN', label: 'IF FROM CAMPAIGN' },
  { value: 'IF_HAS_CREDITS', label: 'IF HAS CREDITS' },
  { value: 'IF_IS', label: 'IF IS' },
  { value: 'IF_MAX', label: 'IF MAX' },
  { value: 'IF_MIN', label: 'IF MIN' },
  { value: 'IF_MISSION_WON', label: 'IF MISSION WON' },
  { value: 'IF_ORDER', label: 'IF ORDER' },
  { value: 'IF_POSITION_ORDER', label: 'IF POSITION ORDER' },
  { value: 'IF_PROB', label: 'IF PROBABILITY' },
  { value: 'IF_TUTORIAL_SEEN', label: 'IF TUTORIAL SEEN' },
  { value: 'IF_ALL_RESIGNED', label: 'IF ALL RESIGNED' },
  { value: 'IFMISSIONRESULTIS', label: 'IF MISSION RESULT IS' },
  { value: 'IFMISSIONRESULTMIN', label: 'IF MISSION RESULT MIN' }
];

interface IfBlockProps {
  block: any;
  onUpdate: (updates: any) => void;
  onRemove?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropThen: (e: React.DragEvent) => void;
  onDropElse: (e: React.DragEvent) => void;
  onDropThenAtIndex: (e: React.DragEvent, index: number) => void;
  onDropElseAtIndex: (e: React.DragEvent, index: number) => void;
  renderChildren: (blocks: any[]) => React.ReactNode;
  isDragActive?: boolean;
  onZoomIn?: (blockId: string) => void;
  onZoomOut?: () => void;
  isZoomed?: boolean;
  sessionData?: any;
  isInvalid?: boolean;
  validationType?: 'error' | 'warning';
  collapseAllTrigger?: number;
  expandAllTrigger?: number;
  globalCollapseState?: 'collapsed' | 'expanded' | 'manual';
  isCustom?: boolean;
  availableLanguages?: string[];
}

export const IfBlock: React.FC<IfBlockProps> = ({
  block,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDropThen,
  onDropElse,
  onDropThenAtIndex,
  onDropElseAtIndex,
  renderChildren,
  isDragActive = false,
  onZoomIn,
  onZoomOut,
  isZoomed = false,
  sessionData,
  isInvalid = false,
  validationType,
  collapseAllTrigger = 0,
  expandAllTrigger = 0,
  globalCollapseState = 'manual',
  isCustom,
  availableLanguages
}) => {
  const { t } = useTranslation();
  // Stato locale per controllare la visualizzazione del contenitore ELSE
  // Inizializzato in base alla presenza di blocchi in elseBlocks
  const [showElse, setShowElse] = useState(
    block.elseBlocks && block.elseBlocks.length > 0
  );
  
  // Stato per collapse/expand - rispetta il globalCollapseState all'inizializzazione
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return globalCollapseState === 'collapsed';
  });
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false); // Flag per espansione manuale
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
      // Se l'utente ha espanso manualmente, non fare auto-collapse
      if (isManuallyExpanded) return;
      
      if (containerRef.current && !isCollapsed) {
        const container = containerRef.current;
        const width = container.offsetWidth;
        
        // Calcola lo spazio minimo necessario per i parametri
        // Icon(40px) + Label(100px) + Select(150px) + Params(200px) + Else(80px) + padding(80px) = ~650px
        const minRequiredWidth = 650;
        
        // Se larghezza insufficiente, collapse automaticamente
        if (width < minRequiredWidth) {
          setIsCollapsed(true);
        }
      }
    };
    
    checkSpace();
    // Ricontrolla quando la finestra viene ridimensionata
    const resizeObserver = new ResizeObserver(checkSpace);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [isCollapsed, isManuallyExpanded]);
  
  // Aggiorna lo stato quando cambiano i blocchi (per sincronizzare con modifiche esterne)
  useEffect(() => {
    setShowElse(block.elseBlocks && block.elseBlocks.length > 0);
  }, [block.elseBlocks]);
  
  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    // Se l'utente espande manualmente, setta la flag
    if (!newCollapsedState) {
      setIsManuallyExpanded(true);
    } else {
      // Se collassa, resetta la flag
      setIsManuallyExpanded(false);
    }
  };

  // Genera i parametri compatti per la visualizzazione collapsed
  const getCompactParams = () => {
    const parts = [];
    parts.push(<span key="type" className="text-blue-400">{block.ifType || 'IF'}</span>);
    if (block.variabile) parts.push(<span key="var">{block.variabile}</span>);
    if (block.valore) parts.push(<span key="val">= {block.valore}</span>);
    if (showElse) parts.push(<span key="else" className="text-slate-400">+ ELSE</span>);
    
    const thenCount = block.thenBlocks?.length || 0;
    const elseCount = block.elseBlocks?.length || 0;
    
    // Usa il formato corretto per il conteggio
    let elementCountText;
    let elementCountTooltip;
    
    if (showElse) {
      // Se ci sono elementi, mostra T:x E:y, altrimenti mostra "0 elementi"
      if (thenCount > 0 || elseCount > 0) {
        elementCountText = `T:${thenCount} E:${elseCount}`;
        elementCountTooltip = t('visualFlowEditor.if.thenElseTooltip')
          .replace('{thenCount}', thenCount.toString())
          .replace('{elseCount}', elseCount.toString());
      } else {
        elementCountText = t('visualFlowEditor.if.noElements');
        elementCountTooltip = t('visualFlowEditor.if.noElementsTooltip');
      }
    } else {
      elementCountText = thenCount === 1 
        ? t('visualFlowEditor.if.elementSingle')
        : t('visualFlowEditor.if.elements').replace('{count}', thenCount.toString());
      elementCountTooltip = t('visualFlowEditor.if.thenTooltip').replace('{count}', thenCount.toString());
    }
    
    return {
      params: parts.length > 0 ? (
        <div className="flex items-center gap-2 truncate">
          {parts}
        </div>
      ) : null,
      elementCount: (
        <span 
          className="text-gray-500 whitespace-nowrap cursor-help" 
          title={elementCountTooltip}
        >
          {elementCountText}
        </span>
      )
    };
  };

  return (
    <div ref={containerRef}>
      <ContainerBlock
        blockType="IF"
        blockIcon={<span>🔀</span>}
        compactParams={getCompactParams()}
        onRemove={onRemove}
        onDragStart={onDragStart}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onZoomIn={onZoomIn ? () => onZoomIn(block.id) : undefined}
        onZoomOut={onZoomOut}
        className={`bg-gradient-to-br from-gray-800/95 to-gray-900/95 rounded-xl border ${
          isInvalid 
            ? 'border-red-500 border-2 shadow-red-500/50' 
            : 'border-gray-600/80'
        } p-4 mb-2 shadow-xl hover:shadow-2xl transition-shadow duration-200`}
        isInvalid={isInvalid}
        validationType={validationType}
        blockColor="bg-blue-900/80"
        iconBgColor="bg-blue-900/80"
      >
        
        {/* Parametri editabili - visibili solo se non collapsed */}
        {!isCollapsed && (
          <div className="flex items-center gap-3 mb-3 pl-8 pr-8">
            {/* Tipo IF */}
            <select
              className="bg-slate-800/50 text-gray-200 px-2 py-1 rounded text-xs border border-slate-700 focus:border-blue-600 focus:outline-none"
              value={block.ifType || 'IF'}
              onChange={(e) => onUpdate({ 
                ifType: e.target.value,
                variabile: '',
                valore: ''
              })}
              onClick={(e) => e.stopPropagation()}
            >
              {IF_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            
            {/* Parametri dinamici inline */}
            <div className="flex-1">
              <IfBlockParameters 
                block={block} 
                onUpdate={onUpdate}
                sessionData={sessionData}
              />
            </div>
            
            {/* Toggle ELSE */}
            <label className="flex items-center gap-2 text-xs text-gray-400 ml-auto">
              <input
                type="checkbox"
                checked={showElse}
                onChange={(e) => {
                  setShowElse(e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                className="accent-blue-600"
              />
              <span>ELSE</span>
            </label>
          </div>
        )}
        
        {/* Container THEN/ELSE - visibile solo se non collapsed */}
        {!isCollapsed && (
          <div className={`grid ${showElse ? 'grid-cols-2' : 'grid-cols-1'} gap-3 pl-8`}>
          {/* THEN Container */}
          <div className="relative bg-gradient-to-b from-emerald-950/90 to-emerald-950/95 border border-emerald-700/80 rounded-xl p-3 min-h-[100px] shadow-inner hover:border-emerald-700/90 transition-colors duration-200">
            {/* Controlli Zoom per THEN */}
            {onZoomIn && block.thenBlocks && block.thenBlocks.length > 0 && (
              <div className="absolute top-0.5 left-0.5 z-20">
                <ZoomControls
                  onZoomIn={() => onZoomIn(`${block.id}-then`)}
                  size="small"
                  className="opacity-80 hover:opacity-100"
                />
              </div>
            )}
            
            <div className="absolute top-2 left-8 text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-900/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
              Then • {block.numThen || 0}
            </div>
            <div className="mt-6 space-y-1">
              {/* Punto di ancoraggio iniziale */}
              <AnchorPoint
                onDragOver={onDragOver}
                onDrop={(e) => onDropThenAtIndex(e, 0)}
                label={t('visualFlowEditor.if.insertInThen')}
              />
              
              {/* Blocchi con punti di ancoraggio */}
              {block.thenBlocks && block.thenBlocks.length > 0 ? (
                block.thenBlocks.map((childBlock: any, index: number) => (
                  <React.Fragment key={childBlock.id}>
                    {renderChildren([childBlock])}
                    <AnchorPoint
                      onDragOver={onDragOver}
                      onDrop={(e) => onDropThenAtIndex(e, index + 1)}
                      label=""
                    />
                  </React.Fragment>
                ))
              ) : null}
            </div>
          </div>
          
          {/* ELSE Container */}
          {showElse && (
            <div className="relative bg-gradient-to-b from-slate-800/90 to-slate-800/95 border border-slate-600/80 rounded-xl p-3 min-h-[100px] shadow-inner hover:border-slate-600/90 transition-colors duration-200">
              {/* Controlli Zoom per ELSE */}
              {onZoomIn && block.elseBlocks && block.elseBlocks.length > 0 && (
                <div className="absolute top-0.5 left-0.5 z-20">
                  <ZoomControls
                    onZoomIn={() => onZoomIn(`${block.id}-else`)}
                    size="small"
                    className="opacity-80 hover:opacity-100"
                  />
                </div>
              )}
              
              <div className="absolute top-2 left-8 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-700/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
                Else • {block.numElse || 0}
              </div>
              <div className="mt-6 space-y-1">
                {/* Punto di ancoraggio iniziale */}
                <AnchorPoint
                  onDragOver={onDragOver}
                  onDrop={(e) => onDropElseAtIndex(e, 0)}
                  label={t('visualFlowEditor.if.insertInElse')}
                />
                
                {/* Blocchi con punti di ancoraggio */}
                {block.elseBlocks && block.elseBlocks.length > 0 ? (
                  block.elseBlocks.map((childBlock: any, index: number) => (
                    <React.Fragment key={childBlock.id}>
                      {renderChildren([childBlock])}
                      <AnchorPoint
                        onDragOver={onDragOver}
                        onDrop={(e) => onDropElseAtIndex(e, index + 1)}
                        label=""
                      />
                    </React.Fragment>
                  ))
                ) : null}
              </div>
            </div>
          )}
          </div>
        )}
      </ContainerBlock>
    </div>
  );
};
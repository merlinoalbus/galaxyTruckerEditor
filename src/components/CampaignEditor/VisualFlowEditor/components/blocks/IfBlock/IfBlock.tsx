import React, { useState, useEffect, useRef } from 'react';
import { Trash2, GripVertical, ChevronDown, ChevronUp, GitBranch } from 'lucide-react';
import { IfBlockParameters } from './IfBlockParameters';
import { AnchorPoint } from '../../AnchorPoint/AnchorPoint';
import { ZoomControls } from '../../ZoomControls';

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
  { value: 'IF_PROB', label: 'IF PROBABILITY' },
  { value: 'IF_TUTORIAL_SEEN', label: 'IF TUTORIAL SEEN' },
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
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  isZoomed?: boolean;
  sessionData?: any;
  isInvalid?: boolean;
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
  isInvalid = false
}) => {
  // Stato locale per controllare la visualizzazione del contenitore ELSE
  // Inizializzato in base alla presenza di blocchi in elseBlocks
  const [showElse, setShowElse] = useState(
    block.elseBlocks && block.elseBlocks.length > 0
  );
  
  // Stato per collapse/expand - IF blocks sono container quindi default expanded
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false); // Flag per espansione manuale
  const containerRef = useRef<HTMLDivElement>(null);
  
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
  
  return (
    <div
      ref={containerRef}
      className={`relative bg-gradient-to-br from-gray-800/95 to-gray-900/95 rounded-xl border ${
        isInvalid 
          ? 'border-red-500 border-2 shadow-red-500/50' 
          : 'border-gray-600/80'
      } p-4 mb-2 shadow-xl hover:shadow-2xl transition-shadow duration-200`}
    >
      {/* Delete button - in alto a destra con stesso stile zoom - solo se onRemove è definito */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 bg-slate-700/80 hover:bg-red-600 border border-slate-600/50 rounded-md z-10 transition-all duration-200 backdrop-blur-sm"
          title="Elimina blocco"
        >
          <Trash2 className="w-3 h-3 text-gray-400 hover:text-white" />
        </button>
      )}
      
      {/* Collapse/Expand button - vicino al delete */}
      <button
        onClick={() => {
          const newCollapsedState = !isCollapsed;
          setIsCollapsed(newCollapsedState);
          // Se l'utente espande manualmente, setta la flag
          if (!newCollapsedState) {
            setIsManuallyExpanded(true);
          } else {
            // Se collassa, resetta la flag
            setIsManuallyExpanded(false);
          }
        }}
        className="absolute top-8 right-2 p-1 bg-slate-700/80 hover:bg-slate-600 border border-slate-600/50 rounded-md z-10 transition-all duration-200 backdrop-blur-sm"
        title={isCollapsed ? "Espandi blocco" : "Comprimi blocco"}
      >
        {isCollapsed 
          ? <ChevronDown className="w-3 h-3 text-gray-400" />
          : <ChevronUp className="w-3 h-3 text-gray-400" />
        }
      </button>
      
      {/* Controlli Zoom - in alto a sinistra con stile sottile - SEMPRE VISIBILI */}
      {(onZoomIn || onZoomOut) && (
        <ZoomControls
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          size="small"
          position="top-left"
          className="opacity-80 hover:opacity-100"
        />
      )}
      
      {/* Drag handle - SOLO questo è draggable */}
      <div 
        className="absolute -left-2 top-1/2 -translate-y-1/2 p-1 bg-gray-600 rounded cursor-move"
        draggable
        onDragStart={onDragStart}
      >
        <GripVertical className="w-3 h-3 text-white" />
      </div>
      
      {/* Configurazione IF in una riga unica */}
      <div className={`flex items-center gap-3 ${!isCollapsed ? 'mb-3 pb-3 border-b border-slate-700/50' : ''} pl-8 pr-8 ${isManuallyExpanded ? 'overflow-x-auto' : ''}`}>
        {/* Icona IF */}
        <div className="bg-blue-900/80 p-1.5 rounded-lg">
          <GitBranch className="w-4 h-4 text-blue-400" />
        </div>
        
        {/* Label identificativa */}
        <span className="text-sm font-semibold text-white">
          IF
        </span>
        
        {/* Parametri - visibili solo se expanded */}
        {!isCollapsed && (
          <>
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
          </>
        )}
      </div>
        
        {/* Container THEN/ELSE - visibile solo se non collapsed */}
        {!isCollapsed && (
          <div className={`grid ${showElse ? 'grid-cols-2' : 'grid-cols-1'} gap-3 pl-8`}>
          {/* THEN Container */}
          <div className="relative bg-gradient-to-b from-emerald-950/90 to-emerald-950/95 border border-emerald-700/80 rounded-xl p-3 min-h-[100px] shadow-inner hover:border-emerald-700/90 transition-colors duration-200">
            <div className="absolute top-2 left-3 text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-900/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
              Then • {block.numThen || 0}
            </div>
            <div className="mt-6 space-y-1">
              {/* Punto di ancoraggio iniziale */}
              <AnchorPoint
                onDragOver={onDragOver}
                onDrop={(e) => onDropThenAtIndex(e, 0)}
                label="Inserisci in THEN"
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
              <div className="absolute top-2 left-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-700/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
                Else • {block.numElse || 0}
              </div>
              <div className="mt-6 space-y-1">
                {/* Punto di ancoraggio iniziale */}
                <AnchorPoint
                  onDragOver={onDragOver}
                  onDrop={(e) => onDropElseAtIndex(e, 0)}
                  label="Inserisci in ELSE"
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
    </div>
  );
};
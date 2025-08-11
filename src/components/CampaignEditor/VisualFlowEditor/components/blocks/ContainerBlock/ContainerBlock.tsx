import React, { useState, useEffect, useRef } from 'react';
import { Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { AnchorPoint } from '../../AnchorPoint/AnchorPoint';
import { ZoomControls } from '../../ZoomControls';

interface ContainerBlockProps {
  block: any;
  onRemove?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDropAtIndex: (e: React.DragEvent, index: number) => void;
  renderChildren: (blocks: any[]) => React.ReactNode;
  isDragActive?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  isZoomed?: boolean;
  isInvalid?: boolean;
}

export const ContainerBlock: React.FC<ContainerBlockProps> = ({
  block,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDropAtIndex,
  renderChildren,
  isDragActive = false,
  onZoomIn,
  onZoomOut,
  isZoomed = false,
  isInvalid = false
}) => {
  // Stato per collapse/expand - container blocks default expanded
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-collapse se lo spazio è insufficiente
  useEffect(() => {
    const checkSpace = () => {
      // Se l'utente ha espanso manualmente, non fare auto-collapse
      if (isManuallyExpanded) return;
      
      if (containerRef.current && !isCollapsed) {
        const container = containerRef.current;
        const width = container.offsetWidth;
        
        // Calcola lo spazio minimo necessario per ContainerBlock
        // Icon(40px) + Type(100px) + Elements count(100px) + padding(80px) = ~320px
        const minRequiredWidth = 400;
        
        // Se larghezza insufficiente, collapse automaticamente
        if (width < minRequiredWidth) {
          setIsCollapsed(true);
        }
      }
    };
    
    checkSpace();
    // Ricontrolla quando il container viene ridimensionato
    const resizeObserver = new ResizeObserver(checkSpace);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [isCollapsed, isManuallyExpanded]);
  const getBlockStyle = () => {
    switch (block.type) {
      case 'MENU':
        return 'bg-indigo-950/90 border-indigo-800/80';
      case 'OPT':
        return 'bg-cyan-950/90 border-cyan-800/80';
      default:
        return 'bg-slate-800/90 border-slate-700/80';
    }
  };

  const getBlockIcon = () => {
    switch (block.type) {
      case 'MENU': return <span className="text-base">☰</span>;
      case 'OPT': return <span className="text-base">⭕</span>;
      default: return <span className="text-base">📦</span>;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${getBlockStyle()} rounded border ${
        isInvalid 
          ? 'border-red-500 border-2 shadow-red-500/50 shadow-lg' 
          : ''
      } p-4 mb-3`}
    >
      {/* Delete button - stesso stile zoom - solo se onRemove è definito */}
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
        className="absolute -left-3 top-1/2 -translate-y-1/2 p-1 bg-gray-600 hover:bg-gray-500 rounded cursor-move"
        draggable
        onDragStart={onDragStart}
      >
        <GripVertical className="w-3 h-3 text-white" />
      </div>
      
      {/* Block header - con padding per zoom button */}
      <div className={`flex items-center gap-2 ${!isCollapsed ? 'mb-3 pb-2 border-b border-gray-600' : ''} pl-8`}>
        <div className="text-gray-400">{getBlockIcon()}</div>
        <span className="text-sm font-bold text-white uppercase">{block.type}</span>
        <span className="text-xs text-gray-400 ml-auto">
          {block.children?.length || 0} elementi
        </span>
      </div>
      
      {/* Children container with anchor points - visibile solo se expanded */}
      {!isCollapsed && (
        <div className="space-y-2 pl-8">
        {/* Initial anchor point */}
        <AnchorPoint
          onDragOver={onDragOver}
          onDrop={(e) => onDropAtIndex(e, 0)}
          label="Inserisci qui"
        />
        
        {/* Render children with anchor points between them */}
        {block.children && block.children.length > 0 ? (
          block.children.map((child: any, index: number) => (
            <React.Fragment key={child.id}>
              {renderChildren([child])}
              <AnchorPoint
                onDragOver={onDragOver}
                onDrop={(e) => onDropAtIndex(e, index + 1)}
                label=""
              />
            </React.Fragment>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p className="text-xs">Container vuoto</p>
            <p className="text-xs text-gray-600 mt-1">Trascina qui i blocchi</p>
          </div>
        )}
        </div>
      )}
    </div>
  );
};
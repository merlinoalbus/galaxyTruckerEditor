import React, { useState, useEffect, useRef } from 'react';
import { FileCode, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { AnchorPoint } from '../../AnchorPoint/AnchorPoint';
import { InlineZoomControls } from '../../ZoomControls';
import { useTranslation } from '@/locales';
import type { IFlowBlock } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

interface ScriptBlockProps {
  block: IFlowBlock;
  onUpdateName: (name: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDropAtIndex: (e: React.DragEvent, index: number) => void;
  children: React.ReactNode;
  isDragActive?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export const ScriptBlock: React.FC<ScriptBlockProps> = ({
  block,
  onUpdateName,
  onDragOver,
  onDrop,
  onDropAtIndex,
  children,
  isDragActive = false,
  onZoomIn,
  onZoomOut
}) => {
  const { t } = useTranslation();
  // Stato per collapse/expand - ScriptBlock default expanded (è un container)
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
        
        // Calcola lo spazio minimo necessario per ScriptBlock
        // Icon(50px) + Label(100px) + Input(200px) + File info(200px) + padding(100px) = ~650px
        const minRequiredWidth = 650;
        
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
  return (
    <div ref={containerRef} className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-lg p-6 relative border border-slate-700/50 backdrop-blur-sm shadow-xl w-full" style={{ minWidth: '90%' }}>
      {/* Zoom controls in alto a sinistra */}
      {(onZoomIn || onZoomOut) && (
        <div className="absolute top-3 left-3 z-10">
          <InlineZoomControls
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            size="small"
          />
        </div>
      )}
      
      {/* Collapse/Expand button - in alto a destra */}
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
        className="absolute top-8 right-3 p-1 bg-slate-700/80 hover:bg-slate-600 border border-slate-600/50 rounded-md z-10 transition-all duration-200 backdrop-blur-sm"
        title={isCollapsed ? t('visualFlowEditor.script.expand') : t('visualFlowEditor.script.collapse')}
      >
        {isCollapsed 
          ? <ChevronDown className="w-3 h-3 text-gray-400" />
          : <ChevronUp className="w-3 h-3 text-gray-400" />
        }
      </button>
      
      {/* Header del blocco SCRIPT con padding left per fare spazio al pulsante zoom */}
      <div className={`flex items-center gap-3 ${!isCollapsed ? 'mb-4 pb-4 border-b border-slate-600' : ''} pl-10 pr-10`}>
        <div className="bg-slate-700/50 p-2 rounded-lg">
          <FileCode className="w-4 h-4 text-blue-400" />
        </div>
        <label className="text-xs text-gray-400">{t('visualFlowEditor.script.scriptNameLabel')}</label>
        <input
          type="text"
          className="bg-slate-700 text-white px-2 py-1 rounded text-sm w-48 border border-slate-600 focus:border-slate-500 focus:outline-none"
          value={block.scriptName || ''}
          onChange={(e) => {
            const newName = e.target.value;
            onUpdateName(newName);
          }}
          placeholder={t('visualFlowEditor.script.scriptName')}
        />
        
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
          <span>{t('visualFlowEditor.script.fileLabel')} {block.fileName}</span>
          <span>{t('visualFlowEditor.script.blocksLabel')} {block.children?.length || 0}</span>
        </div>
      </div>
      
      {/* Area container per i blocchi - visibile solo se non collapsed */}
      {!isCollapsed && (
      <div 
        className="bg-slate-900/50 rounded-lg p-4"
      >
        
        <div className="space-y-2">
          {/* Punto di ancoraggio iniziale */}
          <AnchorPoint
            onDragOver={onDragOver}
            onDrop={(e) => onDropAtIndex(e, 0)}
            label=""
          />
          
          {/* Renderizza i blocchi con punti di ancoraggio tra di loro */}
          {block.children && block.children.length > 0 ? (
            <>
              {React.Children.map(children, (child, index) => (
                <React.Fragment key={index}>
                  {child}
                  <AnchorPoint
                    onDragOver={onDragOver}
                    onDrop={(e) => onDropAtIndex(e, index + 1)}
                    label=""
                  />
                </React.Fragment>
              ))}
            </>
          ) : (
            <div className="text-center py-16">
              {isDragActive && (
                <div className="text-gray-600">
                  <Plus className="w-8 h-8 mx-auto opacity-20" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
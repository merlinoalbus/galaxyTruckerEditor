import React, { useState, useEffect, useRef } from 'react';
import { AnchorPoint } from '../../AnchorPoint/AnchorPoint';
import { ContainerBlock } from '../ContainerBlock/ContainerBlock';
import { MultilingualTextEditor } from '../../MultilingualTextEditor';
import { SelectWithModal } from '../../SelectWithModal/SelectWithModal';
import { OptType } from '@/types/CampaignEditor/VisualFlowEditor/BlockTypes';

const OPT_TYPES = [
  { value: 'OPT_SIMPLE', label: 'Semplice', icon: '⭕' },
  { value: 'OPT_CONDITIONAL', label: 'Condizionale (IF)', icon: '🚩' },
  { value: 'OPT_CONDITIONAL_NOT', label: 'Condizionale (IF NOT)', icon: '🏳️' }
];

interface OptBlockProps {
  block: any;
  onUpdate: (updates: any) => void;
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
  sessionData?: any;
  isInvalid?: boolean;
}

export const OptBlock: React.FC<OptBlockProps> = ({
  block,
  onUpdate,
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
  sessionData,
  isInvalid = false
}) => {
  // Stato per collapse/expand
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-collapse se lo spazio è insufficiente
  useEffect(() => {
    const checkSpace = () => {
      if (isManuallyExpanded) return;
      
      if (containerRef.current && !isCollapsed) {
        const container = containerRef.current;
        const width = container.offsetWidth;
        
        // Spazio minimo necessario per OptBlock
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
      resizeObserver.disconnect();
    };
  }, [isCollapsed, isManuallyExpanded]);

  // Inizializza optType se non presente
  useEffect(() => {
    if (!block.optType) {
      onUpdate({ optType: 'OPT_SIMPLE', condition: null });
    }
  }, [block.optType, onUpdate]);

  // Ottieni l'icona per il tipo corrente
  const getCurrentIcon = () => {
    const currentType = OPT_TYPES.find(t => t.value === block.optType);
    return currentType ? <span>{currentType.icon}</span> : <span>⭕</span>;
  };

  // Gestisce il cambio di tipo OPT
  const handleTypeChange = (newType: OptType) => {
    const updates: any = { optType: newType };
    
    // Se passa a SIMPLE, rimuovi condition
    if (newType === 'OPT_SIMPLE') {
      updates.condition = null;
    } 
    // Se passa a CONDITIONAL, inizializza condition se non presente
    else if (!block.condition) {
      updates.condition = '';
    }
    
    onUpdate(updates);
  };

  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    setIsManuallyExpanded(!newCollapsedState);
  };

  // Genera i parametri compatti per la visualizzazione collapsed
  const getCompactParams = () => {
    const parts = [];
    
    // Aggiungi tipo OPT
    const typeLabel = OPT_TYPES.find(t => t.value === block.optType)?.label || 'Semplice';
    
    // Aggiungi condizione se presente
    if ((block.optType === 'OPT_CONDITIONAL' || block.optType === 'OPT_CONDITIONAL_NOT') && block.condition) {
      parts.push(<span key="cond" className="text-cyan-400">{typeLabel} ({block.condition})</span>);
    } else {
      parts.push(<span key="type" className="text-cyan-400">{typeLabel}</span>);
    }
    
    // Aggiungi preview del testo se presente - solo se c'è spazio
    if (block.text) {
      const textPreview = typeof block.text === 'string' 
        ? block.text 
        : (block.text.EN || '');
      if (textPreview) {
        parts.push(
          <span key="text" className="truncate" title={textPreview}>
            "{textPreview}"
          </span>
        );
      }
    }
    
    // Conteggio elementi da gestire separatamente
    const count = block.children?.length || 0;
    
    return {
      params: parts.length > 0 ? (
        <div className="flex items-center gap-2 truncate">
          {parts}
        </div>
      ) : null,
      elementCount: <span className="text-gray-500 whitespace-nowrap">{count} elementi</span>
    };
  };

  return (
    <div ref={containerRef}>
      <ContainerBlock
        blockType="OPT"
        blockIcon={getCurrentIcon()}
        compactParams={getCompactParams()}
        onRemove={onRemove}
        onDragStart={onDragStart}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        className={`bg-cyan-950/90 rounded border ${
          isInvalid 
            ? 'border-red-500 border-2 shadow-red-500/50 shadow-lg' 
            : 'border-cyan-800/80'
        } p-4 mb-3`}
        isInvalid={isInvalid}
        blockColor="bg-cyan-700"
        iconBgColor="bg-cyan-900/80"
      >
        {/* Parametri editabili - visibili solo se non collapsed */}
        {!isCollapsed && (
          <div className="mb-3 pl-8">
            {/* Prima riga: Tipo */}
            <div className="flex items-center gap-3 mb-3">
              <select
                className="bg-slate-800/50 text-gray-200 px-2 py-1 rounded text-xs border border-slate-700 focus:border-cyan-600 focus:outline-none"
                value={block.optType || 'OPT_SIMPLE'}
                onChange={(e) => handleTypeChange(e.target.value as OptType)}
                onClick={(e) => e.stopPropagation()}
              >
                {OPT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Campo condition per OPT_CONDITIONAL */}
            {(block.optType === 'OPT_CONDITIONAL' || block.optType === 'OPT_CONDITIONAL_NOT') && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs text-cyan-400">Condizione:</span>
                <SelectWithModal
                  type="variable"
                  value={block.condition || ''}
                  onChange={(value) => onUpdate({ condition: value })}
                  placeholder="Seleziona variabile..."
                  availableItems={sessionData?.variables || []}
                  onAddItem={sessionData?.addVariable}
                  className="flex-1"
                />
              </div>
            )}
            
            {/* Editor testo multilingua */}
            <div>
              <MultilingualTextEditor
                value={block.text || { EN: '', CS: null, DE: null, ES: null, FR: null, PL: null, RU: null }}
                onChange={(text) => onUpdate({ text })}
                placeholder="Testo opzione..."
                label="Testo Opzione"
              />
            </div>
          </div>
        )}
        
        {/* Children container with anchor points */}
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
      </ContainerBlock>
    </div>
  );
};
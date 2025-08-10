import React, { useState, useEffect, useRef } from 'react';
import { Trash2, GripVertical, ChevronDown, ChevronUp, Circle, Flag, FlagOff } from 'lucide-react';
import { AnchorPoint } from '../../AnchorPoint/AnchorPoint';
import { ZoomControls } from '../../ZoomControls';
import { MultilingualTextEditor } from '../../MultilingualTextEditor';
import { SelectWithModal } from '../../SelectWithModal/SelectWithModal';
import { OptType } from '@/types/CampaignEditor/VisualFlowEditor/BlockTypes';

const OPT_TYPES = [
  { value: 'OPT_SIMPLE', label: 'Semplice', icon: Circle },
  { value: 'OPT_CONDITIONAL', label: 'Condizionale (IF)', icon: Flag },
  { value: 'OPT_CONDITIONAL_NOT', label: 'Condizionale (IF NOT)', icon: FlagOff }
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
    return currentType ? <currentType.icon className="w-4 h-4" /> : <Circle className="w-4 h-4" />;
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

  return (
    <div
      ref={containerRef}
      className={`relative bg-cyan-950/90 rounded border ${
        isInvalid 
          ? 'border-red-500 border-2 shadow-red-500/50 shadow-lg' 
          : 'border-cyan-800/80'
      } p-4 mb-3`}
    >
      {/* Delete button - solo se onRemove è definito */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 bg-slate-700/80 hover:bg-red-600 border border-slate-600/50 rounded-md z-10 transition-all duration-200 backdrop-blur-sm"
          title="Elimina blocco"
        >
          <Trash2 className="w-3 h-3 text-gray-400 hover:text-white" />
        </button>
      )}
      
      {/* Collapse/Expand button */}
      <button
        onClick={() => {
          const newCollapsedState = !isCollapsed;
          setIsCollapsed(newCollapsedState);
          setIsManuallyExpanded(!newCollapsedState);
        }}
        className="absolute top-8 right-2 p-1 bg-slate-700/80 hover:bg-slate-600 border border-slate-600/50 rounded-md z-10 transition-all duration-200 backdrop-blur-sm"
        title={isCollapsed ? "Espandi blocco" : "Comprimi blocco"}
      >
        {isCollapsed 
          ? <ChevronDown className="w-3 h-3 text-gray-400" />
          : <ChevronUp className="w-3 h-3 text-gray-400" />
        }
      </button>
      
      {/* Controlli Zoom - SEMPRE VISIBILI */}
      {(onZoomIn || onZoomOut) && (
        <ZoomControls
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          size="small"
          position="top-left"
          className="opacity-80 hover:opacity-100"
        />
      )}
      
      {/* Drag handle */}
      <div 
        className="absolute -left-3 top-1/2 -translate-y-1/2 p-1 bg-gray-600 hover:bg-gray-500 rounded cursor-move"
        draggable
        onDragStart={onDragStart}
      >
        <GripVertical className="w-3 h-3 text-white" />
      </div>
      
      {/* Header con tipo OPT e semaforo nella stessa riga */}
      <div className={`flex items-center gap-3 ${!isCollapsed ? 'mb-3 pb-2 border-b border-cyan-700/50' : ''} pl-8`}>
        <div className="text-cyan-400">{getCurrentIcon()}</div>
        <span className="text-sm font-bold text-white uppercase">OPT</span>
        
        {/* Tipo OPT sempre visibile */}
        {!isCollapsed ? (
          <select
            className="bg-slate-800/50 text-gray-200 px-2 py-1 rounded text-xs border border-slate-700 focus:border-cyan-600 focus:outline-none"
            value={block.optType || 'OPT_SIMPLE'}
            onChange={(e) => handleTypeChange(e.target.value as OptType)}
            onClick={(e) => e.stopPropagation()}
          >
            {OPT_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-cyan-400">
            {OPT_TYPES.find(t => t.value === block.optType)?.label || 'Semplice'}
          </span>
        )}
        
        {/* Semaforo sempre visibile se necessario */}
        {(block.optType === 'OPT_CONDITIONAL' || block.optType === 'OPT_CONDITIONAL_NOT') && (
          <>
            <span className="text-xs text-cyan-400">
              Semaforo{block.optType === 'OPT_CONDITIONAL_NOT' ? ' (NOT)' : ''}:
            </span>
            {!isCollapsed ? (
              <SelectWithModal
                type="semaphore"
                value={block.condition || ''}
                onChange={(value) => onUpdate({ condition: value })}
                placeholder="Seleziona..."
                availableItems={sessionData?.semaphores || []}
                onAddItem={sessionData?.addSemaphore}
                className="flex-1 max-w-[200px]"
              />
            ) : (
              <span className="text-xs text-gray-300">
                {block.condition || '(non definito)'}
              </span>
            )}
          </>
        )}
        
        <span className="text-xs text-gray-400 ml-auto">
          {block.children?.length || 0} elementi
        </span>
      </div>
      
      {/* Parametri - visibili solo se espanso */}
      {!isCollapsed && (
        <div className="space-y-3 pl-8">
          {/* Testo multilingua */}
          <MultilingualTextEditor
            value={typeof block.text === 'string' 
              ? { EN: block.text } 
              : (block.text || {})}
            onChange={(text) => onUpdate({ text })}
            placeholder="Testo opzione"
            label="Testo Opzione"
          />
          
          {/* Container per i blocchi figli - senza label */}
          <div className="bg-slate-800/30 rounded-lg border border-cyan-700/30 p-3 min-h-[100px]">
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
              <div className="text-center text-gray-500 py-4">
                <p className="text-xs">Container vuoto</p>
                <p className="text-xs text-gray-600 mt-1">Trascina qui i blocchi</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
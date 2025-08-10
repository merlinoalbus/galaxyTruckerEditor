import React, { useState, useEffect, useRef } from 'react';
import { Trash2, GripVertical, ChevronDown, ChevronUp, MessageSquare, Clock, ArrowRight, Tag } from 'lucide-react';
import { SelectWithModal } from '../../SelectWithModal/SelectWithModal';

interface CommandBlockProps {
  block: any;
  onUpdate: (updates: any) => void;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent) => void;
  sessionData?: any;
}

export const CommandBlock: React.FC<CommandBlockProps> = ({
  block,
  onUpdate,
  onRemove,
  onDragStart,
  sessionData
}) => {
  // Stato per collapse/expand - command blocks default collapsed
  const [isCollapsed, setIsCollapsed] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-collapse se lo spazio è insufficiente
  useEffect(() => {
    const checkSpace = () => {
      if (containerRef.current && !isCollapsed) {
        const container = containerRef.current;
        const width = container.offsetWidth;
        
        // Calcola lo spazio minimo necessario per CommandBlock
        // Icon(40px) + Label(80px) + padding(60px) = ~180px minimo
        const minRequiredWidth = 300;
        
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
  }, [isCollapsed]);
  const renderParameters = () => {
    switch (block.type) {
      case 'SAY':
        return (
          <textarea
            className="w-full p-2 bg-slate-800 text-white rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="Testo dialogo..."
            value={block.parameters?.text || ''}
            onChange={(e) => onUpdate({ 
              parameters: { ...block.parameters, text: e.target.value } 
            })}
            onClick={(e) => e.stopPropagation()}
            rows={3}
          />
        );
      
      case 'DELAY':
        return (
          <input
            type="number"
            className="w-full p-2 bg-slate-800 text-white rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="Millisecondi (es. 1000 = 1 secondo)"
            value={block.parameters?.duration || ''}
            onChange={(e) => onUpdate({ 
              parameters: { ...block.parameters, duration: parseInt(e.target.value) } 
            })}
            onClick={(e) => e.stopPropagation()}
          />
        );
      
      case 'GO':
        return (
          <SelectWithModal
            type="label"
            value={block.parameters?.label || ''}
            onChange={(value) => onUpdate({ 
              parameters: { ...block.parameters, label: value } 
            })}
            placeholder="Seleziona etichetta..."
            availableItems={sessionData?.labels || []}
            onAddItem={sessionData?.addLabel}
            className="w-full"
          />
        );
      
      case 'LABEL':
        return (
          <input
            type="text"
            className="w-full p-2 bg-slate-800 text-white rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="Nome etichetta..."
            value={block.parameters?.name || ''}
            onChange={(e) => {
              onUpdate({ 
                parameters: { ...block.parameters, name: e.target.value } 
              });
              // Aggiungi automaticamente la label quando viene definita
              if (e.target.value && sessionData?.addLabel && !sessionData?.labels?.includes(e.target.value)) {
                sessionData.addLabel(e.target.value);
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        );
      
      default:
        return null;
    }
  };

  const getBlockColor = () => {
    switch (block.type) {
      case 'SAY': return 'bg-blue-950/90 border-blue-800/80';
      case 'DELAY': return 'bg-amber-950/90 border-amber-800/80';
      case 'GO': return 'bg-purple-950/90 border-purple-800/80';
      case 'LABEL': return 'bg-emerald-950/90 border-emerald-800/80';
      default: return 'bg-slate-800/90 border-slate-700/80';
    }
  };

  const getBlockIcon = () => {
    switch (block.type) {
      case 'SAY': return <MessageSquare className="w-4 h-4" />;
      case 'DELAY': return <Clock className="w-4 h-4" />;
      case 'GO': return <ArrowRight className="w-4 h-4" />;
      case 'LABEL': return <Tag className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${getBlockColor()} rounded border p-3 mb-2 transition-all hover:shadow-lg`}
    >
      {/* Delete button - stesso stile zoom */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 p-1 bg-slate-700/80 hover:bg-red-600 border border-slate-600/50 rounded-md z-10 transition-all duration-200 backdrop-blur-sm"
        title="Elimina blocco"
      >
        <Trash2 className="w-3 h-3 text-gray-400 hover:text-white" />
      </button>
      
      {/* Collapse/Expand button - vicino al delete */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-8 right-2 p-1 bg-slate-700/80 hover:bg-slate-600 border border-slate-600/50 rounded-md z-10 transition-all duration-200 backdrop-blur-sm"
        title={isCollapsed ? "Espandi blocco" : "Comprimi blocco"}
      >
        {isCollapsed 
          ? <ChevronDown className="w-3 h-3 text-gray-400" />
          : <ChevronUp className="w-3 h-3 text-gray-400" />
        }
      </button>
      
      {/* Drag handle - SOLO questo è draggable */}
      <div 
        className="absolute -left-3 top-1/2 -translate-y-1/2 p-1 bg-gray-600 hover:bg-gray-500 rounded cursor-move transition-colors"
        draggable
        onDragStart={onDragStart}
      >
        <GripVertical className="w-3 h-3 text-white" />
      </div>
      
      {/* Block header */}
      <div className="flex items-center gap-2 mb-2 pr-16">
        <div className="text-gray-400">{getBlockIcon()}</div>
        <span className="text-xs font-bold text-white uppercase tracking-wide">{block.type}</span>
        {/* Mostra preview del contenuto se collapsed */}
        {isCollapsed && block.parameters?.text && (
          <span className="text-xs text-gray-400 truncate flex-1 ml-2">
            {block.parameters.text.substring(0, 30)}...
          </span>
        )}
      </div>
      
      {/* Block parameters - visibili solo se expanded */}
      {!isCollapsed && renderParameters()}
    </div>
  );
};
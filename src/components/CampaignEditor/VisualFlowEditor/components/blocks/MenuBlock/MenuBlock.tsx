import React, { useState, useEffect, useRef } from 'react';
import { AnchorPoint } from '../../AnchorPoint/AnchorPoint';
import { ContainerBlock } from '../ContainerBlock/ContainerBlock';

interface MenuBlockProps {
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

export const MenuBlock: React.FC<MenuBlockProps> = ({
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
      case 'MENU': return <span>☰</span>;
      case 'OPT': return <span>⭕</span>;
      default: return <span>📦</span>;
    }
  };

  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (!newCollapsedState) {
      setIsManuallyExpanded(true);
    } else {
      setIsManuallyExpanded(false);
    }
  };

  // Genera i parametri compatti per la visualizzazione collapsed
  const getCompactParams = () => {
    const count = block.children?.length || 0;
    return {
      params: null, // MenuBlock non ha parametri aggiuntivi
      elementCount: <span className="text-gray-500 whitespace-nowrap">{count} elementi</span>
    };
  };

  return (
    <div ref={containerRef}>
      <ContainerBlock
        blockType={block.type}
        blockIcon={getBlockIcon()}
        compactParams={getCompactParams()}
        onRemove={onRemove}
        onDragStart={onDragStart}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        className={`${getBlockStyle()} rounded border p-4 mb-3`}
        isInvalid={isInvalid}
        blockColor="bg-gray-600"
      >
        {/* Children container with anchor points - visibile solo se non collapsed */}
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
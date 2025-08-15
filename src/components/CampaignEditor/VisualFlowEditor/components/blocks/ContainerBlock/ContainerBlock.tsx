import React, { ReactNode } from 'react';
import { BaseBlock } from '../BaseBlock/BaseBlock';
import { ZoomControls } from '../../ZoomControls';

interface ContainerBlockProps {
  // Identificazione blocco
  blockType: string;
  blockIcon: ReactNode;
  
  // Controlli base da BaseBlock
  onRemove?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  
  // Contenuto parametri per visualizzazione compatta
  compactParams?: ReactNode | { params?: ReactNode; elementCount?: ReactNode };
  
  // Controlli zoom aggiuntivi per container
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  
  // Styling
  className?: string;
  isInvalid?: boolean;
  validationType?: 'error' | 'warning';
  blockColor?: string;
  iconBgColor?: string;
  
  // Content
  children: ReactNode;
  
  // Se true, nasconde i controlli
  hideControls?: boolean;
  
  // Numero di elementi nel container (opzionale)
  elementCount?: number;
}

/**
 * Componente base per tutti i blocchi container
 * Estende BaseBlock aggiungendo i controlli zoom
 */
export const ContainerBlock: React.FC<ContainerBlockProps> = ({
  blockType,
  blockIcon,
  onRemove,
  onDragStart,
  isCollapsed,
  onToggleCollapse,
  compactParams,
  onZoomIn,
  onZoomOut,
  className = '',
  isInvalid = false,
  validationType,
  blockColor = 'bg-gray-700',
  iconBgColor = '',
  children,
  hideControls = false
}) => {
  return (
    <div className="relative">
      {/* Controlli Zoom - sempre visibili, anche quando collapsed, FUORI da BaseBlock */}
      {!hideControls && (onZoomIn || onZoomOut) && (
        <div className="absolute top-0.5 left-0.5 z-20">
          <ZoomControls
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            size="small"
            className="opacity-80 hover:opacity-100"
          />
        </div>
      )}
      
      <BaseBlock
        blockType={blockType}
        blockIcon={blockIcon}
        onRemove={onRemove}
        onDragStart={onDragStart}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        compactParams={compactParams}
        className={className}
        isInvalid={isInvalid}
        validationType={validationType}
        blockColor={blockColor}
        iconBgColor={iconBgColor}
        hideControls={hideControls}
      >
        {children}
      </BaseBlock>
    </div>
  );
};
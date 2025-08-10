import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface AnchorPointProps {
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  label?: string;
}

export const AnchorPoint: React.FC<AnchorPointProps> = ({ 
  onDragOver, 
  onDrop, 
  label = ''
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // DEVE essere chiamato per permettere il drop
    e.stopPropagation(); // Ferma la propagazione
    try {
      e.dataTransfer.effectAllowed = 'move'; // Permetti move
      e.dataTransfer.dropEffect = 'move'; // Indica che il drop è permesso
    } catch (err) {
      // In alcuni browser non possiamo settare effectAllowed durante dragOver
      // Silently ignore
    }
    setIsDraggingOver(true);
    // NON chiamiamo più onDragOver del padre perché potrebbe sovrascrivere dropEffect
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    setIsDraggingOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (onDrop) {
      onDrop(e);
    }
  };
  
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  
  return (
    <div
      className={`
        relative my-1 flex items-center justify-center
        transition-all rounded
        ${isDraggingOver 
          ? 'h-6 border-2 border-dashed border-blue-500 bg-blue-500/10' 
          : isHovered
            ? 'h-4 border border-dashed border-gray-600 bg-transparent'
            : 'h-px bg-transparent'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isDraggingOver && label && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Plus className="w-3 h-3" />
          <span>{label}</span>
        </div>
      )}
    </div>
  );
};
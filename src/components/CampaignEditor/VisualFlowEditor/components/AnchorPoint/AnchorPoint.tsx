import React, { useState } from 'react';
import { Plus, Ban } from 'lucide-react';
import { useTranslation } from '@/locales';

interface AnchorPointProps {
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  label?: string;
  isDropAllowed?: (e: React.DragEvent) => boolean;
}

export const AnchorPoint: React.FC<AnchorPointProps> = ({ 
  onDragOver, 
  onDrop, 
  label = '',
  isDropAllowed
}) => {
  const { t } = useTranslation();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDropValid, setIsDropValid] = useState(true);
  
  const handleDragOver = (e: React.DragEvent) => {
    // Verifica se il drop è permesso
    const dropAllowed = isDropAllowed ? isDropAllowed(e) : true;
    setIsDropValid(dropAllowed);
    
    // SEMPRE previeni default per permettere il drop (se valido)
    e.preventDefault();
    
    // Imposta l'effetto cursore in base alla validità
    e.dataTransfer.dropEffect = dropAllowed ? 'copy' : 'none';
    
    // Chiama l'handler del padre solo se il drop è valido
    if (dropAllowed && onDragOver) {
      onDragOver(e);
    }
    
    // Setta il nostro stato locale per il visual feedback
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    setIsDraggingOver(false);
    setIsDropValid(true); // Reset quando il drag esce
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    setIsDropValid(true); // Reset dopo il drop
    
    // Blocca il drop se non è permesso
    const dropAllowed = isDropAllowed ? isDropAllowed(e) : true;
    if (dropAllowed && onDrop) {
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
          ? isDropValid
            ? 'h-6 border-2 border-dashed border-blue-500 bg-blue-500/10' 
            : 'h-6 border-2 border-dashed border-red-500 bg-red-500/10'
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
      {isDraggingOver && (
        <div className={`flex items-center gap-1 text-xs ${isDropValid ? 'text-gray-500' : 'text-red-500'}`}>
          {isDropValid ? (
            <>
              <Plus className="w-3 h-3" />
              <span>{label}</span>
            </>
          ) : (
            <>
              <Ban className="w-4 h-4" />
              <span>{t('visualFlowEditor.anchorPoint.dropNotAllowed')}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
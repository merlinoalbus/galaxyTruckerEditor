import React from 'react';
import { Trash2, GripVertical, AlertTriangle, AlertCircle } from 'lucide-react';
import { ValidationResult } from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';

interface BaseBlockProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  padding?: string;
  titleWidth?: string;
  blockId: string;
  isSelected?: boolean;
  isDragging?: boolean;
  validationResults?: ValidationResult[];
  onSelect?: () => void;
  onDelete?: () => void;
  onDragStart?: (position: { x: number, y: number }) => void;
  style?: React.CSSProperties;
}

export const BaseBlock: React.FC<BaseBlockProps> = ({
  children,
  className = '',
  icon,
  title,
  subtitle,
  padding = 'p-4',
  titleWidth = 'w-48',
  blockId,
  isSelected = false,
  isDragging = false,
  validationResults = [],
  onSelect,
  onDelete,
  onDragStart,
  style
}) => {
  const hasErrors = validationResults.some(result => result.type === 'error');
  const hasWarnings = validationResults.some(result => result.type === 'warning');

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button === 0 && onDragStart) {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      onDragStart({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
  };

  return (
    <div 
      className={`
        rounded-lg ${padding} ${className} 
        flex items-center space-x-3
        border-2 cursor-pointer transition-all duration-200 shadow-lg
        ${isSelected ? 'border-blue-500 shadow-blue-500/50' : 'border-gray-600'}
        ${isDragging ? 'opacity-50 z-50' : 'z-10'}
        ${hasErrors ? 'border-red-500' : hasWarnings ? 'border-yellow-500' : ''}
        hover:shadow-xl hover:border-gray-400
        bg-gray-800
      `}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Icon and title */}
      <div className={`flex items-center space-x-3 flex-shrink-0 ${titleWidth}`}>
        {icon}
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-white text-lg truncate">{title}</span>
            {hasErrors && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
            {hasWarnings && <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
          </div>
          {subtitle && <div className="text-xs text-gray-400 truncate">{subtitle}</div>}
        </div>
      </div>
      
      {/* Main content - takes remaining space */}
      <div className="flex-1 min-w-0">
        {children}
      </div>

      {/* Block Controls */}
      <div className="flex items-center space-x-1 flex-shrink-0">
        {/* Drag handle */}
        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
        
        {/* Delete button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete Block"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Validation messages */}
      {validationResults.length > 0 && (
        <div className="absolute -bottom-8 left-0 right-0 px-3">
          {validationResults.map((result, index) => (
            <div
              key={index}
              className={`text-xs mt-1 ${
                result.type === 'error' ? 'text-red-400' : 'text-yellow-400'
              }`}
            >
              {result.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
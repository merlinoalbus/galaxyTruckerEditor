import React, { useCallback } from 'react';
import { Trash2, GripVertical, AlertTriangle, AlertCircle } from 'lucide-react';
import { 
  FlowBlock as FlowBlockType, 
  ValidationResult, 
  Position 
} from '../../../../../../types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';

interface FlowBlockProps {
  block: FlowBlockType;
  isSelected: boolean;
  isDragging: boolean;
  validationResults: ValidationResult[];
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (data: any) => void;
  onDragStart: (position: Position) => void;
  onDropZoneClick: (position: 'before' | 'after') => void;
}

export const FlowBlock: React.FC<FlowBlockProps> = ({
  block,
  isSelected,
  isDragging,
  validationResults,
  onSelect,
  onDelete,
  onUpdate,
  onDragStart,
  onDropZoneClick
}) => {
  const hasErrors = validationResults.some(result => result.type === 'error');
  const hasWarnings = validationResults.some(result => result.type === 'warning');

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button === 0) { // Left click
      const rect = event.currentTarget.getBoundingClientRect();
      onDragStart({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
  }, [onDragStart]);

  const getBlockIcon = () => {
    const icons = {
      'say': '💬',
      'ask': '❓',
      'announce': '📢',
      'show_character': '👤',
      'hide_character': '👻',
      'change_character': '🎭',
      'set_variable': '🔧',
      'reset_variable': '🔄',
      'set_to_variable': '📊',
      'dialog_container': '📝',
      'menu_container': '📋',
      'if_container': '🔀'
    };
    return icons[block.type] || '❔';
  };

  const getBlockTitle = () => {
    return block.type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getBlockContent = () => {
    switch (block.type) {
      case 'say':
        return block.data.text || 'Say...';
      case 'ask':
        return block.data.text || 'Ask...';
      case 'announce':
        return block.data.text || 'Announce...';
      case 'show_character':
      case 'hide_character':
      case 'change_character':
        return block.data.character || 'Select character...';
      case 'set_variable':
      case 'reset_variable':
        return block.data.variable || 'Select variable...';
      default:
        return '';
    }
  };

  return (
    <div
      className={`
        absolute w-64 min-h-16 bg-gray-800 rounded-lg border-2 cursor-pointer
        transition-all duration-200 shadow-lg
        ${isSelected ? 'border-blue-500 shadow-blue-500/50' : 'border-gray-600'}
        ${isDragging ? 'opacity-50 z-50' : 'z-10'}
        ${hasErrors ? 'border-red-500' : hasWarnings ? 'border-yellow-500' : ''}
        hover:shadow-xl hover:border-gray-400
      `}
      style={{
        left: block.position.x,
        top: block.position.y
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-700 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getBlockIcon()}</span>
          <span className="text-sm font-semibold text-gray-200">
            {getBlockTitle()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Validation indicators */}
          {hasErrors && (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          {hasWarnings && (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          )}
          
          {/* Drag handle */}
          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
          
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="text-sm text-gray-300">
          {getBlockContent()}
        </div>
        
        {/* Character indicator for Say/Ask blocks */}
        {(block.type === 'say' || block.type === 'ask') && block.metadata?.currentCharacter && (
          <div className="mt-2 text-xs text-blue-400">
            Speaker: {block.metadata.currentCharacter}
          </div>
        )}
      </div>

      {/* Validation messages */}
      {validationResults.length > 0 && (
        <div className="px-3 pb-2">
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

      {/* Drop zones */}
      <div
        className="absolute -top-2 left-0 right-0 h-2 bg-blue-500 opacity-0 hover:opacity-75 cursor-pointer transition-opacity rounded-full"
        onClick={(e) => {
          e.stopPropagation();
          onDropZoneClick('before');
        }}
      />
      <div
        className="absolute -bottom-2 left-0 right-0 h-2 bg-blue-500 opacity-0 hover:opacity-75 cursor-pointer transition-opacity rounded-full"
        onClick={(e) => {
          e.stopPropagation();
          onDropZoneClick('after');
        }}
      />
    </div>
  );
};
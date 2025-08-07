import React from 'react';
import { Trash2 } from 'lucide-react';

interface BaseBlockProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  padding?: string;
  titleWidth?: string;
  onDeleteBlock?: (blockId: string) => void;
  blockId?: string;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
}

export const BaseBlock: React.FC<BaseBlockProps> = ({
  children,
  className = '',
  icon,
  title,
  subtitle,
  padding = 'p-3',
  titleWidth,
  onDeleteBlock,
  blockId,
  onMoveUp,
  onMoveDown
}) => {

  return (
    <div className={`rounded-lg ${padding} ${className} flex items-center space-x-3`}>
      {/* Icon and title */}
      <div className={`flex items-center space-x-3 flex-shrink-0 ${titleWidth || ''}`}>
        {icon}
        <div>
          <span className="font-medium text-white text-xl">{title}</span>
          {subtitle && <span className="text-xs text-gray-400 ml-2">{subtitle}</span>}
        </div>
      </div>
      
      {/* Main content - takes remaining space */}
      <div className="flex-1">
        {children}
      </div>

      {/* Block Controls */}
      {blockId && (onMoveUp || onMoveDown || onDeleteBlock) && (
        <div className="flex items-center space-x-1 flex-shrink-0">
          {onMoveUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp(blockId);
              }}
              className="w-6 h-6 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center justify-center transition-colors"
              title="Move Up"
            >
              ↑
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown(blockId);
              }}
              className="w-6 h-6 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center justify-center transition-colors"
              title="Move Down"
            >
              ↓
            </button>
          )}
          {onDeleteBlock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBlock(blockId);
              }}
              className="w-6 h-6 bg-red-700 hover:bg-red-600 text-white rounded text-xs flex items-center justify-center transition-colors"
              title="Delete Block"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

    </div>
  );
};
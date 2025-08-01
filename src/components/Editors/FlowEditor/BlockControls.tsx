import React from 'react';
import { StructuredBlock } from './types';

interface BlockControlsProps {
  block: StructuredBlock;
  onMoveUp: (blockId: string) => void;
  onMoveDown: (blockId: string) => void;
  onDelete: (blockId: string) => void;
}

export const BlockControls: React.FC<BlockControlsProps> = ({
  block,
  onMoveUp,
  onMoveDown,
  onDelete
}) => {
  return (
    <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMoveUp(block.id);
        }}
        className="w-6 h-6 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center justify-center transition-colors"
        title="Move Up"
      >
        ↑
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMoveDown(block.id);
        }}
        className="w-6 h-6 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center justify-center transition-colors"
        title="Move Down"
      >
        ↓
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(block.id);
        }}
        className="w-6 h-6 bg-red-700 hover:bg-red-600 text-white rounded text-xs flex items-center justify-center transition-colors"
        title="Delete Block"
      >
        ×
      </button>
    </div>
  );
};
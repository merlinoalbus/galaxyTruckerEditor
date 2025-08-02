import React from 'react';
import { X } from 'lucide-react';
import { 
  Position, 
  AvailableBlockType,
  FlowBlockType 
} from '../../../../../../types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';

interface AddBlockMenuProps {
  isOpen: boolean;
  position: Position;
  availableBlocks: AvailableBlockType[];
  onClose: () => void;
  onBlockSelect: (type: FlowBlockType) => void;
}

export const AddBlockMenu: React.FC<AddBlockMenuProps> = ({
  isOpen,
  position,
  availableBlocks,
  onClose,
  onBlockSelect
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="absolute bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 min-w-64"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-600">
        <h3 className="text-sm font-semibold text-gray-200">Add Block</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Block options */}
      <div className="max-h-80 overflow-y-auto">
        {availableBlocks.map((blockType) => (
          <button
            key={blockType.type}
            onClick={() => {
              if (blockType.isEnabled) {
                onBlockSelect(blockType.type);
              }
            }}
            disabled={!blockType.isEnabled}
            className={`
              w-full p-3 text-left border-b border-gray-700 last:border-b-0
              transition-colors flex items-center gap-3
              ${blockType.isEnabled 
                ? 'hover:bg-gray-700 cursor-pointer text-gray-200' 
                : 'cursor-not-allowed text-gray-500 bg-gray-850'
              }
            `}
          >
            <span className="text-lg">{blockType.icon}</span>
            <div className="flex-1">
              <div className="font-medium">{blockType.label}</div>
              {!blockType.isEnabled && blockType.disabledReason && (
                <div className="text-xs text-gray-500 mt-1">
                  {blockType.disabledReason}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {availableBlocks.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          <div className="text-sm">No blocks available at this position</div>
        </div>
      )}
    </div>
  );
};
import React from 'react';
import { X } from 'lucide-react';

interface SceneStateModalProps {
  isOpen: boolean;
  onClose: () => void;
  sceneState: any;
  blockId: string;
  blockType: string;
}

export const SceneStateModal: React.FC<SceneStateModalProps> = ({
  isOpen,
  onClose,
  sceneState,
  blockId,
  blockType
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Scene State Debug</h2>
            <p className="text-sm text-gray-400 mt-1">
              Block: {blockType} (ID: {blockId.slice(0, 8)})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
            {JSON.stringify(sceneState, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
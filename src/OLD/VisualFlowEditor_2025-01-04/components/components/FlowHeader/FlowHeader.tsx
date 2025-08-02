import React from 'react';
import { Play, RefreshCw, Download, Settings } from 'lucide-react';

interface FlowHeaderProps {
  blockCount: number;
  selectedNode?: string;
  onRefresh: () => void;
  onExport: () => void;
}

export const FlowHeader: React.FC<FlowHeaderProps> = ({
  blockCount,
  selectedNode,
  onRefresh,
  onExport
}) => {
  return (
    <div className="flex-shrink-0 border-b border-gray-700 bg-gray-900">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-400" />
            Visual Flow Editor
          </h3>
          
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-400">
              {blockCount} blocks
            </div>
            
            <button
              onClick={onRefresh}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              title="Refresh from script"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <button
              onClick={onExport}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              title="Export script"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {selectedNode && (
          <div className="text-sm text-gray-400">
            Editing: <span className="text-white font-medium">{selectedNode}</span>
          </div>
        )}
      </div>
    </div>
  );
};
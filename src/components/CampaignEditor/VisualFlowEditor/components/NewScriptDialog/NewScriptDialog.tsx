import React, { useState } from 'react';
import { FileText, Target } from 'lucide-react';
import type { NewScriptDialogProps } from './NewScriptDialog.types';

export const NewScriptDialog: React.FC<NewScriptDialogProps> = ({
  newScriptDialog,
  setNewScriptDialog,
  confirmNewScript,
  confirmNewMission
}) => {
  const [elementType, setElementType] = useState<'script' | 'mission'>('script');
  
  if (!newScriptDialog.isOpen) return null;

  const handleConfirm = () => {
    if (elementType === 'mission' && confirmNewMission) {
      confirmNewMission();
    } else {
      confirmNewScript();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 w-96">
        <h3 className="text-lg font-medium text-white mb-4">Nuovo Elemento</h3>
        
        <div className="space-y-4">
          {/* Selezione tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo di elemento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                  elementType === 'script'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'
                }`}
                onClick={() => setElementType('script')}
              >
                <FileText className="w-4 h-4" />
                <span>Script</span>
              </button>
              <button
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                  elementType === 'mission'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'
                }`}
                onClick={() => setElementType('mission')}
              >
                <Target className="w-4 h-4" />
                <span>Mission</span>
              </button>
            </div>
          </div>

          {/* Input nome file */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome file
            </label>
            <input
              type="text"
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={elementType === 'script' ? 'es. myScript.txt' : 'es. myMission.txt'}
              value={newScriptDialog.fileName}
              onChange={(e) => setNewScriptDialog(prev => ({ ...prev, fileName: e.target.value, error: undefined }))}
              onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
              autoFocus
            />
            {newScriptDialog.error && (
              <div className="text-red-400 text-sm mt-1">{newScriptDialog.error}</div>
            )}
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg transition-colors"
            onClick={() => setNewScriptDialog({ isOpen: false, fileName: '' })}
          >
            Annulla
          </button>
          <button
            className={`flex-1 text-white py-2 px-4 rounded-lg transition-colors ${
              elementType === 'script'
                ? 'bg-blue-600 hover:bg-blue-500'
                : 'bg-purple-600 hover:bg-purple-500'
            }`}
            onClick={handleConfirm}
          >
            Crea {elementType === 'script' ? 'Script' : 'Mission'}
          </button>
        </div>
      </div>
    </div>
  );
};
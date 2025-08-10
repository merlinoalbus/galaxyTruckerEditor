import React from 'react';
import type { NewScriptDialogProps } from './NewScriptDialog.types';

export const NewScriptDialog: React.FC<NewScriptDialogProps> = ({
  newScriptDialog,
  setNewScriptDialog,
  confirmNewScript
}) => {
  if (!newScriptDialog.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 w-96">
        <h3 className="text-lg font-medium text-white mb-4">Nuovo Script</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome file
            </label>
            <input
              type="text"
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="es. myScript.txt"
              value={newScriptDialog.fileName}
              onChange={(e) => setNewScriptDialog(prev => ({ ...prev, fileName: e.target.value, error: undefined }))}
              onKeyPress={(e) => e.key === 'Enter' && confirmNewScript()}
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
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg transition-colors"
            onClick={confirmNewScript}
          >
            Crea Script
          </button>
        </div>
      </div>
    </div>
  );
};
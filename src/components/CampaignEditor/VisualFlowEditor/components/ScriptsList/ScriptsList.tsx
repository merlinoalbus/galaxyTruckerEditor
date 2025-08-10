import React from 'react';
import type { ScriptsListProps } from './ScriptsList.types';

export const ScriptsList: React.FC<ScriptsListProps> = ({
  showScriptsList,
  setShowScriptsList,
  availableScripts,
  loadScript
}) => {
  if (!showScriptsList) return null;

  return (
    <div className="absolute top-20 left-4 z-50 w-80 bg-slate-800 rounded-lg shadow-xl border border-slate-600 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold">Scripts Disponibili</h3>
        <button
          onClick={() => setShowScriptsList(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {availableScripts.length > 0 ? (
          availableScripts.map(script => (
            <div
              key={script.id}
              className="p-3 bg-slate-700 hover:bg-slate-600 rounded cursor-pointer transition-colors"
              onClick={() => loadScript(script.id)}
            >
              <div className="text-white font-medium">{script.name}</div>
              {script.fileName && (
                <div className="text-xs text-gray-400">{script.fileName}</div>
              )}
            </div>
          ))
        ) : (
          <div className="text-gray-400 text-center py-4">
            Nessuno script disponibile
          </div>
        )}
      </div>
    </div>
  );
};
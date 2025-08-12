import React, { useState } from 'react';
import { X, Gamepad2 } from 'lucide-react';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
  existingData?: {
    number?: string;
  };
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  existingData
}) => {
  const [playerNumber, setPlayerNumber] = useState(existingData?.number || '');

  const handleInsert = () => {
    const code = playerNumber ? `[p${playerNumber}]` : '[p]';
    onInsert(code);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-4 w-[400px] max-w-[90vw]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5" />
            Riferimento Giocatore
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Info */}
        <div className="mb-4 p-2 bg-slate-900/50 rounded text-xs text-gray-400">
          Riferimento a un giocatore specifico in modalità multiplayer.
        </div>

        {/* Form */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Seleziona giocatore
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPlayerNumber('')}
                className={`p-2 rounded border ${
                  playerNumber === '' 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-slate-900 border-slate-600 text-gray-300 hover:bg-slate-700'
                }`}
              >
                <div className="text-sm font-medium">[p]</div>
                <div className="text-xs text-gray-400">Corrente</div>
              </button>
              
              {[1, 2, 3, 4].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPlayerNumber(String(num))}
                  className={`p-2 rounded border ${
                    playerNumber === String(num)
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-slate-900 border-slate-600 text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="text-sm font-medium">[p{num}]</div>
                  <div className="text-xs text-gray-400">Player {num}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mb-4 p-3 bg-slate-900 rounded border border-slate-700">
          <div className="text-xs text-gray-500 mb-1">Codice generato:</div>
          <code className="text-sm text-green-400 font-mono">
            {playerNumber ? `[p${playerNumber}]` : '[p]'}
          </code>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleInsert}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
          >
            Inserisci
          </button>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { X, Hash } from 'lucide-react';

interface NumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
  existingData?: {
    index?: string;
    suffix?: string;
  };
}

export const NumberModal: React.FC<NumberModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  existingData
}) => {
  const [index, setIndex] = useState(existingData?.index || '');
  const [suffix, setSuffix] = useState(existingData?.suffix || '');
  const [isOrdinal, setIsOrdinal] = useState(false);

  const handleInsert = () => {
    let code;
    if (isOrdinal) {
      code = `[numth${index || '1'}]`;
    } else {
      code = '[n';
      if (index) code += index;
      if (suffix) code += suffix;
      code += ']';
    }
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
            <Hash className="w-5 h-5" />
            Valore Numerico
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
          Inserisce un valore numerico dinamico o ordinale.
        </div>

        {/* Form */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={isOrdinal}
                onChange={(e) => setIsOrdinal(e.target.checked)}
                className="rounded border-gray-600 bg-slate-900 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Numero ordinale (1°, 2°, 3°...)</span>
            </label>
          </div>

          {!isOrdinal && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Indice (opzionale)
                </label>
                <input
                  type="text"
                  value={index}
                  onChange={(e) => setIndex(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-900 text-white px-2 py-1 rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
                  placeholder="1, 2, 3..."
                />
                <div className="text-xs text-gray-500 mt-1">
                  Per riferimenti multipli: [n1], [n2], etc.
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Suffisso (opzionale)
                </label>
                <select
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  className="w-full bg-slate-900 text-white px-2 py-1 rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="">Nessuno</option>
                  <option value="s">s - Plurale</option>
                  <option value="e">e - Esteso</option>
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  Modifica il formato del numero
                </div>
              </div>
            </>
          )}

          {isOrdinal && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Posizione ordinale
              </label>
              <input
                type="text"
                value={index}
                onChange={(e) => setIndex(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-900 text-white px-2 py-1 rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
                placeholder="1, 2, 3..."
              />
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="mb-4 p-3 bg-slate-900 rounded border border-slate-700">
          <div className="text-xs text-gray-500 mb-1">Codice generato:</div>
          <code className="text-sm text-green-400 font-mono">
            {isOrdinal 
              ? `[numth${index || '1'}]`
              : `[n${index}${suffix}]`
            }
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
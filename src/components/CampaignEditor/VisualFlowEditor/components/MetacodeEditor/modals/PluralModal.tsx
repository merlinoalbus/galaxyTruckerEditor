import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PluralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
  language?: string;
  existingData?: {
    forms?: { count: number; text: string }[];
  };
}

export const PluralModal: React.FC<PluralModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  language = 'EN',
  existingData
}) => {
  const [singular, setSingular] = useState(existingData?.forms?.[0]?.text || '');
  const [plural, setPlural] = useState(existingData?.forms?.[1]?.text || 's');
  const [special, setSpecial] = useState(existingData?.forms?.[2]?.text || '');
  
  const needsSpecial = ['CS', 'PL', 'RU'].includes(language);

  const handleInsert = () => {
    let code;
    if (needsSpecial && special) {
      code = `[n(1:${singular}|2:${plural}|5:${special})]`;
    } else {
      code = `[n(1:${singular}|2:${plural})]`;
    }
    onInsert(code);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-lg border border-slate-700 p-3 w-[280px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-white">Plurale</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Form compatto ma usabile */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-8">1:</span>
            <input
              type="text"
              value={singular}
              onChange={(e) => setSingular(e.target.value)}
              className="flex-1 bg-slate-900 text-white px-2 py-1 rounded border border-slate-600 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="singolare (es. point)"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-8">2+:</span>
            <input
              type="text"
              value={plural}
              onChange={(e) => setPlural(e.target.value)}
              className="flex-1 bg-slate-900 text-white px-2 py-1 rounded border border-slate-600 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="plurale (es. points)"
            />
          </div>
          {needsSpecial && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-8">5+:</span>
              <input
                type="text"
                value={special}
                onChange={(e) => setSpecial(e.target.value)}
                className="flex-1 bg-slate-900 text-white px-2 py-1 rounded border border-slate-600 text-sm focus:border-blue-500 focus:outline-none"
                placeholder={language === 'CS' ? 'es. bodů' : language === 'PL' ? 'es. punktów' : 'speciale'}
              />
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="p-2 bg-slate-900 rounded text-xs mt-2 mb-2">
          <code className="text-green-400 font-mono">
            {needsSpecial && special
              ? `[n(1:${singular || '_'}|2:${plural || '_'}|5:${special || '_'})]`
              : `[n(1:${singular || '_'}|2:${plural || '_'})]`
            }
          </code>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleInsert}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
          >
            Inserisci
          </button>
        </div>
      </div>
    </div>
  );
};
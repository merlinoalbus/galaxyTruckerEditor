import React, { useState } from 'react';
import { X } from 'lucide-react';

interface VerbModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
  language?: string;
  existingData?: {
    mobile?: string;
    desktop?: string;
  };
}

export const VerbModal: React.FC<VerbModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  existingData
}) => {
  const [mobile, setMobile] = useState(existingData?.mobile || 'tap');
  const [desktop, setDesktop] = useState(existingData?.desktop || 'click');

  const handleInsert = () => {
    const code = `[v(${mobile}|${desktop})]`;
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
          <h3 className="text-sm font-medium text-white">Azione (Tap/Click)</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Form compatto ma leggibile */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">📱 Mobile</label>
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full bg-slate-900 text-white px-2 py-1 rounded border border-slate-600 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="tap"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">💻 Desktop</label>
            <input
              type="text"
              value={desktop}
              onChange={(e) => setDesktop(e.target.value)}
              className="w-full bg-slate-900 text-white px-2 py-1 rounded border border-slate-600 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="click"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="p-2 bg-slate-900 rounded text-xs mb-2">
          <code className="text-green-400 font-mono">
            [v({mobile || '_'}|{desktop || '_'})]
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
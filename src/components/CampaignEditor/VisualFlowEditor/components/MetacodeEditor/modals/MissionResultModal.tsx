import React, { useState, useEffect, useRef } from 'react';
import { X, Target } from 'lucide-react';

interface MissionResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
  existingData?: any;
}

export const MissionResultModal: React.FC<MissionResultModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  existingData
}) => {
  const [resultType, setResultType] = useState<'simple' | 'formatted'>('simple');
  const [customText, setCustomText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Se stiamo modificando un metacodice esistente, determina il tipo
      if (existingData) {
        if (existingData.custom) {
          setResultType('formatted');
          setCustomText(existingData.custom);
        } else {
          setResultType('simple');
        }
      } else {
        // Reset per nuovo inserimento
        setResultType('simple');
        setCustomText('');
      }
      
      // Focus sul primo input se appropriato
      if (inputRef.current && resultType === 'formatted') {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }
  }, [isOpen, existingData, resultType]);

  const handleInsert = () => {
    let code = '';
    
    if (resultType === 'simple') {
      code = '[missionResult]';
    } else {
      // Per ora supportiamo solo il pattern base, ma la modal è pronta per estensioni
      code = customText ? `[missionResult(${customText})]` : '[missionResult]';
    }
    
    onInsert(code);
    onClose();
  };

  const handlePresetClick = (preset: string) => {
    setResultType('formatted');
    setCustomText(preset);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-lg border border-slate-700 p-4 w-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-medium text-white">Risultato Missione</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Tipo di risultato */}
        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="simple"
                checked={resultType === 'simple'}
                onChange={(e) => setResultType(e.target.value as 'simple')}
                className="mr-2"
              />
              <span className="text-sm text-white">Risultato Standard</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="formatted"
                checked={resultType === 'formatted'}
                onChange={(e) => setResultType(e.target.value as 'formatted')}
                className="mr-2"
              />
              <span className="text-sm text-white">Risultato Personalizzato</span>
            </label>
          </div>

          {/* Descrizione */}
          <div className="text-xs text-gray-400">
            {resultType === 'simple' 
              ? 'Usa il risultato automatico della missione'
              : 'Specifica un testo personalizzato per il risultato'
            }
          </div>
        </div>

        {/* Input personalizzato se necessario */}
        {resultType === 'formatted' && (
          <div className="space-y-3 mb-4">
            {/* Preset comuni */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => handlePresetClick('victory')}
                className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 rounded text-white"
              >
                Vittoria
              </button>
              <button
                onClick={() => handlePresetClick('defeat')}
                className="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 rounded text-white"
              >
                Sconfitta
              </button>
              <button
                onClick={() => handlePresetClick('draw')}
                className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-500 rounded text-white"
              >
                Pareggio
              </button>
              <button
                onClick={() => handlePresetClick('timeout')}
                className="px-2 py-1 text-xs bg-orange-600 hover:bg-orange-500 rounded text-white"
              >
                Timeout
              </button>
            </div>

            {/* Input personalizzato */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Testo personalizzato:
              </label>
              <input
                ref={inputRef}
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="es. victory, defeat, custom_result"
              />
            </div>
          </div>
        )}
        
        {/* Live preview */}
        <div className="p-3 bg-slate-900 rounded text-xs mb-4">
          <div className="text-gray-500 mb-1">Risultato:</div>
          <code className="text-green-400 font-mono">
            {resultType === 'simple' 
              ? '[missionResult]'
              : customText 
                ? `[missionResult(${customText})]`
                : '[missionResult]'
            }
          </code>
        </div>

        {/* Esempi di utilizzo */}
        <div className="text-xs text-gray-400 mb-4 space-y-1">
          <div className="font-medium">Esempi:</div>
          <div>• Standard: Mostra automaticamente il risultato della missione</div>
          <div>• Personalizzato: "victory" → Mostra sempre "Vittoria"</div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleInsert}
            className="px-4 py-1.5 text-sm bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
          >
            Inserisci
          </button>
        </div>
      </div>
    </div>
  );
};
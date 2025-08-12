import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface GenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
  language?: string;
  currentText?: string; // Tutto il testo corrente
  cursorPosition?: number; // Posizione del cursore
}

export const GenderModal: React.FC<GenderModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  language = 'EN',
  currentText = '',
  cursorPosition = 0
}) => {
  const [male, setMale] = useState('');
  const [female, setFemale] = useState('');
  const [neutral, setNeutral] = useState('');
  const [wordToReplace, setWordToReplace] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && currentText && cursorPosition > 0) {
      // Estrai la parola prima del cursore
      const textBefore = currentText.substring(0, cursorPosition);
      const lastSpaceIndex = textBefore.lastIndexOf(' ');
      const word = textBefore.substring(lastSpaceIndex + 1);
      
      if (word && !word.includes('[')) {
        setWordToReplace(word);
        // Auto-suggerimento basato sulla parola
        if (language === 'IT') {
          if (word.endsWith('o')) {
            setMale('o');
            setFemale('a');
          } else if (word.endsWith('e')) {
            setMale('e');
            setFemale('e');
          }
        } else if (language === 'EN') {
          // Suggerimenti comuni inglesi
          if (word === 'his' || word === 'her' || word === 'its') {
            setMale('his');
            setFemale('her');
            setNeutral('its');
          }
        }
      }
    }
    
    // Focus sul primo input
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, currentText, cursorPosition, language]);

  const handleInsert = () => {
    let code = '';
    
    // Se c'è una parola da sostituire, costruisci il pattern ottimizzato
    if (wordToReplace) {
      // Trova il prefisso comune
      const commonPrefix = getCommonPrefix(
        wordToReplace + male,
        wordToReplace + female,
        neutral ? wordToReplace + neutral : ''
      );
      
      // Rimuovi il prefisso comune dalle varianti
      const maleSuffix = (wordToReplace + male).substring(commonPrefix.length);
      const femaleSuffix = (wordToReplace + female).substring(commonPrefix.length);
      const neutralSuffix = neutral ? (wordToReplace + neutral).substring(commonPrefix.length) : '';
      
      // Costruisci il codice ottimizzato
      if (neutral) {
        code = `${commonPrefix}[g(${maleSuffix || ''}|${femaleSuffix || ''}|${neutralSuffix})]`;
      } else {
        code = `${commonPrefix}[g(${maleSuffix || ''}|${femaleSuffix || ''})]`;
      }
    } else {
      // Nessuna parola da sostituire, inserisci solo il pattern
      if (neutral) {
        code = `[g(${male}|${female}|${neutral})]`;
      } else {
        code = `[g(${male}|${female})]`;
      }
    }
    
    onInsert(code);
    onClose();
  };

  const getCommonPrefix = (str1: string, str2: string, str3?: string): string => {
    if (!str1 || !str2) return '';
    
    let prefix = '';
    const minLen = Math.min(str1.length, str2.length, str3?.length || Infinity);
    
    for (let i = 0; i < minLen; i++) {
      if (str1[i] === str2[i] && (!str3 || str1[i] === str3[i])) {
        prefix += str1[i];
      } else {
        break;
      }
    }
    
    return prefix;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-lg border border-slate-700 p-3 w-[360px]">
        {/* Header con contesto */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium text-white">Adattamento Genere</h3>
            {wordToReplace && (
              <div className="text-xs text-blue-400 mt-1">
                Completa: <span className="font-mono bg-slate-900 px-1 rounded">{wordToReplace}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Quick presets per lingue comuni */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => { setMale('o'); setFemale('a'); setNeutral(''); }}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded"
          >
            o/a
          </button>
          <button
            onClick={() => { setMale('e'); setFemale('e'); setNeutral(''); }}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded"
          >
            e/e
          </button>
          <button
            onClick={() => { setMale('his'); setFemale('her'); setNeutral('its'); }}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded"
          >
            his/her/its
          </button>
          <button
            onClick={() => { setMale('il'); setFemale('la'); setNeutral(''); }}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded"
          >
            il/la
          </button>
        </div>

        {/* Input fields */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 w-16">Masch:</label>
            <input
              ref={inputRef}
              type="text"
              value={male}
              onChange={(e) => setMale(e.target.value)}
              className="flex-1 bg-slate-900 text-white px-2 py-1 rounded border border-slate-600 text-sm focus:border-blue-500 focus:outline-none"
              placeholder={wordToReplace ? `${wordToReplace}...` : "maschile"}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 w-16">Femm:</label>
            <input
              type="text"
              value={female}
              onChange={(e) => setFemale(e.target.value)}
              className="flex-1 bg-slate-900 text-white px-2 py-1 rounded border border-slate-600 text-sm focus:border-blue-500 focus:outline-none"
              placeholder={wordToReplace ? `${wordToReplace}...` : "femminile"}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 w-16">Neutro:</label>
            <input
              type="text"
              value={neutral}
              onChange={(e) => setNeutral(e.target.value)}
              className="flex-1 bg-slate-900 text-white px-2 py-1 rounded border border-slate-600 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="opzionale (its)"
            />
          </div>
        </div>
        
        {/* Live preview */}
        <div className="p-2 bg-slate-900 rounded text-xs mb-3">
          <div className="text-gray-500 mb-1">Risultato:</div>
          <code className="text-green-400 font-mono">
            {wordToReplace && (
              <>
                {getCommonPrefix(
                  wordToReplace + male,
                  wordToReplace + female,
                  neutral ? wordToReplace + neutral : ''
                )}
              </>
            )}
            [g({male || '_'}|{female || '_'}{neutral ? `|${neutral}` : ''})]
          </code>
        </div>

        {/* Esempi di output */}
        <div className="text-xs text-gray-400 mb-3 space-y-1">
          <div>M: {wordToReplace}{male}</div>
          <div>F: {wordToReplace}{female}</div>
          {neutral && <div>N: {wordToReplace}{neutral}</div>}
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
            disabled={!male && !female}
            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded transition-colors"
          >
            Inserisci
          </button>
        </div>
      </div>
    </div>
  );
};
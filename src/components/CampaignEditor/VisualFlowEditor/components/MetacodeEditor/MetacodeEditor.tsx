import React, { useState, useRef, useEffect } from 'react';
import { MetacodeButtonBar, METACODE_PATTERNS } from './MetacodeButtons';
import { GenderModal } from './modals/GenderModal';
import { VerbModal } from './modals/VerbModal';
import { ImagePickerModal } from './modals/ImagePickerModal';
import { 
  parseMetacode, 
  insertMetacodeAtCursor,
  replaceMetacode,
  generateSimpleCode 
} from './utils/metacodeParser';
import { MetacodeEditorProps, ParsedMetacode } from './types';

/**
 * Editor avanzato con supporto metacodice visuale
 */
export const MetacodeEditor: React.FC<MetacodeEditorProps> = ({
  value,
  onChange,
  language,
  availableImages = [],
  availableIcons = [],
  showPatternButtons = true
}) => {
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState<string | undefined>(undefined);
  const [modalType, setModalType] = useState<string | null>(null);
  const [editingMetacode, setEditingMetacode] = useState<ParsedMetacode | null>(null);
  const [parsedCodes, setParsedCodes] = useState<ParsedMetacode[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Parse del testo quando cambia
  useEffect(() => {
    const parsed = parseMetacode(value);
    setParsedCodes(parsed);
  }, [value]);

  // Gestione click su pattern
  const handlePatternClick = (pattern: any) => {
    if (!pattern.hasModal) {
      // Inserisci direttamente pattern semplici
      const code = generateSimpleCode(pattern.type);
      insertAtCursor(code);
    } else {
      // Apri modal per pattern complessi
      setModalType(pattern.type);
      setSelectedPattern(pattern.id);
    }
  };

  // Inserisci codice alla posizione del cursore
  const insertAtCursor = (code: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Se c'è una selezione, sostituiscila
    if (start !== end) {
      const before = value.substring(0, start);
      const after = value.substring(end);
      onChange(before + code + after);
      
      // Posiziona il cursore dopo il codice inserito
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + code.length;
        textarea.focus();
      }, 0);
    } else {
      // Altrimenti inserisci alla posizione del cursore
      const result = insertMetacodeAtCursor(value, start, code);
      onChange(result.newText);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = result.newCursorPosition;
        textarea.focus();
      }, 0);
    }
  };

  // Gestione inserimento da modal
  const handleModalInsert = (code: string) => {
    if (editingMetacode) {
      // Sostituisci metacodice esistente
      const newText = replaceMetacode(value, editingMetacode, code);
      onChange(newText);
      setEditingMetacode(null);
    } else {
      // Inserisci nuovo metacodice
      insertAtCursor(code);
    }
    setModalType(null);
    setSelectedPattern(undefined);
  };

  // Gestione click su metacodice nel testo
  const handleTextClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const clickPosition = textarea.selectionStart;
    
    // Trova se il click è su un metacodice
    const clickedCode = parsedCodes.find(
      code => clickPosition >= code.start && clickPosition <= code.end
    );
    
    if (clickedCode) {
      // Apri modal per editare
      setEditingMetacode(clickedCode);
      setModalType(clickedCode.type);
      setSelectedPattern(clickedCode.type);
    }
  };

  // Rendering del testo con highlight dei metacodici
  const renderHighlightedText = () => {
    if (parsedCodes.length === 0) return value;
    
    let result = [];
    let lastEnd = 0;
    
    parsedCodes.forEach((code, index) => {
      // Aggiungi testo prima del metacodice
      if (code.start > lastEnd) {
        result.push(
          <span key={`text-${index}`}>
            {value.substring(lastEnd, code.start)}
          </span>
        );
      }
      
      // Aggiungi metacodice con highlight
      result.push(
        <span
          key={`code-${index}`}
          className="bg-blue-900/50 text-blue-300 px-1 rounded cursor-pointer hover:bg-blue-800/50"
          onClick={() => {
            setEditingMetacode(code);
            setModalType(code.type);
          }}
        >
          {code.raw}
        </span>
      );
      
      lastEnd = code.end;
    });
    
    // Aggiungi testo finale
    if (lastEnd < value.length) {
      result.push(
        <span key="text-final">
          {value.substring(lastEnd)}
        </span>
      );
    }
    
    return result;
  };

  return (
    <div className="space-y-2">
      {/* Barra dei pulsanti metacodice */}
      {showPatternButtons && (
        <MetacodeButtonBar
          onPatternClick={handlePatternClick}
          activePattern={selectedPattern}
          visiblePatterns={['gender', 'verb', 'name', 'image', 'icon']}
        />
      )}

      {/* Textarea con overlay per highlight */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={handleTextClick}
          onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart)}
          className="w-full bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-sm font-mono min-h-[100px] resize-y"
          placeholder={`Testo ${language}...`}
        />
        
        {/* Overlay per visualizzazione metacodici (solo in modalità view) */}
        {false && parsedCodes.length > 0 && (
          <div className="absolute inset-0 pointer-events-none p-3 text-sm font-mono whitespace-pre-wrap">
            {renderHighlightedText()}
          </div>
        )}
      </div>

      {/* Info sui metacodici trovati */}
      {parsedCodes.length > 0 && (
        <div className="text-xs text-gray-500">
          Trovati {parsedCodes.length} pattern: {parsedCodes.map(p => p.type).join(', ')}
        </div>
      )}

      {/* Modali */}
      {modalType === 'gender' && (
        <GenderModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setEditingMetacode(null);
          }}
          onInsert={handleModalInsert}
        />
      )}
      
      {modalType === 'verb' && (
        <VerbModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setEditingMetacode(null);
          }}
          onInsert={handleModalInsert}
          existingData={editingMetacode?.data}
        />
      )}
      
      {modalType === 'image' && (
        <ImagePickerModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setEditingMetacode(null);
          }}
          onInsert={handleModalInsert}
          availableImages={availableImages}
          existingData={editingMetacode?.data as { path: string; multiplier?: string } | undefined}
        />
      )}
    </div>
  );
};
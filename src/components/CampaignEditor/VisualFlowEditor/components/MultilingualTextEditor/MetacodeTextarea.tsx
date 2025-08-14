import React, { useRef, useState } from 'react';
import { parseMetacodes, processText, ParsedMetacode, resolveMetacode } from './metacodeParser';
import { useTranslation } from '@/locales';

interface MetacodeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  genderState: 'male' | 'female' | 'disabled';
  numberState: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 20 | 30 | 40 | 50 | 100 | 'more' | 'disabled';
  onMetacodeClick?: (metacode: ParsedMetacode, mousePos?: { x: number; y: number }) => void;
  onFocus?: (cursorPosition: number) => void;
  onBlur?: () => void;
  onCursorChange?: (position: number) => void;
}

export const MetacodeTextarea: React.FC<MetacodeTextareaProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  genderState,
  numberState,
  onMetacodeClick,
  onFocus,
  onBlur,
  onCursorChange
}) => {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const metacodes = parseMetacodes(value);
  
  // Renderizza il testo con i metacodici come elementi cliccabili
  const renderProcessedText = () => {
    if (metacodes.length === 0) {
      // Se non ci sono metacodici, mostra testo normale
      return <span className="whitespace-pre-wrap">{value}</span>;
    }
    
    const elements: React.ReactNode[] = [];
    let lastEnd = 0;
    
    metacodes.forEach((metacode, index) => {
      // Per metacodici estesi, usa extendedStart invece di start
      const actualStart = metacode.extendedStart !== undefined ? metacode.extendedStart : metacode.start;
      
      // Aggiungi testo prima del metacodice
      if (actualStart > lastEnd) {
        const textBefore = value.substring(lastEnd, actualStart);
        elements.push(
          <span key={`text-${index}`} className="whitespace-pre-wrap">
            {textBefore}
          </span>
        );
      }
      
      // Determina se questo metacodice è attivo
      const isActive = 
        (metacode.type === 'gender' && genderState !== 'disabled') ||
        (metacode.type === 'number' && numberState !== 'disabled') ||
        metacode.type === 'image' ||
        metacode.type === 'name';
      
      if (isActive) {
        // Mostra la forma risolta con stile speciale
        const resolved = resolveMetacode(
          metacode,
          genderState,
          numberState,
          t('visualFlowEditor.metacode.playerDefault'),
          2
        );
        
        const bgColor = 
          metacode.type === 'gender' ? 'bg-blue-500/20' :
          metacode.type === 'number' ? 'bg-green-500/20' :
          metacode.type === 'image' ? 'bg-purple-500/20' :
          metacode.type === 'name' ? 'bg-orange-500/20' :
          'bg-gray-500/20';
        
        elements.push(
          <span
            key={`metacode-${index}`}
            className={`${bgColor} px-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={(e) => {
              const mousePos = { x: e.clientX, y: e.clientY };
              onMetacodeClick?.(metacode, mousePos);
            }}
            title={`Click per modificare: ${metacode.raw}`}
          >
            {resolved}
          </span>
        );
      } else {
        // Mostra il metacodice esteso raw con evidenziazione
        const displayText = metacode.extendedRaw || metacode.raw;
        elements.push(
          <span
            key={`metacode-${index}`}
            className="text-gray-400 bg-gray-700/50 px-0.5 rounded cursor-pointer hover:bg-gray-700"
            onClick={(e) => {
              const mousePos = { x: e.clientX, y: e.clientY };
              onMetacodeClick?.(metacode, mousePos);
            }}
            title={t('visualFlowEditor.metacode.clickToEdit')}
          >
            {displayText}
          </span>
        );
      }
      
      // Aggiorna lastEnd con la fine del metacodice esteso
      lastEnd = metacode.end;
    });
    
    // Aggiungi testo rimanente
    if (lastEnd < value.length) {
      elements.push(
        <span key="text-final" className="whitespace-pre-wrap">
          {value.substring(lastEnd)}
        </span>
      );
    }
    
    return <>{elements}</>;
  };
  
  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          onCursorChange?.(e.target.selectionStart);
        }}
        onFocus={(e) => {
          onFocus?.(e.target.selectionStart);
        }}
        onBlur={() => {
          setIsEditing(false);
          onBlur?.();
        }}
        onKeyUp={(e) => {
          const target = e.target as HTMLTextAreaElement;
          onCursorChange?.(target.selectionStart);
        }}
        onClick={(e) => {
          const target = e.target as HTMLTextAreaElement;
          onCursorChange?.(target.selectionStart);
        }}
        placeholder={placeholder}
        className={className}
        rows={1}
        style={{ minHeight: '24px', lineHeight: '1.5' }}
        autoFocus
      />
    );
  }
  
  // Calcola la posizione del cursore basata sul click
  const calculateCursorPosition = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !value) return 0;
    
    // Stima approssimativa basata sulla posizione X del click
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const charWidth = 7; // Larghezza media carattere in px per font-size text-xs
    const estimatedPosition = Math.floor(x / charWidth);
    
    return Math.min(Math.max(0, estimatedPosition), value.length);
  };

  return (
    <div 
      ref={containerRef}
      className={`${className} cursor-text`}
      onClick={(e) => {
        const position = calculateCursorPosition(e);
        setIsEditing(true);
        onFocus?.(position);
        
        // Imposta il cursore nella textarea dopo il render
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(position, position);
            textareaRef.current.focus();
          }
        }, 0);
      }}
      style={{ minHeight: '24px', lineHeight: '1.5' }}
    >
      {value ? renderProcessedText() : (
        <span className="text-gray-500">{placeholder}</span>
      )}
    </div>
  );
};
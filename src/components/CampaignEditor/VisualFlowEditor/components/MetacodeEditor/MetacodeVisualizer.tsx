import React, { useMemo } from 'react';
import { parseMetacode } from './utils/metacodeParser';
import { ParsedMetacode } from './types';

interface MetacodeVisualizerProps {
  text: string;
  onMetacodeClick: (metacode: ParsedMetacode) => void;
  className?: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

const getMetacodeIcon = (type: string): string => {
  switch (type) {
    case 'gender': return '👤';
    case 'verb': return '👆';  
    case 'name': return '🏷️';
    case 'image': return '🖼️';
    case 'icon': return '⭐';
    case 'missionResult': return '🎯';
    case 'platform': return '📱';
    case 'number': return '🔢';
    case 'vector': return '📍';
    case 'boolean': return '✓';
    default: return '🔧';
  }
};

const getMetacodeColor = (type: string): string => {
  switch (type) {
    case 'gender': return 'bg-blue-500';
    case 'verb': return 'bg-purple-500';
    case 'name': return 'bg-green-500';
    case 'image': return 'bg-yellow-500';
    case 'icon': return 'bg-orange-500';
    case 'missionResult': return 'bg-red-500';
    case 'platform': return 'bg-indigo-500';
    case 'number': return 'bg-teal-500';
    case 'vector': return 'bg-pink-500';
    case 'boolean': return 'bg-gray-500';
    default: return 'bg-slate-500';
  }
};

export const MetacodeVisualizer: React.FC<MetacodeVisualizerProps> = ({
  text,
  onMetacodeClick,
  className = '',
  textareaRef
}) => {
  const parsedCodes = useMemo(() => parseMetacode(text), [text]);

  if (parsedCodes.length === 0) {
    return null;
  }

  // Renderizza il testo con overlay che nasconde i metacodici
  const renderTextWithOverlay = () => {
    let result = [];
    let lastEnd = 0;
    
    parsedCodes.forEach((metacode, index) => {
      // Aggiungi testo normale prima del metacodice
      if (metacode.start > lastEnd) {
        const normalText = text.substring(lastEnd, metacode.start);
        result.push(
          <span key={`text-${index}`} className="text-white">
            {normalText}
          </span>
        );
      }
      
      // Aggiungi icona al posto del metacodice
      result.push(
        <button
          key={`meta-${index}`}
          onClick={() => onMetacodeClick(metacode)}
          className={`
            inline-flex items-center justify-center w-5 h-4 text-xs rounded-sm text-white
            hover:scale-110 transition-transform shadow-lg border border-white/20 mx-0.5
            ${getMetacodeColor(metacode.type)}
          `}
          title={`${metacode.type}: ${metacode.raw}`}
        >
          <span className="text-xs leading-none">
            {getMetacodeIcon(metacode.type)}
          </span>
        </button>
      );
      
      lastEnd = metacode.end;
    });
    
    // Aggiungi testo finale
    if (lastEnd < text.length) {
      result.push(
        <span key="text-final" className="text-white">
          {text.substring(lastEnd)}
        </span>
      );
    }
    
    return result;
  };

  // Crea elementi che nascondono i metacodici e mostrano icone
  const createOverlayElements = () => {
    const elements: React.ReactElement[] = [];
    
    // Crea elementi di copertura per ogni metacodice
    parsedCodes.forEach((metacode, index) => {
      const textBeforeMetacode = text.substring(0, metacode.start);
      const lines = textBeforeMetacode.split('\n');
      const lineNumber = lines.length - 1;
      const columnNumber = lines[lines.length - 1].length;
      
      const lineHeight = 20;
      const charWidth = 7;
      const padding = 8;
      
      const top = padding + (lineNumber * lineHeight) + 2;
      const left = padding + (columnNumber * charWidth);
      const metacodeWidth = (metacode.end - metacode.start) * charWidth;
      
      // Elemento che nasconde il metacodice originale
      elements.push(
        <div
          key={`cover-${index}`}
          className="absolute bg-slate-700/50"
          style={{
            top: `${top}px`,
            left: `${left}px`,
            width: `${metacodeWidth}px`,
            height: '16px',
            zIndex: 1
          }}
        />
      );
      
      // Icona che sostituisce il metacodice
      elements.push(
        <button
          key={`icon-${index}`}
          onClick={() => onMetacodeClick(metacode)}
          className={`
            absolute inline-flex items-center justify-center text-xs rounded-sm text-white
            hover:scale-110 transition-transform border border-white/20
            ${getMetacodeColor(metacode.type)} pointer-events-auto
          `}
          style={{
            top: `${top}px`,
            left: `${left}px`,
            width: `${Math.min(metacodeWidth, 20)}px`,
            height: '16px',
            zIndex: 2
          }}
          title={`${metacode.type}: ${metacode.raw}`}
        >
          <span className="text-[10px] leading-none">
            {getMetacodeIcon(metacode.type)}
          </span>
        </button>
      );
    });
    
    return elements;
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {createOverlayElements()}
    </div>
  );
};
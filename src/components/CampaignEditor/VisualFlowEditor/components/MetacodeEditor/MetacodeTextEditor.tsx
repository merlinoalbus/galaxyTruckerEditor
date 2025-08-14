import React, { useState, useRef, useEffect } from 'react';
import { parseMetacode, insertMetacodeAtCursor, replaceMetacode } from './utils/metacodeParser';
import { ParsedMetacode } from './types';
import { TIMEOUT_CONSTANTS } from '@/constants/VisualFlowEditor.constants';

interface MetacodeTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onMetacodeClick?: (metacode: ParsedMetacode) => void;
  onCursorPositionChange?: (position: number) => void;
  placeholder?: string;
  className?: string;
}

const getMetacodeIcon = (type: string): string => {
  switch (type) {
    case 'gender': return 'G';
    case 'plural': return 'N';
    case 'verb': return 'V';
    case 'playerName': return 'NAME';
    case 'image': return 'IMG';
    case 'icon': return '⭐';
    case 'missionResult': return 'RES';
    case 'platform': return '📱';
    case 'number': return '🔢';
    case 'vector': return '📍';
    case 'boolean': return '✅';
    case 'parameter': return '⚙️';
    case 'script': return '📜';
    case 'inventory': return '🎒';
    case 'mission': return '📋';
    case 'player': return '👥';
    case 'variable': return '🔄';
    case 'condition': return '❓';
    case 'action': return '⚡';
    case 'resource': return '💎';
    case 'achievement': return '🏆';
    case 'time': return '⏰';
    case 'location': return '🌍';
    case 'item': return '📦';
    case 'character': return '🎭';
    case 'dialogue': return '💬';
    case 'quest': return '🗡️';
    case 'skill': return '✨';
    case 'level': return '📊';
    case 'experience': return '⭐';
    case 'currency': return '🪙';
    case 'shop': return '🏪';
    case 'battle': return '⚔️';
    case 'magic': return '🔮';
    case 'weapon': return '🗡️';
    case 'armor': return '🛡️';
    case 'potion': return '🧪';
    case 'spell': return '✨';
    case 'monster': return '👹';
    case 'npc': return '🤖';
    case 'event': return '🎪';
    case 'trigger': return '🔔';
    case 'sound': return '🔊';
    case 'music': return '🎵';
    case 'effect': return '💫';
    case 'animation': return '🎬';
    case 'ui': return '🖥️';
    case 'menu': return '📋';
    case 'button': return '🔘';
    case 'text': return '📝';
    case 'color': return '🎨';
    case 'size': return '📏';
    case 'position': return '📍';
    case 'rotation': return '🔄';
    case 'scale': return '⚖️';
    case 'opacity': return '👻';
    case 'visibility': return '👁️';
    case 'state': return '🔄';
    case 'flag': return '🚩';
    case 'counter': return '🔢';
    case 'timer': return '⏱️';
    case 'random': return '🎲';
    case 'math': return '➕';
    case 'string': return '🔤';
    case 'array': return '📚';
    case 'object': return '📦';
    case 'function': return '⚙️';
    default: return '🔧';
  }
};

const getMetacodeColor = (type: string): string => {
  switch (type) {
    case 'gender': return 'bg-blue-500';
    case 'plural': return 'bg-blue-500';
    case 'verb': return 'bg-purple-500';
    case 'playerName': return 'bg-green-500';
    case 'image': return 'bg-yellow-500';
    case 'icon': return 'bg-orange-500';
    case 'missionResult': return 'bg-red-500';
    case 'platform': return 'bg-indigo-500';
    case 'number': return 'bg-teal-500';
    case 'vector': return 'bg-pink-500';
    case 'boolean': return 'bg-emerald-500';
    case 'parameter': return 'bg-cyan-500';
    case 'script': return 'bg-violet-500';
    case 'inventory': return 'bg-amber-500';
    case 'mission': return 'bg-lime-500';
    case 'player': return 'bg-sky-500';
    case 'variable': return 'bg-rose-500';
    case 'condition': return 'bg-fuchsia-500';
    case 'action': return 'bg-yellow-600';
    case 'resource': return 'bg-purple-600';
    case 'achievement': return 'bg-gold-500';
    case 'time': return 'bg-blue-600';
    case 'location': return 'bg-green-600';
    case 'item': return 'bg-brown-500';
    case 'character': return 'bg-red-600';
    case 'dialogue': return 'bg-blue-400';
    case 'quest': return 'bg-orange-600';
    case 'skill': return 'bg-purple-400';
    case 'level': return 'bg-indigo-400';
    case 'experience': return 'bg-yellow-400';
    case 'currency': return 'bg-amber-600';
    case 'shop': return 'bg-green-400';
    case 'battle': return 'bg-red-700';
    case 'magic': return 'bg-purple-700';
    case 'weapon': return 'bg-gray-600';
    case 'armor': return 'bg-slate-600';
    case 'potion': return 'bg-green-700';
    case 'spell': return 'bg-indigo-600';
    case 'monster': return 'bg-red-800';
    case 'npc': return 'bg-blue-300';
    case 'event': return 'bg-pink-400';
    case 'trigger': return 'bg-orange-400';
    case 'sound': return 'bg-teal-400';
    case 'music': return 'bg-violet-400';
    case 'effect': return 'bg-cyan-400';
    case 'animation': return 'bg-rose-400';
    case 'ui': return 'bg-slate-400';
    case 'menu': return 'bg-gray-400';
    case 'button': return 'bg-blue-200';
    case 'text': return 'bg-gray-300';
    case 'color': return 'bg-rainbow-500';
    case 'size': return 'bg-amber-300';
    case 'position': return 'bg-green-300';
    case 'rotation': return 'bg-blue-300';
    case 'scale': return 'bg-purple-300';
    case 'opacity': return 'bg-gray-200';
    case 'visibility': return 'bg-slate-300';
    case 'state': return 'bg-teal-300';
    case 'flag': return 'bg-red-400';
    case 'counter': return 'bg-orange-300';
    case 'timer': return 'bg-yellow-300';
    case 'random': return 'bg-pink-300';
    case 'math': return 'bg-green-200';
    case 'string': return 'bg-blue-100';
    case 'array': return 'bg-purple-200';
    case 'object': return 'bg-indigo-200';
    case 'function': return 'bg-cyan-300';
    default: return 'bg-slate-500';
  }
};

export const MetacodeTextEditor: React.FC<MetacodeTextEditorProps> = ({
  value,
  onChange,
  onMetacodeClick,
  onCursorPositionChange,
  placeholder,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const hiddenTextareaRef = useRef<HTMLTextAreaElement>(null);
  const visibleEditorRef = useRef<HTMLDivElement>(null);
  const parsedCodes = parseMetacode(value);

  // Notifica cambio posizione cursore
  useEffect(() => {
    if (onCursorPositionChange) {
      onCursorPositionChange(cursorPosition);
    }
  }, [cursorPosition, onCursorPositionChange]);

  // Renderizza il testo con icone al posto dei metacodici
  const renderVisualText = () => {
    if (parsedCodes.length === 0) {
      return value || <span className="text-gray-500">{placeholder}</span>;
    }

    let result = [];
    let lastEnd = 0;

    parsedCodes.forEach((metacode, index) => {
      // Testo normale prima del metacodice
      if (metacode.start > lastEnd) {
        const normalText = value.substring(lastEnd, metacode.start);
        result.push(
          <span key={`text-${index}`} className="text-white">
            {normalText}
          </span>
        );
      }

      // Icona al posto del metacodice
      result.push(
        <button
          key={`meta-${index}`}
          onClick={(e) => {
            e.preventDefault();
            if (onMetacodeClick) {
              onMetacodeClick(metacode);
            }
          }}
          className={`
            inline-flex items-center justify-center w-5 h-4 text-xs rounded-sm text-white
            hover:scale-110 transition-transform shadow-sm border border-white/20 mx-0.5
            ${getMetacodeColor(metacode.type)}
          `}
          title={`${metacode.type}: ${metacode.raw}`}
          tabIndex={-1}
        >
          <span className="text-[10px] leading-none">
            {getMetacodeIcon(metacode.type)}
          </span>
        </button>
      );

      lastEnd = metacode.end;
    });

    // Testo finale
    if (lastEnd < value.length) {
      result.push(
        <span key="text-final" className="text-white">
          {value.substring(lastEnd)}
        </span>
      );
    }

    return result;
  };

  // Gestisce il click sull'editor per iniziare l'editing
  const handleEditorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsEditing(true);
    
    // Focus sulla textarea nascosta per permettere l'input
    setTimeout(() => {
      if (hiddenTextareaRef.current) {
        hiddenTextareaRef.current.focus();
        hiddenTextareaRef.current.setSelectionRange(value.length, value.length);
      }
    }, 0);
  };

  // Gestisce l'input nella textarea nascosta
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    
    // Aggiorna posizione cursore
    const textarea = e.target;
    setCursorPosition(textarea.selectionStart || 0);
  };

  // Gestisce il cambio di selezione del cursore
  const handleSelectionChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.target as HTMLTextAreaElement;
    setCursorPosition(textarea.selectionStart || 0);
  };

  // Gestisce blur per tornare alla visualizzazione icone
  const handleBlur = () => {
    setTimeout(() => {
      setIsEditing(false);
    }, TIMEOUT_CONSTANTS.SCROLL_DELAY);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Editor visibile */}
      {!isEditing ? (
        <div
          ref={visibleEditorRef}
          onClick={handleEditorClick}
          className="w-full bg-slate-700/50 text-white px-2 py-1 rounded text-xs border border-slate-600 hover:border-slate-500 cursor-text min-h-[24px] whitespace-pre-wrap"
          style={{ lineHeight: '1.5' }}
        >
          {renderVisualText()}
        </div>
      ) : (
        // Textarea per editing
        <textarea
          ref={hiddenTextareaRef}
          value={value}
          onChange={handleTextareaChange}
          onSelect={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          onMouseUp={handleSelectionChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full bg-slate-700/50 text-white px-2 py-1 rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none resize-y"
          rows={1}
          style={{ minHeight: '24px', lineHeight: '1.5' }}
          autoFocus
        />
      )}
    </div>
  );
};
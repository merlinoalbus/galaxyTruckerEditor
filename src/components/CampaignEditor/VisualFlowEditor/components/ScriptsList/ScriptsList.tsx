import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import type { ScriptsListProps } from './ScriptsList.types';

export const ScriptsList: React.FC<ScriptsListProps> = ({
  showScriptsList,
  setShowScriptsList,
  availableScripts,
  loadScript,
  buttonRef
}) => {
  const [filteredScripts, setFilteredScripts] = useState(availableScripts);
  const [searchText, setSearchText] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Calcola posizione contestuale al pulsante
  useEffect(() => {
    if (showScriptsList && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const modalWidth = 320; // w-80 = 20rem = 320px
      const modalHeight = 500; // stimato
      
      let top = rect.bottom + 8;
      let left = rect.left;
      
      // Aggiusta se esce dai bordi della finestra
      if (left + modalWidth > window.innerWidth) {
        left = window.innerWidth - modalWidth - 16;
      }
      
      if (top + modalHeight > window.innerHeight) {
        top = rect.top - modalHeight - 8;
      }
      
      setPosition({ top, left });
    }
  }, [showScriptsList, buttonRef]);

  // Gestione click esterno per chiudere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) &&
          buttonRef?.current && !buttonRef.current.contains(event.target as Node)) {
        setShowScriptsList(false);
      }
    };

    if (showScriptsList) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showScriptsList, setShowScriptsList, buttonRef]);

  // Filtra scripts in base al testo di ricerca
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredScripts(availableScripts);
    } else {
      const searchLower = searchText.toLowerCase();
      const filtered = availableScripts.filter(script => 
        script.name.toLowerCase().includes(searchLower) ||
        (script.fileName && script.fileName.toLowerCase().includes(searchLower))
      );
      setFilteredScripts(filtered);
    }
  }, [searchText, availableScripts]);
  if (!showScriptsList) return null;

  const positionStyle = buttonRef ? {
    position: 'fixed' as const,
    top: `${position.top}px`,
    left: `${position.left}px`,
    zIndex: 50
  } : {
    position: 'absolute' as const,
    top: '80px',
    left: '4px',
    zIndex: 50
  };

  return (
    <div 
      ref={modalRef}
      className="w-80 bg-slate-800 rounded-lg shadow-xl border border-slate-600 p-4"
      style={positionStyle}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold">Scripts Disponibili</h3>
        <button
          onClick={() => setShowScriptsList(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      {/* Campo di ricerca */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca script..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-10 pr-3 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Lista scripts */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredScripts.length > 0 ? (
          filteredScripts.map(script => (
            <div
              key={script.id}
              className="p-3 bg-slate-700 hover:bg-slate-600 rounded cursor-pointer transition-colors"
              onClick={() => loadScript(script.id)}
            >
              <div className="text-white font-medium">{script.name}</div>
              {script.fileName && (
                <div className="text-xs text-gray-400">{script.fileName}</div>
              )}
            </div>
          ))
        ) : (
          <div className="text-gray-400 text-center py-4">
            Nessuno script disponibile
          </div>
        )}
      </div>
    </div>
  );
};
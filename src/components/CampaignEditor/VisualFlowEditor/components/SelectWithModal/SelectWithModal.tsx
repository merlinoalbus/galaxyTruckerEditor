import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Check, Variable, Flag, Tag, FileCode } from 'lucide-react';

interface SelectWithModalProps {
  type: 'variable' | 'semaphore' | 'label' | 'script' | 'mission';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  availableItems: string[];
  onAddItem?: (item: string) => void;
  className?: string;
}

export const SelectWithModal: React.FC<SelectWithModalProps> = ({
  type,
  value,
  onChange,
  placeholder = 'Seleziona...',
  availableItems,
  onAddItem,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [filteredItems, setFilteredItems] = useState<string[]>(availableItems);
  const [showNewItemInput, setShowNewItemInput] = useState(false);

  // Filtra gli elementi in base al termine di ricerca
  useEffect(() => {
    const filtered = availableItems.filter(item =>
      item.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, availableItems]);

  // Ottieni l'icona in base al tipo
  const getIcon = () => {
    switch (type) {
      case 'variable': return <Variable className="w-3 h-3" />;
      case 'semaphore': return <Flag className="w-3 h-3" />;
      case 'label': return <Tag className="w-3 h-3" />;
      case 'script':
      case 'mission': return <FileCode className="w-3 h-3" />;
      default: return null;
    }
  };

  // Ottieni il titolo della modale
  const getModalTitle = () => {
    switch (type) {
      case 'variable': return 'Seleziona Variabile';
      case 'semaphore': return 'Seleziona Semaforo';
      case 'label': return 'Seleziona Etichetta';
      case 'script': return 'Seleziona Script';
      case 'mission': return 'Seleziona Missione';
      default: return 'Seleziona';
    }
  };

  // Gestisci la selezione di un elemento
  const handleSelect = (item: string) => {
    onChange(item);
    setIsModalOpen(false);
    setSearchTerm('');
    setShowNewItemInput(false);
  };

  // Gestisci l'aggiunta di un nuovo elemento
  const handleAddNewItem = () => {
    if (newItemName.trim() && onAddItem) {
      // Verifica che non esista già
      if (!availableItems.includes(newItemName.trim())) {
        onAddItem(newItemName.trim());
        handleSelect(newItemName.trim());
        setNewItemName('');
      } else {
        alert(`${type === 'variable' ? 'La variabile' : 
               type === 'semaphore' ? 'Il semaforo' :
               type === 'label' ? "L'etichetta" :
               type === 'script' ? 'Lo script' : 'La missione'} esiste già!`);
      }
    }
  };

  return (
    <>
      {/* Input field con icona */}
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-slate-800/50 text-gray-200 px-2 py-1 pr-8 rounded text-xs border border-slate-700 hover:border-blue-600 focus:border-blue-600 focus:outline-none text-left flex items-center gap-2 transition-colors"
        >
          {getIcon()}
          <span className={value ? 'text-white' : 'text-gray-400'}>
            {value || placeholder}
          </span>
        </button>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>
        )}
      </div>

      {/* Modale */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-600 rounded-lg w-[500px] max-h-[300px] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {getIcon()}
                {getModalTitle()}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchTerm('');
                  setShowNewItemInput(false);
                  setNewItemName('');
                }}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Search bar */}
            <div className="p-4 border-b border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-700 text-white pl-10 pr-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Lista elementi con scroll ottimizzato */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0" style={{ scrollBehavior: 'smooth' }}>
              {filteredItems.length > 0 ? (
                <div className="space-y-1">
                  {filteredItems.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleSelect(item)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between group
                        ${value === item 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:bg-slate-700 text-gray-300 hover:text-white'}`}
                    >
                      <span className="text-sm">{item}</span>
                      {value === item && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm mb-2">
                    {searchTerm 
                      ? `Nessun ${type === 'variable' ? 'variabile' : 
                                  type === 'semaphore' ? 'semaforo' :
                                  type === 'label' ? 'etichetta' :
                                  type === 'script' ? 'script' : 'missione'} trovato`
                      : `Nessun ${type === 'variable' ? 'variabile' : 
                                  type === 'semaphore' ? 'semaforo' :
                                  type === 'label' ? 'etichetta' :
                                  type === 'script' ? 'script' : 'missione'} disponibile`}
                  </p>
                </div>
              )}
            </div>

            {/* Footer con pulsante aggiungi */}
            {onAddItem && (
              <div className="p-4 border-t border-slate-700">
                {!showNewItemInput ? (
                  <button
                    onClick={() => setShowNewItemInput(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Aggiungi {type === 'variable' ? 'Variabile' : 
                              type === 'semaphore' ? 'Semaforo' :
                              type === 'label' ? 'Etichetta' :
                              type === 'script' ? 'Script' : 'Missione'}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Nome ${type === 'variable' ? 'variabile' : 
                                          type === 'semaphore' ? 'semaforo' :
                                          type === 'label' ? 'etichetta' :
                                          type === 'script' ? 'script' : 'missione'}...`}
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddNewItem()}
                      className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
                      autoFocus
                    />
                    <button
                      onClick={handleAddNewItem}
                      disabled={!newItemName.trim()}
                      className="bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      Conferma
                    </button>
                    <button
                      onClick={() => {
                        setShowNewItemInput(false);
                        setNewItemName('');
                      }}
                      className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      Annulla
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, X, Check, Variable, Flag, Tag, FileCode, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/locales';

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
  placeholder,
  availableItems,
  onAddItem,
  className = ''
}) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [filteredItems, setFilteredItems] = useState<string[]>(availableItems);
  const [showNewItemInput, setShowNewItemInput] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [dropdownWidth, setDropdownWidth] = useState(280);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtra gli elementi in base al termine di ricerca
  useEffect(() => {
    const filtered = availableItems.filter(item =>
      item.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, availableItems]);

  // Calcola la posizione del dropdown
  const calculateDropdownPosition = () => {
    if (!buttonRef.current) return;
    
    const dropdownWidth = 280;
    setDropdownWidth(dropdownWidth);
    
    const rect = buttonRef.current.getBoundingClientRect();
    
    let left: number;
    let top: number;
    
    // Posiziona sotto il button
    left = rect.left;
    top = rect.bottom + 5;
    
    // Se il dropdown esce dal bordo destro, allinealo a destra del button
    if (left + dropdownWidth > window.innerWidth - 10) {
      left = rect.right - dropdownWidth;
    }
    
    // Per il GO block, calcola l'altezza reale necessaria basata sul numero di items
    const itemHeight = 30; // altezza approssimativa di ogni item
    const headerHeight = 50; // search bar
    const footerHeight = onAddItem ? 50 : 0; // add button se presente
    const maxItemsVisible = 5;
    const actualItemsCount = Math.min(filteredItems.length, maxItemsVisible);
    const estimatedHeight = headerHeight + (actualItemsCount * itemHeight) + footerHeight + 20; // padding
    const dropdownHeight = Math.min(estimatedHeight, 300); // max 300px
    
    // Verifica spazio verticale con l'altezza stimata
    const spaceBelow = window.innerHeight - rect.bottom - 10; // 10px margin dal fondo
    const spaceAbove = rect.top - 10; // 10px margin dal top
    
    // Posiziona sopra solo se non c'è davvero spazio sotto E c'è più spazio sopra
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow && spaceAbove > dropdownHeight) {
      top = rect.top - dropdownHeight - 5;
    }
    
    // Assicura che non esca a sinistra
    left = Math.max(10, left);
    
    setDropdownPosition({ top, left });
  };


  // Calcola la posizione quando il dropdown si apre
  useEffect(() => {
    if (isModalOpen) {
      // Usa setTimeout per assicurarsi che il portal sia renderizzato
      setTimeout(() => {
        calculateDropdownPosition();
      }, 0);
    }
  }, [isModalOpen]);

  // Chiudi il dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isModalOpen && 
          dropdownRef.current && 
          buttonRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          !buttonRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
        setSearchTerm('');
        setShowNewItemInput(false);
        setNewItemName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModalOpen]);

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
      case 'variable': return t('visualFlowEditor.select.selectVariable');
      case 'semaphore': return t('visualFlowEditor.select.selectSemaphore');
      case 'label': return t('visualFlowEditor.select.selectLabel');
      case 'script': return t('visualFlowEditor.select.selectScript');
      case 'mission': return t('visualFlowEditor.select.selectMission');
      default: return t('visualFlowEditor.select.select');
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
        alert(t('visualFlowEditor.select.alreadyExists').replace('{type}', 
               type === 'variable' ? t('visualFlowEditor.select.variableType') : 
               type === 'semaphore' ? t('visualFlowEditor.select.semaphoreType') :
               type === 'label' ? t('visualFlowEditor.select.labelType') :
               type === 'script' ? t('visualFlowEditor.select.scriptType') : t('visualFlowEditor.select.missionType')));
      }
    }
  };

  return (
    <>
      {/* Input field con icona */}
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!isModalOpen) {
              // Calcola la posizione PRIMA di aprire il modal
              calculateDropdownPosition();
            }
            setIsModalOpen(!isModalOpen);
          }}
          className="w-full bg-slate-800/50 text-gray-200 px-2 py-1.5 pr-7 rounded-md text-xs border border-slate-700 hover:border-blue-500 focus:border-blue-500 focus:outline-none text-left flex items-center gap-2 transition-all duration-200 hover:bg-slate-700/50"
        >
          {getIcon()}
          <span className={`flex-1 truncate ${value ? 'text-white' : 'text-gray-400'}`}>
            {value || placeholder || t('visualFlowEditor.select.selectPlaceholder')}
          </span>
          <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isModalOpen ? 'rotate-180' : ''}`} />
        </button>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-600 rounded transition-colors"
          >
            <X className="w-3 h-3 text-gray-400 hover:text-white" />
          </button>
        )}
      </div>

      {/* Dropdown contestuale - renderizzato tramite portal */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] bg-slate-800 border border-slate-600 rounded-lg shadow-2xl overflow-hidden"
          style={{ 
            top: `${dropdownPosition.top}px`, 
            left: `${dropdownPosition.left}px`,
            width: `${dropdownWidth}px`,
            maxHeight: filteredItems.length > 5 ? '300px' : 'auto',
            minHeight: '120px'
          }}
        >
          {/* Search bar compatto */}
          <div className="p-2 border-b border-slate-700 bg-slate-900/50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder={t('visualFlowEditor.select.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700/50 text-white pl-7 pr-2 py-1.5 rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none placeholder-gray-500"
                autoFocus
              />
            </div>
          </div>

          {/* Lista elementi scrollabile */}
          <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
            {filteredItems.length > 0 ? (
              <div className="p-1">
                {filteredItems.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition-all duration-150 flex items-center justify-between group
                      ${value === item 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-slate-700 text-gray-300 hover:text-white'}`}
                  >
                    <span className="truncate">{item}</span>
                    {value === item && <Check className="w-3 h-3 flex-shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-xs px-4">
                  {searchTerm 
                    ? t('visualFlowEditor.select.nothingFound').replace('{type}', 
                        type === 'variable' ? t('visualFlowEditor.select.variableType') : 
                        type === 'semaphore' ? t('visualFlowEditor.select.semaphoreType') :
                        type === 'label' ? t('visualFlowEditor.select.labelType') :
                        type === 'script' ? t('visualFlowEditor.select.scriptType') : t('visualFlowEditor.select.missionType'))
                    : t('visualFlowEditor.select.nothingAvailable').replace('{type}', 
                        type === 'variable' ? t('visualFlowEditor.select.variableType') : 
                        type === 'semaphore' ? t('visualFlowEditor.select.semaphoreType') :
                        type === 'label' ? t('visualFlowEditor.select.labelType') :
                        type === 'script' ? t('visualFlowEditor.select.scriptType') : t('visualFlowEditor.select.missionType'))}
                </p>
              </div>
            )}
          </div>

          {/* Pulsante aggiungi compatto */}
          {onAddItem && (
            <div className="border-t border-slate-700 p-2 bg-slate-900/30">
              {!showNewItemInput ? (
                <button
                  onClick={() => setShowNewItemInput(true)}
                  className="w-full bg-blue-600/90 hover:bg-blue-500 text-white px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  {t('visualFlowEditor.select.addNew').replace('{type}', '')}
                </button>
              ) : (
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder={type === 'label' ? 'Name...' : 'Name...'}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleAddNewItem();
                      if (e.key === 'Escape') {
                        setShowNewItemInput(false);
                        setNewItemName('');
                      }
                    }}
                    className="flex-1 bg-slate-700 text-white px-2 py-1.5 rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleAddNewItem}
                    disabled={!newItemName.trim()}
                    className="p-1.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:opacity-50 text-white rounded text-xs transition-colors"
                    title={t('visualFlowEditor.select.confirm')}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      setShowNewItemInput(false);
                      setNewItemName('');
                    }}
                    className="p-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs transition-colors"
                    title={t('visualFlowEditor.select.cancel')}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
// StringsEditor.tsx - Editor per le stringhe di traduzione
import React, { useState, useMemo } from 'react';
import { Search, Globe, Bot, Edit3, Copy } from 'lucide-react';

import type { LocalizationCategory, LocalizationString } from '@/hooks/CampaignEditor/useLocalizationStrings';

interface StringsEditorProps {
  category: LocalizationCategory;
  strings: LocalizationString[];
  searchTerm: string;
  selectedLanguage: string;
  supportedLanguages: string[];
  isLoading: boolean;
  isTranslating: boolean;
  onSearchChange: (search: string) => void;
  onLanguageChange: (language: string) => void;
  onStringUpdate: (stringId: string, language: string, value: string) => void;
  onTranslateString: (text: string, fromLang: string, toLang: string, context?: string) => Promise<{ success: boolean; translatedText?: string; error?: string }>;
}

export const StringsEditor: React.FC<StringsEditorProps> = ({
  category,
  strings,
  searchTerm,
  selectedLanguage,
  supportedLanguages,
  isLoading,
  isTranslating,
  onSearchChange,
  onLanguageChange,
  onStringUpdate,
  onTranslateString
}) => {
  const [editingString, setEditingString] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());
  
  // Statistiche per ogni lingua nella categoria corrente
  const languageStats = useMemo(() => {
    return supportedLanguages.reduce((stats, lang) => {
      const translatedCount = strings.filter(str => 
        str.values[lang] && str.values[lang].trim() !== ''
      ).length;
      
      stats[lang] = {
        translated: translatedCount,
        missing: strings.length - translatedCount,
        percentage: strings.length > 0 ? Math.round((translatedCount / strings.length) * 100) : 0
      };
      
      return stats;
    }, {} as Record<string, { translated: number; missing: number; percentage: number }>);
  }, [strings, supportedLanguages]);

  const handleStringChange = (stringId: string, language: string, value: string) => {
    onStringUpdate(stringId, language, value);
    setPendingChanges(prev => new Set([...prev, stringId]));
  };

  const handleTranslateSingle = async (stringItem: LocalizationString, fromLang: string, toLang: string) => {
    const sourceText = stringItem.values[fromLang];
    if (!sourceText || sourceText.trim() === '') {
      return;
    }

    const result = await onTranslateString(sourceText, fromLang, toLang, stringItem.id);
    if (result.success && result.translatedText) {
      handleStringChange(stringItem.id, toLang, result.translatedText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="text-center text-gray-400">
          <Globe className="w-12 h-12 animate-pulse mx-auto mb-4" />
          <p>Caricamento stringhe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{category.nome}</h2>
            <p className="text-sm text-gray-400">
              {strings.length} stringhe
              {pendingChanges.size > 0 && (
                <span className="ml-2 text-yellow-400">
                  • {pendingChanges.size} modifiche non salvate
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Filtri e controlli */}
        <div className="flex items-center space-x-4">
          {/* Ricerca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca stringhe..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Selezione lingua */}
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {supportedLanguages.map(lang => (
                <option key={lang} value={lang}>
                  {lang} ({languageStats[lang]?.percentage || 0}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Statistiche rapide */}
        <div className="mt-3 flex flex-wrap gap-2">
          {supportedLanguages.map(lang => {
            const stats = languageStats[lang];
            const isSelected = lang === selectedLanguage;
            
            return (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`
                  px-3 py-1 rounded-full text-xs font-medium transition-colors
                  ${isSelected 
                    ? 'bg-blue-600 text-white' 
                    : stats?.percentage === 100
                      ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                      : stats?.percentage === 0
                        ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                        : 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                  }
                `}
              >
                {lang}: {stats?.percentage || 0}%
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista stringhe */}
      <div className="flex-1 overflow-y-auto">
        {strings.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nessuna stringa trovata</p>
              {searchTerm && (
                <p className="text-sm mt-1">
                  Prova a modificare i termini di ricerca
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {strings.map((stringItem) => {
              const currentValue = stringItem.values[selectedLanguage] || '';
              const isEditing = editingString === stringItem.id;
              const hasPendingChanges = pendingChanges.has(stringItem.id);
              
              // Trova una lingua di riferimento per la traduzione
              const referenceLang = supportedLanguages.find(lang => 
                lang !== selectedLanguage && stringItem.values[lang]
              );
              
              return (
                <div key={stringItem.id} className="p-4 hover:bg-gray-750">
                  <div className="flex items-start space-x-4">
                    {/* ID della stringa */}
                    <div className="flex-shrink-0 w-48">
                      <div className="font-mono text-sm text-blue-400 break-all">
                        {stringItem.id}
                        {hasPendingChanges && (
                          <span className="ml-2 text-yellow-400" title="Modifiche non salvate">
                            •
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Campo di input/testo */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <textarea
                          value={currentValue}
                          onChange={(e) => handleStringChange(stringItem.id, selectedLanguage, e.target.value)}
                          onBlur={() => setEditingString(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              setEditingString(null);
                            }
                            if (e.key === 'Escape') {
                              setEditingString(null);
                            }
                          }}
                          autoFocus
                          rows={Math.min(Math.max(currentValue.split('\n').length, 1), 6)}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Traduzione in ${selectedLanguage}...`}
                        />
                      ) : (
                        <div
                          onClick={() => setEditingString(stringItem.id)}
                          className={`
                            p-2 rounded cursor-text min-h-[2.5rem] flex items-center
                            ${currentValue 
                              ? 'text-white bg-gray-700 hover:bg-gray-650' 
                              : 'text-gray-400 bg-gray-750 border-2 border-dashed border-gray-600 hover:border-gray-500'
                            }
                          `}
                        >
                          {currentValue || `Clicca per aggiungere traduzione in ${selectedLanguage}...`}
                        </div>
                      )}
                    </div>
                    
                    {/* Azioni */}
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      {/* Copia testo */}
                      {currentValue && (
                        <button
                          onClick={() => copyToClipboard(currentValue)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                          title="Copia testo"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Traduzione AI */}
                      {referenceLang && (
                        <button
                          onClick={() => handleTranslateSingle(stringItem, referenceLang, selectedLanguage)}
                          disabled={isTranslating}
                          className="p-2 text-purple-400 hover:text-purple-300 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                          title={`Traduci da ${referenceLang} a ${selectedLanguage} con AI`}
                        >
                          <Bot className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Edit button */}
                      <button
                        onClick={() => setEditingString(isEditing ? null : stringItem.id)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        title="Modifica"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Mostra testo di riferimento per la traduzione */}
                  {referenceLang && stringItem.values[referenceLang] && (
                    <div className="mt-2 pl-52 text-sm text-gray-400 border-l-2 border-gray-600 pl-4">
                      <span className="font-mono text-xs text-blue-300">{referenceLang}:</span>
                      <span className="ml-2">{stringItem.values[referenceLang]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
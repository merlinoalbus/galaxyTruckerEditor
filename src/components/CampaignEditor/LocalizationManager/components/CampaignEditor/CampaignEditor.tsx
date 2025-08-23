// CampaignEditor.tsx - Editor per le traduzioni di missions e nodes
import React, { useState } from 'react';
import { Search, Globe, Edit3, Map, FileText, Copy } from 'lucide-react';

import type { CampaignTranslationData, CampaignTranslation } from '@/hooks/CampaignEditor/useCampaignTranslations';

interface CampaignEditorProps {
  data: CampaignTranslationData;
  items: CampaignTranslation[];
  searchTerm: string;
  selectedLanguage: string;
  selectedFileType: 'missions' | 'nodes';
  supportedLanguages: string[];
  languageStats: { [key: string]: { translated: number; missing: number; percentage: number } };
  isLoading: boolean;
  onSearchChange: (search: string) => void;
  onLanguageChange: (language: string) => void;
  onFileTypeChange: (fileType: 'missions' | 'nodes') => void;
  onUpdate: (itemId: string, language: string, field: 'caption' | 'description', value: string) => void;
}

export const CampaignEditor: React.FC<CampaignEditorProps> = ({
  data,
  items,
  searchTerm,
  selectedLanguage,
  selectedFileType,
  supportedLanguages,
  languageStats,
  isLoading,
  onSearchChange,
  onLanguageChange,
  onFileTypeChange,
  onUpdate
}) => {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'caption' | 'description' | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="text-center text-gray-400">
          <Map className="w-12 h-12 animate-pulse mx-auto mb-4" />
          <p>Caricamento dati campagna...</p>
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
            <h2 className="text-lg font-semibold text-white">
              {selectedFileType === 'missions' ? 'Missioni' : 'Nodi'} - {data.fileName}
            </h2>
            <p className="text-sm text-gray-400">
              {items.length} elementi
            </p>
          </div>
        </div>

        {/* Controlli */}
        <div className="flex items-center space-x-4 mb-4">
          {/* Selettore tipo file */}
          <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => onFileTypeChange('missions')}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${selectedFileType === 'missions' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }
              `}
            >
              <Map className="w-4 h-4" />
              <span>Missioni</span>
            </button>
            <button
              onClick={() => onFileTypeChange('nodes')}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${selectedFileType === 'nodes' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }
              `}
            >
              <FileText className="w-4 h-4" />
              <span>Nodi</span>
            </button>
          </div>

          {/* Ricerca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Cerca ${selectedFileType}...`}
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
        <div className="flex flex-wrap gap-2">
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

      {/* Lista items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nessun elemento trovato</p>
              {searchTerm && (
                <p className="text-sm mt-1">
                  Prova a modificare i termini di ricerca
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {items.map((item) => {
              const currentTranslation = item.translations[selectedLanguage] || { caption: '', description: '' };
              const isEditingCaption = editingItem === item.id && editingField === 'caption';
              const isEditingDescription = editingItem === item.id && editingField === 'description';
              
              // Trova una lingua di riferimento per la traduzione
              const referenceLang = supportedLanguages.find(lang => {
                const ref = item.translations[lang];
                return lang !== selectedLanguage && ref && (ref.caption || ref.description);
              });
              
              return (
                <div key={item.id} className="p-4 hover:bg-gray-750">
                  <div className="flex items-start space-x-4 mb-3">
                    {/* ID dell'item */}
                    <div className="flex-shrink-0 w-32">
                      <div className="font-mono text-sm text-blue-400 break-all">
                        {item.id}
                      </div>
                      <div className="text-xs text-gray-500">
                        #{item.index}
                      </div>
                    </div>
                    
                    {/* Campi Caption e Description */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Caption */}
                      <div>
                        <div className="text-xs text-gray-400 mb-1 flex items-center justify-between">
                          <span>Caption ({selectedLanguage})</span>
                          <div className="flex items-center space-x-1">
                            {currentTranslation.caption && (
                              <button
                                onClick={() => copyToClipboard(currentTranslation.caption)}
                                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                                title="Copia testo"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (isEditingCaption) {
                                  setEditingItem(null);
                                  setEditingField(null);
                                } else {
                                  setEditingItem(item.id);
                                  setEditingField('caption');
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                              title="Modifica"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        {isEditingCaption ? (
                          <input
                            type="text"
                            value={currentTranslation.caption}
                            onChange={(e) => onUpdate(item.id, selectedLanguage, 'caption', e.target.value)}
                            onBlur={() => {
                              setEditingItem(null);
                              setEditingField(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setEditingItem(null);
                                setEditingField(null);
                              }
                              if (e.key === 'Escape') {
                                setEditingItem(null);
                                setEditingField(null);
                              }
                            }}
                            autoFocus
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Caption in ${selectedLanguage}...`}
                          />
                        ) : (
                          <div
                            onClick={() => {
                              setEditingItem(item.id);
                              setEditingField('caption');
                            }}
                            className={`
                              p-2 rounded cursor-text min-h-[2.5rem] flex items-center
                              ${currentTranslation.caption 
                                ? 'text-white bg-gray-700 hover:bg-gray-650' 
                                : 'text-gray-400 bg-gray-750 border-2 border-dashed border-gray-600 hover:border-gray-500'
                              }
                            `}
                          >
                            {currentTranslation.caption || `Clicca per aggiungere caption in ${selectedLanguage}...`}
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <div className="text-xs text-gray-400 mb-1 flex items-center justify-between">
                          <span>Description ({selectedLanguage})</span>
                          <div className="flex items-center space-x-1">
                            {currentTranslation.description && (
                              <button
                                onClick={() => copyToClipboard(currentTranslation.description)}
                                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                                title="Copia testo"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (isEditingDescription) {
                                  setEditingItem(null);
                                  setEditingField(null);
                                } else {
                                  setEditingItem(item.id);
                                  setEditingField('description');
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                              title="Modifica"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        {isEditingDescription ? (
                          <textarea
                            value={currentTranslation.description}
                            onChange={(e) => onUpdate(item.id, selectedLanguage, 'description', e.target.value)}
                            onBlur={() => {
                              setEditingItem(null);
                              setEditingField(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                setEditingItem(null);
                                setEditingField(null);
                              }
                              if (e.key === 'Escape') {
                                setEditingItem(null);
                                setEditingField(null);
                              }
                            }}
                            autoFocus
                            rows={2}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Description in ${selectedLanguage}...`}
                          />
                        ) : (
                          <div
                            onClick={() => {
                              setEditingItem(item.id);
                              setEditingField('description');
                            }}
                            className={`
                              p-2 rounded cursor-text min-h-[3rem] flex items-start
                              ${currentTranslation.description 
                                ? 'text-white bg-gray-700 hover:bg-gray-650' 
                                : 'text-gray-400 bg-gray-750 border-2 border-dashed border-gray-600 hover:border-gray-500'
                              }
                            `}
                          >
                            {currentTranslation.description || `Clicca per aggiungere description in ${selectedLanguage}...`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Mostra testo di riferimento */}
                  {referenceLang && item.translations[referenceLang] && (
                    <div className="mt-3 pl-36 text-sm text-gray-400 border-l-2 border-gray-600 pl-4 space-y-1">
                      <div className="font-mono text-xs text-blue-300 mb-1">Riferimento ({referenceLang}):</div>
                      {item.translations[referenceLang].caption && (
                        <div>
                          <span className="text-xs text-gray-500">Caption:</span>
                          <span className="ml-2">{item.translations[referenceLang].caption}</span>
                        </div>
                      )}
                      {item.translations[referenceLang].description && (
                        <div>
                          <span className="text-xs text-gray-500">Description:</span>
                          <span className="ml-2">{item.translations[referenceLang].description}</span>
                        </div>
                      )}
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
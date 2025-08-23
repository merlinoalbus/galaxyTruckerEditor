// AITranslationModal.tsx - Modal per traduzione AI di categoria
import React, { useState } from 'react';
import { Bot, X, Globe, ArrowRight } from 'lucide-react';

interface AITranslationModalProps {
  supportedLanguages: string[];
  isTranslating: boolean;
  onTranslate: (fromLanguage: string, toLanguage: string) => void;
  onClose: () => void;
}

export const AITranslationModal: React.FC<AITranslationModalProps> = ({
  supportedLanguages,
  isTranslating,
  onTranslate,
  onClose
}) => {
  const [fromLanguage, setFromLanguage] = useState('EN');
  const [toLanguage, setToLanguage] = useState('IT');

  const handleTranslate = () => {
    if (fromLanguage === toLanguage) {
      alert('La lingua di origine deve essere diversa da quella di destinazione');
      return;
    }
    onTranslate(fromLanguage, toLanguage);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Traduzione AI</h2>
              <p className="text-sm text-gray-400">Traduci l'intera categoria</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isTranslating}
            className="text-gray-400 hover:text-white disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selezione lingue */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lingua di origine
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={fromLanguage}
                onChange={(e) => setFromLanguage(e.target.value)}
                disabled={isTranslating}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {supportedLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lingua di destinazione
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={toLanguage}
                onChange={(e) => setToLanguage(e.target.value)}
                disabled={isTranslating}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {supportedLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mb-6">
          <div className="flex items-start space-x-2">
            <Bot className="w-4 h-4 text-yellow-400 mt-0.5" />
            <div className="text-sm text-yellow-200">
              <p className="font-medium mb-1">Attenzione:</p>
              <p>
                La traduzione AI sostituirà tutte le stringhe esistenti nella lingua di destinazione. 
                Assicurati di salvare le modifiche correnti prima di procedere.
              </p>
            </div>
          </div>
        </div>

        {/* Azioni */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isTranslating}
            className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleTranslate}
            disabled={isTranslating || fromLanguage === toLanguage}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white transition-colors"
          >
            <Bot className="w-4 h-4" />
            <span>{isTranslating ? 'Traducendo...' : 'Traduci Categoria'}</span>
          </button>
        </div>

        {/* Progress indicator */}
        {isTranslating && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center space-x-3 text-sm text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
              <span>Traduzione in corso...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { X, Download, Info } from 'lucide-react';

export interface ExportConfiguration {
  languages: string[];
  patchMode: boolean;
  replacementLanguage?: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: ExportConfiguration) => void;
  isExporting: boolean;
}

const AVAILABLE_LANGUAGES = [
  { code: 'EN', name: 'English' },
  { code: 'DE', name: 'Deutsch' },
  { code: 'FR', name: 'Français' },
  { code: 'ES', name: 'Español' },
  { code: 'PL', name: 'Polski' },
  { code: 'CS', name: 'Čeština' },
  { code: 'RU', name: 'Русский' },
  { code: 'IT', name: 'Italiano' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isExporting,
}) => {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [patchMode, setPatchMode] = useState(false);
  const [replacementLanguage, setReplacementLanguage] = useState<string>('');

  const handleLanguageToggle = (langCode: string) => {
    setSelectedLanguages(prev => {
      const newSelected = prev.includes(langCode)
        ? prev.filter(l => l !== langCode)
        : [...prev, langCode];
      
      // Reset patch mode if more than one language is selected
      if (newSelected.length > 1) {
        setPatchMode(false);
        setReplacementLanguage('');
      }
      
      return newSelected;
    });
  };

  const handlePatchModeToggle = () => {
    const newPatchMode = !patchMode;
    setPatchMode(newPatchMode);
    if (!newPatchMode) {
      setReplacementLanguage('');
    }
  };

  const canEnablePatchMode = selectedLanguages.length === 1;
  const availableReplacementLanguages = AVAILABLE_LANGUAGES.filter(
    lang => lang.code !== 'EN' && !selectedLanguages.includes(lang.code)
  );

  const handleConfirm = () => {
    if (selectedLanguages.length === 0) return;

    onConfirm({
      languages: selectedLanguages,
      patchMode,
      replacementLanguage: patchMode ? replacementLanguage : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Download className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Esporta Traduzioni</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isExporting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Seleziona Lingue da Esportare
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_LANGUAGES.map(lang => (
                <label key={lang.code} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(lang.code)}
                    onChange={() => handleLanguageToggle(lang.code)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    disabled={isExporting}
                  />
                  <span className="text-sm text-gray-300">
                    {lang.name} ({lang.code})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Patch Mode */}
          {canEnablePatchMode && (
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patchMode}
                  onChange={handlePatchModeToggle}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  disabled={isExporting}
                />
                <span className="text-sm font-medium text-white">
                  Abilita Modalità PATCH
                </span>
              </label>
              <p className="text-xs text-gray-400 mt-1">
                Consente di sostituire una lingua esistente con quella selezionata
              </p>
            </div>
          )}

          {/* Replacement Language Selection */}
          {patchMode && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Seleziona Lingua da Sostituire
              </label>
              <select
                value={replacementLanguage}
                onChange={(e) => setReplacementLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isExporting}
              >
                <option value="">Seleziona una lingua...</option>
                {availableReplacementLanguages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.code})
                  </option>
                ))}
              </select>
              <div className="flex items-start space-x-2 mt-2 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md">
                <Info className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-200">
                  <p className="font-medium mb-1">Nota sulla Modalità PATCH:</p>
                  <p>
                    I file della lingua selezionata verranno esportati con i nomi della lingua 
                    di sostituzione. Questo permette di sostituire una lingua esistente nel gioco.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-200">
                <p className="font-medium mb-1">Istruzioni:</p>
                <p>
                  Lo zip generato conterrà tutti i file di localizzazione delle lingue selezionate 
                  e includerà una guida per l'installazione nel gioco.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            disabled={isExporting}
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedLanguages.length === 0 || (patchMode && !replacementLanguage) || isExporting}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Esportando...' : 'Esporta'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
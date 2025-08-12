import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, CopyCheck, Globe } from 'lucide-react';
import { useTranslation } from '@/locales';

// Funzione helper per ottenere le lingue con traduzioni
const getLanguages = (t: any) => [
  { code: 'EN', label: t('visualFlowEditor.multilingual.languages.en'), required: true },
  { code: 'CS', label: t('visualFlowEditor.multilingual.languages.cs'), required: false },
  { code: 'DE', label: t('visualFlowEditor.multilingual.languages.de'), required: false },
  { code: 'ES', label: t('visualFlowEditor.multilingual.languages.es'), required: false },
  { code: 'FR', label: t('visualFlowEditor.multilingual.languages.fr'), required: false },
  { code: 'PL', label: t('visualFlowEditor.multilingual.languages.pl'), required: false },
  { code: 'RU', label: t('visualFlowEditor.multilingual.languages.ru'), required: false }
];

interface MultilingualTextEditorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export const MultilingualTextEditor: React.FC<MultilingualTextEditorProps> = ({
  value = {},
  onChange,
  placeholder,
  className = '',
  label
}) => {
  const { t } = useTranslation();
  const LANGUAGES = getLanguages(t);
  const finalPlaceholder = placeholder || t('visualFlowEditor.multilingual.defaultPlaceholder');
  const finalLabel = label || t('visualFlowEditor.multilingual.defaultLabel');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedLang, setCopiedLang] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Inizializza i valori per tutte le lingue
  const normalizedValue = React.useMemo(() => {
    const normalized: Record<string, string> = {};
    LANGUAGES.forEach(lang => {
      normalized[lang.code] = value[lang.code] || '';
    });
    return normalized;
  }, [value]);

  // Gestisce il cambio di valore per una lingua specifica
  const handleChange = (langCode: string, text: string) => {
    onChange({
      ...normalizedValue,
      [langCode]: text
    });
  };

  // Copia il testo inglese in una lingua specifica
  const copyToLanguage = (targetLang: string) => {
    if (normalizedValue.EN) {
      handleChange(targetLang, normalizedValue.EN);
      setCopiedLang(targetLang);
      setTimeout(() => setCopiedLang(null), 1500);
    }
  };

  // Copia il testo inglese in tutte le altre lingue
  const copyToAllLanguages = () => {
    if (normalizedValue.EN) {
      const updated = { ...normalizedValue };
      LANGUAGES.forEach(lang => {
        if (lang.code !== 'EN') {
          updated[lang.code] = normalizedValue.EN;
        }
      });
      onChange(updated);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    }
  };

  return (
    <div className={`bg-slate-800/50 rounded-lg border border-slate-700 ${className}`}>
      <div className="p-2">
        {!isExpanded ? (
          // Visualizzazione compatta - solo EN in una riga
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-gray-400 w-6">EN</span>
            <textarea
              value={normalizedValue.EN}
              onChange={(e) => handleChange('EN', e.target.value)}
              placeholder={finalPlaceholder}
              className="flex-1 bg-slate-700/50 text-white px-2 py-1 rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none resize-y"
              rows={1}
              style={{ minHeight: '24px', lineHeight: '1.5' }}
            />
            {/* Pulsante expand separato, non sovrapposto */}
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
              title={t('visualFlowEditor.multilingual.expandLanguages')}
            >
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        ) : (
          // Visualizzazione espansa - una riga per ogni lingua
          <div className="space-y-1">
            {/* Prima riga EN con icona */}
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-blue-400 w-6">EN</span>
              <div className="flex-1 relative">
                <textarea
                  value={normalizedValue.EN}
                  onChange={(e) => handleChange('EN', e.target.value)}
                  placeholder={finalPlaceholder}
                  className="w-full bg-slate-700/50 text-white px-2 py-1 pr-7 rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none resize-y"
                  rows={1}
                  style={{ minHeight: '24px', lineHeight: '1.5' }}
                />
                {/* Pulsante copia tutto piccolo e compatto dentro la textarea */}
                {normalizedValue.EN && (
                  <button
                    type="button"
                    onClick={copyToAllLanguages}
                    className="absolute top-1 right-1 p-0.5 hover:bg-slate-600 rounded transition-colors"
                    title={t('visualFlowEditor.multilingual.copyToAll')}
                  >
                    {copiedAll ? (
                      <CopyCheck className="w-2.5 h-2.5 text-green-400" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 text-gray-400" />
                    )}
                  </button>
                )}
              </div>
            </div>
            
            {/* Altre lingue senza icona, allineate */}
            {LANGUAGES.slice(1).map((lang) => (
              <div key={lang.code} className="flex items-center gap-2 pl-6">
                <span className="text-xs font-medium text-gray-400 w-6">
                  {lang.code}
                </span>
                <div className="flex-1 relative">
                  <textarea
                    value={normalizedValue[lang.code]}
                    onChange={(e) => handleChange(lang.code, e.target.value)}
                    placeholder={`${placeholder} (${lang.label})`}
                    className="w-full bg-slate-700/50 text-white px-2 py-1 pr-7 rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none resize-y"
                    rows={1}
                    style={{ minHeight: '24px', lineHeight: '1.5' }}
                  />
                  {/* Pulsante copia singola piccolo e compatto dentro la textarea */}
                  {normalizedValue.EN && (
                    <button
                      type="button"
                      onClick={() => copyToLanguage(lang.code)}
                      className="absolute top-1 right-1 p-0.5 hover:bg-slate-600 rounded transition-colors"
                      title={t('visualFlowEditor.multilingual.copyFromEN')}
                    >
                      {copiedLang === lang.code ? (
                        <CopyCheck className="w-2.5 h-2.5 text-green-400" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Pulsante collapse in fondo a destra */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
                title={t('visualFlowEditor.multilingual.collapse')}
              >
                <ChevronUp className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
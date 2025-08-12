import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Copy, CopyCheck, Globe } from 'lucide-react';
import { useTranslation } from '@/locales';
import { MetacodeButtonBar, METACODE_PATTERNS } from '../MetacodeEditor/MetacodeButtons';
import { GenderModal } from '../MetacodeEditor/modals/GenderModal';
import { VerbModal } from '../MetacodeEditor/modals/VerbModal';
import { ImagePickerModal } from '../MetacodeEditor/modals/ImagePickerModal';
import { PluralModal } from '../MetacodeEditor/modals/PluralModal';
import { StringModal } from '../MetacodeEditor/modals/StringModal';
import { PlayerModal } from '../MetacodeEditor/modals/PlayerModal';
import { NumberModal } from '../MetacodeEditor/modals/NumberModal';
import { MissionResultModal } from '../MetacodeEditor/modals/MissionResultModal';
import { MetacodeTextEditor } from '../MetacodeEditor/MetacodeTextEditor';
import { 
  insertMetacodeAtCursor,
  generateSimpleCode,
  parseMetacode,
  replaceMetacode 
} from '../MetacodeEditor/utils/metacodeParser';
import { MetacodePattern, ParsedMetacode } from '../MetacodeEditor/types';

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
  
  // Stati per metacodice
  const [activeLanguage, setActiveLanguage] = useState<string>('EN');
  const [modalType, setModalType] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | undefined>(undefined);
  const [editingMetacode, setEditingMetacode] = useState<ParsedMetacode | null>(null);
  const [cursorPosition, setCursorPosition] = useState<Record<string, number>>({});

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

  // Gestione posizione cursore per lingua
  const handleCursorPositionChange = (language: string, position: number) => {
    setCursorPosition(prev => ({
      ...prev,
      [language]: position
    }));
  };

  // Gestione click su pattern metacodice
  const handlePatternClick = (pattern: MetacodePattern) => {
    if (!pattern.hasModal) {
      // Inserisci direttamente pattern semplici alla posizione del cursore
      const code = generateSimpleCode(pattern.type);
      const currentText = normalizedValue[activeLanguage] || '';
      const currentCursor = cursorPosition[activeLanguage] || currentText.length;
      
      const result = insertMetacodeAtCursor(currentText, currentCursor, code);
      handleChange(activeLanguage, result.newText);
      
      // Aggiorna posizione cursore
      setCursorPosition(prev => ({
        ...prev,
        [activeLanguage]: result.newCursorPosition
      }));
    } else {
      // Apri modal per pattern complessi
      setModalType(pattern.type);
      setSelectedPattern(pattern.id);
    }
  };


  // Gestione click su metacodici esistenti
  const handleMetacodeClick = (metacode: ParsedMetacode, language: string) => {
    setActiveLanguage(language);
    setEditingMetacode(metacode);
    setModalType(metacode.type);
    setSelectedPattern(metacode.type);
  };

  // Gestione inserimento da modal
  const handleModalInsert = (code: string) => {
    if (editingMetacode) {
      // Sostituisci metacodice esistente
      const currentText = normalizedValue[activeLanguage] || '';
      const newText = replaceMetacode(currentText, editingMetacode, code);
      handleChange(activeLanguage, newText);
      setEditingMetacode(null);
    } else {
      // Inserisci nuovo metacodice alla posizione del cursore
      const currentText = normalizedValue[activeLanguage] || '';
      const currentCursor = cursorPosition[activeLanguage] || currentText.length;
      
      const result = insertMetacodeAtCursor(currentText, currentCursor, code);
      handleChange(activeLanguage, result.newText);
      
      // Aggiorna posizione cursore
      setCursorPosition(prev => ({
        ...prev,
        [activeLanguage]: result.newCursorPosition
      }));
    }
    setModalType(null);
    setSelectedPattern(undefined);
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
            <MetacodeTextEditor
              value={normalizedValue.EN}
              onChange={(text) => handleChange('EN', text)}
              onMetacodeClick={(metacode) => handleMetacodeClick(metacode, 'EN')}
              onCursorPositionChange={(pos) => handleCursorPositionChange('EN', pos)}
              placeholder={finalPlaceholder}
              className="flex-1"
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
          <div className="space-y-2">
            {/* Barra pulsanti metacodice - sempre visibile quando espanso */}
            <MetacodeButtonBar
              onPatternClick={handlePatternClick}
              activePattern={selectedPattern}
              visiblePatterns={[
                // Solo i 6 pattern più usati
                'gender',      // Genere M/F/N
                'plural',      // Singolare/Plurale  
                'image',       // Immagini
                'verb',        // Tap/Click
                'playerName',  // Nome giocatore
                'missionResult' // Risultato missione
              ]}
            />
            
            <div className="space-y-1">
            {/* Prima riga EN con icona */}
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-blue-400 w-6">EN</span>
              <div className="flex-1 relative" onClick={() => setActiveLanguage('EN')}>
                <MetacodeTextEditor
                  value={normalizedValue.EN}
                  onChange={(text) => handleChange('EN', text)}
                  onMetacodeClick={(metacode) => handleMetacodeClick(metacode, 'EN')}
                  onCursorPositionChange={(pos) => handleCursorPositionChange('EN', pos)}
                  placeholder={finalPlaceholder}
                  className="w-full pr-7"
                />
                
                {/* Pulsante copia tutto piccolo e compatto dentro la textarea */}
                {normalizedValue.EN && (
                  <button
                    type="button"
                    onClick={copyToAllLanguages}
                    className="absolute top-1 right-1 p-0.5 hover:bg-slate-600 rounded transition-colors z-10"
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
                <div className="flex-1 relative" onClick={() => setActiveLanguage(lang.code)}>
                  <MetacodeTextEditor
                    value={normalizedValue[lang.code]}
                    onChange={(text) => handleChange(lang.code, text)}
                    onMetacodeClick={(metacode) => handleMetacodeClick(metacode, lang.code)}
                    onCursorPositionChange={(pos) => handleCursorPositionChange(lang.code, pos)}
                    placeholder={`${placeholder} (${lang.label})`}
                    className="w-full pr-7"
                  />
                  
                  {/* Pulsante copia singola piccolo e compatto dentro la textarea */}
                  {normalizedValue.EN && (
                    <button
                      type="button"
                      onClick={() => copyToLanguage(lang.code)}
                      className="absolute top-1 right-1 p-0.5 hover:bg-slate-600 rounded transition-colors z-10"
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
          </div>
        )}
      </div>
      
      {/* Modali metacodice */}
      {modalType === 'gender' && (
        <GenderModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setSelectedPattern(undefined);
            setEditingMetacode(null);
          }}
          onInsert={handleModalInsert}
          language={activeLanguage}
          currentText={normalizedValue[activeLanguage]}
          cursorPosition={normalizedValue[activeLanguage]?.length || 0}
        />
      )}
      
      {modalType === 'verb' && (
        <VerbModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setSelectedPattern(undefined);
            setEditingMetacode(null);
          }}
          onInsert={handleModalInsert}
          language={activeLanguage}
          existingData={editingMetacode?.data}
        />
      )}
      
      {modalType === 'image' && (
        <ImagePickerModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setSelectedPattern(undefined);
            setEditingMetacode(null);
          }}
          onInsert={handleModalInsert}
          availableImages={[]}
          existingData={editingMetacode?.data}
        />
      )}
      
      {modalType === 'plural' && (
        <PluralModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setSelectedPattern(undefined);
            setEditingMetacode(null);
          }}
          onInsert={handleModalInsert}
          language={activeLanguage}
          existingData={editingMetacode?.data}
        />
      )}
      
      {modalType === 'string' && (
        <StringModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setSelectedPattern(undefined);
            setEditingMetacode(null);
          }}
          onInsert={handleModalInsert}
          existingData={editingMetacode?.data}
        />
      )}
      
      {modalType === 'player' && (
        <PlayerModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setSelectedPattern(undefined);
            setEditingMetacode(null);
          }}
          onInsert={handleModalInsert}
          existingData={editingMetacode?.data}
        />
      )}
      
      {modalType === 'number' && (
        <NumberModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setSelectedPattern(undefined);
            setEditingMetacode(null);
          }}
          onInsert={handleModalInsert}
          existingData={editingMetacode?.data}
        />
      )}
      
      {modalType === 'missionResult' && (
        <MissionResultModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setSelectedPattern(undefined);
            setEditingMetacode(null);
          }}
          onInsert={handleModalInsert}
          existingData={editingMetacode?.data}
        />
      )}
    </div>
  );
};
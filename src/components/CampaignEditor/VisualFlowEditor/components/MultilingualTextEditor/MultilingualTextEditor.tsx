import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Copy, CopyCheck, Globe, User, Users } from 'lucide-react';
import { useTranslation } from '@/locales';
import { useLanguage } from '@/contexts/LanguageContext';
import { ParsedMetacode, getMetacodeContext } from './metacodeParser';
import { MetacodeTextarea } from './MetacodeTextarea';
import { MetacodeInsertButtons } from './MetacodeInsertButtons';
import { GenderMetacodeModal } from './modals/GenderMetacodeModal';
import { NumberMetacodeModal } from './modals/NumberMetacodeModal';
import { ImageMetacodeModal } from './modals/ImageMetacodeModal';

// Funzione helper per ottenere le lingue con traduzioni
const getLanguages = (t: any) => [
  { code: 'EN', label: t('visualFlowEditor.multilingual.languages.en'), required: true },
  { code: 'IT', label: t('visualFlowEditor.multilingual.languages.it'), required: false },
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
  const { currentLanguage } = useLanguage();
  const LANGUAGES = getLanguages(t);
  const finalPlaceholder = placeholder || t('visualFlowEditor.multilingual.defaultPlaceholder');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedLang, setCopiedLang] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  
  // Stati per gli interruttori
  const [genderState, setGenderState] = useState<'male' | 'female' | 'disabled'>('disabled');
  const [numberState, setNumberState] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 20 | 30 | 40 | 50 | 100 | 'more' | 'disabled'>('disabled');
  
  // Stati per gestione metacodici
  const [selectedMetacode, setSelectedMetacode] = useState<ParsedMetacode | null>(null);
  const [activeModalType, setActiveModalType] = useState<string | null>(null);
  const [editingLanguage, setEditingLanguage] = useState<string>('EN');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [pendingFocusLoss, setPendingFocusLoss] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const [triggerPosition, setTriggerPosition] = useState<DOMRect | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inizializza i valori per tutte le lingue
  const normalizedValue = React.useMemo(() => {
    const normalized: Record<string, string> = {};
    LANGUAGES.forEach(lang => {
      normalized[lang.code] = value[lang.code] || '';
    });
    return normalized;
  }, [value]);
  
  // Determina quale lingua mostrare quando collassato
  const getCollapsedLanguage = () => {
    // currentLanguage è già nel formato corretto (EN, IT, CS, ecc.)
    const interfaceLang = currentLanguage;
    
    // Se il testo nella lingua dell'interfaccia è presente, usa quella
    if (normalizedValue[interfaceLang] && normalizedValue[interfaceLang].trim()) {
      return interfaceLang;
    }
    
    // Altrimenti usa EN
    return 'EN';
  };
  
  const collapsedLanguage = getCollapsedLanguage();

  // Gestisce il cambio di valore per una lingua specifica
  const handleChange = (langCode: string, text: string) => {
    onChange({
      ...normalizedValue,
      [langCode]: text
    });
  };


  // Gestisce il click su un metacodice
  const handleMetacodeClick = (metacode: ParsedMetacode, langCode?: string, mousePos?: { x: number; y: number }) => {
    setMousePosition(mousePos || null);
    setSelectedMetacode(metacode);
    setActiveModalType(metacode.type);
    if (langCode) setEditingLanguage(langCode);
  };

  // Gestisce il salvataggio di un metacodice modificato o nuovo
  const handleMetacodeSave = (newMetacode: string) => {
    const currentText = normalizedValue[editingLanguage];
    
    if (selectedMetacode) {
      // Modifica di un metacodice esistente
      // Usa extendedStart se disponibile per sostituire l'intero metacodice esteso
      const startPos = selectedMetacode.extendedStart !== undefined 
        ? selectedMetacode.extendedStart 
        : selectedMetacode.start;
      const endPos = selectedMetacode.end;
      
      const before = currentText.substring(0, startPos);
      const after = currentText.substring(endPos);
      const newText = before + newMetacode + after;
      handleChange(editingLanguage, newText);
    } else {
      // Inserimento di un nuovo metacodice alla posizione del cursore
      const before = currentText.substring(0, cursorPosition);
      const after = currentText.substring(cursorPosition);
      const newText = before + newMetacode + after;
      handleChange(editingLanguage, newText);
      setCursorPosition(cursorPosition + newMetacode.length);
    }
    
    setSelectedMetacode(null);
    setActiveModalType(null);
  };

  // Gestisce l'inserimento di un nuovo metacodice
  const handleMetacodeInsert = (metacode: string) => {
    if (!focusedField) return;
    
    const currentText = normalizedValue[focusedField];
    const before = currentText.substring(0, cursorPosition);
    const after = currentText.substring(cursorPosition);
    const newText = before + metacode + after;
    
    handleChange(focusedField, newText);
    // Aggiorna la posizione del cursore dopo l'inserimento
    setCursorPosition(cursorPosition + metacode.length);
  };

  // Gestisce il focus su un campo
  const handleFieldFocus = (langCode: string, position: number = 0) => {
    // Cancella eventuali timeout pendenti
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }
    setPendingFocusLoss(false);
    setFocusedField(langCode);
    setCursorPosition(position);
  };

  // Gestisce la perdita del focus
  const handleFieldBlur = () => {
    setPendingFocusLoss(true);
    // Usa un ref per gestire il timeout in modo affidabile
    focusTimeoutRef.current = setTimeout(() => {
      if (pendingFocusLoss) {
        setFocusedField(null);
        setPendingFocusLoss(false);
      }
    }, 200);
  };

  // Cleanup al unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  // Ottiene il contesto del metacodice (parola prima del metacodice)
  const getTextContext = (): string => {
    if (!selectedMetacode) return '';
    const text = normalizedValue[editingLanguage];
    return getMetacodeContext(text, selectedMetacode);
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
      {/* Barra degli interruttori di stato */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-slate-700">
        <div className="flex items-center gap-3">
        {/* Interruttore Genere */}
        <div className="flex items-center gap-1">
          <User className="w-3 h-3 text-gray-400" />
          <div className="flex rounded overflow-hidden">
            <button
              type="button"
              onClick={() => setGenderState('male')}
              className={`px-2 py-0.5 text-xs transition-colors ${
                genderState === 'male' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
              }`}
              title="Maschile"
            >
              M
            </button>
            <button
              type="button"
              onClick={() => setGenderState('female')}
              className={`px-2 py-0.5 text-xs transition-colors ${
                genderState === 'female' 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
              }`}
              title="Femminile"
            >
              F
            </button>
            <button
              type="button"
              onClick={() => setGenderState('disabled')}
              className={`px-2 py-0.5 text-xs transition-colors ${
                genderState === 'disabled' 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
              }`}
              title="Disabilitato"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Interruttore Numero */}
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-gray-400" />
          <div className="flex flex-wrap gap-0.5 max-w-[400px]">
            <div className="flex rounded overflow-hidden">
              {/* Numeri 0-10 */}
              {([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNumberState(num)}
                  className={`px-1 py-0.5 text-[10px] transition-colors ${
                    numberState === num 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                  }`}
                  title={`${num}`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex rounded overflow-hidden">
              {/* Decine e centinaia */}
              {([20, 30, 40, 50, 100] as const).map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNumberState(num)}
                  className={`px-1.5 py-0.5 text-[10px] transition-colors ${
                    numberState === num 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                  }`}
                  title={`${num}`}
                >
                  {num}
                </button>
              ))}
              {/* More */}
              <button
                type="button"
                onClick={() => setNumberState('more')}
                className={`px-1.5 py-0.5 text-[10px] transition-colors ${
                  numberState === 'more'
                    ? 'bg-red-500 text-white' 
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
                title="Più di 100"
              >
                100+
              </button>
              {/* Disabled */}
              <button
                type="button"
                onClick={() => setNumberState('disabled')}
                className={`px-1.5 py-0.5 text-[10px] transition-colors ${
                  numberState === 'disabled' 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
                title="Mostra metacode"
              >
                ×
              </button>
            </div>
          </div>
        </div>
        </div>
        
        {/* Pulsanti inserimento metacodici */}
        <MetacodeInsertButtons
          onInsert={handleMetacodeInsert}
          onOpenModal={(type, mousePos) => {
            // Apre la modale appropriata per inserimento personalizzato
            setMousePosition(mousePos || null);
            setActiveModalType(type);
            setSelectedMetacode(null); // Reset per nuovo inserimento
            if (focusedField) {
              setEditingLanguage(focusedField);
            }
          }}
          focusedField={focusedField}
          currentLang={focusedField || currentLanguage}
        />
      </div>
      
      <div className="p-2">
        {!isExpanded ? (
          // Visualizzazione compatta - mostra lingua selezionata
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-gray-400 w-6">{collapsedLanguage}</span>
            <MetacodeTextarea
              value={normalizedValue[collapsedLanguage]}
              onChange={(text) => handleChange(collapsedLanguage, text)}
              placeholder={finalPlaceholder}
              className="flex-1 bg-slate-700/50 text-white px-2 py-1 rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none resize-y"
              genderState={genderState}
              numberState={numberState}
              onMetacodeClick={(metacode, mousePos) => handleMetacodeClick(metacode, collapsedLanguage, mousePos)}
              onFocus={(position) => handleFieldFocus(collapsedLanguage, position)}
              onBlur={handleFieldBlur}
              onCursorChange={setCursorPosition}
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
                <MetacodeTextarea
                  value={normalizedValue.EN}
                  onChange={(text) => handleChange('EN', text)}
                  placeholder={finalPlaceholder}
                  className="w-full bg-slate-700/50 text-white px-2 py-1 pr-7 rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none resize-y"
                  genderState={genderState}
                  numberState={numberState}
                  onMetacodeClick={(metacode, mousePos) => handleMetacodeClick(metacode, 'EN', mousePos)}
                  onFocus={(position) => handleFieldFocus('EN', position)}
                  onBlur={handleFieldBlur}
                  onCursorChange={setCursorPosition}
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
                  <MetacodeTextarea
                    value={normalizedValue[lang.code]}
                    onChange={(text) => handleChange(lang.code, text)}
                    placeholder={`${placeholder} (${lang.label})`}
                    className="w-full bg-slate-700/50 text-white px-2 py-1 pr-7 rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none resize-y"
                    genderState={genderState}
                    numberState={numberState}
                    onMetacodeClick={(metacode, mousePos) => handleMetacodeClick(metacode, lang.code, mousePos)}
                    onFocus={(position) => handleFieldFocus(lang.code, position)}
                    onBlur={handleFieldBlur}
                    onCursorChange={setCursorPosition}
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
      
      {/* Modali per modifica metacodici */}
      <GenderMetacodeModal
        isOpen={activeModalType === 'gender'}
        onClose={() => {
          setActiveModalType(null);
          setSelectedMetacode(null);
          setTriggerElement(null);
          setTriggerPosition(null);
          setMousePosition(null);
        }}
        metacode={selectedMetacode}
        onSave={handleMetacodeSave}
        textContext={getTextContext()}
        mousePosition={mousePosition}
      />
      
      <NumberMetacodeModal
        isOpen={activeModalType === 'number'}
        onClose={() => {
          setActiveModalType(null);
          setSelectedMetacode(null);
          setTriggerElement(null);
          setTriggerPosition(null);
          setMousePosition(null);
        }}
        metacode={selectedMetacode}
        onSave={handleMetacodeSave}
        textContext={getTextContext()}
        mousePosition={mousePosition}
      />
      
      <ImageMetacodeModal
        isOpen={activeModalType === 'image'}
        onClose={() => {
          setActiveModalType(null);
          setSelectedMetacode(null);
          setTriggerElement(null);
          setTriggerPosition(null);
          setMousePosition(null);
        }}
        metacode={selectedMetacode}
        onSave={handleMetacodeSave}
        mousePosition={mousePosition}
      />
      
    </div>
  );
};
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Copy, CopyCheck, Globe, Users, Wand2 } from 'lucide-react';
import { useTranslation } from '@/locales';
import { useLanguage } from '@/contexts/LanguageContext';
import { TIMEOUT_CONSTANTS } from '@/constants/VisualFlowEditor.constants';
import { ParsedMetacode, getMetacodeContext } from '@/components/CampaignEditor/VisualFlowEditor/components/MultilingualTextEditor/metacodeParser';
import { MetacodeTextarea } from '@/components/CampaignEditor/VisualFlowEditor/components/MultilingualTextEditor/MetacodeTextarea';
import { MetacodeInsertButtons } from '@/components/CampaignEditor/VisualFlowEditor/components/MultilingualTextEditor/MetacodeInsertButtons';
import { GenderMetacodeModal } from '@/components/CampaignEditor/VisualFlowEditor/components/MultilingualTextEditor/modals/GenderMetacodeModal';
import { NumberMetacodeModal } from '@/components/CampaignEditor/VisualFlowEditor/components/MultilingualTextEditor/modals/NumberMetacodeModal';
import { ImageMetacodeModal } from '@/components/CampaignEditor/VisualFlowEditor/components/MultilingualTextEditor/modals/ImageMetacodeModal';
import { API_CONFIG, API_ENDPOINTS } from '@/config';

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

interface TranslationEditorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  placeholder?: string;
  className?: string;
  availableLanguages?: string[];
  editableLanguages: string[];
  compactMode?: boolean;
  scriptId?: string; // Per rilevare il cambio di script e forzare refresh metacodes
}

export const TranslationEditor: React.FC<TranslationEditorProps> = ({
  value = {},
  onChange,
  placeholder,
  className = '',
  availableLanguages,
  editableLanguages,
  compactMode = true,
  scriptId
}) => {
  const { t } = useTranslation();
  const allLanguages = getLanguages(t);
  
  // Determina quali lingue sono disponibili con ordine corretto: TARGET, EN, altre
  const LANGUAGES = React.useMemo(() => {
    if (availableLanguages && availableLanguages.length > 0) {
      const orderedLanguages = [];
      
      // Prima la lingua TARGET (editabile)
      if (editableLanguages.length > 0) {
        const targetLang = allLanguages.find(lang => lang.code === editableLanguages[0]);
        if (targetLang && availableLanguages.includes(targetLang.code)) {
          orderedLanguages.push(targetLang);
        }
      }
      
      // Seconda l'inglese (se diverso da TARGET)
      const enLang = allLanguages.find(lang => lang.code === 'EN');
      if (enLang && availableLanguages.includes('EN') && editableLanguages[0] !== 'EN') {
        orderedLanguages.push(enLang);
      }
      
      // Infine tutte le altre lingue disponibili
      allLanguages.forEach(lang => {
        if (lang.code !== 'EN' && 
            !editableLanguages.includes(lang.code) && 
            availableLanguages.includes(lang.code)) {
          orderedLanguages.push(lang);
        }
      });
      
      return orderedLanguages;
    }
    return allLanguages;
  }, [allLanguages, availableLanguages, editableLanguages]);

  const finalPlaceholder = placeholder || t('visualFlowEditor.multilingual.defaultPlaceholder');
  const [isExpanded, setIsExpanded] = useState(!compactMode);
  const [copiedLang, setCopiedLang] = useState<string | null>(null);
  const [loadingLang, setLoadingLang] = useState<string | null>(null);
  // Non serve più lastScriptId e forceRefresh, passiamo direttamente scriptId
  
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
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inizializza i valori per tutte le lingue
  const normalizedValue = React.useMemo(() => {
    const normalized: Record<string, string> = {};
    LANGUAGES.forEach(lang => {
      normalized[lang.code] = value[lang.code] || '';
    });
    return normalized;
  }, [value, LANGUAGES]);

  // Funzione per determinare se una lingua è editabile
  const isLanguageEditable = (langCode: string): boolean => {
    return editableLanguages.includes(langCode);
  };

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
      const startPos = selectedMetacode.extendedStart !== undefined 
        ? selectedMetacode.extendedStart 
        : selectedMetacode.start;
      const endPos = selectedMetacode.end;
      
      const before = currentText.substring(0, startPos);
      const after = currentText.substring(endPos);
      const newText = before + newMetacode + after;
      handleChange(editingLanguage, newText);
    } else {
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
    setCursorPosition(cursorPosition + metacode.length);
  };

  // Gestisce il focus su un campo
  const handleFieldFocus = (langCode: string, position: number = 0) => {
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
    focusTimeoutRef.current = setTimeout(() => {
      if (pendingFocusLoss) {
        setFocusedField(null);
        setPendingFocusLoss(false);
      }
    }, TIMEOUT_CONSTANTS.FOCUS_DELAY);
  };

  // Cleanup al unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  // Ottiene il contesto del metacodice
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
      setTimeout(() => setCopiedLang(null), TIMEOUT_CONSTANTS.NOTIFICATION_DURATION);
    }
  };

  // Suggerimento AI per una singola lingua specifica
  const suggestForLanguage = async (targetLang: string) => {
    const textEN = normalizedValue.EN || '';
    if (!textEN.trim()) return;
    try {
      setLoadingLang(targetLang);
      const metacodesDetected = textEN.match(/\[[^\]]+\]/g) || [];
      const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_AI_TRANSLATE}` , {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textEN, langTarget: targetLang, metacodesDetected })
      });
      const j = await res.json();
      if (!res.ok || !j?.success) throw new Error(j?.message || 'AI translate failed');
      const suggestion = j.data?.suggestion as string | undefined;
      if (suggestion) handleChange(targetLang, suggestion);
    } catch (e) {
      // Silenzioso: evitiamo modali invasive qui
    } finally {
      setLoadingLang(null);
    }
  };

  return (
    <div className={`bg-slate-800/50 rounded-lg border border-slate-700 ${className}`}>
      {/* Barra degli interruttori di stato */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-slate-700">
        <div className="flex items-center gap-3">
          {/* Interruttore Genere */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setGenderState('male')}
              className={`px-2 py-0.5 text-xs transition-colors ${
                genderState === 'male' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
              }`}
              title={t('visualFlowEditor.metacode.male')}
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
              title={t('visualFlowEditor.metacode.female')}
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
              title={t('visualFlowEditor.metacode.disabled')}
            >
              ×
            </button>
          </div>

          {/* Interruttore Numero */}
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-gray-400" />
            <div className="flex flex-wrap gap-0.5 max-w-[400px]">
              <div className="flex rounded overflow-hidden">
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
                <button
                  type="button"
                  onClick={() => setNumberState('more')}
                  className={`px-1.5 py-0.5 text-[10px] transition-colors ${
                    numberState === 'more'
                      ? 'bg-red-500 text-white' 
                      : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                  }`}
                  title={t('visualFlowEditor.metacode.moreThan100')}
                >
                  100+
                </button>
                <button
                  type="button"
                  onClick={() => setNumberState('disabled')}
                  className={`px-1.5 py-0.5 text-[10px] transition-colors ${
                    numberState === 'disabled' 
                      ? 'bg-gray-600 text-white' 
                      : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                  }`}
                  title={t('visualFlowEditor.metacode.showMetacode')}
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          {/* Pulsanti inserimento metacodici */}
          <MetacodeInsertButtons
            onInsert={handleMetacodeInsert}
            onOpenModal={(type, mousePos) => {
              setMousePosition(mousePos || null);
              setActiveModalType(type);
              setSelectedMetacode(null);
              if (focusedField) {
                setEditingLanguage(focusedField);
              }
            }}
            focusedField={focusedField}
            currentLang={editableLanguages.find(lang => lang !== 'EN') || editableLanguages[0] || 'IT'}
            scriptId={scriptId}
          />
        </div>
      </div>
      
      <div className="p-2">
        {!isExpanded ? (
          // Visualizzazione compatta - mostra lingua corrente + EN
          <div className="space-y-1">
            {LANGUAGES.map((lang, index) => {
              // In modalità compatta mostra solo TARGET e EN (primi 2)
              if (!isExpanded && index >= 2) {
                return null;
              }
              
              return (
                <div key={lang.code} className="flex items-center gap-2">
                  {index === 0 && <Globe className="w-4 h-4 text-blue-400" />}
                  {index > 0 && <div className="w-4 h-4" />}
                  <span className={`text-xs font-medium ${lang.code === 'EN' ? 'text-blue-400' : 'text-gray-400'} w-6`}>
                    {lang.code}
                  </span>
                  {isLanguageEditable(lang.code) ? (
                    <div className="flex-1 relative">
                      <MetacodeTextarea
                        value={normalizedValue[lang.code]}
                        onChange={(text) => handleChange(lang.code, text)}
                        placeholder={finalPlaceholder}
                        className="w-full bg-slate-700/50 text-white px-2 py-1 pr-16 rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none resize-y"
                        genderState={genderState}
                        numberState={numberState}
                        onMetacodeClick={(metacode, mousePos) => handleMetacodeClick(metacode, lang.code, mousePos)}
                        onFocus={(position) => handleFieldFocus(lang.code, position)}
                        onBlur={handleFieldBlur}
                        onCursorChange={setCursorPosition}
                      />
                      {/* Pulsanti IA e Copia da EN per lingua editabile */}
                      {lang.code !== 'EN' && normalizedValue.EN && (
                        <div className="absolute top-0.5 right-1 flex gap-0.5">
                          <button
                            type="button"
                            onClick={() => suggestForLanguage(lang.code)}
                            className={`p-0.5 rounded transition-colors ${normalizedValue.EN ? 'hover:bg-slate-600' : 'opacity-40 cursor-not-allowed'}`}
                            title="Suggerisci (AI)"
                            disabled={!normalizedValue.EN || !!loadingLang}
                          >
                            <Wand2 className={`w-2.5 h-2.5 ${loadingLang === lang.code ? 'animate-pulse text-blue-300' : 'text-purple-300'}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToLanguage(lang.code)}
                            className="p-0.5 hover:bg-slate-600 rounded transition-colors"
                            title="Copia da EN"
                          >
                            {copiedLang === lang.code ? (
                              <CopyCheck className="w-2.5 h-2.5 text-green-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Lingue non editabili - solo visualizzazione
                    <div className="flex-1 bg-slate-800/50 text-gray-300 px-2 py-1 rounded text-xs border border-slate-700 min-h-[24px] opacity-75">
                      {normalizedValue[lang.code] || finalPlaceholder}
                    </div>
                  )}
                  {/* Pulsante expand solo sulla prima riga */}
                  {index === 0 && (
                    <button
                      type="button"
                      onClick={() => setIsExpanded(true)}
                      className="p-1 hover:bg-slate-700 rounded transition-colors"
                      title={t('visualFlowEditor.multilingual.expandLanguages')}
                    >
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                  {index > 0 && <div className="w-7" />}
                </div>
              );
            })}
          </div>
        ) : (
          // Visualizzazione espansa - tutte le lingue
          <div className="space-y-1">
            {LANGUAGES.map((lang, index) => (
              <div key={lang.code} className="flex items-center gap-2">
                {index === 0 && <Globe className="w-4 h-4 text-blue-400" />}
                {index > 0 && <div className="w-4 h-4" />}
                <span className={`text-xs font-medium ${lang.code === 'EN' ? 'text-blue-400' : 'text-gray-400'} w-6`}>
                  {lang.code}
                </span>
                <div className="flex-1 relative">
                  {isLanguageEditable(lang.code) ? (
                    <>
                      <MetacodeTextarea
                        value={normalizedValue[lang.code]}
                        onChange={(text) => handleChange(lang.code, text)}
                        placeholder={finalPlaceholder}
                        className="w-full bg-slate-700/50 text-white px-2 py-1 pr-16 rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none resize-y"
                        genderState={genderState}
                        numberState={numberState}
                        onMetacodeClick={(metacode, mousePos) => handleMetacodeClick(metacode, lang.code, mousePos)}
                        onFocus={(position) => handleFieldFocus(lang.code, position)}
                        onBlur={handleFieldBlur}
                        onCursorChange={setCursorPosition}
                      />
                      {/* Pulsanti IA e Copia da EN per lingue editabili non-EN */}
                      {lang.code !== 'EN' && normalizedValue.EN && (
                        <div className="absolute top-1 right-1 flex gap-1">
                          <button
                            type="button"
                            onClick={() => suggestForLanguage(lang.code)}
                            className={`p-0.5 rounded transition-colors ${normalizedValue.EN ? 'hover:bg-slate-600' : 'opacity-40 cursor-not-allowed'}`}
                            title="Suggerisci (AI)"
                            disabled={!normalizedValue.EN || !!loadingLang}
                          >
                            <Wand2 className={`w-2.5 h-2.5 ${loadingLang === lang.code ? 'animate-pulse text-blue-300' : 'text-purple-300'}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToLanguage(lang.code)}
                            className="p-0.5 hover:bg-slate-600 rounded transition-colors"
                            title="Copia da EN"
                          >
                            {copiedLang === lang.code ? (
                              <CopyCheck className="w-2.5 h-2.5 text-green-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    // Lingue non editabili - solo visualizzazione
                    <div className="w-full bg-slate-800/50 text-gray-300 px-2 py-1 rounded text-xs border border-slate-700 min-h-[24px] opacity-75">
                      {normalizedValue[lang.code] || finalPlaceholder}
                    </div>
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
          setMousePosition(null);
        }}
        metacode={selectedMetacode}
        onSave={handleMetacodeSave}
        mousePosition={mousePosition}
      />
      
    </div>
  );
};
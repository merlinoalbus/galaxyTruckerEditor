import React, { useState, useRef, useEffect } from 'react';
import { Type, Hash, Image, User, ChevronDown, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/locales';
import { API_CONFIG } from '@/config/constants';

interface MetacodeInsertButtonsProps {
  onInsert: (metacode: string) => void;
  onOpenModal?: (type: 'gender' | 'number' | 'image', mousePos?: { x: number; y: number }) => void;
  disabled?: boolean;
  focusedField?: string | null;
  currentLang?: string; // Lingua corrente del campo focalizzato
  scriptId?: string; // ID dello script per forzare il refresh quando cambia
}

// Cache globale per i metacodes per evitare chiamate multiple
const metacodesCache: Record<string, any> = {};
const loadingLanguages = new Set<string>();

// Hook per ottenere i top 5 metacodici dal BE per lingua specifica con cache per script
const useTop5Metacodes = (language?: string, scriptId?: string) => {
  const [topMetacodes, setTopMetacodes] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { currentLanguage } = useLanguage();
  
  // Usa la lingua passata o quella del contesto
  const activeLang = language || currentLanguage || 'IT';
  // Crea una chiave di cache che include sia lingua che scriptId per forzare refresh per ogni script
  const cacheKey = `${activeLang}_${scriptId || 'no-script'}`;

  useEffect(() => {
    // Non caricare metacodes per EN (non editabile)
    if (activeLang === 'EN') {
      setTopMetacodes({ gender: [], number: [], image: [], name: [] });
      setLoading(false);
      return;
    }

    // Se già in cache per questo script specifico, usa i dati cached
    if (metacodesCache[cacheKey]) {
      setTopMetacodes(metacodesCache[cacheKey]);
      setLoading(false);
      return;
    }

    // Se già in caricamento per questa lingua, non bloccare (permetti a tutti di inizializzarsi)
    if (loadingLanguages.has(activeLang)) {
      setLoading(false); // Non bloccare, sarà aggiornato quando il primo finisce
      setTopMetacodes(metacodesCache[cacheKey] || { gender: [], number: [], image: [], name: [] });
      return;
    }

    const fetchTopMetacodes = async () => {
      loadingLanguages.add(activeLang);
      try {
        // Chiama l'API con la lingua specifica
        const response = await fetch(`${API_CONFIG.API_BASE_URL}/metacodes/top5/${activeLang}`);
        if (response.ok) {
          const result = await response.json();
          metacodesCache[cacheKey] = result.data;
          setTopMetacodes(result.data);
        } else {
          // Nessun fallback - solo dati reali
          const emptyData = { gender: [], number: [], image: [], name: [] };
          metacodesCache[cacheKey] = emptyData;
          setTopMetacodes(emptyData);
        }
      } catch (error) {
        // Se il backend non è raggiungibile, lista vuota
        console.info(`Backend non disponibile - nessun top 5 per lingua ${activeLang}`);
        const emptyData = { gender: [], number: [], image: [], name: [] };
        metacodesCache[cacheKey] = emptyData;
        setTopMetacodes(emptyData);
      } finally {
        loadingLanguages.delete(activeLang);
        setLoading(false);
      }
    };

    fetchTopMetacodes();
  }, [activeLang, cacheKey]); // Ricarica quando cambia la lingua o lo scriptId

  return { topMetacodes, loading };
};

// Nessun dato di default - solo valori reali dal BE

export const MetacodeInsertButtons: React.FC<MetacodeInsertButtonsProps> = ({
  onInsert,
  onOpenModal,
  disabled = false,
  focusedField,
  currentLang,
  scriptId
}) => {
  const { t } = useTranslation();
  const { topMetacodes, loading } = useTop5Metacodes(currentLang, scriptId);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const genderButtonRef = useRef<HTMLButtonElement>(null);
  const numberButtonRef = useRef<HTMLButtonElement>(null);
  const imageButtonRef = useRef<HTMLButtonElement>(null);

  // Chiudi menu quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleButtonClick = (type: string) => {
    if (activeMenu === type) {
      setActiveMenu(null);
    } else {
      setActiveMenu(type);
    }
  };

  const handleMetacodeSelect = (metacode: string) => {
    onInsert(metacode);
    setActiveMenu(null);
  };

  const handleCustomInsert = (type: 'gender' | 'number' | 'image', event: React.MouseEvent) => {
    // CATTURA LA POSIZIONE DEL MOUSE DALL'EVENTO
    const mousePos = { x: event.clientX, y: event.clientY };
    
    // Chiudi il menu
    setActiveMenu(null);
    
    // Apre la modale corrispondente per configurazione personalizzata
    if (onOpenModal) {
      onOpenModal(type, mousePos);
    } else {
      // Fallback: inserisce template vuoto se la modale non è disponibile
      let customCode = '';
      switch (type) {
        case 'gender':
          customCode = '[g(|)]';
          break;
        case 'number':
          customCode = '[n(1:|2:)]';
          break;
        case 'image':
          customCode = '[img()*1]';
          break;
      }
      onInsert(customCode);
    }
  };

  const handleRefreshCache = async () => {
    try {
      // Fa effettivamente la chiamata API per aggiornare la cache
      await refreshMetacodesCache(currentLang || 'IT', scriptId);
    } catch (error) {
      // Silent error handling
    }
  };

  const isDisabled = disabled || !focusedField || loading;

  return (
    <div className="flex items-center gap-2" ref={menuRef}>
      {/* Indicatore campo attivo */}
      {focusedField && (
        <span className="text-[10px] text-green-400 font-medium">
          {focusedField}
        </span>
      )}
      
      {/* Pulsante Genere */}
      <div className="relative">
        <button
          ref={genderButtonRef}
          type="button"
          onClick={() => handleButtonClick('gender')}
          disabled={isDisabled}
          className={`flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded transition-colors ${
            isDisabled 
              ? 'bg-slate-700/50 text-gray-500 cursor-not-allowed' 
              : activeMenu === 'gender'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
          title={isDisabled ? t('visualFlowEditor.metacode.selectTextField') : t('visualFlowEditor.metacode.insertGenderMetacode')}
        >
          <Type className="w-3 h-3" />
          <span className="text-[10px]">G</span>
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
        
        {activeMenu === 'gender' && !isDisabled && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
            <div className="p-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCustomInsert('gender', e);
                }}
                className="w-full px-2 py-1 text-xs text-blue-400 hover:bg-slate-700 rounded transition-colors text-left border-b border-slate-700 mb-1"
              >
                {t('visualFlowEditor.metacode.custom')}
              </button>
              {(topMetacodes?.gender || []).length > 0 ? (
                <>
                  <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase">
                    {t('visualFlowEditor.metacode.genderMetacodes')}
                  </div>
                  {topMetacodes.gender.map((item: any, index: number) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleMetacodeSelect(item.code)}
                      className="w-full flex items-center justify-between px-2 py-1 text-xs text-gray-300 hover:bg-slate-700 rounded transition-colors"
                    >
                      <span className="font-mono">{item.label}</span>
                      <span className="text-[10px] text-gray-500">{item.usage}</span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-2 py-2 text-xs text-gray-500 text-center">
                  {t('visualFlowEditor.metacode.noDataAvailable')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pulsante Numero */}
      <div className="relative">
        <button
          ref={numberButtonRef}
          type="button"
          onClick={() => handleButtonClick('number')}
          disabled={isDisabled}
          className={`flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded transition-colors ${
            isDisabled 
              ? 'bg-slate-700/50 text-gray-500 cursor-not-allowed' 
              : activeMenu === 'number'
                ? 'bg-green-500 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
          title={isDisabled ? t('visualFlowEditor.metacode.selectTextField') : t('visualFlowEditor.metacode.insertGenderMetacode')}
        >
          <Hash className="w-3 h-3" />
          <span className="text-[10px]">N</span>
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
        
        {activeMenu === 'number' && !isDisabled && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
            <div className="p-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCustomInsert('number', e);
                }}
                className="w-full px-2 py-1 text-xs text-green-400 hover:bg-slate-700 rounded transition-colors text-left border-b border-slate-700 mb-1"
              >
                {t('visualFlowEditor.metacode.custom')}
              </button>
              {(topMetacodes?.number || []).length > 0 ? (
                <>
                  <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase">
                    {t('visualFlowEditor.metacode.numberMetacodes')}
                  </div>
                  {topMetacodes.number.map((item: any, index: number) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleMetacodeSelect(item.code)}
                      className="w-full flex items-center justify-between px-2 py-1 text-xs text-gray-300 hover:bg-slate-700 rounded transition-colors"
                    >
                      <span className="font-mono">{item.label}</span>
                      <span className="text-[10px] text-gray-500">{item.usage}</span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-2 py-2 text-xs text-gray-500 text-center">
                  {t('visualFlowEditor.metacode.noDataAvailable')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pulsante Immagine */}
      <div className="relative">
        <button
          ref={imageButtonRef}
          type="button"
          onClick={() => handleButtonClick('image')}
          disabled={isDisabled}
          className={`flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded transition-colors ${
            isDisabled 
              ? 'bg-slate-700/50 text-gray-500 cursor-not-allowed' 
              : activeMenu === 'image'
                ? 'bg-purple-500 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
          title={isDisabled ? t('visualFlowEditor.metacode.selectTextField') : t('visualFlowEditor.metacode.insertImageMetacode')}
        >
          <Image className="w-3 h-3" />
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
        
        {activeMenu === 'image' && !isDisabled && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
            <div className="p-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCustomInsert('image', e);
                }}
                className="w-full px-2 py-1 text-xs text-purple-400 hover:bg-slate-700 rounded transition-colors text-left border-b border-slate-700 mb-1"
              >
                {t('visualFlowEditor.metacode.custom')}
              </button>
              {(topMetacodes?.image || []).length > 0 ? (
                <>
                  <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase">
                    {t('visualFlowEditor.metacode.imageMetacodes')}
                  </div>
                    {topMetacodes.image.map((item: any, index: number) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleMetacodeSelect(item.code)}
                        className="w-full flex items-center justify-between px-2 py-1 text-xs text-gray-300 hover:bg-slate-700 rounded transition-colors"
                      >
                        <span className="flex items-center gap-1">
                          <span>{item.label}</span>
                          <span className="font-mono text-[10px]">{item.code.match(/\[img\(([^)]+)\)/)?.[1]}</span>
                        </span>
                        <span className="text-[10px] text-gray-500">{item.usage}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="px-2 py-2 text-xs text-gray-500 text-center">
                    {t('visualFlowEditor.metacode.noDataAvailable')}
                  </div>
                )}
              </div>
            </div>
        )}
      </div>

      {/* Pulsante Nome - inserimento diretto */}
      <button
        type="button"
        onClick={() => handleMetacodeSelect('[NAME]')}
        disabled={isDisabled}
        className={`flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded transition-colors ${
          isDisabled 
            ? 'bg-slate-700/50 text-gray-500 cursor-not-allowed' 
            : 'bg-slate-700 text-gray-300 hover:bg-orange-500 hover:text-white'
        }`}
        title={isDisabled ? t('visualFlowEditor.metacode.selectTextField') : t('visualFlowEditor.metacode.nameMetacode')}
      >
        <User className="w-3 h-3" />
        <span className="text-[10px]">NAME</span>
      </button>
      
      {/* Pulsante Refresh Cache */}
      <button
        type="button"
        onClick={handleRefreshCache}
        disabled={isDisabled}
        className={`flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded transition-colors ${
          isDisabled 
            ? 'bg-slate-700/50 text-gray-500 cursor-not-allowed' 
            : 'bg-slate-700 text-gray-300 hover:bg-blue-500 hover:text-white'
        }`}
        title={isDisabled ? t('visualFlowEditor.metacode.selectTextField') : 'Aggiorna cache metacode'}
      >
        <RefreshCw className="w-3 h-3" />
      </button>
    </div>
  );
};

/**
 * Funzione per forzare il refresh della cache dei metacodes top5
 * Fa una nuova chiamata API e aggiorna la cache con i dati freschi
 */
export const refreshMetacodesCache = async (language: string = 'IT', scriptId?: string) => {
  const cacheKey = `${language}_${scriptId || 'no-script'}`;
  
  try {
    // Rimuove dalla cache l'entry specifica
    delete metacodesCache[cacheKey];
    
    // Fa la chiamata API per ottenere dati freschi
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/metacodes/top5/${language}`);
    
    if (response.ok) {
      const result = await response.json();
      // Aggiorna la cache con i nuovi dati
      metacodesCache[cacheKey] = result.data;
      return result.data;
    } else {
      const emptyData = { gender: [], number: [], image: [], name: [] };
      metacodesCache[cacheKey] = emptyData;
      return emptyData;
    }
  } catch (error) {
    const emptyData = { gender: [], number: [], image: [], name: [] };
    metacodesCache[cacheKey] = emptyData;
    return emptyData;
  }
};
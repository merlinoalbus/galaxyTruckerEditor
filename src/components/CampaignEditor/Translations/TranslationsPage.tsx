import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { API_CONFIG, API_ENDPOINTS } from '@/config';
import { useTranslation } from '@/locales';
import { IFlowBlock } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';
import { useLocalizationStrings } from '@/hooks/CampaignEditor/useLocalizationStrings';

// Minimal types for coverage API
type PerLanguage = Record<string, { covered: number; missing: number; different: number; totalFields: number; percent: number }>;

type CoverageResponse = {
  success: boolean;
  data: {
    perLanguage: PerLanguage;
    perScript: Array<{
      script: string;
      totalFields: number;
      languages: PerLanguage;
    }>;
  };
};

type ScriptDetailsResponse = {
  success: boolean;
  data: {
    script: string;
    totalFields: number;
    summary: PerLanguage;
    details: Array<{
      path: (number | string)[];
      field: string;
      label: string | null;
      type: string | null;
      en: string;
      values: Record<string, string | undefined>;
    }>;
  }
};

type TranslationField = {
  blockPath: (number | string)[];
  field: string;
  en: string;
  values: Record<string, string | undefined>;
  nearestLabel: string | null;
  type: string | null;
};

export const TranslationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<CoverageResponse['data'] | null>(null);
  const [selectedLang, setSelectedLang] = useState<string>('IT');
  const [onlyMissing, setOnlyMissing] = useState<boolean>(false);
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [scriptDetails, setScriptDetails] = useState<ScriptDetailsResponse['data'] | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [mergedBlocks, setMergedBlocks] = useState<IFlowBlock[] | null>(null);
  const [translationFields, setTranslationFields] = useState<TranslationField[]>([]);
  const [saving, setSaving] = useState(false);
  const [scriptContent, setScriptContent] = useState<any>(null);
  
  // Stati per missions e localization
  const [selectedTab, setSelectedTab] = useState<'scripts' | 'missions' | 'strings'>('scripts');
  const [missionsCoverage, setMissionsCoverage] = useState<any>(null);
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [missionDetails, setMissionDetails] = useState<any>(null);
  const [missionContent, setMissionContent] = useState<any>(null);

  // Hook per localization strings
  const {
    categories,
    selectedCategory,
    isLoading: isLoadingStrings,
    isLoadingCategory,
    isSaving: isSavingStrings,
    isTranslating,
    error: stringsError,
    searchTerm: stringsSearchTerm,
    selectedLanguage: stringsSelectedLanguage,
    filteredStrings,
    categoryStats,
    setSearchTerm: setStringsSearchTerm,
    setSelectedLanguage: setStringsSelectedLanguage,
    setError: setStringsError,
    loadCategory,
    saveCategory,
    translateString,
    translateCategory,
    updateString,
    setSelectedCategory,
    SUPPORTED_LANGUAGES
  } = useLocalizationStrings();

  // Carica la coverage degli scripts solo quando necessario
  const loadScriptsCoverage = useCallback(async () => {
    try {
      setLoading(true);
      
      // Carica coverage degli scripts
      const scriptsRes = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_TRANSLATIONS_COVERAGE}`);
      const scriptsJson: CoverageResponse = await scriptsRes.json();
      if (!scriptsJson.success) throw new Error('scripts coverage failed');
      setCoverage(scriptsJson.data);
      
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica coverage solo per il tab selezionato
  useEffect(() => {
    if (selectedTab === 'scripts' && !coverage) {
      loadScriptsCoverage();
    } else if (selectedTab === 'strings' || selectedTab === 'missions') {
      // Per strings e missions, imposta loading a false immediatamente
      setLoading(false);
    }
  }, [selectedTab, coverage, loadScriptsCoverage]);

  // Funzione per estrarre i campi multilingua dai blocchi
  const extractTranslationFields = useCallback((blocks: IFlowBlock[], languages: string[]): TranslationField[] => {
    const fields: TranslationField[] = [];
    const norm = (s: string | undefined): string => (typeof s === 'string' ? s.trim() : '');
    
    function visit(list: IFlowBlock[], pathStack: (string | number)[], context?: { lastLabel?: string | null }) {
      if (!Array.isArray(list)) return;
      let lastLabel = context?.lastLabel || null;
      
      for (let i = 0; i < list.length; i++) {
        const b = list[i] || {};
        const currentPath = [...pathStack, i];
        
        // Traccia il label più vicino per navigazione
        if (b.type === 'LABEL' && b.parameters?.name) {
          lastLabel = String(b.parameters.name);
        }
        
        // Campo text (usato da OPT)
        if (b.text && typeof b.text === 'object' && !Array.isArray(b.text)) {
          const enVal = norm(b.text.EN || Object.values(b.text)[0] || '');
          if (enVal) {
            fields.push({
              blockPath: currentPath,
              field: 'text',
              en: enVal,
              values: { ...b.text },
              nearestLabel: lastLabel,
              type: b.type || null
            });
          }
        }
        
        // Parametri con oggetti multilingua
        if (b.parameters && typeof b.parameters === 'object') {
          for (const [pName, pVal] of Object.entries(b.parameters)) {
            if (pVal && typeof pVal === 'object' && !Array.isArray(pVal)) {
              const enVal = norm((pVal as any).EN || Object.values(pVal as any)[0] || '');
              if (enVal) {
                fields.push({
                  blockPath: currentPath,
                  field: `parameters.${pName}`,
                  en: enVal,
                  values: { ...(pVal as any) },
                  nearestLabel: lastLabel,
                  type: b.type || null
                });
              }
            }
          }
        }
        
        // Ricorsione sui contenitori
        if (b.children) visit(b.children, [...currentPath, 'children'], { lastLabel });
        if (b.thenBlocks) visit(b.thenBlocks, [...currentPath, 'thenBlocks'], { lastLabel });
        if (b.elseBlocks) visit(b.elseBlocks, [...currentPath, 'elseBlocks'], { lastLabel });
        
        // Ricorsione sui blocchi specifici delle missions
        if (b.blockInit) visit(b.blockInit, [...currentPath, 'blockInit'], { lastLabel });
        if (b.blockStart) visit(b.blockStart, [...currentPath, 'blockStart'], { lastLabel });
        if (b.blockEvaluate) visit(b.blockEvaluate, [...currentPath, 'blockEvaluate'], { lastLabel });
      }
    }
    
    visit(blocks, [], { lastLabel: null });
    return fields;
  }, []);

  // Calcolo delle statistiche di copertura
  const calculateCoverageStats = useCallback((fields: TranslationField[], targetLang: string) => {
    let covered = 0;
    let missing = 0;
    
    for (const field of fields) {
      const targetVal = (typeof field.values[targetLang] === 'string' ? field.values[targetLang]!.trim() : '') || '';
      const enVal = field.en.trim();
      
      if (!targetVal || targetVal === enVal) {
        missing++;
      } else {
        covered++;
      }
    }
    
    const total = fields.length;
    const percent = total > 0 ? Math.round((covered / total) * 100) : 100;
    
    return { covered, missing, total, percent };
  }, []);

  // Funzione per caricare la coverage delle missions
  const loadMissionsCoverage = useCallback(async () => {
    try {
      // Usa il nuovo endpoint backend per missions coverage
      const missionsRes = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.MISSIONS_TRANSLATIONS_COVERAGE}`);
      const missionsJson = await missionsRes.json();
      if (!missionsJson.success) throw new Error('missions coverage failed');
      
      setMissionsCoverage(missionsJson.data);
      
    } catch (e) {
      console.error('Error loading missions coverage:', e);
    }
  }, []);

  // Carica missions coverage quando il tab cambia
  useEffect(() => {
    if (selectedTab === 'missions' && !missionsCoverage) {
      loadMissionsCoverage();
    }
  }, [selectedTab, missionsCoverage, loadMissionsCoverage]);

  useEffect(() => {
    const loadDetails = async () => {
      if (!selectedScript) {
        setScriptDetails(null);
        setMergedBlocks(null);
        setTranslationFields([]);
        setScriptContent(null);
        setEdits({});
        return;
      }
      
      try {
        // Carica il contenuto completo dello script con i blocchi multilingua
        const resp = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPT_BY_NAME(selectedScript)}?multilingua=true&format=blocks`);
        const json = await resp.json();
        
        if (!json.success || !Array.isArray(json.data?.blocks)) {
          throw new Error('Failed to load script blocks');
        }
        
        const blocks = json.data.blocks;
        const availableLanguages = json.data.availableLanguages || ['EN', 'DE', 'FR', 'ES', 'PL', 'CS', 'RU'];
        
        setMergedBlocks(blocks);
        setScriptContent(json.data);
        
        // Estrai i campi di traduzione dai blocchi
        const fields = extractTranslationFields(blocks, availableLanguages);
        setTranslationFields(fields);
        
        // Calcola le statistiche per creare scriptDetails compatibile
        const summary: PerLanguage = {};
        for (const lang of availableLanguages) {
          if (lang === 'EN') continue;
          const stats = calculateCoverageStats(fields, lang);
          summary[lang] = {
            covered: stats.covered,
            missing: stats.missing,
            different: stats.covered, // Per compatibilità
            totalFields: stats.total,
            percent: stats.percent
          };
        }
        
        // Crea dettagli compatibili con l'API esistente
        const details = fields.map(f => ({
          path: f.blockPath,
          field: f.field,
          label: f.nearestLabel,
          type: f.type,
          en: f.en,
          values: f.values
        }));
        
        setScriptDetails({
          script: selectedScript,
          totalFields: fields.length,
          summary,
          details
        });
        
        // Precarica i valori attuali negli edits
        const initialEdits: Record<string, string> = {};
        fields.forEach((field, idx) => {
          for (const lang of availableLanguages) {
            if (lang === 'EN') continue;
            const key = `${selectedScript}|${idx}|${lang}`;
            const currentValue = (typeof field.values[lang] === 'string' ? field.values[lang]!.trim() : '') || '';
            if (currentValue) {
              initialEdits[key] = currentValue;
            }
          }
        });
        setEdits(initialEdits);
        
      } catch (e: any) {
        console.error('Error loading script details:', e);
        setScriptDetails(null);
        setMergedBlocks(null);
        setTranslationFields([]);
        setScriptContent(null);
      }
    };
    
    loadDetails();
  }, [selectedScript, extractTranslationFields, calculateCoverageStats]);

  // Funzione per applicare le modifiche ai blocchi
  const applyEditsToBlocks = useCallback((blocks: IFlowBlock[], fields: TranslationField[], edits: Record<string, string>, targetLang: string): IFlowBlock[] => {
    const clonedBlocks = JSON.parse(JSON.stringify(blocks)) as IFlowBlock[];
    
    // Determina il nome corrente (script o mission)
    const currentName = selectedTab === 'scripts' ? selectedScript : selectedMission;
    
    fields.forEach((field, idx) => {
      const key = `${currentName}|${idx}|${targetLang}`;
      const newValue = edits[key];
      
      if (newValue !== undefined) {
        // Naviga al blocco specifico usando il path
        let current: any = clonedBlocks;
        for (let i = 0; i < field.blockPath.length - 1; i++) {
          const pathSegment = field.blockPath[i];
          if (current[pathSegment]) {
            current = current[pathSegment];
          } else {
            return; // Path non valido
          }
        }
        
        const lastSegment = field.blockPath[field.blockPath.length - 1];
        const targetBlock = current[lastSegment];
        
        if (targetBlock) {
          if (field.field === 'text') {
            // Campo text diretto
            if (!targetBlock.text || typeof targetBlock.text !== 'object') {
              targetBlock.text = {};
            }
            targetBlock.text[targetLang] = newValue;
          } else if (field.field.startsWith('parameters.')) {
            // Parametro multilingua
            const paramName = field.field.replace('parameters.', '');
            if (!targetBlock.parameters) {
              targetBlock.parameters = {};
            }
            if (!targetBlock.parameters[paramName] || typeof targetBlock.parameters[paramName] !== 'object') {
              targetBlock.parameters[paramName] = {};
            }
            targetBlock.parameters[paramName][targetLang] = newValue;
          }
        }
      }
    });
    
    return clonedBlocks;
  }, [selectedScript, selectedMission, selectedTab]);

  // Funzione per salvare le modifiche
  const saveTranslations = useCallback(async () => {
    if (!selectedScript || !mergedBlocks || !scriptContent) {
      alert('Errore: dati dello script non disponibili');
      return;
    }
    
    try {
      setSaving(true);
      
      // Applica tutte le modifiche ai blocchi per la lingua selezionata
      const updatedBlocks = applyEditsToBlocks(mergedBlocks, translationFields, edits, selectedLang);
      
      // Crea il payload nel formato corretto per /scripts/saveScript
      const payload = {
        name: scriptContent.name,
        fileName: scriptContent.fileName,
        blocks: updatedBlocks,
        isCustom: scriptContent.isCustom || false,
        customPath: scriptContent.customPath || null,
        isMultilingual: true,
        availableLanguages: scriptContent.availableLanguages || ['EN', 'DE', 'FR', 'ES', 'PL', 'CS', 'RU']
      };
      
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/scripts/saveScript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save script');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Save failed');
      }
      
      // Aggiorna i dati locali
      setMergedBlocks(updatedBlocks);
      
      // Ricalcola le statistiche con i nuovi valori
      const updatedFields = extractTranslationFields(updatedBlocks, scriptContent.availableLanguages || ['EN', 'DE', 'FR', 'ES', 'PL', 'CS', 'RU']);
      setTranslationFields(updatedFields);
      
      const stats = calculateCoverageStats(updatedFields, selectedLang);
      
      // Aggiorna scriptDetails
      if (scriptDetails) {
        const updatedSummary = { ...scriptDetails.summary };
        updatedSummary[selectedLang] = {
          covered: stats.covered,
          missing: stats.missing,
          different: stats.covered,
          totalFields: stats.total,
          percent: stats.percent
        };
        
        setScriptDetails({
          ...scriptDetails,
          summary: updatedSummary,
          details: updatedFields.map(f => ({
            path: f.blockPath,
            field: f.field,
            label: f.nearestLabel,
            type: f.type,
            en: f.en,
            values: f.values
          }))
        });
      }
      
      alert(`Script salvato con successo! Copertura ${selectedLang}: ${stats.percent}%`);
      
    } catch (error: any) {
      console.error('Error saving script:', error);
      alert(`Errore durante il salvataggio: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }, [selectedScript, mergedBlocks, scriptContent, translationFields, edits, selectedLang, applyEditsToBlocks, extractTranslationFields, calculateCoverageStats, scriptDetails]);

  // Funzione per caricare i dettagli di una mission
  const loadMissionDetails = useCallback(async (missionName: string) => {
    if (!missionName) {
      setMissionDetails(null);
      setMissionContent(null);
      return;
    }
    
    try {
      const resp = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.MISSION_BY_NAME(missionName)}?multilingua=true&format=blocks`);
      const json = await resp.json();
      
      if (!json.success || !json.data) {
        throw new Error('Failed to load mission blocks');
      }
      
      const allBlocks = [
        ...(json.data.blocksMission || []),
        ...(json.data.blocksFinish || [])
      ];
      const availableLanguages = json.data.availableLanguages || ['EN', 'DE', 'FR', 'ES', 'PL', 'CS', 'RU'];
      
      setMissionContent(json.data);
      
      // Estrai i campi di traduzione
      const fields = extractTranslationFields(allBlocks, availableLanguages);
      setTranslationFields(fields);
      
      // Calcola le statistiche per creare dettagli compatibili
      const summary: PerLanguage = {};
      for (const lang of availableLanguages) {
        if (lang === 'EN') continue;
        const stats = calculateCoverageStats(fields, lang);
        summary[lang] = {
          covered: stats.covered,
          missing: stats.missing,
          different: stats.covered,
          totalFields: stats.total,
          percent: stats.percent
        };
      }
      
      // Crea dettagli compatibili
      const details = fields.map(f => ({
        path: f.blockPath,
        field: f.field,
        label: f.nearestLabel,
        type: f.type,
        en: f.en,
        values: f.values
      }));
      
      setMissionDetails({
        script: missionName,
        totalFields: fields.length,
        summary,
        details
      });
      
      // Precarica i valori attuali negli edits
      const initialEdits: Record<string, string> = {};
      fields.forEach((field, idx) => {
        for (const lang of availableLanguages) {
          if (lang === 'EN') continue;
          const key = `${missionName}|${idx}|${lang}`;
          const currentValue = (typeof field.values[lang] === 'string' ? field.values[lang]!.trim() : '') || '';
          if (currentValue) {
            initialEdits[key] = currentValue;
          }
        }
      });
      setEdits(initialEdits);
      
    } catch (e: any) {
      console.error('Error loading mission details:', e);
      setMissionDetails(null);
      setMissionContent(null);
    }
  }, [extractTranslationFields, calculateCoverageStats]);

  // Funzione per aggiungere id ai blocchi se mancanti
  const ensureBlockIds = useCallback((blocks: IFlowBlock[]): IFlowBlock[] => {
    const clonedBlocks = JSON.parse(JSON.stringify(blocks)) as IFlowBlock[];
    
    const addIdsRecursively = (blockList: IFlowBlock[]) => {
      for (const block of blockList) {
        if (!block.id) {
          block.id = `block_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Ricorsione per i contenitori
        if (block.children && Array.isArray(block.children)) {
          addIdsRecursively(block.children);
        }
        if (block.thenBlocks && Array.isArray(block.thenBlocks)) {
          addIdsRecursively(block.thenBlocks);
        }
        if (block.elseBlocks && Array.isArray(block.elseBlocks)) {
          addIdsRecursively(block.elseBlocks);
        }
        
        // Ricorsione per i blocchi specifici delle missions
        if (block.blockInit && Array.isArray(block.blockInit)) {
          addIdsRecursively(block.blockInit);
        }
        if (block.blockStart && Array.isArray(block.blockStart)) {
          addIdsRecursively(block.blockStart);
        }
        if (block.blockEvaluate && Array.isArray(block.blockEvaluate)) {
          addIdsRecursively(block.blockEvaluate);
        }
      }
    };
    
    addIdsRecursively(clonedBlocks);
    return clonedBlocks;
  }, []);

  // Funzione per salvare le modifiche alle missions
  const saveMissionTranslations = useCallback(async () => {
    if (!selectedMission || !missionContent) {
      alert('Errore: dati della mission non disponibili');
      return;
    }
    
    try {
      setSaving(true);
      
      // Applica tutte le modifiche ai blocchi per la lingua selezionata
      const allBlocks = [
        ...(missionContent.blocksMission || []),
        ...(missionContent.blocksFinish || [])
      ];
      const updatedAllBlocks = applyEditsToBlocks(allBlocks, translationFields, edits, selectedLang);
      
      // Separare i blocchi aggiornati
      const blocksMissionLength = missionContent.blocksMission?.length || 0;
      const updatedBlocksMission = updatedAllBlocks.slice(0, blocksMissionLength);
      const updatedBlocksFinish = updatedAllBlocks.slice(blocksMissionLength);
      
      // Assicura che tutti i blocchi abbiano un id
      const blocksWithIds = ensureBlockIds(updatedBlocksMission);
      const finishBlocksWithIds = ensureBlockIds(updatedBlocksFinish);
      
      // Assicura che la lingua selezionata sia inclusa nelle availableLanguages
      const currentAvailableLanguages = missionContent.availableLanguages || ['EN', 'DE', 'FR', 'ES', 'PL', 'CS', 'RU'];
      const updatedAvailableLanguages = currentAvailableLanguages.includes(selectedLang) 
        ? currentAvailableLanguages 
        : [...currentAvailableLanguages, selectedLang];
      
      // Crea il payload per il salvataggio mission (deve essere un array)
      const missionPayload = {
        name: missionContent.name,
        fileName: missionContent.fileName,
        blocksMission: blocksWithIds,
        blocksFinish: finishBlocksWithIds,
        isCustom: missionContent.isCustom || false,
        isMultilingual: true,
        availableLanguages: updatedAvailableLanguages
      };
      
      // Il backend si aspetta un array con una singola mission
      const payload = [missionPayload];
      
      const response = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.MISSIONS_SAVE_MISSION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save mission');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Save failed');
      }
      
      // Aggiorna i dati locali
      const newContent = { ...missionContent, blocksMission: updatedBlocksMission, blocksFinish: updatedBlocksFinish };
      setMissionContent(newContent);
      
      // Ricalcola le statistiche
      const updatedFields = extractTranslationFields(updatedAllBlocks, missionContent.availableLanguages || ['EN', 'DE', 'FR', 'ES', 'PL', 'CS', 'RU']);
      setTranslationFields(updatedFields);
      
      const stats = calculateCoverageStats(updatedFields, selectedLang);
      
      // Aggiorna missionDetails
      if (missionDetails) {
        const updatedSummary = { ...missionDetails.summary };
        updatedSummary[selectedLang] = {
          covered: stats.covered,
          missing: stats.missing,
          different: stats.covered,
          totalFields: stats.total,
          percent: stats.percent
        };
        
        setMissionDetails({
          ...missionDetails,
          summary: updatedSummary,
          details: updatedFields.map(f => ({
            path: f.blockPath,
            field: f.field,
            label: f.nearestLabel,
            type: f.type,
            en: f.en,
            values: f.values
          }))
        });
      }
      
      alert(`Mission salvata con successo! Copertura ${selectedLang}: ${stats.percent}%`);
      
    } catch (error: any) {
      console.error('Error saving mission:', error);
      alert(`Errore durante il salvataggio: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }, [selectedMission, missionContent, translationFields, edits, selectedLang, applyEditsToBlocks, extractTranslationFields, calculateCoverageStats, missionDetails, ensureBlockIds]);

  // Carica dettagli mission quando selezionata
  useEffect(() => {
    if (selectedMission && selectedTab === 'missions') {
      loadMissionDetails(selectedMission);
    } else if (!selectedMission) {
      setMissionDetails(null);
      setMissionContent(null);
      setTranslationFields([]);
      setEdits({});
    }
  }, [selectedMission, selectedTab, loadMissionDetails]);

  const scriptsSorted = useMemo(() => {
    if (!coverage) return [] as CoverageResponse['data']['perScript'];
    // Escludi gli script che per la lingua selezionata non hanno campi (totalFields === 0)
    const list = coverage.perScript
      .filter(s => (s.languages[selectedLang]?.totalFields ?? s.totalFields ?? 0) > 0)
      .slice();
    list.sort((a, b) => {
      const pa = a.languages[selectedLang]?.percent ?? -1;
      const pb = b.languages[selectedLang]?.percent ?? -1;
      return pa - pb; // asc by coverage
    });
    return list;
  }, [coverage, selectedLang]);

  const missionsSorted = useMemo(() => {
    if (!missionsCoverage) return [];
    const list = missionsCoverage.perMission
      .filter((m: any) => (m.languages[selectedLang]?.totalFields ?? m.totalFields ?? 0) > 0)
      .slice();
    list.sort((a: any, b: any) => {
      const pa = a.languages[selectedLang]?.percent ?? -1;
      const pb = b.languages[selectedLang]?.percent ?? -1;
      return pa - pb; // asc by coverage
    });
    return list;
  }, [missionsCoverage, selectedLang]);

  if (loading) return <div className="p-6 text-gray-300">{t('common.loading')}</div>;
  if (error) return <div className="p-6 text-red-400">{t('common.error')}: {error}</div>;
  
  let currentCoverage: CoverageResponse['data'] | null = null;
  if (selectedTab === 'scripts') {
    currentCoverage = coverage;
  } else if (selectedTab === 'missions') {
    currentCoverage = missionsCoverage;
  } else if (selectedTab === 'strings') {
    // Per le strings, creiamo una struttura coverage globale basata sulle categorie disponibili
    if (categories && categories.length > 0) {
      const globalLanguageStats: PerLanguage = {};
      
      // Calcola le statistiche globali per tutte le categorie (escludendo EN)
      for (const lang of SUPPORTED_LANGUAGES.filter(lang => lang !== 'EN')) {
        let totalCovered = 0;
        let totalFields = 0;
        
        for (const category of categories) {
          const categoryTranslated = category.listKeys.filter(item => {
            const value = item.values[lang];
            const enValue = item.values['EN'] || '';
            // Tradotta se: esiste, è stringa, non è vuota, ed è diversa da EN
            return value && typeof value === 'string' && value.trim() !== '' && value.trim() !== enValue.trim();
          }).length;
          totalCovered += categoryTranslated;
          totalFields += category.numKeys;
        }
        
        globalLanguageStats[lang] = {
          covered: totalCovered,
          missing: totalFields - totalCovered,
          different: totalCovered,
          totalFields: totalFields,
          percent: totalFields > 0 ? Math.round((totalCovered / totalFields) * 100) : 0
        };
      }
      
      currentCoverage = {
        perLanguage: globalLanguageStats,
        perScript: [] // Non utilizzato per le strings ma richiesto per compatibilità
      };
    } else if (!isLoadingStrings) {
      // Se non ci sono categorie e non stiamo caricando, crea una coverage vuota (escludendo EN)
      currentCoverage = {
        perLanguage: SUPPORTED_LANGUAGES.filter(lang => lang !== 'EN').reduce((acc, lang) => {
          acc[lang] = {
            covered: 0,
            missing: 0,
            different: 0,
            totalFields: 0,
            percent: 0
          };
          return acc;
        }, {} as PerLanguage),
        perScript: []
      };
    }
  }
  
  // Se non abbiamo dati per il tab corrente, mostra loading o noData
  if (!currentCoverage) {
    if (selectedTab === 'missions') {
      // Per missions, se non abbiamo dati potrebbe essere in caricamento
      return <div className="p-6 text-gray-300">{t('common.loading')}</div>;
    } else if (selectedTab === 'strings') {
      // Per strings, mostra loading solo se stiamo caricando
      if (isLoadingStrings) {
        return <div className="p-6 text-gray-300">{t('common.loading')}</div>;
      } else {
        // Se non stiamo caricando, mostra noData
        return <div className="p-6 text-gray-400">Nessuna categoria di stringhe disponibile</div>;
      }
    } else {
      // Per scripts, se non abbiamo coverage è un errore
      return <div className="p-6 text-gray-400">{t('common.noData')}</div>;
    }
  }

  const langs = currentCoverage ? Object.keys(currentCoverage.perLanguage).filter(lang => lang !== 'EN') : [];
  
  let currentSorted: any;
  let currentDetails: any;
  let currentSaveFunction: any;
  
  if (selectedTab === 'scripts') {
    currentSorted = scriptsSorted;
    currentDetails = scriptDetails;
    currentSaveFunction = saveTranslations;
  } else if (selectedTab === 'missions') {
    currentSorted = missionsSorted;
    currentDetails = missionDetails;
    currentSaveFunction = saveMissionTranslations;
  } else if (selectedTab === 'strings') {
    // Per le strings, usiamo le categories come "sorted" (filtrando EN)
    currentSorted = categories.map(cat => ({
      category: cat.nome,
      languages: SUPPORTED_LANGUAGES.filter(lang => lang !== 'EN').reduce((acc, lang) => {
        const translated = cat.listKeys.filter(key => {
          const value = key.values[lang];
          const enValue = key.values['EN'] || '';
          // Tradotta se: esiste, è stringa, non è vuota, ed è diversa da EN
          return value && typeof value === 'string' && value.trim() !== '' && value.trim() !== enValue.trim();
        }).length;
        const total = cat.numKeys || 1;
        acc[lang] = {
          covered: translated,
          missing: total - translated,
          different: translated,
          totalFields: total,
          percent: Math.round((translated / total) * 100)
        };
        return acc;
      }, {} as PerLanguage)
    }));
    currentDetails = selectedCategory;
    currentSaveFunction = async () => {
      if (selectedCategory) {
        // Passa la lista completa aggiornata delle stringhe
        const result = await saveCategory(selectedCategory.id, selectedCategory.listKeys);
        if (result.success) {
          alert(`Categoria ${selectedCategory.nome} salvata con successo!`);
        } else {
          alert(`Errore nel salvataggio: ${result.error}`);
        }
      }
    };
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-4 bg-slate-800 border border-slate-700 rounded-lg p-4">
        <button
          className={`px-4 py-2 rounded ${selectedTab === 'scripts' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
          onClick={() => setSelectedTab('scripts')}
        >
          📜 Scripts
        </button>
        <button
          className={`px-4 py-2 rounded ${selectedTab === 'missions' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
          onClick={() => setSelectedTab('missions')}
        >
          🚀 Missions
        </button>
        <button
          className={`px-4 py-2 rounded ${selectedTab === 'strings' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
          onClick={() => setSelectedTab('strings')}
        >
          🌐 Strings
        </button>
      </div>

      {/* Overview */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h2 className="text-white font-semibold mb-2">
          {selectedTab === 'scripts' ? 'Scripts' : selectedTab === 'missions' ? 'Missions' : 'Localization Strings'} Translations Overview
        </h2>
        {currentCoverage && (
          <div className="flex flex-wrap gap-3">
            {langs.map((lang) => {
              const d = currentCoverage?.perLanguage[lang];
              if (!d) return null;
              return (
                <div key={lang} className={`px-3 py-2 rounded border text-sm ${d.percent >= 90 ? 'border-green-600 text-green-300' : d.percent >= 60 ? 'border-yellow-600 text-yellow-300' : 'border-red-700 text-red-300'}`}>
                  <span className="font-bold mr-2">{lang}</span>
                  <span>{d.percent}%</span>
                  <span className="ml-2 text-xs text-gray-400">({d.covered}/{d.totalFields})</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <label className="text-gray-300 text-sm">Lingua</label>
        <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className="bg-slate-800 text-gray-200 border border-slate-700 rounded px-2 py-1">
          {langs.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <label className="flex items-center gap-2 text-gray-300 text-sm">
          <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
          Solo mancanti
        </label>
      </div>

      {/* Content table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-gray-300">
            <tr>
              <th className="px-3 py-2">
                {selectedTab === 'scripts' ? 'Script' : 
                 selectedTab === 'missions' ? 'Mission' : 
                 'Category'}
              </th>
              <th className="px-3 py-2">% {selectedLang}</th>
              <th className="px-3 py-2">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {currentSorted.map((item: any) => {
              const d = item.languages[selectedLang];
              if (!d) return null;
              // Show in Solo mancanti only if completion < 100
              if (onlyMissing && (d.percent >= 100)) return null;
              
              let itemName: string = '';
              let isOpen: boolean = false;
              
              if (selectedTab === 'scripts') {
                itemName = item.script || '';
                isOpen = selectedScript === itemName;
              } else if (selectedTab === 'missions') {
                itemName = item.mission || '';
                isOpen = selectedMission === itemName;
              } else if (selectedTab === 'strings') {
                itemName = item.category || '';
                isOpen = selectedCategory?.nome === itemName;
              }
              return (
                <React.Fragment key={itemName}>
                  <tr className="hover:bg-slate-700/40">
                    <td className="px-3 py-2 text-gray-200">{itemName}</td>
                    <td className="px-3 py-2 text-gray-300">{d.percent}% <span className="text-xs text-gray-500">({d.covered}/{d.totalFields})</span></td>
                    <td className="px-3 py-2 text-gray-300">
                      <button 
                        className="btn-primary mr-2" 
                        onClick={() => {
                          if (selectedTab === 'scripts') {
                            setSelectedScript(isOpen ? null : itemName);
                          } else if (selectedTab === 'missions') {
                            setSelectedMission(isOpen ? null : itemName);
                          } else if (selectedTab === 'strings') {
                            // Per le strings, carichiamo la categoria
                            if (isOpen) {
                              // Se è già aperta, chiudiamo la categoria
                              setSelectedCategory(null);
                            } else {
                              // Carichiamo la categoria
                              loadCategory(itemName);
                            }
                          }
                        }}
                      >
                        {isOpen ? '👁️‍🗨️' : '👁️'}
                      </button>
                      {selectedTab === 'scripts' && (
                        <button 
                          className="btn-secondary"
                          title="Apri in Visual Flow Editor"
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('navigateToVisualFlow', { detail: { scriptName: itemName } as any }));
                          }}
                        >
                          🎯
                        </button>
                      )}
                      {selectedTab === 'missions' && (
                        <button 
                          className="btn-secondary"
                          title="Apri in Visual Flow Editor"
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('navigateToVisualFlowMission', { detail: { missionName: itemName } as any }));
                          }}
                        >
                          🎯
                        </button>
                      )}
                    </td>
                  </tr>
                  {isOpen && currentDetails && 
                   ((selectedTab === 'scripts' && currentDetails.script === itemName) ||
                    (selectedTab === 'missions' && currentDetails.script === itemName) ||
                    (selectedTab === 'strings' && currentDetails.nome === itemName)) && (
                    <tr className="bg-slate-900/40">
                      <td colSpan={3} className="px-3 py-2">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-gray-300 text-sm">
                              Copertura {selectedLang}: {
                                selectedTab === 'strings' && categoryStats 
                                  ? Math.round(((categoryStats.translatedKeys[selectedLang] || 0) / categoryStats.totalKeys) * 100)
                                  : currentDetails.summary[selectedLang]?.percent ?? 0
                              }%
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                disabled={saving || !currentDetails}
                                className={`btn-primary ${saving || !currentDetails ? 'opacity-60 cursor-not-allowed' : ''}`}
                                title={saving ? 'Salvando...' : 'Salva Modifiche'}
                                onClick={currentSaveFunction}
                              >
                                {saving ? '⏳' : '💾'}
                              </button>
                              <button
                                disabled={saving || !currentDetails}
                                className={`btn-secondary ${saving || !currentDetails ? 'opacity-60 cursor-not-allowed' : ''}`}
                                title="Suggerimenti IA per tutti i campi"
                                onClick={async () => {
                                  if (!currentDetails) return;
                                  try {
                                    setSaving(true);
                                    
                                    if (selectedTab === 'strings' && selectedCategory) {
                                      // Per le strings, usa la nuova API
                                      const result = await translateCategory(selectedCategory.id, 'EN', selectedLang);
                                      if (result.success && result.translations) {
                                        // Applica le traduzioni sistemando il formato
                                        result.translations.forEach((translation: any) => {
                                          // Rimuovi tutti i possibili prefissi placeholder
                                          let cleanTranslation = translation.translatedText || '';
                                          
                                          // Pattern di prefissi da rimuovere
                                          const prefixPatterns = [
                                            `[AI_TRANSLATED:${selectedLang}] `,
                                            `[AI_TRANSLATED:${selectedLang.toLowerCase()}] `,
                                            `[AI_TRANSLATED:${selectedLang.toUpperCase()}] `,
                                            `[TRANSLATED:${selectedLang}] `,
                                            `[TRANSLATED:${selectedLang.toLowerCase()}] `,
                                            `[TRANSLATED:${selectedLang.toUpperCase()}] `
                                          ];
                                          
                                          for (const prefix of prefixPatterns) {
                                            if (cleanTranslation.startsWith(prefix)) {
                                              cleanTranslation = cleanTranslation.substring(prefix.length);
                                              break;
                                            }
                                          }
                                          
                                          // Rimuovi anche eventuali spazi iniziali/finali e newline
                                          cleanTranslation = cleanTranslation.trim().replace(/[\r\n]/g, ' ');
                                          
                                          if (cleanTranslation) {
                                            updateString(translation.key, selectedLang, cleanTranslation);
                                          }
                                        });
                                        alert(`Tutte le stringhe sono state tradotte in ${selectedLang}!`);
                                      }
                                    } else {
                                      // Per scripts e missions, usa la logica esistente
                                      const items = currentDetails.details.map((d: any) => ({
                                        textEN: d.en,
                                        metacodesDetected: (d.en.match(/\[[^\]]+\]/g) || [])
                                      }));
                                      const resp = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_AI_TRANSLATE_BATCH}`, {
                                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ items, langTarget: selectedLang })
                                      });
                                      const j = await resp.json();
                                      if (!resp.ok || !j?.success) throw new Error(j?.message || 'batch failed');
                                      const suggestions: string[] = j.data?.suggestions || [];
                                      // Popola tutte le inputbox
                                      const newEdits: Record<string, string> = { ...edits };
                                      currentDetails.details.forEach((_: any, idx: number) => {
                                        const key = `${currentDetails.script}|${idx}|${selectedLang}`;
                                        const sug = suggestions[idx];
                                        if (typeof sug === 'string' && sug.length > 0) newEdits[key] = sug;
                                      });
                                      setEdits(newEdits);
                                    }
                                  } catch (e: any) {
                                    alert(e?.message || 'Impossibile generare suggerimenti in batch');
                                  } finally {
                                    setSaving(false);
                                  }
                                }}
                              >🪄✨</button>
                            </div>
                          </div>
                          <div className="max-h-72 overflow-auto border border-slate-700 rounded">
                            {selectedTab === 'strings' && selectedCategory ? (
                              // Rendering per localization strings
                              <table className="w-full text-left text-sm">
                                <thead className="bg-slate-900 text-gray-300">
                                  <tr>
                                    <th className="px-3 py-2 w-[20%]">Key</th>
                                    <th className="px-3 py-2 w-[30%]">EN</th>
                                    <th className="px-3 py-2 w-[40%]">{selectedLang}</th>
                                    <th className="px-3 py-2 w-[10%]">Azioni</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                  {filteredStrings.map((stringItem, idx) => {
                                    const enValue = stringItem.values.EN || '';
                                    const rawValue = stringItem.values[selectedLang] || '';
                                    
                                    // Per la textarea, usa sempre il valore della lingua selezionata (può essere vuoto)
                                    const textareaValue = rawValue;
                                    
                                    // Non tradotta se: vuota o uguale a EN
                                    const isMissing = !rawValue || rawValue.trim() === '' || rawValue.trim() === enValue.trim();
                                    
                                    return (
                                      <tr key={stringItem.id} className={`${isMissing ? 'bg-red-900/20' : 'bg-yellow-900/20'}`}>
                                        <td className="px-3 py-2 text-gray-400 w-[20%] font-mono text-xs break-all">
                                          {stringItem.id}
                                        </td>
                                        <td className="px-3 py-2 text-gray-200 w-[30%]">
                                          {enValue}
                                        </td>
                                        <td className="px-3 py-2 text-gray-200 w-[40%]">
                                          <textarea
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-gray-200 resize-y"
                                            rows={2}
                                            value={textareaValue}
                                            onChange={(e) => {
                                              // Rimuovi i newline per mantenere tutto su una singola riga
                                              const singleLineValue = e.target.value.replace(/[\r\n]/g, ' ');
                                              updateString(stringItem.id, selectedLang, singleLineValue);
                                            }}
                                            onKeyDown={(e) => {
                                              // Impedisci Enter per evitare newline
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                              }
                                            }}
                                            placeholder={`Traduzione in ${selectedLang} (EN: ${enValue})`}
                                            style={{ overflow: 'auto', minHeight: '3rem' }}
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-gray-300 w-[10%]">
                                          <button 
                                            className="btn-primary text-lg hover:bg-blue-600 px-2 py-1" 
                                            title="Suggerimento IA"
                                            onClick={async () => {
                                              try {
                                                const result = await translateString(enValue, 'EN', selectedLang, stringItem.id);
                                                if (result.success && result.translatedText) {
                                                  // Rimuovi tutti i possibili prefissi placeholder
                                                  let cleanTranslation = result.translatedText;
                                                  
                                                  // Pattern di prefissi da rimuovere
                                                  const prefixPatterns = [
                                                    `[AI_TRANSLATED:${selectedLang}] `,
                                                    `[AI_TRANSLATED:${selectedLang.toLowerCase()}] `,
                                                    `[AI_TRANSLATED:${selectedLang.toUpperCase()}] `,
                                                    `[TRANSLATED:${selectedLang}] `,
                                                    `[TRANSLATED:${selectedLang.toLowerCase()}] `,
                                                    `[TRANSLATED:${selectedLang.toUpperCase()}] `
                                                  ];
                                                  
                                                  for (const prefix of prefixPatterns) {
                                                    if (cleanTranslation.startsWith(prefix)) {
                                                      cleanTranslation = cleanTranslation.substring(prefix.length);
                                                      break;
                                                    }
                                                  }
                                                  
                                                  // Rimuovi anche eventuali spazi iniziali/finali e newline
                                                  cleanTranslation = cleanTranslation.trim().replace(/[\r\n]/g, ' ');
                                                  
                                                  if (cleanTranslation) {
                                                    updateString(stringItem.id, selectedLang, cleanTranslation);
                                                  }
                                                }
                                              } catch (e) {
                                                alert('Impossibile generare suggerimento');
                                              }
                                            }}
                                          >
                                            🪄
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            ) : (
                              // Rendering per scripts e missions
                              <table className="w-full text-left text-sm">
                                <thead className="bg-slate-900 text-gray-300">
                                  <tr>
                                    <th className="px-3 py-2 w-[10%]">Campo</th>
                                    <th className="px-3 py-2 w-[40%]">EN</th>
                                    <th className="px-3 py-2 w-[40%]">{selectedLang}</th>
                                    <th className="px-3 py-2 w-[10%]">Azioni</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                  {currentDetails.details.map((d: any, idx: number) => {
                                  const key = `${currentDetails.script}|${idx}|${selectedLang}`;
                                  const initial = (d.values[selectedLang] || '');
                                  const targetVal = edits[key] !== undefined ? edits[key] : initial;
                                  const isMissing = !targetVal || targetVal === d.en;
                                  const isDifferent = !!targetVal && targetVal !== d.en;
                                  return (
                                    <tr key={idx} className={`${isMissing ? 'bg-red-900/20' : isDifferent ? 'bg-yellow-900/20' : ''}`}>
                                      <td className="px-3 py-2 text-gray-400 w-[10%]">{d.type || d.field || '-'}</td>
                                      <td className="px-3 py-2 text-gray-200 w-[40%]">{d.en}</td>
                                      <td className="px-3 py-2 text-gray-200 w-[40%]">
                                        <textarea
                                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-gray-200 resize-y"
                                          rows={2}
                                          value={targetVal || (d.values[selectedLang] || '')}
                                          onChange={(e) => {
                                            // Rimuovi i newline per mantenere tutto su una singola riga
                                            const singleLineValue = e.target.value.replace(/[\r\n]/g, ' ');
                                            setEdits(prev => ({ ...prev, [key]: singleLineValue }));
                                          }}
                                          onKeyDown={(e) => {
                                            // Impedisci Enter per evitare newline
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                            }
                                          }}
                                          placeholder="Inserisci traduzione"
                                          style={{ overflow: 'auto', minHeight: '3rem' }}
                                        />
                                      </td>
                                      <td className="px-3 py-2 text-gray-300 w-[10%]">
                                        <button 
                                          className="btn-primary text-lg hover:bg-blue-600 px-2 py-1" 
                                          title="Suggerimento IA"
                                          onClick={async () => {
                                          try {
                                            const metacodes = (d.en.match(/\[[^\]]+\]/g) || []);
                                            const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_AI_TRANSLATE}`, {
                                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ textEN: d.en, langTarget: selectedLang, metacodesDetected: metacodes })
                                            });
                                            const j = await res.json();
                                            if (!j.success) throw new Error('ai translate failed');
                                            const suggestion = j.data?.suggestion as string | undefined;
                                            if (suggestion) setEdits(prev => ({ ...prev, [key]: suggestion }));
                                            else alert('Nessun suggerimento disponibile');
                                          } catch (e) {
                                            alert('Impossibile generare suggerimento');
                                          }
                                        }}>🪄</button>
                                      </td>
                                    </tr>
                                  );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      
    </div>
  );
};

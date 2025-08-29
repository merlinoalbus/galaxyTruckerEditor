import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { API_CONFIG, API_ENDPOINTS } from '@/config';
import { useTranslation } from '@/locales';
import { IFlowBlock } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';
import { useLocalizationStrings } from '@/hooks/CampaignEditor/useLocalizationStrings';
import { TranslationEditor } from './TranslationEditor';
import { ScriptMetadataProvider } from '@/contexts/ScriptMetadataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackupErrorModal } from '@/components/UI/BackupErrorModal';

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
  const { currentLanguage } = useLanguage(); // Lingua globale dell'app
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverageLoaded, setCoverageLoaded] = useState(false);
  const [preventReload, setPreventReload] = useState(false);
  
  // State interno per coverage con protezione diretta
  const [coverageInternal, setCoverageInternalRaw] = useState<CoverageResponse['data'] | null>(null);
  
  // Wrapper protetto che blocca TUTTE le chiamate durante preventReload
  const setCoverageInternal = useCallback((newCoverage: CoverageResponse['data'] | null) => {
    if (preventReload) {
      return; // Blocca silenziosamente durante preventReload
    }
    setCoverageInternalRaw(newCoverage);
  }, [preventReload]);
  
  // Funzione per forzare aggiornamenti durante preventReload (solo per aggiornamento ottimistico)
  const setCoverageForced = useCallback((newCoverage: CoverageResponse['data'] | null) => {
    setCoverageInternalRaw(newCoverage);
  }, []);
  
  // Alias per compatibilità
  const setCoverage = setCoverageInternal;
  const coverage = coverageInternal;
  
  const [selectedLang, setSelectedLang] = useState<string>('IT');
  const [onlyMissing, setOnlyMissing] = useState<boolean>(false);
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [scriptDetails, setScriptDetails] = useState<ScriptDetailsResponse['data'] | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [originalBlocks, setOriginalBlocks] = useState<IFlowBlock[] | null>(null); // Blocchi originali completi per il salvataggio
  const [translationFields, setTranslationFields] = useState<TranslationField[]>([]);
  const [allTranslationFields, setAllTranslationFields] = useState<TranslationField[]>([]); // Campi completi non filtrati
  const [allScriptDetails, setAllScriptDetails] = useState<any>(null); // Dettagli script completi non filtrati
  const [saving, setSaving] = useState(false);
  const [scriptContent, setScriptContent] = useState<any>(null);
  
  // Stati per tutti i tipi di traduzioni
  const [selectedTab, setSelectedTab] = useState<'scripts' | 'missions' | 'strings' | 'nodes' | 'yaml-missions'>('scripts');
  const [missionsCoverage, setMissionsCoverage] = useState<any>(null);
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [missionDetails, setMissionDetails] = useState<any>(null);
  const [missionContent, setMissionContent] = useState<any>(null);

  // Stati per nodes.yaml e missions.yaml
  const [nodesData, setNodesData] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [yamlMissionsData, setYamlMissionsData] = useState<any>(null);
  const [selectedYamlMissions, setSelectedYamlMissions] = useState<Set<string>>(new Set());

  // Campo di ricerca globale
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');
  const [filteredScriptNames, setFilteredScriptNames] = useState<Set<string>>(new Set());
  const [filteredStringCategories, setFilteredStringCategories] = useState<Set<string>>(new Set());
  const [filteredNodesNames, setFilteredNodesNames] = useState<Set<string>>(new Set());
  const [filteredMissionsNames, setFilteredMissionsNames] = useState<Set<string>>(new Set());
  const [filteredRegularMissions, setFilteredRegularMissions] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [contentSearchActive, setContentSearchActive] = useState<boolean>(false);
  const [filterEnabled, setFilterEnabled] = useState<boolean>(true);  // Toggle per attivare/disattivare il filtro
  
  // Stati per gestire errori di backup
  const [showBackupErrorModal, setShowBackupErrorModal] = useState<boolean>(false);
  const [backupErrorMessage, setBackupErrorMessage] = useState<string>('');
  const [backupErrorDetails, setBackupErrorDetails] = useState<any>(null);
  
  // Stati per l'ordinamento
  type SortField = 'name' | 'percent';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Hook per localization strings
  const {
    categories,
    selectedCategory,
    isLoading: isLoadingStrings,
    filteredStrings,
    loadCategory,
    saveCategory,
    translateCategory,
    updateString,
    setSelectedCategory,
    SUPPORTED_LANGUAGES
  } = useLocalizationStrings();

  // Ascolta il cambio di backend per ricaricare i dati di traduzione
  // (spostato dopo la definizione delle funzioni loadScriptsCoverage e loadMissionsCoverage)
  
  // Funzione helper per filtrare gli elementi basata sul termine di ricerca
  const filterItems = useCallback((items: any[], searchTerm: string) => {
    if (!searchTerm.trim()) return items;
    
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    return items.filter((item: any) => {
      // Get the item name/key
      const itemName = item.script || item.mission || item.category || item.node || '';
      
      // Per gli script, usa i risultati della ricerca asincrona nel contenuto
      if (selectedTab === 'scripts' && item.script) {
        return filteredScriptNames.has(item.script) || item.script.toLowerCase().includes(normalizedSearch);
      }

      // Per le strings, usa i risultati della ricerca asincrona nel contenuto
      if (selectedTab === 'strings' && item.category) {
        return filteredStringCategories.has(item.category) || item.category.toLowerCase().includes(normalizedSearch);
      }

      // Per i nodes, usa i risultati della ricerca asincrona nel contenuto
      if (selectedTab === 'nodes' && item.node) {
        return filteredNodesNames.has(item.node) || item.node.toLowerCase().includes(normalizedSearch);
      }

      // Per le missions YAML, usa i risultati della ricerca asincrona nel contenuto
      if (selectedTab === 'yaml-missions' && item.mission) {
        return filteredMissionsNames.has(item.mission) || item.mission.toLowerCase().includes(normalizedSearch);
      }

      // Per le missions regolari, usa i risultati della ricerca asincrona nel contenuto
      if (selectedTab === 'missions' && item.mission) {
        return filteredRegularMissions.has(item.mission) || item.mission.toLowerCase().includes(normalizedSearch);
      }
      
      // Per altri tab, continua con la logica standard
      if (itemName.toLowerCase().includes(normalizedSearch)) {
        return true;
      }
      
      // Legacy fallback for strings tab (keep for backward compatibility)
      if (selectedTab === 'strings' && item.category && selectedCategory && selectedCategory.nome === item.category) {
        const categoryWithStrings = selectedCategory as any;
        // Check EN values
        const enStrings = Object.values(categoryWithStrings.strings || {}).map((str: any) => str.EN || '').join(' ').toLowerCase();
        if (enStrings.includes(normalizedSearch)) return true;
        
        // Check current language values
        const currentLangStrings = Object.values(categoryWithStrings.strings || {}).map((str: any) => str[selectedLang] || '').join(' ').toLowerCase();
        if (currentLangStrings.includes(normalizedSearch)) return true;
      }
      
      // For nodes and yaml-missions, need to look up the actual data
      if (selectedTab === 'nodes' && nodesData?.items) {
        const nodeData = nodesData.items.find((n: any) => n.id === itemName);
        if (nodeData?.translations) {
          const enTranslations = nodeData.translations['EN'] || {};
          const currentLangTranslations = nodeData.translations[selectedLang] || {};
          
          // Check EN values
          const enValues = [enTranslations.caption, enTranslations.description].filter(Boolean).join(' ').toLowerCase();
          if (enValues.includes(normalizedSearch)) return true;
          
          // Check current language values
          const currentLangValues = [currentLangTranslations.caption, currentLangTranslations.description].filter(Boolean).join(' ').toLowerCase();
          if (currentLangValues.includes(normalizedSearch)) return true;
          
          // Check buttons text
          if (enTranslations.buttons && Array.isArray(enTranslations.buttons)) {
            const enButtonsText = enTranslations.buttons.map((btn: any) => btn?.text || '').join(' ').toLowerCase();
            if (enButtonsText.includes(normalizedSearch)) return true;
          }
          
          if (currentLangTranslations.buttons && Array.isArray(currentLangTranslations.buttons)) {
            const currentLangButtonsText = currentLangTranslations.buttons.map((btn: any) => btn?.text || '').join(' ').toLowerCase();
            if (currentLangButtonsText.includes(normalizedSearch)) return true;
          }
        }
      }
      
      if (selectedTab === 'yaml-missions' && yamlMissionsData?.items) {
        const missionData = yamlMissionsData.items.find((m: any) => m.id === itemName);
        if (missionData?.translations) {
          const enTranslations = missionData.translations['EN'] || {};
          const currentLangTranslations = missionData.translations[selectedLang] || {};
          
          // Check EN values
          const enValues = [enTranslations.caption, enTranslations.description].filter(Boolean).join(' ').toLowerCase();
          if (enValues.includes(normalizedSearch)) return true;
          
          // Check current language values
          const currentLangValues = [currentLangTranslations.caption, currentLangTranslations.description].filter(Boolean).join(' ').toLowerCase();
          if (currentLangValues.includes(normalizedSearch)) return true;
        }
      }
      
      return false;
    });
  }, [selectedTab, selectedLang, categories, selectedCategory, nodesData, yamlMissionsData, filteredScriptNames, filteredStringCategories, filteredNodesNames, filteredMissionsNames, filteredRegularMissions]);
  
  // Funzione batch per cercare un termine nel contenuto di tutti gli script
  const batchSearchInScripts = useCallback(async (scriptNames: string[], searchTerm: string): Promise<string[]> => {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/scripts/translations/batch-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scriptNames,
          searchTerm
        })
      });
      
      const result = await response.json();
      if (result.success) {
        return result.data.matchingScripts || [];
      } else {
        console.error('Batch search failed:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Error in batch search:', error);
      return [];
    }
  }, []);

  // Funzione batch per cercare un termine nel contenuto di tutte le categorie strings
  const batchSearchInStrings = useCallback(async (categoryNames: string[], searchTerm: string): Promise<string[]> => {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/localization/strings/batch-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoryNames,
          searchTerm
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        return result.data.matchingCategories || [];
      } else {
        console.error('Batch search failed:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Error in batch search:', error);
      return [];
    }
  }, []);

  // Funzione batch per cercare un termine nel contenuto di tutti i nodes
  const batchSearchInNodes = useCallback(async (nodeNames: string[], searchTerm: string): Promise<string[]> => {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/localization/nodes/batch-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nodeNames,
          searchTerm
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        return result.data.matchingNodes || [];
      } else {
        console.error('Batch search failed:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Error in batch search:', error);
      return [];
    }
  }, []);

  // Funzione batch per cercare un termine nel contenuto di tutte le missions YAML
  const batchSearchInMissions = useCallback(async (missionNames: string[], searchTerm: string): Promise<string[]> => {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/localization/missions/batch-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          missionNames,
          searchTerm
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        return result.data.matchingMissions || [];
      } else {
        console.error('Batch search failed:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Error in batch search:', error);
      return [];
    }
  }, []);

  // Funzione batch per cercare un termine nel contenuto di tutte le missions regolari
  const batchSearchInRegularMissions = useCallback(async (missionNames: string[], searchTerm: string): Promise<string[]> => {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/missions/translations/batch-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          missionNames,
          searchTerm
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        return result.data.matchingMissions || [];
      } else {
        console.error('Batch search failed:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Error in batch search:', error);
      return [];
    }
  }, []);
  
  // Funzione manuale per cercare nel contenuto degli script (usando batch endpoint)
  const performScriptContentSearch = useCallback(async () => {
    if (!globalSearchTerm.trim() || selectedTab !== 'scripts') {
      setFilteredScriptNames(new Set());
      setIsSearching(false);
      return;
    }
    
    if (!coverage?.perScript || coverage.perScript.length === 0) {
      setFilteredScriptNames(new Set());
      setIsSearching(false);
      return;
    }
    
    setContentSearchActive(true);
    setIsSearching(true);
    const matchingScripts = new Set<string>();
    
    try {
      const scriptNames = coverage.perScript.map(s => s.script);
      
      // Prima cerca nei nomi degli script (veloce)
      for (const scriptName of scriptNames) {
        if (scriptName.toLowerCase().includes(globalSearchTerm.toLowerCase())) {
          matchingScripts.add(scriptName);
        }
      }
      
      // Poi cerca nel contenuto usando batch endpoint (UNA sola chiamata)
      const remainingScripts = scriptNames.filter(name => !matchingScripts.has(name));
      
      
      if (remainingScripts.length > 0) {
        const contentMatches = await batchSearchInScripts(remainingScripts, globalSearchTerm);
        contentMatches.forEach(scriptName => matchingScripts.add(scriptName));
      }
      
    } catch (error) {
      console.error('Errore durante la ricerca:', error);
      alert('Errore durante la ricerca nel contenuto degli script');
    }
    
    setFilteredScriptNames(matchingScripts);
    setIsSearching(false);
  }, [globalSearchTerm, selectedTab, coverage, batchSearchInScripts]);

  // Funzione manuale per cercare nel contenuto delle categorie strings
  const performStringContentSearch = useCallback(async () => {
    if (!globalSearchTerm.trim() || selectedTab !== 'strings') {
      setFilteredStringCategories(new Set());
      setIsSearching(false);
      return;
    }

    if (!categories || categories.length === 0) {
      setFilteredStringCategories(new Set());
      setIsSearching(false);
      return;
    }

    setContentSearchActive(true);
    setIsSearching(true);
    const matchingCategories = new Set<string>();

    try {
      const categoryNames = categories.map(cat => cat.nome);

      // Prima cerca nei nomi delle categorie (veloce)
      for (const categoryName of categoryNames) {
        if (categoryName.toLowerCase().includes(globalSearchTerm.toLowerCase())) {
          matchingCategories.add(categoryName);
        }
      }

      // Poi cerca nel contenuto usando batch endpoint
      const remainingCategories = categoryNames.filter(name => !matchingCategories.has(name));

      if (remainingCategories.length > 0) {
        const contentMatches = await batchSearchInStrings(remainingCategories, globalSearchTerm);
        contentMatches.forEach(categoryName => matchingCategories.add(categoryName));
      }

    } catch (error) {
      console.error('Errore durante la ricerca:', error);
      alert('Errore durante la ricerca nel contenuto delle string categories');
    }

    setFilteredStringCategories(matchingCategories);
    setIsSearching(false);
  }, [globalSearchTerm, selectedTab, categories, batchSearchInStrings]);

  // Funzione manuale per cercare nel contenuto dei nodes
  const performNodeContentSearch = useCallback(async () => {
    if (!globalSearchTerm.trim() || selectedTab !== 'nodes') {
      setFilteredNodesNames(new Set());
      setIsSearching(false);
      return;
    }

    if (!nodesData) {
      setFilteredNodesNames(new Set());
      setIsSearching(false);
      return;
    }

    setContentSearchActive(true);
    setIsSearching(true);
    const matchingNodes = new Set<string>();

    try {
      const nodeNames = nodesData.items ? nodesData.items.map((item: any) => item.id) : [];

      // Prima cerca nei nomi dei nodes (veloce)
      for (const nodeName of nodeNames) {
        if (nodeName.toLowerCase().includes(globalSearchTerm.toLowerCase())) {
          matchingNodes.add(nodeName);
        }
      }

      // Poi cerca nel contenuto usando batch endpoint
      const remainingNodes = nodeNames.filter((name: string) => !matchingNodes.has(name));

      if (remainingNodes.length > 0) {
        const contentMatches = await batchSearchInNodes(remainingNodes, globalSearchTerm);
        contentMatches.forEach(nodeName => matchingNodes.add(nodeName));
      }

    } catch (error) {
      console.error('Errore durante la ricerca:', error);
      alert('Errore durante la ricerca nel contenuto dei nodes');
    }

    setFilteredNodesNames(matchingNodes);
    setIsSearching(false);
  }, [globalSearchTerm, selectedTab, nodesData, batchSearchInNodes]);

  // Funzione manuale per cercare nel contenuto delle missions YAML
  const performMissionContentSearch = useCallback(async () => {
    if (!globalSearchTerm.trim() || selectedTab !== 'yaml-missions') {
      setFilteredMissionsNames(new Set());
      setIsSearching(false);
      return;
    }

    if (!yamlMissionsData) {
      setFilteredMissionsNames(new Set());
      setIsSearching(false);
      return;
    }

    setContentSearchActive(true);
    setIsSearching(true);
    const matchingMissions = new Set<string>();

    try {
      const missionNames = yamlMissionsData.items ? yamlMissionsData.items.map((item: any) => item.id) : [];

      // Prima cerca nei nomi delle missions (veloce)
      for (const missionName of missionNames) {
        if (missionName.toLowerCase().includes(globalSearchTerm.toLowerCase())) {
          matchingMissions.add(missionName);
        }
      }

      // Poi cerca nel contenuto usando batch endpoint
      const remainingMissions = missionNames.filter((name: string) => !matchingMissions.has(name));

      if (remainingMissions.length > 0) {
        const contentMatches = await batchSearchInMissions(remainingMissions, globalSearchTerm);
        contentMatches.forEach(missionName => matchingMissions.add(missionName));
      }

    } catch (error) {
      console.error('Errore durante la ricerca:', error);
      alert('Errore durante la ricerca nel contenuto delle missions YAML');
    }

    setFilteredMissionsNames(matchingMissions);
    setIsSearching(false);
  }, [globalSearchTerm, selectedTab, yamlMissionsData, batchSearchInMissions]);

  // Funzione manuale per cercare nel contenuto delle missions regolari
  const performRegularMissionContentSearch = useCallback(async () => {
    if (!globalSearchTerm.trim() || selectedTab !== 'missions') {
      setFilteredRegularMissions(new Set());
      setIsSearching(false);
      return;
    }

    if (!missionsCoverage?.perMission || missionsCoverage.perMission.length === 0) {
      setFilteredRegularMissions(new Set());
      setIsSearching(false);
      return;
    }

    setContentSearchActive(true);
    setIsSearching(true);
    const matchingMissions = new Set<string>();

    try {
      const missionNames = missionsCoverage.perMission.map((mission: any) => mission.mission);

      // Prima cerca nei nomi delle missions (veloce)
      for (const missionName of missionNames) {
        if (missionName.toLowerCase().includes(globalSearchTerm.toLowerCase())) {
          matchingMissions.add(missionName);
        }
      }

      // Poi cerca nel contenuto usando batch endpoint
      const remainingMissions = missionNames.filter((name: string) => !matchingMissions.has(name));

      if (remainingMissions.length > 0) {
        const contentMatches = await batchSearchInRegularMissions(remainingMissions, globalSearchTerm);
        contentMatches.forEach(missionName => matchingMissions.add(missionName));
      }

    } catch (error) {
      console.error('Errore durante la ricerca:', error);
      alert('Errore durante la ricerca nel contenuto delle missions');
    }

    setFilteredRegularMissions(matchingMissions);
    setIsSearching(false);
  }, [globalSearchTerm, selectedTab, missionsCoverage, batchSearchInRegularMissions]);

  // Carica la coverage degli scripts solo quando necessario
  const loadScriptsCoverage = useCallback(async () => {
    if (preventReload) {
      return; // Blocca silenziosamente durante preventReload
    }
    
    try {
      setLoading(true);
      
      // Carica coverage degli scripts
      const scriptsRes = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_TRANSLATIONS_COVERAGE}`);
      const scriptsJson: CoverageResponse = await scriptsRes.json();
      if (!scriptsJson.success) throw new Error('scripts coverage failed');
      setCoverage(scriptsJson.data);
      setCoverageLoaded(true);
      
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, [preventReload]);

  // Carica dati nodes.yaml
  const loadNodesData = useCallback(async () => {
    try {
      setLoading(true);
      const nodesRes = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.LOCALIZATION_NODES}`);
      const nodesJson = await nodesRes.json();
      if (!nodesJson.success) throw new Error('nodes data failed');
      setNodesData(nodesJson.data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Error loading nodes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica dati missions.yaml
  const loadYamlMissionsData = useCallback(async () => {
    try {
      setLoading(true);
      const missionsRes = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.LOCALIZATION_MISSIONS}`);
      const missionsJson = await missionsRes.json();
      if (!missionsJson.success) throw new Error('yaml missions data failed');
      setYamlMissionsData(missionsJson.data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Error loading yaml missions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica coverage solo per il tab selezionato
  useEffect(() => {
    if (selectedTab === 'scripts') {
      // Carica coverage solo se non è già stata caricata
      if (!coverageLoaded) {
        loadScriptsCoverage();
      } else {
        setLoading(false);
      }
    } else if (selectedTab === 'nodes' && !nodesData) {
      loadNodesData();
    } else if (selectedTab === 'yaml-missions' && !yamlMissionsData) {
      loadYamlMissionsData();
    } else if (selectedTab === 'strings' || selectedTab === 'missions') {
      // Per strings e missions, imposta loading a false immediatamente
      setLoading(false);
    }
  }, [selectedTab, coverageLoaded, nodesData, yamlMissionsData, loadScriptsCoverage, loadNodesData, loadYamlMissionsData]);


  // Funzione per estrarre i campi multilingua dai blocchi (come prima)
  const extractTranslationFields = useCallback((blocks: IFlowBlock[], languages: string[]): TranslationField[] => {
    const fields: TranslationField[] = [];
    const norm = (s: string | undefined): string => (typeof s === 'string' ? s.trim() : '');
    function visit(list: IFlowBlock[], pathStack: (string | number)[], context?: { lastLabel?: string | null }) {
      if (!Array.isArray(list)) return;
      let lastLabel = context?.lastLabel || null;
      for (let i = 0; i < list.length; i++) {
        const b = list[i] || {};
        const currentPath = [...pathStack, i];
        if (b.type === 'LABEL' && b.parameters?.name) {
          lastLabel = String(b.parameters.name);
        }
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
        if (b.children) visit(b.children, [...currentPath, 'children'], { lastLabel });
        if (b.thenBlocks) visit(b.thenBlocks, [...currentPath, 'thenBlocks'], { lastLabel });
        if (b.elseBlocks) visit(b.elseBlocks, [...currentPath, 'elseBlocks'], { lastLabel });
        if (b.blockInit) visit(b.blockInit, [...currentPath, 'blockInit'], { lastLabel });
        if (b.blockStart) visit(b.blockStart, [...currentPath, 'blockStart'], { lastLabel });
        if (b.blockEvaluate) visit(b.blockEvaluate, [...currentPath, 'blockEvaluate'], { lastLabel });
      }
    }
    visit(blocks, [], { lastLabel: null });
    return fields;
  }, []);

  // Funzione per filtrare i blocchi che matchano la ricerca in almeno una lingua
  const filterBlocksBySearchTerm = useCallback((blocks: IFlowBlock[], searchTerm: string): IFlowBlock[] => {
    if (!searchTerm.trim()) return blocks;
    const normalizedSearch = searchTerm.toLowerCase().trim();
    // Funzione per capire se un blocco o un suo discendente ha almeno un campo traducibile che matcha
    const hasTranslatableMatchDeep = (block: IFlowBlock): boolean => {
      // Match diretto
      if (block.text && typeof block.text === 'object' && !Array.isArray(block.text)) {
        for (const val of Object.values(block.text)) {
          if (typeof val === 'string' && val.toLowerCase().includes(normalizedSearch)) return true;
        }
      }
      if (block.parameters && typeof block.parameters === 'object') {
        for (const pVal of Object.values(block.parameters)) {
          if (pVal && typeof pVal === 'object' && !Array.isArray(pVal)) {
            for (const langVal of Object.values(pVal as any)) {
              if (typeof langVal === 'string' && langVal.toLowerCase().includes(normalizedSearch)) return true;
            }
          }
        }
      }
      // Match nei figli
      for (const key of ['children', 'thenBlocks', 'elseBlocks', 'blockInit', 'blockStart', 'blockEvaluate'] as const) {
        if (Array.isArray((block as any)[key])) {
          if ((block as any)[key].some((child: IFlowBlock) => hasTranslatableMatchDeep(child))) {
            return true;
          }
        }
      }
      return false;
    };
    // Ricorsivo: mantieni la catena di genitori se almeno un discendente matcha
    const filterRec = (list: IFlowBlock[]): IFlowBlock[] => {
      return list
        .map(block => {
          if (!hasTranslatableMatchDeep(block)) return null;
          let newBlock = { ...block };
          (['children', 'thenBlocks', 'elseBlocks', 'blockInit', 'blockStart', 'blockEvaluate'] as const).forEach(key => {
            if (Array.isArray((block as any)[key])) {
              const filtered = filterRec((block as any)[key]);
              if (filtered.length > 0) {
                (newBlock as any)[key] = filtered;
              } else {
                delete (newBlock as any)[key];
              }
            }
          });
          return newBlock;
        })
        .filter(Boolean) as IFlowBlock[];
    };
    return filterRec(blocks);
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

  // Ascolta il cambio di backend per ricaricare i dati di traduzione
  useEffect(() => {
    const handleBackendChanged = (event: CustomEvent) => {
      console.log('🔄 Backend changed detected in TranslationsPage, refreshing translation data...');
      
      // Reset degli stati
      setCoverage(null);
      setScriptDetails(null);
      setOriginalBlocks(null);
      setTranslationFields([]);
      setAllTranslationFields([]);
      setAllScriptDetails(null);
      setSelectedScript(null);
      setSelectedMission(null);
      setSelectedNode(null);
      setMissionDetails(null);
      setMissionContent(null);
      setMissionsCoverage(null);
      setNodesData(null);
      setYamlMissionsData(null);
      
      // Ricarica i dati coverage
      loadScriptsCoverage();
      loadMissionsCoverage();
    };
    
    window.addEventListener('backendChanged', handleBackendChanged as EventListener);
    
    return () => {
      window.removeEventListener('backendChanged', handleBackendChanged as EventListener);
    };
  }, [loadScriptsCoverage, loadMissionsCoverage]);

  // Attiva automaticamente "Cerca nel contenuto" quando si cambia tab e la ricerca nel contenuto è attiva
  useEffect(() => {
    if (!contentSearchActive) return;
    
    // Attiva la ricerca automaticamente per il nuovo tab se la ricerca nel contenuto è attiva
    const timeout = setTimeout(() => {
      if (selectedTab === 'scripts' && !isSearching) {
        performScriptContentSearch();
      } else if (selectedTab === 'strings' && !isSearching) {
        performStringContentSearch();  
      } else if (selectedTab === 'nodes' && !isSearching) {
        performNodeContentSearch();
      } else if (selectedTab === 'yaml-missions' && !isSearching) {
        performMissionContentSearch();
      } else if (selectedTab === 'missions' && !isSearching) {
        performRegularMissionContentSearch();
      }
    }, 300); // Piccolo delay per permettere il caricamento dei dati

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, contentSearchActive]); // Solo selectedTab e contentSearchActive come dipendenze

  useEffect(() => {
    // Riabilita reload quando cambia script (l'utente naviga verso un nuovo script)
    if (preventReload && selectedScript) {
      setPreventReload(false);
    }
    
    const loadDetails = async () => {
      if (!selectedScript) {
        setScriptDetails(null);
        setOriginalBlocks(null);
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
        
  let blocks = json.data.blocks;
        const availableLanguages = json.data.availableLanguages || ['EN', 'DE', 'FR', 'ES', 'PL', 'CS', 'RU'];
        
        // Salva sempre i blocchi originali completi
        setOriginalBlocks(blocks);
        
        // Applica filtro blocchi per la visualizzazione se ricerca attiva
        if (globalSearchTerm && globalSearchTerm.trim()) {
          filterBlocksBySearchTerm(blocks, globalSearchTerm);
        }
        setScriptContent(json.data);
        
        // IMPORTANTE: Estrai i campi di traduzione dai blocchi ORIGINALI completi
        // così i blockPath sono sempre coerenti con lo script completo
        const fields = extractTranslationFields(blocks, availableLanguages);
        setTranslationFields(fields);
        
        // Per compatibilità, mantieni anche allTranslationFields
        setAllTranslationFields(fields);
  
  // Estrai ANCHE i campi da TUTTI i blocchi per il toggle
  const allFields = extractTranslationFields(blocks, availableLanguages);
  setAllTranslationFields(allFields);
        
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
        
        // Crea dettagli compatibili con l'API esistente (per blocchi filtrati)
        const details = fields.map(f => ({
          path: f.blockPath,
          field: f.field,
          label: f.nearestLabel,
          type: f.type,
          en: f.en,
          values: f.values
        }));
        
        // Crea dettagli per TUTTI i blocchi (per il toggle)
        const allDetails = allFields.map(f => ({
          path: f.blockPath,
          field: f.field,
          label: f.nearestLabel,
          type: f.type,
          en: f.en,
          values: f.values
        }));
        
        const scriptDetailsData = {
          script: selectedScript,
          totalFields: fields.length,
          summary,
          details
        };
        
        const allScriptDetailsData = {
          script: selectedScript,
          totalFields: allFields.length,
          summary,
          details: allDetails
        };
        
        setScriptDetails(scriptDetailsData);
        setAllScriptDetails(allScriptDetailsData); // Salva versione completa per toggle
        
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
        setOriginalBlocks(null);
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
    if (!selectedScript || !originalBlocks || !scriptContent) {
      alert('Errore: dati dello script non disponibili');
      return;
    }
    
    try {
      setSaving(true);
      setPreventReload(true); // Blocca qualsiasi ricaricamento durante il salvataggio
      
      // CORREZIONE CRITICA: Applica le modifiche ai blocchi ORIGINALI completi
      // non a quelli filtrati per preservare l'intero script
      const updatedBlocks = applyEditsToBlocks(originalBlocks, translationFields, edits, selectedLang);
      
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
      
      // Aggiorna i dati locali: sia blocchi originali che filtrati
      setOriginalBlocks(updatedBlocks);
      
      // Aggiorna anche i blocchi filtrati per la visualizzazione
      if (globalSearchTerm && globalSearchTerm.trim()) {
        filterBlocksBySearchTerm(updatedBlocks, globalSearchTerm);
      }
      
      // Ricalcola le statistiche con i nuovi valori
      const updatedFields = extractTranslationFields(updatedBlocks, scriptContent.availableLanguages || ['EN', 'DE', 'FR', 'ES', 'PL', 'CS', 'RU']);
      setTranslationFields(updatedFields);
      
      const stats = calculateCoverageStats(updatedFields, selectedLang);
      
      // Aggiornamento ottimistico della coverage nella tabella principale - SPOSTATO PRIMA
      if (coverage && selectedScript && typeof stats.covered === 'number' && stats.covered >= 0) {
        const updatedCoverage = { ...coverage };
        const scriptInCoverage = updatedCoverage.perScript.find(s => s.script === selectedScript);
        if (scriptInCoverage && scriptInCoverage.languages[selectedLang]) {
          // Salva il valore vecchio PRIMA di modificare
          const oldCovered = scriptInCoverage.languages[selectedLang].covered;
          
          // Aggiorna i valori per il singolo script
          scriptInCoverage.languages[selectedLang] = {
            ...scriptInCoverage.languages[selectedLang],
            covered: stats.covered,
            missing: stats.total - stats.covered,
            percent: stats.percent
          };
          
          // Aggiorna anche i totali per lingua se necessario
          if (updatedCoverage.perLanguage[selectedLang] && typeof oldCovered === 'number') {
            const coverageDelta = stats.covered - oldCovered;
            updatedCoverage.perLanguage[selectedLang].covered += coverageDelta;
            updatedCoverage.perLanguage[selectedLang].missing -= coverageDelta;
            
            const totalFields = updatedCoverage.perLanguage[selectedLang].totalFields;
            if (totalFields > 0) {
              updatedCoverage.perLanguage[selectedLang].percent = Math.round((updatedCoverage.perLanguage[selectedLang].covered / totalFields) * 100);
            }
          }
          
          setCoverageForced(updatedCoverage); // Aggiorna coverage ottimisticamente
        }
      }
      
      // Aggiorna scriptDetails DOPO l'aggiornamento ottimistico
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
      
      // Riabilita i ricaricamenti dopo 5 secondi (tempo sufficiente per vedere l'aggiornamento)
      setTimeout(() => {
        setPreventReload(false);
      }, 5000);
      
      alert(`Script salvato con successo! Copertura ${selectedLang}: ${stats.percent}%`);
      
    } catch (error: any) {
      console.error('Error saving script:', error);
      
      // Gestione speciale per errori con dettagli di backup
      if (error.response?.data?.scriptResults) {
        const failedLanguages = error.response.data.scriptResults.filter((result: any) => 
          result.status !== 'success' && result.backupDetails
        );
        
        if (failedLanguages.length > 0) {
          const firstFailed = failedLanguages[0];
          setBackupErrorMessage(error.message || 'Errore durante il salvataggio');
          setBackupErrorDetails(firstFailed.backupDetails);
          setShowBackupErrorModal(true);
          return;
        }
      }
      
      // Fallback per errori senza dettagli di backup
      alert(`Errore durante il salvataggio: ${error.message}`);
    } finally {
      setSaving(false);
      // In caso di errore, riabilita i ricaricamenti immediatamente
      if (preventReload) {
        setPreventReload(false);
      }
    }
  }, [selectedScript, originalBlocks, scriptContent, translationFields, edits, selectedLang, applyEditsToBlocks, extractTranslationFields, calculateCoverageStats, scriptDetails, globalSearchTerm, filterBlocksBySearchTerm]);

  // Funzione per filtrare ricorsivamente i blocchi delle missions
  const filterBlocksRecursively = useCallback((blocks: IFlowBlock[], searchTerm: string): IFlowBlock[] => {
    if (!searchTerm.trim()) return blocks;
    const searchTermLower = searchTerm.toLowerCase();
    
    const filterBlock = (block: IFlowBlock): IFlowBlock | null => {
      // Controlla se il blocco ha testo che matcha
      let hasMatch = false;
      
      // Controlla parameters.text (per SAY, SAYCHAR, etc.)
      if (block.parameters?.text && typeof block.parameters.text === 'object') {
        for (const lang in block.parameters.text) {
          const text = block.parameters.text[lang];
          if (text && typeof text === 'string' && text.toLowerCase().includes(searchTermLower)) {
            hasMatch = true;
            break;
          }
        }
      }
      
      // Controlla text diretto (per OPT)
      if (block.text && typeof block.text === 'object') {
        for (const lang in block.text) {
          const text = block.text[lang];
          if (text && typeof text === 'string' && text.toLowerCase().includes(searchTermLower)) {
            hasMatch = true;
            break;
          }
        }
      }
      
      // Controlla altri parametri string multilingua
      if (block.parameters && typeof block.parameters === 'object') {
        for (const [, value] of Object.entries(block.parameters)) {
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Potrebbe essere un oggetto multilingua
            for (const lang in value as any) {
              const text = (value as any)[lang];
              if (text && typeof text === 'string' && text.toLowerCase().includes(searchTermLower)) {
                hasMatch = true;
                break;
              }
            }
          }
        }
      }
      
      // Filtra ricorsivamente i blocchi figli
      const filteredBlock = { ...block };
      
      // Ricorsione per tutti i tipi di contenitori
      if (block.children) {
        const filteredChildren = filterBlocksRecursively(block.children, searchTerm);
        if (filteredChildren.length > 0) {
          filteredBlock.children = filteredChildren;
          hasMatch = true;
        } else {
          delete filteredBlock.children;
        }
      }
      
      if (block.thenBlocks) {
        const filteredThen = filterBlocksRecursively(block.thenBlocks, searchTerm);
        if (filteredThen.length > 0) {
          filteredBlock.thenBlocks = filteredThen;
          hasMatch = true;
        } else {
          delete filteredBlock.thenBlocks;
        }
      }
      
      if (block.elseBlocks) {
        const filteredElse = filterBlocksRecursively(block.elseBlocks, searchTerm);
        if (filteredElse.length > 0) {
          filteredBlock.elseBlocks = filteredElse;
          hasMatch = true;
        } else {
          delete filteredBlock.elseBlocks;
        }
      }
      
      if (block.blockInit) {
        const filteredInit = filterBlocksRecursively(block.blockInit, searchTerm);
        if (filteredInit.length > 0) {
          filteredBlock.blockInit = filteredInit;
          hasMatch = true;
        } else {
          delete filteredBlock.blockInit;
        }
      }
      
      if (block.blockStart) {
        const filteredStart = filterBlocksRecursively(block.blockStart, searchTerm);
        if (filteredStart.length > 0) {
          filteredBlock.blockStart = filteredStart;
          hasMatch = true;
        } else {
          delete filteredBlock.blockStart;
        }
      }
      
      if (block.blockEvaluate) {
        const filteredEvaluate = filterBlocksRecursively(block.blockEvaluate, searchTerm);
        if (filteredEvaluate.length > 0) {
          filteredBlock.blockEvaluate = filteredEvaluate;
          hasMatch = true;
        } else {
          delete filteredBlock.blockEvaluate;
        }
      }
      
      // IMPORTANTE: Per i blocchi contenitori (BUILD, FLIGHT, IF, etc), 
      // mantienili se hanno figli con match anche se il blocco stesso non ha testo
      if (!hasMatch) {
        // Controlla se è un contenitore con almeno un figlio
        const hasChildren = (filteredBlock.children?.length || 0) > 0 || 
                          (filteredBlock.thenBlocks?.length || 0) > 0 || 
                          (filteredBlock.elseBlocks?.length || 0) > 0 ||
                          (filteredBlock.blockInit?.length || 0) > 0 ||
                          (filteredBlock.blockStart?.length || 0) > 0 ||
                          (filteredBlock.blockEvaluate?.length || 0) > 0;
        
        if (hasChildren) {
          hasMatch = true;
        }
      }
      
      return hasMatch ? filteredBlock : null;
    };
    
    return blocks.map(filterBlock).filter(b => b !== null) as IFlowBlock[];
  }, []);
  
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
      
      let allBlocks = [
        ...(json.data.blocksMission || []),
        ...(json.data.blocksFinish || [])
      ];
      const availableLanguages = json.data.availableLanguages || ['EN', 'DE', 'FR', 'ES', 'PL', 'CS', 'RU'];
      
      setMissionContent(json.data);
      
      // Estrai TUTTI i campi di traduzione dai blocchi (NON filtrati)
      const allFields = extractTranslationFields(allBlocks, availableLanguages);
      
      // Applica filtro sui campi estratti se ricerca attiva
      let fields = allFields;
      if (globalSearchTerm && globalSearchTerm.trim()) {
        const searchTermLower = globalSearchTerm.toLowerCase();
        fields = allFields.filter(field => {
          // Controlla se il campo contiene il termine cercato in QUALSIASI lingua
          for (const [, value] of Object.entries(field.values)) {
            if (value && typeof value === 'string' && value.toLowerCase().includes(searchTermLower)) {
              return true;
            }
          }
          return false;
        });
      }
      
      setTranslationFields(fields);
      setAllTranslationFields(allFields); // Salva copia completa per toggle
      
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
  }, [extractTranslationFields, calculateCoverageStats, filterBlocksRecursively, globalSearchTerm]);

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
      setAllTranslationFields(updatedFields); // Salva copia completa per toggle
      
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
      
      // Aggiornamento ottimistico della coverage nella tabella principale per le missioni - SPOSTATO ALLA FINE
      if (missionsCoverage && selectedMission && typeof stats.covered === 'number' && stats.covered >= 0) {
        const updatedMissionsCoverage = { ...missionsCoverage };
        const missionInCoverage = updatedMissionsCoverage.perMission.find((m: any) => m.mission === selectedMission);
        if (missionInCoverage && missionInCoverage.languages[selectedLang]) {
          // Salva il valore vecchio PRIMA di modificare
          const oldCovered = missionInCoverage.languages[selectedLang].covered;
          
          
          // Aggiorna i valori per la singola missione
          missionInCoverage.languages[selectedLang] = {
            ...missionInCoverage.languages[selectedLang],
            covered: stats.covered,
            missing: stats.total - stats.covered,
            percent: stats.percent
          };
          
          // Aggiorna anche i totali per lingua se necessario
          if (updatedMissionsCoverage.perLanguage[selectedLang] && typeof oldCovered === 'number') {
            const coverageDelta = stats.covered - oldCovered;
            
            
            updatedMissionsCoverage.perLanguage[selectedLang].covered += coverageDelta;
            updatedMissionsCoverage.perLanguage[selectedLang].missing -= coverageDelta;
            
            const totalFields = updatedMissionsCoverage.perLanguage[selectedLang].totalFields;
            if (totalFields > 0) {
              updatedMissionsCoverage.perLanguage[selectedLang].percent = Math.round((updatedMissionsCoverage.perLanguage[selectedLang].covered / totalFields) * 100);
            }
          }
          
          setMissionsCoverage(updatedMissionsCoverage);
        }
      }
      
      alert(`Mission salvata con successo! Copertura ${selectedLang}: ${stats.percent}%`);
      
    } catch (error: any) {
      console.error('Error saving mission:', error);
      alert(`Errore durante il salvataggio: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }, [selectedMission, missionContent, translationFields, edits, selectedLang, applyEditsToBlocks, extractTranslationFields, calculateCoverageStats, missionDetails, ensureBlockIds]);

  // Funzioni per salvare traduzioni nodes.yaml
  const saveNodesTranslations = useCallback(async () => {
    if (!nodesData || !selectedNode) {
      alert('Errore: dati del nodo non disponibili');
      return;
    }

    try {
      setSaving(true);
      
      // Prepara i dati nel formato richiesto dall'API
      const updatedItems = nodesData.items.map((item: any) => {
        const key = `nodes|${item.id}|${selectedLang}`;
        const captionEdit = edits[`${key}_caption`];
        const descriptionEdit = edits[`${key}_description`];
        
        const updatedTranslations = { ...item.translations };
        const currentLangTranslation = { ...updatedTranslations[selectedLang] };
        
        if (captionEdit !== undefined) {
          currentLangTranslation.caption = captionEdit;
        }
        if (descriptionEdit !== undefined) {
          currentLangTranslation.description = descriptionEdit;
        }
        
        // Gestione buttons
        if (item.translations['EN']?.buttons && Array.isArray(item.translations['EN'].buttons)) {
          const updatedButtons = [...(currentLangTranslation.buttons || [])];
          
          item.translations['EN'].buttons.forEach((enButton: any, buttonIndex: number) => {
            const buttonKey = `${selectedTab}|${item.id}|${selectedLang}_button_${enButton.id}`;
            const buttonEdit = edits[buttonKey];
            
            if (buttonEdit !== undefined) {
              // Assicurati che l'array buttons esista e sia della lunghezza corretta
              while (updatedButtons.length <= buttonIndex) {
                updatedButtons.push({ id: '', action: '', text: '' });
              }
              
              updatedButtons[buttonIndex] = {
                id: enButton.id,
                action: enButton.action,
                text: buttonEdit
              };
            }
          });
          
          currentLangTranslation.buttons = updatedButtons;
        }
        
        updatedTranslations[selectedLang] = currentLangTranslation;
        
        return {
          ...item,
          translations: updatedTranslations
        };
      });

      const response = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.LOCALIZATION_NODES_SAVE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: updatedItems })
      });

      if (!response.ok) {
        throw new Error('Failed to save nodes translations');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Save failed');
      }

      alert('Traduzioni nodi salvate con successo!');
      
      // Ricarica i dati
      await loadNodesData();

    } catch (error: any) {
      console.error('Error saving nodes translations:', error);
      alert(`Errore durante il salvataggio: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }, [nodesData, selectedNode, selectedLang, edits, loadNodesData, selectedTab]);

  // Funzioni per salvare traduzioni missions.yaml
  const saveYamlMissionsTranslations = useCallback(async () => {
    if (!yamlMissionsData || selectedYamlMissions.size === 0) {
      alert('Errore: nessuna mission selezionata');
      return;
    }

    try {
      setSaving(true);
      
      // Prepara i dati nel formato richiesto dall'API
      const updatedItems = yamlMissionsData.items.map((item: any) => {
        const key = `yaml-missions|${item.id}|${selectedLang}`;
        const captionEdit = edits[`${key}_caption`];
        const descriptionEdit = edits[`${key}_description`];
        
        const updatedTranslations = { ...item.translations };
        if (captionEdit !== undefined) {
          updatedTranslations[selectedLang] = {
            ...updatedTranslations[selectedLang],
            caption: captionEdit
          };
        }
        if (descriptionEdit !== undefined) {
          updatedTranslations[selectedLang] = {
            ...updatedTranslations[selectedLang],
            description: descriptionEdit
          };
        }
        
        return {
          ...item,
          translations: updatedTranslations
        };
      });

      const response = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.LOCALIZATION_MISSIONS_SAVE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: updatedItems })
      });

      if (!response.ok) {
        throw new Error('Failed to save yaml missions translations');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Save failed');
      }

      alert('Traduzioni missions YAML salvate con successo!');
      
      // Ricarica i dati
      await loadYamlMissionsData();

    } catch (error: any) {
      console.error('Error saving yaml missions translations:', error);
      alert(`Errore durante il salvataggio: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }, [yamlMissionsData, selectedYamlMissions, selectedLang, edits, loadYamlMissionsData]);

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


  // Funzione per calcolare la copertura dinamica considerando gli edits
  const calculateDynamicCoverage = useCallback((itemName: string, basePercent: number, baseCovered: number, baseTotal: number) => {
    let dynamicCovered = baseCovered;

    if (selectedTab === 'scripts' || selectedTab === 'missions') {
      const relevantDetails = selectedTab === 'scripts' && selectedScript === itemName ? scriptDetails 
                            : selectedTab === 'missions' && selectedMission === itemName ? missionDetails 
                            : null;

      if (relevantDetails?.details) {
        // Per ogni campo nel dettaglio, controlla se c'è un edit
        relevantDetails.details.forEach((detail: any, idx: number) => {
          const editKey = `${itemName}|${idx}|${selectedLang}`;
          const editValue = edits[editKey];
          const originalValue = detail.values?.[selectedLang] || '';
          const enValue = detail.en || '';

          // Controlla stato originale
          const wasTranslated = originalValue && originalValue.trim() !== '' && originalValue.trim() !== enValue.trim();
          
          // Controlla stato con edit
          const currentValue = editValue !== undefined ? editValue : originalValue;
          const isNowTranslated = currentValue && currentValue.trim() !== '' && currentValue.trim() !== enValue.trim();

          if (wasTranslated !== isNowTranslated) {
            if (isNowTranslated && !wasTranslated) {
              dynamicCovered++; // Campo ora tradotto
            } else if (!isNowTranslated && wasTranslated) {
              dynamicCovered--; // Campo non più tradotto
            }
          }
        });
      }
    } else if (selectedTab === 'strings') {
      // Per strings, il calcolo dinamico viene gestito dal componente interno
      // poiché usa updateString invece di setEdits direttamente
      return { percent: basePercent, covered: baseCovered, totalFields: baseTotal };
    } else if (selectedTab === 'nodes') {
      // Per nodes, il calcolo dinamico sarà gestito quando avremo accesso ai dati del nodo
      // Attualmente i nodes usano edits ma necessitiamo dei dati specifici del nodo
      return { percent: basePercent, covered: baseCovered, totalFields: baseTotal };
    } else if (selectedTab === 'yaml-missions') {
      // Per yaml-missions, controlla gli edits nelle missioni
      if (yamlMissionsData?.items) {
        const missionData = yamlMissionsData.items.find((item: any) => item.id === itemName);
        if (missionData) {
          const fields = ['caption', 'description'];
          fields.forEach((field) => {
            const editKey = `yaml-missions|${itemName}|${selectedLang}_${field}`;
            const editValue = edits[editKey];
            const originalValue = missionData.translations?.[selectedLang]?.[field] || '';
            const enValue = missionData.translations?.['EN']?.[field] || '';

            if (enValue) {
              const wasTranslated = originalValue && originalValue.trim() !== '' && originalValue.trim() !== enValue.trim();
              const currentValue = editValue !== undefined ? editValue : originalValue;
              const isNowTranslated = currentValue && currentValue.trim() !== '' && currentValue.trim() !== enValue.trim();

              if (wasTranslated !== isNowTranslated) {
                if (isNowTranslated && !wasTranslated) {
                  dynamicCovered++;
                } else if (!isNowTranslated && wasTranslated) {
                  dynamicCovered--;
                }
              }
            }
          });

          // Controlla buttons
          if (missionData.translations?.['EN']?.buttons && Array.isArray(missionData.translations['EN'].buttons)) {
            missionData.translations['EN'].buttons.forEach((enButton: any, buttonIndex: number) => {
              if (enButton.text) {
                const editKey = `yaml-missions|${itemName}|${selectedLang}_button_${buttonIndex}`;
                const editValue = edits[editKey];
                const originalButton = missionData.translations?.[selectedLang]?.buttons?.[buttonIndex];
                const originalValue = originalButton?.text || '';
                const enValue = enButton.text;

                const wasTranslated = originalValue && originalValue.trim() !== '' && originalValue.trim() !== enValue.trim();
                const currentValue = editValue !== undefined ? editValue : originalValue;
                const isNowTranslated = currentValue && currentValue.trim() !== '' && currentValue.trim() !== enValue.trim();

                if (wasTranslated !== isNowTranslated) {
                  if (isNowTranslated && !wasTranslated) {
                    dynamicCovered++;
                  } else if (!isNowTranslated && wasTranslated) {
                    dynamicCovered--;
                  }
                }
              }
            });
          }
        }
      }
    }

    const dynamicPercent = baseTotal > 0 ? Math.round((dynamicCovered / baseTotal) * 100) : 100;
    return { percent: dynamicPercent, covered: dynamicCovered, totalFields: baseTotal };
  }, [selectedTab, selectedScript, selectedMission, scriptDetails, missionDetails, selectedCategory, yamlMissionsData, edits, selectedLang]);

  // Chiudi i dettagli se gli script selezionati non sono più visibili nel filtro
  useEffect(() => {
    // Solo se abbiamo dati di coverage (almeno uno)
    if (!coverage && !missionsCoverage && !nodesData && !yamlMissionsData) return;

    // Calcola gli elementi visibili applicando i filtri
    let currentSorted: any[] = [];
    if (selectedTab === 'scripts') {
      currentSorted = scriptsSorted;
    } else if (selectedTab === 'missions') {
      currentSorted = missionsSorted;
    } else {
      // Per strings, nodes, yaml-missions non abbiamo ancora sorted arrays
      // Salta il controllo per queste sezioni per ora
      return;
    }

    const filtered = filterItems(currentSorted, globalSearchTerm);
    const visibleItems = filtered.filter((item: any) => {
      const d = item.languages?.[selectedLang];
      if (!d) return false;
      const dynamicStats = calculateDynamicCoverage(item.script || item.mission || item.category || item.node || '', d.percent, d.covered, d.totalFields);
      return !onlyMissing || dynamicStats.percent < 100;
    });

    const visibleNames = new Set(visibleItems.map((item: any) => item.script || item.mission || item.category || item.node || ''));
    
    // Chiudi script se non più visibile
    if (selectedScript && !visibleNames.has(selectedScript)) {
      setSelectedScript(null);
    }
    
    // Chiudi mission se non più visibile 
    if (selectedMission && !visibleNames.has(selectedMission)) {
      setSelectedMission(null);
    }
    
    // Chiudi node se non più visibile
    if (selectedNode && !visibleNames.has(selectedNode)) {
      setSelectedNode(null);
    }
    
    // Chiudi category se non più visibile
    if (selectedCategory && !visibleNames.has(selectedCategory.nome)) {
      setSelectedCategory(null);
    }
    
    // Per yaml-missions, rimuovi quelli non più visibili
    if (selectedYamlMissions.size > 0) {
      const newYamlMissions = new Set(Array.from(selectedYamlMissions).filter(name => visibleNames.has(name)));
      if (newYamlMissions.size !== selectedYamlMissions.size) {
        setSelectedYamlMissions(newYamlMissions);
      }
    }
  }, [coverage, missionsCoverage, selectedTab, globalSearchTerm, selectedLang, onlyMissing, selectedScript, selectedMission, scriptsSorted, missionsSorted, filterItems, calculateDynamicCoverage]);

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
  } else if (selectedTab === 'nodes') {
    // Per nodes, creiamo una struttura coverage dai dati nodesData
    if (nodesData && nodesData.items) {
      const globalLanguageStats: PerLanguage = {};
      
      // Calcola le statistiche per ogni lingua (escludendo EN)
      const availableLanguages = Object.keys(nodesData.items[0]?.translations || {}).filter(lang => lang !== 'EN');
      
      for (const lang of availableLanguages) {
        let totalCovered = 0;
        let totalFields = 0;
        
        for (const item of nodesData.items) {
          const translations = item.translations[lang] || {};
          const enTranslations = item.translations['EN'] || {};
          
          // Conta caption
          if (enTranslations.caption) {
            totalFields++;
            if (translations.caption && translations.caption.trim() !== '' && translations.caption !== enTranslations.caption) {
              totalCovered++;
            }
          }
          
          // Conta description
          if (enTranslations.description) {
            totalFields++;
            if (translations.description && translations.description.trim() !== '' && translations.description !== enTranslations.description) {
              totalCovered++;
            }
          }
          
          // Conta buttons
          if (enTranslations.buttons && Array.isArray(enTranslations.buttons)) {
            enTranslations.buttons.forEach((enButton: any, buttonIndex: number) => {
              if (enButton && enButton.text) {
                totalFields++;
                const translatedButton = translations.buttons?.[buttonIndex];
                if (translatedButton && translatedButton.text && translatedButton.text.trim() !== '' && translatedButton.text !== enButton.text) {
                  totalCovered++;
                }
              }
            });
          }
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
        perScript: []
      };
    }
  } else if (selectedTab === 'yaml-missions') {
    // Per yaml-missions, creiamo una struttura coverage dai dati yamlMissionsData
    if (yamlMissionsData && yamlMissionsData.items) {
      const globalLanguageStats: PerLanguage = {};
      
      // Calcola le statistiche per ogni lingua (escludendo EN)
      const availableLanguages = Object.keys(yamlMissionsData.items[0]?.translations || {}).filter(lang => lang !== 'EN');
      
      for (const lang of availableLanguages) {
        let totalCovered = 0;
        let totalFields = 0;
        
        for (const item of yamlMissionsData.items) {
          const translations = item.translations[lang] || {};
          const enTranslations = item.translations['EN'] || {};
          
          // Conta caption
          if (enTranslations.caption) {
            totalFields++;
            if (translations.caption && translations.caption.trim() !== '' && translations.caption !== enTranslations.caption) {
              totalCovered++;
            }
          }
          
          // Conta description
          if (enTranslations.description) {
            totalFields++;
            if (translations.description && translations.description.trim() !== '' && translations.description !== enTranslations.description) {
              totalCovered++;
            }
          }
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
    } else if (selectedTab === 'nodes') {
      // Per nodes, se non abbiamo dati potrebbe essere in caricamento
      return <div className="p-6 text-gray-300">{t('common.loading')}</div>;
    } else if (selectedTab === 'yaml-missions') {
      // Per yaml-missions, se non abbiamo dati potrebbe essere in caricamento
      return <div className="p-6 text-gray-300">{t('common.loading')}</div>;
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
  } else if (selectedTab === 'nodes') {
    // Per nodes, usiamo nodesData.items come "sorted"
    currentSorted = nodesData?.items?.map((node: any) => ({
      node: node.id,
      languages: Object.keys(node.translations).filter(lang => lang !== 'EN').reduce((acc: any, lang: string) => {
        const translations = node.translations[lang] || {};
        const enTranslations = node.translations['EN'] || {};
        
        let covered = 0;
        let total = 0;
        
        // Conta caption
        if (enTranslations.caption) {
          total++;
          if (translations.caption && translations.caption.trim() !== '' && translations.caption !== enTranslations.caption) {
            covered++;
          }
        }
        
        // Conta description
        if (enTranslations.description) {
          total++;
          if (translations.description && translations.description.trim() !== '' && translations.description !== enTranslations.description) {
            covered++;
          }
        }
        
        // Conta buttons
        if (enTranslations.buttons && Array.isArray(enTranslations.buttons)) {
          enTranslations.buttons.forEach((enButton: any, buttonIndex: number) => {
            if (enButton && enButton.text) {
              total++;
              const translatedButton = translations.buttons?.[buttonIndex];
              if (translatedButton && translatedButton.text && translatedButton.text.trim() !== '' && translatedButton.text !== enButton.text) {
                covered++;
              }
            }
          });
        }
        
        acc[lang] = {
          covered: covered,
          missing: total - covered,
          different: covered,
          totalFields: total,
          percent: total > 0 ? Math.round((covered / total) * 100) : 0
        };
        return acc;
      }, {})
    })) || [];
    currentDetails = selectedNode ? nodesData?.items?.find((item: any) => item.id === selectedNode) : null;
    currentSaveFunction = saveNodesTranslations;
  } else if (selectedTab === 'yaml-missions') {
    // Per yaml-missions, usiamo yamlMissionsData.items come "sorted"
    currentSorted = yamlMissionsData?.items?.map((mission: any) => ({
      mission: mission.id,
      languages: Object.keys(mission.translations).filter(lang => lang !== 'EN').reduce((acc: any, lang: string) => {
        const translations = mission.translations[lang] || {};
        const enTranslations = mission.translations['EN'] || {};
        
        let covered = 0;
        let total = 0;
        
        // Conta caption
        if (enTranslations.caption) {
          total++;
          if (translations.caption && translations.caption.trim() !== '' && translations.caption !== enTranslations.caption) {
            covered++;
          }
        }
        
        // Conta description
        if (enTranslations.description) {
          total++;
          if (translations.description && translations.description.trim() !== '' && translations.description !== enTranslations.description) {
            covered++;
          }
        }
        
        acc[lang] = {
          covered: covered,
          missing: total - covered,
          different: covered,
          totalFields: total,
          percent: total > 0 ? Math.round((covered / total) * 100) : 0
        };
        return acc;
      }, {})
    })) || [];
    // Per yaml-missions supportiamo apertura multipla, non c'è currentDetails singolo
    currentDetails = null;
    currentSaveFunction = saveYamlMissionsTranslations;
  }
  
  // Funzione per ordinare gli elementi
  const sortItems = (items: any[]) => {
    if (!items || items.length === 0) return items;
    
    return [...items].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      if (sortField === 'name') {
        // Ottieni il nome dell'elemento in base al tipo di tab
        if (selectedTab === 'scripts') {
          aValue = a.script?.toLowerCase() || '';
          bValue = b.script?.toLowerCase() || '';
        } else if (selectedTab === 'missions') {
          aValue = a.mission?.toLowerCase() || '';
          bValue = b.mission?.toLowerCase() || '';
        } else if (selectedTab === 'strings') {
          aValue = a.category?.toLowerCase() || '';
          bValue = b.category?.toLowerCase() || '';
        } else if (selectedTab === 'nodes') {
          aValue = a.node?.toLowerCase() || '';
          bValue = b.node?.toLowerCase() || '';
        } else if (selectedTab === 'yaml-missions') {
          aValue = a.mission?.toLowerCase() || '';
          bValue = b.mission?.toLowerCase() || '';
        }
      } else if (sortField === 'percent') {
        // Ottieni la percentuale per la lingua selezionata
        const langData = a.languages?.[selectedLang] || {};
        const langDataB = b.languages?.[selectedLang] || {};
        aValue = langData.percent || 0;
        bValue = langDataB.percent || 0;
      }
      
      // Confronta i valori
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };
  
  // Applica ordinamento e poi filtro di ricerca globale
  const sortedItems = sortItems(currentSorted);
  const filteredSorted = filterItems(sortedItems, globalSearchTerm);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-4 bg-slate-800 border border-slate-700 rounded-lg p-4">
        <button
          className={`px-4 py-2 rounded ${selectedTab === 'scripts' ? 'bg-slate-800 text-white border-2 border-slate-400' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
          onClick={() => {
            setSelectedTab('scripts');
            setSortField('name');
            setSortDirection('asc');
          }}
        >
          📜 Scripts
        </button>
        <button
          className={`px-4 py-2 rounded ${selectedTab === 'missions' ? 'bg-slate-800 text-white border-2 border-slate-400' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
          onClick={() => {
            setSelectedTab('missions');
            setSortField('name');
            setSortDirection('asc');
          }}
        >
          🚀 Missions
        </button>
        <button
          className={`px-4 py-2 rounded ${selectedTab === 'strings' ? 'bg-slate-800 text-white border-2 border-slate-400' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
          onClick={() => {
            setSelectedTab('strings');
            setSortField('name');
            setSortDirection('asc');
          }}
        >
          🌐 Strings
        </button>
        <button
          className={`px-4 py-2 rounded ${selectedTab === 'nodes' ? 'bg-slate-800 text-white border-2 border-slate-400' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
          onClick={() => {
            setSelectedTab('nodes');
            setSortField('name');
            setSortDirection('asc');
          }}
        >
          🏠 Nodes
        </button>
        <button
          className={`px-4 py-2 rounded ${selectedTab === 'yaml-missions' ? 'bg-slate-800 text-white border-2 border-slate-400' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
          onClick={() => {
            setSelectedTab('yaml-missions');
            setSortField('name');
            setSortDirection('asc');
          }}
        >
          📍 Missions YAML
        </button>
      </div>

      {/* Search Field */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <label className="text-white font-semibold">
            🔍 Ricerca: {isSearching && (
              <span className="text-yellow-400 ml-2">⏳ Cercando nel contenuto...</span>
            )}
          </label>
          <input
            type="text"
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-slate-400"
            placeholder="Cerca per nome elemento, testo EN o testo nella lingua corrente..."
            value={globalSearchTerm}
            onChange={(e) => setGlobalSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && globalSearchTerm.trim()) {
                if (selectedTab === 'scripts') {
                  performScriptContentSearch();
                } else if (selectedTab === 'strings') {
                  performStringContentSearch();
                } else if (selectedTab === 'nodes') {
                  performNodeContentSearch();
                } else if (selectedTab === 'yaml-missions') {
                  performMissionContentSearch();
                } else if (selectedTab === 'missions') {
                  performRegularMissionContentSearch();
                }
              }
            }}
          />
          {selectedTab === 'scripts' && globalSearchTerm && (
            <button
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 rounded disabled:opacity-50"
              onClick={performScriptContentSearch}
              disabled={isSearching}
            >
              {isSearching ? '⏳' : '🔍'} Cerca nel contenuto
            </button>
          )}
          {selectedTab === 'strings' && globalSearchTerm && (
            <button
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 rounded disabled:opacity-50"
              onClick={performStringContentSearch}
              disabled={isSearching}
            >
              {isSearching ? '⏳' : '🔍'} Cerca nel contenuto
            </button>
          )}
          {selectedTab === 'nodes' && globalSearchTerm && (
            <button
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 rounded disabled:opacity-50"
              onClick={performNodeContentSearch}
              disabled={isSearching}
            >
              {isSearching ? '⏳' : '🔍'} Cerca nel contenuto
            </button>
          )}
          {selectedTab === 'yaml-missions' && globalSearchTerm && (
            <button
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 rounded disabled:opacity-50"
              onClick={performMissionContentSearch}
              disabled={isSearching}
            >
              {isSearching ? '⏳' : '🔍'} Cerca nel contenuto
            </button>
          )}
          {selectedTab === 'missions' && globalSearchTerm && (
            <button
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 rounded disabled:opacity-50"
              onClick={performRegularMissionContentSearch}
              disabled={isSearching}
            >
              {isSearching ? '⏳' : '🔍'} Cerca nel contenuto
            </button>
          )}
          {globalSearchTerm && (
            <button
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 rounded"
              onClick={() => {
                setGlobalSearchTerm('');
                setContentSearchActive(false);
                setFilteredScriptNames(new Set());
                setFilteredStringCategories(new Set());
                setFilteredNodesNames(new Set());
                setFilteredMissionsNames(new Set());
                setFilteredRegularMissions(new Set());
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Overview */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h2 className="text-white font-semibold mb-2">
          {selectedTab === 'scripts' ? 'Scripts' : 
           selectedTab === 'missions' ? 'Missions' : 
           selectedTab === 'strings' ? 'Localization Strings' :
           selectedTab === 'nodes' ? 'Nodes YAML' :
           selectedTab === 'yaml-missions' ? 'Missions YAML' : 'Translations'} Overview
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
      <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg p-3">
        <div className="flex items-center gap-4">
          <label className="text-gray-300 text-sm">Lingua</label>
          <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className="bg-slate-700 text-gray-200 border border-slate-600 rounded px-2 py-1">
            {langs.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <label className="flex items-center gap-2 text-gray-300 text-sm">
            <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
            Solo mancanti
          </label>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Ordinamento:</span>
          <span className="text-blue-400 font-medium">
            {sortField === 'name' ? 
              (selectedTab === 'scripts' ? 'Script' : 
               selectedTab === 'missions' ? 'Mission' : 
               selectedTab === 'strings' ? 'Category' :
               selectedTab === 'nodes' ? 'Node' :
               selectedTab === 'yaml-missions' ? 'Mission' : 'Nome') 
              : 'Percentuale'}
          </span>
          <span className="text-blue-400 font-bold">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        </div>
      </div>

      {/* Content table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm table-fixed">
          <thead className="bg-slate-900 text-gray-300">
            <tr>
              <th 
                className="px-3 py-2 w-[45%] cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => {
                  if (sortField === 'name') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField('name');
                    setSortDirection('asc');
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <span>
                    {selectedTab === 'scripts' ? 'Script' : 
                     selectedTab === 'missions' ? 'Mission' : 
                     selectedTab === 'strings' ? 'Category' :
                     selectedTab === 'nodes' ? 'Node' :
                     selectedTab === 'yaml-missions' ? 'Mission' : 'Item'}
                  </span>
                  <div className="flex flex-col">
                    <span className={`text-xs ${sortField === 'name' && sortDirection === 'asc' ? 'text-blue-400' : 'text-gray-500'}`}>▲</span>
                    <span className={`text-xs ${sortField === 'name' && sortDirection === 'desc' ? 'text-blue-400' : 'text-gray-500'}`}>▼</span>
                  </div>
                </div>
              </th>
              <th 
                className="px-3 py-2 w-[20%] cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => {
                  if (sortField === 'percent') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField('percent');
                    setSortDirection('desc'); // Default decrescente per percentuali
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <span>% {selectedLang}</span>
                  <div className="flex flex-col">
                    <span className={`text-xs ${sortField === 'percent' && sortDirection === 'asc' ? 'text-blue-400' : 'text-gray-500'}`}>▲</span>
                    <span className={`text-xs ${sortField === 'percent' && sortDirection === 'desc' ? 'text-blue-400' : 'text-gray-500'}`}>▼</span>
                  </div>
                </div>
              </th>
              <th className="px-3 py-2 w-[35%]">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredSorted.map((item: any) => {
              const d = item.languages[selectedLang];
              if (!d) return null;
              // Show in Solo mancanti only if completion < 100 (usando calcolo dinamico)
              const dynamicStats = calculateDynamicCoverage(item.script || item.mission || item.category || item.node || '', d.percent, d.covered, d.totalFields);
              if (onlyMissing && (dynamicStats.percent >= 100)) return null;
              
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
              } else if (selectedTab === 'nodes') {
                itemName = item.node || '';
                isOpen = selectedNode === itemName;
              } else if (selectedTab === 'yaml-missions') {
                itemName = item.mission || '';
                isOpen = selectedYamlMissions.has(itemName);
              }
              return (
                <React.Fragment key={itemName}>
                  <tr className="hover:bg-slate-700/40">
                    <td className="px-3 py-2 text-gray-200 w-[45%] truncate" title={itemName}>{itemName}</td>
                    <td className="px-3 py-2 text-gray-300 w-[20%]">
                      {(() => {
                        const dynamicStats = calculateDynamicCoverage(itemName, d.percent, d.covered, d.totalFields);
                        return (
                          <>
                            <span style={{backgroundColor: preventReload ? 'red' : 'transparent', color: preventReload ? 'white' : 'inherit'}}>
                              {dynamicStats.percent}% <span className="text-xs text-gray-500">({dynamicStats.covered}/{dynamicStats.totalFields})</span>
                              {preventReload && <span className="text-xs text-white ml-2">[LOCKED]</span>}
                            </span>
                            {/* Copertura IT */}
                            {selectedLang === 'IT' && (
                              <div className="text-xs text-blue-400 mt-1">
                                IT: {currentCoverage?.perLanguage?.['IT']?.percent || 0}%
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2 text-gray-300 w-[35%]">
                      <div className="flex items-center space-x-2">
                        {/* 1) Mostra Dettagli/Nascondi Dettagli */}
                        <button 
                          className="bg-slate-700 hover:bg-slate-600 text-white border border-slate-500" 
                          title={isOpen ? 'Nascondi Dettagli' : 'Mostra Dettagli'}
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
                            } else if (selectedTab === 'nodes') {
                              setSelectedNode(isOpen ? null : itemName);
                            } else if (selectedTab === 'yaml-missions') {
                              const newSet = new Set(selectedYamlMissions);
                              if (isOpen) {
                                newSet.delete(itemName);
                              } else {
                                newSet.add(itemName);
                              }
                              setSelectedYamlMissions(newSet);
                            }
                          }}
                          style={{ fontSize: '35px', lineHeight: '35px', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          {isOpen ? '👁️‍🗨️' : '👁️'}
                        </button>
                        {/* 2) Se presente Apri Visual Flow */}
                        {selectedTab === 'scripts' && (
                          <button 
                            className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded transition-colors"
                            title="Apri in Visual Flow Editor"
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('navigateToVisualFlow', { detail: { scriptName: itemName } as any }));
                            }}
                            style={{ fontSize: '35px', lineHeight: '35px', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            🎯
                          </button>
                        )}
                        {selectedTab === 'missions' && (
                          <button 
                            className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded transition-colors"
                            title="Apri in Visual Flow Editor"
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('navigateToVisualFlowMission', { detail: { missionName: itemName } as any }));
                            }}
                            style={{ fontSize: '35px', lineHeight: '35px', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            🎯
                          </button>
                        )}
                        {/* 3) Salva - attivo solo se dettaglio aperto */}
                        {isOpen && (
                          <button
                            disabled={saving || (selectedTab !== 'yaml-missions' && !currentDetails) || (selectedTab === 'yaml-missions' && selectedYamlMissions.size === 0)}
                            className={`bg-slate-700 hover:bg-slate-600 text-white border border-slate-500 ${(saving || (selectedTab !== 'yaml-missions' && !currentDetails) || (selectedTab === 'yaml-missions' && selectedYamlMissions.size === 0)) ? 'opacity-60 cursor-not-allowed' : ''}`}
                            title={saving ? 'Salvando...' : 'Salva Modifiche'}
                            onClick={currentSaveFunction}
                            style={{ fontSize: '35px', lineHeight: '35px', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {saving ? '⏳' : '💾'}
                          </button>
                        )}
                        {/* 4) AI All - attivo solo se dettaglio aperto */}
                        {isOpen && (
                          <button
                            disabled={saving || (selectedTab !== 'yaml-missions' && !currentDetails) || (selectedTab === 'yaml-missions' && selectedYamlMissions.size === 0)}
                            className={`bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded transition-colors ${(saving || (selectedTab !== 'yaml-missions' && !currentDetails) || (selectedTab === 'yaml-missions' && selectedYamlMissions.size === 0)) ? 'opacity-60 cursor-not-allowed' : ''}`}
                            title="Suggerimenti IA per tutti i campi"
                            onClick={async () => {
                              if (selectedTab !== 'yaml-missions' && !currentDetails) return;
                              if (selectedTab === 'yaml-missions' && selectedYamlMissions.size === 0) return;
                              try {
                                setSaving(true);
                                
                                if (selectedTab === 'strings' && selectedCategory) {
                                  // Per le strings, usa la nuova API
                                  const result = await translateCategory(selectedCategory.id, 'EN', currentLanguage);
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
                                } else if (selectedTab === 'nodes') {
                                  // Per nodes, usa batch API come per scripts
                                  const itemData = currentDetails;
                                  const fieldsToTranslate = [
                                    ...(itemData?.translations['EN']?.caption ? [{
                                      field: 'caption',
                                      text: itemData.translations['EN'].caption
                                    }] : []),
                                    ...(itemData?.translations['EN']?.description ? [{
                                      field: 'description', 
                                      text: itemData.translations['EN'].description
                                    }] : []),
                                    ...(itemData?.translations['EN']?.buttons && Array.isArray(itemData.translations['EN'].buttons) ? 
                                      itemData.translations['EN'].buttons.map((button: any, buttonIndex: number) => ({
                                        field: `button_${button.id}`,
                                        text: button.text || ''
                                      })).filter((button: any) => button.text) : [])
                                  ];

                                  if (fieldsToTranslate.length > 0) {
                                    const items = fieldsToTranslate.map(field => ({
                                      textEN: field.text,
                                      metacodesDetected: (field.text.match(/\[[^\]]+\]/g) || [])
                                    }));
                                    
                                    const resp = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_AI_TRANSLATE_BATCH}`, {
                                      method: 'POST', 
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ items, langTarget: currentLanguage })
                                    });
                                    
                                    const j = await resp.json();
                                    if (!resp.ok || !j?.success) throw new Error(j?.message || 'batch failed');
                                    
                                    const suggestions: string[] = j.data?.suggestions || [];
                                    
                                    // Popola tutte le textarea con le traduzioni (rimuovi prefissi numerati)
                                    const updatedEdits: Record<string, string> = {};
                                    fieldsToTranslate.forEach((field, idx) => {
                                      if (suggestions[idx]) {
                                        let cleanTranslation = suggestions[idx];
                                        
                                        // Rimuovi prefissi numerati tipo "1. ", "2. ", etc.
                                        cleanTranslation = cleanTranslation.replace(/^\d+\.\s*/, '');
                                        
                                        // Rimuovi eventuali spazi iniziali/finali
                                        cleanTranslation = cleanTranslation.trim();
                                        
                                        const key = `${selectedTab}|${currentDetails.id}|${selectedLang}_${field.field}`;
                                        updatedEdits[key] = cleanTranslation;
                                      }
                                    });
                                    
                                    setEdits(prev => ({ ...prev, ...updatedEdits }));
                                    alert(`Tutti i ${fieldsToTranslate.length} campi sono stati tradotti in ${selectedLang}!`);
                                  }
                                } else if (selectedTab === 'yaml-missions') {
                                  // Per yaml-missions, processa tutte le missioni selezionate
                                  const allFields: any[] = [];
                                  const fieldMapping: any[] = [];
                                  
                                  // Per ogni missione selezionata
                                  for (const missionId of selectedYamlMissions) {
                                    const missionData = yamlMissionsData?.items?.find((item: any) => item.id === missionId);
                                    if (!missionData) continue;
                                    
                                    // Aggiungi caption se presente
                                    if (missionData.translations['EN']?.caption) {
                                      allFields.push({
                                        textEN: missionData.translations['EN'].caption,
                                        metacodesDetected: (missionData.translations['EN'].caption.match(/\[[^\]]+\]/g) || [])
                                      });
                                      fieldMapping.push({ missionId, field: 'caption' });
                                    }
                                    
                                    // Aggiungi description se presente
                                    if (missionData.translations['EN']?.description) {
                                      allFields.push({
                                        textEN: missionData.translations['EN'].description,
                                        metacodesDetected: (missionData.translations['EN'].description.match(/\[[^\]]+\]/g) || [])
                                      });
                                      fieldMapping.push({ missionId, field: 'description' });
                                    }
                                    
                                    // Aggiungi buttons se presenti
                                    if (missionData.translations['EN']?.buttons && Array.isArray(missionData.translations['EN'].buttons)) {
                                      missionData.translations['EN'].buttons.forEach((button: any, buttonIndex: number) => {
                                        if (button.text) {
                                          allFields.push({
                                            textEN: button.text,
                                            metacodesDetected: (button.text.match(/\[[^\]]+\]/g) || [])
                                          });
                                          fieldMapping.push({ missionId, field: 'button', buttonIndex });
                                        }
                                      });
                                    }
                                  }
                                  
                                  if (allFields.length > 0) {
                                    const resp = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_AI_TRANSLATE_BATCH}`, {
                                      method: 'POST', 
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ items: allFields, langTarget: currentLanguage })
                                    });
                                    
                                    const j = await resp.json();
                                    if (!resp.ok || !j?.success) throw new Error(j?.message || 'batch failed');
                                    
                                    const suggestions: string[] = j.data?.suggestions || [];
                                    
                                    // Applica le traduzioni usando setEdits
                                    const updatedEdits: Record<string, string> = {};
                                    fieldMapping.forEach((mapping, idx) => {
                                      if (suggestions[idx]) {
                                        let cleanTranslation = suggestions[idx].replace(/^\d+\.\s*/, '').trim();
                                        const key = `yaml-missions|${mapping.missionId}|${selectedLang}_${mapping.field}${mapping.buttonIndex !== undefined ? `_${mapping.buttonIndex}` : ''}`;
                                        updatedEdits[key] = cleanTranslation;
                                      }
                                    });
                                    
                                    setEdits(prev => ({ ...prev, ...updatedEdits }));
                                    alert(`Tutti i ${allFields.length} campi delle missioni selezionate sono stati tradotti in ${selectedLang}!`);
                                  }
                                } else {
                                  // Per scripts e missions, usa tutti gli elementi visibili rispettando il filtro
                                  const detailsToUse = filterEnabled ? currentDetails.details : (allScriptDetails?.details || currentDetails.details);
                                  const items = detailsToUse.map((d: any) => ({
                                    textEN: d.en,
                                    metacodesDetected: (d.en.match(/\[[^\]]+\]/g) || [])
                                  }));
                                  const resp = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_AI_TRANSLATE_BATCH}`, {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ items, langTarget: currentLanguage })
                                  });
                                  const j = await resp.json();
                                  if (!resp.ok || !j?.success) throw new Error(j?.message || 'batch failed');
                                  const suggestions: string[] = j.data?.suggestions || [];
                                  // Popola tutte le inputbox
                                  const newEdits: Record<string, string> = { ...edits };
                                  detailsToUse.forEach((_: any, idx: number) => {
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
                            style={{ fontSize: '35px', lineHeight: '1', width: '100px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', flexDirection: 'row' }}
                          >
                            <span>🪄</span>
                            <span>✨</span>
                          </button>
                        )}
                        {/* 5) Toggle filtro - TEST: attivo sempre quando c'è ricerca */}
                        {isOpen && globalSearchTerm && (
                          <button
                            className={`px-3 py-2 border rounded transition-colors ${
                              filterEnabled 
                                ? 'bg-green-600 hover:bg-green-500 border-green-500 text-white' 
                                : 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-gray-300'
                            }`}
                            title={filterEnabled ? 'Filtro attivo - clicca per disattivare' : 'Filtro disattivato - clicca per attivare'}
                            onClick={() => setFilterEnabled(!filterEnabled)}
                            style={{ fontSize: '20px', lineHeight: '1', minWidth: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {filterEnabled ? '🔽' : '📋'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isOpen && 
                   ((selectedTab === 'scripts' && currentDetails && currentDetails.script === itemName) ||
                    (selectedTab === 'missions' && selectedMission === itemName && currentDetails) ||
                    (selectedTab === 'strings' && currentDetails && currentDetails.nome === itemName) ||
                    (selectedTab === 'nodes' && currentDetails && currentDetails.id === itemName) ||
                    (selectedTab === 'yaml-missions' && selectedYamlMissions.has(itemName))) && (
                    <tr className="bg-slate-900/40">
                      <td colSpan={3} className="px-3 py-2">
                        <div className="space-y-3">
                          <div className="border border-slate-700 rounded">
                            {selectedTab === 'strings' && selectedCategory ? (
                              // Rendering per localization strings
                              <div className="w-full">
                                <table className="w-full text-left text-sm">
                                  <thead className="bg-slate-900 text-gray-300 sticky top-0 z-10">
                                    <tr>
                                      <th className="px-3 py-2 w-[30%]">Key</th>
                                      <th className="px-3 py-2 w-[70%]">Valore</th>
                                    </tr>
                                  </thead>
                                </table>
                                <div className="max-h-96 overflow-auto">
                                  <table className="w-full text-left text-sm">
                                    <tbody className="divide-y divide-slate-700">
                                  {filteredStrings
                                    .filter((stringItem) => {
                                      // Se il filtro è disattivato o non c'è ricerca, mostra tutte le stringhe
                                      if (!filterEnabled || !globalSearchTerm.trim()) return true;
                                      
                                      const searchTermLower = globalSearchTerm.toLowerCase();
                                      
                                      // Controlla in TUTTE le lingue disponibili
                                      for (const value of Object.values(stringItem.values)) {
                                        if (value && typeof value === 'string' && value.toLowerCase().includes(searchTermLower)) {
                                          return true;
                                        }
                                      }
                                      return false;
                                    })
                                    .map((stringItem, idx) => {
                                    const enValue = stringItem.values.EN || '';
                                    const rawValue = stringItem.values[selectedLang] || '';
                                    
                                    // Per la textarea, usa sempre il valore della lingua selezionata (può essere vuoto)
                                    
                                    // Non tradotta se: vuota o uguale a EN
                                    const isMissing = !rawValue || rawValue.trim() === '' || rawValue.trim() === enValue.trim();
                                    
                                    return (
                                      <tr key={stringItem.id} className={`${isMissing ? 'bg-red-900/20' : 'bg-yellow-900/20'}`}>
                                        <td className="px-3 py-2 text-gray-400 w-[30%] font-mono text-xs break-all">
                                          {stringItem.id}
                                        </td>
                                        <td className="px-3 py-2 text-gray-200 w-[70%]">
                                          <ScriptMetadataProvider>
                                            <TranslationEditor
                                              value={stringItem.values}
                                              onChange={(newValue) => {
                                                const updatedValue = newValue[selectedLang] || '';
                                                // Rimuovi i newline per mantenere tutto su una singola riga
                                                const singleLineValue = updatedValue.replace(/[\r\n]/g, ' ');
                                                updateString(stringItem.id, selectedLang, singleLineValue);
                                              }}
                                              className="min-h-16"
                                              availableLanguages={['EN', 'IT', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU']}
                                              compactMode={true}
                                              editableLanguages={[selectedLang]}
                                              placeholder={`Traduzione in ${selectedLang}`}
                                            />
                                          </ScriptMetadataProvider>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : selectedTab === 'missions' ? (
                              // Rendering per missions regolari
                              <div className="w-full">
                                <table className="w-full text-left text-sm">
                                  <thead className="bg-slate-900 text-gray-300 sticky top-0 z-10">
                                    <tr>
                                      <th className="px-3 py-2 w-[15%]">Tipo</th>
                                      <th className="px-3 py-2 w-[25%]">Posizione</th>
                                      <th className="px-3 py-2 w-[60%]">Valore</th>
                                    </tr>
                                  </thead>
                                </table>
                                <div className="max-h-96 overflow-auto">
                                  {translationFields.length === 0 ? (
                                    <div className="p-4 text-gray-400 text-center">
                                      Nessun campo di traduzione trovato per questa mission.
                                    </div>
                                  ) : (
                                    <table className="w-full text-left text-sm">
                                      <tbody className="divide-y divide-slate-700">
                                        {(filterEnabled ? translationFields : allTranslationFields)
                                        .filter((field) => {
                                          // Se non c'è ricerca o filtro disattivato, mostra tutti i campi
                                          if (!globalSearchTerm.trim() || !filterEnabled) return true;
                                          
                                          const searchTermLower = globalSearchTerm.toLowerCase();
                                          
                                          // Controlla nel testo EN
                                          if (field.en && field.en.toLowerCase().includes(searchTermLower)) return true;
                                          
                                          // Controlla in tutte le lingue disponibili
                                          if (field.values) {
                                            for (const lang in field.values) {
                                              const value = field.values[lang];
                                              if (value && typeof value === 'string' && value.toLowerCase().includes(searchTermLower)) {
                                                return true;
                                              }
                                            }
                                          }
                                          
                                          return false;
                                        })
                                        .map((field, idx) => {
                                        const key = `${itemName}|${idx}|${selectedLang}`;
                                        const enValue = field.en || '';
                                        const fieldValue = field.values && field.values[selectedLang] ? field.values[selectedLang] : '';
                                        const currentValue = edits[key] !== undefined ? edits[key] : fieldValue;
                                        const isMissing = !currentValue || currentValue.trim() === '' || currentValue.trim() === enValue.trim();
                                        
                                        return (
                                          <tr key={idx} className={`${isMissing ? 'bg-red-900/20' : 'bg-yellow-900/20'}`}>
                                            <td className="px-3 py-2 text-gray-400 w-[15%] text-xs">
                                              {field.type}
                                            </td>
                                            <td className="px-3 py-2 text-gray-400 w-[25%] text-xs font-mono">
                                              {field.blockPath}
                                              {field.nearestLabel && <div className="text-blue-400">📍 {field.nearestLabel}</div>}
                                            </td>
                                            <td className="px-3 py-2 text-gray-200 w-[60%]">
                                              <ScriptMetadataProvider>
                                                <TranslationEditor
                                                  value={(() => {
                                                    const values: Record<string, string> = {};
                                                    for (const [lang, value] of Object.entries(field.values || {})) {
                                                      values[lang] = value || '';
                                                    }
                                                    
                                                    // Sovrascrivi con il valore editato per selectedLang se esiste
                                                    if (edits[key] !== undefined) {
                                                      values[selectedLang] = edits[key];
                                                    }
                                                    
                                                    return values;
                                                  })()}
                                                  onChange={(newValue) => {
                                                    const updatedValue = newValue[selectedLang] || '';
                                                    setEdits(prev => ({ ...prev, [key]: updatedValue }));
                                                  }}
                                                  className="min-h-16"
                                                  availableLanguages={['EN', 'IT', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU']}
                                                  compactMode={true}
                                                  editableLanguages={[selectedLang]}
                                                  placeholder={`Traduzione in ${selectedLang}`}
                                                />
                                              </ScriptMetadataProvider>
                                            </td>
                                          </tr>
                                        );
                                        })}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              </div>
                            ) : selectedTab === 'nodes' || selectedTab === 'yaml-missions' ? (
                              // Rendering per nodes.yaml e missions.yaml
                              <div className="w-full">
                                <table className="w-full text-left text-sm">
                                  <thead className="bg-slate-900 text-gray-300 sticky top-0 z-10">
                                    <tr>
                                      <th className="px-3 py-2 w-[20%]">Campo</th>
                                      <th className="px-3 py-2 w-[80%]">Valore</th>
                                    </tr>
                                  </thead>
                                </table>
                                <div className="max-h-96 overflow-auto">
                                  <table className="w-full text-left text-sm">
                                    <tbody className="divide-y divide-slate-700">
                                  {(() => {
                                    // Per yaml-missions, trova i dati dalla fonte corretta
                                    const itemData = selectedTab === 'yaml-missions' 
                                      ? yamlMissionsData?.items?.find((item: any) => item.id === itemName)
                                      : currentDetails;
                                    
                                    return itemData && itemData.translations && [
                                      ...(itemData.translations['EN']?.caption ? [{
                                        field: 'caption',
                                        en: itemData.translations['EN'].caption,
                                        current: itemData.translations[selectedLang]?.caption || ''
                                      }] : []),
                                      ...(itemData.translations['EN']?.description ? [{
                                        field: 'description', 
                                        en: itemData.translations['EN'].description,
                                        current: itemData.translations[selectedLang]?.description || ''
                                      }] : []),
                                      ...(itemData.translations['EN']?.buttons && Array.isArray(itemData.translations['EN'].buttons) ? 
                                        itemData.translations['EN'].buttons.map((button: any, buttonIndex: number) => ({
                                          field: `button_${button.id}`,
                                          en: button.text || '',
                                          current: itemData.translations[selectedLang]?.buttons?.[buttonIndex]?.text || '',
                                          buttonIndex: buttonIndex
                                        })).filter((button: any) => button.en) : [])
                                    ];
                                  })()?.filter((item: any) => {
                                    // Se il filtro è disattivato o non c'è ricerca, mostra tutti i campi
                                    if (!filterEnabled || !globalSearchTerm.trim()) return true;
                                    
                                    const searchTermLower = globalSearchTerm.toLowerCase();
                                    
                                    // Controlla nel testo EN
                                    if (item.en && item.en.toLowerCase().includes(searchTermLower)) return true;
                                    
                                    // Controlla nel testo della lingua corrente
                                    if (item.current && item.current.toLowerCase().includes(searchTermLower)) return true;
                                    
                                    // Per NODES e YAML-MISSIONS, controlla solo il campo specifico in tutte le lingue
                                    if (selectedTab === 'nodes' || selectedTab === 'yaml-missions') {
                                      const itemData = selectedTab === 'yaml-missions' 
                                        ? yamlMissionsData?.items?.find((i: any) => i.id === itemName)
                                        : currentDetails;
                                      
                                      if (itemData?.translations) {
                                        // Controlla solo il campo specifico (item.field) in tutte le lingue
                                        for (const lang in itemData.translations) {
                                          const translation = itemData.translations[lang];
                                          if (translation) {
                                            if (item.field === 'caption' && translation.caption && translation.caption.toLowerCase().includes(searchTermLower)) {
                                              return true;
                                            }
                                            if (item.field === 'description' && translation.description && translation.description.toLowerCase().includes(searchTermLower)) {
                                              return true;
                                            }
                                            if (item.field.startsWith('button_') && translation.buttons && Array.isArray(translation.buttons)) {
                                              const button = translation.buttons[item.buttonIndex];
                                              if (button?.text && button.text.toLowerCase().includes(searchTermLower)) {
                                                return true;
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                    
                                    return false;
                                  })?.map((item: any, idx: number) => {
                                    const itemData = selectedTab === 'yaml-missions' 
                                      ? yamlMissionsData?.items?.find((item: any) => item.id === itemName)
                                      : currentDetails;
                                    const key = `${selectedTab}|${itemData?.id}|${selectedLang}_${item.field}`;
                                    const targetVal = edits[key] !== undefined ? edits[key] : (item.current || item.en);
                                    const isMissing = !targetVal || targetVal.trim() === '' || targetVal === item.en;
                                    const isDifferent = !!targetVal && targetVal !== item.en;
                                    
                                    return (
                                      <tr key={idx} className={`${isMissing ? 'bg-red-900/20' : isDifferent ? 'bg-yellow-900/20' : ''}`}>
                                        <td className="px-3 py-2 text-gray-400 w-[20%] capitalize">{item.field}</td>
                                        <td className="px-3 py-2 text-gray-200 w-[80%]">
                                          <ScriptMetadataProvider>
                                            <TranslationEditor
                                              value={(() => {
                                                const itemData = selectedTab === 'yaml-missions' 
                                                  ? yamlMissionsData?.items?.find((i: any) => i.id === itemName)
                                                  : currentDetails;
                                                const allValues: Record<string, string> = {};
                                                
                                                // Aggiungi tutte le lingue disponibili
                                                const availableLangs = ['EN', 'IT', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
                                                availableLangs.forEach(lang => {
                                                  if (item.field.startsWith('button_')) {
                                                    const buttonIndex = item.buttonIndex;
                                                    allValues[lang] = itemData?.translations?.[lang]?.buttons?.[buttonIndex]?.text || '';
                                                  } else {
                                                    allValues[lang] = itemData?.translations?.[lang]?.[item.field] || '';
                                                  }
                                                });
                                                
                                                // Sovrascrivi con il valore corrente editato
                                                allValues[selectedLang] = targetVal || '';
                                                
                                                return allValues;
                                              })()}
                                              onChange={(newValue) => {
                                                const updatedValue = newValue[selectedLang] || '';
                                                const singleLineValue = updatedValue.replace(/[\r\n]/g, ' ');
                                                setEdits(prev => ({ ...prev, [key]: singleLineValue }));
                                              }}
                                              className="min-h-16"
                                              availableLanguages={['EN', 'IT', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU']}
                                              compactMode={true}
                                              editableLanguages={[selectedLang]}
                                              placeholder={`Traduzione ${item.field} in ${selectedLang}`}
                                            />
                                          </ScriptMetadataProvider>
                                        </td>
                                        <td className="px-3 py-2 text-gray-300 w-[10%]">
                                          <button 
                                            className="bg-slate-700 hover:bg-slate-600 text-white border border-slate-500 text-lg hover:bg-slate-700 px-2 py-1" 
                                            title="Suggerimento IA"
                                            style={{ fontSize: '35px', lineHeight: '35px', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            onClick={async () => {
                                              try {
                                                const response = await fetch(`${API_CONFIG.API_BASE_URL}/localization/ai-translate`, {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({
                                                    text: item.en,
                                                    fromLanguage: 'EN',
                                                    toLanguage: currentLanguage,
                                                    context: `${selectedTab === 'nodes' ? 'Node' : 'Mission'} ${item.field}`
                                                  })
                                                });
                                                
                                                const result = await response.json();
                                                if (result.success && result.data && result.data.translatedText) {
                                                  let cleanTranslation = result.data.translatedText;
                                                  
                                                  // Rimuovi prefissi numerati tipo "1. ", "2. ", etc.
                                                  cleanTranslation = cleanTranslation.replace(/^\d+\.\s*/, '');
                                                  
                                                  // Rimuovi eventuali spazi iniziali/finali
                                                  cleanTranslation = cleanTranslation.trim();
                                                  
                                                  setEdits(prev => ({ ...prev, [key]: cleanTranslation }));
                                                }
                                              } catch (e) {
                                                alert('Impossibile generare suggerimento IA');
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
                                </div>
                              </div>
                            ) : (
                              // Rendering per scripts e missions
                              <div className="w-full">
                                <table className="w-full text-left text-sm">
                                  <thead className="bg-slate-900 text-gray-300 sticky top-0 z-10">
                                    <tr>
                                      <th className="px-3 py-2 w-[20%]">Campo</th>
                                      <th className="px-3 py-2 w-[80%]">Valore</th>
                                    </tr>
                                  </thead>
                                </table>
                                <div className="max-h-96 overflow-auto">
                                  <table className="w-full text-left text-sm">
                                    <tbody className="divide-y divide-slate-700" key={`scripts-${filterEnabled}`}>
                                  {(filterEnabled ? currentDetails.details : (allScriptDetails?.details || currentDetails.details))
                                    .filter((d: any) => {
                                      // Se non c'è ricerca o filtro disattivato, mostra tutti i blocchi  
                                      if (!globalSearchTerm.trim() || !filterEnabled) return true;
                                      
                                      // Controlla se il termine di ricerca è presente in qualsiasi lingua del blocco
                                      const searchTermLower = globalSearchTerm.toLowerCase();
                                      
                                      // Controlla nel testo EN
                                      if (d.en && d.en.toLowerCase().includes(searchTermLower)) return true;
                                      
                                      // Controlla in tutte le lingue disponibili
                                      if (d.values) {
                                        for (const lang in d.values) {
                                          const value = d.values[lang];
                                          if (value && typeof value === 'string' && value.toLowerCase().includes(searchTermLower)) {
                                            return true;
                                          }
                                        }
                                      }
                                      
                                      return false;
                                    })
                                    .map((d: any, idx: number) => {
                                  const key = `${currentDetails.script}|${idx}|${selectedLang}`;
                                  const initial = (d.values[selectedLang] || '');
                                  const targetVal = edits[key] !== undefined ? edits[key] : initial;
                                  const isMissing = !targetVal || targetVal === d.en;
                                  const isDifferent = !!targetVal && targetVal !== d.en;
                                  return (
                                    <tr key={idx} className={`${isMissing ? 'bg-red-900/20' : isDifferent ? 'bg-yellow-900/20' : ''}`}>
                                      <td className="px-3 py-2 text-gray-400 w-[20%]">{d.type || d.field || '-'}</td>
                                      <td className="px-3 py-2 text-gray-200 w-[80%]">
                                        <ScriptMetadataProvider availableLanguages={['EN', 'IT', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU']}>
                                          <TranslationEditor
                                            value={{
                                              ...d.values,
                                              [selectedLang]: targetVal || (d.values[selectedLang] || '')
                                            }}
                                            onChange={(newValue) => {
                                              const updatedValue = newValue[selectedLang] || '';
                                              const singleLineValue = updatedValue.replace(/[\r\n]/g, ' ');
                                              setEdits(prev => ({ ...prev, [key]: singleLineValue }));
                                            }}
                                            className="min-h-16"
                                            scriptId={selectedScript || undefined}
                                            availableLanguages={['EN', 'IT', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU']}
                                            compactMode={true}
                                            editableLanguages={[selectedLang]}
                                            placeholder="Inserisci traduzione"
                                          />
                                        </ScriptMetadataProvider>
                                      </td>
                                    </tr>
                                  );
                                  })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
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
      
      {/* Modal per errori di backup */}
      <BackupErrorModal
        isOpen={showBackupErrorModal}
        onClose={() => setShowBackupErrorModal(false)}
        errorMessage={backupErrorMessage}
        backupDetails={backupErrorDetails}
      />
    </div>
  );
};

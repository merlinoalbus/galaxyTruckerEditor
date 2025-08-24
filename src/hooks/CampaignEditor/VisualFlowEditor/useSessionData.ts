import { logger } from '@/utils/logger';
import { useState, useCallback, useEffect } from 'react';
import { variablesSystemApiService } from '@/services/CampaignEditor/VariablesSystem/variablesSystemApiService';
import { interactiveMapService } from '@/services/CampaignEditor/InteractiveMap/interactiveMapService';
import { gameDataService } from '@/services/CampaignEditor/GameDataService';
import type { Character } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import type { MapNode } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';

interface SessionData {
  variables: string[];
  semaphores: string[];
  labels: string[];
  scripts: string[];
  missions: string[];
  characters: Character[];
  nodes: MapNode[];
}

const STORAGE_KEY = 'visualFlowEditor_sessionData';

// Cache a livello di modulo per evitare ricarichi ripetuti durante la stessa sessione di editor
type GlobalSessionCache = {
  missions?: string[];
  characters?: Character[];
  nodes?: MapNode[];
  loadMissionsPromise?: Promise<string[]>;
  loadCharactersPromise?: Promise<Character[]>;
  loadNodesPromise?: Promise<MapNode[]>;
};

const _globalSessionCache: GlobalSessionCache = {};

// Hook per gestire i dati di sessione (variabili, semafori, labels, etc.)
export const useSessionData = () => {
  // Inizializza con dati di esempio e da localStorage se disponibili
  const [sessionData, setSessionData] = useState<SessionData>(() => {
    // Tenta di caricare da localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Mantieni i dati di base dai precedenti utilizzi (escludendo payload pesanti che gestiamo a runtime)
        return {
          ...parsed,
          missions: Array.isArray(parsed.missions) ? parsed.missions : [],
          characters: [], // i personaggi vengono caricati da API e non persistiti su localStorage
          nodes: [] // i nodi vengono caricati da API e non persistiti su localStorage
        };
      } catch (e) {
  logger.error('Errore nel caricamento dati sessione:', e);
      }
    }
    
    // Dati di default
    return {
      characters: [], // Verranno caricati dall'API
  nodes: [], // Verranno caricati dall'API
      variables: [
        'playerName',
        'playerLevel',
        'playerCredits',
        'currentMission',
        'questProgress',
        'dialogChoice',
        'gamePhase',
        'difficulty',
        'score',
        'lives'
      ],
      semaphores: [
        'tutorialCompleted',
        'firstBossDefeated',
        'secretAreaUnlocked',
        'achievement01',
        'achievement02',
        'questStarted',
        'questCompleted',
        'hasSpecialItem',
        'debugMode',
        'godMode'
      ],
      labels: [
        'start',
        'menu_principale',
        'game_over',
        'vittoria',
        'checkpoint_1',
        'checkpoint_2',
        'boss_fight',
        'shop',
        'inventory',
        'settings'
      ],
      scripts: [
        'main.txt',
        'tutorial.txt',
        'mission_01.txt',
        'mission_02.txt',
        'boss_01.txt',
        'shop_dialog.txt',
        'npc_merchant.txt',
        'npc_guard.txt',
        'cutscene_intro.txt',
        'cutscene_ending.txt'
      ],
      missions: [] // Verranno caricate dall'API
    };
  });

  // Carica i personaggi all'avvio (una sola volta per sessione tramite cache globale)
  useEffect(() => {
    let isMounted = true;
    const debug = (window as any).__VFE_NAV_DEBUG__;
  const log = (...args: any[]) => { if (debug) logger.debug('[SESSION] characters', ...args); };

    if (_globalSessionCache.characters && _globalSessionCache.characters.length) {
      log('cache hit');
      setSessionData(prev => ({ ...prev, characters: _globalSessionCache.characters! }));
      return () => { isMounted = false; };
    }

    if (!_globalSessionCache.loadCharactersPromise) {
      log('fetch start');
      _globalSessionCache.loadCharactersPromise = variablesSystemApiService
        .loadAllData()
        .then(data => (data.characters || []) as Character[]);
    } else {
      log('await in-flight');
    }

    _globalSessionCache.loadCharactersPromise
      .then(chars => {
        _globalSessionCache.characters = chars;
        if (isMounted) {
          log('fetch done', chars?.length);
          setSessionData(prev => ({ ...prev, characters: chars }));
        }
      })
      .catch(err => {
  logger.error('Errore caricamento personaggi:', err);
      });

    return () => { isMounted = false; };
  }, []); // Esegui solo una volta all'avvio

  // Carica i nodi mappa all'avvio (una sola volta per sessione tramite cache globale)
  useEffect(() => {
    let isMounted = true;
    const debug = (window as any).__VFE_NAV_DEBUG__;
    const log = (...args: any[]) => { if (debug) logger.debug('[SESSION] nodes', ...args); };

    if (_globalSessionCache.nodes && _globalSessionCache.nodes.length) {
      log('cache hit');
      setSessionData(prev => ({ ...prev, nodes: _globalSessionCache.nodes! }));
      return () => { isMounted = false; };
    }

    if (!_globalSessionCache.loadNodesPromise) {
      log('fetch start');
      _globalSessionCache.loadNodesPromise = interactiveMapService
        .loadNodes()
        .then(nodes => nodes || []);
    } else {
      log('await in-flight');
    }

    _globalSessionCache.loadNodesPromise
      .then(nodes => {
        _globalSessionCache.nodes = nodes;
        if (isMounted) {
          log('fetch done', nodes?.length);
          setSessionData(prev => ({ ...prev, nodes }));
        }
      })
      .catch(err => {
        logger.error('Errore caricamento nodi mappa:', err);
      });

    return () => { isMounted = false; };
  }, []);

  // Carica le missioni all'avvio (una sola volta per sessione tramite cache globale)
  useEffect(() => {
    let isMounted = true;
    const debug = (window as any).__VFE_NAV_DEBUG__;
  const log = (...args: any[]) => { if (debug) logger.debug('[SESSION] missions', ...args); };

    if (_globalSessionCache.missions && _globalSessionCache.missions.length) {
      log('cache hit');
      setSessionData(prev => ({ ...prev, missions: _globalSessionCache.missions! }));
      return () => { isMounted = false; };
    }

    if (!_globalSessionCache.loadMissionsPromise) {
      log('fetch start');
      _globalSessionCache.loadMissionsPromise = gameDataService
        .getMissions()
        .then(missions => missions.map(m => m.name.replace('.txt', '')));
    } else {
      log('await in-flight');
    }

    _globalSessionCache.loadMissionsPromise
      .then(missionNames => {
        _globalSessionCache.missions = missionNames;
        if (isMounted) {
          log('fetch done', missionNames?.length);
          setSessionData(prev => ({ ...prev, missions: missionNames }));
        }
      })
      .catch(err => {
  logger.error('Errore caricamento missioni:', err);
      });

    return () => { isMounted = false; };
  }, []); // Esegui solo una volta all'avvio

  // Salva in localStorage quando cambiano i dati (escludi characters e missions per evitare dati pesanti/obsoleti)
  useEffect(() => {
  const { characters, missions, nodes, ...dataToStore } = sessionData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
  }, [sessionData]);

  // Aggiungi una variabile
  const addVariable = useCallback((variable: string) => {
    setSessionData(prev => ({
      ...prev,
      variables: [...new Set([...prev.variables, variable])]
    }));
  }, []);

  // Aggiungi un semaforo
  const addSemaphore = useCallback((semaphore: string) => {
    setSessionData(prev => ({
      ...prev,
      semaphores: [...new Set([...prev.semaphores, semaphore])]
    }));
  }, []);

  // Aggiungi una label
  const addLabel = useCallback((label: string) => {
    setSessionData(prev => ({
      ...prev,
      labels: [...new Set([...prev.labels, label])]
    }));
  }, []);

  // Aggiungi uno script
  const addScript = useCallback((script: string) => {
    setSessionData(prev => ({
      ...prev,
      scripts: [...new Set([...prev.scripts, script])]
    }));
  }, []);

  // Aggiungi una missione
  const addMission = useCallback((mission: string) => {
    setSessionData(prev => ({
      ...prev,
      missions: [...new Set([...prev.missions, mission])]
    }));
  }, []);

  // Rimuovi una variabile
  const removeVariable = useCallback((variable: string) => {
    setSessionData(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable)
    }));
  }, []);

  // Rimuovi un semaforo
  const removeSemaphore = useCallback((semaphore: string) => {
    setSessionData(prev => ({
      ...prev,
      semaphores: prev.semaphores.filter(s => s !== semaphore)
    }));
  }, []);

  // Rimuovi una label
  const removeLabel = useCallback((label: string) => {
    setSessionData(prev => ({
      ...prev,
      labels: prev.labels.filter(l => l !== label)
    }));
  }, []);

  // Rimuovi uno script
  const removeScript = useCallback((script: string) => {
    setSessionData(prev => ({
      ...prev,
      scripts: prev.scripts.filter(s => s !== script)
    }));
  }, []);

  // Rimuovi una missione
  const removeMission = useCallback((mission: string) => {
    setSessionData(prev => ({
      ...prev,
      missions: prev.missions.filter(m => m !== mission)
    }));
  }, []);

  // Reset completo dei dati di sessione
  const resetSessionData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload(); // Ricarica per pulire tutto
  }, []);

  // Carica dati da un file di script (estrae variabili, semafori, etc.)
  const loadFromScript = useCallback((scriptContent: string) => {
    // Estrai variabili (pattern: VAR nome o SET nome)
    const varPattern = /(?:VAR|SET)\s+(\w+)/gi;
    const variables = new Set<string>();
    let match;
    while ((match = varPattern.exec(scriptContent)) !== null) {
      variables.add(match[1]);
    }

    // Estrai semafori (pattern: IF_IS semaforo o simili)
    const semPattern = /IF_IS\s+(\w+)/gi;
    const semaphores = new Set<string>();
    while ((match = semPattern.exec(scriptContent)) !== null) {
      semaphores.add(match[1]);
    }

    // Estrai labels (pattern: LABEL nome o GO nome)
    const labelPattern = /(?:LABEL|GO)\s+(\w+)/gi;
    const labels = new Set<string>();
    while ((match = labelPattern.exec(scriptContent)) !== null) {
      labels.add(match[1]);
    }

    // Estrai scripts (pattern: CALL nome)
    const scriptPattern = /CALL\s+(\w+\.txt)/gi;
    const scripts = new Set<string>();
    while ((match = scriptPattern.exec(scriptContent)) !== null) {
      scripts.add(match[1]);
    }

    // Aggiorna i dati di sessione con i nuovi elementi trovati
    setSessionData(prev => ({
      ...prev, // Mantieni tutti i campi esistenti incluso characters
      variables: [...new Set([...prev.variables, ...variables])],
      semaphores: [...new Set([...prev.semaphores, ...semaphores])],
      labels: [...new Set([...prev.labels, ...labels])],
      scripts: [...new Set([...prev.scripts, ...scripts])],
      missions: prev.missions // Le missioni non vengono estratte automaticamente
    }));
  }, []);

  return {
    // Dati
    variables: sessionData.variables,
    semaphores: sessionData.semaphores,
    labels: sessionData.labels,
    scripts: sessionData.scripts,
    missions: sessionData.missions,
    characters: sessionData.characters,
  nodes: sessionData.nodes,
    
    // Metodi di aggiunta
    addVariable,
    addSemaphore,
    addLabel,
    addScript,
    addMission,
    
    // Metodi di rimozione
    removeVariable,
    removeSemaphore,
    removeLabel,
    removeScript,
    removeMission,
    
    // Utilità
    resetSessionData,
    loadFromScript
  };
};
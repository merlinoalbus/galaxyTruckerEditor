import { useState, useCallback, useEffect } from 'react';
import { variablesSystemApiService } from '@/services/CampaignEditor/VariablesSystem/variablesSystemApiService';
import type { Character } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';

interface SessionData {
  variables: string[];
  semaphores: string[];
  labels: string[];
  scripts: string[];
  missions: string[];
  characters: Character[];
}

const STORAGE_KEY = 'visualFlowEditor_sessionData';

// Hook per gestire i dati di sessione (variabili, semafori, labels, etc.)
export const useSessionData = () => {
  // Inizializza con dati di esempio e da localStorage se disponibili
  const [sessionData, setSessionData] = useState<SessionData>(() => {
    // Tenta di caricare da localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Errore nel caricamento dati sessione:', e);
      }
    }
    
    // Dati di default
    return {
      characters: [], // Verranno caricati dall'API
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
      missions: [
        'Tutorial',
        'Mission_01_FirstSteps',
        'Mission_02_TheJourney',
        'Mission_03_BossFight',
        'Mission_04_SecretArea',
        'Mission_05_FinalBattle',
        'SideQuest_01',
        'SideQuest_02',
        'BonusMission_01',
        'ChallengeMission_01'
      ]
    };
  });

  // Carica i personaggi all'avvio
  useEffect(() => {
    variablesSystemApiService.loadAllData()
      .then(data => {
        setSessionData(prev => ({
          ...prev,
          characters: data.characters || []
        }));
      })
      .catch(err => {
        console.error('Errore caricamento personaggi:', err);
      });
  }, []); // Esegui solo una volta all'avvio

  // Salva in localStorage quando cambiano i dati (escludi characters per evitare dati pesanti)
  useEffect(() => {
    const { characters, ...dataToStore } = sessionData;
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
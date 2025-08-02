import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Mission, DeckScript, ValidationError } from '../types/GameTypes';
import { gameDataService, FileMetadata } from '../services/CampaignEditor/GameDataService';

interface GameDataContextType {
  // File metadata arrays
  missionFiles: FileMetadata[];
  deckScriptFiles: FileMetadata[];
  adventureCardFiles: FileMetadata[];
  shipPartFiles: FileMetadata[];
  localizationFiles: FileMetadata[];
  shipFiles: FileMetadata[];
  
  // Current loaded data
  currentMission: Mission | null;
  currentDeckScript: DeckScript | null;
  
  // State
  loading: boolean;
  error: string | null;
  gameRoot: string;
  connected: boolean;
  
  // Actions - Missions
  loadMissions: () => Promise<void>;
  loadMission: (filename: string) => Promise<Mission | null>;
  saveMission: (filename: string, mission: Mission) => Promise<void>;
  deleteMission: (filename: string) => Promise<void>;
  
  // Actions - Deck Scripts
  loadDeckScripts: () => Promise<void>;
  loadDeckScript: (filename: string) => Promise<DeckScript | null>;
  saveDeckScript: (filename: string, script: DeckScript) => Promise<void>;
  
  // Actions - Adventure Cards
  loadAdventureCards: () => Promise<void>;
  
  // Actions - Ship Parts
  loadShipParts: () => Promise<void>;
  
  // Actions - Localization
  loadLocalizationFiles: () => Promise<void>;
  
  // Actions - Ships
  loadShips: () => Promise<void>;
  
  // Validation
  validateContent: (category: string, content: string) => Promise<ValidationError[]>;
  
  // Utility
  refreshAll: () => Promise<void>;
  getBackups: () => Promise<any[]>;
  healthCheck: () => Promise<boolean>;
}

const GameDataContext = createContext<GameDataContextType | undefined>(undefined);

interface GameDataProviderProps {
  children: ReactNode;
}

export function RealGameDataProvider({ children }: GameDataProviderProps) {
  // State
  const [missionFiles, setMissionFiles] = useState<FileMetadata[]>([]);
  const [deckScriptFiles, setDeckScriptFiles] = useState<FileMetadata[]>([]);
  const [adventureCardFiles, setAdventureCardFiles] = useState<FileMetadata[]>([]);
  const [shipPartFiles, setShipPartFiles] = useState<FileMetadata[]>([]);
  const [localizationFiles, setLocalizationFiles] = useState<FileMetadata[]>([]);
  const [shipFiles, setShipFiles] = useState<FileMetadata[]>([]);
  
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [currentDeckScript, setCurrentDeckScript] = useState<DeckScript | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameRoot, setGameRoot] = useState('');
  const [connected, setConnected] = useState(false);

  // Initialize connection on mount
  useEffect(() => {
    initializeConnection();
  }, []);

  const initializeConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const health = await gameDataService.healthCheck();
      setGameRoot(health.gameRoot);
      setConnected(true);
      
      // Load initial data
      await refreshAll();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to connect to server: ${errorMessage}`);
      setConnected(false);
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Missions
  const loadMissions = async () => {
    try {
      const files = await gameDataService.getMissions();
      setMissionFiles(files);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load missions';
      setError(errorMessage);
      throw err;
    }
  };

  const loadMission = async (filename: string): Promise<Mission | null> => {
    try {
      setLoading(true);
      const response = await gameDataService.getMission(filename);
      
      // Parse the mission from YAML
      const mission = gameDataService.parseMissionYAML(response.content);
      setCurrentMission(mission);
      
      return mission;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load mission';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveMission = async (filename: string, mission: Mission) => {
    try {
      setLoading(true);
      setError(null);
      
      const yamlContent = gameDataService.serializeMissionYAML(mission);
      await gameDataService.saveMission(filename, yamlContent);
      
      // Refresh mission list
      await loadMissions();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save mission';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteMission = async (filename: string) => {
    try {
      setLoading(true);
      await gameDataService.deleteMission(filename);
      
      // Refresh mission list
      await loadMissions();
      
      // Clear current mission if it was deleted
      if (currentMission && filename.includes(currentMission.name)) {
        setCurrentMission(null);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete mission';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deck Scripts
  const loadDeckScripts = async () => {
    try {
      const files = await gameDataService.getDeckScripts();
      setDeckScriptFiles(files);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load deck scripts';
      setError(errorMessage);
      throw err;
    }
  };

  const loadDeckScript = async (filename: string): Promise<DeckScript | null> => {
    try {
      setLoading(true);
      const response = await gameDataService.getDeckScript(filename);
      
      // Parse deck script from text content
      const script = parseDeckScriptContent(response.content);
      setCurrentDeckScript(script);
      
      return script;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load deck script';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveDeckScript = async (filename: string, script: DeckScript) => {
    try {
      setLoading(true);
      setError(null);
      
      const textContent = serializeDeckScript(script);
      await gameDataService.saveDeckScript(filename, textContent);
      
      // Refresh deck script list
      await loadDeckScripts();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save deck script';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Adventure Cards
  const loadAdventureCards = async () => {
    try {
      const files = await gameDataService.getAdventureCards();
      setAdventureCardFiles(files);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load adventure cards';
      setError(errorMessage);
      throw err;
    }
  };

  // Ship Parts
  const loadShipParts = async () => {
    try {
      const files = await gameDataService.getShipParts();
      setShipPartFiles(files);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load ship parts';
      setError(errorMessage);
      throw err;
    }
  };

  // Localization
  const loadLocalizationFiles = async () => {
    try {
      const files = await gameDataService.getLocalizationFiles();
      setLocalizationFiles(files);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load localization files';
      setError(errorMessage);
      throw err;
    }
  };

  // Ships
  const loadShips = async () => {
    try {
      const files = await gameDataService.getShips();
      setShipFiles(files);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load ships';
      setError(errorMessage);
      throw err;
    }
  };

  // Validation
  const validateContent = async (category: string, content: string): Promise<ValidationError[]> => {
    try {
      const result = await gameDataService.validateContent(category, content);
      
      return [
        ...result.errors.map(msg => ({ field: 'content', message: msg, severity: 'error' as const })),
        ...result.warnings.map(msg => ({ field: 'content', message: msg, severity: 'warning' as const }))
      ];
    } catch (err) {
      return [{
        field: 'validation',
        message: err instanceof Error ? err.message : 'Validation failed',
        severity: 'error'
      }];
    }
  };

  // Utility functions
  const refreshAll = async () => {
    setLoading(true);
    try {
      // Load sequentially with delays to avoid rate limiting
      await loadMissions();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await loadDeckScripts();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await loadAdventureCards();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await loadShipParts();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await loadLocalizationFiles();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await loadShips();
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const getBackups = async (): Promise<any[]> => {
    try {
      const result = await gameDataService.getBackups();
      return result.backups;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get backups');
      return [];
    }
  };

  const healthCheck = async (): Promise<boolean> => {
    try {
      await gameDataService.healthCheck();
      setConnected(true);
      setError(null);
      return true;
    } catch (err) {
      setConnected(false);
      setError(err instanceof Error ? err.message : 'Health check failed');
      return false;
    }
  };

  // Helper functions for parsing
  const parseDeckScriptContent = (content: string): DeckScript => {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
    const commands: any[] = [];
    let scriptName = 'Unnamed Script';

    for (const line of lines) {
      if (line.startsWith('SCRIPT ')) {
        scriptName = line.replace('SCRIPT ', '');
        continue;
      }

      if (line.startsWith('TmpDeckLoad ')) {
        const deckFile = line.replace('TmpDeckLoad ', '').replace(/"/g, '');
        commands.push({
          type: 'TmpDeckLoad',
          deckFile
        });
      } else if (line.startsWith('DeckAddCardType ')) {
        const parts = line.replace('DeckAddCardType ', '').split(' ');
        commands.push({
          type: 'DeckAddCardType',
          flight: parseInt(parts[0]),
          cardType: parts[1],
          count: parseInt(parts[2])
        });
      }
    }

    return { name: scriptName, commands };
  };

  const serializeDeckScript = (script: DeckScript): string => {
    let content = 'SCRIPTS\n\n';
    content += `  SCRIPT ${script.name}\n`;
    
    script.commands.forEach(cmd => {
      if (cmd.type === 'TmpDeckLoad') {
        content += `    TmpDeckLoad "${cmd.deckFile}"\n`;
      } else if (cmd.type === 'DeckAddCardType') {
        content += `\tDeckAddCardType ${cmd.flight} ${cmd.cardType} ${cmd.count}\n`;
      }
    });

    return content;
  };

  const contextValue: GameDataContextType = {
    // File arrays
    missionFiles,
    deckScriptFiles,
    adventureCardFiles,
    shipPartFiles,
    localizationFiles,
    shipFiles,
    
    // Current data
    currentMission,
    currentDeckScript,
    
    // State
    loading,
    error,
    gameRoot,
    connected,
    
    // Actions
    loadMissions,
    loadMission,
    saveMission,
    deleteMission,
    loadDeckScripts,
    loadDeckScript,
    saveDeckScript,
    loadAdventureCards,
    loadShipParts,
    loadLocalizationFiles,
    loadShips,
    validateContent,
    refreshAll,
    getBackups,
    healthCheck
  };

  return (
    <GameDataContext.Provider value={contextValue}>
      {children}
    </GameDataContext.Provider>
  );
}

export function useRealGameData() {
  const context = useContext(GameDataContext);
  if (context === undefined) {
    throw new Error('useRealGameData must be used within a RealGameDataProvider');
  }
  return context;
}
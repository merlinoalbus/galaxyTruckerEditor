import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { Mission, DeckScript, ValidationError } from '@/types/GameTypes';
import { FileMetadata } from '@/services/CampaignEditor/GameDataService';
import { useGameDataState } from './GameDataContext/useGameDataState';
import { useMissionOperations } from './GameDataContext/useMissionOperations';
import { useDeckScriptOperations } from './GameDataContext/useDeckScriptOperations';
import { useUtilityOperations } from './GameDataContext/useUtilityOperations';

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
  deleteDeckScript: (filename: string) => Promise<void>;
  
  // Validation
  validateContent: (category: string, content: string) => Promise<ValidationError[]>;
  
  // Utility
  refreshAll: () => Promise<void>;
  getBackups: () => Promise<{ name: string; size: number; created: string; path: string }[]>;
  healthCheck: () => Promise<boolean>;
}

const GameDataContext = createContext<GameDataContextType | undefined>(undefined);

interface GameDataProviderProps {
  children: ReactNode;
}

export function GameDataProvider({ children }: GameDataProviderProps) {
  const state = useGameDataState();
  
  const missionOps = useMissionOperations(
    state.setLoading,
    state.setError,
    state.setMissionFiles,
    state.setCurrentMission
  );
  
  const deckScriptOps = useDeckScriptOperations(
    state.setLoading,
    state.setError,
    state.setDeckScriptFiles,
    state.setCurrentDeckScript
  );
  
  const utilityOps = useUtilityOperations(
    state.setLoading,
    state.setError,
    state.setConnected,
    state.setGameRoot
  );

  const validateContent = async (category: string, content: string): Promise<ValidationError[]> => {
    if (category === 'mission') {
      return missionOps.validateMissionContent('', content);
    } else if (category === 'deckScript') {
      return deckScriptOps.validateDeckScriptContent('', content);
    }
    return [];
  };

  // Initialize connection on mount
  useEffect(() => {
    utilityOps.healthCheck();
  }, []);

  const value: GameDataContextType = {
    // State
    ...state,
    
    // Operations
    ...missionOps,
    ...deckScriptOps,
    ...utilityOps,
    validateContent
  };

  return (
    <GameDataContext.Provider value={value}>
      {children}
    </GameDataContext.Provider>
  );
}

export function useGameData() {
  const context = useContext(GameDataContext);
  if (context === undefined) {
    throw new Error('useGameData must be used within a GameDataProvider');
  }
  return context;
}
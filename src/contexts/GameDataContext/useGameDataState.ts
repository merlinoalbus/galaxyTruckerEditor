import { useState } from 'react';
import { Mission, DeckScript } from '@/types/GameTypes';
import { FileMetadata } from '@/services/CampaignEditor/GameDataService';

export const useGameDataState = () => {
  // File metadata arrays
  const [missionFiles, setMissionFiles] = useState<FileMetadata[]>([]);
  const [deckScriptFiles, setDeckScriptFiles] = useState<FileMetadata[]>([]);
  const [adventureCardFiles, setAdventureCardFiles] = useState<FileMetadata[]>([]);
  const [shipPartFiles, setShipPartFiles] = useState<FileMetadata[]>([]);
  const [localizationFiles, setLocalizationFiles] = useState<FileMetadata[]>([]);
  const [shipFiles, setShipFiles] = useState<FileMetadata[]>([]);
  
  // Current loaded data
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [currentDeckScript, setCurrentDeckScript] = useState<DeckScript | null>(null);
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameRoot, setGameRoot] = useState<string>('');
  const [connected, setConnected] = useState(false);

  return {
    // File metadata arrays
    missionFiles,
    setMissionFiles,
    deckScriptFiles,
    setDeckScriptFiles,
    adventureCardFiles,
    setAdventureCardFiles,
    shipPartFiles,
    setShipPartFiles,
    localizationFiles,
    setLocalizationFiles,
    shipFiles,
    setShipFiles,
    
    // Current loaded data
    currentMission,
    setCurrentMission,
    currentDeckScript,
    setCurrentDeckScript,
    
    // State
    loading,
    setLoading,
    error,
    setError,
    gameRoot,
    setGameRoot,
    connected,
    setConnected
  };
};
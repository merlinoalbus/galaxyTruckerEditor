import { gameDataService } from '@/services/CampaignEditor/GameDataService';
import { getApiUrl } from '@/hooks/useApiUrl';

export const useUtilityOperations = (
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setConnected: (connected: boolean) => void,
  setGameRoot: (root: string) => void
) => {
  const refreshAll = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Prova prima con il backend attivo, poi fallback sui backend di default
      let backends = [];
      try {
        const { BE_BASE_URL } = getApiUrl();
        backends = [BE_BASE_URL];
      } catch {
        // Fallback se BackendContext non è ancora inizializzato
        backends = ['http://localhost:3001', 'http://localhost:3002'];
      }
      
      let connected = false;
      for (const backendUrl of backends) {
        try {
          const response = await fetch(`${backendUrl}/health`);
          
          if (response.ok) {
            const status = await response.json();
            if (status.status === 'OK') {
              setConnected(true);
              setGameRoot(status.gameRoot || backendUrl);
              connected = true;
              break;
            }
          }
        } catch (error) {
          // Continua con il prossimo backend
          continue;
        }
      }
      
      if (!connected) {
        throw new Error('Nessun backend disponibile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const getBackups = async (): Promise<{ name: string; size: number; created: string; path: string }[]> => {
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
      // Prova prima con il backend attivo, poi fallback sui backend di default
      let backends = [];
      try {
        const { BE_BASE_URL } = getApiUrl();
        backends = [BE_BASE_URL];
      } catch {
        // Fallback se BackendContext non è ancora inizializzato
        backends = ['http://localhost:3001', 'http://localhost:3002'];
      }
      
      for (const backendUrl of backends) {
        try {
          const response = await fetch(`${backendUrl}/health`);
          
          if (response.ok) {
            const status = await response.json();
            if (status.status === 'OK') {
              setConnected(true);
              setGameRoot(status.gameRoot || backendUrl);
              return true;
            }
          }
        } catch (error) {
          // Continua con il prossimo backend
          continue;
        }
      }
      
      // Nessun backend disponibile
      setConnected(false);
      return false;
    } catch (err) {
      setConnected(false);
      return false;
    }
  };

  return {
    refreshAll,
    getBackups,
    healthCheck
  };
};
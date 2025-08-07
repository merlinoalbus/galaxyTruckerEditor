import { gameDataService } from '@/services/CampaignEditor/GameDataService';

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
      const status = await gameDataService.healthCheck();
      setConnected(status.status === 'ok');
      setGameRoot(status.gameRoot || '');
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
      const status = await gameDataService.healthCheck();
      const connected = status.status === 'ok';
      setConnected(connected);
      return connected;
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
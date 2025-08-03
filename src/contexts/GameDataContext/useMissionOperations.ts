import { Mission, ValidationError } from '@/types/GameTypes';
import { gameDataService, FileMetadata } from '@/services/CampaignEditor/GameDataService';

export const useMissionOperations = (
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setMissionFiles: (files: FileMetadata[]) => void,
  setCurrentMission: (mission: Mission | null) => void
) => {
  const loadMissions = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const result = await gameDataService.getMissions();
      setMissionFiles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load missions');
    } finally {
      setLoading(false);
    }
  };

  const loadMission = async (filename: string): Promise<Mission | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await gameDataService.getMission(filename);
      const mission = result.parsed;
      setCurrentMission(mission);
      return mission;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mission');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveMission = async (filename: string, mission: Mission): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const content = gameDataService.serializeMissionYAML(mission);
      await gameDataService.saveMission(filename, content);
      setCurrentMission(mission);
      // Refresh missions list
      await loadMissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mission');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteMission = async (filename: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await gameDataService.deleteMission(filename);
      // Clear current mission if it was deleted
      setCurrentMission(null);
      // Refresh missions list
      await loadMissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete mission');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const validateMissionContent = async (filename: string, content: string): Promise<ValidationError[]> => {
    try {
      const result = await gameDataService.validateContent('mission', content);
      return (result.errors || []).map(error => ({
        field: 'content',
        message: error,
        severity: 'error' as const
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate mission');
      return [];
    }
  };

  return {
    loadMissions,
    loadMission,
    saveMission,
    deleteMission,
    validateMissionContent
  };
};
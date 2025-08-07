import { DeckScript, ValidationError } from '@/types/GameTypes';
import { gameDataService, FileMetadata } from '@/services/CampaignEditor/GameDataService';

const serializeDeckScript = (script: DeckScript): string => {
  let content = 'SCRIPTS\n\n';
  content += `  SCRIPT ${script.name}\n`;
  
  script.commands.forEach(cmd => {
    if (cmd.type === 'TmpDeckLoad' && cmd.deckFile) {
      content += `    TmpDeckLoad "${cmd.deckFile}"\n`;
    } else if (cmd.type === 'DeckAddCardType' && cmd.flight !== undefined && cmd.cardType && cmd.count !== undefined) {
      content += `    DeckAddCardType ${cmd.flight} ${cmd.cardType} ${cmd.count}\n`;
    } else if (cmd.type === 'DeckRemoveCardType' && cmd.flight !== undefined && cmd.cardType && cmd.count !== undefined) {
      content += `    DeckRemoveCardType ${cmd.flight} ${cmd.cardType} ${cmd.count}\n`;
    }
  });
  
  content += '\nEND_OF_SCRIPT\n';
  return content;
};

export const useDeckScriptOperations = (
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setDeckScriptFiles: (files: FileMetadata[]) => void,
  setCurrentDeckScript: (script: DeckScript | null) => void
) => {
  const loadDeckScripts = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const result = await gameDataService.getDeckScripts();
      setDeckScriptFiles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deck scripts');
    } finally {
      setLoading(false);
    }
  };

  const loadDeckScript = async (filename: string): Promise<DeckScript | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await gameDataService.getDeckScript(filename);
      const script = result.parsed;
      setCurrentDeckScript(script);
      return script;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deck script');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveDeckScript = async (filename: string, script: DeckScript): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const content = serializeDeckScript(script);
      await gameDataService.saveDeckScript(filename, content);
      setCurrentDeckScript(script);
      // Refresh deck scripts list
      await loadDeckScripts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save deck script');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDeckScript = async (filename: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await gameDataService.deleteDeckScript(filename);
      // Clear current deck script if it was deleted
      setCurrentDeckScript(null);
      // Refresh deck scripts list
      await loadDeckScripts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deck script');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const validateDeckScriptContent = async (filename: string, content: string): Promise<ValidationError[]> => {
    try {
      const result = await gameDataService.validateContent('deckScript', content);
      return (result.errors || []).map(error => ({
        field: 'content',
        message: error,
        severity: 'error' as const
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate deck script');
      return [];
    }
  };

  return {
    loadDeckScripts,
    loadDeckScript,
    saveDeckScript,
    deleteDeckScript,
    validateDeckScriptContent
  };
};
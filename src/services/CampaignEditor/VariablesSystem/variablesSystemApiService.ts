import { API_CONFIG, API_ENDPOINTS } from '@/config/constants';
import { 
  Semaforo, 
  Label, 
  Character, 
  Variable, 
  GameImage, 
  Achievement 
} from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';

export class VariablesSystemApiService {
  private async fetchData<T>(endpoint: string): Promise<T[]> {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  async loadSemafori(): Promise<Semaforo[]> {
    return this.fetchData<Semaforo>(API_ENDPOINTS.SCRIPTS_SEMAPHORES);
  }

  async loadLabels(): Promise<Label[]> {
    return this.fetchData<Label>(API_ENDPOINTS.SCRIPTS_LABELS);
  }

  async loadCharacters(): Promise<Character[]> {
    return this.fetchData<Character>(API_ENDPOINTS.GAME_CHARACTERS);
  }

  async loadVariables(): Promise<Variable[]> {
    return this.fetchData<Variable>(API_ENDPOINTS.SCRIPTS_VARIABLES);
  }

  async loadImages(): Promise<GameImage[]> {
    return this.fetchData<GameImage>(API_ENDPOINTS.IMAGES);
  }

  async loadAchievements(): Promise<Achievement[]> {
    return this.fetchData<Achievement>(API_ENDPOINTS.GAME_ACHIEVEMENTS);
  }

  async loadAllData() {
    try {
      const [semafori, labels, characters, variables, images, achievements] = await Promise.all([
        this.loadSemafori(),
        this.loadLabels(),
        this.loadCharacters(),
        this.loadVariables(),
        this.loadImages(),
        this.loadAchievements()
      ]);

      return {
        semafori,
        labels,
        characters,
        variables,
        images,
        achievements
      };
    } catch (error) {
      console.error('Error loading all data:', error);
      throw error;
    }
  }
}

export const variablesSystemApiService = new VariablesSystemApiService();
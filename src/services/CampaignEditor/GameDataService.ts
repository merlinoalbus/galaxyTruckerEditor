// Servizio per comunicazione con il backend reale
import { Mission, DeckScript } from '@/types/GameTypes';
import { FileParser } from '@/utils/FileParser';
import { API_CONFIG } from '@/config/constants';

const API_BASE = process.env.REACT_APP_API_URL || API_CONFIG.API_BASE_URL;

export interface FileMetadata {
  name: string;
  path: string;
  size: number;
  modified: string;
  created: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface GameStructure {
  directories: string[];
  files: string[];
  fileTypes: Record<string, number>;
  totalSize: number;
}

export interface GameStructureResponse {
  gameRoot: string;
  structure: GameStructure;
  version: string;
  timestamp: string;
}

export interface FileOperationMetadata {
  size: number;
  modified: string;
  encoding: string;
  lineCount?: number;
  backupCreated?: boolean;
}

class GameDataService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Struttura del gioco
  async getGameStructure() {
    return this.request<GameStructureResponse>('/structure');
  }

  // Missioni
  async getMissions(): Promise<FileMetadata[]> {
    const response = await this.request<{
      success: boolean;
      data: Array<{
        nomemission: string;
        nomefile: string;
        numero_blocchi: number;
        numero_comandi: number;
        stellato: boolean;
        languages: string[];
        bottoni_collegati: number;
      }>;
    }>('/missions');
    
    // Trasforma il formato del backend nel formato atteso
    return response.data.map(mission => ({
      name: mission.nomemission,
      path: mission.nomefile,
      size: mission.numero_comandi, // Usa il numero di comandi come size
      modified: new Date().toISOString(), // Non abbiamo questa info dal backend
      created: new Date().toISOString() // Non abbiamo questa info dal backend
    }));
  }

  async getMission(filename: string): Promise<{
    filename: string;
    path: string;
    content: string;
    parsed: Mission;
    metadata: FileOperationMetadata;
  }> {
    return this.request(`/missions/${filename}`);
  }

  async saveMission(filename: string, content: string, createBackup = true): Promise<{
    filename: string;
    path: string;
    saved: boolean;
    metadata: FileOperationMetadata;
  }> {
    return this.request(`/missions/${filename}`, {
      method: 'PUT',
      body: JSON.stringify({ content, createBackup })
    });
  }

  async deleteMission(filename: string, createBackup = true): Promise<{
    filename: string;
    deleted: boolean;
    backup: boolean;
  }> {
    return this.request(`/missions/${filename}`, {
      method: 'DELETE',
      body: JSON.stringify({ createBackup })
    });
  }

  // Deck Scripts
  async getDeckScripts(): Promise<FileMetadata[]> {
    const response = await this.request<{
      category: string;
      path: string;
      files: FileMetadata[];
    }>('/deckScripts');
    return response.files;
  }

  async getDeckScript(filename: string): Promise<{
    filename: string;
    path: string;
    content: string;
    parsed: DeckScript;
    metadata: FileOperationMetadata;
  }> {
    return this.request(`/deckScripts/${filename}`);
  }

  async saveDeckScript(filename: string, content: string, createBackup = true): Promise<{
    filename: string;
    path: string;
    saved: boolean;
    metadata: FileOperationMetadata;
  }> {
    return this.request(`/deckScripts/${filename}`, {
      method: 'PUT',
      body: JSON.stringify({ content, createBackup })
    });
  }

  async deleteDeckScript(filename: string, createBackup = true): Promise<{
    filename: string;
    deleted: boolean;
    backup: boolean;
  }> {
    return this.request(`/deckScripts/${filename}`, {
      method: 'DELETE',
      body: JSON.stringify({ createBackup })
    });
  }

  // Adventure Cards
  async getAdventureCards(): Promise<FileMetadata[]> {
    const response = await this.request<{
      category: string;
      path: string;
      files: FileMetadata[];
    }>('/adventureCards');
    return response.files;
  }

  async getAdventureCard(filename: string): Promise<{
    filename: string;
    path: string;
    content: string;
    parsed: Record<string, unknown>;
    metadata: FileOperationMetadata;
  }> {
    return this.request(`/adventureCards/${filename}`);
  }

  async saveAdventureCard(filename: string, content: string, createBackup = true) {
    return this.request(`/adventureCards/${filename}`, {
      method: 'PUT',
      body: JSON.stringify({ content, createBackup })
    });
  }

  // Ship Parts
  async getShipParts(): Promise<FileMetadata[]> {
    const response = await this.request<{
      category: string;
      path: string;
      files: FileMetadata[];
    }>('/shipParts');
    return response.files;
  }

  async getShipPart(filename: string): Promise<{
    filename: string;
    path: string;
    content: string;
    parsed: Record<string, unknown>;
    metadata: FileOperationMetadata;
  }> {
    return this.request(`/shipParts/${filename}`);
  }

  async saveShipPart(filename: string, content: string, createBackup = true) {
    return this.request(`/shipParts/${filename}`, {
      method: 'PUT',
      body: JSON.stringify({ content, createBackup })
    });
  }

  // Localization
  async getLocalizationFiles(): Promise<FileMetadata[]> {
    const response = await this.request<{
      category: string;
      path: string;
      files: FileMetadata[];
    }>('/localization');
    return response.files;
  }

  async getLocalizationFile(filename: string): Promise<{
    filename: string;
    path: string;
    content: string;
    parsed: Record<string, unknown>;
    metadata: FileOperationMetadata;
  }> {
    return this.request(`/localization/${filename}`);
  }

  async saveLocalizationFile(filename: string, content: string, createBackup = true) {
    return this.request(`/localization/${filename}`, {
      method: 'PUT',
      body: JSON.stringify({ content, createBackup })
    });
  }

  // AI Configs
  async getAiConfigs(): Promise<FileMetadata[]> {
    const response = await this.request<{
      category: string;
      path: string;
      files: FileMetadata[];
    }>('/aiConfigs');
    return response.files;
  }

  // Ships
  async getShips(): Promise<FileMetadata[]> {
    const response = await this.request<{
      category: string;
      path: string;
      files: FileMetadata[];
    }>('/ships');
    return response.files;
  }

  async getShip(filename: string): Promise<{
    filename: string;
    path: string;
    content: string;
    parsed: Record<string, unknown>;
    metadata: FileOperationMetadata;
  }> {
    return this.request(`/ships/${filename}`);
  }

  async saveShip(filename: string, content: string, createBackup = true) {
    return this.request(`/ships/${filename}`, {
      method: 'PUT',
      body: JSON.stringify({ content, createBackup })
    });
  }

  // Ship Plans (list from ships/*.yaml)
  async getShipPlans(): Promise<Array<{ id: string; type: string | null }>> {
    const response = await this.request<{ success: boolean; data: Array<{ id: string; type: string | null }> }>(
      '/game/ship-plans'
    );
    return response.data || [];
  }

  // Validazione
  async validateContent(category: string, content: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    return this.request(`/validate/${category}`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  // Backup
  async getBackups(): Promise<{
    backups: Array<{
      name: string;
      size: number;
      created: string;
      path: string;
    }>;
  }> {
    return this.request('/backups');
  }

  // Health check
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    gameRoot: string;
    backupDir: string;
  }> {
    return this.request('/health');
  }

  // Campaign
  async getCampaigns(): Promise<FileMetadata[]> {
    const response = await this.request<{
      category: string;
      path: string;
      files: FileMetadata[];
    }>('/campaign');
    return response.files;
  }

  async getCampaignMissions(): Promise<FileMetadata[]> {
    const response = await this.request<{
      category: string;
      path: string;
      files: FileMetadata[];
    }>('/campaignMissions');
    return response.files;
  }

  // Utility per creare nuovi file
  generateMissionFilename(missionName: string): string {
    return `${missionName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.yaml`;
  }

  generateDeckScriptFilename(scriptName: string): string {
    return `${scriptName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;
  }

  // Parser per missioni - usa FileParser completo
  parseMissionYAML(yamlContent: string): Mission {
    return FileParser.parseMissionYAML(yamlContent);
  }

  // Serializer per missioni - usa FileParser completo  
  serializeMissionYAML(mission: Mission): string {
    return FileParser.serializeMissionYAML(mission);
  }
}

export const gameDataService = new GameDataService();
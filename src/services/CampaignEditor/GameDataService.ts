// Servizio per comunicazione con il backend reale
import { Mission, DeckScript, ValidationError } from '../../types/GameTypes';
import { FileParser } from '../../utils/FileParser';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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
    return this.request<{
      gameRoot: string;
      structure: Record<string, any>;
      version: string;
      timestamp: string;
    }>('/structure');
  }

  // Missioni
  async getMissions(): Promise<FileMetadata[]> {
    const response = await this.request<{
      category: string;
      path: string;
      files: FileMetadata[];
    }>('/missions');
    return response.files;
  }

  async getMission(filename: string): Promise<{
    filename: string;
    path: string;
    content: string;
    parsed: Mission;
    metadata: any;
  }> {
    return this.request(`/missions/${filename}`);
  }

  async saveMission(filename: string, content: string, createBackup = true): Promise<{
    filename: string;
    path: string;
    saved: boolean;
    metadata: any;
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
    parsed: any;
    metadata: any;
  }> {
    return this.request(`/deckScripts/${filename}`);
  }

  async saveDeckScript(filename: string, content: string, createBackup = true): Promise<{
    filename: string;
    path: string;
    saved: boolean;
    metadata: any;
  }> {
    return this.request(`/deckScripts/${filename}`, {
      method: 'PUT',
      body: JSON.stringify({ content, createBackup })
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
    parsed: any;
    metadata: any;
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
    parsed: any;
    metadata: any;
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
    parsed: any;
    metadata: any;
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
    parsed: any;
    metadata: any;
  }> {
    return this.request(`/ships/${filename}`);
  }

  async saveShip(filename: string, content: string, createBackup = true) {
    return this.request(`/ships/${filename}`, {
      method: 'PUT',
      body: JSON.stringify({ content, createBackup })
    });
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
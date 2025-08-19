import { logger } from '@/utils/logger';
import { MapNode, MapConnection, CampaignScript, Mission } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
// (rimosso ScriptCommand import non utilizzato)
import { API_CONFIG, API_ENDPOINTS } from '@/config/constants';

class InteractiveMapService {
  async loadNodes(): Promise<MapNode[]> {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.GAME_NODES}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // API /game/nodes ritorna già i nodi processati secondo documentazione
      if (data.success && data.data) {
        return data.data;
      }
      
      return [];
    } catch (error) {
  logger.error('Error loading nodes:', error);
      throw error;
    }
  }

  async loadMissions(): Promise<Mission[]> {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.MISSIONS_ROUTES}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // API /missions/routes ritorna già le rotte/missions processate secondo documentazione
      if (data.success && data.data) {
        return data.data;
      }
      
      return [];
    } catch (error) {
  logger.error('Error loading missions:', error);
      return [];
    }
  }

  async loadAllScripts(): Promise<CampaignScript[]> {
    try {
      // Usa API /scripts per ottenere lista completa scripts
      const response = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Ritorna i dati così come arrivano dall'API, aggiungendo backward compatibility
        return data.data.map((scriptInfo: any) => ({
          ...scriptInfo,
          // Backward compatibility fields
          name: scriptInfo.nomescript,
          fileName: scriptInfo.nomefile,
          commands: [], // I comandi verranno caricati separatamente se necessario
          relatedNodes: scriptInfo.nodi_referenziati || [],
          relatedConnections: []
        }));
      }
      
      return [];
    } catch (error) {
  logger.error('Error loading all scripts:', error);
      return [];
    }
  }

  // Deprecato: La business logic è stata spostata in useConnectionBuilder hook
  // Questo metodo rimane solo per compatibilità backward ma non dovrebbe essere utilizzato
  async buildConnections(nodes: MapNode[], missions: Mission[]): Promise<MapConnection[]> {
  logger.warn('interactiveMapService.buildConnections is deprecated. Use useConnectionBuilder hook instead.');
    return [];
  }

  analyzeScriptConnections(scripts: CampaignScript[], nodes: MapNode[], connections: MapConnection[]): void {
    scripts.forEach(script => {
      // Ora usa i dati già processati dall'API /scripts invece di parsing manuale
      script.relatedNodes = script.relatedNodes || this.findRelatedNodes(script, nodes);
      script.relatedConnections = this.findRelatedConnections(script, connections);
    });
  }

  private findRelatedNodes(script: CampaignScript, nodes: MapNode[]): string[] {
    // Se l'API /scripts fornisce già nodi_referenziati, usali
    if (script.nodi_referenziati && script.nodi_referenziati.length > 0) {
      return script.nodi_referenziati;
    }
    if (script.relatedNodes && script.relatedNodes.length > 0) {
      return script.relatedNodes;
    }
    
    // Fallback alla logica esistente se necessario
    const relatedNodes: string[] = [];
    if (script.commands && script.commands.length > 0) {
      const scriptContent = script.commands.map(cmd => cmd.content).join(' ').toLowerCase();
      
      nodes.forEach(node => {
        const nodeName = node.name?.toLowerCase() || '';
        const nodeCaption = node.localizedCaptions?.EN?.toLowerCase().replace(/\s+/g, '') || 
                          node.caption?.toLowerCase().replace(/\s+/g, '') || '';
        
        if (scriptContent.includes(nodeName) || scriptContent.includes(nodeCaption)) {
          relatedNodes.push(node.name);
        }
      });

      script.commands.forEach(cmd => {
        if (cmd.type === 'center_map') {
          const match = cmd.content.match(/CenterMapByNode\s+(\w+)/i);
          if (match && !relatedNodes.includes(match[1])) {
            relatedNodes.push(match[1]);
          }
        }
      });
    }

    return relatedNodes;
  }

  private findRelatedConnections(script: CampaignScript, connections: MapConnection[]): string[] {
    const relatedConnections: string[] = [];
    
    if (script.commands && script.commands.length > 0) {
      const scriptContent = script.commands.map(cmd => cmd.content).join(' ').toLowerCase();
      
      connections.forEach(conn => {
        const connectionId = `${conn.from}-${conn.to}`;
        if (scriptContent.includes(conn.from.toLowerCase()) && 
            scriptContent.includes(conn.to.toLowerCase())) {
          relatedConnections.push(connectionId);
        }
      });
    }

    return relatedConnections;
  }

  // Nuovi metodi per recuperare altre entità tramite API
  async loadVariables(): Promise<any[]> {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_VARIABLES}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.success && data.data ? data.data : [];
    } catch (error) {
  logger.error('Error loading variables:', error);
      return [];
    }
  }

  async loadCharacters(): Promise<any[]> {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.GAME_CHARACTERS}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.success && data.data ? data.data : [];
    } catch (error) {
  logger.error('Error loading characters:', error);
      return [];
    }
  }

  async loadButtons(): Promise<any[]> {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.GAME_BUTTONS}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.success && data.data ? data.data : [];
    } catch (error) {
  logger.error('Error loading buttons:', error);
      return [];
    }
  }

  async loadSemaphores(): Promise<any[]> {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_SEMAPHORES}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.success && data.data ? data.data : [];
    } catch (error) {
  logger.error('Error loading semaphores:', error);
      return [];
    }
  }

  async loadLabels(): Promise<any[]> {
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_LABELS}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.success && data.data ? data.data : [];
    } catch (error) {
  logger.error('Error loading labels:', error);
      return [];
    }
  }

  // Metodo per caricare immagini tramite API
  async loadImages(imagePaths: string[]): Promise<any[]> {
    if (!imagePaths || imagePaths.length === 0) return [];
    
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.IMAGES_BINARY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ percorsi: imagePaths })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.success && data.data ? data.data : [];
    } catch (error) {
  logger.error('Error loading images:', error);
      return [];
    }
  }
}

export const interactiveMapService = new InteractiveMapService();
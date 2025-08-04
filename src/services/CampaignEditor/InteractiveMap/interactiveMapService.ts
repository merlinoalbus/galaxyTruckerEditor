import { MapNode, MapConnection, CampaignScript, Mission } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { ScriptCommand } from '@/types/CampaignEditor/CampaignEditor.types';
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
      console.error('Error loading nodes:', error);
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
      console.error('Error loading missions:', error);
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
      console.error('Error loading all scripts:', error);
      return [];
    }
  }

  async buildConnections(nodes: MapNode[], missions: Mission[]): Promise<MapConnection[]> {
    const connections: MapConnection[] = [];
    const processedRoutes = new Set<string>();
    
    // Group missions by route, treating bidirectional routes as one
    const routeMap = new Map<string, Mission[]>();
    
    missions.forEach(mission => {
      if (mission.source && mission.destination) {
        // Always use alphabetically sorted key to group bidirectional routes
        const nodes = [mission.source, mission.destination].sort();
        const routeKey = `${nodes[0]}-${nodes[1]}`;
        
        if (!routeMap.has(routeKey)) {
          routeMap.set(routeKey, []);
        }
        routeMap.get(routeKey)!.push(mission);
      }
    });
    
    // Build connections from all routes in missions
    routeMap.forEach((routeMissions, routeKey) => {
      const [node1, node2] = routeKey.split('-');
      
      // Use the first mission to determine direction
      const firstMission = routeMissions[0];
      const source = firstMission.source;
      const destination = firstMission.destination;
      
      // Skip if already processed
      if (processedRoutes.has(routeKey)) {
        return;
      }
      
      processedRoutes.add(routeKey);
      
      // Collect all available license classes and mission data
      let availableLicenses: ('STI' | 'STII' | 'STIII')[] = [];
      let hasSTIII = false, hasSTII = false, hasSTI = false;
      let startScripts: string[] = [];
      let hasUniqueMissions = false;
      let cost = 0;
      
      routeMissions.forEach(mission => {
        if (mission.license === 'STIII') hasSTIII = true;
        else if (mission.license === 'STII') hasSTII = true;
        else if (mission.license === 'STI') hasSTI = true;
        
        // Collect start scripts (⭐ scripts) from button field
        if (mission.button && typeof mission.button === 'object' && mission.button.script) {
          if (!startScripts.includes(mission.button.script)) {
            startScripts.push(mission.button.script);
          }
        }
        
        if (mission.missiontype === 'UNIQUE') {
          hasUniqueMissions = true;
        }
        
        // Use cost from mission if available
        if (mission.cost && mission.cost > cost) {
          cost = mission.cost;
        }
      });
      
      // Build array of available licenses
      if (hasSTI) availableLicenses.push('STI');
      if (hasSTII) availableLicenses.push('STII');
      if (hasSTIII) availableLicenses.push('STIII');
      
      // Get highest license for primary display
      let highestLicense: 'STI' | 'STII' | 'STIII' | undefined;
      if (hasSTIII) highestLicense = 'STIII';
      else if (hasSTII) highestLicense = 'STII';
      else if (hasSTI) highestLicense = 'STI';

      // Convert available licenses to flight classes for display
      let flightClasses: ('I' | 'II' | 'III')[] = [];
      availableLicenses.forEach(license => {
        if (license === 'STIII') flightClasses.push('III');
        else if (license === 'STII') flightClasses.push('II');
        else if (license === 'STI') flightClasses.push('I');
      });
      
      let flightClass: 'I' | 'II' | 'III' | undefined = flightClasses[0];

      connections.push({
        from: source,
        to: destination,
        cost: cost,
        flightClass,
        flightClasses, // All available classes
        license: highestLicense,
        availableLicenses, // All available licenses
        startScripts: [...new Set(startScripts)], // Remove duplicates
        hasUniqueMissions,
        missions: routeMissions,
        visibilityCondition: {
          type: 'always' // All routes visible for now
        },
        isVisible: true
      });
    });

    // Add shuttle connections from nodes
    nodes.forEach(node => {
      if (node.shuttles) {
        node.shuttles.forEach(([targetNode, cost]) => {
          // Create normalized key for bidirectional routes
          const nodes = [node.name, targetNode].sort();
          const shuttleKey = `shuttle-${nodes[0]}-${nodes[1]}`;
          
          if (!processedRoutes.has(shuttleKey)) {
            processedRoutes.add(shuttleKey);
            
            connections.push({
              from: node.name,
              to: targetNode,
              cost: cost,
              isShuttle: true, // Mark as shuttle connection
              visibilityCondition: {
                type: 'always'
              },
              isVisible: true,
              missions: [], // No missions for shuttles
              startScripts: [],
              hasUniqueMissions: false
            } as MapConnection);
          }
        });
      }
    });

    return connections;
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
      console.error('Error loading variables:', error);
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
      console.error('Error loading characters:', error);
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
      console.error('Error loading buttons:', error);
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
      console.error('Error loading semaphores:', error);
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
      console.error('Error loading labels:', error);
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
      console.error('Error loading images:', error);
      return [];
    }
  }
}

export const interactiveMapService = new InteractiveMapService();
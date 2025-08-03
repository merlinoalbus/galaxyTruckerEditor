import { MapNode, MapConnection, CampaignScript, Mission } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { ScriptCommand } from '@/types/CampaignEditor/CampaignEditor.types';

const API_BASE = 'http://localhost:3001/api';

class InteractiveMapService {
  async loadNodes(): Promise<MapNode[]> {
    try {
      const response = await fetch(`${API_BASE}/campaignMissions/nodes.yaml`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const yaml = await import('js-yaml');
      
      if (data.content) {
        const parsedNodes = yaml.load(data.content) as MapNode[];
        return Array.isArray(parsedNodes) ? parsedNodes : [];
      }
      
      return [];
    } catch (error) {
      console.error('Error loading nodes:', error);
      throw error;
    }
  }

  async loadMissions(): Promise<Mission[]> {
    try {
      const response = await fetch(`${API_BASE}/campaignMissions/missions.yaml`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const yaml = await import('js-yaml');
      
      if (data.content) {
        const parsedMissions = yaml.load(data.content) as Mission[];
        return Array.isArray(parsedMissions) ? parsedMissions : [];
      }
      
      return [];
    } catch (error) {
      console.error('Error loading missions:', error);
      return [];
    }
  }

  async loadAllScripts(): Promise<CampaignScript[]> {
    const scriptFiles = [
      'tutorials.txt',
      'scripts1.txt',
      'scripts2.txt', 
      'scripts3.txt',
      'scripts4.txt',
      'scripts5.txt',
      'missions.txt',
      'inits.txt'
    ];

    const allScripts: CampaignScript[] = [];

    for (const fileName of scriptFiles) {
      try {
        const response = await fetch(`${API_BASE}/campaign/${fileName}`);
        if (response.ok) {
          const data = await response.json();
          const scriptContent = data.content || '';
          const parsedScripts = this.parseScriptFile(scriptContent, fileName);
          allScripts.push(...parsedScripts);
        }
      } catch (error) {
        console.warn(`Could not load ${fileName}:`, error);
      }
    }

    return allScripts;
  }

  async buildConnections(nodes: MapNode[], missions: Mission[]): Promise<MapConnection[]> {
    const connections: MapConnection[] = [];
    const processedRoutes = new Set<string>();
    
    // Create a map of missions by route
    const missionMap = new Map<string, Mission[]>();
    missions.forEach(mission => {
      if (mission.source && mission.destination) {
        const routeKey = `${mission.source}-${mission.destination}`;
        if (!missionMap.has(routeKey)) {
          missionMap.set(routeKey, []);
        }
        missionMap.get(routeKey)!.push(mission);
      }
    });
    
    nodes.forEach(node => {
      if (node.shuttles) {
        node.shuttles.forEach(([targetNode, cost]) => {
          const routeKey = `${node.name}-${targetNode}`;
          const reverseRouteKey = `${targetNode}-${node.name}`;
          
          // Skip if we already processed this route or its reverse
          if (processedRoutes.has(routeKey) || processedRoutes.has(reverseRouteKey)) {
            return;
          }
          
          processedRoutes.add(routeKey);
          const routeMissions = missionMap.get(routeKey) || [];
          
          // Collect all available license classes and mission data
          let availableLicenses: ('STI' | 'STII' | 'STIII')[] = [];
          let hasSTIII = false, hasSTII = false, hasSTI = false;
          let startScripts: string[] = [];
          let hasUniqueMissions = false;
          
          routeMissions.forEach(mission => {
            if (mission.license === 'STIII') hasSTIII = true;
            else if (mission.license === 'STII') hasSTII = true;
            else if (mission.license === 'STI') hasSTI = true;
            
            // Collect start scripts (⭐ scripts)
            if (mission.button && mission.button[2]) {
              startScripts.push(mission.button[2]);
            }
            
            if (mission.missiontype === 'UNIQUE') {
              hasUniqueMissions = true;
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
            from: node.name,
            to: targetNode,
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
      }
    });

    return connections;
  }

  analyzeScriptConnections(scripts: CampaignScript[], nodes: MapNode[], connections: MapConnection[]): void {
    scripts.forEach(script => {
      script.relatedNodes = this.findRelatedNodes(script, nodes);
      script.relatedConnections = this.findRelatedConnections(script, connections);
    });
  }

  private parseScriptFile(content: string, fileName: string): CampaignScript[] {
    const scripts: CampaignScript[] = [];
    const lines = content.split('\n');
    let currentScript: Partial<CampaignScript> | null = null;
    let currentCommands: ScriptCommand[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('SCRIPT ')) {
        if (currentScript) {
          scripts.push({
            name: currentScript.name!,
            fileName,
            commands: currentCommands,
            relatedNodes: [],
            relatedConnections: []
          });
        }
        
        const scriptName = line.replace('SCRIPT ', '').trim();
        currentScript = { name: scriptName, fileName };
        currentCommands = [];
        
      } else if (line === 'END_OF_SCRIPT') {
        if (currentScript) {
          scripts.push({
            name: currentScript.name!,
            fileName,
            commands: currentCommands,
            relatedNodes: [],
            relatedConnections: []
          });
          currentScript = null;
          currentCommands = [];
        }
        
      } else if (currentScript && line && !line.startsWith('SCRIPTS')) {
        currentCommands.push({
          line: i + 1,
          content: line,
          type: this.identifyCommandType(line)
        });
      }
    }

    return scripts;
  }

  private identifyCommandType(line: string): string {
    const upperLine = line.toUpperCase().trim();
    
    if (upperLine.startsWith('CENTERMAPBYNODE')) return 'center_map';
    if (upperLine.startsWith('SUB_SCRIPT')) return 'subscript';
    if (upperLine.startsWith('SAY')) return 'dialogue';
    if (upperLine.startsWith('ASK')) return 'question';
    if (upperLine.startsWith('SHOWCHAR')) return 'show_character';
    if (upperLine.startsWith('HIDECHAR')) return 'hide_character';
    if (upperLine.startsWith('SET ')) return 'variable_set';
    if (upperLine.startsWith('IF ')) return 'condition_start';
    if (upperLine.startsWith('MENU')) return 'menu_start';
    if (upperLine.startsWith('OPT ')) return 'menu_option';
    if (upperLine.startsWith('GO ')) return 'goto';
    if (upperLine.startsWith('LABEL ')) return 'label';
    
    return 'unknown';
  }

  private findRelatedNodes(script: CampaignScript, nodes: MapNode[]): string[] {
    const relatedNodes: string[] = [];
    const scriptContent = script.commands.map(cmd => cmd.content).join(' ').toLowerCase();
    
    nodes.forEach(node => {
      if (scriptContent.includes(node.name.toLowerCase()) ||
          scriptContent.includes(node.caption.toLowerCase().replace(/\s+/g, ''))) {
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

    return relatedNodes;
  }

  private findRelatedConnections(script: CampaignScript, connections: MapConnection[]): string[] {
    const relatedConnections: string[] = [];
    const scriptContent = script.commands.map(cmd => cmd.content).join(' ').toLowerCase();
    
    connections.forEach(conn => {
      const connectionId = `${conn.from}-${conn.to}`;
      if (scriptContent.includes(conn.from.toLowerCase()) && 
          scriptContent.includes(conn.to.toLowerCase())) {
        relatedConnections.push(connectionId);
      }
    });

    return relatedConnections;
  }
}

export const interactiveMapService = new InteractiveMapService();
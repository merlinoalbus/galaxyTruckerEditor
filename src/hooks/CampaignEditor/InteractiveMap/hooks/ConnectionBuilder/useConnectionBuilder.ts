import { useCallback } from 'react';
import { MapNode, MapConnection, Mission } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';

export const useConnectionBuilder = () => {
  const buildConnections = useCallback((nodes: MapNode[], missions: Mission[]): MapConnection[] => {
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
  }, []);

  return {
    buildConnections
  };
};
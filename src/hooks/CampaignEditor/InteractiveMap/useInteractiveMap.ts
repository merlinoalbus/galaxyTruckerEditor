import { useState, useEffect, useCallback } from 'react';
import { MapNode, MapConnection, CampaignScript, MapViewport, Mission } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { useMapData } from './useMapData';
import { useScriptSelection } from './useScriptSelection';

export interface UseInteractiveMapReturn {
  nodes: MapNode[];
  connections: MapConnection[];
  scripts: CampaignScript[];
  viewport: MapViewport;
  selectedNode: string | null;
  selectedConnection: string | null;
  hoveredElement: string | null;
  isLoading: boolean;
  error: string | null;
  scriptSelectorOpen: boolean;
  scriptSelectorData: {
    scripts: CampaignScript[];
    missions: Mission[];
    title: string;
    startScripts?: string[];
  };
  handleNodeClick: (node: MapNode, openSelector?: boolean) => CampaignScript[];
  handleConnectionClick: (connection: MapConnection, openSelector?: boolean) => CampaignScript[];
  handleScriptSelect: (script: CampaignScript) => void;
  handleMissionSelectInternal: (mission: Mission) => void;
  handleScriptSelectorClose: () => void;
  setHoveredElement: (element: string | null) => void;
  setViewport: (viewport: MapViewport) => void;
  getNodeRelatedScripts: (node: MapNode) => CampaignScript[];
  getConnectionRelatedScripts: (connection: MapConnection) => CampaignScript[];
}

export const useInteractiveMap = (
  onScriptSelect?: (script: CampaignScript) => void
): UseInteractiveMapReturn => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const [viewport, setViewport] = useState<MapViewport>({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    scale: 1
  });

  const {
    nodes,
    connections,
    scripts,
    isLoading,
    error,
    loadMapData
  } = useMapData(setViewport);

  const handleMissionSelect = useCallback((mission: Mission) => {
    // Per ora logghiamo solo la selezione della missione
    // Mission selected
  }, []);

  const {
    scriptSelectorOpen,
    scriptSelectorData,
    handleScriptSelect,
    handleMissionSelect: handleMissionSelectInternal,
    handleScriptSelectorClose,
    openScriptSelector
  } = useScriptSelection(onScriptSelect, handleMissionSelect);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  const getNodeRelatedScripts = useCallback((node: MapNode): CampaignScript[] => {
    return scripts.filter(script => {
      // Usa prima i dati della nuova API, poi fallback alla vecchia struttura
      const relatedNodes = script.nodi_referenziati || script.relatedNodes || [];
      const scriptName = script.nomescript || script.name || '';
      
      return relatedNodes.includes(node.name) ||
        (node.buttons && node.buttons.some(btn => 
          scriptName.toLowerCase().includes(btn.script?.toLowerCase() || '')
        ));
    });
  }, [scripts]);

  const getConnectionRelatedScripts = useCallback((connection: MapConnection): CampaignScript[] => {
    const connectionId = `${connection.from}-${connection.to}`;
    return scripts.filter(script => {
      const relatedConnections = script.relatedConnections || [];
      return relatedConnections.includes(connectionId);
    });
  }, [scripts]);

  const handleNodeClick = useCallback((node: MapNode, openSelector: boolean = true) => {
    const relatedScripts = getNodeRelatedScripts(node);
    
    setSelectedNode(node.name);
    setSelectedConnection(null);
    
    if (openSelector && relatedScripts.length > 0) {
      const nodeStartScripts: string[] = [];
      if (node.buttons) {
        node.buttons.forEach((button) => {
          const scriptName = button.script;
          const scriptActualName = (script: CampaignScript) => script.nomescript || script.name || '';
          if (scriptName && relatedScripts.some(script => scriptActualName(script) === scriptName)) {
            nodeStartScripts.push(scriptName);
          }
        });
      }
      
      const nodeCaption = node.localizedCaptions?.EN || node.caption || node.name;
      openScriptSelector(
        relatedScripts,
        `Scripts for ${nodeCaption}`,
        nodeStartScripts,
        [] // Nessuna missione per i nodi
      );
    }
    
    return relatedScripts;
  }, [getNodeRelatedScripts, openScriptSelector]);

  const handleConnectionClick = useCallback((connection: MapConnection, openSelector: boolean = true) => {
    const connectionId = `${connection.from}-${connection.to}`;
    
    // Get all scripts related to this connection
    const allRelatedScripts: CampaignScript[] = [];
    
    // Add scripts from script_collegati_ricorsivamente if available
    if (connection.missions && connection.missions.length > 0) {
      connection.missions.forEach(mission => {
        if (mission.script_collegati_ricorsivamente) {
          mission.script_collegati_ricorsivamente.forEach(scriptName => {
            const script = scripts.find(s => 
              (s.nomescript || s.name) === scriptName
            );
            if (script && !allRelatedScripts.some(s => (s.nomescript || s.name) === scriptName)) {
              allRelatedScripts.push(script);
            }
          });
        }
      });
    }
    
    // If no recursive scripts found, fallback to old method
    if (allRelatedScripts.length === 0) {
      const relatedScripts = getConnectionRelatedScripts(connection);
      allRelatedScripts.push(...relatedScripts);
    }
    
    setSelectedConnection(connectionId);
    setSelectedNode(null);
    
    if (openSelector && (allRelatedScripts.length > 0 || (connection.missions && connection.missions.length > 0))) {
      openScriptSelector(
        allRelatedScripts,
        `${connection.from} → ${connection.to}`,
        connection.startScripts || [],
        connection.missions || []
      );
    }
    
    return allRelatedScripts;
  }, [getConnectionRelatedScripts, openScriptSelector, scripts]);


  return {
    nodes,
    connections,
    scripts,
    viewport,
    selectedNode,
    selectedConnection,
    hoveredElement,
    isLoading,
    error,
    scriptSelectorOpen,
    scriptSelectorData,
    handleNodeClick,
    handleConnectionClick,
    handleScriptSelect,
    handleMissionSelectInternal,
    handleScriptSelectorClose,
    setHoveredElement,
    setViewport,
    getNodeRelatedScripts,
    getConnectionRelatedScripts
  };
};
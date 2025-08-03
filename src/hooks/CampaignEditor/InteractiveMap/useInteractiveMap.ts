import { useState, useEffect, useCallback } from 'react';
import { MapNode, MapConnection, CampaignScript, MapViewport } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
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
    title: string;
    startScripts?: string[];
  };
  handleNodeClick: (node: MapNode, openSelector?: boolean) => CampaignScript[];
  handleConnectionClick: (connection: MapConnection, openSelector?: boolean) => CampaignScript[];
  handleScriptSelect: (script: CampaignScript) => void;
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

  const {
    scriptSelectorOpen,
    scriptSelectorData,
    handleScriptSelect,
    handleScriptSelectorClose,
    openScriptSelector
  } = useScriptSelection(onScriptSelect);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  const getNodeRelatedScripts = useCallback((node: MapNode): CampaignScript[] => {
    return scripts.filter(script => 
      script.relatedNodes.includes(node.name) ||
      (node.buttons && node.buttons.some(btn => 
        script.name.toLowerCase().includes(btn[1].toLowerCase())
      ))
    );
  }, [scripts]);

  const getConnectionRelatedScripts = useCallback((connection: MapConnection): CampaignScript[] => {
    const connectionId = `${connection.from}-${connection.to}`;
    return scripts.filter(script => 
      script.relatedConnections.includes(connectionId)
    );
  }, [scripts]);

  const handleNodeClick = useCallback((node: MapNode, openSelector: boolean = true) => {
    const relatedScripts = getNodeRelatedScripts(node);
    
    setSelectedNode(node.name);
    setSelectedConnection(null);
    
    if (openSelector && relatedScripts.length > 0) {
      const nodeStartScripts: string[] = [];
      if (node.buttons) {
        node.buttons.forEach((button) => {
          const scriptName = button[1];
          if (scriptName && relatedScripts.some(script => script.name === scriptName)) {
            nodeStartScripts.push(scriptName);
          }
        });
      }
      
      openScriptSelector(
        relatedScripts,
        `Scripts for ${node.caption}`,
        nodeStartScripts
      );
    }
    
    return relatedScripts;
  }, [getNodeRelatedScripts, openScriptSelector]);

  const handleConnectionClick = useCallback((connection: MapConnection, openSelector: boolean = true) => {
    const connectionId = `${connection.from}-${connection.to}`;
    const relatedScripts = getConnectionRelatedScripts(connection);
    
    setSelectedConnection(connectionId);
    setSelectedNode(null);
    
    if (openSelector && relatedScripts.length > 0) {
      openScriptSelector(
        relatedScripts,
        `Scripts for ${connection.from} → ${connection.to}`,
        []
      );
    }
    
    return relatedScripts;
  }, [getConnectionRelatedScripts, openScriptSelector]);


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
    handleScriptSelectorClose,
    setHoveredElement,
    setViewport,
    getNodeRelatedScripts,
    getConnectionRelatedScripts
  };
};
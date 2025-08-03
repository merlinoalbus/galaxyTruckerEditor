import { useState, useEffect, useCallback } from 'react';
import { MapNode, MapConnection, CampaignScript, MapViewport } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { interactiveMapService } from '@/services/CampaignEditor/InteractiveMap/interactiveMapService';

// Function to resolve node overlaps
const resolveNodeOverlaps = (nodes: MapNode[]): MapNode[] => {
  const adjustedNodes = [...nodes];
  const minDistance = 80; // Minimum distance between nodes
  const maxAttempts = 10; // Maximum adjustment attempts per node
  
  for (let i = 0; i < adjustedNodes.length; i++) {
    for (let j = i + 1; j < adjustedNodes.length; j++) {
      const nodeA = adjustedNodes[i];
      const nodeB = adjustedNodes[j];
      
      const distance = Math.sqrt(
        Math.pow(nodeA.coordinates[0] - nodeB.coordinates[0], 2) + 
        Math.pow(nodeA.coordinates[1] - nodeB.coordinates[1], 2)
      );
      
      if (distance < minDistance) {
        // Calculate adjustment vector
        const angle = Math.atan2(
          nodeB.coordinates[1] - nodeA.coordinates[1],
          nodeB.coordinates[0] - nodeA.coordinates[0]
        );
        
        const adjustmentDistance = (minDistance - distance) / 2 + 5;
        
        // Move both nodes apart
        nodeA.coordinates[0] -= Math.cos(angle) * adjustmentDistance;
        nodeA.coordinates[1] -= Math.sin(angle) * adjustmentDistance;
        nodeB.coordinates[0] += Math.cos(angle) * adjustmentDistance;
        nodeB.coordinates[1] += Math.sin(angle) * adjustmentDistance;
      }
    }
  }
  
  return adjustedNodes;
};

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
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [connections, setConnections] = useState<MapConnection[]>([]);
  const [scripts, setScripts] = useState<CampaignScript[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptSelectorOpen, setScriptSelectorOpen] = useState(false);
  const [scriptSelectorData, setScriptSelectorData] = useState<{
    scripts: CampaignScript[];
    title: string;
    startScripts?: string[];
  }>({ scripts: [], title: '' });

  const [viewport, setViewport] = useState<MapViewport>({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    scale: 1  // Scala iniziale 100%
  });

  const loadMapData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [loadedNodes, loadedScripts, loadedMissions] = await Promise.all([
        interactiveMapService.loadNodes(),
        interactiveMapService.loadAllScripts(),
        interactiveMapService.loadMissions()
      ]);

      const loadedConnections = await interactiveMapService.buildConnections(loadedNodes, loadedMissions);
      
      interactiveMapService.analyzeScriptConnections(loadedScripts, loadedNodes, loadedConnections);

      // Resolve node overlaps
      const adjustedNodes = resolveNodeOverlaps(loadedNodes);

      setNodes(adjustedNodes);
      setConnections(loadedConnections);
      setScripts(loadedScripts);

      // Center on newbie node
      const newbieNode = loadedNodes.find(node => node.name === 'newbie');
      if (newbieNode) {
        const centerX = newbieNode.coordinates[0];
        const centerY = newbieNode.coordinates[1];
        
        setViewport(prev => ({
          ...prev,
          x: centerX - (prev.width / prev.scale) / 2,
          y: centerY - (prev.height / prev.scale) / 2
        }));
      }

    } catch (err) {
      console.error('Error loading map data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load map data');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      // For nodes, check which scripts are referenced by node buttons
      // node.buttons = [[buttonId, scriptName, displayText], ...]
      const nodeStartScripts: string[] = [];
      if (node.buttons) {
        node.buttons.forEach((button) => {
          const scriptName = button[1]; // Script name is at index 1
          if (scriptName && relatedScripts.some(script => script.name === scriptName)) {
            nodeStartScripts.push(scriptName);
          }
        });
      }
      
      console.log('Node click - node:', node);
      console.log('Node click - node.buttons:', node.buttons);
      console.log('Node click - nodeStartScripts:', nodeStartScripts);
      console.log('Node click - relatedScripts:', relatedScripts.map(s => s.name));
      
      setScriptSelectorData({
        scripts: relatedScripts,
        title: `Scripts for ${node.caption}`,
        startScripts: nodeStartScripts
      });
      setScriptSelectorOpen(true);
    }
    
    return relatedScripts;
  }, [getNodeRelatedScripts]);

  const handleConnectionClick = useCallback((connection: MapConnection, openSelector: boolean = true) => {
    const connectionId = `${connection.from}-${connection.to}`;
    const relatedScripts = getConnectionRelatedScripts(connection);
    
    setSelectedConnection(connectionId);
    setSelectedNode(null);
    
    if (openSelector && relatedScripts.length > 0) {
      console.log('Connection click - connection:', connection);
      console.log('Connection click - startScripts:', connection.startScripts);
      console.log('Connection click - relatedScripts:', relatedScripts.map(s => s.name));
      
      // For connections, startScripts are mission names, not dialog script names
      // So we don't show stars for connections (no direct correlation)
      setScriptSelectorData({
        scripts: relatedScripts,
        title: `Scripts for ${connection.from} → ${connection.to}`,
        startScripts: [] // No stars for connection scripts
      });
      setScriptSelectorOpen(true);
    }
    
    return relatedScripts;
  }, [getConnectionRelatedScripts]);

  const handleScriptSelect = useCallback((script: CampaignScript) => {
    setScriptSelectorOpen(false);
    if (onScriptSelect) {
      onScriptSelect(script);
    }
  }, [onScriptSelect]);

  const handleScriptSelectorClose = useCallback(() => {
    setScriptSelectorOpen(false);
  }, []);

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
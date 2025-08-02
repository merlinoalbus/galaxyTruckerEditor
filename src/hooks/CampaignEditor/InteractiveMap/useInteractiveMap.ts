import { useState, useEffect, useCallback } from 'react';
import { MapNode, MapConnection, CampaignScript, MapViewport } from '../../../types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { interactiveMapService } from '../../../services/CampaignEditor/InteractiveMap/interactiveMapService';

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
  };
  handleNodeClick: (node: MapNode) => void;
  handleConnectionClick: (connection: MapConnection) => void;
  handleScriptSelect: (script: CampaignScript) => void;
  handleScriptSelectorClose: () => void;
  setHoveredElement: (element: string | null) => void;
  setViewport: (viewport: MapViewport) => void;
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
  }>({ scripts: [], title: '' });

  const [viewport, setViewport] = useState<MapViewport>({
    x: 0,
    y: 0,
    width: 2200,
    height: 2800,
    scale: 1
  });

  const loadMapData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [loadedNodes, loadedScripts] = await Promise.all([
        interactiveMapService.loadNodes(),
        interactiveMapService.loadAllScripts()
      ]);

      const loadedConnections = interactiveMapService.buildConnections(loadedNodes);
      
      interactiveMapService.analyzeScriptConnections(loadedScripts, loadedNodes, loadedConnections);

      setNodes(loadedNodes);
      setConnections(loadedConnections);
      setScripts(loadedScripts);

      // Center on newbie node
      const newbieNode = loadedNodes.find(node => node.name === 'newbie');
      if (newbieNode) {
        const centerX = newbieNode.coordinates[0];
        const centerY = newbieNode.coordinates[1];
        
        setViewport(prev => ({
          ...prev,
          x: centerX - prev.width / 2,
          y: centerY - prev.height / 2
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

  const handleNodeClick = useCallback((node: MapNode) => {
    const relatedScripts = scripts.filter(script => 
      script.relatedNodes.includes(node.name) ||
      (node.buttons && node.buttons.some(btn => 
        script.name.toLowerCase().includes(btn[1].toLowerCase())
      ))
    );
    
    setSelectedNode(node.name);
    setSelectedConnection(null);
    
    if (relatedScripts.length > 0) {
      setScriptSelectorData({
        scripts: relatedScripts,
        title: `Scripts for ${node.caption}`
      });
      setScriptSelectorOpen(true);
    }
  }, [scripts]);

  const handleConnectionClick = useCallback((connection: MapConnection) => {
    const connectionId = `${connection.from}-${connection.to}`;
    const relatedScripts = scripts.filter(script => 
      script.relatedConnections.includes(connectionId)
    );
    
    setSelectedConnection(connectionId);
    setSelectedNode(null);
    
    if (relatedScripts.length > 0) {
      setScriptSelectorData({
        scripts: relatedScripts,
        title: `Scripts for ${connection.from} → ${connection.to}`
      });
      setScriptSelectorOpen(true);
    }
  }, [scripts]);

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
    setViewport
  };
};
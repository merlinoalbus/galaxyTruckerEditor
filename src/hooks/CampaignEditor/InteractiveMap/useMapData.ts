import { logger } from '@/utils/logger';
import { useState, useCallback } from 'react';
import { MapNode, MapConnection, CampaignScript, MapViewport } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { interactiveMapService } from '@/services/CampaignEditor/InteractiveMap/interactiveMapService';
import { resolveNodeOverlaps } from '@/utils/CampaignEditor/InteractiveMap/nodeOverlapResolver';
import { useConnectionBuilder } from './hooks/ConnectionBuilder/useConnectionBuilder';

export interface UseMapDataReturn {
  nodes: MapNode[];
  connections: MapConnection[];
  scripts: CampaignScript[];
  isLoading: boolean;
  error: string | null;
  loadMapData: () => Promise<void>;
  setNodes: (nodes: MapNode[]) => void;
  setConnections: (connections: MapConnection[]) => void;
  setScripts: (scripts: CampaignScript[]) => void;
}

export const useMapData = (
  setViewport: (update: (prev: MapViewport) => MapViewport) => void
): UseMapDataReturn => {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [connections, setConnections] = useState<MapConnection[]>([]);
  const [scripts, setScripts] = useState<CampaignScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { buildConnections } = useConnectionBuilder();

  const loadMapData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [loadedNodes, loadedScripts, loadedMissions] = await Promise.all([
        interactiveMapService.loadNodes(),
        interactiveMapService.loadAllScripts(),
        interactiveMapService.loadMissions()
      ]);

      const loadedConnections = buildConnections(loadedNodes, loadedMissions);
      
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
  logger.error('Error loading map data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load map data');
    } finally {
      setIsLoading(false);
    }
  }, [setViewport, buildConnections]);

  return {
    nodes,
    connections,
    scripts,
    isLoading,
    error,
    loadMapData,
    setNodes,
    setConnections,
    setScripts
  };
};
import { MapNode, MapConnection, MapViewport, MapDimensions, CampaignScript } from '../../InteractiveMap.types';

export interface MapCanvasProps {
  nodes: MapNode[];
  connections: MapConnection[];
  viewport: MapViewport;
  onNodeClick: (node: MapNode) => void;
  onConnectionClick: (connection: MapConnection) => void;
  onViewportChange: (viewport: MapViewport) => void;
  getNodeRelatedScripts?: (node: MapNode) => CampaignScript[];
  getConnectionRelatedScripts?: (connection: MapConnection) => CampaignScript[];
}

export interface CanvasInteraction {
  isMouseDown: boolean;
  isDragging: boolean;
  dragStart: { x: number; y: number };
  lastPanPoint: { x: number; y: number };
}
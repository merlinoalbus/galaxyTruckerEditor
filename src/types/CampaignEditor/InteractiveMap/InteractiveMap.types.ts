export interface MapNode {
  name: string;
  coordinates: [number, number];
  image: string;
  caption: string;
  description: string;
  shuttles?: Array<[string, number]>;
  buttons?: Array<[string, string, string]>;
}

export interface MapConnection {
  from: string;
  to: string;
  cost: number;
}

export interface CampaignScript {
  name: string;
  fileName: string;
  commands: ScriptCommand[];
  relatedNodes: string[];
  relatedConnections: string[];
}

export interface ScriptCommand {
  line: number;
  content: string;
  type: string;
  parameters?: Record<string, any>;
}

export interface InteractiveMapProps {
  onNodeClick?: (node: MapNode, scripts: CampaignScript[]) => void;
  onConnectionClick?: (connection: MapConnection, scripts: CampaignScript[]) => void;
  onScriptSelect?: (script: CampaignScript) => void;
}

export interface MapViewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface MapDimensions {
  width: number;
  height: number;
}
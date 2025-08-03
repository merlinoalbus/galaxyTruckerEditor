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
  flightClass?: 'I' | 'II' | 'III' | 'IV';
  flightClasses?: ('I' | 'II' | 'III' | 'IV')[]; // All available classes
  license?: 'STI' | 'STII' | 'STIII';
  availableLicenses?: ('STI' | 'STII' | 'STIII')[]; // All available licenses
  startScripts?: string[]; // ⭐ Mission start scripts
  hasUniqueMissions?: boolean;
  missions?: Mission[]; // Full mission data
  visibilityCondition?: {
    type: 'unlocked' | 'completed' | 'available' | 'always' | 'never';
    variable?: string;
    scriptCondition?: string;
  };
  isVisible?: boolean;
}

export interface CampaignScript {
  name: string;
  fileName: string;
  commands: ScriptCommand[];
  relatedNodes: string[];
  relatedConnections: string[];
  blocks?: any[]; // Blocchi parsati dal backend per Visual Flow Editor
}

import { ScriptCommand } from '../CampaignEditor.types';

export interface Mission {
  id?: string;
  name?: string;
  description?: string;
  from?: string;
  to?: string;
  source?: string; // Alias for from
  destination?: string; // Alias for to
  cost?: number;
  flightClass?: 'I' | 'II' | 'III' | 'IV';
  license?: 'STI' | 'STII' | 'STIII';
  scripts?: string[];
  uniqueRewards?: boolean;
  button?: [string, string, string]; // Button data array
  missiontype?: string;
  visibility?: {
    type: 'unlocked' | 'completed' | 'available' | 'always' | 'never';
    variable?: string;
    condition?: string;
  };
  // Removed temporary any - now fully typed
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
export interface MapNode {
  name: string;
  coordinates: [number, number];
  image: string;
  imagePath: string;
  imageBinary: string;
  localizedCaptions: { [language: string]: string };
  localizedDescriptions: { [language: string]: string };
  shuttles: Array<[string, number]>;
  buttons: Array<{
    id: string;
    script: string;
    localizedLabels: { [language: string]: string };
  }>;
  utilizzi_totali: number;
  script_che_lo_usano: string[];
  comandi_utilizzati: string[];
  
  // Backward compatibility fields
  caption?: string;
  description?: string;
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
  nomescript: string;
  nomefile: string;
  numero_blocchi: number;
  numero_comandi: number;
  stellato: boolean;
  languages: string[];
  bottoni_collegati: Array<{
    buttonId: string;
    sourceId: string;
    tipo: string;
  }>;
  script_richiamati: string[];
  missions_richiamate: string[];
  richiamato_da_script: string[];
  richiamato_da_missions: string[];
  comandi_richiamo: string[];
  utilizzi_totali: number;
  variabili_utilizzate: string[];
  personaggi_utilizzati: string[];
  labels_definite: string[];
  nodi_referenziati: string[];
  
  // Backward compatibility fields
  name?: string;
  fileName?: string;
  commands?: ScriptCommand[];
  relatedNodes?: string[];
  relatedConnections?: string[];
  blocks?: any[];
}

import { ScriptCommand } from '../CampaignEditor.types';

export interface Mission {
  name: string;
  source: string;
  destination: string;
  missiontype: 'NORMAL' | 'UNIQUE';
  license: 'STI' | 'STII' | 'STIII';
  button?: {
    id: string;
    script: string;
    mission: string;
    localizedLabels: { [language: string]: string };
  };
  localizedCaptions?: { [language: string]: string };
  localizedDescriptions?: { [language: string]: string };
  utilizzi_totali?: number;
  script_che_lo_usano?: string[];
  comandi_utilizzati?: string[];
  script_collegati_ricorsivamente?: string[];
  
  // Backward compatibility fields
  id?: string;
  description?: string;
  from?: string;
  to?: string;
  cost?: number;
  flightClass?: 'I' | 'II' | 'III' | 'IV';
  scripts?: string[];
  uniqueRewards?: boolean;
  visibility?: {
    type: 'unlocked' | 'completed' | 'available' | 'always' | 'never';
    variable?: string;
    condition?: string;
  };
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
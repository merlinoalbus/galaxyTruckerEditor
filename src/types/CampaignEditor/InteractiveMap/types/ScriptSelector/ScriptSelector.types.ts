import { CampaignScript } from '../../InteractiveMap.types';

export interface ScriptSelectorProps {
  isOpen: boolean;
  scripts: CampaignScript[];
  title: string;
  position?: { x: number; y: number };
  startScripts?: string[]; // ⭐ Scripts that are start scripts
  onScriptSelect: (script: CampaignScript) => void;
  onClose: () => void;
}

export interface ScriptItemProps {
  script: CampaignScript;
  isStartScript?: boolean; // ⭐ If this is a start script
  onClick: (script: CampaignScript) => void;
}

export interface ScriptSelectorState {
  searchTerm: string;
  filteredScripts: CampaignScript[];
}
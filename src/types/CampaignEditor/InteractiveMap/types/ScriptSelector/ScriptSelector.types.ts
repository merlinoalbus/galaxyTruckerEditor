import { CampaignScript, Mission } from '../../InteractiveMap.types';

export interface ScriptSelectorProps {
  isOpen: boolean;
  scripts: CampaignScript[];
  missions?: Mission[];
  title: string;
  position?: { x: number; y: number };
  startScripts?: string[]; // ⭐ Scripts that are start scripts
  onScriptSelect: (script: CampaignScript) => void;
  onMissionSelect?: (mission: Mission) => void;
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
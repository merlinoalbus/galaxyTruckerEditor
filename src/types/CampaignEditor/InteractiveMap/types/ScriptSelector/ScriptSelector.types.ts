import { CampaignScript } from '../../InteractiveMap.types';

export interface ScriptSelectorProps {
  isOpen: boolean;
  scripts: CampaignScript[];
  title: string;
  position?: { x: number; y: number };
  onScriptSelect: (script: CampaignScript) => void;
  onClose: () => void;
}

export interface ScriptItemProps {
  script: CampaignScript;
  onClick: (script: CampaignScript) => void;
}

export interface ScriptSelectorState {
  searchTerm: string;
  filteredScripts: CampaignScript[];
}
// Interfacce per il componente ScriptsList e gestione script

import type { IFlowBlock } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

export interface ScriptItem {
  id: string;
  name: string;
  fileName?: string;
}

export interface ScriptData {
  name: string;
  fileName: string;
  language: string;
  blocks: IFlowBlock[];
  metadata: {
    blockCount: number;
    commandCount: number;
    errorCount: number;
  };
  availableLanguages: string[];
}


export interface ScriptsListProps {
  showScriptsList: boolean;
  setShowScriptsList: (show: boolean) => void;
  availableScripts: ScriptItem[];
  loadScript: (scriptId: string) => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}
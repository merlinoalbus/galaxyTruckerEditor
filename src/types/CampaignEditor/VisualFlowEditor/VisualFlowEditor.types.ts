// Types temporaneamente commentati per compatibilità
// import { FlowBlock } from './types/FlowBlock/FlowBlock.types';
// import { FlowValidation } from './types/FlowValidation/FlowValidation.types';
// import { FlowConnection } from './types/FlowConnection/FlowConnection.types';

import { CampaignAnalysis } from '@/types/CampaignEditor';

export interface VisualFlowEditorProps {
  analysis?: CampaignAnalysis | null;
  selectedScript?: string | null;
  selectedNode?: any;
  onScriptChange?: (scriptName: string, content: string) => void;
  onScriptSelect?: (scriptName: string) => void;
}

export interface VisualFlowEditorState {
  blocks: any[]; // FlowBlock[]
  connections: any[]; // FlowConnection[]
  validation: any; // FlowValidation
  isLoading: boolean;
  isDirty: boolean;
  dragState: DragState;
  selection: SelectionState;
}

export interface DragState {
  isDragging: boolean;
  draggedBlock: any | null; // FlowBlock | null
  dragOffset: { x: number; y: number };
  targetAnchor: AnchorPoint | null;
}

export interface SelectionState {
  selectedBlocks: string[];
  focusedBlock: string | null;
  editingField: EditingField | null;
}

export interface EditingField {
  blockId: string;
  field: string;
  language?: string;
}

export interface AnchorPoint {
  blockId: string;
  type: 'input' | 'output' | 'branch';
  position: { x: number; y: number };
  branchKey?: string;
}

export interface ViewportState {
  zoom: number;
  pan: { x: number; y: number };
  bounds: { width: number; height: number };
}

export interface FlowEditorMode {
  showAllLanguages: boolean;
  selectedLanguage: string;
  showValidation: boolean;
  showGrid: boolean;
}
// Complete types extracted from StructuredCampaignFlowEditor.tsx

export interface Character {
  name: string;
  images: string[];
  displayName: string;
}

export interface MapNode {
  name: string;
  caption: string;
  description: string;
  x: number;
  y: number;
}

export interface ButtonData {
  id: string;
  name: string;
  description: string;
}

export interface StructuredBlock {
  id: string;
  type: string;
  command: {
    line: number;
    content: string;
    type: string;
    parameters: any;
  };
  children: StructuredBlock[];
  depth: number;
  metadata: {
    scriptName: string;
    [key: string]: any;
  };
}

export interface ScriptData {
  name: string;
  fileName: string;
  content: string;
  characters: string[];
  variables: string[];
  subScripts: string[];
}

export interface EditingField {
  blockId: string;
  field: string;
  language?: string;
}

export interface CharacterPickerData {
  blockId: string;
  field: string;
  current?: string;
}

export interface NodeSelectorData {
  blockId: string;
  field: string;
  current?: string;
}

export interface ButtonSelectorData {
  blockId: string;
  field: string;
  current?: string;
}

export interface NavigationStackItem {
  scriptName: string;
  blockId?: string;
}

export const LANGUAGES = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];

export const CHARACTER_POSITIONS = ['left', 'center', 'right'];

export const COMPONENT_CATEGORIES = {
  'Dialogue & Text': ['dialogue', 'question', 'announce'],
  'Characters': ['show_character', 'hide_character', 'change_character'],
  'Variables': ['variable_set', 'variable_reset'],
  'Containers': ['dialog_container', 'menu_container', 'condition_container'],
  'Navigation & Flow': ['label', 'goto', 'subscript', 'delay'],
  'Interface & UI': ['center_map', 'show_node', 'show_button', 'hide_button', 'set_focus', 'reset_focus', 'show_info_window', 'add_info_window'],
  'Game Actions': ['start_mission', 'set_credits', 'set_status_bar']
};
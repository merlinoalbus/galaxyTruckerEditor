export interface MapNode {
  name: string;
  coordinates: [number, number];
  image: string;
  script?: string;
}

export interface Connection {
  from: string;
  to: string;
  image: string;
}

// CampaignAnalysis is defined in CampaignScriptParser.ts - import from there
export type { CampaignAnalysis } from '../../services/CampaignEditor/CampaignScriptParser';

export interface TabInfo {
  id: string;
  label: string;
}

export enum ScriptBlockType {
  // Dialogue blocks
  SAY = 'dialogue',
  ASK = 'question', 
  ANNOUNCE = 'announce',
  
  // Character blocks
  SHOW_CHARACTER = 'show_character',
  HIDE_CHARACTER = 'hide_character',
  CHANGE_CHARACTER = 'change_character',
  
  // Variable blocks
  SET_VARIABLE = 'variable_set',
  RESET_VARIABLE = 'variable_reset', 
  SET_TO_VARIABLE = 'variable_set_to',
  
  // Container blocks
  DIALOG_CONTAINER = 'dialog_container',
  MENU_CONTAINER = 'menu_container',
  IF_CONTAINER = 'condition_container',
  
  // Menu option blocks
  OPT = 'opt',
  OPT_IF = 'opt_if',
  
  // Navigation blocks
  LABEL = 'label',
  GOTO = 'goto',
  SUBSCRIPT = 'subscript',
  DELAY = 'delay',
  
  // Interface blocks
  CENTER_MAP = 'center_map',
  SHOW_NODE = 'show_node',
  SHOW_BUTTON = 'show_button',
  HIDE_BUTTON = 'hide_button'
}


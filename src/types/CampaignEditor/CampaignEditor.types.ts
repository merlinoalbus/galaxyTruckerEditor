// Legacy types - use InteractiveMap types instead
export interface Connection {
  from: string;
  to: string;
  image: string;
}

// Interfaces for script parsing and analysis
export interface ScriptCommand {
  line: number;
  content: string;
  type: string;
  parameters?: any;
  metadata?: any;
}

export interface ParsedScript {
  name: string;
  fileName: string;
  language: string;
  commands: ScriptCommand[];
  labels: string[];
  references: string[];
  subScripts: string[];
  missions: string[];
  variables: string[];
  characters: string[];
  nodes: string[];
  relatedScripts: string[];
}

export interface ScriptBlock {
  id: string;
  type: string;
  content: string;
  startLine: number;
  endLine?: number;
  parameters: any;
  children?: ScriptBlock[];
  parent?: string;
  metadata: any;
}

export interface CampaignAnalysis {
  scripts: ParsedScript[];
  scriptMap: Map<string, ParsedScript>;
  scriptConnections: Map<string, string[]>;
  variables: Set<string>; // Legacy - contains all mixed
  semafori: Set<string>; // Boolean semafori (SET/RESET)
  realVariables: Set<string>; // Numeric variables (SET_TO) 
  characters: Set<string>;
  missions: Set<string>;
  labels: Set<string>;
  nodeScriptMap: Map<string, string[]>;
  flowStructure: Map<string, ScriptBlock[]>;
}

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


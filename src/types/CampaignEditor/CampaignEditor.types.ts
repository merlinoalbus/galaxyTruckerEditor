// Legacy types - use InteractiveMap types instead
export interface Connection {
  from: string;
  to: string;
  image: string;
}

// Specific parameter types for different command types
export interface ScriptParameters {
  character?: string;
  text?: string;
  image?: string;
  variable?: string;
  value?: string | number | boolean;
  target?: string;
  condition?: string;
  options?: string[];
  name?: string;
  scriptName?: string;
  missionName?: string;
  nodeName?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface ScriptMetadata {
  line?: number;
  file?: string;
  comments?: string[];
  tags?: string[];
  [key: string]: string | number | string[] | undefined;
}

// Interfaces for script parsing and analysis
export interface ScriptCommand {
  line: number;
  content: string;
  type: string;
  parameters?: ScriptParameters;
  metadata?: ScriptMetadata;
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
  parameters: ScriptParameters;
  children?: ScriptBlock[];
  parent?: string;
  metadata: ScriptMetadata;
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


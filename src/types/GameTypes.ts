// Tipi per Galaxy Trucker Editor

export interface Mission {
  name: string;
  missionID: number;
  description?: string;
  gameType?: 'realtime' | 'turnbased';
  flightsAvailableToChange: FlightType[];
  flightsPicked: FlightType[];
  playersCount: [number, number];
  shipPlans: string[];
  pileConfigSTI?: string;
  pileConfigSTII?: string;
  pileConfigSTIII?: string;
  universalDeckScript?: string;
  customDeckScript?: string;
  evaluation?: FlightEvaluation;
  infoBoards?: InfoBoard[];
  comments?: {
    ships?: string;
    rules?: string;
    tiles?: string;
    cards?: string;
  };
}

export type FlightType = 'STI' | 'STII' | 'STIII';

export interface FlightEvaluation {
  STI?: EvaluationRules;
  STII?: EvaluationRules;
  STIII?: EvaluationRules;
}

export interface EvaluationRules {
  deliveredCrewMember?: number;
  lostCrewMember?: number;
  deliveredCargo?: number;
  lostCargo?: number;
  deliveredGoods?: number;
  batteryPower?: number;
  [key: string]: number | undefined;
}

export interface InfoBoard {
  default: boolean[];
}

export interface ShipPart {
  id: string;
  name: string;
  type: PartType;
  connectors: number;
  universalConnectors?: number;
  size: [number, number];
  cost?: number;
  description?: string;
  special?: string[];
}

export type PartType = 
  | 'engine' 
  | 'cannon' 
  | 'shield' 
  | 'cargo' 
  | 'cabin' 
  | 'battery' 
  | 'structural' 
  | 'alien';

export interface AdventureCard {
  id: string;
  name: string;
  type: CardType;
  flight: FlightType;
  description: string;
  effects?: CardEffect[];
  metacodes?: string[];
}

export type CardType = 
  | 'openspace' 
  | 'yellow' 
  | 'abandonedstation' 
  | 'abandonedship' 
  | 'meteoric' 
  | 'enemies' 
  | 'planets' 
  | 'combatzone';

export interface CardEffect {
  type: string;
  value?: number;
  target?: string;
  condition?: string;
}

export interface AIConfig {
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  personality: string;
  buildingStrategy: string;
  riskTolerance: number;
  specialBehaviors?: string[];
}

export interface LocalizationStrings {
  [key: string]: {
    [language: string]: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface GameConfig {
  version: number;
  clientApiVersion: number;
  languages: Record<string, string>;
  servers: Record<string, ServerConfig>;
}

export interface ServerConfig {
  IP: string;
  port: number[];
}

// Interfacce per il deck script
export interface DeckScript {
  name: string;
  commands: DeckCommand[];
}

export interface DeckCommand {
  type: 'TmpDeckLoad' | 'DeckAddCardType' | 'DeckRemoveCardType';
  flight?: number;
  cardType?: string;
  count?: number;
  deckFile?: string;
}

// Metacodici supportati
export type MetaCode = 
  | '[player]' 
  | '[credits]' 
  | '[flight]' 
  | '[ship]' 
  | '[cargo]' 
  | '[crew]' 
  | '[day]' 
  | '[turn]';
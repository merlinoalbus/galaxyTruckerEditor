/**
 * Types for Metacode Editor System
 */

export interface MetacodePattern {
  id: string;
  type: string; // Cambiato a string generico per compatibilità
  icon: string;
  tooltip: string;
  hasModal: boolean;
}

export interface GenderOptions {
  male: string;
  female: string;
  neutral?: string;
}

export interface VerbOptions {
  mobile: string;
  desktop: string;
}

export interface NumberOptions {
  forms: {
    count: number;
    text: string;
  }[];
}

export interface ImageOptions {
  path: string;
  multiplier?: string;
}

export interface VectorOptions {
  separator: string;
  conjunction: string;
}

export interface ConditionalOptions {
  condition: string;
  text: string;
}

export interface ParsedMetacode {
  type: string;
  raw: string;
  start: number;
  end: number;
  data: any;
}

export interface MetacodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'EN' | 'CS' | 'DE' | 'ES' | 'FR' | 'PL' | 'RU';
  availableImages?: string[];
  availableIcons?: string[];
  showPatternButtons?: boolean;
}

export interface MetacodeButtonProps {
  pattern: MetacodePattern;
  onClick: () => void;
  isActive?: boolean;
}

export interface MetacodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
  type: 'gender' | 'plural' | 'image' | 'verb' | 'playerName' | 'player' | 'string' | 'number' | 
        'icon' | 'missionResult' | 'vector' | 'conditional';
  language: string;
  existingCode?: string;
}
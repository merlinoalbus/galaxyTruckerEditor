// Variables & System Types

export interface Semaforo {
  nomesemaforo: string;
  listascriptchelousano: string[];
  tipo: 'booleano';
  utilizzi_totali: number;
  operazioni: {
    SET?: number;
    RESET?: number;
    IF?: number;
    IFNOT?: number;
    OPT_IF?: number;
  };
  stato_finale_probabile?: string;
}

export interface Label {
  nomelabel: string;
  scriptancoraggio: string;
  utilizzi_totali: number;
  posizione_definizione?: {
    file: string;
    linea: number;
  };
  riferimenti?: Array<{
    linea: number;
    comando: string;
  }>;
}

export interface Character {
  nomepersonaggio: string;
  visibile: boolean;
  immaginebase?: {
    nomefile: string;
    percorso: string;
    binary?: string;
  };
  listaimmagini?: Array<{
    nomefile: string;
    percorso: string;
    binary?: string;
  }>;
  posizione?: any;
  utilizzi_totali: number;
  script_che_lo_usano: string[];
  comandi_utilizzati: string[];
  immagine_corrente?: string;
}

export interface Variable {
  nomevariabile: string;
  listascriptchelausano: string[];
  tipo: 'numerica';
  utilizzi_totali: number;
  operazioni: {
    SET_TO?: number;
    ADD?: number;
    IF_IS?: number;
    IF_MIN?: number;
    IF_MAX?: number;
  };
  valori_utilizzati?: number[];
}

export interface GameImage {
  nomefile: string;
  percorso: string;
  tipo: string;
  sottotipo: string;
  dimensione: number;
  modificato: string;
  profondita: number;
}

export interface Achievement {
  name: string;
  category: string;
  points: number;
  objectivesCount: number;
  hidden: boolean;
  repeatable: boolean;
  preDesc: string;
  postDesc: string;
  preImage?: {
    fileName: string;
    path: string;
    exists: boolean;
  };
  postImage?: {
    fileName: string;
    path: string;
    exists: boolean;
  };
  localizedNames?: { [key: string]: string };
  localizedPreDescriptions?: { [key: string]: string };
  localizedPostDescriptions?: { [key: string]: string };
  utilizzi_totali?: number;
  script_che_lo_utilizzano?: string[];
  comandi_utilizzati?: string[];
}

export type ElementType = 'semafori' | 'labels' | 'characters' | 'variables' | 'images' | 'achievements';

export interface VariablesSystemState {
  activeTab: ElementType;
  searchTerm: string;
  sortBy: string;
  selectedItem: any | null;
  loading: boolean;
  error: string | null;
  data: {
    semafori: Semaforo[];
    labels: Label[];
    characters: Character[];
    variables: Variable[];
    images: GameImage[];
    achievements: Achievement[];
  };
}

export interface VariablesSystemProps {
  analysis?: any;
}
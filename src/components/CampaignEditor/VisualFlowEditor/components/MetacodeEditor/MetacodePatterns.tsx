/**
 * Pattern Metacodice basati su analisi reale del codebase
 * Ordinati per frequenza d'uso (dall'analisi METACODE_COMPLETE_ANALYSIS.md)
 */

import { 
  Users, 
  Hash, 
  Image, 
  MousePointer, 
  User, 
  Target,
  LucideIcon 
} from 'lucide-react';

export interface MetacodePatternInfo {
  id: string;
  category: 'localization' | 'ui' | 'dynamic' | 'logic';
  icon: LucideIcon;
  iconText: string; // Backup text per compatibilità
  label: string;
  tooltip: string;
  frequency: 'very-high' | 'high' | 'medium' | 'low';
  hasModal: boolean;
  generateDefault: () => string;
  examples?: string[];
}

// Solo i 6 pattern più usati
export const METACODE_PATTERNS_BY_FREQUENCY: MetacodePatternInfo[] = [
  // Localizzazione (raggruppati)
  {
    id: 'gender',
    category: 'localization',
    icon: Users,
    iconText: 'G',
    label: 'Genere',
    tooltip: 'Genere (M/F/N)',
    frequency: 'very-high',
    hasModal: true,
    generateDefault: () => '[g(|a|)]',
    examples: ['[g(o|a|)]', '[g(his|her|its)]']
  },
  {
    id: 'plural',
    category: 'localization',
    icon: Hash,
    iconText: 'N',
    label: 'Plurale',
    tooltip: 'Singolare/Plurale',
    frequency: 'high',
    hasModal: true,
    generateDefault: () => '[n(1:|2:s)]',
    examples: ['[n(1:point|2:points)]']
  },
  
  // UI
  {
    id: 'image',
    category: 'ui',
    icon: Image,
    iconText: 'IMG',
    label: 'Immagine',
    tooltip: 'Immagine',
    frequency: 'high',
    hasModal: true,
    generateDefault: () => '[img(path.png)]',
    examples: ['[img(icon.png)]']
  },
  {
    id: 'verb',
    category: 'ui',
    icon: MousePointer,
    iconText: 'V',
    label: 'Azione',
    tooltip: 'Tap/Click',
    frequency: 'medium',
    hasModal: true,
    generateDefault: () => '[v(tap|click)]',
    examples: ['[v(tap|click)]']
  },
  
  // Dinamici
  {
    id: 'playerName',
    category: 'dynamic',
    icon: User,
    iconText: 'NAME',
    label: 'Nome',
    tooltip: 'Nome giocatore',
    frequency: 'medium',
    hasModal: false,
    generateDefault: () => '[NAME]',
    examples: ['[NAME]']
  },
  {
    id: 'missionResult',
    category: 'dynamic',
    icon: Target,
    iconText: 'RES',
    label: 'Risultato',
    tooltip: 'Risultato missione',
    frequency: 'low',
    hasModal: true, // Cambiato a true perché ora abbiamo la modal
    generateDefault: () => '[missionResult]',
    examples: ['[missionResult]']
  }
];

// Gruppi per categoria per UI organizzata
export const PATTERNS_BY_CATEGORY = {
  localization: METACODE_PATTERNS_BY_FREQUENCY.filter(p => p.category === 'localization'),
  ui: METACODE_PATTERNS_BY_FREQUENCY.filter(p => p.category === 'ui'),
  dynamic: METACODE_PATTERNS_BY_FREQUENCY.filter(p => p.category === 'dynamic'),
  logic: METACODE_PATTERNS_BY_FREQUENCY.filter(p => p.category === 'logic')
};

// Helper per ottenere il colore in base alla frequenza
export function getFrequencyColor(frequency: string): string {
  switch (frequency) {
    case 'very-high': return 'text-red-500 bg-red-100';
    case 'high': return 'text-orange-500 bg-orange-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-gray-600 bg-gray-100';
    default: return 'text-gray-500 bg-gray-50';
  }
}

// Helper per ottenere il colore del pattern
export function getPatternColor(category: string): string {
  switch (category) {
    case 'localization': return 'bg-blue-500';
    case 'ui': return 'bg-purple-500';
    case 'dynamic': return 'bg-green-500';
    case 'logic': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
}
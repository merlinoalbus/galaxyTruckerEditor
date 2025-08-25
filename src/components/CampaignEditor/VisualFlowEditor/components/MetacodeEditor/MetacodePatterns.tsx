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
import { useMemo } from 'react';
import { useTranslation } from '@/locales';

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

// Hook per ottenere i pattern con traduzioni
export const useMetacodePatterns = (): MetacodePatternInfo[] => {
  const { t } = useTranslation();

  return useMemo(() => [
    // Localizzazione (raggruppati)
    {
      id: 'gender',
      category: 'localization',
      icon: Users,
      iconText: 'G',
      label: t('visualFlowEditor.metacode.genderLabel'),
      tooltip: t('visualFlowEditor.metacode.genderTooltip'),
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
      label: t('visualFlowEditor.metacode.pluralLabel'),
      tooltip: t('visualFlowEditor.metacode.pluralTooltip'),
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
      label: t('visualFlowEditor.metacode.imageLabel'),
      tooltip: t('visualFlowEditor.metacode.imageTooltip'),
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
      label: t('visualFlowEditor.metacode.actionLabel'),
      tooltip: t('visualFlowEditor.metacode.actionTooltip'),
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
      label: t('visualFlowEditor.metacode.nameLabel'),
      tooltip: t('visualFlowEditor.metacode.nameTooltip'),
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
      label: t('visualFlowEditor.metacode.missionResultLabel'),
      tooltip: t('visualFlowEditor.metacode.missionResultTooltip'),
      frequency: 'low',
      hasModal: true,
      generateDefault: () => '[MISSION_RESULT(missionId)]',
      examples: ['[MISSION_RESULT(mission01)]']
    }
  ], [t]);
};


/**
 * Ottieni colore basato su frequenza per gradienti visuali
 */
export const getFrequencyColor = (frequency: string): string => {
  switch(frequency) {
    case 'very-high': return 'from-purple-600 to-blue-600';
    case 'high': return 'from-blue-600 to-cyan-600';
    case 'medium': return 'from-cyan-600 to-teal-600';
    case 'low': return 'from-teal-600 to-green-600';
    default: return 'from-gray-600 to-gray-700';
  }
};

/**
 * Ottieni colore solido basato su categoria
 */
export const getPatternColor = (category: string): string => {
  switch(category) {
    case 'localization': return 'bg-blue-600';
    case 'ui': return 'bg-purple-600';
    case 'dynamic': return 'bg-green-600';
    case 'logic': return 'bg-orange-600';
    default: return 'bg-gray-600';
  }
};
import React from 'react';
import { MetacodePattern, MetacodeButtonProps } from './types';
import { METACODE_PATTERNS_BY_FREQUENCY, getFrequencyColor, getPatternColor } from './MetacodePatterns';

/**
 * Pattern reali basati su analisi METACODE_COMPLETE_ANALYSIS.md
 * Ordinati per frequenza d'uso (5000+ → 10+ occorrenze)
 */
export const METACODE_PATTERNS: MetacodePattern[] = METACODE_PATTERNS_BY_FREQUENCY.map(p => ({
  id: p.id,
  type: p.id, // Usa id come type
  icon: p.icon, // Ora è LucideIcon
  tooltip: p.tooltip,
  hasModal: p.hasModal
}));

/**
 * Singolo pulsante per inserimento metacodice - compatto e uniforme
 */
export const MetacodeButton: React.FC<MetacodeButtonProps> = ({
  pattern,
  onClick,
  isActive = false
}) => {
  // Trova le informazioni complete del pattern
  const patternInfo = METACODE_PATTERNS_BY_FREQUENCY.find(p => p.id === pattern.id);
  const IconComponent = patternInfo?.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      title={pattern.tooltip}
      className={`
        px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-center min-w-[28px]
        ${isActive 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white'
        }
      `}
    >
      {IconComponent && typeof IconComponent !== 'string' ? (
        <IconComponent className="w-3 h-3" />
      ) : (
        <span className="font-mono text-[10px]">
          {typeof IconComponent === 'string' ? IconComponent : patternInfo?.iconText}
        </span>
      )}
    </button>
  );
};

/**
 * Barra dei pulsanti metacodice
 */
interface MetacodeButtonBarProps {
  onPatternClick: (pattern: MetacodePattern) => void;
  activePattern?: string;
  visiblePatterns?: string[];
}

export const MetacodeButtonBar: React.FC<MetacodeButtonBarProps> = ({
  onPatternClick,
  activePattern,
  visiblePatterns
}) => {
  const patterns = visiblePatterns 
    ? METACODE_PATTERNS.filter(p => visiblePatterns.includes(p.id))
    : METACODE_PATTERNS;

  // Trova i pattern info per raggruppamento
  const localizationPatterns = patterns.filter(p => {
    const info = METACODE_PATTERNS_BY_FREQUENCY.find(i => i.id === p.id);
    return info?.category === 'localization';
  });
  
  const otherPatterns = patterns.filter(p => {
    const info = METACODE_PATTERNS_BY_FREQUENCY.find(i => i.id === p.id);
    return info?.category !== 'localization';
  });

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded">
      {/* Gruppo localizzazione (genere + plurale) */}
      {localizationPatterns.length > 0 && (
        <div className="flex items-center gap-1 px-1 py-0.5 bg-slate-700/50 rounded">
          {localizationPatterns.map(pattern => (
            <MetacodeButton
              key={pattern.id}
              pattern={pattern}
              onClick={() => onPatternClick(pattern)}
              isActive={activePattern === pattern.id}
            />
          ))}
        </div>
      )}
      
      {/* Altri pattern */}
      {otherPatterns.map(pattern => (
        <MetacodeButton
          key={pattern.id}
          pattern={pattern}
          onClick={() => onPatternClick(pattern)}
          isActive={activePattern === pattern.id}
        />
      ))}
    </div>
  );
};
import React, { useMemo, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { MetacodePattern, MetacodeButtonProps } from './types';
import { useMetacodePatterns, getFrequencyColor, getPatternColor } from './MetacodePatterns';


/**
 * Singolo pulsante per inserimento metacodice - compatto e uniforme
 */
export const MetacodeButton: React.FC<MetacodeButtonProps> = ({
  pattern,
  onClick,
  isActive = false
}) => {
  // Trova le informazioni complete del pattern
  const patterns = useMetacodePatterns();
  const patternInfo = patterns.find(p => p.id === pattern.id);
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
  activePattern?: string | null;
  visiblePatterns?: string[];
  onRefreshCache?: () => void;
}

export const MetacodeButtonBar: React.FC<MetacodeButtonBarProps> = React.memo(({
  onPatternClick,
  activePattern,
  visiblePatterns,
  onRefreshCache
}) => {
  const patternInfos = useMetacodePatterns();
  
  const patterns: MetacodePattern[] = useMemo(() => patternInfos.map(p => ({
    id: p.id,
    type: p.id,
    icon: p.icon,
    tooltip: p.tooltip,
    hasModal: p.hasModal
  })), [patternInfos]);

  const filteredPatterns = useMemo(() => visiblePatterns 
    ? patterns.filter(p => visiblePatterns.includes(p.id))
    : patterns, [patterns, visiblePatterns]);

  // Trova i pattern info per raggruppamento
  const localizationPatterns = useMemo(() => filteredPatterns.filter(p => {
    const info = patternInfos.find(i => i.id === p.id);
    return info?.category === 'localization';
  }), [filteredPatterns, patternInfos]);
  
  const otherPatterns = useMemo(() => filteredPatterns.filter(p => {
    const info = patternInfos.find(i => i.id === p.id);
    return info?.category !== 'localization';
  }), [filteredPatterns, patternInfos]);

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
      
      {/* Pulsante refresh cache */}
      {onRefreshCache && (
        <div className="ml-1 border-l border-slate-600 pl-1">
          <button
            type="button"
            onClick={onRefreshCache}
            className="px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-center min-w-[28px] bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white"
            title="Aggiorna cache metacode"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
});
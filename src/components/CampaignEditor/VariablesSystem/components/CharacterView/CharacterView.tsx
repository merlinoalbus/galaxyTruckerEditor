import React from 'react';
import { Users, Eye, EyeOff } from 'lucide-react';
import { Character } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { useTranslation } from '@/locales/translations';

interface CharacterViewProps {
  character: Character;
  isSelected: boolean;
  onSelect: (character: Character) => void;
}

export const CharacterView: React.FC<CharacterViewProps> = ({ 
  character, 
  isSelected, 
  onSelect 
}) => {
  const { t } = useTranslation();
  return (
    <div
      className={`
        bg-gray-800 rounded-lg p-4 cursor-pointer transition-all
        ${isSelected ? 'ring-2 ring-blue-500 bg-gray-700' : 'hover:bg-gray-700'}
      `}
      onClick={() => onSelect(character)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {character.immaginebase?.binary && (
            <img
              src={`data:image/png;base64,${character.immaginebase.binary}`}
              alt={character.nomepersonaggio}
              className="w-12 h-12 rounded-lg object-cover border border-gray-700"
            />
          )}
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-bold">{character.nomepersonaggio}</h3>
            <span className="text-xs px-2 py-1 bg-purple-900/30 text-purple-400 rounded-full">
              {t('characterView.character')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {character.visibile ? (
            <Eye className="w-4 h-4 text-green-400" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-sm text-gray-400">
            {character.utilizzi_totali} {t('characterView.uses')}
          </span>
        </div>
      </div>

      {character.listaimmagini && character.listaimmagini.length > 1 && (
        <div className="text-xs text-gray-400 mb-2">
          {character.listaimmagini.length} {t('characterView.availableImages')}
        </div>
      )}

      <div className="flex gap-4 text-xs mb-2">
        {character.comandi_utilizzati.map(cmd => (
          <span key={cmd} className="px-2 py-1 bg-gray-700 rounded text-gray-300">
            {cmd}
          </span>
        ))}
      </div>

      {character.script_che_lo_usano.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-1">{t('common.usedIn')}</div>
          <div className="flex flex-wrap gap-1">
            {character.script_che_lo_usano.slice(0, 3).map(script => (
              <span key={script} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
                {script}
              </span>
            ))}
            {character.script_che_lo_usano.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-400">
                +{character.script_che_lo_usano.length - 3} {t('common.others')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
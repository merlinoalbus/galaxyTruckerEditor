import React from 'react';
import { Users, FileText, ExternalLink } from 'lucide-react';
import { Character } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { useTranslation } from '@/locales/translations';

interface CharacterDetailProps {
  item: Character;
  onNavigateToScript?: (scriptName: string, characterName: string) => void;
}

export const CharacterDetail: React.FC<CharacterDetailProps> = ({ 
  item,
  onNavigateToScript
}) => {
  const { t } = useTranslation();
  const scripts = item.script_che_lo_usano || [];
  
  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 rounded">
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {item.nomepersonaggio}
            </h3>
          </div>
          <span className="text-xs text-gray-400">{t('detailView.character')}</span>
        </div>
      </div>

      {/* Compact Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Compact Scripts List */}
        {scripts.length > 0 && (
          <div className="bg-gray-800/20 rounded p-2.5 border border-gray-700/50">
            <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                {t('detailView.scriptsUsing')}
              </span>
              <span className="bg-gray-700 px-1.5 py-0.5 rounded-full text-xs text-gray-300">
                {scripts.length}
              </span>
            </h4>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {scripts.map((script, idx) => (
                <div 
                  key={idx}
                  className="group flex items-center justify-between bg-gray-900/50 rounded px-2 py-1.5 hover:bg-gray-800/50 transition-all border border-gray-700/30 hover:border-gray-600/50"
                >
                  <span className="text-gray-300 font-mono text-xs truncate">{script}</span>
                  {onNavigateToScript && (
                    <button
                      onClick={() => onNavigateToScript(script, item.nomepersonaggio)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-all ml-2 flex-shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="hidden sm:inline">{t('detailView.goToScript')}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
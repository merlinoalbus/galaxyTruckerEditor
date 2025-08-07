import React from 'react';
import { Tag, FileText, ExternalLink, Code } from 'lucide-react';
import { Label } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { useTranslation } from '@/locales/translations';

interface LabelDetailProps {
  item: Label;
  onNavigateToScript?: (scriptName: string, labelName: string) => void;
}

export const LabelDetail: React.FC<LabelDetailProps> = ({ 
  item,
  onNavigateToScript
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="h-full flex flex-col">
      {/* Compact Header with inline stats */}
      <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-500/20 rounded">
            <Tag className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {item.nomelabel}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Script:</span>
              <span className="font-bold text-white">{item.scriptancoraggio || '-'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">{t('labelView.uses')}:</span>
              <span className="font-bold text-white">{item.utilizzi_totali || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {/* Label Definition */}
        {item.posizione_definizione && (
          <div className="bg-gray-800/20 rounded p-2.5 border border-gray-700/50">
            <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
              <Code className="w-3 h-3" />
              {t('detailView.labelDefinition')}
            </h4>
            <div className="flex items-center justify-between bg-gray-900/50 rounded px-2 py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-gray-300 font-mono text-xs">
                  {item.scriptancoraggio} : {item.posizione_definizione.linea}
                </span>
              </div>
              {onNavigateToScript && (
                <button
                  onClick={() => onNavigateToScript(item.scriptancoraggio, item.nomelabel)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{t('detailView.goToDefinition')}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Label References */}
        {item.riferimenti && item.riferimenti.length > 0 && (
          <div className="bg-gray-800/20 rounded p-2.5 border border-gray-700/50">
            <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                {t('detailView.labelReferences')}
              </span>
              <span className="bg-gray-700 px-1.5 py-0.5 rounded-full text-xs text-gray-300">
                {item.riferimenti.length}
              </span>
            </h4>
            <div className="space-y-1 min-h-[6rem] max-h-[6rem] overflow-y-auto">
              {item.riferimenti.map((ref, idx) => (
                <div 
                  key={idx}
                  className="group flex items-center justify-between bg-gray-900/50 rounded px-2 py-1.5 hover:bg-gray-800/50 transition-all border border-gray-700/30 hover:border-gray-600/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-mono text-xs">L{ref.linea}</span>
                    <span className="text-green-300 font-mono text-xs">{ref.comando}</span>
                  </div>
                  {onNavigateToScript && (
                    <button
                      onClick={() => onNavigateToScript(item.scriptancoraggio, `line_${ref.linea}`)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-all ml-2 flex-shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="hidden sm:inline">{t('detailView.goToLine')}</span>
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
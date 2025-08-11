import React from 'react';
import { ToggleLeft, FileText, ExternalLink, Code } from 'lucide-react';
import { Semaforo } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { useTranslation } from '@/locales';

interface SemaforoDetailProps {
  item: Semaforo;
  onNavigateToScript?: (scriptName: string, semaforoName: string) => void;
}

export const SemaforoDetail: React.FC<SemaforoDetailProps> = ({ 
  item,
  onNavigateToScript
}) => {
  const { t } = useTranslation();
  const scripts = item.listascriptchelousano || [];
  
  return (
    <div className="h-full flex flex-col">
      {/* Compact Header with inline stats */}
      <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-500/20 rounded">
            <ToggleLeft className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {item.nomesemaforo}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-400">States:</span>
              <div className="flex gap-1">
                <span className="px-1.5 py-0.5 bg-yellow-900/30 text-yellow-300 rounded text-xs font-mono">
                  true/false
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Init:</span>
              <span className="font-bold text-white">false</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">{t('semaforoView.uses')}:</span>
              <span className="font-bold text-white">{item.utilizzi_totali || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">

        {/* Compact Operations */}
        {item.operazioni && Object.keys(item.operazioni).length > 0 && (
          <div className="bg-gray-800/20 rounded p-2.5 border border-gray-700/50">
            <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
              <Code className="w-3 h-3" />
              {t('detailView.commandsUsed')}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(item.operazioni).map(([cmd, count], idx) => (
                <div key={idx} className="bg-yellow-900/20 border border-yellow-800/50 rounded px-2 py-1 flex items-center gap-2">
                  <span className="text-yellow-400 font-mono text-xs">{cmd}</span>
                  <span className="text-yellow-300 font-bold text-xs">{String(count)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final State */}
        {item.stato_finale_probabile && (
          <div className="bg-gray-800/20 rounded p-2.5 border border-gray-700/50">
            <h4 className="text-xs font-semibold text-gray-400 mb-1">
              {t('semaforoView.finalState')}
            </h4>
            <span className="px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded text-xs font-mono">
              {item.stato_finale_probabile}
            </span>
          </div>
        )}

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
            <div className="space-y-1 min-h-[4rem] max-h-[4rem] overflow-y-auto">
              {scripts.map((script, idx) => (
                <div 
                  key={idx}
                  className="group flex items-center justify-between bg-gray-900/50 rounded px-2 py-1.5 hover:bg-gray-800/50 transition-all border border-gray-700/30 hover:border-gray-600/50"
                >
                  <span className="text-gray-300 font-mono text-xs truncate">{script}</span>
                  {onNavigateToScript && (
                    <button
                      onClick={() => onNavigateToScript(script, item.nomesemaforo)}
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
import React from 'react';
import { Hash, ToggleLeft, Tag, Users, Image, Trophy, FileText, ExternalLink, Info, Activity, Code, Layers } from 'lucide-react';
import { ElementType } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { useTranslation } from '@/locales/translations';
import { API_CONFIG } from '@/config/constants';

interface DetailViewProps {
  type: ElementType;
  item: any | null;
  onNavigateToScript?: (scriptName: string, variableName: string) => void;
}

export const DetailView: React.FC<DetailViewProps> = ({ 
  type, 
  item,
  onNavigateToScript
}) => {
  const { t } = useTranslation();

  if (!item) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900/20 rounded-lg">
        <div className="text-center">
          <Info className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{t('detailView.selectElement')}</p>
        </div>
      </div>
    );
  }

  const renderVariableDetail = () => {
    const scripts = item.listascriptchelausano || item.scripts || [];
    
    return (
      <div className="h-full flex flex-col">
        {/* Compact Header with inline stats */}
        <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 p-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-500/20 rounded">
              <Hash className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate">
                {item.nomevariabile || item.name}
              </h3>
              {item.valori_utilizzati && item.valori_utilizzati.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-gray-400">Values:</span>
                  <div className="flex gap-1">
                    {item.valori_utilizzati.slice(0, 8).map((val: any, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-cyan-900/30 text-cyan-300 rounded text-xs font-mono">
                        {val}
                      </span>
                    ))}
                    {item.valori_utilizzati.length > 8 && (
                      <span className="px-1.5 py-0.5 text-gray-400 text-xs">
                        +{item.valori_utilizzati.length - 8}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Init:</span>
                <span className="font-bold text-white">{item.valore_iniziale !== undefined ? item.valore_iniziale : '0'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Uses:</span>
                <span className="font-bold text-white">{item.utilizzi_totali || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">

          {/* Compact Operations */}
          {item.operazioni && Object.keys(item.operazioni).length > 0 && (
            <div className="bg-gray-800/20 rounded p-2.5 border border-gray-700/50">
              <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                <Code className="w-3 h-3" />
                {t('detailView.commandsUsed')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(item.operazioni).map(([cmd, count], idx) => (
                  <div key={idx} className="bg-blue-900/20 border border-blue-800/50 rounded px-2 py-1 flex items-center gap-2">
                    <span className="text-blue-400 font-mono text-xs">{cmd}</span>
                    <span className="text-blue-300 font-bold text-xs">{String(count)}</span>
                  </div>
                ))}
              </div>
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
              <div className="space-y-1 min-h-24 max-h-24 overflow-y-auto">
                {scripts.map((script: string, idx: number) => (
                  <div 
                    key={idx}
                    className="group flex items-center justify-between bg-gray-900/50 rounded px-2 py-1.5 hover:bg-gray-800/50 transition-all border border-gray-700/30 hover:border-gray-600/50"
                  >
                    <span className="text-gray-300 font-mono text-xs truncate">{script}</span>
                    {onNavigateToScript && (
                      <button
                        onClick={() => onNavigateToScript(script, item.nomevariabile || item.name)}
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

  const renderSemaforoDetail = () => {
    const scripts = item.listascriptchelousano || item.scripts || [];
    
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
                {item.nomesemaforo || item.name}
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
                <span className="font-bold text-white">{item.valore_iniziale || 'false'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Uses:</span>
                <span className="font-bold text-white">{item.utilizzi_totali || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">

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
              <div className="space-y-1 min-h-[6.0rem] max-h-[6.0rem] overflow-y-auto">
                {scripts.map((script: string, idx: number) => (
                  <div 
                    key={idx}
                    className="group flex items-center justify-between bg-gray-900/50 rounded px-2 py-1.5 hover:bg-gray-800/50 transition-all border border-gray-700/30 hover:border-gray-600/50"
                  >
                    <span className="text-gray-300 font-mono text-xs truncate">{script}</span>
                    {onNavigateToScript && (
                      <button
                        onClick={() => onNavigateToScript(script, item.nomesemaforo || item.name)}
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

  const renderLabelDetail = () => {
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
                {item.nomelabel || item.label}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Script:</span>
                <span className="font-bold text-white">{item.scriptancoraggio || '-'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Uses:</span>
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
              <div className="space-y-1 min-h-[6rem] max-h-[12rem] overflow-y-auto">
                {item.riferimenti.map((ref: any, idx: number) => (
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

  const renderCharacterDetail = () => {
    const scripts = item.scripts || [];
    
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
                {item.nomepersonaggio || item.character}
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
                {scripts.map((script: string, idx: number) => (
                  <div 
                    key={idx}
                    className="group flex items-center justify-between bg-gray-900/50 rounded px-2 py-1.5 hover:bg-gray-800/50 transition-all border border-gray-700/30 hover:border-gray-600/50"
                  >
                    <span className="text-gray-300 font-mono text-xs truncate">{script}</span>
                    {onNavigateToScript && (
                      <button
                        onClick={() => onNavigateToScript(script, item.nomepersonaggio || item.character)}
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

  const renderImageDetail = () => {
    const scripts = item.scripts || [];
    
    return (
      <div className="h-full flex flex-col">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-pink-900/30 to-rose-900/30 p-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-pink-500/20 rounded">
              <Image className="w-4 h-4 text-pink-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate">
                {item.nomefile || item.image}
              </h3>
            </div>
            <span className="text-xs text-gray-400">{t('detailView.image')}</span>
          </div>
        </div>

        {/* Compact Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Compact Image Preview */}
          {item.path && (
            <div className="bg-gray-800/40 rounded p-2 border border-gray-700/50">
              <img 
                src={`${API_CONFIG.API_BASE_URL}/game/image/${encodeURIComponent(item.path)}`}
                alt={item.nomefile || item.image}
                className="w-full h-auto rounded"
                style={{ maxHeight: '150px', objectFit: 'contain' }}
              />
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
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {scripts.map((script: string, idx: number) => (
                  <div 
                    key={idx}
                    className="group flex items-center justify-between bg-gray-900/50 rounded px-2 py-1.5 hover:bg-gray-800/50 transition-all border border-gray-700/30 hover:border-gray-600/50"
                  >
                    <span className="text-gray-300 font-mono text-xs truncate">{script}</span>
                    {onNavigateToScript && (
                      <button
                        onClick={() => onNavigateToScript(script, item.nomefile || item.image)}
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

  const renderAchievementDetail = () => {
    const scripts = item.scripts || [];
    
    return (
      <div className="h-full flex flex-col">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-orange-900/30 to-amber-900/30 p-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500/20 rounded">
              <Trophy className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate">
                {item.achievement}
              </h3>
            </div>
            <span className="text-xs text-gray-400">{t('detailView.achievement')}</span>
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
                {scripts.map((script: string, idx: number) => (
                  <div 
                    key={idx}
                    className="group flex items-center justify-between bg-gray-900/50 rounded px-2 py-1.5 hover:bg-gray-800/50 transition-all border border-gray-700/30 hover:border-gray-600/50"
                  >
                    <span className="text-gray-300 font-mono text-xs truncate">{script}</span>
                    {onNavigateToScript && (
                      <button
                        onClick={() => onNavigateToScript(script, item.achievement)}
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

  const renderDetail = () => {
    switch (type) {
      case 'variables':
        return renderVariableDetail();
      case 'semafori':
        return renderSemaforoDetail();
      case 'labels':
        return renderLabelDetail();
      case 'characters':
        return renderCharacterDetail();
      case 'images':
        return renderImageDetail();
      case 'achievements':
        return renderAchievementDetail();
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-gray-900/30 rounded-lg overflow-hidden">
      {renderDetail()}
    </div>
  );
};
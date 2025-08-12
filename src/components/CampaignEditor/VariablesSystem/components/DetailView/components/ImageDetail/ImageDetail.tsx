import React from 'react';
import { Image, FileText, ExternalLink, Activity } from 'lucide-react';
import { GameImage } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { useTranslation } from '@/locales';
import { API_CONFIG } from '@/config/constants';

interface ImageDetailProps {
  item: GameImage & { scripts?: string[] };
  onNavigateToScript?: (scriptName: string, imageName: string) => void;
}

export const ImageDetail: React.FC<ImageDetailProps> = ({ 
  item,
  onNavigateToScript
}) => {
  const { t } = useTranslation();
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
              {item.nomefile}
            </h3>
          </div>
          <span className="text-xs text-gray-400">{t('detailView.image')}</span>
        </div>
      </div>

      {/* Compact Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Compact Image Preview */}
        {item.percorso && (
          <div className="bg-gray-800/40 rounded p-2 border border-gray-700/50">
            <img 
              src={`${API_CONFIG.API_BASE_URL}/game/image/${encodeURIComponent(item.percorso)}`}
              alt={item.nomefile}
              className="w-full h-auto rounded"
              style={{ maxHeight: '150px', objectFit: 'contain' }}
            />
          </div>
        )}

        {/* Compact Image Stats */}
        <div className="bg-gray-800/20 rounded p-2.5 border border-gray-700/50">
          <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
            <Activity className="w-3 h-3" />
            Image Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-1 text-gray-300">{item.tipo}</span>
            </div>
            <div>
              <span className="text-gray-500">Size:</span>
              <span className="ml-1 text-gray-300">{(item.dimensione / 1024).toFixed(1)} KB</span>
            </div>
            <div>
              <span className="text-gray-500">Modified:</span>
              <span className="ml-1 text-gray-300">{new Date(item.modificato).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Depth:</span>
              <span className="ml-1 text-gray-300">{item.profondita}</span>
            </div>
          </div>
        </div>

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
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {scripts.map((script, idx) => (
                <div 
                  key={idx}
                  className="group flex items-center justify-between bg-gray-900/50 rounded px-2 py-1.5 hover:bg-gray-800/50 transition-all border border-gray-700/30 hover:border-gray-600/50"
                >
                  <span className="text-gray-300 font-mono text-xs truncate">{script}</span>
                  {onNavigateToScript && (
                    <button
                      onClick={() => onNavigateToScript(script, item.nomefile)}
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
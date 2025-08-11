import React from 'react';
import { MapNode } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedString } from '@/utils/localization';
import { API_CONFIG, PATHS } from '@/config/constants';
import { useTranslation } from '@/locales';

interface NodeInfoTooltipProps {
  node: MapNode;
}

export const NodeInfoTooltip: React.FC<NodeInfoTooltipProps> = ({ node }) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <div className="bg-gray-900 bg-opacity-95 border border-gray-700 rounded-lg p-4 shadow-2xl max-w-md backdrop-blur-sm">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <img
            src={node.imageBinary ? `data:image/png;base64,${node.imageBinary}` : `${API_CONFIG.ASSETS_BASE_URL}${PATHS.CAMPAIGN.BIG}/${node.image}`}
            alt={node.name}
            className="w-16 h-16 rounded-lg object-cover border border-gray-700"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold mb-2">
            {getLocalizedString(node.localizedCaptions, currentLanguage, node.name)}
          </h3>
          
          {node.localizedDescriptions && (
            <div className="text-gray-300 text-sm mb-2">
              {getLocalizedString(node.localizedDescriptions, currentLanguage, '')}
            </div>
          )}
          
          {node.buttons && node.buttons.length > 0 && (
            <div className="mb-2">
              <span className="text-gray-400 text-xs uppercase tracking-wider">{t('tooltip.interactiveButtons')}</span>
              <div className="mt-1 space-y-1">
                {node.buttons.map((button, index) => {
                  const description = button.localizedLabels ? 
                    getLocalizedString(button.localizedLabels, currentLanguage, button.id || '') : 
                    button.id;
                  return (
                    <div key={index} className="text-xs text-gray-300 pl-2 border-l border-gray-700">
                      {description}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="flex gap-4 text-xs border-t border-gray-700 pt-2">
            <div>
              <span className="text-gray-400">{t('tooltip.routes')} </span>
              <span className="text-gray-300">{node.shuttles?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-400">{t('tooltip.scripts')} </span>
              <span className="text-gray-300">{node.script_che_lo_usano?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { MapNode } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedString } from '@/utils/localization';

interface NodeInfoTooltipProps {
  node: MapNode;
}

export const NodeInfoTooltip: React.FC<NodeInfoTooltipProps> = ({ node }) => {
  const { currentLanguage } = useLanguage();

  return (
    <div className="bg-gray-900 bg-opacity-95 border border-gray-700 rounded-lg p-4 shadow-2xl max-w-sm backdrop-blur-sm"
    >
      <h3 className="text-white font-bold mb-2">
        {getLocalizedString(node.localizedCaptions, currentLanguage, node.name)}
      </h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-400">ID: </span>
          <span className="text-gray-300 font-mono">{node.name}</span>
        </div>
        
        {node.localizedDescriptions && (
          <div className="text-gray-300 text-xs">
            {getLocalizedString(node.localizedDescriptions, currentLanguage, '')}
          </div>
        )}
        
        {node.buttons && node.buttons.length > 0 && (
          <div>
            <span className="text-gray-400">Pulsanti: </span>
            <span className="text-gt-accent">{node.buttons.length}</span>
          </div>
        )}
        
        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-gray-400">Rotte: </span>
            <span className="text-gray-300">{node.shuttles?.length || 0}</span>
          </div>
          <div>
            <span className="text-gray-400">Script: </span>
            <span className="text-gray-300">{node.script_che_lo_usano?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
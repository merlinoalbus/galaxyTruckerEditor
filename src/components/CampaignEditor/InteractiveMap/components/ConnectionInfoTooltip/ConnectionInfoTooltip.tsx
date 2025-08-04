import React from 'react';
import { MapConnection } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedString } from '@/utils/localization';

interface ConnectionInfoTooltipProps {
  connection: MapConnection;
}

export const ConnectionInfoTooltip: React.FC<ConnectionInfoTooltipProps> = ({ connection }) => {
  const { currentLanguage } = useLanguage();

  if (!connection.missions || connection.missions.length === 0) {
    return null;
  }

  const mission = connection.missions[0];
  
  const getLicenseColor = (license?: string) => {
    switch (license) {
      case 'STI': return 'text-green-400';
      case 'STII': return 'text-yellow-400';
      case 'STIII': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getMissionTypeStyle = (type?: string) => {
    return type === 'UNIQUE' ? 'text-purple-400' : 'text-blue-400';
  };

  return (
    <div className="bg-gray-900 bg-opacity-95 border border-gray-700 rounded-lg p-4 shadow-2xl max-w-sm backdrop-blur-sm"
    >
      <h3 className="text-white font-bold mb-2 text-sm">
        {getLocalizedString(mission.localizedCaptions, currentLanguage, `${connection.from} → ${connection.to}`)}
      </h3>
      
      <div className="space-y-1 text-xs">
        <div>
          <span className="text-gray-400">Licenza: </span>
          <span className={`font-bold ${getLicenseColor(mission.license)}`}>
            {mission.license || 'N/A'}
          </span>
        </div>
        
        <div>
          <span className="text-gray-400">Tipo: </span>
          <span className={`font-bold ${getMissionTypeStyle(mission.missiontype)}`}>
            {mission.missiontype || 'NORMAL'}
          </span>
        </div>
        
        {mission.localizedDescriptions && (
          <div className="text-gray-300 mt-2">
            {getLocalizedString(mission.localizedDescriptions, currentLanguage, '')}
          </div>
        )}
      </div>
    </div>
  );
};
import React from 'react';
import { MapConnection } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedString } from '@/utils/localization';
import { API_CONFIG, MISSION_CONFIG } from '@/config/constants';
import { useTranslation } from '@/locales';

interface ConnectionInfoTooltipProps {
  connection: MapConnection;
}

export const ConnectionInfoTooltip: React.FC<ConnectionInfoTooltipProps> = ({ connection }) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();

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

  const licenseConfig = mission.license ? MISSION_CONFIG.LICENSE_CLASSES[mission.license] : null;
  const shipImage = licenseConfig?.shipImage || 'shipI';

  return (
    <div className="bg-gray-900 bg-opacity-95 border border-gray-700 rounded-lg p-4 shadow-2xl max-w-sm backdrop-blur-sm">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <img
            src={`${API_CONFIG.API_BASE_URL}/file/campaign/campaignMap/${shipImage}.cacheship.png`}
            alt={mission.license || 'Ship'}
            className="w-12 h-8 object-contain"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold mb-2 text-sm">
            {getLocalizedString(mission.localizedCaptions, currentLanguage, `${connection.from} → ${connection.to}`)}
          </h3>
          
          <div className="space-y-1 text-xs">
            <div>
              <span className="text-gray-400">{t('tooltip.license')} </span>
              <span className={`font-bold ${getLicenseColor(mission.license)}`}>
                {mission.license || 'N/A'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">{t('tooltip.type')} </span>
              <span className={`font-bold ${getMissionTypeStyle(mission.missiontype)}`}>
                {mission.missiontype || 'NORMAL'}
              </span>
            </div>
            
            {mission.localizedDescriptions && (
              <div className="text-gray-300 mt-2">
                {getLocalizedString(mission.localizedDescriptions, currentLanguage, '')}
              </div>
            )}
            
            {/* Show buttons from all missions */}
            {connection.missions.some(m => m.button) && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <span className="text-gray-400 text-xs uppercase tracking-wider">{t('tooltip.buttons')}</span>
                <div className="mt-1 space-y-1">
                  {connection.missions
                    .filter(m => m.button)
                    .map((m, index) => {
                      const buttonLabel = m.button?.localizedLabels ? 
                        getLocalizedString(m.button.localizedLabels, currentLanguage, m.button.id || '') : 
                        m.button?.id || '';
                      return (
                        <div key={index} className="text-xs text-gray-300 pl-2 border-l border-gray-700">
                          {buttonLabel}
                          {m.license && m.license !== mission.license && (
                            <span className={`ml-2 text-xs ${getLicenseColor(m.license)}`}>
                              ({m.license})
                            </span>
                          )}
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { Mission } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { scriptSelectorStyles } from '@/styles/CampaignEditor/InteractiveMap/styles/ScriptSelector/ScriptSelector.styles';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedString } from '@/utils/localization';

interface MissionItemProps {
  mission: Mission;
  onClick?: (mission: Mission) => void;
  index: number;
  isUnique: boolean;
}

export const MissionItem: React.FC<MissionItemProps> = ({ mission, onClick, index, isUnique }) => {
  const { currentLanguage } = useLanguage();
  const uniqueKey = isUnique
    ? `unique-${mission.id}-${index}`
    : `normal-${mission.id}-${index}`;

  return (
    <div
      key={uniqueKey}
      onClick={() => onClick && onClick(mission)}
      className={isUnique ? scriptSelectorStyles.missionItemUnique : scriptSelectorStyles.missionItem}
    >
      <div className="flex-1">
        <div className={scriptSelectorStyles.itemName}>
          {getLocalizedString(mission.localizedCaptions, currentLanguage, mission.id || '')}
        </div>
        <div className={scriptSelectorStyles.itemDetails}>
          <span className={scriptSelectorStyles.licenseTag(mission.license)}>
            {mission.license || 'STI'}
          </span>
          {mission.button && (
            <span className={scriptSelectorStyles.buttonTag}>
              {mission.button.id}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
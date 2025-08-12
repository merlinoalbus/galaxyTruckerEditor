import React from 'react';
import { Rocket, Star } from 'lucide-react';
import { Mission } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { scriptSelectorStyles } from '@/styles/CampaignEditor/InteractiveMap/styles/ScriptSelector/ScriptSelector.styles';
import { useTranslation } from '@/locales';
import { MissionItem } from '../MissionItem/MissionItem';

interface MissionListProps {
  filteredMissions: Mission[];
  uniqueMissions: Mission[];
  normalMissions: Mission[];
  searchTerm: string;
  onMissionSelect?: (mission: Mission) => void;
}

export const MissionList: React.FC<MissionListProps> = ({
  filteredMissions,
  uniqueMissions,
  normalMissions,
  searchTerm,
  onMissionSelect
}) => {
  const { t } = useTranslation();

  return (
    <div className={scriptSelectorStyles.column}>
      <div className={scriptSelectorStyles.columnHeaderMission}>
        <Rocket className="w-4 h-4" />
        <span>Missioni</span>
        <span className={scriptSelectorStyles.badge}>{filteredMissions.length}</span>
      </div>
      
      <div className={scriptSelectorStyles.listContainer}>
        {filteredMissions.length === 0 ? (
          <div className={scriptSelectorStyles.emptyState}>
            {searchTerm ? t('scriptSelector.noMissionsFound') : t('scriptSelector.noMissionsAvailable')}
          </div>
        ) : (
          <>
            {uniqueMissions.length > 0 && (
              <>
                <div className={scriptSelectorStyles.sectionLabel}>
                  <Star className="w-3 h-3" />
                  <span>{t('scriptSelector.uniqueMissions')}</span>
                </div>
                {uniqueMissions.map((mission, index) => (
                  <MissionItem
                    key={`unique-${mission.id}-${index}`}
                    mission={mission}
                    onClick={onMissionSelect}
                    index={index}
                    isUnique={true}
                  />
                ))}
              </>
            )}
            
            {normalMissions.length > 0 && (
              <>
                {uniqueMissions.length > 0 && <div className={scriptSelectorStyles.divider} />}
                <div className={scriptSelectorStyles.sectionLabel}>
                  <Rocket className="w-3 h-3" />
                  <span>{t('scriptSelector.normalMissions')}</span>
                </div>
                {normalMissions.map((mission, index) => (
                  <MissionItem
                    key={`normal-${mission.id}-${index}`}
                    mission={mission}
                    onClick={onMissionSelect}
                    index={index}
                    isUnique={false}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
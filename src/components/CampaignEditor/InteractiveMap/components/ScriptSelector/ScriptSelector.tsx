import React from 'react';
import { X } from 'lucide-react';
import { ScriptSelectorProps } from '@/types/CampaignEditor/InteractiveMap/types/ScriptSelector/ScriptSelector.types';
import { useScriptSelector } from '@/hooks/CampaignEditor/InteractiveMap/hooks/ScriptSelector/useScriptSelector';
import { scriptSelectorStyles } from '@/styles/CampaignEditor/InteractiveMap/styles/ScriptSelector/ScriptSelector.styles';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedString } from '@/utils/localization';
import { SearchInput } from './components/SearchInput/SearchInput';
import { ScriptList } from './components/ScriptList/ScriptList';
import { MissionList } from './components/MissionList/MissionList';

export const ScriptSelector: React.FC<ScriptSelectorProps> = ({
  isOpen,
  scripts,
  missions = [],
  title,
  startScripts = [],
  onScriptSelect,
  onMissionSelect,
  onClose
}) => {
  const { currentLanguage } = useLanguage();
  const {
    searchTerm,
    filteredScripts,
    setSearchTerm,
    isStartScript
  } = useScriptSelector(scripts, startScripts);

  if (!isOpen) return null;

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Filtra anche le missioni
  const filteredMissions = missions.filter(mission => {
    const searchLower = searchTerm.toLowerCase();
    const missionName = getLocalizedString(mission.localizedCaptions, currentLanguage, mission.id || '');
    const missionDesc = getLocalizedString(mission.localizedDescriptions, currentLanguage, '');
    
    return missionName.toLowerCase().includes(searchLower) ||
           missionDesc.toLowerCase().includes(searchLower) ||
           (mission.id && mission.id.toLowerCase().includes(searchLower));
  });

  // Separa scripts star e altri
  const starScripts = filteredScripts.filter(script => isStartScript(script));
  const otherScripts = filteredScripts.filter(script => !isStartScript(script));

  // Separa missioni unique e normal
  const uniqueMissions = filteredMissions.filter(m => m.missiontype === 'UNIQUE');
  const normalMissions = filteredMissions.filter(m => m.missiontype !== 'UNIQUE');

  return (
    <div className={scriptSelectorStyles.overlay} onClick={handleOverlayClick}>
      <div className={scriptSelectorStyles.modalEnhanced}>
        <div className={scriptSelectorStyles.headerEnhanced}>
          <h3 className={scriptSelectorStyles.titleEnhanced}>{title}</h3>
          <button className={scriptSelectorStyles.closeButtonEnhanced} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <SearchInput 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
        />

        <div className={scriptSelectorStyles.contentWrapper}>
          <ScriptList
            filteredScripts={filteredScripts}
            starScripts={starScripts}
            otherScripts={otherScripts}
            searchTerm={searchTerm}
            onScriptSelect={onScriptSelect}
            isStartScript={isStartScript}
          />

          <div className={scriptSelectorStyles.centerDivider} />

          <MissionList
            filteredMissions={filteredMissions}
            uniqueMissions={uniqueMissions}
            normalMissions={normalMissions}
            searchTerm={searchTerm}
            onMissionSelect={onMissionSelect}
          />
        </div>
      </div>
    </div>
  );
};
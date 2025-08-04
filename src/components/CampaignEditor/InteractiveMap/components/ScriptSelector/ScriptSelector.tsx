import React from 'react';
import { X, Search, FileCode, Rocket, Star } from 'lucide-react';
import { ScriptSelectorProps } from '@/types/CampaignEditor/InteractiveMap/types/ScriptSelector/ScriptSelector.types';
import { useScriptSelector } from '@/hooks/CampaignEditor/InteractiveMap/hooks/ScriptSelector/useScriptSelector';
import { scriptSelectorStyles } from '@/styles/CampaignEditor/InteractiveMap/styles/ScriptSelector/ScriptSelector.styles';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedString } from '@/utils/localization';
import { useTranslation } from '@/locales/translations';

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
  const { t } = useTranslation();
  const {
    searchTerm,
    filteredScripts,
    setSearchTerm,
    getScriptPreview,
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

        <div className={scriptSelectorStyles.searchContainerEnhanced}>
          <div className="relative">
            <input
              type="text"
              placeholder={t('scriptSelector.searchScripts')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={scriptSelectorStyles.searchInputEnhanced}
            />
            <Search 
              size={16} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        <div className={scriptSelectorStyles.contentWrapper}>
          {/* Colonna Scripts (Sinistra) */}
          <div className={scriptSelectorStyles.column}>
            <div className={scriptSelectorStyles.columnHeader}>
              <FileCode className="w-4 h-4" />
              <span>Scripts</span>
              <span className={scriptSelectorStyles.badge}>{filteredScripts.length}</span>
            </div>
            
            <div className={scriptSelectorStyles.listContainer}>
              {filteredScripts.length === 0 ? (
                <div className={scriptSelectorStyles.emptyState}>
                  {searchTerm ? t('scriptSelector.noScriptsFound') : t('scriptSelector.noScriptsAvailable')}
                </div>
              ) : (
                <>
                  {/* Star Scripts */}
                  {starScripts.length > 0 && (
                    <>
                      <div className={scriptSelectorStyles.sectionLabel}>
                        <Star className="w-3 h-3" />
                        <span>{t('scriptSelector.starScripts')}</span>
                      </div>
                      {starScripts.map((script, index) => (
                        <div
                          key={`star-${script.fileName}-${script.name}-${index}`}
                          onClick={() => onScriptSelect(script)}
                          className={scriptSelectorStyles.scriptItemStar}
                        >
                          <div className="flex-1">
                            <div className={scriptSelectorStyles.itemName}>{script.name}</div>
                            <div className={scriptSelectorStyles.itemFile}>{script.fileName}</div>
                          </div>
                          <Star className="w-4 h-4 text-yellow-400" />
                        </div>
                      ))}
                    </>
                  )}
                  
                  {/* Altri Scripts */}
                  {otherScripts.length > 0 && (
                    <>
                      {starScripts.length > 0 && <div className={scriptSelectorStyles.divider} />}
                      <div className={scriptSelectorStyles.sectionLabel}>
                        <FileCode className="w-3 h-3" />
                        <span>{t('scriptSelector.otherScripts')}</span>
                      </div>
                      {otherScripts.map((script, index) => (
                        <div
                          key={`regular-${script.fileName}-${script.name}-${index}`}
                          onClick={() => onScriptSelect(script)}
                          className={scriptSelectorStyles.scriptItem}
                        >
                          <div className="flex-1">
                            <div className={scriptSelectorStyles.itemName}>{script.name}</div>
                            <div className={scriptSelectorStyles.itemFile}>{script.fileName}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Divisore centrale */}
          <div className={scriptSelectorStyles.centerDivider} />

          {/* Colonna Missions (Destra) */}
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
                  {/* Missioni Unique */}
                  {uniqueMissions.length > 0 && (
                    <>
                      <div className={scriptSelectorStyles.sectionLabel}>
                        <Star className="w-3 h-3" />
                        <span>{t('scriptSelector.uniqueMissions')}</span>
                      </div>
                      {uniqueMissions.map((mission, index) => (
                        <div
                          key={`unique-${mission.id}-${index}`}
                          onClick={() => onMissionSelect && onMissionSelect(mission)}
                          className={scriptSelectorStyles.missionItemUnique}
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
                      ))}
                    </>
                  )}
                  
                  {/* Missioni Normal */}
                  {normalMissions.length > 0 && (
                    <>
                      {uniqueMissions.length > 0 && <div className={scriptSelectorStyles.divider} />}
                      <div className={scriptSelectorStyles.sectionLabel}>
                        <Rocket className="w-3 h-3" />
                        <span>{t('scriptSelector.normalMissions')}</span>
                      </div>
                      {normalMissions.map((mission, index) => (
                        <div
                          key={`normal-${mission.id}-${index}`}
                          onClick={() => onMissionSelect && onMissionSelect(mission)}
                          className={scriptSelectorStyles.missionItem}
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
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
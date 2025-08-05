import React from 'react';
import { FileCode, Star } from 'lucide-react';
import { CampaignScript } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { scriptSelectorStyles } from '@/styles/CampaignEditor/InteractiveMap/styles/ScriptSelector/ScriptSelector.styles';
import { useTranslation } from '@/locales/translations';
import { ScriptItem } from '../ScriptItem/ScriptItem';

interface ScriptListProps {
  filteredScripts: CampaignScript[];
  starScripts: CampaignScript[];
  otherScripts: CampaignScript[];
  searchTerm: string;
  onScriptSelect: (script: CampaignScript) => void;
  isStartScript: (script: CampaignScript) => boolean;
}

export const ScriptList: React.FC<ScriptListProps> = ({
  filteredScripts,
  starScripts,
  otherScripts,
  searchTerm,
  onScriptSelect,
  isStartScript
}) => {
  const { t } = useTranslation();

  return (
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
            {starScripts.length > 0 && (
              <>
                <div className={scriptSelectorStyles.sectionLabel}>
                  <Star className="w-3 h-3" />
                  <span>{t('scriptSelector.starScripts')}</span>
                </div>
                {starScripts.map((script, index) => (
                  <ScriptItem
                    key={`star-${script.fileName}-${script.name}-${index}`}
                    script={script}
                    isStarScript={true}
                    onClick={onScriptSelect}
                    index={index}
                  />
                ))}
              </>
            )}
            
            {otherScripts.length > 0 && (
              <>
                {starScripts.length > 0 && <div className={scriptSelectorStyles.divider} />}
                <div className={scriptSelectorStyles.sectionLabel}>
                  <FileCode className="w-3 h-3" />
                  <span>{t('scriptSelector.otherScripts')}</span>
                </div>
                {otherScripts.map((script, index) => (
                  <ScriptItem
                    key={`regular-${script.fileName}-${script.name}-${index}`}
                    script={script}
                    isStarScript={false}
                    onClick={onScriptSelect}
                    index={index}
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
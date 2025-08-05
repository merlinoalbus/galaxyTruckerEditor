import React from 'react';
import { Star } from 'lucide-react';
import { CampaignScript } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { scriptSelectorStyles } from '@/styles/CampaignEditor/InteractiveMap/styles/ScriptSelector/ScriptSelector.styles';

interface ScriptItemProps {
  script: CampaignScript;
  isStarScript: boolean;
  onClick: (script: CampaignScript) => void;
  index: number;
}

export const ScriptItem: React.FC<ScriptItemProps> = ({ script, isStarScript, onClick, index }) => {
  const uniqueKey = isStarScript 
    ? `star-${script.fileName}-${script.name}-${index}`
    : `regular-${script.fileName}-${script.name}-${index}`;

  return (
    <div
      key={uniqueKey}
      onClick={() => onClick(script)}
      className={isStarScript ? scriptSelectorStyles.scriptItemStar : scriptSelectorStyles.scriptItem}
    >
      <div className="flex-1">
        <div className={scriptSelectorStyles.itemName}>{script.name}</div>
        <div className={scriptSelectorStyles.itemFile}>{script.fileName}</div>
      </div>
      {isStarScript && <Star className="w-4 h-4 text-yellow-400" />}
    </div>
  );
};
import React from 'react';
import { BaseBlock } from '../BaseBlock/BaseBlock';
import { getBlockClassName } from '@/utils/CampaignEditor/VisualFlowEditor/blockColors';
import { useTranslation } from '@/locales';
import type { IFlowBlock, BlockUpdate } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

interface FinishMissionBlockProps {
  block: IFlowBlock;
  onUpdate: (updates: BlockUpdate) => void;
  onRemove?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isInvalid?: boolean;
  validationType?: 'error' | 'warning';
  collapseAllTrigger?: number;
  expandAllTrigger?: number;
  globalCollapseState?: 'collapsed' | 'expanded' | 'manual';
  isCustom?: boolean;
  availableLanguages?: string[];
}

export const FinishMissionBlock: React.FC<FinishMissionBlockProps> = ({
  block,
  onUpdate,
  onRemove,
  onDragStart,
  isInvalid = false,
  validationType,
  collapseAllTrigger = 0,
  expandAllTrigger = 0,
  globalCollapseState = 'manual',
  isCustom,
  availableLanguages
}) => {
  const { t } = useTranslation();

  const renderParameters = () => {
    return (
      <div className="space-y-2 text-xs text-gray-400">
        <div>{t('visualFlowEditor.blocks.finishMission.description')}</div>
      </div>
    );
  };

  const getBlockIcon = () => {
    return <span className="text-xl">🏁</span>;
  };

  const getCompactParams = () => {
    // No parameters for this block
    return (
      <div className="text-sm text-gray-400">{t('visualFlowEditor.blocks.finishMission.compact')}</div>
    );
  };

  return (
    <BaseBlock
      blockType={block.type}
      blockIcon={getBlockIcon()}
      compactParams={getCompactParams()}
      onRemove={onRemove}
      onDragStart={onDragStart}
      className={`${getBlockClassName(block.type, isInvalid, validationType)} p-3 mb-2 transition-all hover:shadow-lg`}
      isInvalid={isInvalid}
      validationType={validationType}
    >
      {renderParameters()}
    </BaseBlock>
  );
};

export default FinishMissionBlock;

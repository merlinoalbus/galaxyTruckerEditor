import { useMemo } from 'react';
import { Position } from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';

export interface AnchorPointState {
  isVisible: boolean;
  isActive: boolean;
  canConnect: boolean;
}

export const useAnchorPoint = (
  position: Position,
  blockId: string,
  type: 'input' | 'output',
  isHighlighted?: boolean
) => {
  const anchorState = useMemo((): AnchorPointState => ({
    isVisible: true,
    isActive: isHighlighted || false,
    canConnect: type === 'output' || type === 'input'
  }), [isHighlighted, type]);

  const handleConnection = (targetBlockId: string) => {
    console.log(`Connecting ${blockId} to ${targetBlockId}`);
  };

  return {
    anchorState,
    handleConnection
  };
};
import { useMemo } from 'react';
import { MapNode } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { Position } from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';

export const useMapNode = (
  node: MapNode,
  position: Position,
  isSelected: boolean,
  isHovered: boolean,
  relatedScripts: any[]
) => {
  const nodeState = useMemo(() => ({
    hasScripts: relatedScripts.length > 0,
    hasButtons: node.buttons && node.buttons.length > 0,
    radius: isSelected ? 45 : isHovered ? 40 : 35
  }), [relatedScripts, node.buttons, isSelected, isHovered]);

  const clipPathId = useMemo(() => `node-clip-${node.name}`, [node.name]);

  const handleClick = (event: React.MouseEvent, onClick: (node: MapNode) => void) => {
    event.stopPropagation();
    onClick(node);
  };

  return {
    nodeState,
    clipPathId,
    handleClick
  };
};
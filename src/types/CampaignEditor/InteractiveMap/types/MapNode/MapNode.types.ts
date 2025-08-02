import { MapNode, CampaignScript } from '../../InteractiveMap.types';

export interface MapNodeProps {
  node: MapNode;
  position: { x: number; y: number };
  isSelected: boolean;
  isHovered: boolean;
  relatedScripts: CampaignScript[];
  onClick: (node: MapNode) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export interface NodeVisualState {
  radius: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}
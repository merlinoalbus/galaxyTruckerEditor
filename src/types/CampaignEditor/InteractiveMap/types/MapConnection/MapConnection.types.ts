import { MapConnection, CampaignScript } from '../../InteractiveMap.types';

export interface MapConnectionProps {
  connection: MapConnection;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  isSelected: boolean;
  isHovered: boolean;
  relatedScripts: CampaignScript[];
  onClick: (connection: MapConnection) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export interface ConnectionVisualState {
  strokeColor: string;
  strokeWidth: number;
  strokeOpacity: number;
  strokeDasharray: string;
}
import { MapConnection, CampaignScript } from '../../InteractiveMap.types';

export interface MapConnectionProps {
  connection: MapConnection;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  shipPosition?: { x: number; y: number };
  isSelected: boolean;
  isHovered: boolean;
  relatedScripts: CampaignScript[];
  onClick: (connection: MapConnection) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

export interface ConnectionVisualState {
  strokeColor: string;
  strokeWidth: number;
  strokeOpacity: number;
  strokeDasharray: string;
}
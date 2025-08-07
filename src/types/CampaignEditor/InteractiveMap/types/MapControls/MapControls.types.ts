import { MapViewport } from '../../InteractiveMap.types';

export interface MapControlsProps {
  viewport: MapViewport;
  onViewportChange: (viewport: MapViewport) => void;
  onResetView?: () => void;
}

export interface MapControlsState {
  isDragging: boolean;
  isHovering: boolean;
}

export interface ControlButton {
  id: string;
  icon: React.ReactNode;
  label: string;
  action: () => void;
  disabled?: boolean;
  isSeparator?: boolean;
}
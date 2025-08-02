import { MapNode, Connection } from '../../CampaignEditor.types';

export interface InteractiveMapProps {
  onNodeClick: (node: MapNode) => void;
  onConnectionClick: (connection: Connection) => void;
}
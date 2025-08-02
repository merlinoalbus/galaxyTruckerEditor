import React from 'react';
import { MapNode, Connection } from '../../types/CampaignEditor';

interface InteractiveMapProps {
  onNodeClick?: (node: MapNode) => void;
  onConnectionClick?: (connection: Connection) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  onNodeClick,
  onConnectionClick
}) => {
  // TODO: Recuperare logica mappa da old/InteractiveCampaignMap.tsx
  
  return (
    <div className="p-6">
      <h3 className="text-lg font-bold text-white mb-4">Interactive Campaign Map</h3>
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Interactive Map component da implementare</p>
        <p className="text-sm text-gray-500 mt-2">
          Recuperare da old/InteractiveCampaignMap.tsx
        </p>
      </div>
    </div>
  );
};
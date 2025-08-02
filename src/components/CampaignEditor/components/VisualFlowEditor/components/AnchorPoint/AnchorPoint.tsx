import React from 'react';
import { AnchorPoint as AnchorPointType } from '../../../../../../types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';

interface AnchorPointProps {
  anchor: AnchorPointType;
  isTarget: boolean;
}

export const AnchorPoint: React.FC<AnchorPointProps> = ({
  anchor,
  isTarget
}) => {
  return (
    <div
      className={`
        absolute w-4 h-4 rounded-full border-2 transition-all duration-200
        ${anchor.isValid ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'}
        ${isTarget ? 'w-6 h-6 shadow-lg scale-125' : 'w-4 h-4'}
        z-50
      `}
      style={{
        left: anchor.coordinates.x - (isTarget ? 12 : 8),
        top: anchor.coordinates.y - (isTarget ? 12 : 8)
      }}
    >
      {/* Inner dot */}
      <div 
        className={`
          absolute rounded-full
          ${anchor.isValid ? 'bg-green-300' : 'bg-red-300'}
          ${isTarget ? 'w-2 h-2 top-2 left-2' : 'w-1 h-1 top-1.5 left-1.5'}
        `} 
      />
      
      {/* Tooltip for invalid anchors */}
      {!anchor.isValid && anchor.reason && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-60">
          {anchor.reason}
        </div>
      )}
    </div>
  );
};
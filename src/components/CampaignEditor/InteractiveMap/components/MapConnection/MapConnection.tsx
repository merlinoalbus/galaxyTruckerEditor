import React from 'react';
import { MapConnectionProps } from '@/types/CampaignEditor/InteractiveMap/types/MapConnection/MapConnection.types';
import { mapConnectionStyles } from '@/styles/CampaignEditor/InteractiveMap/styles/MapConnection/MapConnection.styles';
import { API_CONFIG, PATHS, MISSION_CONFIG } from '@/config/constants';

export const MapConnection: React.FC<MapConnectionProps> = ({
  connection,
  fromPosition,
  toPosition,
  shipPosition,
  isSelected,
  isHovered,
  relatedScripts,
  onClick,
  onMouseEnter,
  onMouseLeave
}) => {
  const hasScripts = relatedScripts.length > 0;
  const midX = (fromPosition.x + toPosition.x) / 2;
  const midY = (fromPosition.y + toPosition.y) / 2;
  
  // Handle shuttle connections differently
  if (connection.isShuttle) {
    const shuttleLineAttrs = {
      stroke: '#6B7280', // Gray color
      strokeWidth: 2,
      strokeOpacity: 0.6,
      strokeDasharray: '2,8' // Very sparse dashes
    };
    
    return (
      <g className={mapConnectionStyles.connectionGroup}>
        <line
          x1={fromPosition.x}
          y1={fromPosition.y}
          x2={toPosition.x}
          y2={toPosition.y}
          {...shuttleLineAttrs}
          style={{ pointerEvents: 'none' }}
        />
      </g>
    );
  }
  
  // Get license and mission type from first mission
  const firstMission = connection.missions?.[0];
  const license = firstMission?.license;
  const missionType = firstMission?.missiontype;
  
  const lineAttrs = mapConnectionStyles.connectionLine.getAttributes(hasScripts, isSelected, isHovered, license, missionType);

  // Calculate position on line to avoid overlaps
  const calculateShipPosition = () => {
    const lineLength = Math.sqrt(
      Math.pow(toPosition.x - fromPosition.x, 2) + 
      Math.pow(toPosition.y - fromPosition.y, 2)
    );
    
    // Start at middle of line
    let position = 0.5;
    const minDistance = 60; // Minimum distance from other elements
    
    // Try to find a position on the line that doesn't overlap
    // Check positions from center outward
    const positions = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8];
    
    for (const pos of positions) {
      const testX = fromPosition.x + (toPosition.x - fromPosition.x) * pos;
      const testY = fromPosition.y + (toPosition.y - fromPosition.y) * pos;
      
      // Check distance from nodes
      const distFromStart = Math.sqrt(
        Math.pow(testX - fromPosition.x, 2) + 
        Math.pow(testY - fromPosition.y, 2)
      );
      const distFromEnd = Math.sqrt(
        Math.pow(testX - toPosition.x, 2) + 
        Math.pow(testY - toPosition.y, 2)
      );
      
      if (distFromStart >= minDistance && distFromEnd >= minDistance) {
        position = pos;
        break;
      }
    }
    
    return {
      x: fromPosition.x + (toPosition.x - fromPosition.x) * position,
      y: fromPosition.y + (toPosition.y - fromPosition.y) * position
    };
  };

  // Use provided ship position or calculate fallback
  const shipPos = shipPosition || calculateShipPosition();

  // Check visibility
  if (connection.isVisible === false) {
    return null;
  }

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onClick(connection);
  };



  return (
    <g
      className={mapConnectionStyles.connectionGroup}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Invisible clickable area - larger for easier clicking */}
      <line
        x1={fromPosition.x}
        y1={fromPosition.y}
        x2={toPosition.x}
        y2={toPosition.y}
        stroke="transparent"
        strokeWidth="12"
        style={{ cursor: 'pointer' }}
      />
      
      {/* Visible line */}
      <line
        x1={fromPosition.x}
        y1={fromPosition.y}
        x2={toPosition.x}
        y2={toPosition.y}
        className={mapConnectionStyles.connectionLine.className}
        {...lineAttrs}
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Ship icon positioned on line - show only highest license */}
      {connection.license && (
        <g>
          {(() => {
            const licenseConfig = MISSION_CONFIG.LICENSE_CLASSES[connection.license];
            const flightClass = connection.license === 'STIII' ? 'III' : 
                               connection.license === 'STII' ? 'II' : 'I';
            
            return (
              <g>
                {/* Ship class image from API */}
                <image
                  href={`${API_CONFIG.API_BASE_URL}/file/campaign/campaignMap/${licenseConfig.shipImage}.cacheship.png`}
                  x={shipPos.x - 30}
                  y={shipPos.y - 20}
                  width="60"
                  height="40"
                  className="pointer-events-none"
                />
                {/* Class indicator text overlay */}
                <text
                  x={shipPos.x}
                  y={shipPos.y + 6}
                  textAnchor="middle"
                  className="fill-white text-xs font-bold pointer-events-none"
                  style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                    fontSize: '14px'
                  }}
                >
                  {flightClass}
                </text>
              </g>
            );
          })()}
        </g>
      )}

    </g>
  );
};
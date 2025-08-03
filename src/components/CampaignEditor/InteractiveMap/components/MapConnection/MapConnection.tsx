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
  const lineAttrs = mapConnectionStyles.connectionLine.getAttributes(hasScripts, isSelected, isHovered, connection.flightClass);

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

  // Get license configuration
  const licenseConfig = connection.license ? 
    MISSION_CONFIG.LICENSE_CLASSES[connection.license] : null;

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
      
      {/* Ship icons positioned on line */}
      {connection.flightClasses && connection.flightClasses.length > 0 && (
        <g>
          {connection.flightClasses.map((flightClass, index) => {
            const licenseConfig = MISSION_CONFIG.LICENSE_CLASSES[
              connection.availableLicenses?.[index] || 'STI'
            ];
            const offsetX = (index - (connection.flightClasses!.length - 1) / 2) * 35;
            
            return (
              <g key={`${flightClass}-${index}`}>
                {/* Ship class image */}
                <image
                  href={`${API_CONFIG.ASSETS_BASE_URL}${PATHS.IMAGES.SHIP_CLASS_ICON(licenseConfig.shipImage)}`}
                  x={shipPos.x - 30 + offsetX}
                  y={shipPos.y - 20}
                  width="60"
                  height="40"
                  className="pointer-events-none"
                />
                {/* Class indicator text overlay */}
                <text
                  x={shipPos.x + offsetX}
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
          })}
        </g>
      )}

      {hasScripts && (
        <circle
          cx={midX}
          cy={midY + 15}
          className={mapConnectionStyles.scriptIndicator.className}
          r={mapConnectionStyles.scriptIndicator.r}
          fill={mapConnectionStyles.scriptIndicator.fill}
          stroke={mapConnectionStyles.scriptIndicator.stroke}
          strokeWidth={mapConnectionStyles.scriptIndicator.strokeWidth}
        >
          <title>Scripts available for this connection</title>
        </circle>
      )}
    </g>
  );
};
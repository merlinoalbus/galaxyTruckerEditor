import React from 'react';
import { MapConnectionProps } from '../../../../../types/CampaignEditor/InteractiveMap/types/MapConnection/MapConnection.types';
import { mapConnectionStyles } from '../../../../../styles/CampaignEditor/InteractiveMap/styles/MapConnection/MapConnection.styles';

export const MapConnection: React.FC<MapConnectionProps> = ({
  connection,
  fromPosition,
  toPosition,
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
  const lineAttrs = mapConnectionStyles.connectionLine.getAttributes(hasScripts, isSelected, isHovered);

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
      <line
        x1={fromPosition.x}
        y1={fromPosition.y}
        x2={toPosition.x}
        y2={toPosition.y}
        className={mapConnectionStyles.connectionLine.className}
        {...lineAttrs}
      />
      
      <text
        x={midX}
        y={midY}
        textAnchor="middle"
        className={mapConnectionStyles.costText(isHovered)}
        dy="-5"
      >
        {connection.cost}
      </text>

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
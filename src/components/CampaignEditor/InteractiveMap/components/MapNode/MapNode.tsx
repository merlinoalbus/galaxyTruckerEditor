import React from 'react';
import { MapNodeProps } from '@/types/CampaignEditor/InteractiveMap/types/MapNode/MapNode.types';
import { mapNodeStyles } from '@/styles/CampaignEditor/InteractiveMap/styles/MapNode/MapNode.styles';
import { API_CONFIG, PATHS } from '@/config/constants';

export const MapNode: React.FC<MapNodeProps> = ({
  node,
  position,
  isSelected,
  isHovered,
  relatedScripts,
  onClick,
  onMouseEnter,
  onMouseLeave
}) => {
  const hasScripts = relatedScripts.length > 0;
  const hasButtons = node.buttons && node.buttons.length > 0;
  const radius = isSelected ? 45 : isHovered ? 40 : 35;
  const circleAttrs = mapNodeStyles.nodeCircle.getAttributes(hasScripts, isSelected, radius);

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onClick(node);
  };

  return (
    <g
      className={mapNodeStyles.nodeGroup}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <circle
        cx={position.x}
        cy={position.y}
        className={mapNodeStyles.nodeCircle.className}
        {...circleAttrs}
      />

      {/* Node Image */}
      <clipPath id={`node-clip-${node.name}`}>
        <circle
          cx={position.x}
          cy={position.y}
          r={radius}
        />
      </clipPath>
      <image
        href={`${API_CONFIG.ASSETS_BASE_URL}${PATHS.CAMPAIGN.BIG}/${node.image}`}
        x={position.x - radius}
        y={position.y - radius}
        width={radius * 2}
        height={radius * 2}
        clipPath={`url(#node-clip-${node.name})`}
        preserveAspectRatio="xMidYMid slice"
      />

      <text
        x={position.x}
        y={position.y + 55}
        textAnchor="middle"
        className={mapNodeStyles.nodeText(isHovered).className}
        style={mapNodeStyles.nodeText(isHovered).style}
        dy="0.3em"
      >
        {node.caption}
      </text>

      {hasScripts && (
        <g className={mapNodeStyles.scriptCount.group}>
          <circle
            cx={position.x + 25}
            cy={position.y - 25}
            r={mapNodeStyles.scriptCount.circle.r}
            fill={mapNodeStyles.scriptCount.circle.fill}
            stroke={mapNodeStyles.scriptCount.circle.stroke}
            strokeWidth={mapNodeStyles.scriptCount.circle.strokeWidth}
          />
          <text
            x={position.x + 25}
            y={position.y - 25}
            textAnchor="middle"
            className={mapNodeStyles.scriptCount.text}
            dy="0.3em"
          >
            {relatedScripts.length}
          </text>
        </g>
      )}

      {hasButtons && (
        <circle
          cx={position.x - 25}
          cy={position.y - 25}
          className={mapNodeStyles.buttonIndicator.className}
          r={mapNodeStyles.buttonIndicator.r}
          fill={mapNodeStyles.buttonIndicator.fill}
          stroke={mapNodeStyles.buttonIndicator.stroke}
          strokeWidth={mapNodeStyles.buttonIndicator.strokeWidth}
        >
          <title>{node.buttons!.length} interactive buttons available</title>
        </circle>
      )}
    </g>
  );
};
import React from 'react';

import { MapCanvasProps } from '@/types/CampaignEditor/InteractiveMap/types/MapCanvas/MapCanvas.types';
import { MapNode as MapNodeType, MapConnection as MapConnectionType } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { useMapCanvas } from '@/hooks/CampaignEditor/InteractiveMap/hooks/MapCanvas/useMapCanvas';
import { mapCanvasStyles } from '@/styles/CampaignEditor/InteractiveMap/styles/MapCanvas/MapCanvas.styles';
import { API_CONFIG, PATHS } from '@/config/constants';

import { MapNode } from '../MapNode/MapNode';
import { MapConnection } from '../MapConnection/MapConnection';

export const MapCanvas: React.FC<MapCanvasProps> = ({
  nodes,
  connections,
  viewport,
  onNodeClick,
  onConnectionClick,
  onViewportChange,
  getNodeRelatedScripts,
  getConnectionRelatedScripts
}) => {
  const {
    canvasRef,
    interaction,
    handleMouseDown,
    handleMouseUp,
    getViewBox,
    hoveredElement,
    setHoveredElement,
    selectedNode,
    setSelectedNode,
    selectedConnection,
    setSelectedConnection,
    visibleConnections,
    shipPositions
  } = useMapCanvas(viewport, onViewportChange, nodes, connections);

  const handleCanvasMouseDown = (event: React.MouseEvent) => {
    // Only handle canvas drag if click is not on a node or connection
    if ((event.target as SVGElement).tagName === 'svg' || 
        (event.target as SVGElement).tagName === 'rect' ||
        (event.target as SVGElement).tagName === 'image' && 
        !(event.target as SVGElement).closest('g[onClick]')) {
      handleMouseDown(event);
    }
  };

  const handleNodeClickInternal = (node: MapNodeType) => {
    setSelectedNode(node.name);
    setSelectedConnection(null);
    onNodeClick(node);
  };

  const handleConnectionClickInternal = (connection: MapConnectionType) => {
    const connectionId = `${connection.from}-${connection.to}`;
    setSelectedConnection(connectionId);
    setSelectedNode(null);
    onConnectionClick(connection);
  };

  return (
    <svg
      ref={canvasRef}
      viewBox={getViewBox(viewport)}
      className={mapCanvasStyles.svg(interaction.isDragging)}
      onMouseDown={handleCanvasMouseDown}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <defs>
        <radialGradient
          id={mapCanvasStyles.gradient.id}
          cx={mapCanvasStyles.gradient.cx}
          cy={mapCanvasStyles.gradient.cy}
          r={mapCanvasStyles.gradient.r}
        >
          {mapCanvasStyles.gradient.stops.map((stop, index) => (
            <stop
              key={index}
              offset={stop.offset}
              stopColor={stop.stopColor}
              stopOpacity={stop.stopOpacity}
            />
          ))}
        </radialGradient>
      </defs>

      {/* Background base */}
      <rect
        x={viewport.x}
        y={viewport.y}
        width={viewport.width / viewport.scale}
        height={viewport.height / viewport.scale}
        fill={mapCanvasStyles.background.fill}
      />

      {/* Background image anchored bottom-left, full size */}
      <image
        href={`${API_CONFIG.ASSETS_BASE_URL}${PATHS.CAMPAIGN.BIG}/bg.jpg`}
        x={viewport.x}
        y={viewport.y}
        width={viewport.width / viewport.scale}
        height={viewport.height / viewport.scale}
        preserveAspectRatio="xMinYMax slice"
        opacity="0.6"
      />

      {visibleConnections.map((connection, index) => {
        const fromNode = nodes.find(n => n.name === connection.from);
        const toNode = nodes.find(n => n.name === connection.to);
        
        if (!fromNode || !toNode || connection.isVisible === false) return null;

        const connectionId = `${connection.from}-${connection.to}`;
        const shipPosition = shipPositions.get(connectionId);
        
        return (
          <MapConnection
            key={`connection-${connectionId}-${index}`}
            connection={connection}
            fromPosition={{
              x: fromNode.coordinates[0],
              y: fromNode.coordinates[1]
            }}
            toPosition={{
              x: toNode.coordinates[0],
              y: toNode.coordinates[1]
            }}
            shipPosition={shipPosition}
            isSelected={selectedConnection === connectionId}
            isHovered={hoveredElement === connectionId}
            relatedScripts={getConnectionRelatedScripts ? getConnectionRelatedScripts(connection) : []}
            onClick={handleConnectionClickInternal}
            onMouseEnter={() => setHoveredElement(connectionId)}
            onMouseLeave={() => setHoveredElement(null)}
          />
        );
      })}

      {nodes.map((node, index) => (
        <MapNode
          key={`node-${node.name}-${index}`}
          node={node}
          position={{
            x: node.coordinates[0],
            y: node.coordinates[1]
          }}
          isSelected={selectedNode === node.name}
          isHovered={hoveredElement === node.name}
          relatedScripts={getNodeRelatedScripts ? getNodeRelatedScripts(node) : []}
          onClick={handleNodeClickInternal}
          onMouseEnter={() => setHoveredElement(node.name)}
          onMouseLeave={() => setHoveredElement(null)}
        />
      ))}
    </svg>
  );
};
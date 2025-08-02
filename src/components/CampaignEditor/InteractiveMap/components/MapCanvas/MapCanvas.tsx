import React from 'react';

import { MapCanvasProps } from '@/types/CampaignEditor/InteractiveMap/types/MapCanvas/MapCanvas.types';
import { useMapCanvas } from '@/hooks/CampaignEditor/InteractiveMap/hooks/MapCanvas/useMapCanvas';
import { mapCanvasStyles } from '@/styles/CampaignEditor/InteractiveMap/styles/MapCanvas/MapCanvas.styles';

import { MapNode } from '../MapNode/MapNode';
import { MapConnection } from '../MapConnection/MapConnection';

export const MapCanvas: React.FC<MapCanvasProps> = ({
  nodes,
  connections,
  viewport,
  onNodeClick,
  onConnectionClick,
  onViewportChange
}) => {
  const {
    canvasRef,
    interaction,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    getViewBox
  } = useMapCanvas(viewport, onViewportChange);

  const [hoveredElement, setHoveredElement] = React.useState<string | null>(null);
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = React.useState<string | null>(null);

  const handleNodeClickInternal = (node: any) => {
    setSelectedNode(node.name);
    setSelectedConnection(null);
    onNodeClick(node);
  };

  const handleConnectionClickInternal = (connection: any) => {
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
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
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

      <rect
        x={viewport.x}
        y={viewport.y}
        width={viewport.width / viewport.scale}
        height={viewport.height / viewport.scale}
        fill={mapCanvasStyles.background.fill}
      />

      {connections.map((connection, index) => {
        const fromNode = nodes.find(n => n.name === connection.from);
        const toNode = nodes.find(n => n.name === connection.to);
        
        if (!fromNode || !toNode) return null;

        const connectionId = `${connection.from}-${connection.to}`;
        
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
            isSelected={selectedConnection === connectionId}
            isHovered={hoveredElement === connectionId}
            relatedScripts={[]} // Will be populated by parent component
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
          relatedScripts={[]} // Will be populated by parent component
          onClick={handleNodeClickInternal}
          onMouseEnter={() => setHoveredElement(node.name)}
          onMouseLeave={() => setHoveredElement(null)}
        />
      ))}
    </svg>
  );
};
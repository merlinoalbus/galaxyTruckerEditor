import React from 'react';

import { MapCanvasProps } from '@/types/CampaignEditor/InteractiveMap/types/MapCanvas/MapCanvas.types';
import { useMapCanvas } from '@/hooks/CampaignEditor/InteractiveMap/hooks/MapCanvas/useMapCanvas';
import { mapCanvasStyles } from '@/styles/CampaignEditor/InteractiveMap/styles/MapCanvas/MapCanvas.styles';
import { API_CONFIG, PATHS } from '@/config/constants';
import { RouteVisibilityService } from '@/services/CampaignEditor/RouteVisibilityService';

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
    handleMouseUp,
    getViewBox
  } = useMapCanvas(viewport, onViewportChange);

  const [hoveredElement, setHoveredElement] = React.useState<string | null>(null);
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = React.useState<string | null>(null);

  // Filter connections based on visibility
  const visibilityService = RouteVisibilityService.getInstance();
  const visibleConnections = React.useMemo(() => 
    visibilityService.filterVisibleConnections(connections),
    [connections]
  );

  // Calculate ship positions for all connections to detect overlaps
  const shipPositions = React.useMemo(() => {
    const positions = new Map();
    const minDistance = 60; // Minimum distance between ships
    const testPositions = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.1, 0.9];
    
    visibleConnections.forEach((connection, connectionIndex) => {
      const fromNode = nodes.find(n => n.name === connection.from);
      const toNode = nodes.find(n => n.name === connection.to);
      
      if (!fromNode || !toNode || connection.isVisible === false) return;
      
      const connectionId = `${connection.from}-${connection.to}`;
      const fromPos = { x: fromNode.coordinates[0], y: fromNode.coordinates[1] };
      const toPos = { x: toNode.coordinates[0], y: toNode.coordinates[1] };
      
      // Try to find a position that doesn't overlap with existing ships
      let finalPosition = null;
      
      for (const pos of testPositions) {
        const testX = fromPos.x + (toPos.x - fromPos.x) * pos;
        const testY = fromPos.y + (toPos.y - fromPos.y) * pos;
        
        // Check distance from nodes
        const distFromStart = Math.sqrt(Math.pow(testX - fromPos.x, 2) + Math.pow(testY - fromPos.y, 2));
        const distFromEnd = Math.sqrt(Math.pow(testX - toPos.x, 2) + Math.pow(testY - toPos.y, 2));
        
        if (distFromStart < minDistance || distFromEnd < minDistance) continue;
        
        // Check overlaps with already positioned ships
        let hasOverlap = false;
        for (const [otherConnectionId, otherShipPos] of positions.entries()) {
          const distanceToOther = Math.sqrt(
            Math.pow(testX - otherShipPos.x, 2) + 
            Math.pow(testY - otherShipPos.y, 2)
          );
          
          if (distanceToOther < minDistance) {
            hasOverlap = true;
            break;
          }
        }
        
        if (!hasOverlap) {
          finalPosition = { x: testX, y: testY };
          break;
        }
      }
      
      // Fallback to center if no good position found
      if (!finalPosition) {
        finalPosition = {
          x: fromPos.x + (toPos.x - fromPos.x) * 0.5,
          y: fromPos.y + (toPos.y - fromPos.y) * 0.5
        };
      }
      
      positions.set(connectionId, finalPosition);
    });
    
    return positions;
  }, [visibleConnections, nodes]);

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
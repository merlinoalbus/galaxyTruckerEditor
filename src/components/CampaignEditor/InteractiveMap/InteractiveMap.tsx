import React, { useState } from 'react';

import { InteractiveMapProps, MapNode, MapConnection } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { useInteractiveMap } from '@/hooks/CampaignEditor/InteractiveMap/useInteractiveMap';
import { interactiveMapStyles } from '@/styles/CampaignEditor/InteractiveMap/InteractiveMap.styles';

import { MapCanvas } from './components/MapCanvas/MapCanvas';
import { MapControls } from './components/MapControls/MapControls';
import { ScriptSelector } from './components/ScriptSelector/ScriptSelector';
import { NodeInfoTooltip } from './components/NodeInfoTooltip/NodeInfoTooltip';
import { ConnectionInfoTooltip } from './components/ConnectionInfoTooltip/ConnectionInfoTooltip';
import { MapLegend } from './components/MapLegend/MapLegend';
import { TooltipPortal } from './components/TooltipPortal/TooltipPortal';

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  onNodeClick,
  onConnectionClick,
  onScriptSelect
}) => {
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<MapConnection | null>(null);
  const [hoveredNodePosition, setHoveredNodePosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredConnectionPosition, setHoveredConnectionPosition] = useState<{ x: number; y: number } | null>(null);

  const {
    nodes,
    connections,
    scripts,
    viewport,
    selectedNode,
    selectedConnection,
    hoveredElement,
    isLoading,
    error,
    scriptSelectorOpen,
    scriptSelectorData,
    handleNodeClick,
    handleConnectionClick,
    handleScriptSelect,
    handleMissionSelectInternal,
    handleScriptSelectorClose,
    setHoveredElement,
    setViewport
  } = useInteractiveMap(onScriptSelect);

  const handleNodeClickInternal = (node: MapNode) => {
    const relatedScripts = handleNodeClick(node);
    if (onNodeClick) {
      onNodeClick(node, relatedScripts);
    }
  };

  const handleNodeHover = (node: MapNode | null, position?: { x: number; y: number }) => {
    setHoveredNode(node);
    if (position) {
      setHoveredNodePosition(position);
    }
  };

  const handleConnectionClickInternal = (connection: MapConnection) => {
    const relatedScripts = handleConnectionClick(connection);
    if (onConnectionClick) {
      onConnectionClick(connection, relatedScripts);
    }
  };

  const handleConnectionHover = (connection: MapConnection | null, position?: { x: number; y: number }) => {
    setHoveredConnection(connection);
    if (position) {
      setHoveredConnectionPosition(position);
    }
  };

  if (isLoading) {
    return (
      <div className={interactiveMapStyles.container}>
        <div className={interactiveMapStyles.loading.container}>
          <div className={interactiveMapStyles.loading.spinner} />
          <p>Loading campaign map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={interactiveMapStyles.container}>
        <div className={interactiveMapStyles.error.container}>
          <h3>Error loading campaign map</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={interactiveMapStyles.container}>
      <div className={interactiveMapStyles.header}>
        <h3 className={interactiveMapStyles.title}>Interactive Campaign Map</h3>
      </div>

      <div className={interactiveMapStyles.viewport}>
        <MapLegend />
        <MapCanvas
          nodes={nodes}
          connections={connections}
          viewport={viewport}
          onNodeClick={handleNodeClickInternal}
          onConnectionClick={handleConnectionClickInternal}
          onNodeHover={handleNodeHover}
          onConnectionHover={handleConnectionHover}
          onViewportChange={setViewport}
        />
        <MapControls
          viewport={viewport}
          onViewportChange={setViewport}
        />
      </div>

      <ScriptSelector
        isOpen={scriptSelectorOpen}
        scripts={scriptSelectorData.scripts}
        missions={scriptSelectorData.missions}
        title={scriptSelectorData.title}
        startScripts={scriptSelectorData.startScripts}
        onScriptSelect={handleScriptSelect}
        onMissionSelect={handleMissionSelectInternal}
        onClose={handleScriptSelectorClose}
      />
      
      {!scriptSelectorOpen && hoveredNode && hoveredNodePosition && (
        <TooltipPortal targetPosition={hoveredNodePosition} viewport={viewport}>
          <NodeInfoTooltip node={hoveredNode} />
        </TooltipPortal>
      )}
      
      {!scriptSelectorOpen && hoveredConnection && hoveredConnectionPosition && (
        <TooltipPortal targetPosition={hoveredConnectionPosition} viewport={viewport}>
          <ConnectionInfoTooltip connection={hoveredConnection} />
        </TooltipPortal>
      )}
    </div>
  );
};
import React from 'react';

import { InteractiveMapProps, MapNode, MapConnection } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { useInteractiveMap } from '@/hooks/CampaignEditor/InteractiveMap/useInteractiveMap';
import { interactiveMapStyles } from '@/styles/CampaignEditor/InteractiveMap/InteractiveMap.styles';

import { MapCanvas } from './components/MapCanvas/MapCanvas';
import { MapControls } from './components/MapControls/MapControls';
import { ScriptSelector } from './components/ScriptSelector/ScriptSelector';

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  onNodeClick,
  onConnectionClick,
  onScriptSelect
}) => {
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

  const handleConnectionClickInternal = (connection: MapConnection) => {
    const relatedScripts = handleConnectionClick(connection);
    if (onConnectionClick) {
      onConnectionClick(connection, relatedScripts);
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
        <div className={interactiveMapStyles.legend}>
          <div className={interactiveMapStyles.legendItem}>
            <div className={`${interactiveMapStyles.legendDot} bg-emerald-500`} />
            <span>Class I (Easy)</span>
          </div>
          <div className={interactiveMapStyles.legendItem}>
            <div className={`${interactiveMapStyles.legendDot} bg-blue-500`} />
            <span>Class II (Medium)</span>
          </div>
          <div className={interactiveMapStyles.legendItem}>
            <div className={`${interactiveMapStyles.legendDot} bg-amber-500`} />
            <span>Class III (Hard)</span>
          </div>
          <div className={interactiveMapStyles.legendItem}>
            <div className={`${interactiveMapStyles.legendDot} bg-red-500`} />
            <span>Class IV (Very Hard)</span>
          </div>
        </div>
      </div>

      <div className={interactiveMapStyles.viewport}>
        <MapCanvas
          nodes={nodes}
          connections={connections}
          viewport={viewport}
          onNodeClick={handleNodeClickInternal}
          onConnectionClick={handleConnectionClickInternal}
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
        title={scriptSelectorData.title}
        startScripts={scriptSelectorData.startScripts}
        onScriptSelect={handleScriptSelect}
        onClose={handleScriptSelectorClose}
      />
    </div>
  );
};
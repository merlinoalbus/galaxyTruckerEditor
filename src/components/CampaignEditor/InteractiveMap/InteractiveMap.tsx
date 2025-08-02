import React from 'react';

import { InteractiveMapProps } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { useInteractiveMap } from '@/hooks/CampaignEditor/InteractiveMap/useInteractiveMap';
import { interactiveMapStyles } from '@/styles/CampaignEditor/InteractiveMap/InteractiveMap.styles';

import { MapCanvas } from './components/MapCanvas/MapCanvas';
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

  const handleNodeClickInternal = (node: any) => {
    const relatedScripts = handleNodeClick(node);
    if (onNodeClick) {
      onNodeClick(node, relatedScripts);
    }
  };

  const handleConnectionClickInternal = (connection: any) => {
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
            <div className={`${interactiveMapStyles.legendDot} bg-yellow-400`} />
            <span>Has Scripts</span>
          </div>
          <div className={interactiveMapStyles.legendItem}>
            <div className={`${interactiveMapStyles.legendDot} bg-red-500`} />
            <span>Script Count</span>
          </div>
          <div className={interactiveMapStyles.legendItem}>
            <div className={`${interactiveMapStyles.legendDot} bg-green-500`} />
            <span>Interactive Buttons</span>
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
      </div>

      <ScriptSelector
        isOpen={scriptSelectorOpen}
        scripts={scriptSelectorData.scripts}
        title={scriptSelectorData.title}
        onScriptSelect={handleScriptSelect}
        onClose={handleScriptSelectorClose}
      />
    </div>
  );
};
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

import { InteractiveMapProps, MapNode, MapConnection } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { useInteractiveMap } from '@/hooks/CampaignEditor/InteractiveMap/useInteractiveMap';
import { interactiveMapStyles } from '@/styles/CampaignEditor/InteractiveMap/InteractiveMap.styles';
import { useTranslation } from '@/locales/translations';
import { useFullscreen } from '@/contexts/FullscreenContext';

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
  const { t } = useTranslation();
  const { isMapFullscreen, toggleMapFullscreen } = useFullscreen();
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderKey, setRenderKey] = useState(0);
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

  // Stable function to recalculate viewport
  const recalculateViewport = useCallback(() => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = containerRect.width;
    const newHeight = containerRect.height;

    // Only update if dimensions actually changed
    if (newWidth === viewport.width && newHeight === viewport.height) return;

    // Find newbie coordinates
    const newbieNode = nodes.find(node => node.name === 'newbie');
    const newbieX = newbieNode?.coordinates[0] || 1250; // fallback to default coordinates
    const newbieY = newbieNode?.coordinates[1] || 2550;

    // Update viewport with new dimensions and center on newbie
    setViewport({
      x: newbieX - (newWidth / viewport.scale) / 2,
      y: newbieY - (newHeight / viewport.scale) / 2,
      width: newWidth,
      height: newHeight,
      scale: viewport.scale
    });
  }, [nodes, setViewport, viewport.width, viewport.height, viewport.scale]);

  // Effect to recalculate viewport when fullscreen changes
  useEffect(() => {
    const timer = setTimeout(() => {
      recalculateViewport();
      // Force re-render of MapCanvas to update background
      setRenderKey(prev => prev + 1);
    }, 100); // Small delay to ensure DOM has updated

    return () => clearTimeout(timer);
  }, [isMapFullscreen, recalculateViewport]);

  // Temporarily disable window resize handler to avoid conflicts
  // useEffect(() => {
  //   window.addEventListener('resize', recalculateViewport);
  //   return () => window.removeEventListener('resize', recalculateViewport);
  // }, [recalculateViewport]);

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
    <div ref={containerRef} className={interactiveMapStyles.container}>
      <div className={interactiveMapStyles.header}>
        <h3 className={interactiveMapStyles.title}>{t('campaignEditor.interactiveMapTitle')}</h3>
        <button
          onClick={toggleMapFullscreen}
          className="flex items-center justify-center w-10 h-10 bg-slate-700 hover:bg-gt-accent text-gray-300 hover:text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-gt-accent/30"
          title={isMapFullscreen ? t('interactiveMap.exitFullscreen') : t('interactiveMap.enterFullscreen')}
        >
          {isMapFullscreen ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className={interactiveMapStyles.viewport}>
        <MapLegend />
        <MapCanvas
          key={renderKey}
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
import { useCallback } from 'react';
import React from 'react';
import { ZoomIn, ZoomOut, Home, RotateCcw, Move } from 'lucide-react';
import { MapViewport } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { ControlButton } from '@/types/CampaignEditor/InteractiveMap/types/MapControls/MapControls.types';

export interface UseMapControlsReturn {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  centerOnNewbie: () => void;
  getZoomPercentage: () => number;
  setCustomZoom: (scale: number) => void;
}

export const useMapControls = (
  viewport: MapViewport,
  onViewportChange: (viewport: MapViewport) => void,
  onResetView?: () => void
): UseMapControlsReturn => {
  
  const zoomIn = useCallback(() => {
    const newScale = Math.min(5, viewport.scale * 1.2);
    const centerX = viewport.x + (viewport.width / viewport.scale) / 2;
    const centerY = viewport.y + (viewport.height / viewport.scale) / 2;
    
    onViewportChange({
      ...viewport,
      scale: newScale,
      x: centerX - (viewport.width / newScale) / 2,
      y: centerY - (viewport.height / newScale) / 2
    });
  }, [viewport, onViewportChange]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(0.1, viewport.scale * 0.8);
    const centerX = viewport.x + (viewport.width / viewport.scale) / 2;
    const centerY = viewport.y + (viewport.height / viewport.scale) / 2;
    
    onViewportChange({
      ...viewport,
      scale: newScale,
      x: centerX - (viewport.width / newScale) / 2,
      y: centerY - (viewport.height / newScale) / 2
    });
  }, [viewport, onViewportChange]);

  const centerOnNewbie = useCallback(() => {
    // Center on Port Newbie - coordinate [1250, 2550] da nodes.yaml
    const newbieX = 1250;
    const newbieY = 2550;
    
    onViewportChange({
      ...viewport,
      x: newbieX - (viewport.width / viewport.scale) / 2,
      y: newbieY - (viewport.height / viewport.scale) / 2
    });
  }, [viewport, onViewportChange]);

  const resetView = useCallback(() => {
    // Reset: zoom 100% + centra su Port Newbie
    const newbieX = 1250;
    const newbieY = 2550;
    const defaultScale = 1;
    
    onViewportChange({
      ...viewport,
      scale: defaultScale,
      x: newbieX - (viewport.width / defaultScale) / 2,
      y: newbieY - (viewport.height / defaultScale) / 2
    });
  }, [viewport, onViewportChange]);

  const getZoomPercentage = useCallback(() => {
    return Math.round(viewport.scale * 100);
  }, [viewport.scale]);

  const setCustomZoom = useCallback((scale: number) => {
    const centerX = viewport.x + (viewport.width / viewport.scale) / 2;
    const centerY = viewport.y + (viewport.height / viewport.scale) / 2;
    
    onViewportChange({
      ...viewport,
      scale: scale,
      x: centerX - (viewport.width / scale) / 2,
      y: centerY - (viewport.height / scale) / 2
    });
  }, [viewport, onViewportChange]);

  return {
    zoomIn,
    zoomOut,
    resetView,
    centerOnNewbie,
    getZoomPercentage,
    setCustomZoom
  };
};
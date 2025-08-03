import { useState, useCallback, useMemo } from 'react';
import { Position } from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';

export interface CanvasState {
  zoom: number;
  offset: Position;
  isDragging: boolean;
  selectedArea?: { start: Position; end: Position };
}

export const useFlowCanvas = () => {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    offset: { x: 0, y: 0 },
    isDragging: false
  });

  const handleZoom = useCallback((delta: number, center?: Position) => {
    setCanvasState(prev => {
      const newZoom = Math.max(0.1, Math.min(3, prev.zoom + delta * 0.1));
      return { ...prev, zoom: newZoom };
    });
  }, []);

  const handlePan = useCallback((deltaX: number, deltaY: number) => {
    setCanvasState(prev => ({
      ...prev,
      offset: {
        x: prev.offset.x + deltaX,
        y: prev.offset.y + deltaY
      }
    }));
  }, []);

  const resetView = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      zoom: 1,
      offset: { x: 0, y: 0 }
    }));
  }, []);

  const screenToCanvas = useCallback((screenPos: Position): Position => {
    return {
      x: (screenPos.x - canvasState.offset.x) / canvasState.zoom,
      y: (screenPos.y - canvasState.offset.y) / canvasState.zoom
    };
  }, [canvasState]);

  const canvasToScreen = useCallback((canvasPos: Position): Position => {
    return {
      x: canvasPos.x * canvasState.zoom + canvasState.offset.x,
      y: canvasPos.y * canvasState.zoom + canvasState.offset.y
    };
  }, [canvasState]);

  return {
    canvasState,
    handleZoom,
    handlePan,
    resetView,
    screenToCanvas,
    canvasToScreen
  };
};
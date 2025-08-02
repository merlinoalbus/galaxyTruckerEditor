import { useState, useCallback, useRef } from 'react';
import { MapViewport } from '../../../../../types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { CanvasInteraction } from '../../../../../types/CampaignEditor/InteractiveMap/types/MapCanvas/MapCanvas.types';

export interface UseMapCanvasReturn {
  canvasRef: React.RefObject<SVGSVGElement>;
  interaction: CanvasInteraction;
  handleMouseDown: (event: React.MouseEvent) => void;
  handleMouseMove: (event: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleWheel: (event: React.WheelEvent) => void;
  getViewBox: (viewport: MapViewport) => string;
}

export const useMapCanvas = (
  viewport: MapViewport,
  onViewportChange: (viewport: MapViewport) => void
): UseMapCanvasReturn => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [interaction, setInteraction] = useState<CanvasInteraction>({
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    lastPanPoint: { x: 0, y: 0 }
  });

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) return; // Only left mouse button
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;

    setInteraction({
      isDragging: true,
      dragStart: { x: clientX, y: clientY },
      lastPanPoint: { x: viewport.x, y: viewport.y }
    });
  }, [viewport.x, viewport.y]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!interaction.isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;

    const deltaX = (clientX - interaction.dragStart.x) / viewport.scale;
    const deltaY = (clientY - interaction.dragStart.y) / viewport.scale;

    const newViewport = {
      ...viewport,
      x: interaction.lastPanPoint.x - deltaX,
      y: interaction.lastPanPoint.y - deltaY
    };

    onViewportChange(newViewport);
  }, [interaction, viewport, onViewportChange]);

  const handleMouseUp = useCallback(() => {
    setInteraction(prev => ({
      ...prev,
      isDragging: false
    }));
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Convert mouse position to world coordinates
    const worldX = (mouseX / viewport.scale) + viewport.x;
    const worldY = (mouseY / viewport.scale) + viewport.y;

    const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, viewport.scale * scaleFactor));

    // Adjust viewport to keep mouse position fixed
    const newViewport = {
      ...viewport,
      scale: newScale,
      x: worldX - (mouseX / newScale),
      y: worldY - (mouseY / newScale)
    };

    onViewportChange(newViewport);
  }, [viewport, onViewportChange]);

  const getViewBox = useCallback((currentViewport: MapViewport): string => {
    return `${currentViewport.x} ${currentViewport.y} ${currentViewport.width / currentViewport.scale} ${currentViewport.height / currentViewport.scale}`;
  }, []);

  return {
    canvasRef,
    interaction,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    getViewBox
  };
};
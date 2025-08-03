import { useState, useCallback, useRef, useEffect } from 'react';
import { MapViewport } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { CanvasInteraction } from '@/types/CampaignEditor/InteractiveMap/types/MapCanvas/MapCanvas.types';

export interface UseMapCanvasReturn {
  canvasRef: React.RefObject<SVGSVGElement>;
  interaction: CanvasInteraction;
  handleMouseDown: (event: React.MouseEvent) => void;
  handleMouseUp: () => void;
  getViewBox: (viewport: MapViewport) => string;
}

export const useMapCanvas = (
  viewport: MapViewport,
  onViewportChange: (viewport: MapViewport) => void
): UseMapCanvasReturn => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [interaction, setInteraction] = useState<CanvasInteraction>({
    isMouseDown: false,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    lastPanPoint: { x: 0, y: 0 }
  });
  
  const [dragThreshold] = useState(3); // Minimum pixels to start dragging

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) return; // Only left mouse button
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;

    setInteraction({
      isMouseDown: true,
      isDragging: false, // Don't start dragging immediately
      dragStart: { x: clientX, y: clientY },
      lastPanPoint: { x: viewport.x, y: viewport.y }
    });
  }, [viewport.x, viewport.y]);


  const handleMouseUp = useCallback(() => {
    setInteraction(prev => ({
      ...prev,
      isMouseDown: false,
      isDragging: false
    }));
  }, []);

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Convert mouse position to world coordinates before scaling
    const worldMouseX = viewport.x + (mouseX / viewport.scale);
    const worldMouseY = viewport.y + (mouseY / viewport.scale);

    const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, viewport.scale * scaleFactor));

    // Calculate new viewport position to keep mouse point centered
    const newViewport = {
      ...viewport,
      scale: newScale,
      x: worldMouseX - (mouseX / newScale),
      y: worldMouseY - (mouseY / newScale)
    };

    onViewportChange(newViewport);
  }, [viewport, onViewportChange]);

  // Update viewport size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          onViewportChange({
            ...viewport,
            width: rect.width,
            height: rect.height
          });
        }
      }
    };

    // Initial size update
    const timer = setTimeout(updateSize, 100);
    
    // Listen for resize
    window.addEventListener('resize', updateSize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Use native event listener for wheel to prevent passive event listener warning
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const wheelOptions: AddEventListenerOptions = { 
      passive: false, 
      capture: false 
    };
    
    canvas.addEventListener('wheel', handleWheel, wheelOptions);
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Handle mouse events at document level for better drag behavior
  useEffect(() => {
    const handleDocumentMouseMove = (event: MouseEvent) => {
      if (!interaction.isMouseDown) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clientX = event.clientX - rect.left;
      const clientY = event.clientY - rect.top;

      // Check if we should start dragging based on threshold
      if (!interaction.isDragging) {
        const deltaX = Math.abs(clientX - interaction.dragStart.x);
        const deltaY = Math.abs(clientY - interaction.dragStart.y);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance >= dragThreshold) {
          setInteraction(prev => ({
            ...prev,
            isDragging: true
          }));
        }
        return;
      }

      // Perform actual dragging
      const deltaX = (clientX - interaction.dragStart.x) / viewport.scale;
      const deltaY = (clientY - interaction.dragStart.y) / viewport.scale;

      const newViewport = {
        ...viewport,
        x: interaction.lastPanPoint.x - deltaX,
        y: interaction.lastPanPoint.y - deltaY
      };

      onViewportChange(newViewport);
    };

    const handleDocumentMouseUp = () => {
      if (interaction.isMouseDown || interaction.isDragging) {
        setInteraction(prev => ({
          ...prev,
          isMouseDown: false,
          isDragging: false
        }));
      }
    };

    if (interaction.isMouseDown) {
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [interaction.isMouseDown, interaction.isDragging, interaction.dragStart, interaction.lastPanPoint, viewport, onViewportChange, dragThreshold]);

  const getViewBox = useCallback((currentViewport: MapViewport): string => {
    return `${currentViewport.x} ${currentViewport.y} ${currentViewport.width / currentViewport.scale} ${currentViewport.height / currentViewport.scale}`;
  }, []);

  return {
    canvasRef,
    interaction,
    handleMouseDown,
    handleMouseUp,
    getViewBox
  };
};
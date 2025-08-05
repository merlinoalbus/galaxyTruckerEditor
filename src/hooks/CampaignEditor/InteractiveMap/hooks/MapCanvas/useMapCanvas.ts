import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MapViewport, MapNode, MapConnection } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { CanvasInteraction } from '@/types/CampaignEditor/InteractiveMap/types/MapCanvas/MapCanvas.types';
import { RouteVisibilityService } from '@/services/CampaignEditor/RouteVisibilityService';

export interface UseMapCanvasReturn {
  canvasRef: React.RefObject<SVGSVGElement>;
  interaction: CanvasInteraction;
  handleMouseDown: (event: React.MouseEvent) => void;
  handleMouseUp: () => void;
  getViewBox: (viewport: MapViewport) => string;
  hoveredElement: string | null;
  setHoveredElement: (element: string | null) => void;
  selectedNode: string | null;
  setSelectedNode: (node: string | null) => void;
  selectedConnection: string | null;
  setSelectedConnection: (connection: string | null) => void;
  visibleConnections: MapConnection[];
  shipPositions: Map<string, any>;
}

export const useMapCanvas = (
  viewport: MapViewport,
  onViewportChange: (viewport: MapViewport) => void,
  nodes: MapNode[],
  connections: MapConnection[]
): UseMapCanvasReturn => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [interaction, setInteraction] = useState<CanvasInteraction>({
    isMouseDown: false,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    lastPanPoint: { x: 0, y: 0 }
  });
  
  const [dragThreshold] = useState(3); // Minimum pixels to start dragging
  
  // Selection and hover state
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  
  // Filter connections based on visibility
  const visibleConnections = useMemo(() => {
    const service = RouteVisibilityService.getInstance();
    return service.filterVisibleConnections(connections);
  }, [connections]);

  // Calculate ship positions for all connections to detect overlaps
  const shipPositions = useMemo(() => {
    const positions = new Map();
    const minDistance = 60; // Minimum distance between ships
    const testPositions = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.1, 0.9];
    
    visibleConnections.forEach((connection, connectionIndex) => {
      const fromNode = nodes.find(n => n.name === connection.from);
      const toNode = nodes.find(n => n.name === connection.to);
      
      if (!fromNode || !toNode || connection.isVisible === false) return;
      
      const connectionId = `${connection.from}-${connection.to}`;
      
      // Try each test position until we find one without conflicts
      for (const testPos of testPositions) {
        const testPoint = {
          x: fromNode.coordinates[0] + (toNode.coordinates[0] - fromNode.coordinates[0]) * testPos,
          y: fromNode.coordinates[1] + (toNode.coordinates[1] - fromNode.coordinates[1]) * testPos
        };
        
        // Check for conflicts with existing positions
        let hasConflict = false;
        for (const existingPos of positions.values()) {
          const distance = Math.sqrt(
            Math.pow(testPoint.x - existingPos.x, 2) + 
            Math.pow(testPoint.y - existingPos.y, 2)
          );
          if (distance < minDistance) {
            hasConflict = true;
            break;
          }
        }
        
        if (!hasConflict) {
          positions.set(connectionId, testPoint);
          break;
        }
      }
      
      // Fallback if all positions have conflicts
      if (!positions.has(connectionId)) {
        positions.set(connectionId, {
          x: fromNode.coordinates[0] + (toNode.coordinates[0] - fromNode.coordinates[0]) * 0.5,
          y: fromNode.coordinates[1] + (toNode.coordinates[1] - fromNode.coordinates[1]) * 0.5
        });
      }
    });
    
    return positions;
  }, [visibleConnections, nodes]);

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

  // Remove the viewport size update - it should be handled by InteractiveMap only

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
    getViewBox,
    hoveredElement,
    setHoveredElement,
    selectedNode,
    setSelectedNode,
    selectedConnection,
    setSelectedConnection,
    visibleConnections,
    shipPositions
  };
};
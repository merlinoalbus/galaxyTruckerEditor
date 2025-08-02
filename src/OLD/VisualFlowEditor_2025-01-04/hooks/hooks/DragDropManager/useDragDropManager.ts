import { useState, useCallback, useRef, useEffect } from 'react';
import {
  FlowBlock,
  DragState,
  DropZone,
  DropPosition,
  DragDropState,
  BlockType
} from '../../../../../types/CampaignEditor';
import { DragDropManagerService } from '../../../../../services/CampaignEditor/VisualFlowEditor/services/DragDropManager/dragDropManagerService';

export const useDragDropManager = (
  blocks: FlowBlock[],
  onBlockMove: (blockId: string, newPosition: DropPosition) => void,
  canvasRef: React.RefObject<HTMLDivElement>,
  validBlockTypes: Map<string, BlockType[]>
) => {
  const [dragDropState, setDragDropState] = useState<DragDropState>({
    dragState: {
      isDragging: false,
      dragOffset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 }
    },
    dropZones: [],
    validDropZones: new Set(),
    dragPreview: undefined
  });

  const dragDropService = DragDropManagerService.getInstance();
  const dragPreviewRef = useRef<HTMLElement | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const updateDropZones = useCallback((draggedBlock?: FlowBlock) => {
    if (!draggedBlock || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const dropZones = dragDropService.calculateDropZones(
      blocks,
      draggedBlock,
      canvasRect,
      validBlockTypes
    );

    const validDropZones = new Set(
      dropZones.filter(zone => zone.isValid).map(zone => zone.id)
    );

    setDragDropState(prev => ({
      ...prev,
      dropZones,
      validDropZones
    }));
  }, [blocks, dragDropService, canvasRef, validBlockTypes]);

  const handleDragStart = useCallback((blockId: string, event: React.DragEvent) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    dragStartPos.current = { x: event.clientX, y: event.clientY };

    setDragDropState(prev => ({
      ...prev,
      dragState: {
        isDragging: true,
        draggedBlockId: blockId,
        draggedBlock: block,
        dragOffset: { x: offsetX, y: offsetY },
        startPosition: { x: event.clientX, y: event.clientY },
        currentPosition: { x: event.clientX, y: event.clientY }
      }
    }));

    // Create drag preview
    const preview = dragDropService.createDragPreview(block, true, true);
    document.body.appendChild(preview);
    dragPreviewRef.current = preview;

    // Set drag data
    event.dataTransfer.setData('text/plain', blockId);
    event.dataTransfer.effectAllowed = 'move';

    // Update drop zones
    updateDropZones(block);

    // Hide default drag image
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    event.dataTransfer.setDragImage(dragImage, 0, 0);
  }, [blocks, updateDropZones, dragDropService]);

  const handleDragMove = useCallback((event: React.DragEvent) => {
    if (!dragDropState.dragState.isDragging) return;

    const currentPosition = { x: event.clientX, y: event.clientY };

    setDragDropState(prev => ({
      ...prev,
      dragState: {
        ...prev.dragState,
        currentPosition
      }
    }));

    // Update drag preview position
    if (dragPreviewRef.current) {
      const preview = dragPreviewRef.current;
      const offset = dragDropState.dragState.dragOffset;
      preview.style.left = `${currentPosition.x - offset.x}px`;
      preview.style.top = `${currentPosition.y - offset.y}px`;

      // Check if over valid drop zone
      const dropZone = dragDropService.findDropZoneAtPosition(
        dragDropState.dropZones,
        currentPosition.x,
        currentPosition.y
      );

      const isValidDrop = dropZone ? dragDropState.validDropZones.has(dropZone.id) : false;
      preview.style.borderColor = isValidDrop ? '#10b981' : '#ef4444';
    }
  }, [dragDropState, dragDropService]);

  const handleDragEnd = useCallback((event: React.DragEvent) => {
    if (!dragDropState.dragState.isDragging || !dragDropState.dragState.draggedBlock) return;

    const dropPosition = { x: event.clientX, y: event.clientY };
    const dropZone = dragDropService.findDropZoneAtPosition(
      dragDropState.dropZones,
      dropPosition.x,
      dropPosition.y
    );

    if (dropZone && dragDropState.validDropZones.has(dropZone.id)) {
      const newPosition: DropPosition = {
        targetBlockId: dropZone.blockId === 'end' ? undefined : dropZone.blockId,
        position: dropZone.type,
        branchIndex: dropZone.branchIndex,
        coordinates: dropPosition
      };

      onBlockMove(dragDropState.dragState.draggedBlock.id, newPosition);
    }

    // Clean up
    if (dragPreviewRef.current) {
      document.body.removeChild(dragPreviewRef.current);
      dragPreviewRef.current = null;
    }

    setDragDropState(prev => ({
      ...prev,
      dragState: {
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 }
      },
      dropZones: [],
      validDropZones: new Set(),
      highlightedDropZone: undefined
    }));
  }, [dragDropState, dragDropService, onBlockMove]);

  const handleDragEnter = useCallback((dropZoneId: string, event: React.DragEvent) => {
    event.preventDefault();
    
    if (dragDropState.validDropZones.has(dropZoneId)) {
      setDragDropState(prev => ({
        ...prev,
        highlightedDropZone: dropZoneId
      }));
    }
  }, [dragDropState.validDropZones]);

  const handleDragLeave = useCallback((dropZoneId: string, event: React.DragEvent) => {
    event.preventDefault();
    
    setDragDropState(prev => ({
      ...prev,
      highlightedDropZone: prev.highlightedDropZone === dropZoneId ? undefined : prev.highlightedDropZone
    }));
  }, []);

  const handleDrop = useCallback((dropZoneId: string, event: React.DragEvent) => {
    event.preventDefault();
    
    if (!dragDropState.validDropZones.has(dropZoneId)) return;

    const blockId = event.dataTransfer.getData('text/plain');
    const dropZone = dragDropState.dropZones.find(zone => zone.id === dropZoneId);
    
    if (dropZone && blockId) {
      const newPosition: DropPosition = {
        targetBlockId: dropZone.blockId === 'end' ? undefined : dropZone.blockId,
        position: dropZone.type,
        branchIndex: dropZone.branchIndex,
        coordinates: { x: event.clientX, y: event.clientY }
      };

      onBlockMove(blockId, newPosition);
    }
  }, [dragDropState, onBlockMove]);

  const isDragging = dragDropState.dragState.isDragging;
  const draggedBlockId = dragDropState.dragState.draggedBlockId;

  // Clean up drag preview on unmount
  useEffect(() => {
    return () => {
      if (dragPreviewRef.current) {
        document.body.removeChild(dragPreviewRef.current);
        dragPreviewRef.current = null;
      }
    };
  }, []);

  // Global mouse move handler for drag preview
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging && dragPreviewRef.current) {
        const preview = dragPreviewRef.current;
        const offset = dragDropState.dragState.dragOffset;
        preview.style.left = `${event.clientX - offset.x}px`;
        preview.style.top = `${event.clientY - offset.y}px`;
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isDragging, dragDropState.dragState.dragOffset]);

  return {
    dragDropState,
    isDragging,
    draggedBlockId,
    handlers: {
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragEnd: handleDragEnd,
      onDrop: handleDrop,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave
    }
  };
};
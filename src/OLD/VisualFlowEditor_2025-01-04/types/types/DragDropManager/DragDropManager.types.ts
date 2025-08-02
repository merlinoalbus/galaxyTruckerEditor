import { FlowBlock, BlockPosition, DropZone, BlockType } from '../../VisualFlowEditor.types';

export interface DragDropManagerProps {
  blocks: FlowBlock[];
  onBlockMove: (blockId: string, newPosition: DropPosition) => void;
  onBlockReorder: (blockId: string, targetBlockId: string, position: 'before' | 'after' | 'inside') => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}

export interface DragState {
  isDragging: boolean;
  draggedBlockId?: string;
  draggedBlock?: FlowBlock;
  dragOffset: { x: number; y: number };
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
}

export interface DropPosition {
  targetBlockId?: string;
  position: 'before' | 'after' | 'inside' | 'branch';
  branchIndex?: number;
  coordinates: { x: number; y: number };
}

export interface DragDropState {
  dragState: DragState;
  dropZones: DropZone[];
  validDropZones: Set<string>;
  highlightedDropZone?: string;
  dragPreview?: DragPreview;
}

export interface DragPreview {
  block: FlowBlock;
  position: { x: number; y: number };
  isValid: boolean;
  snapToGrid?: boolean;
}

export interface DropZoneConfig {
  id: string;
  blockId: string;
  type: 'before' | 'after' | 'inside' | 'branch';
  bounds: DOMRect;
  isValid: boolean;
  acceptedTypes: BlockType[];
  branchIndex?: number;
}

export interface DragHandlers {
  onDragStart: (blockId: string, event: React.DragEvent) => void;
  onDragMove: (event: React.DragEvent) => void;
  onDragEnd: (event: React.DragEvent) => void;
  onDrop: (dropZoneId: string, event: React.DragEvent) => void;
  onDragEnter: (dropZoneId: string, event: React.DragEvent) => void;
  onDragLeave: (dropZoneId: string, event: React.DragEvent) => void;
}

export interface GridConfig {
  enabled: boolean;
  size: number;
  snapToGrid: boolean;
  showGrid: boolean;
}

export interface DragVisualFeedback {
  showDropZones: boolean;
  highlightCompatibleZones: boolean;
  showDragGhost: boolean;
  animateTransitions: boolean;
  snapIndicators: boolean;
}
import { FlowBlock, BlockPosition, BranchContext } from '../../VisualFlowEditor.types';

export interface FlowCanvasProps {
  blocks: FlowBlock[];
  selectedBlocks: Set<string>;
  hoveredBlock?: string;
  onBlockSelect: (blockId: string, multiSelect?: boolean) => void;
  onBlockHover: (blockId?: string) => void;
  onCanvasClick: (event: React.MouseEvent) => void;
  onViewportChange: (viewport: ViewportState) => void;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface CanvasLayout {
  blockPositions: Map<string, BlockPosition>;
  branchLayouts: Map<string, BranchLayout>;
  connections: FlowConnection[];
  totalHeight: number;
  totalWidth: number;
}

export interface BranchLayout {
  parentBlockId: string;
  branches: BranchInfo[];
  type: 'if_else' | 'menu' | 'linear';
  startY: number;
  endY: number;
  totalWidth: number;
}

export interface BranchInfo {
  index: number;
  blocks: FlowBlock[];
  width: number;
  height: number;
  offsetX: number;
  label?: string;
  color?: string;
}

export interface FlowConnection {
  id: string;
  fromBlockId: string;
  toBlockId: string;
  fromPort: 'bottom' | 'right' | 'left';
  toPort: 'top' | 'left' | 'right';
  type: 'normal' | 'branch' | 'merge';
  branchLabel?: string;
  points: { x: number; y: number }[];
}

export interface CanvasInteraction {
  isPanning: boolean;
  isSelecting: boolean;
  selectionBox?: SelectionBox;
  panStart?: { x: number; y: number };
  lastMousePosition?: { x: number; y: number };
}

export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface RenderingConfig {
  blockSpacing: {
    horizontal: number;
    vertical: number;
    branchPadding: number;
  };
  blockSizes: {
    minWidth: number;
    minHeight: number;
    maxWidth: number;
  };
  connectionStyles: {
    strokeWidth: number;
    strokeColor: string;
    highlightColor: string;
    arrowSize: number;
  };
  branchColors: {
    if: string;
    else: string;
    menu: string;
    linear: string;
  };
}

export interface LayoutEngine {
  calculateLayout: (blocks: FlowBlock[]) => CanvasLayout;
  calculateBranchLayout: (parentBlock: FlowBlock, children: FlowBlock[]) => BranchLayout;
  optimizePositions: (layout: CanvasLayout) => CanvasLayout;
  validateLayout: (layout: CanvasLayout) => boolean;
}
import { 
  FlowBlock,
  DropZone,
  DropPosition,
  BlockType,
  DragState,
  DropZoneConfig
} from '../../../../../types/CampaignEditor';

export class DragDropManagerService {
  private static instance: DragDropManagerService;
  
  static getInstance(): DragDropManagerService {
    if (!DragDropManagerService.instance) {
      DragDropManagerService.instance = new DragDropManagerService();
    }
    return DragDropManagerService.instance;
  }

  calculateDropZones(
    blocks: FlowBlock[],
    draggedBlock: FlowBlock,
    canvasRect: DOMRect,
    validBlockTypes: Map<string, BlockType[]>
  ): DropZone[] {
    const dropZones: DropZone[] = [];

    for (const block of blocks) {
      if (block.id === draggedBlock.id) continue;

      const validTypes = validBlockTypes.get(block.id) || [];
      const canDropHere = validTypes.includes(draggedBlock.type);

      // Drop zone before block
      dropZones.push({
        id: `before-${block.id}`,
        type: 'before',
        blockId: block.id,
        position: {
          x: block.position.x,
          y: block.position.y - 10,
          width: block.position.width,
          height: 20,
          branch: block.position.branch,
          depth: block.position.depth
        },
        isValid: canDropHere
      });

      // Drop zone after block
      dropZones.push({
        id: `after-${block.id}`,
        type: 'after',
        blockId: block.id,
        position: {
          x: block.position.x,
          y: block.position.y + block.position.height - 10,
          width: block.position.width,
          height: 20,
          branch: block.position.branch,
          depth: block.position.depth
        },
        isValid: canDropHere
      });

      // Drop zone inside container blocks
      if (this.isContainerBlock(block.type)) {
        dropZones.push({
          id: `inside-${block.id}`,
          type: 'inside',
          blockId: block.id,
          position: {
            x: block.position.x + 20,
            y: block.position.y + 30,
            width: block.position.width - 40,
            height: Math.max(block.position.height - 60, 40),
            branch: block.position.branch,
            depth: block.position.depth + 1
          },
          isValid: canDropHere
        });
      }

      // Drop zones for branch blocks (IF/ELSE, Menu options)
      if (this.isBranchBlock(block.type)) {
        const branchCount = this.getBranchCount(block);
        for (let i = 0; i < branchCount; i++) {
          dropZones.push({
            id: `branch-${block.id}-${i}`,
            type: 'branch',
            blockId: block.id,
            branchIndex: i,
            position: {
              x: block.position.x + (i * 200),
              y: block.position.y + 60,
              width: 180,
              height: 40,
              branch: i,
              depth: block.position.depth + 1
            },
            isValid: canDropHere
          });
        }
      }
    }

    // Add drop zone at the end of the flow
    if (blocks.length > 0) {
      const lastBlock = blocks[blocks.length - 1];
      dropZones.push({
        id: 'end-of-flow',
        type: 'after',
        blockId: 'end',
        position: {
          x: lastBlock.position.x,
          y: lastBlock.position.y + lastBlock.position.height + 20,
          width: lastBlock.position.width,
          height: 40,
          branch: 0,
          depth: 0
        },
        isValid: true
      });
    }

    return dropZones;
  }

  findDropZoneAtPosition(
    dropZones: DropZone[],
    x: number,
    y: number
  ): DropZone | undefined {
    return dropZones.find(zone => 
      x >= zone.position.x &&
      x <= zone.position.x + zone.position.width &&
      y >= zone.position.y &&
      y <= zone.position.y + zone.position.height
    );
  }

  calculateSnapPosition(
    currentPosition: { x: number; y: number },
    dropZone: DropZone,
    gridSize: number = 20
  ): { x: number; y: number } {
    if (!dropZone) {
      // Snap to grid if no drop zone
      return {
        x: Math.round(currentPosition.x / gridSize) * gridSize,
        y: Math.round(currentPosition.y / gridSize) * gridSize
      };
    }

    // Snap to drop zone center
    return {
      x: dropZone.position.x + (dropZone.position.width / 2),
      y: dropZone.position.y + (dropZone.position.height / 2)
    };
  }

  validateDrop(
    draggedBlock: FlowBlock,
    targetBlock: FlowBlock,
    dropPosition: DropPosition,
    allBlocks: FlowBlock[]
  ): { isValid: boolean; reason?: string } {
    // Non permettere di droppare un blocco su se stesso
    if (draggedBlock.id === targetBlock.id) {
      return { isValid: false, reason: 'Cannot drop block on itself' };
    }

    // Non permettere di droppare un parent dentro un suo child
    if (this.isChildOfBlock(targetBlock, draggedBlock, allBlocks)) {
      return { isValid: false, reason: 'Cannot drop parent block inside its child' };
    }

    // Validazioni specifiche per tipo di drop
    switch (dropPosition.position) {
      case 'inside':
        if (!this.isContainerBlock(targetBlock.type)) {
          return { isValid: false, reason: 'Target block cannot contain other blocks' };
        }
        break;

      case 'branch':
        if (!this.isBranchBlock(targetBlock.type)) {
          return { isValid: false, reason: 'Target block does not support branches' };
        }
        const maxBranches = this.getBranchCount(targetBlock);
        if ((dropPosition.branchIndex || 0) >= maxBranches) {
          return { isValid: false, reason: 'Invalid branch index' };
        }
        break;
    }

    return { isValid: true };
  }

  createDragPreview(
    block: FlowBlock,
    isDragging: boolean,
    isValidDrop: boolean
  ): HTMLElement {
    const preview = document.createElement('div');
    preview.style.cssText = `
      position: fixed;
      width: ${block.position.width}px;
      height: ${block.position.height}px;
      background: rgba(59, 130, 246, 0.8);
      border: 2px solid ${isValidDrop ? '#10b981' : '#ef4444'};
      border-radius: 8px;
      pointer-events: none;
      z-index: 1000;
      opacity: ${isDragging ? 0.8 : 0};
      transition: opacity 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      font-weight: 500;
    `;
    
    preview.textContent = this.getBlockDisplayName(block.type);
    return preview;
  }

  updateBlockPosition(
    block: FlowBlock,
    newPosition: DropPosition,
    allBlocks: FlowBlock[]
  ): FlowBlock[] {
    const updatedBlocks = [...allBlocks];
    const blockIndex = updatedBlocks.findIndex(b => b.id === block.id);
    
    if (blockIndex === -1) return allBlocks;

    // Remove block from current position
    updatedBlocks.splice(blockIndex, 1);

    // Find insertion point
    const targetIndex = updatedBlocks.findIndex(b => b.id === newPosition.targetBlockId);
    
    if (targetIndex === -1) {
      // Add to end if target not found
      updatedBlocks.push(block);
    } else {
      switch (newPosition.position) {
        case 'before':
          updatedBlocks.splice(targetIndex, 0, block);
          break;
        case 'after':
          updatedBlocks.splice(targetIndex + 1, 0, block);
          break;
        case 'inside':
          // Add as child of target block
          const targetBlock = updatedBlocks[targetIndex];
          if (!targetBlock.children) {
            targetBlock.children = [];
          }
          targetBlock.children.push(block);
          break;
        case 'branch':
          // Handle branch insertion
          this.insertIntoBranch(updatedBlocks, targetIndex, block, newPosition.branchIndex || 0);
          break;
      }
    }

    return this.recalculatePositions(updatedBlocks);
  }

  private isContainerBlock(blockType: BlockType): boolean {
    return [
      'dialog_start', 'menu_start', 'condition_start', 'condition_start_not'
    ].includes(blockType);
  }

  private isBranchBlock(blockType: BlockType): boolean {
    return [
      'condition_start', 'condition_start_not', 'menu_start'
    ].includes(blockType);
  }

  private getBranchCount(block: FlowBlock): number {
    switch (block.type) {
      case 'condition_start':
      case 'condition_start_not':
        return 2; // IF and ELSE
      case 'menu_start':
        return parseInt(block.parameters?.optionCount) || 3; // Default 3 menu options
      default:
        return 0;
    }
  }

  private isChildOfBlock(
    potentialChild: FlowBlock,
    potentialParent: FlowBlock,
    allBlocks: FlowBlock[]
  ): boolean {
    const visitedIds = new Set<string>();
    
    const checkChild = (block: FlowBlock): boolean => {
      if (visitedIds.has(block.id)) return false;
      visitedIds.add(block.id);
      
      if (block.id === potentialParent.id) return true;
      
      if (block.children) {
        return block.children.some(child => checkChild(child));
      }
      
      return false;
    };
    
    return checkChild(potentialChild);
  }

  private insertIntoBranch(
    blocks: FlowBlock[],
    targetIndex: number,
    block: FlowBlock,
    branchIndex: number
  ): void {
    const targetBlock = blocks[targetIndex];
    
    // Initialize branch structure if needed
    if (!targetBlock.children) {
      targetBlock.children = [];
    }
    
    // Ensure branch array exists
    while (targetBlock.children.length <= branchIndex) {
      targetBlock.children.push({
        id: `branch-${targetBlock.id}-${targetBlock.children.length}`,
        type: 'unknown',
        content: '',
        startLine: 0,
        parameters: {},
        metadata: {
          depth: targetBlock.metadata.depth + 1,
          branchType: 'linear',
          branchIndex: targetBlock.children.length
        },
        position: {
          x: 0, y: 0, width: 0, height: 0,
          branch: targetBlock.children.length,
          depth: targetBlock.metadata.depth + 1
        },
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          canInsertAfter: [],
          canInsertBefore: []
        }
      });
    }
    
    // Add block to specified branch
    const branchContainer = targetBlock.children[branchIndex];
    if (!branchContainer.children) {
      branchContainer.children = [];
    }
    branchContainer.children.push(block);
  }

  private recalculatePositions(blocks: FlowBlock[]): FlowBlock[] {
    // Simplified position recalculation
    let currentY = 50;
    const baseX = 50;
    
    return blocks.map((block, index) => {
      const newBlock = { ...block };
      newBlock.position = {
        ...newBlock.position,
        x: baseX + (newBlock.metadata.depth * 40),
        y: currentY,
        width: 300,
        height: 60
      };
      
      currentY += 80;
      
      return newBlock;
    });
  }

  private getBlockDisplayName(blockType: BlockType): string {
    const displayNames: Record<BlockType, string> = {
      'dialogue': 'Say',
      'question': 'Ask',
      'announce': 'Announce',
      'show_character': 'Show Character',
      'hide_character': 'Hide Character',
      'change_character': 'Change Character',
      'variable_set': 'Set Variable',
      'variable_reset': 'Reset Variable',
      'variable_set_to': 'Set Variable To',
      'dialog_start': 'Dialog Start',
      'dialog_end': 'Dialog End',
      'menu_start': 'Menu Start',
      'menu_end': 'Menu End',
      'condition_start': 'If',
      'condition_start_not': 'If Not',
      'condition_else': 'Else',
      'condition_end': 'End If',
      'unknown': 'Unknown'
    } as any;
    
    return displayNames[blockType] || blockType;
  }
}
import { 
  FlowBlock, 
  FlowState, 
  ValidationResult, 
  ValidationRule,
  FlowBlockType,
  Character 
} from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';
import { flowStateManagerService } from '../FlowStateManager/flowStateManagerService';

export const validationEngineService = {
  validateBlocks(blocks: FlowBlock[], characters: Character[]): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const flowState = flowStateManagerService.calculateFlowStateAtBlock(blocks, block.id, characters);
      
      // Validate each block based on current flow state
      const blockResults = this.validateBlock(block, flowState, blocks, i);
      results.push(...blockResults);
    }
    
    return results;
  },

  validateBlock(block: FlowBlock, flowState: FlowState, allBlocks: FlowBlock[], blockIndex: number): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    switch (block.type) {
      case 'menu_container':
        results.push(...this.validateMenuContainer(block, flowState, allBlocks, blockIndex));
        break;
      case 'ask':
        results.push(...this.validateAskBlock(block, flowState, allBlocks, blockIndex));
        break;
      case 'hide_character':
      case 'change_character':
        results.push(...this.validateCharacterOperation(block, flowState));
        break;
      case 'say':
        results.push(...this.validateSayBlock(block, flowState));
        break;
    }
    
    return results;
  },

  validateMenuContainer(block: FlowBlock, flowState: FlowState, allBlocks: FlowBlock[], blockIndex: number): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Rule: Menu must be preceded by Ask in same branch
    const lastAskInBranch = this.findLastAskInBranch(flowState, allBlocks, blockIndex);
    
    if (!lastAskInBranch) {
      results.push({
        blockId: block.id,
        type: 'error',
        message: 'Menu container must be preceded by an Ask block in the same branch',
        rule: 'menu_needs_ask'
      });
    }
    
    return results;
  },

  validateAskBlock(block: FlowBlock, flowState: FlowState, allBlocks: FlowBlock[], blockIndex: number): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Rule: No consecutive Ask blocks in same branch
    const nextBlock = allBlocks[blockIndex + 1];
    if (nextBlock && nextBlock.type === 'ask') {
      // Check if they are in the same branch
      if (this.areInSameBranch(block, nextBlock)) {
        results.push({
          blockId: nextBlock.id,
          type: 'error',
          message: 'Consecutive Ask blocks are not allowed in the same branch',
          rule: 'consecutive_asks'
        });
      }
    }
    
    return results;
  },

  validateCharacterOperation(block: FlowBlock, flowState: FlowState): ValidationResult[] {
    const results: ValidationResult[] = [];
    const characterName = block.data.character;
    
    if (!characterName) {
      results.push({
        blockId: block.id,
        type: 'error',
        message: 'Character name is required',
        rule: 'missing_character'
      });
      return results;
    }
    
    const characterState = flowState.characterStates.get(characterName);
    
    if (!characterState) {
      results.push({
        blockId: block.id,
        type: 'error',
        message: `Character '${characterName}' not found`,
        rule: 'missing_character'
      });
      return results;
    }
    
    // Rule: Hide/Change character operations require character to be visible
    if ((block.type === 'hide_character' || block.type === 'change_character') && !characterState.isVisible) {
      results.push({
        blockId: block.id,
        type: 'error',
        message: `Cannot ${block.type.replace('_', ' ')} '${characterName}' - character is not visible`,
        rule: 'character_not_visible'
      });
    }
    
    return results;
  },

  validateSayBlock(block: FlowBlock, flowState: FlowState): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Warning: Say block without visible characters
    const visibleCharacters = flowStateManagerService.getVisibleCharacters(flowState);
    
    if (visibleCharacters.length === 0) {
      results.push({
        blockId: block.id,
        type: 'warning',
        message: 'Say block without any visible characters',
        rule: 'missing_character'
      });
    }
    
    return results;
  },

  findLastAskInBranch(flowState: FlowState, allBlocks: FlowBlock[], currentIndex: number): FlowBlock | null {
    // Look backwards for the last Ask block in the same branch
    for (let i = currentIndex - 1; i >= 0; i--) {
      const block = allBlocks[i];
      if (block.type === 'ask') {
        // TODO: Implement proper branch checking
        return block;
      }
      // Stop at branch boundaries
      if (block.type === 'if_container' || block.type === 'menu_container') {
        break;
      }
    }
    return null;
  },

  areInSameBranch(block1: FlowBlock, block2: FlowBlock): boolean {
    // TODO: Implement proper branch comparison logic
    // For now, assume same branch if no containers between them
    return true;
  },

  getAvailableBlockTypes(flowState: FlowState, position: 'before' | 'after' | 'inside', contextBlock?: FlowBlock): FlowBlockType[] {
    const available: FlowBlockType[] = [];
    
    // Always available blocks
    available.push('say', 'announce', 'show_character', 'set_variable', 'reset_variable');
    
    // Conditional blocks based on flow state
    const visibleCharacters = flowStateManagerService.getVisibleCharacters(flowState);
    
    if (visibleCharacters.length > 0) {
      available.push('hide_character', 'change_character');
    }
    
    // Ask block - check if not following another Ask in same branch
    const currentBranch = flowStateManagerService.getCurrentBranchPath(flowState);
    const lastAsk = flowState.lastAskPerBranch.get(currentBranch);
    
    if (!lastAsk || position === 'inside') {
      available.push('ask');
    }
    
    // Menu - only if there was an Ask before in same branch
    if (lastAsk) {
      available.push('menu_container');
    }
    
    // Containers
    available.push('dialog_container', 'if_container');
    
    return available;
  },

  getBlockTypeDisabledReason(blockType: FlowBlockType, flowState: FlowState): string | undefined {
    switch (blockType) {
      case 'hide_character':
      case 'change_character':
        const visibleCharacters = flowStateManagerService.getVisibleCharacters(flowState);
        if (visibleCharacters.length === 0) {
          return 'No visible characters';
        }
        break;
      case 'menu_container':
        const currentBranch = flowStateManagerService.getCurrentBranchPath(flowState);
        const lastAsk = flowState.lastAskPerBranch.get(currentBranch);
        if (!lastAsk) {
          return 'Requires Ask block before Menu';
        }
        break;
      case 'ask':
        // Check for consecutive asks
        return undefined; // Will be validated during actual validation
    }
    return undefined;
  }
};
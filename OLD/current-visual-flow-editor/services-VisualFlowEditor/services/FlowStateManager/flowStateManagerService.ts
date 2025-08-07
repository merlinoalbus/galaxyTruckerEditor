import { 
  FlowBlock, 
  FlowState, 
  CharacterState, 
  VariableState,
  BranchContext,
  ValidationResult,
  ValidationRule,
  Character 
} from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';

export const flowStateManagerService = {
  calculateFlowStateAtBlock(blocks: FlowBlock[], targetBlockId: string, characters: Character[]): FlowState {
    const flowState: FlowState = {
      characterStates: new Map(),
      variables: new Map(),
      branchStack: [],
      lastAskPerBranch: new Map()
    };

    // Initialize character states
    characters.forEach(char => {
      flowState.characterStates.set(char.name, {
        name: char.name,
        isVisible: false,
        currentImage: char.images?.[0] || char.image || '',
        baseImage: char.images?.[0] || char.image || ''
      });
    });

    // Process blocks in execution order until target block
    this.processBlocksInOrder(blocks, flowState, targetBlockId);
    
    return flowState;
  },

  processBlocksInOrder(blocks: FlowBlock[], flowState: FlowState, stopAtBlockId?: string): boolean {
    for (const block of blocks) {
      if (stopAtBlockId && block.id === stopAtBlockId) {
        return true; // Stop before processing target block
      }

      this.processBlock(block, flowState);

      // Process children if any
      if (block.type === 'if_container' || block.type === 'menu_container') {
        // Handle branching - process each branch separately
        // For now, process main branch only
        continue;
      }
    }
    return false;
  },

  processBlock(block: FlowBlock, flowState: FlowState): void {
    switch (block.type) {
      case 'show_character':
        this.handleShowCharacter(block, flowState);
        break;
      case 'hide_character':
        this.handleHideCharacter(block, flowState);
        break;
      case 'change_character':
        this.handleChangeCharacter(block, flowState);
        break;
      case 'set_variable':
        this.handleSetVariable(block, flowState);
        break;
      case 'reset_variable':
        this.handleResetVariable(block, flowState);
        break;
      case 'ask':
        this.handleAsk(block, flowState);
        break;
    }
  },

  handleShowCharacter(block: FlowBlock, flowState: FlowState): void {
    const characterName = block.data.character;
    if (characterName) {
      const state = flowState.characterStates.get(characterName);
      if (state) {
        flowState.characterStates.set(characterName, {
          ...state,
          isVisible: true
        });
      }
    }
  },

  handleHideCharacter(block: FlowBlock, flowState: FlowState): void {
    const characterName = block.data.character;
    if (characterName) {
      const state = flowState.characterStates.get(characterName);
      if (state) {
        flowState.characterStates.set(characterName, {
          ...state,
          isVisible: false
        });
      }
    }
  },

  handleChangeCharacter(block: FlowBlock, flowState: FlowState): void {
    const characterName = block.data.character;
    const newImage = block.data.image;
    if (characterName && newImage) {
      const state = flowState.characterStates.get(characterName);
      if (state) {
        flowState.characterStates.set(characterName, {
          ...state,
          currentImage: newImage
        });
      }
    }
  },

  handleSetVariable(block: FlowBlock, flowState: FlowState): void {
    const variableName = block.data.variable;
    if (variableName) {
      flowState.variables.set(variableName, {
        name: variableName,
        type: 'boolean',
        value: true
      });
    }
  },

  handleResetVariable(block: FlowBlock, flowState: FlowState): void {
    const variableName = block.data.variable;
    if (variableName) {
      flowState.variables.set(variableName, {
        name: variableName,
        type: 'boolean',
        value: false
      });
    }
  },

  handleAsk(block: FlowBlock, flowState: FlowState): void {
    const currentBranch = this.getCurrentBranchPath(flowState);
    flowState.lastAskPerBranch.set(currentBranch, block.id);
  },

  getCurrentBranchPath(flowState: FlowState): string {
    if (flowState.branchStack.length === 0) {
      return 'main';
    }
    return flowState.branchStack.map(b => `${b.type}:${b.activeBranch}`).join('/');
  },

  getVisibleCharacters(flowState: FlowState): string[] {
    const visible: string[] = [];
    flowState.characterStates.forEach((state, name) => {
      if (state.isVisible) {
        visible.push(name);
      }
    });
    return visible;
  },

  getCurrentSpeakingCharacter(flowState: FlowState): string | undefined {
    // Return the first visible character as default speaker
    const visible = this.getVisibleCharacters(flowState);
    return visible.length > 0 ? visible[0] : undefined;
  }
};
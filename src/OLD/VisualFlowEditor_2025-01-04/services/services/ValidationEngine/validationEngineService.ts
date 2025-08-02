import { 
  FlowBlock, 
  BlockType, 
  CharacterState, 
  ValidationError, 
  ValidationWarning,
  BlockValidationResult,
  ValidationRule,
  ValidationContext,
  ValidationResult,
  BranchValidationContext,
  ValidationRuleType
} from '../../../../../types/CampaignEditor';

export class ValidationEngineService {
  private static instance: ValidationEngineService;
  private rules: Map<ValidationRuleType, ValidationRule> = new Map();

  static getInstance(): ValidationEngineService {
    if (!ValidationEngineService.instance) {
      ValidationEngineService.instance = new ValidationEngineService();
    }
    return ValidationEngineService.instance;
  }

  constructor() {
    this.initializeValidationRules();
  }

  private initializeValidationRules(): void {
    // Regola: Character Visibility - Hide/Change solo su personaggi visibili
    this.rules.set('character_visibility', {
      id: 'character_visibility',
      name: 'Character Visibility',
      description: 'Hide/Change character blocks can only be used on visible characters',
      blockTypes: ['hide_character', 'change_character'],
      priority: 1,
      validator: (context: ValidationContext): ValidationResult => {
        const { currentBlock, characterStates } = context;
        const errors: ValidationError[] = [];
        
        if (currentBlock.type === 'hide_character' || currentBlock.type === 'change_character') {
          const characterName = currentBlock.parameters?.character;
          if (!characterName) {
            errors.push({
              type: 'missing_parameter',
              message: 'Character parameter is required',
              blockId: currentBlock.id,
              severity: 'error'
            });
          } else {
            const characterState = characterStates.get(characterName);
            if (!characterState || !characterState.isShown) {
              errors.push({
                type: 'character_not_visible',
                message: `Character '${characterName}' is not visible. Use Show Character first.`,
                blockId: currentBlock.id,
                severity: 'error'
              });
            }
          }
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      }
    });

    // Regola: Ask Consecutive - No Ask consecutivi nello stesso branch
    this.rules.set('ask_consecutive', {
      id: 'ask_consecutive',
      name: 'Ask Consecutive',
      description: 'Two Ask blocks cannot be consecutive in the same branch',
      blockTypes: ['question'],
      priority: 2,
      validator: (context: ValidationContext): ValidationResult => {
        const { currentBlock, branchContext } = context;
        const errors: ValidationError[] = [];
        
        if (currentBlock.type === 'question' && branchContext.lastAskInBranch) {
          // Controlla se c'è un altro Ask nello stesso branch dopo l'ultimo Ask
          const blocksAfterLastAsk = this.getBlocksAfterInSameBranch(
            context.allBlocks, 
            branchContext.lastAskInBranch,
            branchContext
          );
          
          const hasIntermediateBlocks = blocksAfterLastAsk.some(block => 
            block.id !== currentBlock.id && 
            !this.isContainerBlock(block.type)
          );
          
          if (!hasIntermediateBlocks) {
            errors.push({
              type: 'ask_consecutive',
              message: 'Cannot have consecutive Ask blocks in the same branch. Add content between them.',
              blockId: currentBlock.id,
              severity: 'error'
            });
          }
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      }
    });

    // Regola: Menu Prerequisites - Menu deve essere preceduto da Ask
    this.rules.set('menu_prerequisites', {
      id: 'menu_prerequisites',
      name: 'Menu Prerequisites',
      description: 'Menu containers must be preceded by an Ask block in the same branch',
      blockTypes: ['menu_start'],
      priority: 1,
      validator: (context: ValidationContext): ValidationResult => {
        const { currentBlock, branchContext } = context;
        const errors: ValidationError[] = [];
        
        if (currentBlock.type === 'menu_start') {
          if (!branchContext.lastAskInBranch) {
            errors.push({
              type: 'menu_without_ask',
              message: 'Menu must be preceded by an Ask block in the same branch',
              blockId: currentBlock.id,
              severity: 'error'
            });
          }
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      }
    });

    // Regola: Variable Existence - Variabili devono esistere
    this.rules.set('variable_existence', {
      id: 'variable_existence',
      name: 'Variable Existence',
      description: 'Variables must be defined before use',
      blockTypes: ['variable_set', 'variable_reset', 'variable_set_to', 'condition_start', 'condition_start_not'],
      priority: 1,
      validator: (context: ValidationContext): ValidationResult => {
        const { currentBlock, variables, semafori } = context;
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        
        const variableName = currentBlock.parameters?.variable || currentBlock.parameters?.semaforo;
        
        if (variableName) {
          if (currentBlock.type === 'variable_set_to') {
            // Numeric variables
            if (!variables.has(variableName)) {
              warnings.push({
                type: 'unused_character',
                message: `Numeric variable '${variableName}' not found in global variables`,
                blockId: currentBlock.id
              });
            }
          } else if (currentBlock.type === 'variable_set' || currentBlock.type === 'variable_reset') {
            // Boolean semafori  
            if (!semafori.has(variableName)) {
              warnings.push({
                type: 'unused_character',
                message: `Semaforo '${variableName}' not found in global semafori`,
                blockId: currentBlock.id
              });
            }
          }
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          warnings
        };
      }
    });

    // Regola: Parameter Validation - Parametri richiesti devono essere presenti
    this.rules.set('parameter_validation', {
      id: 'parameter_validation',
      name: 'Parameter Validation',
      description: 'Required parameters must be present and valid',
      blockTypes: ['dialogue', 'question', 'show_character', 'hide_character', 'change_character'],
      priority: 1,
      validator: (context: ValidationContext): ValidationResult => {
        const { currentBlock } = context;
        const errors: ValidationError[] = [];
        
        const requiredParams = this.getRequiredParameters(currentBlock.type);
        
        for (const param of requiredParams) {
          if (!currentBlock.parameters?.[param] || 
              (typeof currentBlock.parameters[param] === 'string' && currentBlock.parameters[param].trim() === '')) {
            errors.push({
              type: 'missing_parameter',
              message: `Required parameter '${param}' is missing`,
              blockId: currentBlock.id,
              severity: 'error'
            });
          }
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      }
    });
  }

  validateBlock(
    block: FlowBlock,
    allBlocks: FlowBlock[],
    characterStates: Map<string, CharacterState>,
    variables: Map<string, any>,
    semafori: Set<string>
  ): BlockValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Calcola il contesto del branch
    const branchContext = this.calculateBranchContext(block, allBlocks);
    const flowHistory = this.getFlowHistoryToBlock(block, allBlocks);
    
    const context: ValidationContext = {
      currentBlock: block,
      allBlocks,
      characterStates,
      variables,
      semafori,
      branchContext,
      flowHistory
    };

    // Applica tutte le regole applicabili
    for (const rule of this.rules.values()) {
      if (rule.blockTypes.includes(block.type)) {
        const result = rule.validator(context);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      }
    }

    // Calcola blocchi inseribili dopo questo blocco
    const canInsertAfter = this.calculateInsertableBlocksAfter(context);
    const canInsertBefore = this.calculateInsertableBlocksBefore(context);
    const contextualBlocks = this.calculateContextualBlocks(context);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canInsertAfter,
      canInsertBefore,
      contextualBlocks
    };
  }

  private calculateBranchContext(block: FlowBlock, allBlocks: FlowBlock[]): BranchValidationContext {
    // Trova il parent branch e calcola il contesto
    const parentBranch = this.findParentBranch(block, allBlocks);
    const siblingBlocks = this.getSiblingBlocks(block, allBlocks);
    const lastAskInBranch = this.findLastAskInBranch(block, allBlocks);
    
    return {
      type: parentBranch ? this.mapBlockTypeToBranchType(parentBranch.type) : 'linear',
      parentBlockId: parentBranch?.id,
      siblingBlocks,
      depth: block.metadata.depth,
      lastAskInBranch
    };
  }

  private mapBlockTypeToBranchType(blockType: BlockType): 'linear' | 'if' | 'else' | 'menu' {
    switch (blockType) {
      case 'condition_start':
      case 'condition_start_not':
        return 'if';
      case 'condition_else':
        return 'else';
      case 'menu_start':
        return 'menu';
      default:
        return 'linear';
    }
  }

  private getFlowHistoryToBlock(block: FlowBlock, allBlocks: FlowBlock[]): FlowBlock[] {
    // Ricostruisce la cronologia del flusso fino a questo blocco
    const history: FlowBlock[] = [];
    
    // Implementazione semplificata - in un caso reale seguiremmo il flusso completo
    const blockIndex = allBlocks.findIndex(b => b.id === block.id);
    for (let i = 0; i < blockIndex; i++) {
      history.push(allBlocks[i]);
    }
    
    return history;
  }

  private calculateInsertableBlocksAfter(context: ValidationContext): BlockType[] {
    const { currentBlock, branchContext } = context;
    const insertable: BlockType[] = [];
    
    // Logica base - tutti i blocchi base sono sempre inseribili
    const baseBlocks: BlockType[] = [
      'dialogue', 'question', 'announce', 'show_character', 
      'hide_character', 'change_character', 'variable_set', 
      'variable_reset', 'variable_set_to'
    ];
    
    insertable.push(...baseBlocks);
    
    // Menu solo se l'ultimo blocco nel branch è Ask
    if (branchContext.lastAskInBranch === currentBlock.id) {
      insertable.push('menu_start');
    }
    
    // Container blocks
    insertable.push('dialog_start', 'condition_start', 'condition_start_not');
    
    return insertable;
  }

  private calculateInsertableBlocksBefore(context: ValidationContext): BlockType[] {
    // Tutti i blocchi possono essere inseriti prima (con validazione successiva)
    return [
      'dialogue', 'question', 'announce', 'show_character', 
      'hide_character', 'change_character', 'variable_set', 
      'variable_reset', 'variable_set_to', 'dialog_start', 
      'menu_start', 'condition_start', 'condition_start_not'
    ];
  }

  private calculateContextualBlocks(context: ValidationContext): BlockType[] {
    const { characterStates, variables, semafori } = context;
    const contextual: BlockType[] = [];
    
    // Suggerisci Hide/Change solo per personaggi visibili
    const visibleCharacters = Array.from(characterStates.entries())
      .filter(([_, state]) => state.isShown);
    
    if (visibleCharacters.length > 0) {
      contextual.push('hide_character', 'change_character');
    }
    
    return contextual;
  }

  private getRequiredParameters(blockType: BlockType): string[] {
    const parameterMap: Record<BlockType, string[]> = {
      'dialogue': ['text'],
      'question': ['text'],
      'announce': ['text'],
      'show_character': ['character'],
      'hide_character': ['character'],
      'change_character': ['character', 'image'],
      'variable_set': ['variable'],
      'variable_reset': ['variable'],
      'variable_set_to': ['variable', 'value'],
      'dialog_start': [],
      'dialog_end': [],
      'menu_start': [],
      'menu_end': [],
      'condition_start': ['variable'],
      'condition_start_not': ['variable'],
      'condition_else': [],
      'condition_end': [],
      'unknown': []
    } as any;
    
    return parameterMap[blockType] || [];
  }

  private getBlocksAfterInSameBranch(
    allBlocks: FlowBlock[], 
    blockId: string, 
    branchContext: BranchValidationContext
  ): FlowBlock[] {
    // Implementazione semplificata
    const blockIndex = allBlocks.findIndex(b => b.id === blockId);
    return allBlocks.slice(blockIndex + 1).filter(block => 
      block.metadata.depth === branchContext.depth
    );
  }

  private isContainerBlock(blockType: BlockType): boolean {
    return [
      'dialog_start', 'dialog_end', 'menu_start', 'menu_end',
      'condition_start', 'condition_start_not', 'condition_else', 'condition_end'
    ].includes(blockType);
  }

  private findParentBranch(block: FlowBlock, allBlocks: FlowBlock[]): FlowBlock | undefined {
    // Trova il blocco parent che crea un branch
    return allBlocks.find(b => 
      (b.type === 'condition_start' || b.type === 'menu_start') &&
      b.children?.some(child => child.id === block.id)
    );
  }

  private getSiblingBlocks(block: FlowBlock, allBlocks: FlowBlock[]): FlowBlock[] {
    const parent = this.findParentBranch(block, allBlocks);
    if (!parent) {
      return allBlocks.filter(b => b.metadata.depth === block.metadata.depth);
    }
    
    return parent.children || [];
  }

  private findLastAskInBranch(block: FlowBlock, allBlocks: FlowBlock[]): string | undefined {
    const siblings = this.getSiblingBlocks(block, allBlocks);
    const blockIndex = siblings.findIndex(b => b.id === block.id);
    
    // Cerca l'ultimo Ask block prima del blocco corrente nello stesso branch
    for (let i = blockIndex - 1; i >= 0; i--) {
      if (siblings[i].type === 'question') {
        return siblings[i].id;
      }
    }
    
    return undefined;
  }
}
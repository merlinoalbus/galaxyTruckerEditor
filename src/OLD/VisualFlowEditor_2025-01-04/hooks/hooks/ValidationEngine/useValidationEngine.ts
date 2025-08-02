import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FlowBlock, 
  CharacterState, 
  BlockValidationResult,
  FlowValidationState,
  ValidationError,
  ValidationWarning
} from '../../../../../types/CampaignEditor';
import { ValidationEngineService } from '../../../../../services/CampaignEditor/VisualFlowEditor/services/ValidationEngine/validationEngineService';

export const useValidationEngine = (
  blocks: FlowBlock[],
  characterStates: Map<string, CharacterState>,
  variables: Map<string, any>,
  semafori: Set<string>
) => {
  const [validationState, setValidationState] = useState<FlowValidationState>({
    globalValid: true,
    blockValidations: new Map(),
    globalErrors: [],
    globalWarnings: []
  });

  const validationService = useMemo(() => ValidationEngineService.getInstance(), []);

  const validateAllBlocks = useCallback(() => {
    const blockValidations = new Map<string, BlockValidationResult>();
    const globalErrors: ValidationError[] = [];
    const globalWarnings: ValidationWarning[] = [];

    // Valida ogni blocco individualmente
    for (const block of blocks) {
      const validation = validationService.validateBlock(
        block,
        blocks,
        characterStates,
        variables,
        semafori
      );
      
      blockValidations.set(block.id, validation);
      
      // Aggrega errori e warning globali
      globalErrors.push(...validation.errors);
      globalWarnings.push(...validation.warnings);
    }

    // Valida la struttura globale del flow
    const structuralValidation = validateFlowStructure(blocks);
    globalErrors.push(...structuralValidation.errors);
    globalWarnings.push(...structuralValidation.warnings);

    const globalValid = globalErrors.length === 0;

    setValidationState({
      globalValid,
      blockValidations,
      globalErrors,
      globalWarnings
    });
  }, [blocks, characterStates, variables, semafori, validationService]);

  const validateFlowStructure = useCallback((blocks: FlowBlock[]) => {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Verifica bilanciamento container blocks
    const containerStack: { type: string; blockId: string }[] = [];
    
    for (const block of blocks) {
      switch (block.type) {
        case 'dialog_start':
          containerStack.push({ type: 'dialog', blockId: block.id });
          break;
        case 'dialog_end':
          if (containerStack.length === 0 || containerStack[containerStack.length - 1].type !== 'dialog') {
            errors.push({
              type: 'missing_parameter',
              message: 'Unmatched dialog_end block',
              blockId: block.id,
              severity: 'error'
            });
          } else {
            containerStack.pop();
          }
          break;
        case 'menu_start':
          containerStack.push({ type: 'menu', blockId: block.id });
          break;
        case 'menu_end':
          if (containerStack.length === 0 || containerStack[containerStack.length - 1].type !== 'menu') {
            errors.push({
              type: 'missing_parameter',
              message: 'Unmatched menu_end block',
              blockId: block.id,
              severity: 'error'
            });
          } else {
            containerStack.pop();
          }
          break;
        case 'condition_start':
        case 'condition_start_not':
          containerStack.push({ type: 'condition', blockId: block.id });
          break;
        case 'condition_end':
          if (containerStack.length === 0 || containerStack[containerStack.length - 1].type !== 'condition') {
            errors.push({
              type: 'missing_parameter',
              message: 'Unmatched condition_end block',
              blockId: block.id,
              severity: 'error'
            });
          } else {
            containerStack.pop();
          }
          break;
      }
    }

    // Verifica container non chiusi
    for (const unclosed of containerStack) {
      errors.push({
        type: 'missing_parameter',
        message: `Unclosed ${unclosed.type} container`,
        blockId: unclosed.blockId,
        severity: 'error'
      });
    }

    return { errors, warnings };
  }, []);

  const getBlockValidation = useCallback((blockId: string): BlockValidationResult | undefined => {
    return validationState.blockValidations.get(blockId);
  }, [validationState.blockValidations]);

  const getValidationSummary = useCallback(() => {
    const totalBlocks = blocks.length;
    const invalidBlocks = Array.from(validationState.blockValidations.values())
      .filter(validation => !validation.isValid).length;
    const totalErrors = validationState.globalErrors.length;
    const totalWarnings = validationState.globalWarnings.length;

    return {
      totalBlocks,
      validBlocks: totalBlocks - invalidBlocks,
      invalidBlocks,
      totalErrors,
      totalWarnings,
      isValid: validationState.globalValid
    };
  }, [blocks.length, validationState]);

  const getInsertableBlocks = useCallback((targetBlockId: string, position: 'before' | 'after' | 'inside'): string[] => {
    const validation = validationState.blockValidations.get(targetBlockId);
    if (!validation) return [];

    switch (position) {
      case 'after':
        return validation.canInsertAfter;
      case 'before':
        return validation.canInsertBefore;
      case 'inside':
        // Per 'inside', dobbiamo verificare se il blocco target è un container
        const targetBlock = blocks.find(b => b.id === targetBlockId);
        if (!targetBlock) return [];
        
        // Solo container blocks possono contenere altri blocchi
        const containerBlockTypes = ['dialog_start', 'menu_start', 'condition_start', 'condition_start_not'];
        if (!containerBlockTypes.includes(targetBlock.type)) {
          return []; // Non è un container, non può contenere blocchi
        }
        
        // Per container blocks, permettiamo la maggior parte dei blocchi base
        const allowedInsideBlocks = [
          'dialogue', 'question', 'announce', 'show_character', 
          'hide_character', 'change_character', 'variable_set', 
          'variable_reset', 'variable_set_to'
        ];
        
        // Per menu containers, aggiungiamo anche le opzioni del menu
        if (targetBlock.type === 'menu_start') {
          allowedInsideBlocks.push('menu_option', 'menu_option_conditional');
        }
        
        return allowedInsideBlocks;
      default:
        return [];
    }
  }, [validationState.blockValidations, blocks]);

  const getContextualBlocks = useCallback((blockId: string): string[] => {
    const validation = validationState.blockValidations.get(blockId);
    return validation?.contextualBlocks || [];
  }, [validationState.blockValidations]);

  const isBlockValid = useCallback((blockId: string): boolean => {
    const validation = validationState.blockValidations.get(blockId);
    return validation?.isValid ?? false;
  }, [validationState.blockValidations]);

  const getBlockErrors = useCallback((blockId: string): ValidationError[] => {
    const validation = validationState.blockValidations.get(blockId);
    return validation?.errors || [];
  }, [validationState.blockValidations]);

  const getBlockWarnings = useCallback((blockId: string): ValidationWarning[] => {
    const validation = validationState.blockValidations.get(blockId);
    return validation?.warnings || [];
  }, [validationState.blockValidations]);

  // Trigger validation when dependencies change
  useEffect(() => {
    validateAllBlocks();
  }, [validateAllBlocks]);

  return {
    validationState,
    validateAllBlocks,
    getBlockValidation,
    getValidationSummary,
    getInsertableBlocks,
    getContextualBlocks,
    isBlockValid,
    getBlockErrors,
    getBlockWarnings
  };
};
import { ValidationError } from '../FlowBlock/FlowBlock.types';

export interface FlowValidation {
  isValid: boolean;
  globalErrors: ValidationError[];
  blockErrors: Record<string, ValidationError[]>;
  warnings: ValidationError[];
  flowRules: FlowRule[];
}

export interface FlowRule {
  id: string;
  name: string;
  description: string;
  validator: FlowRuleValidator;
  severity: 'error' | 'warning' | 'info';
  isActive: boolean;
}

export type FlowRuleValidator = (context: FlowValidationContext) => ValidationResult;

export interface FlowValidationContext {
  blocks: any[];
  currentBlock: any;
  previousBlocks: any[];
  nextBlocks: any[];
  characterStates: Record<string, any>;
  variables: Record<string, any>;
  labels: Set<string>;
  menuDepth: number;
  conditionalDepth: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions?: string[];
}

export interface FlowConstraint {
  type: 'sequence' | 'dependency' | 'mutual_exclusion' | 'conditional';
  blocks: string[];
  condition?: string;
  message: string;
}

export interface FlowIntegrity {
  hasUnreachableBlocks: boolean;
  hasDeadEnds: boolean;
  hasCircularReferences: boolean;
  missingLabels: string[];
  unreferencedLabels: string[];
  invalidJumps: string[];
}
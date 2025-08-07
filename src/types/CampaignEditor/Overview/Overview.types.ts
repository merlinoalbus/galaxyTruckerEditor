// Overview Types - Struttura completa secondo specifiche

export interface LanguageCoverage {
  language: string;
  totalScripts: number;
  translatedScripts: number;
  coveragePercentage: number;
  missingScripts: string[];
  gapAnalysis: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
}

export interface ScriptComplexity {
  scriptName: string;
  fileName: string;
  commandCount: number;
  variableCount: number;
  semaphoreCount: number;
  labelCount: number;
  subScriptCount: number;
  complexityScore: number;
  complexityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface DependencyChain {
  from: string;
  to: string;
  chainLength: number;
  isCyclic: boolean;
}

export interface QualityIssue {
  id: string;
  type: 'no-comments' | 'unused-variable' | 'unused-semaphore' | 
        'orphan-label' | 'unused-character' | 'orphan-script' | 
        'circular-dependency' | 'mono-state-semaphore' |
        'oversized-script' | 'too-many-variables';
  severity: 'low' | 'medium' | 'high' | 'critical';
  elementName?: string;
  scriptName?: string;
  lineNumber?: number;
  description: string;
  suggestion?: string;
}

export interface MaintenanceMetrics {
  modularityIndex: number;
  couplingScore: number;
  cohesionScore: number;
  technicalDebtScore: number;
  averageScriptSize: number;
  largestScript: { name: string; size: number };
  smallestScript: { name: string; size: number };
  scriptSizeDistribution: {
    tiny: number;    // <50 lines
    small: number;   // 50-100
    medium: number;  // 100-200
    large: number;   // 200-500
    huge: number;    // >500
  };
}

export interface CommandUsage {
  command: string;
  frequency: number;
  percentage: number;
  scripts: string[];
  averagePerScript: number;
}

export interface PatternOccurrence {
  pattern: string[];
  frequency: number;
  scripts: string[];
  confidence: number;
}

export interface VariableUsage {
  name: string;
  type: 'numeric' | 'boolean' | 'mixed';
  setCount: number;
  readCount: number;
  modifyCount: number;
  totalUsage: number;
  scripts: string[];
  isHot: boolean;
  isUnused: boolean;
}

export interface SemaphoreUsage {
  name: string;
  setCount: number;
  resetCount: number;
  ifCount: number;
  ifNotCount: number;
  totalChecks: number;
  scripts: string[];
  isCritical: boolean;
  isMonoState: boolean;
  mostCommonState: 'set' | 'reset' | 'balanced';
}

export interface RefactoringRecommendation {
  id: string;
  scriptName: string;
  type: 'split' | 'merge' | 'extract' | 'simplify' | 'remove';
  reason: string;
  complexity: number;
  estimatedEffort: 'low' | 'medium' | 'high';
  suggestedActions: string[];
  priority: 'low' | 'medium' | 'high';
  potentialImpact: {
    maintainability: number;
    performance: number;
    readability: number;
  };
}

export interface TemporalAnalysis {
  lastModifiedScripts: Array<{
    name: string;
    lastModified?: Date;
    changeFrequency: number;
  }>;
  stableScripts: string[];
  volatileScripts: string[];
  growthRate: number;
}

export interface OverviewStatistics {
  // Copertura Linguistica Dettagliata
  languageCoverage: LanguageCoverage[];
  overallCoverage: number;
  criticalGaps: number;
  
  // Analisi Complessità Avanzata
  topComplexScripts: ScriptComplexity[];
  orphanScripts: string[];
  dependencyChains: DependencyChain[];
  circularDependencies: string[][];
  hotspots: string[];
  
  // Analisi Qualità Codice
  qualityIssues: QualityIssue[];
  qualityScore: number;
  issuesByType: Map<string, number>;
  issuesBySeverity: Map<string, number>;
  
  // Metriche di Manutenibilità
  maintenanceMetrics: MaintenanceMetrics;
  
  // Pattern di Utilizzo
  topCommands: CommandUsage[];
  recurringPatterns: PatternOccurrence[];
  hotVariables: VariableUsage[];
  criticalSemaphores: SemaphoreUsage[];
  
  // Analisi Temporale
  temporalAnalysis?: TemporalAnalysis;
  
  // Suggerimenti e Warning
  refactoringRecommendations: RefactoringRecommendation[];
  warnings: string[];
  optimizations: string[];
  
  // Statistiche di Base
  totalScripts: number;
  totalCommands: number;
  totalVariables: number;
  totalSemaphores: number;
  totalLabels: number;
  totalCharacters: number;
  totalMissions: number;
  averageCommandsPerScript: number;
  maxCommandsInScript: number;
  minCommandsInScript: number;
  scriptWithMostCommands: string;
  scriptWithLeastCommands: string;
}
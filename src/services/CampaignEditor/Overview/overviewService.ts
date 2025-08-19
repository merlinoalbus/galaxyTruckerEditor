// Overview Service - Coordinatore services

import type { CampaignAnalysis } from '@/types/CampaignEditor';
import type { 
  OverviewStatistics,
  QualityIssue,
  MaintenanceMetrics 
} from '@/types/CampaignEditor/Overview/Overview.types';

import { languageCoverageService } from './services/LanguageCoverageService/languageCoverageService';
import { complexityAnalysisService } from './services/ComplexityAnalysisService/complexityAnalysisService';
import { qualityAnalysisService } from './services/QualityAnalysisService/qualityAnalysisService';
import { maintenanceMetricsService } from './services/MaintenanceMetricsService/maintenanceMetricsService';
import { usagePatternsService } from './services/UsagePatternsService/usagePatternsService';
import { refactoringService } from './services/RefactoringService/refactoringService';

export const overviewService = {
  generateStatistics(analysis: CampaignAnalysis): OverviewStatistics {
    // Analisi copertura linguistica
    const languageCoverage = languageCoverageService.calculateCoverage(analysis);
    const overallCoverage = languageCoverageService.calculateOverallCoverage(languageCoverage);
    const criticalGaps = languageCoverageService.countCriticalGaps(languageCoverage);
    
    // Analisi complessità
    const topComplexScripts = complexityAnalysisService.analyzeComplexity(analysis).slice(0, 10);
    const orphanScripts = complexityAnalysisService.findOrphanScripts(analysis);
    const dependencyChains = complexityAnalysisService.analyzeDependencyChains(analysis).slice(0, 20);
    const circularDependencies = complexityAnalysisService.findCircularDependencies(analysis);
    const hotspots = complexityAnalysisService.identifyHotspots(analysis);
    
    // Analisi qualità
    const qualityIssues = qualityAnalysisService.analyzeQuality(analysis);
    const qualityScore = qualityAnalysisService.calculateQualityScore(qualityIssues);
    const issuesByType = this.groupIssuesByType(qualityIssues);
    const issuesBySeverity = this.groupIssuesBySeverity(qualityIssues);
    
    // Metriche manutenibilità
    const maintenanceMetrics = maintenanceMetricsService.calculateMetrics(analysis);
    
    // Pattern di utilizzo
    const topCommands = usagePatternsService.analyzeCommandUsage(analysis);
    const recurringPatterns = usagePatternsService.findRecurringPatterns(analysis);
    const hotVariables = usagePatternsService.analyzeVariableUsage(analysis)
      .filter(v => v.isHot);
    const criticalSemaphores = usagePatternsService.analyzeSemaphoreUsage(analysis)
      .filter(s => s.isCritical);
    
    // Suggerimenti refactoring
    const refactoringRecommendations = refactoringService.generateRecommendations(analysis);
    
    // Genera warnings e ottimizzazioni
    const warnings = this.generateWarnings(analysis, qualityIssues);
    const optimizations = this.generateOptimizations(analysis, maintenanceMetrics);
    
    // Calcola statistiche base
    const baseStats = this.calculateBaseStatistics(analysis);
    
    return {
      // Copertura linguistica
      languageCoverage,
      overallCoverage,
      criticalGaps,
      
      // Analisi complessità
      topComplexScripts,
      orphanScripts,
      dependencyChains,
      circularDependencies,
      hotspots,
      
      // Qualità codice
      qualityIssues,
      qualityScore,
      issuesByType,
      issuesBySeverity,
      
      // Manutenibilità
      maintenanceMetrics,
      
      // Pattern utilizzo
      topCommands,
      recurringPatterns,
      hotVariables,
      criticalSemaphores,
      
      // Suggerimenti
      refactoringRecommendations,
      warnings,
      optimizations,
      
      // Statistiche base
      ...baseStats
    };
  },
  
  calculateBaseStatistics(analysis: CampaignAnalysis) {
    const totalCommands = analysis.scripts.reduce(
      (sum, script) => sum + (script.commands?.length || 0), 
      0
    );
    
    const commandCounts = analysis.scripts.map(s => s.commands?.length || 0);
    const maxCommands = Math.max(...commandCounts, 0);
    const minCommands = Math.min(...commandCounts.filter(c => c > 0), 0);
    
    const scriptWithMost = analysis.scripts.find(
      s => (s.commands?.length || 0) === maxCommands
    );
    
    const scriptWithLeast = analysis.scripts.find(
      s => (s.commands?.length || 0) === minCommands && s.commands?.length > 0
    );
    
    return {
      totalScripts: analysis.scripts.length,
      totalCommands,
      totalVariables: analysis.variables.size,
      totalSemaphores: analysis.semafori.size,
      totalLabels: analysis.labels.size,
      totalCharacters: analysis.characters.size,
      totalMissions: analysis.missions.size,
      averageCommandsPerScript: Math.round(totalCommands / Math.max(analysis.scripts.length, 1)),
      maxCommandsInScript: maxCommands,
      minCommandsInScript: minCommands,
      scriptWithMostCommands: scriptWithMost?.name || '',
      scriptWithLeastCommands: scriptWithLeast?.name || ''
    };
  },
  
  groupIssuesByType(issues: QualityIssue[]): Map<string, number> {
    const byType = new Map<string, number>();
    
    issues.forEach(issue => {
      byType.set(issue.type, (byType.get(issue.type) || 0) + 1);
    });
    
    return byType;
  },
  
  groupIssuesBySeverity(issues: QualityIssue[]): Map<string, number> {
    const bySeverity = new Map<string, number>();
    
    issues.forEach(issue => {
      bySeverity.set(issue.severity, (bySeverity.get(issue.severity) || 0) + 1);
    });
    
    return bySeverity;
  },
  
  generateWarnings(analysis: CampaignAnalysis, issues: QualityIssue[]): Array<{key: string, params: Record<string, any>}> {
    const warnings: Array<{key: string, params: Record<string, any>}> = [];
    
    // Warning per problemi critici
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      warnings.push({
        key: 'overview.warnings.criticalIssues',
        params: { count: criticalIssues.length }
      });
    }
    
    // Warning per script troppo grandi
    const hugeScripts = analysis.scripts.filter(
      s => (s.commands?.length || 0) > 500
    );
    if (hugeScripts.length > 0) {
      warnings.push({
        key: 'overview.warnings.hugeScripts',
        params: { count: hugeScripts.length }
      });
    }
    
    // Warning per dipendenze circolari
    const circularCount = complexityAnalysisService.findCircularDependencies(analysis).length;
    if (circularCount > 0) {
      warnings.push({
        key: 'overview.warnings.circularDependencies',
        params: { count: circularCount }
      });
    }
    
    // Warning per copertura linguistica bassa
    const lowCoverage = languageCoverageService.calculateCoverage(analysis)
      .filter(lang => lang.coveragePercentage < 50 && lang.language !== 'IT');
    if (lowCoverage.length > 0) {
      warnings.push({
        key: 'overview.warnings.lowCoverage',
        params: { count: lowCoverage.length }
      });
    }
    
    return warnings.slice(0, 10);
  },
  
  generateOptimizations(analysis: CampaignAnalysis, metrics: MaintenanceMetrics): string[] {
    const optimizations: string[] = [];
    
    // Ottimizzazione modularità
    if (metrics.modularityIndex < 50) {
      optimizations.push('overview.optimizations.improveModularity');
    }
    
    // Ottimizzazione accoppiamento
    if (metrics.couplingScore < 50) {
      optimizations.push('overview.optimizations.reduceCoupling');
    }
    
    // Ottimizzazione coesione
    if (metrics.cohesionScore < 50) {
      optimizations.push('overview.optimizations.improveCohesion');
    }
    
    // Ottimizzazione debito tecnico
    if (metrics.technicalDebtScore > 50) {
      optimizations.push('overview.optimizations.reduceTechnicalDebt');
    }
    
    // Ottimizzazione distribuzione dimensioni
    if (metrics.scriptSizeDistribution.huge > 5) {
      optimizations.push('overview.optimizations.refactorHugeScripts');
    }
    
    if (metrics.scriptSizeDistribution.tiny > analysis.scripts.length * 0.5) {
      optimizations.push('overview.optimizations.mergeSmallScripts');
    }
    
    return optimizations.slice(0, 10);
  }
};
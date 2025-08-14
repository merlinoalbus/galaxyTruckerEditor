// Maintenance Metrics Service - Metriche di manutenibilità

import type { CampaignAnalysis, ParsedScript } from '@/types/CampaignEditor';
import type { MaintenanceMetrics } from '@/types/CampaignEditor/Overview/Overview.types';
import { MAINTENANCE_CONSTANTS } from '@/constants/Overview.constants';

export const maintenanceMetricsService = {
  calculateMetrics(analysis: CampaignAnalysis): MaintenanceMetrics {
    const scriptSizes = this.calculateScriptSizes(analysis.scripts);
    const { largest, smallest } = this.findExtremeScripts(scriptSizes);
    const distribution = this.calculateSizeDistribution(scriptSizes);
    
    return {
      modularityIndex: this.calculateModularity(analysis),
      couplingScore: this.calculateCoupling(analysis),
      cohesionScore: this.calculateCohesion(analysis),
      technicalDebtScore: this.calculateTechnicalDebt(analysis),
      averageScriptSize: this.calculateAverageSize(scriptSizes),
      largestScript: largest,
      smallestScript: smallest,
      scriptSizeDistribution: distribution
    };
  },
  
  calculateScriptSizes(scripts: ParsedScript[]): Map<string, number> {
    const sizes = new Map<string, number>();
    
    scripts.forEach(script => {
      // Usa numero_comandi dal backend se disponibile, altrimenti commands.length
      const size = script.backendData?.numero_comandi || script.commands?.length || 0;
      sizes.set(script.name, size);
    });
    
    return sizes;
  },
  
  findExtremeScripts(sizes: Map<string, number>): {
    largest: { name: string; size: number };
    smallest: { name: string; size: number };
  } {
    let largest = { name: '', size: 0 };
    let smallest = { name: '', size: Infinity };
    
    sizes.forEach((size, name) => {
      if (size > largest.size) {
        largest = { name, size };
      }
      if (size < smallest.size && size > 0) {
        smallest = { name, size };
      }
    });
    
    if (smallest.size === Infinity) {
      smallest = { name: '', size: 0 };
    }
    
    return { largest, smallest };
  },
  
  calculateSizeDistribution(sizes: Map<string, number>): {
    tiny: number;
    small: number;
    medium: number;
    large: number;
    huge: number;
  } {
    const distribution = {
      tiny: 0,    // <50 lines
      small: 0,   // 50-100
      medium: 0,  // 100-200
      large: 0,   // 200-500
      huge: 0     // >500
    };
    
    sizes.forEach(size => {
      if (size < MAINTENANCE_CONSTANTS.TINY_THRESHOLD) distribution.tiny++;
      else if (size < MAINTENANCE_CONSTANTS.SMALL_THRESHOLD) distribution.small++;
      else if (size < MAINTENANCE_CONSTANTS.MEDIUM_THRESHOLD) distribution.medium++;
      else if (size < MAINTENANCE_CONSTANTS.HUGE_THRESHOLD) distribution.large++;
      else distribution.huge++;
    });
    
    return distribution;
  },
  
  calculateAverageSize(sizes: Map<string, number>): number {
    if (sizes.size === 0) return 0;
    
    const total = Array.from(sizes.values()).reduce((sum, size) => sum + size, 0);
    return Math.round(total / sizes.size);
  },
  
  calculateModularity(analysis: CampaignAnalysis): number {
    const scriptCount = analysis.scripts.length;
    if (scriptCount === 0) return 0;
    
    // Calcola modularità basata su dimensioni script e riuso
    const avgScriptSize = analysis.scripts.reduce((sum, script) => {
      return sum + (script.backendData?.numero_comandi || script.commands?.length || 0);
    }, 0) / scriptCount;
    
    const avgSubScripts = analysis.scripts.reduce(
      (sum, script) => sum + (script.subScripts?.length || 0),
      0
    ) / scriptCount;
    
    // Buona modularità: script medi con alcune dipendenze
    let sizeScore: number = MAINTENANCE_CONSTANTS.SCORE_MAX;
    if (avgScriptSize < MAINTENANCE_CONSTANTS.MIN_SCRIPT_SIZE) sizeScore = MAINTENANCE_CONSTANTS.SCORE_TINY; // Script troppo piccoli
    else if (avgScriptSize > MAINTENANCE_CONSTANTS.LARGE_THRESHOLD) sizeScore = MAINTENANCE_CONSTANTS.SCORE_LARGE; // Script troppo grandi
    else if (avgScriptSize >= MAINTENANCE_CONSTANTS.TINY_THRESHOLD && avgScriptSize <= MAINTENANCE_CONSTANTS.MEDIUM_THRESHOLD) sizeScore = MAINTENANCE_CONSTANTS.SCORE_OPTIMAL; // Dimensione ottimale
    
    let dependencyScore = Math.max(0, MAINTENANCE_CONSTANTS.SCORE_MAX - Math.abs(avgSubScripts - MAINTENANCE_CONSTANTS.OPTIMAL_DEPENDENCIES) * MAINTENANCE_CONSTANTS.DEPENDENCY_PENALTY);
    
    return Math.round((sizeScore + dependencyScore) / 2);
  },
  
  calculateCoupling(analysis: CampaignAnalysis): number {
    const scriptCount = analysis.scripts.length;
    if (scriptCount === 0) return MAINTENANCE_CONSTANTS.SCORE_MAX;
    
    // Calcola accoppiamento basato su script richiamati e utilizzo
    const totalSubScripts = analysis.scripts.reduce(
      (sum, script) => sum + (script.subScripts?.length || 0), 0
    );
    
    const totalVariablesUsed = analysis.scripts.reduce(
      (sum, script) => sum + (script.variables?.length || 0), 0
    );
    
    const avgSubScriptsPerScript = totalSubScripts / scriptCount;
    const avgVariablesPerScript = totalVariablesUsed / scriptCount;
    
    // Calcola score basato su interdipendenze
    let couplingScore: number = MAINTENANCE_CONSTANTS.SCORE_MAX;
    
    // Penalizza troppi sub-script (alto accoppiamento)
    if (avgSubScriptsPerScript > MAINTENANCE_CONSTANTS.DUPLICATION_HIGH) couplingScore -= MAINTENANCE_CONSTANTS.DUPLICATION_PENALTY_HIGH;
    else if (avgSubScriptsPerScript > MAINTENANCE_CONSTANTS.DUPLICATION_MEDIUM) couplingScore -= MAINTENANCE_CONSTANTS.DUPLICATION_PENALTY_MEDIUM;
    else if (avgSubScriptsPerScript > MAINTENANCE_CONSTANTS.COMPLEXITY_FACTOR_MEDIUM) couplingScore -= MAINTENANCE_CONSTANTS.DUPLICATION_PERCENT_FACTOR;
    
    // Penalizza troppe variabili condivise
    if (avgVariablesPerScript > MAINTENANCE_CONSTANTS.MIN_SCRIPT_SIZE) couplingScore -= MAINTENANCE_CONSTANTS.COUPLING_PENALTY;
    else if (avgVariablesPerScript > MAINTENANCE_CONSTANTS.DUPLICATION_PERCENT_FACTOR) couplingScore -= MAINTENANCE_CONSTANTS.DUPLICATION_PERCENT_FACTOR;
    
    return Math.max(MAINTENANCE_CONSTANTS.DUPLICATION_PERCENT_FACTOR, couplingScore);
  },
  
  calculateCohesion(analysis: CampaignAnalysis): number {
    const scriptCount = analysis.scripts.length;
    if (scriptCount === 0) return 0;
    
    // Identifica gruppi logici di script
    const scriptGroups = this.identifyScriptGroups(analysis);
    const groupCount = scriptGroups.size;
    
    // Calcola distribuzione dimensioni gruppi
    const groupSizes = Array.from(scriptGroups.values()).map(scripts => scripts.length);
    const avgGroupSize = groupSizes.reduce((sum, size) => sum + size, 0) / groupCount;
    
    // Buona coesione: gruppi di dimensione ragionevole (3-15 script)
    let sizeScore: number = MAINTENANCE_CONSTANTS.SCORE_MAX;
    if (avgGroupSize < MAINTENANCE_CONSTANTS.OPTIMAL_DEPENDENCIES) sizeScore = MAINTENANCE_CONSTANTS.SCORE_LARGE; // Gruppi troppo piccoli
    else if (avgGroupSize > MAINTENANCE_CONSTANTS.MIN_SCRIPT_SIZE) sizeScore = MAINTENANCE_CONSTANTS.SCORE_TINY; // Gruppi troppo grandi
    else if (avgGroupSize >= MAINTENANCE_CONSTANTS.COMPLEXITY_FACTOR_MEDIUM && avgGroupSize <= MAINTENANCE_CONSTANTS.COMPLEXITY_SCORE_DIVISOR) sizeScore = MAINTENANCE_CONSTANTS.SCORE_OPTIMAL; // Dimensione ottimale
    
    // Penalizza se tutti gli script sono in un unico gruppo o tutti separati
    let distributionScore: number = MAINTENANCE_CONSTANTS.SCORE_MAX;
    if (groupCount === MAINTENANCE_CONSTANTS.COMPLEXITY_FACTOR_LOW && scriptCount > MAINTENANCE_CONSTANTS.DUPLICATION_PERCENT_FACTOR) distributionScore = MAINTENANCE_CONSTANTS.COUPLING_PENALTY; // Tutto insieme
    if (groupCount === scriptCount && scriptCount > MAINTENANCE_CONSTANTS.COMPLEXITY_FACTOR_HIGH) distributionScore = MAINTENANCE_CONSTANTS.SCORE_LARGE; // Tutto separato
    
    return Math.round((sizeScore + distributionScore) / 2);
  },
  
  identifyScriptGroups(analysis: CampaignAnalysis): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    const patterns = ['mission', 'quest', 'dialog', 'menu', 'combat', 'shop'];
    
    analysis.scripts.forEach(script => {
      const scriptNameLower = script.name.toLowerCase();
      
      for (const pattern of patterns) {
        if (scriptNameLower.includes(pattern)) {
          if (!groups.has(pattern)) {
            groups.set(pattern, []);
          }
          groups.get(pattern)!.push(script.name);
          break;
        }
      }
    });
    
    return groups;
  },
  
  calculateTechnicalDebt(analysis: CampaignAnalysis): number {
    let debtScore = 0;
    
    // Script troppo grandi (usa dati backend)
    const oversizedScripts = analysis.scripts.filter(script => {
      const size = script.backendData?.numero_comandi || script.commands?.length || 0;
      return size > MAINTENANCE_CONSTANTS.HUGE_THRESHOLD;
    });
    debtScore += oversizedScripts.length * MAINTENANCE_CONSTANTS.DUPLICATION_PERCENT_FACTOR;
    
    // Script con troppe variabili
    const complexVariableScripts = analysis.scripts.filter(
      script => (script.variables?.length || 0) > MAINTENANCE_CONSTANTS.MIN_SCRIPT_SIZE
    );
    debtScore += complexVariableScripts.length * MAINTENANCE_CONSTANTS.DUPLICATION_HIGH;
    
    // Script con troppi sottoscript (alta complessità)
    const highCouplingScripts = analysis.scripts.filter(
      script => (script.subScripts?.length || 0) > MAINTENANCE_CONSTANTS.DUPLICATION_PERCENT_FACTOR
    );
    debtScore += highCouplingScripts.length * MAINTENANCE_CONSTANTS.COMPLEXITY_SCORE_DIVISOR;
    
    // Variabili globali eccessive
    const globalVarCount = analysis.variables.size;
    if (globalVarCount > MAINTENANCE_CONSTANTS.SCORE_MAX) debtScore += MAINTENANCE_CONSTANTS.COUPLING_PENALTY;
    else if (globalVarCount > MAINTENANCE_CONSTANTS.TINY_THRESHOLD) debtScore += MAINTENANCE_CONSTANTS.DUPLICATION_PERCENT_FACTOR;
    
    // Semafori eccessivi
    const semaphoreCount = analysis.semafori.size;
    if (semaphoreCount > MAINTENANCE_CONSTANTS.TINY_THRESHOLD) debtScore += MAINTENANCE_CONSTANTS.COMPLEXITY_SCORE_DIVISOR + MAINTENANCE_CONSTANTS.OPTIMAL_DEPENDENCIES + MAINTENANCE_CONSTANTS.COMPLEXITY_FACTOR_LOW;
    else if (semaphoreCount > MAINTENANCE_CONSTANTS.MIN_SCRIPT_SIZE + MAINTENANCE_CONSTANTS.COMPLEXITY_FACTOR_HIGH) debtScore += MAINTENANCE_CONSTANTS.DUPLICATION_HIGH - MAINTENANCE_CONSTANTS.COMPLEXITY_FACTOR_LOW;
    
    // Dipendenze circolari
    const circularDeps = this.countCircularDependencies(analysis);
    debtScore += circularDeps * MAINTENANCE_CONSTANTS.DEPENDENCY_PENALTY;
    
    return Math.min(MAINTENANCE_CONSTANTS.SCORE_MAX, debtScore);
  },
  
  
  countCircularDependencies(analysis: CampaignAnalysis): number {
    let count = 0;
    const visited = new Set<string>();
    
    const hasCycle = (current: string, path: Set<string>): boolean => {
      if (path.has(current)) return true;
      if (visited.has(current)) return false;
      
      path.add(current);
      const targets = analysis.scriptConnections.get(current) || [];
      
      for (const target of targets) {
        if (hasCycle(target, new Set(path))) {
          count++;
          return true;
        }
      }
      
      visited.add(current);
      return false;
    };
    
    analysis.scripts.forEach(script => {
      if (!visited.has(script.name)) {
        hasCycle(script.name, new Set());
      }
    });
    
    return Math.min(count, MAINTENANCE_CONSTANTS.DUPLICATION_PERCENT_FACTOR); // Limita per evitare overflow
  }
};
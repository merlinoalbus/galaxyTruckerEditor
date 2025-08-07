// Maintenance Metrics Service - Metriche di manutenibilità

import type { CampaignAnalysis, ParsedScript } from '@/types/CampaignEditor';
import type { MaintenanceMetrics } from '@/types/CampaignEditor/Overview/Overview.types';

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
      if (size < 50) distribution.tiny++;
      else if (size < 100) distribution.small++;
      else if (size < 200) distribution.medium++;
      else if (size < 500) distribution.large++;
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
    
    // Buona modularità: script medi (50-200 comandi) con alcune dipendenze
    let sizeScore = 100;
    if (avgScriptSize < 20) sizeScore = 40; // Script troppo piccoli
    else if (avgScriptSize > 300) sizeScore = 30; // Script troppo grandi
    else if (avgScriptSize >= 50 && avgScriptSize <= 200) sizeScore = 90; // Dimensione ottimale
    
    let dependencyScore = Math.max(0, 100 - Math.abs(avgSubScripts - 2) * 20);
    
    return Math.round((sizeScore + dependencyScore) / 2);
  },
  
  calculateCoupling(analysis: CampaignAnalysis): number {
    const scriptCount = analysis.scripts.length;
    if (scriptCount === 0) return 100;
    
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
    let couplingScore = 100;
    
    // Penalizza troppi sub-script (alto accoppiamento)
    if (avgSubScriptsPerScript > 8) couplingScore -= 30;
    else if (avgSubScriptsPerScript > 5) couplingScore -= 20;
    else if (avgSubScriptsPerScript > 3) couplingScore -= 10;
    
    // Penalizza troppe variabili condivise
    if (avgVariablesPerScript > 20) couplingScore -= 20;
    else if (avgVariablesPerScript > 10) couplingScore -= 10;
    
    return Math.max(10, couplingScore);
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
    let sizeScore = 100;
    if (avgGroupSize < 2) sizeScore = 30; // Gruppi troppo piccoli
    else if (avgGroupSize > 20) sizeScore = 40; // Gruppi troppo grandi
    else if (avgGroupSize >= 3 && avgGroupSize <= 12) sizeScore = 90; // Dimensione ottimale
    
    // Penalizza se tutti gli script sono in un unico gruppo o tutti separati
    let distributionScore = 100;
    if (groupCount === 1 && scriptCount > 10) distributionScore = 20; // Tutto insieme
    if (groupCount === scriptCount && scriptCount > 5) distributionScore = 30; // Tutto separato
    
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
      return size > 500;
    });
    debtScore += oversizedScripts.length * 10;
    
    // Script con troppe variabili
    const complexVariableScripts = analysis.scripts.filter(
      script => (script.variables?.length || 0) > 20
    );
    debtScore += complexVariableScripts.length * 8;
    
    // Script con troppi sottoscript (alta complessità)
    const highCouplingScripts = analysis.scripts.filter(
      script => (script.subScripts?.length || 0) > 10
    );
    debtScore += highCouplingScripts.length * 12;
    
    // Variabili globali eccessive
    const globalVarCount = analysis.variables.size;
    if (globalVarCount > 100) debtScore += 20;
    else if (globalVarCount > 50) debtScore += 10;
    
    // Semafori eccessivi
    const semaphoreCount = analysis.semafori.size;
    if (semaphoreCount > 50) debtScore += 15;
    else if (semaphoreCount > 25) debtScore += 7;
    
    // Dipendenze circolari
    const circularDeps = this.countCircularDependencies(analysis);
    debtScore += circularDeps * 20;
    
    return Math.min(100, debtScore);
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
    
    return Math.min(count, 10); // Limita a 10 per evitare overflow
  }
};
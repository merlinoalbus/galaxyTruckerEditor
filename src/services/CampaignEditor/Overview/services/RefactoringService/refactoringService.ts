// Refactoring Service - Suggerimenti di refactoring

import type { CampaignAnalysis, ParsedScript } from '@/types/CampaignEditor';
import type { RefactoringRecommendation } from '@/types/CampaignEditor/Overview/Overview.types';
import { REFACTORING_CONSTANTS, MAINTENANCE_CONSTANTS } from '@/constants/Overview.constants';

export const refactoringService = {
  generateRecommendations(analysis: CampaignAnalysis): RefactoringRecommendation[] {
    const recommendations: RefactoringRecommendation[] = [];
    let idCounter = 0;
    
    // Analizza script troppo grandi (usa dati backend)
    const oversizedScripts = this.findOversizedScripts(analysis.scripts);
    oversizedScripts.forEach(script => {
      const commandCount = script.backendData?.numero_comandi || script.commands?.length || 0;
      recommendations.push({
        id: `ref-${++idCounter}`,
        scriptName: script.name,
        type: 'split',
        reasonKey: 'overview.refactoring.oversizedScript',
        reasonParams: { commandCount, limit: REFACTORING_CONSTANTS.MIN_COMPLEXITY },
        complexity: commandCount,
        estimatedEffort: this.estimateEffort(commandCount),
        suggestedActionsKey: 'overview.refactoring.splitActions',
        priority: 'high',
        potentialImpact: {
          maintainability: MAINTENANCE_CONSTANTS.SCORE_MAX - MAINTENANCE_CONSTANTS.MIN_SCRIPT_SIZE,
          performance: MAINTENANCE_CONSTANTS.SCORE_LARGE,
          readability: MAINTENANCE_CONSTANTS.SCORE_OPTIMAL
        }
      });
    });
    
    // Analizza script troppo piccoli correlati
    const mergeableSets = this.findMergeableScripts(analysis);
    mergeableSets.forEach(set => {
      recommendations.push({
        id: `ref-${++idCounter}`,
        scriptName: set.join(', '),
        type: 'merge',
        reasonKey: 'overview.refactoring.smallRelatedScripts',
        reasonParams: { threshold: MAINTENANCE_CONSTANTS.MIN_SCRIPT_SIZE },
        complexity: MAINTENANCE_CONSTANTS.MIN_SCRIPT_SIZE,
        estimatedEffort: 'low',
        suggestedActionsKey: 'overview.refactoring.mergeActions',
        suggestedActionsParams: { scripts: set.join(' e ') },
        priority: 'low',
        potentialImpact: {
          maintainability: MAINTENANCE_CONSTANTS.SCORE_TINY,
          performance: MAINTENANCE_CONSTANTS.MIN_SCRIPT_SIZE,
          readability: MAINTENANCE_CONSTANTS.SCORE_LARGE
        }
      });
    });
    
    // Analizza codice duplicato
    const duplicatedCode = this.findDuplicatedPatterns(analysis);
    duplicatedCode.forEach(pattern => {
      recommendations.push({
        id: `ref-${++idCounter}`,
        scriptName: pattern.scripts.join(', '),
        type: 'extract',
        reasonKey: 'overview.refactoring.duplicatedPattern',
        reasonParams: { length: pattern.commands.length, occurrences: pattern.occurrences },
        complexity: pattern.commands.length * pattern.occurrences,
        estimatedEffort: 'medium',
        suggestedActionsKey: 'overview.refactoring.extractActions',
        priority: pattern.occurrences > MAINTENANCE_CONSTANTS.COMPLEXITY_FACTOR_HIGH ? 'high' : 'medium',
        potentialImpact: {
          maintainability: MAINTENANCE_CONSTANTS.SCORE_MAX - MAINTENANCE_CONSTANTS.SCORE_LARGE,
          performance: MAINTENANCE_CONSTANTS.DUPLICATION_PERCENT_FACTOR,
          readability: MAINTENANCE_CONSTANTS.SCORE_SMALL
        }
      });
    });
    
    // Analizza script complessi
    const complexScripts = this.findComplexScripts(analysis);
    complexScripts.forEach(script => {
      recommendations.push({
        id: `ref-${++idCounter}`,
        scriptName: script.name,
        type: 'simplify',
        reasonKey: 'overview.refactoring.highComplexity',
        reasonParams: { complexity: script.complexity },
        complexity: script.complexity,
        estimatedEffort: 'high',
        suggestedActionsKey: 'overview.refactoring.simplifyActions',
        priority: 'medium',
        potentialImpact: {
          maintainability: MAINTENANCE_CONSTANTS.SCORE_SMALL,
          performance: MAINTENANCE_CONSTANTS.SCORE_TINY,
          readability: MAINTENANCE_CONSTANTS.SCORE_MAX - MAINTENANCE_CONSTANTS.MIN_SCRIPT_SIZE
        }
      });
    });
    
    // Analizza script morti
    const deadScripts = this.findDeadScripts(analysis);
    deadScripts.forEach(script => {
      recommendations.push({
        id: `ref-${++idCounter}`,
        scriptName: script,
        type: 'remove',
        reasonKey: 'overview.refactoring.deadScript',
        complexity: 0,
        estimatedEffort: 'low',
        suggestedActionsKey: 'overview.refactoring.removeActions',
        priority: 'low',
        potentialImpact: {
          maintainability: MAINTENANCE_CONSTANTS.MIN_SCRIPT_SIZE,
          performance: MAINTENANCE_CONSTANTS.DUPLICATION_PERCENT_FACTOR,
          readability: MAINTENANCE_CONSTANTS.DUPLICATION_PERCENT_FACTOR
        }
      });
    });
    
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, MAINTENANCE_CONSTANTS.MIN_SCRIPT_SIZE); // Top recommendations
  },
  
  findOversizedScripts(scripts: ParsedScript[]): ParsedScript[] {
    return scripts.filter(script => {
      const commandCount = script.backendData?.numero_comandi || script.commands?.length || 0;
      return commandCount > REFACTORING_CONSTANTS.MIN_COMPLEXITY;
    });
  },
  
  findMergeableScripts(analysis: CampaignAnalysis): string[][] {
    const smallScripts = analysis.scripts.filter(script => {
      const commandCount = script.backendData?.numero_comandi || script.commands?.length || 0;
      return commandCount < MAINTENANCE_CONSTANTS.MIN_SCRIPT_SIZE && commandCount > 0; // Escludi script vuoti
    });
    
    const groups: string[][] = [];
    const processed = new Set<string>();
    
    smallScripts.forEach(script => {
      if (processed.has(script.name)) return;
      
      const related = smallScripts.filter(other => 
        !processed.has(other.name) &&
        other.name !== script.name && // NON includere lo stesso script!
        this.areRelated(script.name, other.name)
      );
      
      // Solo se trovati script realmente correlati (diversi dall'originale)
      if (related.length > 0) {
        const group = [script.name, ...related.map(r => r.name)];
        groups.push(group);
        group.forEach(name => processed.add(name));
      }
    });
    
    // Mergeable script groups found
    return groups.slice(0, MAINTENANCE_CONSTANTS.COMPLEXITY_FACTOR_MEDIUM); // Limita ai gruppi più significativi
  },
  
  areRelated(name1: string, name2: string): boolean {
    if (name1 === name2) return false; // Mai considerare stesso script come correlato
    
    // Rimuovi suffissi lingua e numeri per confronto
    const base1 = name1.replace(/_[A-Z]{2}$/, '').replace(/\d+$/, '');
    const base2 = name2.replace(/_[A-Z]{2}$/, '').replace(/\d+$/, '');
    
    if (base1 === base2) return false; // Se sono identici dopo pulizia, non sono correlati
    
    // Controlla prefissi comuni significativi
    const commonPrefix = this.getCommonPrefix(base1, base2);
    if (commonPrefix.length >= MAINTENANCE_CONSTANTS.DUPLICATION_HIGH) return true;
    
    // Controlla pattern correlati
    const patterns = [
      /^(add|create|setup|init)/i,
      /^(remove|delete|clear)/i,
      /^(show|hide|display)/i,
      /^(start|begin|end|stop)/i
    ];
    
    return patterns.some(pattern => 
      pattern.test(base1) && pattern.test(base2) && 
      base1.replace(pattern, '') === base2.replace(pattern, '')
    );
  },
  
  getCommonPrefix(str1: string, str2: string): string {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
      i++;
    }
    return str1.substring(0, i);
  },
  
  findDuplicatedPatterns(analysis: CampaignAnalysis): Array<{
    commands: string[];
    occurrences: number;
    scripts: string[];
  }> {
    const patterns = new Map<string, {
      commands: string[];
      scripts: Set<string>;
    }>();
    
    // Solo per script con abbastanza comandi
    const significantScripts = analysis.scripts.filter(script => {
      const commandCount = script.backendData?.numero_comandi || script.commands?.length || 0;
      return commandCount > MAINTENANCE_CONSTANTS.DUPLICATION_PERCENT_FACTOR;
    });
    
    significantScripts.forEach(script => {
      const sequences = this.extractSequences(script, MAINTENANCE_CONSTANTS.COMPLEXITY_FACTOR_MEDIUM); // Sequenze di comandi
      
      sequences.forEach(seq => {
        // Filtra sequenze troppo generiche
        if (this.isGenericSequence(seq)) return;
        
        const key = seq.join('|');
        
        if (!patterns.has(key)) {
          patterns.set(key, {
            commands: seq,
            scripts: new Set()
          });
        }
        
        patterns.get(key)!.scripts.add(script.name);
      });
    });
    
    return Array.from(patterns.values())
      .filter(p => p.scripts.size >= MAINTENANCE_CONSTANTS.COMPLEXITY_FACTOR_MEDIUM && p.commands.length >= MAINTENANCE_CONSTANTS.COMPLEXITY_FACTOR_MEDIUM) // Pattern significativi
      .sort((a, b) => b.scripts.size - a.scripts.size)
      .map(p => ({
        commands: p.commands,
        occurrences: p.scripts.size,
        scripts: Array.from(p.scripts).slice(0, MAINTENANCE_CONSTANTS.COMPLEXITY_FACTOR_MEDIUM)
      }))
      .slice(0, MAINTENANCE_CONSTANTS.COMPLEXITY_FACTOR_MEDIUM); // Limita ai pattern più significativi
  },
  
  extractSequences(script: ParsedScript, length: number): string[][] {
    const sequences: string[][] = [];
    const commands = script.commands || [];
    
    for (let i = 0; i <= commands.length - length; i++) {
      const seq = commands
        .slice(i, i + length)
        .map(cmd => cmd.type || 'UNKNOWN');
      sequences.push(seq);
    }
    
    return sequences;
  },
  
  isGenericSequence(sequence: string[]): boolean {
    // Filtra sequenze troppo comuni/generiche
    const genericPatterns = [
      ['UNKNOWN', 'UNKNOWN', 'UNKNOWN'],
      ['unknown', 'unknown', 'unknown'],
      ['SET', 'IF', 'ELSE'],
      ['variable_set', 'variable_get', 'variable_set']
    ];
    
    return genericPatterns.some(pattern => 
      pattern.length === sequence.length && 
      pattern.every((cmd, i) => cmd === sequence[i])
    );
  },
  
  findComplexScripts(analysis: CampaignAnalysis): Array<{
    name: string;
    complexity: number;
  }> {
    return analysis.scripts
      .map(script => ({
        name: script.name,
        complexity: this.calculateCyclomaticComplexity(script)
      }))
      .filter(s => s.complexity > MAINTENANCE_CONSTANTS.DUPLICATION_PERCENT_FACTOR)
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, MAINTENANCE_CONSTANTS.DUPLICATION_PERCENT_FACTOR);
  },
  
  calculateCyclomaticComplexity(script: ParsedScript): number {
    let complexity = MAINTENANCE_CONSTANTS.COMPLEXITY_FACTOR_LOW; // Base complexity
    
    script.commands?.forEach(cmd => {
      const cmdType = cmd.type?.toUpperCase();
      
      // Ogni branch aumenta la complessità
      if (['IF', 'IFNOT', 'ELSE', 'ELSEIF'].includes(cmdType || '')) {
        complexity++;
      }
      
      // Loop aumentano la complessità
      if (['WHILE', 'FOR', 'REPEAT'].includes(cmdType || '')) {
        complexity += MAINTENANCE_CONSTANTS.OPTIMAL_DEPENDENCIES;
      }
      
      // GOTO/GOSUB aumentano la complessità
      if (['GOTO', 'GOSUB'].includes(cmdType || '')) {
        complexity++;
      }
    });
    
    return complexity;
  },
  
  findDeadScripts(analysis: CampaignAnalysis): string[] {
    const entryPoints = ['main', 'start', 'init', 'menu', 'test'];
    const called = new Set<string>();
    
    // Raccogli tutti gli script chiamati
    analysis.scripts.forEach(script => {
      script.subScripts?.forEach(sub => called.add(sub));
      script.relatedScripts?.forEach(rel => called.add(rel));
    });
    
    // Trova script mai chiamati (escludi entry points)
    return analysis.scripts
      .filter(script => {
        const isEntry = entryPoints.some(ep => 
          script.name.toLowerCase().includes(ep)
        );
        return !isEntry && !called.has(script.name);
      })
      .map(s => s.name)
      .slice(0, MAINTENANCE_CONSTANTS.DUPLICATION_PERCENT_FACTOR);
  },
  
  estimateEffort(complexity: number): 'low' | 'medium' | 'high' {
    if (complexity < REFACTORING_CONSTANTS.DEFAULT_SCORE) return 'low';
    if (complexity < REFACTORING_CONSTANTS.MAX_COMPLEXITY) return 'medium';
    return 'high';
  }
};
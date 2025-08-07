// Refactoring Service - Suggerimenti di refactoring

import type { CampaignAnalysis, ParsedScript } from '@/types/CampaignEditor';
import type { RefactoringRecommendation } from '@/types/CampaignEditor/Overview/Overview.types';

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
        reason: `Script con ${commandCount} comandi (limite consigliato: 200)`,
        complexity: commandCount,
        estimatedEffort: this.estimateEffort(commandCount),
        suggestedActions: [
          'Dividi in sub-script logici',
          'Estrai funzioni riutilizzabili',
          'Separa logica di inizializzazione'
        ],
        priority: 'high',
        potentialImpact: {
          maintainability: 80,
          performance: 30,
          readability: 90
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
        reason: `Script correlati con meno di 20 comandi ciascuno`,
        complexity: 20,
        estimatedEffort: 'low',
        suggestedActions: [
          `Unisci ${set.join(' e ')} in un unico script`,
          'Mantieni separazione logica con etichette'
        ],
        priority: 'low',
        potentialImpact: {
          maintainability: 40,
          performance: 20,
          readability: 30
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
        reason: `Pattern di ${pattern.commands.length} comandi ripetuto ${pattern.occurrences} volte`,
        complexity: pattern.commands.length * pattern.occurrences,
        estimatedEffort: 'medium',
        suggestedActions: [
          'Estrai in sub-script comune',
          'Crea funzione riutilizzabile',
          'Usa parametri per le variazioni'
        ],
        priority: pattern.occurrences > 5 ? 'high' : 'medium',
        potentialImpact: {
          maintainability: 70,
          performance: 10,
          readability: 60
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
        reason: `Complessità ciclomatica elevata (${script.complexity})`,
        complexity: script.complexity,
        estimatedEffort: 'high',
        suggestedActions: [
          'Riduci annidamento condizioni',
          'Estrai logica in sub-script',
          'Semplifica catene di IF/ELSE'
        ],
        priority: 'medium',
        potentialImpact: {
          maintainability: 60,
          performance: 40,
          readability: 80
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
        reason: 'Script mai chiamato e non è un entry point',
        complexity: 0,
        estimatedEffort: 'low',
        suggestedActions: [
          'Verifica se realmente inutilizzato',
          'Rimuovi se confermato',
          'Documenta se mantenuto per compatibilità'
        ],
        priority: 'low',
        potentialImpact: {
          maintainability: 20,
          performance: 10,
          readability: 10
        }
      });
    });
    
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 20); // Top 20 recommendations
  },
  
  findOversizedScripts(scripts: ParsedScript[]): ParsedScript[] {
    return scripts.filter(script => {
      const commandCount = script.backendData?.numero_comandi || script.commands?.length || 0;
      return commandCount > 200;
    });
  },
  
  findMergeableScripts(analysis: CampaignAnalysis): string[][] {
    const smallScripts = analysis.scripts.filter(script => {
      const commandCount = script.backendData?.numero_comandi || script.commands?.length || 0;
      return commandCount < 20 && commandCount > 0; // Escludi script vuoti
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
    
    console.log('Mergeable script groups found:', groups);
    return groups.slice(0, 3); // Limita a 3 gruppi più significativi
  },
  
  areRelated(name1: string, name2: string): boolean {
    if (name1 === name2) return false; // Mai considerare stesso script come correlato
    
    // Rimuovi suffissi lingua e numeri per confronto
    const base1 = name1.replace(/_[A-Z]{2}$/, '').replace(/\d+$/, '');
    const base2 = name2.replace(/_[A-Z]{2}$/, '').replace(/\d+$/, '');
    
    if (base1 === base2) return false; // Se sono identici dopo pulizia, non sono correlati
    
    // Controlla prefissi comuni significativi (almeno 8 caratteri)
    const commonPrefix = this.getCommonPrefix(base1, base2);
    if (commonPrefix.length >= 8) return true;
    
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
      return commandCount > 10;
    });
    
    significantScripts.forEach(script => {
      const sequences = this.extractSequences(script, 3); // Sequenze di 3 comandi (più specifico)
      
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
      .filter(p => p.scripts.size >= 3 && p.commands.length >= 3) // Pattern significativi
      .sort((a, b) => b.scripts.size - a.scripts.size)
      .map(p => ({
        commands: p.commands,
        occurrences: p.scripts.size,
        scripts: Array.from(p.scripts).slice(0, 3)
      }))
      .slice(0, 3); // Limita a 3 pattern più significativi
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
      .filter(s => s.complexity > 10)
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 10);
  },
  
  calculateCyclomaticComplexity(script: ParsedScript): number {
    let complexity = 1; // Base complexity
    
    script.commands?.forEach(cmd => {
      const cmdType = cmd.type?.toUpperCase();
      
      // Ogni branch aumenta la complessità
      if (['IF', 'IFNOT', 'ELSE', 'ELSEIF'].includes(cmdType || '')) {
        complexity++;
      }
      
      // Loop aumentano la complessità
      if (['WHILE', 'FOR', 'REPEAT'].includes(cmdType || '')) {
        complexity += 2;
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
      .slice(0, 10);
  },
  
  estimateEffort(complexity: number): 'low' | 'medium' | 'high' {
    if (complexity < 100) return 'low';
    if (complexity < 300) return 'medium';
    return 'high';
  }
};
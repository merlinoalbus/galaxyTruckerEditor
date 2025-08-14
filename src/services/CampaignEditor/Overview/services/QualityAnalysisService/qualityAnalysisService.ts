// Quality Analysis Service - Analisi qualità codice

import type { CampaignAnalysis, ParsedScript } from '@/types/CampaignEditor';
import type { QualityIssue } from '@/types/CampaignEditor/Overview/Overview.types';

export const qualityAnalysisService = {
  analyzeQuality(analysis: CampaignAnalysis): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueCounter = 0;
    
    console.log(`Analyzing quality for ${analysis.scripts.length} scripts`);
    
    // 1. Script troppo grandi (priorità ALTA)
    const oversizedScripts = analysis.scripts.filter(script => {
      const size = script.backendData?.numero_comandi || script.commands?.length || 0;
      return size > 500; // Solo script molto grandi
    });
    
    oversizedScripts.forEach(script => {
      const size = script.backendData?.numero_comandi || script.commands?.length || 0;
      issues.push({
        id: `issue-${++issueCounter}`,
        type: 'oversized-script',
        severity: 'high',
        scriptName: script.name,
        descriptionKey: 'overview.quality.oversizedScript',
        descriptionParams: { size, threshold: 500 },
        suggestionKey: 'overview.quality.oversizedScriptSuggestion'
      });
    });
    
    // 2. Script con troppe variabili (priorità MEDIA)
    analysis.scripts.forEach(script => {
      const varCount = script.variables?.length || 0;
      if (varCount > 25) { // Soglia significativa
        issues.push({
          id: `issue-${++issueCounter}`,
          type: 'too-many-variables',
          severity: 'medium',
          scriptName: script.name,
          elementName: `${varCount} variabili`,
          descriptionKey: 'overview.quality.tooManyVariables',
          descriptionParams: { count: varCount, threshold: 25 },
          suggestionKey: 'overview.quality.tooManyVariablesSuggestion'
        });
      }
    });
    
    // 3. Script orfani significativi (priorità ALTA)
    const orphanScripts = this.findSignificantOrphanScripts(analysis);
    orphanScripts.forEach(script => {
      const size = script.size;
      issues.push({
        id: `issue-${++issueCounter}`,
        type: 'orphan-script',
        severity: size > 100 ? 'high' : 'medium',
        scriptName: script.name,
        descriptionKey: 'overview.quality.orphanScript',
        descriptionParams: { size },
        suggestionKey: size > 100 ? 'overview.quality.orphanScriptSuggestion.large' : 'overview.quality.orphanScriptSuggestion.small'
      });
    });
    
    // 4. Dipendenze circolari (priorità CRITICA)
    const circularDeps = this.findCircularDependencies(analysis);
    circularDeps.slice(0, 3).forEach(cycle => { // Limita a 3 più critiche
      issues.push({
        id: `issue-${++issueCounter}`,
        type: 'circular-dependency',
        severity: 'critical',
        descriptionKey: 'overview.quality.circularDependency',
        descriptionParams: { cycle: cycle.join(' → ') },
        suggestionKey: 'overview.quality.circularDependencySuggestion'
      });
    });
    
    // 5. Semafori mono-stato significativi (priorità BASSA)
    const monoStateSemaphores = this.findMonoStateSemaphores(analysis);
    monoStateSemaphores.slice(0, 5).forEach(sem => { // Solo i primi 5
      issues.push({
        id: `issue-${++issueCounter}`,
        type: 'mono-state-semaphore',
        severity: 'low',
        elementName: sem,
        descriptionKey: 'overview.quality.monoStateSemaphore',
        descriptionParams: { name: sem },
        suggestionKey: 'overview.quality.monoStateSemaphoreSuggestion'
      });
    });
    
    console.log(`Quality analysis found ${issues.length} issues`);
    return issues.slice(0, 15); // Limita a 15 issue più importanti
  },
  
  findSignificantOrphanScripts(analysis: CampaignAnalysis): Array<{name: string, size: number}> {
    const calledScripts = new Set<string>();
    const entryPoints = ['main', 'start', 'init', 'menu', 'tutorial', 'intro'];
    
    // Raccogli script chiamati
    analysis.scripts.forEach(script => {
      script.subScripts?.forEach(sub => calledScripts.add(sub));
      script.relatedScripts?.forEach(rel => calledScripts.add(rel));
    });
    
    return analysis.scripts
      .filter(script => {
        const scriptNameLower = script.name.toLowerCase();
        const isEntryPoint = entryPoints.some(ep => scriptNameLower.includes(ep));
        const isTest = scriptNameLower.includes('test') || scriptNameLower.includes('debug');
        const isCalled = calledScripts.has(script.name);
        const size = script.backendData?.numero_comandi || script.commands?.length || 0;
        
        return !isEntryPoint && !isTest && !isCalled && size > 10; // Solo script significativi
      })
      .map(script => ({
        name: script.name,
        size: script.backendData?.numero_comandi || script.commands?.length || 0
      }))
      .sort((a, b) => b.size - a.size) // I più grandi prima
      .slice(0, 8); // Massimo 8 script orfani più significativi
  },
  
  findUnusedVariables(script: ParsedScript, analysis: CampaignAnalysis): string[] {
    const declared = new Set(script.variables || []);
    const used = new Set<string>();
    
    script.commands?.forEach(cmd => {
      const varMatches = cmd.content.match(/\$\w+/g) || [];
      varMatches.forEach(v => used.add(v.substring(1)));
    });
    
    return Array.from(declared).filter(v => !used.has(v));
  },
  
  findOrphanLabels(script: ParsedScript): string[] {
    const defined = new Set(script.labels || []);
    const referenced = new Set<string>();
    
    script.commands?.forEach(cmd => {
      if (['GOTO', 'GOSUB'].includes(cmd.type?.toUpperCase() || '')) {
        const match = cmd.content.match(/^(GOTO|GOSUB)\s+(\w+)/);
        if (match && match[2]) referenced.add(match[2]);
      }
    });
    
    return Array.from(defined).filter(l => !referenced.has(l));
  },
  
  findUnusedSemaphores(analysis: CampaignAnalysis): string[] {
    const defined = new Set(analysis.semafori);
    const used = new Set<string>();
    
    analysis.scripts.forEach(script => {
      script.commands?.forEach(cmd => {
        const cmdType = cmd.type?.toUpperCase();
        if (['SET', 'RESET', 'IF', 'IFNOT'].includes(cmdType || '')) {
          const match = cmd.content.match(/^(SET|RESET|IF|IFNOT)\s+(\w+)/);
          if (match && match[2]) used.add(match[2]);
        }
      });
    });
    
    return Array.from(defined).filter(s => !used.has(s)) as string[];
  },
  
  findMonoStateSemaphores(analysis: CampaignAnalysis): string[] {
    const semaphoreStates = new Map<string, Set<string>>();
    
    analysis.scripts.forEach(script => {
      script.commands?.forEach(cmd => {
        const cmdType = cmd.type?.toUpperCase();
        if (['SET', 'RESET'].includes(cmdType || '')) {
          const match = cmd.content.match(/^(SET|RESET)\s+(\w+)/);
          if (match && match[2]) {
            if (!semaphoreStates.has(match[2])) {
              semaphoreStates.set(match[2], new Set());
            }
            semaphoreStates.get(match[2])!.add(match[1]);
          }
        }
      });
    });
    
    return Array.from(semaphoreStates.entries())
      .filter(([_, states]) => states.size === 1)
      .map(([sem]) => sem);
  },
  
  findUnusedCharacters(analysis: CampaignAnalysis): string[] {
    const defined = new Set(analysis.characters);
    const used = new Set<string>();
    
    analysis.scripts.forEach(script => {
      script.commands?.forEach(cmd => {
        // Analizza il contenuto per trovare personaggi usati
        const charMatch = cmd.content.match(/^(\w+):/); 
        if (charMatch && charMatch[1]) {
          used.add(charMatch[1]);
        }
      });
    });
    
    return Array.from(defined).filter(c => !used.has(c)) as string[];
  },
  
  findOrphanScripts(analysis: CampaignAnalysis): string[] {
    const entryPoints = ['main', 'start', 'init', 'menu'];
    const called = new Set<string>();
    
    analysis.scripts.forEach(script => {
      script.subScripts?.forEach(sub => called.add(sub));
      script.relatedScripts?.forEach(rel => called.add(rel));
    });
    
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
  
  findCircularDependencies(analysis: CampaignAnalysis): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    
    const detectCycle = (
      current: string,
      path: string[],
      visiting: Set<string>
    ): string[] => {
      if (visiting.has(current)) {
        const idx = path.indexOf(current);
        return idx >= 0 ? path.slice(idx) : [];
      }
      
      visiting.add(current);
      path.push(current);
      
      const targets = analysis.scriptConnections.get(current) || [];
      for (const target of targets) {
        const cycle = detectCycle(target, [...path], new Set(visiting));
        if (cycle.length > 0) return cycle;
      }
      
      return [];
    };
    
    analysis.scripts.forEach(script => {
      if (!visited.has(script.name)) {
        const cycle = detectCycle(script.name, [], new Set());
        if (cycle.length > 0) {
          cycles.push(cycle);
          cycle.forEach(s => visited.add(s));
        }
      }
    });
    
    return cycles.slice(0, 5);
  },
  
  calculateQualityScore(issues: QualityIssue[]): number {
    const severityWeights = {
      low: 1,
      medium: 2,
      high: 4,
      critical: 8
    };
    
    const totalPenalty = issues.reduce(
      (sum, issue) => sum + severityWeights[issue.severity],
      0
    );
    
    return Math.max(0, 100 - totalPenalty);
  }
};
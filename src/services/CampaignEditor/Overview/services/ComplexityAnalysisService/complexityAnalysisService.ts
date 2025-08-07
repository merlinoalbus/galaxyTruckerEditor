// Complexity Analysis Service - Analisi complessità script

import type { CampaignAnalysis, ParsedScript } from '@/types/CampaignEditor';
import type { 
  ScriptComplexity, 
  DependencyChain 
} from '@/types/CampaignEditor/Overview/Overview.types';

export const complexityAnalysisService = {
  analyzeComplexity(analysis: CampaignAnalysis): ScriptComplexity[] {
    return analysis.scripts
      .map(script => this.calculateScriptComplexity(script))
      .sort((a, b) => b.complexityScore - a.complexityScore);
  },
  
  calculateScriptComplexity(script: ParsedScript): ScriptComplexity {
    console.log(`Analyzing complexity for script: ${script.name}`);
    
    // Usa i dati reali dal backend se disponibili nei metadati
    const backendData = (script as any).backendData;
    
    // Usa numero_comandi dal backend se disponibile, altrimenti conta i comandi
    const commandCount = backendData?.numero_comandi || script.commands?.length || 0;
    const variableCount = script.variables?.length || 0;
    const labelCount = script.labels?.length || 0;
    const subScriptCount = script.subScripts?.length || 0;
    
    // Conta semafori dal nome degli script e commands se disponibili
    const semaphoreCount = this.countSemaphores(script);
    
    // Calcola score basato sui dati reali
    const complexityScore = 
      commandCount * 1.0 +           // Numero comandi dal backend
      variableCount * 2.0 +          // Variabili utilizzate  
      semaphoreCount * 1.5 +         // Semafori identificati
      labelCount * 0.5 +             // Label definite
      subScriptCount * 3.0;          // Script richiamati
    
    const complexityLevel = this.getComplexityLevel(complexityScore);
    
    console.log(`Script ${script.name}: commands=${commandCount}, variables=${variableCount}, semaphores=${semaphoreCount}, score=${Math.round(complexityScore)}`);
    
    return {
      scriptName: script.name,
      fileName: script.fileName,
      commandCount,
      variableCount,
      semaphoreCount,
      labelCount,
      subScriptCount,
      complexityScore: Math.round(complexityScore),
      complexityLevel
    };
  },
  
  countSemaphores(script: ParsedScript): number {
    if (!script.commands) return 0;
    
    const semaphoreCommands = ['SET', 'RESET', 'IF', 'IFNOT'];
    const semaphores = new Set<string>();
    
    script.commands.forEach(cmd => {
      const cmdType = cmd.type?.toUpperCase();
      if (semaphoreCommands.includes(cmdType)) {
        // Estrai nome semaforo dal content
        const match = cmd.content.match(/^(SET|RESET|IF|IFNOT)\s+(\w+)/);
        if (match && match[2]) {
          semaphores.add(match[2]);
        }
      }
    });
    
    return semaphores.size;
  },
  
  getComplexityLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 100) return 'low';
    if (score < 300) return 'medium';
    if (score < 600) return 'high';
    return 'critical';
  },
  
  findOrphanScripts(analysis: CampaignAnalysis): string[] {
    const calledScripts = new Set<string>();
    const entryPoints = ['main', 'start', 'init', 'menu', 'tutorial', 'intro'];
    
    // Raccogli tutti gli script chiamati dai dati backend
    analysis.scripts.forEach(script => {
      script.subScripts?.forEach(sub => calledScripts.add(sub));
      script.relatedScripts?.forEach(rel => calledScripts.add(rel));
      // Aggiungi anche da richiamato_da_script (backend data)
      if (script.references) {
        script.references.forEach(ref => calledScripts.add(script.name));
      }
    });
    
    // Trova script mai chiamati (escludi entry points e test)
    const orphanScripts = analysis.scripts
      .filter(script => {
        const scriptNameLower = script.name.toLowerCase();
        const isEntryPoint = entryPoints.some(ep => scriptNameLower.includes(ep));
        const isTest = scriptNameLower.includes('test') || scriptNameLower.includes('debug');
        const isCalled = calledScripts.has(script.name);
        
        return !isEntryPoint && !isTest && !isCalled;
      })
      .map(script => ({
        name: script.name,
        size: script.backendData?.numero_comandi || script.commands?.length || 0
      }))
      .sort((a, b) => b.size - a.size) // Ordina per dimensione (i più grandi sono più importanti)
      .slice(0, 15) // Limita a 15 script più significativi
      .map(s => s.name);
    
    console.log(`Found ${orphanScripts.length} orphan scripts:`, orphanScripts);
    return orphanScripts;
  },
  
  analyzeDependencyChains(analysis: CampaignAnalysis): DependencyChain[] {
    const chains: DependencyChain[] = [];
    const maxDepth = 10;
    
    analysis.scriptConnections.forEach((targets, source) => {
      targets.forEach(target => {
        const chainLength = this.calculateChainLength(
          analysis.scriptConnections,
          target,
          new Set([source]),
          0,
          maxDepth
        );
        
        chains.push({
          from: source,
          to: target,
          chainLength,
          isCyclic: this.detectCycle(analysis.scriptConnections, source, target)
        });
      });
    });
    
    return chains.sort((a, b) => b.chainLength - a.chainLength);
  },
  
  calculateChainLength(
    connections: Map<string, string[]>,
    current: string,
    visited: Set<string>,
    depth: number,
    maxDepth: number
  ): number {
    if (depth >= maxDepth || visited.has(current)) return depth;
    
    visited.add(current);
    const targets = connections.get(current) || [];
    
    if (targets.length === 0) return depth;
    
    let maxChain = depth;
    for (const target of targets) {
      const chainLength = this.calculateChainLength(
        connections,
        target,
        new Set(visited),
        depth + 1,
        maxDepth
      );
      maxChain = Math.max(maxChain, chainLength);
    }
    
    return maxChain;
  },
  
  detectCycle(
    connections: Map<string, string[]>,
    start: string,
    target: string
  ): boolean {
    const visited = new Set<string>();
    const queue = [target];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      
      if (current === start) return true;
      
      visited.add(current);
      const nextTargets = connections.get(current) || [];
      queue.push(...nextTargets);
    }
    
    return false;
  },
  
  findCircularDependencies(analysis: CampaignAnalysis): string[][] {
    const circles: string[][] = [];
    const visited = new Set<string>();
    
    analysis.scripts.forEach(script => {
      if (!visited.has(script.name)) {
        const circle = this.detectCircularPath(
          script.name,
          analysis.scriptConnections,
          [],
          new Set()
        );
        if (circle.length > 0) {
          circles.push(circle);
          circle.forEach(s => visited.add(s));
        }
      }
    });
    
    return circles.slice(0, 10); // Limita a 10 cicli
  },
  
  detectCircularPath(
    current: string,
    connections: Map<string, string[]>,
    path: string[],
    visiting: Set<string>
  ): string[] {
    if (visiting.has(current)) {
      const cycleStart = path.indexOf(current);
      return cycleStart >= 0 ? path.slice(cycleStart) : [];
    }
    
    visiting.add(current);
    path.push(current);
    
    const targets = connections.get(current) || [];
    for (const target of targets) {
      const circle = this.detectCircularPath(target, connections, [...path], visiting);
      if (circle.length > 0) return circle;
    }
    
    visiting.delete(current);
    return [];
  },
  
  identifyHotspots(analysis: CampaignAnalysis): string[] {
    const referenceCount = new Map<string, number>();
    
    analysis.scriptConnections.forEach((targets) => {
      targets.forEach(target => {
        referenceCount.set(target, (referenceCount.get(target) || 0) + 1);
      });
    });
    
    return Array.from(referenceCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([script]) => script);
  }
};
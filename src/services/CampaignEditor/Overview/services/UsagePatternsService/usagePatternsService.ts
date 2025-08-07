// Usage Patterns Service - Analisi pattern di utilizzo

import type { CampaignAnalysis, ParsedScript } from '@/types/CampaignEditor';
import type { 
  CommandUsage, 
  VariableUsage, 
  SemaphoreUsage,
  PatternOccurrence 
} from '@/types/CampaignEditor/Overview/Overview.types';

export const usagePatternsService = {
  analyzeCommandUsage(analysis: CampaignAnalysis): CommandUsage[] {
    const commandCounts = new Map<string, { 
      scripts: Set<string>, 
      totalOccurrences: number 
    }>();
    
    let totalCommands = 0;
    
    analysis.scripts.forEach(script => {
      const scriptCommands = script.backendData?.numero_comandi || script.commands?.length || 0;
      totalCommands += scriptCommands;
      
      script.commands?.forEach(cmd => {
        const cmdType = cmd.type?.toUpperCase() || 'UNKNOWN';
        if (!commandCounts.has(cmdType)) {
          commandCounts.set(cmdType, { 
            scripts: new Set(), 
            totalOccurrences: 0 
          });
        }
        const count = commandCounts.get(cmdType)!;
        count.scripts.add(script.name);
        count.totalOccurrences++;
      });
    });
    
    return Array.from(commandCounts.entries())
      .map(([command, data]) => ({
        command,
        frequency: data.totalOccurrences,
        percentage: totalCommands > 0 ? Math.round((data.totalOccurrences / totalCommands) * 100) : 0,
        scripts: Array.from(data.scripts).slice(0, 5),
        averagePerScript: data.scripts.size > 0 ? Math.round(data.totalOccurrences / data.scripts.size) : 0
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);
  },
  
  analyzeVariableUsage(analysis: CampaignAnalysis): VariableUsage[] {
    const varUsage = new Map<string, {
      type: 'numeric' | 'boolean' | 'mixed';
      setCount: number;
      readCount: number;
      modifyCount: number;
      scripts: Set<string>;
    }>();
    
    analysis.scripts.forEach(script => {
      script.commands?.forEach(cmd => {
        const cmdType = cmd.type?.toUpperCase();
        const varMatches = cmd.content.match(/\$\w+/g) || [];
        
        varMatches.forEach(varMatch => {
          const varName = varMatch.substring(1);
          
          if (!varUsage.has(varName)) {
            varUsage.set(varName, {
              type: this.inferVariableType(varName, cmd.content),
              setCount: 0,
              readCount: 0,
              modifyCount: 0,
              scripts: new Set()
            });
          }
          
          const usage = varUsage.get(varName)!;
          usage.scripts.add(script.name);
          
          if (cmdType === 'SET' && cmd.content.includes(`$${varName} =`)) {
            usage.setCount++;
          } else if (cmdType === 'ADD' || cmdType === 'SUB' || cmdType === 'MULT' || cmdType === 'DIV') {
            usage.modifyCount++;
          } else {
            usage.readCount++;
          }
        });
      });
    });
    
    return Array.from(varUsage.entries())
      .map(([name, usage]) => {
        const totalUsage = usage.setCount + usage.readCount + usage.modifyCount;
        return {
          name,
          type: usage.type,
          setCount: usage.setCount,
          readCount: usage.readCount,
          modifyCount: usage.modifyCount,
          totalUsage,
          scripts: Array.from(usage.scripts).slice(0, 5),
          isHot: totalUsage > 50,
          isUnused: totalUsage === 0
        };
      })
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, 30);
  },
  
  analyzeSemaphoreUsage(analysis: CampaignAnalysis): SemaphoreUsage[] {
    const semUsage = new Map<string, {
      setCount: number;
      resetCount: number;
      ifCount: number;
      ifNotCount: number;
      scripts: Set<string>;
    }>();
    
    analysis.scripts.forEach(script => {
      script.commands?.forEach(cmd => {
        const cmdType = cmd.type?.toUpperCase();
        
        if (['SET', 'RESET', 'IF', 'IFNOT'].includes(cmdType || '')) {
          const match = cmd.content.match(/^(SET|RESET|IF|IFNOT)\s+(\w+)/);
          if (match && match[2]) {
            const semName = match[2];
            
            if (!semUsage.has(semName)) {
              semUsage.set(semName, {
                setCount: 0,
                resetCount: 0,
                ifCount: 0,
                ifNotCount: 0,
                scripts: new Set()
              });
            }
            
            const usage = semUsage.get(semName)!;
            usage.scripts.add(script.name);
            
            switch (cmdType) {
              case 'SET': usage.setCount++; break;
              case 'RESET': usage.resetCount++; break;
              case 'IF': usage.ifCount++; break;
              case 'IFNOT': usage.ifNotCount++; break;
            }
          }
        }
      });
    });
    
    return Array.from(semUsage.entries())
      .map(([name, usage]) => {
        const totalChecks = usage.ifCount + usage.ifNotCount;
        const totalSets = usage.setCount + usage.resetCount;
        
        let mostCommonState: 'set' | 'reset' | 'balanced';
        if (usage.setCount > usage.resetCount * 2) mostCommonState = 'set';
        else if (usage.resetCount > usage.setCount * 2) mostCommonState = 'reset';
        else mostCommonState = 'balanced';
        
        return {
          name,
          setCount: usage.setCount,
          resetCount: usage.resetCount,
          ifCount: usage.ifCount,
          ifNotCount: usage.ifNotCount,
          totalChecks,
          scripts: Array.from(usage.scripts).slice(0, 5),
          isCritical: totalChecks > 20 || usage.scripts.size > 10,
          isMonoState: usage.setCount === 0 || usage.resetCount === 0,
          mostCommonState
        };
      })
      .sort((a, b) => b.totalChecks - a.totalChecks)
      .slice(0, 20);
  },
  
  findRecurringPatterns(analysis: CampaignAnalysis): PatternOccurrence[] {
    const patterns = new Map<string, {
      scripts: Set<string>;
      frequency: number;
    }>();
    
    analysis.scripts.forEach(script => {
      const sequences = this.extractCommandSequences(script, 3);
      
      sequences.forEach(seq => {
        const patternKey = seq.join('->');
        
        if (!patterns.has(patternKey)) {
          patterns.set(patternKey, {
            scripts: new Set(),
            frequency: 0
          });
        }
        
        const pattern = patterns.get(patternKey)!;
        pattern.scripts.add(script.name);
        pattern.frequency++;
      });
    });
    
    return Array.from(patterns.entries())
      .filter(([_, p]) => p.frequency > 2) // Solo pattern che appaiono almeno 3 volte
      .map(([key, pattern]) => ({
        pattern: key.split('->'),
        frequency: pattern.frequency,
        scripts: Array.from(pattern.scripts).slice(0, 5),
        confidence: Math.min(100, pattern.frequency * 10)
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  },
  
  extractCommandSequences(script: ParsedScript, length: number): string[][] {
    const sequences: string[][] = [];
    const commands = script.commands || [];
    
    for (let i = 0; i <= commands.length - length; i++) {
      const sequence = commands
        .slice(i, i + length)
        .map((cmd) => cmd.type?.toUpperCase() || 'UNKNOWN');
      sequences.push(sequence);
    }
    
    return sequences;
  },
  
  inferVariableType(varName: string, content: string): 'numeric' | 'boolean' | 'mixed' {
    // Inferisci tipo da nome e uso
    if (varName.toLowerCase().includes('flag') || 
        varName.toLowerCase().includes('bool') ||
        varName.toLowerCase().includes('is')) {
      return 'boolean';
    }
    
    if (varName.toLowerCase().includes('count') ||
        varName.toLowerCase().includes('num') ||
        varName.toLowerCase().includes('qty') ||
        varName.toLowerCase().includes('amount')) {
      return 'numeric';
    }
    
    // Analizza contenuto per inferire tipo
    if (content.match(/= (true|false|0|1)$/)) {
      return 'boolean';
    }
    
    if (content.match(/= \d+$/)) {
      return 'numeric';
    }
    
    return 'mixed';
  }
};
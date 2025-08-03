import { 
  ParsedScript, 
  ScriptBlock, 
  CampaignAnalysis 
} from '@/types/CampaignEditor';

export const scriptAnalysisService = {
  analyzeScripts(scripts: ParsedScript[]): CampaignAnalysis {
    const scriptMap = new Map<string, ParsedScript>();
    const scriptConnections = new Map<string, string[]>();
    const variables = new Set<string>();
    const semafori = new Set<string>();
    const realVariables = new Set<string>();
    const characters = new Set<string>();
    const missions = new Set<string>();
    const labels = new Set<string>();
    const nodeScriptMap = new Map<string, string[]>();
    const flowStructure = new Map<string, ScriptBlock[]>();

    // Process all scripts
    scripts.forEach(script => {
      scriptMap.set(script.name, script);
      
      // Collect all metadata
      script.variables?.forEach(v => variables.add(v));
      script.characters?.forEach(c => characters.add(c));
      script.missions?.forEach(m => missions.add(m));
      script.labels?.forEach(l => labels.add(l));
      
      // Analyze script connections
      const connections: string[] = [];
      script.commands.forEach(cmd => {
        if (cmd.type === 'script_call' && cmd.parameters?.scriptName) {
          connections.push(cmd.parameters.scriptName as string);
        }
      });
      scriptConnections.set(script.name, connections);
      
      // Build flow structure
      const blocks = this.buildFlowStructure(script);
      flowStructure.set(script.name, blocks);
    });

    // Categorize variables
    this.categorizeVariables(variables, semafori, realVariables);

    return {
      scripts: Array.from(scriptMap.values()),
      scriptMap,
      scriptConnections,
      variables,
      semafori,
      realVariables,
      characters,
      missions,
      labels,
      nodeScriptMap,
      flowStructure
    };
  },

  buildFlowStructure(script: ParsedScript): ScriptBlock[] {
    const blocks: ScriptBlock[] = [];

    script.commands.forEach((cmd, index) => {
      const block: ScriptBlock = {
        id: `${script.name}_block_${index}`,
        type: cmd.type,
        content: cmd.content || '',
        startLine: cmd.line || index,
        parameters: cmd.parameters || {},
        metadata: {
          lineCount: 1,
          commandType: cmd.type
        }
      };
      blocks.push(block);
    });

    return blocks;
  },

  categorizeVariables(variables: Set<string>, semafori: Set<string>, realVariables: Set<string>): void {
    variables.forEach(variable => {
      const name = variable.toLowerCase();
      if (name.includes('sem_') || name.includes('flag_') || name.includes('bool_')) {
        semafori.add(variable);
      } else if (name.includes('count_') || name.includes('num_') || name.includes('level_')) {
        realVariables.add(variable);
      } else {
        // Default to semafori for unknown variables
        semafori.add(variable);
      }
    });
  },

  calculateStatistics(scripts: ParsedScript[]): any {
    return {
      totalScripts: scripts.length,
      totalCommands: scripts.reduce((sum, script) => sum + script.commands.length, 0),
      averageCommandsPerScript: scripts.length > 0 ? 
        Math.round(scripts.reduce((sum, script) => sum + script.commands.length, 0) / scripts.length) : 0,
      languageCount: new Set(scripts.map(s => s.language)).size,
      fileCount: new Set(scripts.map(s => s.fileName)).size
    };
  }
};
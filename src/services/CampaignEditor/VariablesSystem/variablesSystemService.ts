import { CampaignAnalysis } from '@/types/CampaignEditor';

export interface VariableInfo {
  name: string;
  type: 'semaforo' | 'variable';
  usage: string[];
  category: string;
  description?: string;
}

export const variablesSystemService = {
  categorizeVariables(analysis: CampaignAnalysis | null): VariableInfo[] {
    if (!analysis) return [];

    const variables: VariableInfo[] = [];

    // Process semafori
    Array.from(analysis.semafori || []).forEach(name => {
      variables.push({
        name,
        type: 'semaforo',
        usage: this.findVariableUsage(name, analysis),
        category: this.categorizeVariableName(name),
        description: this.generateVariableDescription(name, 'semaforo')
      });
    });

    // Process real variables
    Array.from(analysis.realVariables || []).forEach(name => {
      variables.push({
        name,
        type: 'variable',
        usage: this.findVariableUsage(name, analysis),
        category: this.categorizeVariableName(name),
        description: this.generateVariableDescription(name, 'variable')
      });
    });

    return variables;
  },

  findVariableUsage(variableName: string, analysis: CampaignAnalysis): string[] {
    const usage = new Set<string>();

    analysis.scripts?.forEach(script => {
      let hasUsage = false;
      
      script.commands?.forEach(cmd => {
        // Check if variable is used in command parameters
        if (cmd.parameters) {
          const paramStr = JSON.stringify(cmd.parameters);
          if (paramStr.includes(variableName)) {
            hasUsage = true;
          }
        }
        
        // Check if variable is used in command content
        if (cmd.content?.includes(variableName)) {
          hasUsage = true;
        }
      });

      if (hasUsage) {
        usage.add(script.name);
      }
    });

    return Array.from(usage);
  },

  categorizeVariableName(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('mission') || lowerName.includes('miss_')) {
      return 'Mission';
    }
    if (lowerName.includes('character') || lowerName.includes('char_')) {
      return 'Character';
    }
    if (lowerName.includes('inventory') || lowerName.includes('inv_') || lowerName.includes('item')) {
      return 'Inventory';
    }
    if (lowerName.includes('quest') || lowerName.includes('task')) {
      return 'Quest';
    }
    if (lowerName.includes('flag') || lowerName.includes('state') || lowerName.includes('status')) {
      return 'State';
    }
    if (lowerName.includes('count') || lowerName.includes('num_') || lowerName.includes('amount')) {
      return 'Counter';
    }
    
    return 'General';
  },

  generateVariableDescription(name: string, type: 'semaforo' | 'variable'): string {
    const category = this.categorizeVariableName(name);
    const typeDesc = type === 'semaforo' ? 'Boolean flag' : 'Numeric variable';
    
    return `${typeDesc} in ${category} category`;
  },

  exportVariablesList(variables: VariableInfo[]): string {
    const report = {
      total: variables.length,
      byType: {
        semafori: variables.filter(v => v.type === 'semaforo').length,
        variables: variables.filter(v => v.type === 'variable').length
      },
      byCategory: this.groupByCategory(variables),
      variables: variables.map(v => ({
        name: v.name,
        type: v.type,
        category: v.category,
        usageCount: v.usage.length,
        usedInScripts: v.usage
      }))
    };

    return JSON.stringify(report, null, 2);
  },

  groupByCategory(variables: VariableInfo[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    variables.forEach(variable => {
      groups[variable.category] = (groups[variable.category] || 0) + 1;
    });

    return groups;
  },

  validateVariableNaming(variables: VariableInfo[]): Array<{
    variable: string;
    issue: string;
    suggestion: string;
  }> {
    const issues: Array<{ variable: string; issue: string; suggestion: string }> = [];

    variables.forEach(variable => {
      const name = variable.name;
      
      // Check for naming conventions
      if (variable.type === 'semaforo' && !name.toLowerCase().includes('flag') && !name.toLowerCase().includes('sem_')) {
        issues.push({
          variable: name,
          issue: 'Semaforo should include "flag" or "sem_" in name',
          suggestion: `Consider renaming to sem_${name.toLowerCase()} or ${name.toLowerCase()}_flag`
        });
      }
      
      if (variable.type === 'variable' && !name.toLowerCase().includes('count') && !name.toLowerCase().includes('num_')) {
        issues.push({
          variable: name,
          issue: 'Variable should include "count" or "num_" in name',
          suggestion: `Consider renaming to num_${name.toLowerCase()} or ${name.toLowerCase()}_count`
        });
      }
      
      // Check for unused variables
      if (variable.usage.length === 0) {
        issues.push({
          variable: name,
          issue: 'Variable is defined but never used',
          suggestion: 'Remove if not needed or check for typos in usage'
        });
      }
    });

    return issues;
  }
};
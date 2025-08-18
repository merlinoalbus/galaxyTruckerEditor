import { ScriptCommand, ParsedScript } from '@/types/CampaignEditor';

export const scriptParserService = {
  parseScriptContent(content: string, fileName: string, lang: string = 'EN'): ParsedScript[] {
    const scripts: ParsedScript[] = [];
    const lines = content.split('\n');
    let currentScript: Partial<ParsedScript> | null = null;
    let currentCommands: ScriptCommand[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('SCRIPT ')) {
        // Save previous script if exists
        if (currentScript && currentCommands.length > 0) {
          scripts.push({
            name: currentScript.name || '',
            fileName,
            language: lang,
            languages: [], // Campo richiesto
            commands: currentCommands,
            variables: currentScript.variables || [],
            characters: currentScript.characters || [],
            missions: currentScript.missions || [],
            labels: currentScript.labels || [],
            references: [],
            subScripts: [],
            nodes: [],
            relatedScripts: []
          });
        }
        
        // Start new script
        currentScript = {
          name: line.replace('SCRIPT ', '').trim(),
          variables: [],
          characters: [],
          missions: [],
          labels: []
        };
        currentCommands = [];
        
      } else if (line === 'END_OF_SCRIPT' || line === 'SCRIPTS') {
        // End current script
        if (currentScript && currentCommands.length > 0) {
          scripts.push({
            name: currentScript.name || '',
            fileName,
            language: lang,
            languages: [], // Campo richiesto
            commands: currentCommands,
            variables: currentScript.variables || [],
            characters: currentScript.characters || [],
            missions: currentScript.missions || [],
            labels: currentScript.labels || [],
            references: [],
            subScripts: [],
            nodes: [],
            relatedScripts: []
          });
        }
        currentScript = null;
        currentCommands = [];
        
      } else if (currentScript && line && !line.startsWith('#')) {
        // Parse command
        const command = this.parseCommand(line, i + 1);
        currentCommands.push(command);
        
        // Extract metadata from command
        this.extractMetadataFromCommand(command, currentScript);
      }
    }

    return scripts;
  },

  parseCommand(line: string, lineNumber: number): ScriptCommand {
    const trimmed = line.trim();
    const upperLine = trimmed.toUpperCase();
    
    let type = 'unknown';
    let parameters: Record<string, any> = {};
    let metadata: Record<string, string | number | string[]> = {};

    // Identify command type and extract parameters
    if (upperLine.startsWith('SHOWDLGSCENE')) {
      type = 'SHOWDLGSCENE';
      // No parameters for SHOWDLGSCENE
    } else if (upperLine.startsWith('HIDEDLGSCENE')) {
      type = 'HIDEDLGSCENE';
      // No parameters for HIDEDLGSCENE
    } else if (upperLine.startsWith('SHOWDLGTEXT')) {
      type = 'dialog_text';
      const match = trimmed.match(/ShowDlgText\s+"(.+)"/i);
      if (match) {
        parameters.text = { EN: match[1] };
      }
    } else if (upperLine.startsWith('SHOWDLGBUTTON')) {
      type = 'dialog_button';
      const match = trimmed.match(/ShowDlgButton\s+"(.+)"\s+(\w+)/i);
      if (match) {
        parameters.text = { EN: match[1] };
        parameters.action = match[2];
      }
    } else if (upperLine.startsWith('RUNSCRIPT')) {
      type = 'script_call';
      const match = trimmed.match(/RunScript\s+(\w+)/i);
      if (match) {
        parameters.scriptName = match[1];
      }
    } else if (upperLine.startsWith('SETVAR')) {
      type = 'variable_set';
      const match = trimmed.match(/SetVar\s+(\w+)\s+(.+)/i);
      if (match) {
        parameters.variable = match[1];
        parameters.value = match[2];
      }
    } else if (upperLine.startsWith('GETVAR')) {
      type = 'variable_get';
      const match = trimmed.match(/GetVar\s+(\w+)/i);
      if (match) {
        parameters.variable = match[1];
      }
    }

    return {
      type,
      line: lineNumber,
      content: trimmed,
      parameters,
      metadata
    };
  },

  extractMetadataFromCommand(command: ScriptCommand, script: Partial<ParsedScript>): void {
    const content = command.content.toLowerCase();
    
    // Extract variables
    const varMatches = content.match(/(?:setvar|getvar|checkvar)\s+(\w+)/g);
    if (varMatches) {
      varMatches.forEach(match => {
        const varName = match.split(/\s+/)[1];
        if (varName && !script.variables?.includes(varName)) {
          script.variables?.push(varName);
        }
      });
    }
    
    // Extract characters
    const charMatches = content.match(/showdlgscene\s+(\w+)/g);
    if (charMatches) {
      charMatches.forEach(match => {
        const charName = match.split(/\s+/)[1];
        if (charName && !script.characters?.includes(charName)) {
          script.characters?.push(charName);
        }
      });
    }
    
    // Extract mission references
    const missionMatches = content.match(/(?:mission|setmission|checkmission)\s+(\w+)/g);
    if (missionMatches) {
      missionMatches.forEach(match => {
        const missionName = match.split(/\s+/)[1];
        if (missionName && !script.missions?.includes(missionName)) {
          script.missions?.push(missionName);
        }
      });
    }
  }
};
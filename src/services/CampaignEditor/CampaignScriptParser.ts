import { 
  ScriptCommand, 
  ParsedScript, 
  ScriptBlock, 
  CampaignAnalysis 
} from '@/types/CampaignEditor';

export class CampaignScriptParser {
  private static instance: CampaignScriptParser;
  private analysis: CampaignAnalysis | null = null;

  static getInstance(): CampaignScriptParser {
    if (!CampaignScriptParser.instance) {
      CampaignScriptParser.instance = new CampaignScriptParser();
    }
    return CampaignScriptParser.instance;
  }

  async loadAndAnalyzeAllScripts(): Promise<CampaignAnalysis> {
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const scriptFiles = [
      'tutorials.txt',
      'scripts1.txt', 
      'scripts2.txt', 
      'scripts3.txt', 
      'scripts4.txt', 
      'scripts5.txt',
      'missions.txt',
      'inits.txt',
      'base_inits.txt',
      'ms_scripts.txt',
      'stdMissions.txt',
      'missions2.txt'
    ];

    const scripts: ParsedScript[] = [];
    const scriptMap = new Map<string, ParsedScript>();
    const scriptConnections = new Map<string, string[]>();
    const variables = new Set<string>(); // Legacy mixed
    const semafori = new Set<string>(); // Boolean semafori
    const realVariables = new Set<string>(); // Numeric variables
    const characters = new Set<string>();
    const missions = new Set<string>();
    const labels = new Set<string>();
    const nodeScriptMap = new Map<string, string[]>();
    const flowStructure = new Map<string, ScriptBlock[]>();

    // Load English as primary, then other languages for translation mapping
    for (const lang of languages) {
      for (const fileName of scriptFiles) {
        try {
          const response = await fetch(`http://localhost:3001/api/campaign/${fileName}?lang=${lang}`);
          if (response.ok) {
            const data = await response.json();
            const content = data.content || '';
            
            if (content.trim()) {
              const parsedScripts = this.parseScriptFile(content, fileName, lang);
              
              for (const script of parsedScripts) {
                // Primary language gets full analysis
                if (lang === 'EN') {
                  scripts.push(script);
                  scriptMap.set(script.name, script);
                  
                  // Extract variables, characters, etc. - Legacy (mixed)
                  script.variables.forEach(v => variables.add(v));
                  
                  // Separate semafori and variables based on command usage
                  script.commands.forEach(cmd => {
                    if (cmd.type === 'variable_set' || cmd.type === 'variable_reset') {
                      if (cmd.parameters?.variable) {
                        semafori.add(cmd.parameters.variable);
                      }
                    } else if (cmd.type === 'variable_set_to') {
                      if (cmd.parameters?.variable) {
                        realVariables.add(cmd.parameters.variable);
                      }
                    }
                  });
                  script.characters.forEach(c => characters.add(c));
                  script.missions.forEach(m => missions.add(m));
                  script.labels.forEach(l => labels.add(l));
                  script.nodes.forEach(n => {
                    if (!nodeScriptMap.has(n)) {
                      nodeScriptMap.set(n, []);
                    }
                    nodeScriptMap.get(n)!.push(script.name);
                  });

                  // Build flow structure
                  const blocks = this.buildScriptBlocks(script);
                  flowStructure.set(script.name, blocks);
                }
                
                // Store translations for other languages
                // (We'll implement translation matching later)
              }
            }
          }
        } catch (error) {
          console.warn(`Could not load ${fileName} for ${lang}:`, error);
        }
      }
    }

    // Analyze script connections
    for (const script of scripts) {
      const connections: string[] = [];
      
      // Find SUB_SCRIPT calls
      script.subScripts.forEach(subScript => {
        if (scriptMap.has(subScript)) {
          connections.push(subScript);
        }
      });

      // Find GO/LABEL references
      script.references.forEach(ref => {
        // Look for scripts that contain this label
        for (const [scriptName, otherScript] of scriptMap) {
          if (otherScript.labels.includes(ref) && scriptName !== script.name) {
            connections.push(scriptName);
          }
        }
      });

      scriptConnections.set(script.name, connections);
    }

    this.analysis = {
      scripts,
      scriptMap,
      scriptConnections,
      variables, // Legacy mixed
      semafori, // Boolean semafori
      realVariables, // Numeric variables
      characters,
      missions,
      labels,
      nodeScriptMap,
      flowStructure
    };

    return this.analysis;
  }

  private parseScriptFile(content: string, fileName: string, language: string): ParsedScript[] {
    const scripts: ParsedScript[] = [];
    const lines = content.split('\n');
    let currentScript: Partial<ParsedScript> | null = null;
    let currentCommands: ScriptCommand[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('SCRIPT ')) {
        // Save previous script
        if (currentScript) {
          scripts.push(this.finalizeScript(currentScript, currentCommands));
        }
        
        // Start new script
        const scriptName = line.replace('SCRIPT ', '').trim();
        currentScript = {
          name: scriptName,
          fileName,
          language,
          labels: [],
          references: [],
          subScripts: [],
          missions: [],
          variables: [],
          characters: [],
          nodes: [],
          relatedScripts: []
        };
        currentCommands = [];
        
      } else if (line === 'END_OF_SCRIPT') {
        // End current script
        if (currentScript) {
          scripts.push(this.finalizeScript(currentScript, currentCommands));
          currentScript = null;
          currentCommands = [];
        }
        
      } else if (currentScript && line && !line.startsWith('SCRIPTS')) {
        // Parse command
        const command = this.parseCommand(line, i + 1);
        currentCommands.push(command);
        
        // Extract metadata
        this.extractCommandMetadata(command, currentScript);
      }
    }

    return scripts;
  }

  private parseCommand(line: string, lineNumber: number): ScriptCommand {
    const trimmed = line.trim();
    const upperLine = trimmed.toUpperCase();
    
    let type = 'unknown';
    let parameters: any = {};
    let metadata: any = {};

    // Identify command type and extract parameters
    if (upperLine.startsWith('SHOWDLGSCENE')) {
      type = 'dialog_start';
    } else if (upperLine.startsWith('HIDEDLGSCENE')) {
      type = 'dialog_end';
    } else if (upperLine.startsWith('SHOWCHAR ')) {
      type = 'show_character';
      const parts = trimmed.split(' ');
      parameters = {
        character: parts[1],
        position: parts[2] || 'center'
      };
    } else if (upperLine.startsWith('HIDECHAR')) {
      type = 'hide_character';
      const parts = trimmed.split(' ');
      parameters = {
        character: parts[1] || 'current'
      };
    } else if (upperLine.startsWith('CHANGECHAR ')) {
      type = 'change_character';
      const parts = trimmed.split(' ');
      parameters = {
        character: parts[1],
        image: parts[2]
      };
    } else if (upperLine.startsWith('SAY ')) {
      type = 'dialogue';
      parameters = {
        text: trimmed.substring(4).replace(/^"|"$/g, '')
      };
    } else if (upperLine.startsWith('ASK ')) {
      type = 'question';
      parameters = {
        text: trimmed.substring(4).replace(/^"|"$/g, '')
      };
    } else if (upperLine.startsWith('MENU')) {
      type = 'menu_start';
    } else if (upperLine.startsWith('END_OF_MENU')) {
      type = 'menu_end';
    } else if (upperLine.startsWith('OPT ')) {
      type = 'menu_option';
      parameters = {
        text: trimmed.substring(4).replace(/^"|"$/g, '')
      };
    } else if (upperLine.startsWith('OPT_IF ')) {
      type = 'menu_option_conditional';
      const match = trimmed.match(/OPT_IF\s+(\w+)\s+"(.+)"/);
      if (match) {
        parameters = {
          condition: match[1],
          text: match[2]
        };
      }
    } else if (upperLine.startsWith('OPT_IFNOT ')) {
      type = 'menu_option_conditional_not';
      const match = trimmed.match(/OPT_IFNOT\s+(\w+)\s+"(.+)"/);
      if (match) {
        parameters = {
          condition: match[1],
          text: match[2]
        };
      }
    } else if (upperLine.startsWith('END_OF_OPT')) {
      type = 'menu_option_end';
    } else if (upperLine.startsWith('EXIT_MENU')) {
      type = 'menu_exit';
    } else if (upperLine.startsWith('IF_TUTORIAL_SEEN')) {
      type = 'condition_predefined';
      parameters = {
        predefinedType: 'IF_TUTORIAL_SEEN',
        condition: 'IF_TUTORIAL_SEEN'
      };
    } else if (upperLine.startsWith('IF_FROM_CAMPAIGN')) {
      type = 'condition_predefined';
      parameters = {
        predefinedType: 'IF_FROM_CAMPAIGN',
        condition: 'IF_FROM_CAMPAIGN'
      };
    } else if (upperLine.startsWith('IF_DEBUG')) {
      type = 'condition_predefined';
      parameters = {
        predefinedType: 'IF_DEBUG',
        condition: 'IF_DEBUG'
      };
    } else if (upperLine.startsWith('IF_MISSION_WON')) {
      type = 'condition_predefined';
      parameters = {
        predefinedType: 'IF_MISSION_WON',
        condition: 'IF_MISSION_WON'
      };
    } else if (upperLine.startsWith('IF_PROB ')) {
      type = 'condition_predefined';
      const probValue = trimmed.substring(8).trim();
      parameters = {
        predefinedType: 'IF_PROB',
        condition: 'IF_PROB',
        probability: probValue
      };
    } else if (upperLine.startsWith('IF_MIN ')) {
      type = 'condition_predefined';
      const parts = trimmed.substring(7).trim().split(' ');
      const variable = parts[0];
      const minValue = parts.slice(1).join(' ');
      parameters = {
        predefinedType: 'IF_MIN',
        condition: 'IF_MIN',
        variable: variable,
        minValue: minValue
      };
    } else if (upperLine.startsWith('IF_MAX ')) {
      type = 'condition_predefined';
      const parts = trimmed.substring(7).trim().split(' ');
      const variable = parts[0];
      const maxValue = parts.slice(1).join(' ');
      parameters = {
        predefinedType: 'IF_MAX',
        condition: 'IF_MAX',
        variable: variable,
        maxValue: maxValue
      };
    } else if (upperLine.startsWith('IF_IS ')) {
      type = 'condition_predefined';
      const parts = trimmed.substring(6).trim().split(' ');
      const variable = parts[0];
      const exactValue = parts.slice(1).join(' ');
      parameters = {
        predefinedType: 'IF_IS',
        condition: 'IF_IS',
        variable: variable,
        exactValue: exactValue
      };
    } else if (upperLine.startsWith('IF_HAS_CREDITS ')) {
      type = 'condition_predefined';
      const creditsAmount = trimmed.substring(15).trim();
      parameters = {
        predefinedType: 'IF_HAS_CREDITS',
        condition: 'IF_HAS_CREDITS',
        creditsAmount: creditsAmount
      };
    } else if (upperLine.startsWith('IF_ORDER ')) {
      type = 'condition_predefined';
      const parts = trimmed.substring(9).trim().split(' ');
      const playerIndex = parts[0];
      const positionValue = parts.slice(1).join(' ');
      parameters = {
        predefinedType: 'IF_ORDER',
        condition: 'IF_ORDER',
        playerIndex: playerIndex,
        positionValue: positionValue
      };
    } else if (upperLine.startsWith('IF ')) {
      type = 'condition_start';
      parameters = {
        condition: trimmed.substring(3).trim()
      };
    } else if (upperLine.startsWith('IFNOT ')) {
      type = 'condition_start_not';
      parameters = {
        condition: trimmed.substring(6).trim()
      };
    } else if (upperLine.startsWith('ELSE')) {
      type = 'condition_else';
    } else if (upperLine.startsWith('END_OF_IF')) {
      type = 'condition_end';
    } else if (upperLine.startsWith('SET ')) {
      type = 'variable_set';
      parameters = {
        variable: trimmed.substring(4).trim()
      };
    } else if (upperLine.startsWith('RESET ')) {
      type = 'variable_reset';
      parameters = {
        variable: trimmed.substring(6).trim()
      };
    } else if (upperLine.startsWith('SET_TO ')) {
      type = 'variable_set_to';
      const parts = trimmed.substring(7).trim().split(' ');
      parameters = {
        variable: parts[0] || 'newVariable',
        value: parts.slice(1).join(' ') || '0'
      };
    } else if (upperLine.startsWith('DELAY ')) {
      type = 'delay';
      parameters = {
        milliseconds: parseInt(trimmed.substring(6).trim()) || 0
      };
    } else if (upperLine.startsWith('LABEL ')) {
      type = 'label';
      parameters = {
        name: trimmed.substring(6).trim()
      };
    } else if (upperLine.startsWith('GO ')) {
      type = 'goto';
      parameters = {
        target: trimmed.substring(3).trim()
      };
    } else if (upperLine.startsWith('SUB_SCRIPT ')) {
      type = 'subscript';
      parameters = {
        scriptName: trimmed.substring(11).trim()
      };
    } else if (upperLine.startsWith('ACT_MISSION ')) {
      type = 'start_mission';
      parameters = {
        missionName: trimmed.substring(12).trim()
      };
    } else if (upperLine.startsWith('SETCREDITS ')) {
      type = 'set_credits';
      parameters = {
        amount: parseInt(trimmed.substring(11).trim()) || 0
      };
    } else if (upperLine.startsWith('CENTERMAPBYNODE ')) {
      type = 'center_map';
      parameters = {
        nodeName: trimmed.substring(16).trim()
      };
    } else if (upperLine.startsWith('ADDINFOWINDOW ')) {
      type = 'add_info_window';
      parameters = {
        image: trimmed.substring(14).trim()
      };
    } else if (upperLine.startsWith('SHOWINFOWINDOW')) {
      type = 'show_info_window';
    } else if (upperLine.startsWith('SETFLIGHTSTATUSBAR ')) {
      type = 'status_bar';
      parameters = {
        message: trimmed.substring(19).replace(/^"|"$/g, '')
      };
    }

    return {
      line: lineNumber,
      content: trimmed,
      type,
      parameters,
      metadata
    };
  }

  private extractCommandMetadata(command: ScriptCommand, script: Partial<ParsedScript>) {
    switch (command.type) {
      case 'show_character':
      case 'change_character':
        if (command.parameters?.character) {
          script.characters!.push(command.parameters.character);
        }
        break;
        
      case 'variable_set':
      case 'variable_reset':
      case 'variable_set_to':
        if (command.parameters?.variable) {
          script.variables!.push(command.parameters.variable);
        }
        break;
        
      case 'label':
        if (command.parameters?.name) {
          script.labels!.push(command.parameters.name);
        }
        break;
        
      case 'goto':
        if (command.parameters?.target) {
          script.references!.push(command.parameters.target);
        }
        break;
        
      case 'subscript':
        if (command.parameters?.scriptName) {
          script.subScripts!.push(command.parameters.scriptName);
        }
        break;
        
      case 'start_mission':
        if (command.parameters?.missionName) {
          script.missions!.push(command.parameters.missionName);
        }
        break;
        
      case 'center_map':
        if (command.parameters?.nodeName) {
          script.nodes!.push(command.parameters.nodeName);
        }
        break;
    }
  }

  private finalizeScript(script: Partial<ParsedScript>, commands: ScriptCommand[]): ParsedScript {
    return {
      name: script.name || '',
      fileName: script.fileName || '',
      language: script.language || 'EN',
      commands,
      labels: [...new Set(script.labels || [])],
      references: [...new Set(script.references || [])],
      subScripts: [...new Set(script.subScripts || [])],
      missions: [...new Set(script.missions || [])],
      variables: [...new Set(script.variables || [])],
      characters: [...new Set(script.characters || [])],
      nodes: [...new Set(script.nodes || [])],
      relatedScripts: []
    };
  }

  private buildScriptBlocks(script: ParsedScript): ScriptBlock[] {
    const blocks: ScriptBlock[] = [];
    const stack: ScriptBlock[] = [];
    let blockIdCounter = 0;

    for (let i = 0; i < script.commands.length; i++) {
      const command = script.commands[i];
      const blockId = `${script.name}_block_${blockIdCounter++}`;

      let block: ScriptBlock = {
        id: blockId,
        type: command.type,
        content: command.content,
        startLine: command.line,
        parameters: command.parameters || {},
        metadata: {
          scriptName: script.name,
          fileName: script.fileName
        }
      };

      // Handle container blocks
      if (this.isContainerStart(command.type)) {
        block.children = [];
        
        if (stack.length > 0) {
          const parent = stack[stack.length - 1];
          parent.children!.push(block);
          block.parent = parent.id;
        } else {
          blocks.push(block);
        }
        
        stack.push(block);
        
      } else if (this.isContainerEnd(command.type)) {
        if (stack.length > 0) {
          const containerBlock = stack.pop()!;
          containerBlock.endLine = command.line;
        }
        
      } else {
        // Regular command
        if (stack.length > 0) {
          const parent = stack[stack.length - 1];
          parent.children!.push(block);
          block.parent = parent.id;
        } else {
          blocks.push(block);
        }
      }
    }

    return blocks;
  }

  private isContainerStart(type: string): boolean {
    return [
      'dialog_start',
      'menu_start',
      'menu_option',
      'condition_start',
      'condition_start_not',
      'condition_predefined'
    ].includes(type);
  }

  private isContainerEnd(type: string): boolean {
    return [
      'dialog_end',
      'menu_end',
      'menu_option_end',
      'condition_end',
      'condition_else'
    ].includes(type);
  }

  getAnalysis(): CampaignAnalysis | null {
    return this.analysis;
  }

  getScriptsByNode(nodeName: string): ParsedScript[] {
    if (!this.analysis) return [];
    
    const scriptNames = this.analysis.nodeScriptMap.get(nodeName) || [];
    return scriptNames.map(name => this.analysis!.scriptMap.get(name)!).filter(Boolean);
  }

  getConnectedScripts(scriptName: string): ParsedScript[] {
    if (!this.analysis) return [];
    
    const connections = this.analysis.scriptConnections.get(scriptName) || [];
    return connections.map(name => this.analysis!.scriptMap.get(name)!).filter(Boolean);
  }

  getScriptFlow(scriptName: string): ScriptBlock[] {
    if (!this.analysis) return [];
    
    return this.analysis.flowStructure.get(scriptName) || [];
  }

  getAllVariables(): string[] {
    if (!this.analysis) return [];
    return Array.from(this.analysis.variables);
  }

  getAllCharacters(): string[] {
    if (!this.analysis) return [];
    return Array.from(this.analysis.characters);
  }

  getAllMissions(): string[] {
    if (!this.analysis) return [];
    return Array.from(this.analysis.missions);
  }
}
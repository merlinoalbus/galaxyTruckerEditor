import * as yaml from 'js-yaml';
import { Mission, DeckScript, DeckCommand, ValidationError, FlightEvaluation, InfoBoard } from '../types/GameTypes';

export class FileParser {
  
  // Parser per file di missione YAML
  static parseMissionYAML(content: string): Mission {
    try {
      const data = yaml.load(content) as Record<string, unknown>;
      
      const mission: Mission = {
        name: (data.name as string) || '',
        missionID: (data.missionID as number) || 0,
        description: data.description as string,
        gameType: data.gameType as 'realtime' | 'turnbased' | undefined,
        flightsAvailableToChange: (data.fligthsAvailabelToChange as ('STI' | 'STII' | 'STIII')[]) || (data.flightsAvailableToChange as ('STI' | 'STII' | 'STIII')[]) || ['STI', 'STII', 'STIII'],
        flightsPicked: (data.flightsPicked as ('STI' | 'STII' | 'STIII')[]) || ['STI'],
        playersCount: Array.isArray(data.playersCount) && data.playersCount.length >= 2 ? [data.playersCount[0] as number, data.playersCount[1] as number] : [2, 4],
        shipPlans: (data.shipPlans as string[]) || ['I', 'II', 'III'],
        pileConfigSTI: data.pileConfigSTI as string,
        pileConfigSTII: data.pileConfigSTII as string,
        pileConfigSTIII: data.pileConfigSTIII as string,
        universalDeckScript: data.universalDeckScript as string,
        customDeckScript: data.customDeckScript as string,
        evaluation: data.evaluation as FlightEvaluation,
        infoBoards: data.InfoBoards as InfoBoard[],
        comments: this.extractComments(content)
      };
      
      return mission;
    } catch (error) {
      throw new Error(`Errore parsing missione: ${error}`);
    }
  }

  // Serializza una missione in YAML
  static serializeMissionYAML(mission: Mission): string {
  // yamlData non utilizzato: costruzione YAML avviene manualmente

    // Aggiungi commenti descrittivi
    let yamlString = `name: "${mission.name}"                    # id of mission name string - localized \n`;
    yamlString += `missionID: ${mission.missionID}                                    # serial number of the mission\n\n`;
    
    if (mission.comments) {
      yamlString += `\n# ${mission.description || 'Mission Description'}\n\n`;
      if (mission.comments.ships) yamlString += `# ships: ${mission.comments.ships}\n`;
      if (mission.comments.rules) yamlString += `# rules: ${mission.comments.rules}\n`;
      if (mission.comments.tiles) yamlString += `# tiles: ${mission.comments.tiles}\n`;
      if (mission.comments.cards) yamlString += `# cards: ${mission.comments.cards}\n`;
      yamlString += '\n\n';
    }

    // Aggiungi gameType se specificato
    if (mission.gameType) {
      yamlString += `    gameType: ${mission.gameType}                                  # Values: realtime/turnbased\n\n`;
    } else {
      yamlString += `    #gameType:                                  # Values: realtime/turnbased; If mentioned this value can not be changed in a lobby by player.\n\n`;
    }

    // Flights
    yamlString += `fligthsAvailabelToChange: [${mission.flightsAvailableToChange.join(', ')}]    # Which flights can be turned on/off in a lobby by player\n`;
    yamlString += `flightsPicked: [${mission.flightsPicked.join(', ')}]\n\n`;
    
    // Players count
    yamlString += `playersCount: [${mission.playersCount[0]}, ${mission.playersCount[1]}]                            # [min, max]. Default is [2, 4]\n\n`;
    
    // Ships
    yamlString += `# ==== SHIPS ====                               # Names of all available ship plans\n`;
    yamlString += `shipPlans: [${mission.shipPlans.join(', ')}]\n\n`;
    
    // Tiles
    yamlString += `# ==== TILES ===                                # Config file with list of all parts\n`;
    if (mission.pileConfigSTI) yamlString += `pileConfigSTI:   ${mission.pileConfigSTI}\n`;
    if (mission.pileConfigSTII) yamlString += `pileConfigSTII:  ${mission.pileConfigSTII}\n`;
    if (mission.pileConfigSTIII) yamlString += `pileConfigSTIII: ${mission.pileConfigSTIII}\n`;
    yamlString += '\n';
    
    // Cards
    yamlString += `# ==== CARDS ===\n`;
    if (mission.universalDeckScript) {
      yamlString += `universalDeckScript: ${mission.universalDeckScript}       # Used as digital and rough\n`;
    }
    if (mission.customDeckScript) {
      yamlString += `    customDeckScript: ${mission.customDeckScript}                          # Special custom deck\n`;
    }
    yamlString += '\n\n';
    
    // Rules/Evaluation
    if (mission.evaluation && typeof mission.evaluation === 'object') {
      yamlString += `# ==== RULES ====                               # Scoring rules for each flight\n`;
      yamlString += `evaluation:\n`;
      Object.entries(mission.evaluation).forEach(([flight, rules]) => {
        if (rules && typeof rules === 'object') {
          yamlString += `  ${flight}:\n`;
          Object.entries(rules).forEach(([rule, value]) => {
            yamlString += `    ${rule}: ${value}\n`;
          });
        }
      });
      yamlString += '\n';
    }
    
    // Info Boards
    if (mission.infoBoards && Array.isArray(mission.infoBoards)) {
      yamlString += `# ==== Infoboards ====\n`;
      yamlString += `InfoBoards:\n`;
      mission.infoBoards.forEach(board => {
        if (board && board.default && Array.isArray(board.default)) {
          yamlString += `  - default: [${board.default.join(', ')}]\n`;
        }
      });
    }

    return yamlString;
  }

  // Parser per deck script
  static parseDeckScript(content: string): DeckScript {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
    const commands: DeckCommand[] = [];
    let scriptName = 'Unnamed Script';

    for (const line of lines) {
      if (line.startsWith('SCRIPT ')) {
        scriptName = line.replace('SCRIPT ', '');
        continue;
      }

      if (line.startsWith('TmpDeckLoad ')) {
        const deckFile = line.replace('TmpDeckLoad ', '').replace(/"/g, '');
        commands.push({
          type: 'TmpDeckLoad',
          deckFile
        });
      } else if (line.startsWith('DeckAddCardType ')) {
        const parts = line.replace('DeckAddCardType ', '').split(' ');
        commands.push({
          type: 'DeckAddCardType',
          flight: parseInt(parts[0]),
          cardType: parts[1],
          count: parseInt(parts[2])
        });
      }
    }

    return { name: scriptName, commands };
  }

  // Serializza deck script
  static serializeDeckScript(script: DeckScript): string {
    let content = 'SCRIPTS\n\n';
    content += `  SCRIPT ${script.name}\n`;
    
    script.commands.forEach(cmd => {
      if (cmd.type === 'TmpDeckLoad') {
        content += `    TmpDeckLoad "${cmd.deckFile}"\n`;
      } else if (cmd.type === 'DeckAddCardType') {
        content += `\tDeckAddCardType ${cmd.flight} ${cmd.cardType} ${cmd.count}\n`;
      }
    });

    return content;
  }

  // Estrai commenti dal file YAML
  static extractComments(content: string): { ships?: string; rules?: string; tiles?: string; cards?: string } {
    const lines = content.split('\n');
    const comments: { ships?: string; rules?: string; tiles?: string; cards?: string } = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ships:')) {
        comments.ships = trimmed.replace('# ships:', '').trim();
      } else if (trimmed.startsWith('# rules:')) {
        comments.rules = trimmed.replace('# rules:', '').trim();
      } else if (trimmed.startsWith('# tiles:')) {
        comments.tiles = trimmed.replace('# tiles:', '').trim();
      } else if (trimmed.startsWith('# cards:')) {
        comments.cards = trimmed.replace('# cards:', '').trim();
      }
    }
    
    return comments;
  }

  // Valida una missione
  static validateMission(mission: Mission): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!mission.name) {
      errors.push({ field: 'name', message: 'Nome missione richiesto', severity: 'error' });
    }

    if (!mission.missionID || mission.missionID < 1) {
      errors.push({ field: 'missionID', message: 'ID missione deve essere maggiore di 0', severity: 'error' });
    }

    if (mission.playersCount[0] < 2) {
      errors.push({ field: 'playersCount', message: 'Minimo 2 giocatori richiesti', severity: 'error' });
    }

    if (mission.playersCount[1] > 4) {
      errors.push({ field: 'playersCount', message: 'Massimo 4 giocatori supportati', severity: 'warning' });
    }

    if (mission.flightsPicked.length === 0) {
      errors.push({ field: 'flightsPicked', message: 'Almeno un volo deve essere selezionato', severity: 'error' });
    }

    return errors;
  }

  // Rileva metacodici nel testo
  static detectMetacodes(text: string): string[] {
    const metacodePattern = /\[([^\]]+)\]/g;
    const matches = text.match(metacodePattern) || [];
    return Array.from(new Set(matches));
  }

  // Sostituisce metacodici con valori di esempio
  static replaceMetacodes(text: string, values: Record<string, string>): string {
    let result = text;
    Object.entries(values).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
    });
    return result;
  }
}
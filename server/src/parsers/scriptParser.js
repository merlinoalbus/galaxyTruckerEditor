// scriptParser.js - Parser per gli script di Galaxy Trucker
const fs = require('fs-extra');
const path = require('path');

// Funzioni di parsing degli script
function parseScriptContent(content, fileName, lang) {
  const scripts = [];
  const lines = content.split('\n');
  let currentScript = null;
  let currentCommands = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('SCRIPT ')) {
      // Save previous script
      if (currentScript && currentCommands.length > 0) {
        scripts.push({
          ...currentScript,
          commands: currentCommands
        });
      }
      
      // Start new script
      currentScript = {
        name: line.replace('SCRIPT ', '').trim(),
        fileName,
        language: lang,
        variables: [],
        characters: [],
        missions: [],
        labels: [],
        nodes: []
      };
      currentCommands = [];
      
    } else if (line === 'END_OF_SCRIPT' || line === 'SCRIPTS') {
      // End current script
      if (currentScript && currentCommands.length > 0) {
        scripts.push({
          ...currentScript,
          commands: currentCommands
        });
      }
      currentScript = null;
      currentCommands = [];
      
    } else if (currentScript && line && !line.startsWith('#')) {
      // Parse command
      const command = parseCommand(line, i + 1);
      currentCommands.push(command);
      
      // Extract metadata
      extractMetadataFromCommand(command, currentScript);
    }
  }

  return scripts;
}

function parseCommand(line, lineNumber) {
  const trimmed = line.trim();
  const upperLine = trimmed.toUpperCase();
  
  let type = 'unknown';
  let parameters = {};

  // Block elements (container commands)
  if (upperLine.startsWith('IF ')) {
    type = 'conditional_start';
    parameters = { condition: trimmed.substring(3).trim() };
  } else if (upperLine === 'END_OF_IF') {
    type = 'conditional_end';
  } else if (upperLine === 'ELSE') {
    type = 'else';
  } else if (upperLine.startsWith('IF_PROB ')) {
    type = 'conditional_start';
    parameters = { type: 'probability', percentage: parseInt(trimmed.split(' ')[1]) };
  } else if (upperLine.startsWith('IFNOT ')) {
    type = 'conditional_start';
    parameters = { type: 'semaforo_not', semaforo: trimmed.split(' ')[1] };
  } else if (upperLine.startsWith('IF_IS ')) {
    type = 'conditional_start';
    const parts = trimmed.split(' ');
    parameters = { type: 'variable_equals', variable: parts[1], value: parts[2] };
  } else if (upperLine.startsWith('IF_DEBUG')) {
    type = 'conditional_start';
    parameters = { type: 'debug_mode' };
  } else if (upperLine.startsWith('IF_FROM_CAMPAIGN')) {
    type = 'conditional_start';
    parameters = { type: 'from_campaign' };
  } else if (upperLine.startsWith('IF_HAS_CREDITS ')) {
    type = 'conditional_start';
    parameters = { type: 'has_credits', amount: parseInt(trimmed.split(' ')[1]) };
  } else if (upperLine.startsWith('IF_MIN ')) {
    type = 'conditional_start';
    const parts = trimmed.split(' ');
    parameters = { type: 'variable_min', variable: parts[1], value: parseInt(parts[2]) };
  } else if (upperLine.startsWith('IF_MAX ')) {
    type = 'conditional_start';
    const parts = trimmed.split(' ');
    parameters = { type: 'variable_max', variable: parts[1], value: parseInt(parts[2]) };
  } else if (upperLine.startsWith('IF_MISSION_WON')) {
    type = 'conditional_start';
    parameters = { type: 'mission_won' };
  } else if (upperLine.startsWith('IF_TUTORIAL_SEEN')) {
    type = 'conditional_start';
    parameters = { type: 'tutorial_seen' };
  } else if (upperLine.startsWith('IF_ORDER ')) {
    type = 'conditional_start';
    const positionsStr = trimmed.substring(9).trim();
    const positions = positionsStr.split(' ').map(p => parseInt(p)).filter(p => !isNaN(p));
    parameters = { type: 'order_check', positions: positions };
  } else if (upperLine.startsWith('IFMISSIONRESULTIS ')) {
    type = 'conditional_start';
    const result = parseInt(trimmed.split(' ')[1]);
    parameters = { type: 'mission_result_equals', result: result };
  } else if (upperLine.startsWith('IFMISSIONRESULTMIN ')) {
    type = 'conditional_start';
    const result = parseInt(trimmed.split(' ')[1]);
    parameters = { type: 'mission_result_min', result: result };
  } else if (upperLine.startsWith('SUB_SCRIPT ')) {
    type = 'subscript_start';
    parameters = { script: trimmed.substring(11).trim() };
  } else if (upperLine === 'END_SUB_SCRIPT') {
    type = 'subscript_end';
    
  // Menu commands
  } else if (upperLine.startsWith('MENU')) {
    type = 'menu_start';
  } else if (upperLine.startsWith('END_OF_MENU')) {
    type = 'menu_end';
  } else if (upperLine.startsWith('OPT ')) {
    type = 'menu_option';
    parameters = {
      text: trimmed.substring(4).replace(/^"|"$/g, ''),
      isLocalizable: true
    };
  } else if (upperLine === 'END_OF_OPT') {
    type = 'menu_option_end';
  } else if (upperLine.startsWith('OPT_IF ')) {
    type = 'menu_option_conditional';
    const match = trimmed.match(/OPT_IF\s+(\w+)\s+"(.+)"/);
    if (match) {
      parameters = {
        condition: match[1],
        text: match[2],
        isLocalizable: true
      };
    }
  } else if (upperLine.startsWith('OPT_IFNOT ')) {
    type = 'menu_option_conditional';
    const match = trimmed.match(/OPT_IFNOT\s+(\w+)\s+"(.+)"/);
    if (match) {
      parameters = {
        condition: match[1],
        conditionType: 'not',
        text: match[2],
        isLocalizable: true
      };
    }
  } else if (upperLine === 'EXIT_MENU') {
    type = 'menu_exit';

  // Mission blocks
  } else if (upperLine.startsWith('MISSION ')) {
    type = 'mission_start';
    parameters = { mission: trimmed.substring(8).trim() };
  } else if (upperLine === 'END_OF_MISSION') {
    type = 'mission_end';
  } else if (upperLine === 'FINISH_MISSION') {
    type = 'mission_finish';
  } else if (upperLine === 'INIT_BUILD') {
    type = 'mission_init_build';
  } else if (upperLine === 'START_BUILDING') {
    type = 'mission_start_building';
  } else if (upperLine === 'END_BUILDING') {
    type = 'mission_end_building';
  } else if (upperLine === 'INIT_FLIGHT') {
    type = 'mission_init_flight';
  } else if (upperLine === 'START_FLIGHT') {
    type = 'mission_start_flight';
  } else if (upperLine === 'EVALUATE_FLIGHT') {
    type = 'mission_evaluate_flight';
  } else if (upperLine === 'END_FLIGHT') {
    type = 'mission_end_flight';

  // Character commands
  } else if (upperLine.startsWith('SHOWCHAR ')) {
    type = 'show_character';
    const parts = trimmed.split(' ');
    parameters = {
      character: parts[1],
      position: parts[2] || 'center',
      image: parts[3] || 'default'
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
  } else if (upperLine.startsWith('FOCUSCHAR ')) {
    type = 'focus_character';
    const parts = trimmed.split(' ');
    parameters = {
      character: parts[1]
    };
  
  // Dialog scene management
  } else if (upperLine === 'SHOWDLGSCENE') {
    type = 'dialog_scene_open';
  } else if (upperLine === 'HIDEDLGSCENE') {
    type = 'dialog_scene_close';
  
  // Dialogue commands
  } else if (upperLine.startsWith('SAY ')) {
    type = 'dialogue';
    parameters = {
      text: trimmed.substring(4).replace(/^"|"$/g, ''),
      isLocalizable: true
    };
  } else if (upperLine.startsWith('SAYCHAR ')) {
    type = 'dialogue';
    const parts = trimmed.split(' ');
    const character = parts[1];
    const text = trimmed.substring(trimmed.indexOf('"')).replace(/^"|"$/g, '');
    parameters = {
      character: character,
      text: text,
      isLocalizable: true
    };
  } else if (upperLine.startsWith('ASK ')) {
    type = 'question';
    parameters = {
      text: trimmed.substring(4).replace(/^"|"$/g, ''),
      isLocalizable: true
    };
  } else if (upperLine.startsWith('ASKCHAR ')) {
    type = 'question';
    const parts = trimmed.split(' ');
    const character = parts[1];
    const text = trimmed.substring(trimmed.indexOf('"')).replace(/^"|"$/g, '');
    parameters = {
      character: character,
      text: text,
      isLocalizable: true
    };
  } else if (upperLine.startsWith('ANNOUNCE ')) {
    type = 'announce';
    parameters = {
      text: trimmed.substring(9).replace(/^"|"$/g, ''),
      isLocalizable: true
    };
  } else if (upperLine.startsWith('SETFLIGHTSTATUSBAR ')) {
    type = 'flight_status_bar';
    parameters = {
      text: trimmed.substring(19).replace(/^"|"$/g, ''),
      isLocalizable: true
    };
  
  // Variable commands
  } else if (upperLine.startsWith('SET ')) {
    type = 'semaforo_set';
    const parts = trimmed.split(' ');
    parameters = {
      variable: parts[1]
    };
  } else if (upperLine.startsWith('RESET ')) {
    type = 'semaforo_reset';
    const parts = trimmed.split(' ');
    parameters = {
      variable: parts[1]
    };
  } else if (upperLine.startsWith('SET_TO ')) {
    type = 'variable_set';
    const parts = trimmed.split(' ');
    parameters = {
      variable: parts[1],
      value: parts[2]
    };
  } else if (upperLine.startsWith('ADD ')) {
    type = 'variable_add';
    const parts = trimmed.split(' ');
    parameters = {
      variable: parts[1],
      value: parts[2]
    };
  
  // Flow control
  } else if (upperLine.startsWith('LABEL ')) {
    type = 'label';
    parameters = {
      label: trimmed.substring(6).trim()
    };
  } else if (upperLine.startsWith('GO ')) {
    type = 'goto';
    parameters = {
      label: trimmed.substring(3).trim()
    };
  } else if (upperLine.startsWith('SUB_SCRIPT ')) {
    type = 'script_call';
    parameters = {
      script: trimmed.substring(11).trim()
    };
  } else if (upperLine === 'RETURN') {
    type = 'return';

  // Timing commands
  } else if (upperLine.startsWith('DELAY ')) {
    type = 'delay';
    parameters = {
      milliseconds: parseInt(trimmed.split(' ')[1])
    };
  // Map and path commands
  } else if (upperLine.startsWith('SHOWPATH ')) {
    type = 'show_path';
    parameters = {
      path: trimmed.substring(9).trim()
    };
  } else if (upperLine.startsWith('HIDEPATH ')) {
    type = 'hide_path';
    parameters = {
      path: trimmed.substring(9).trim()
    };
  } else if (upperLine.startsWith('CENTERMAPBYNODE ')) {
    type = 'center_map_by_node';
    parameters = {
      node: trimmed.substring(16).trim()
    };
  } else if (upperLine.startsWith('CENTERMAPBYPATH ')) {
    type = 'center_map_by_path';
    parameters = {
      path: trimmed.substring(16).trim()
    };
  } else if (upperLine.startsWith('SHOWNODE ')) {
    type = 'show_node';
    parameters = {
      node: trimmed.substring(9).trim()
    };
  } else if (upperLine.startsWith('HIDENODE ')) {
    type = 'hide_node';
    parameters = {
      node: trimmed.substring(9).trim()
    };
  } else if (upperLine.startsWith('HIDEALLPATHS ')) {
    type = 'hide_all_paths';
    const parts = trimmed.split(' ');
    parameters = {
      node1: parts[1],
      node2: parts[2]
    };
  } else if (upperLine.startsWith('SHOWBUTTON ')) {
    type = 'show_button';
    parameters = {
      button: trimmed.substring(11).trim()
    };
  } else if (upperLine.startsWith('HIDEBUTTON ')) {
    type = 'hide_button';
    parameters = {
      button: trimmed.substring(11).trim()
    };
  } else if (upperLine.startsWith('MOVEPLAYERTONODE ')) {
    type = 'move_player_to_node';
    parameters = {
      node: trimmed.substring(17).trim()
    };

  // Mission commands
  } else if (upperLine.startsWith('ADDOPPONENT ')) {
    type = 'add_opponent';
    parameters = {
      character: trimmed.substring(12).trim()
    };
  } else if (upperLine.startsWith('ADDOPPONENTSCREDITS ')) {
    type = 'add_opponent_credits';
    const parts = trimmed.split(' ');
    parameters = {
      index: parseInt(parts[1]),
      credits: parseInt(parts[2])
    };
  } else if (upperLine.startsWith('MODIFYOPPONENTSBUILDSPEED ')) {
    type = 'modify_opponents_build_speed';
    const parts = trimmed.split(' ');
    parameters = {
      percentage: parseInt(parts[1])
    };
  } else if (upperLine.startsWith('SETSHIPTYPE ')) {
    type = 'set_ship_type';
    const parts = trimmed.split(' ');
    parameters = {
      type: parts[1]
    };
  } else if (upperLine.startsWith('SETDECKPREPARATIONSCRIPT ')) {
    type = 'set_deck_preparation_script';
    parameters = {
      script: trimmed.substring(25).trim()
    };
  } else if (upperLine.startsWith('SETFLIGHTDECKPREPARATIONSCRIPT ')) {
    type = 'set_flight_deck_preparation_script';
    parameters = {
      script: trimmed.substring(31).trim()
    };
  } else if (upperLine.startsWith('ACT_MISSION ')) {
    type = 'act_mission';
    parameters = {
      mission: trimmed.substring(12).trim()
    };
  } else if (upperLine === 'SETTURNBASED') {
    type = 'set_turn_based';
    
  // Credits commands
  } else if (upperLine.startsWith('ADDCREDITS ')) {
    type = 'add_credits';
    const parts = trimmed.split(' ');
    parameters = {
      amount: parseInt(parts[1])
    };
  } else if (upperLine.startsWith('SETCREDITS ')) {
    type = 'set_credits';
    const parts = trimmed.split(' ');
    parameters = {
      amount: parseInt(parts[1])
    };
  } else if (upperLine.startsWith('ADDMISSIONCREDITS ')) {
    type = 'add_mission_credits';
    const parts = trimmed.split(' ');
    parameters = {
      amount: parseInt(parts[1])
    };
  } else if (upperLine === 'ADDMISSIONCREDITSBYRESULT') {
    type = 'add_mission_credits_by_result';
  } else if (upperLine === 'SUBOPPONENTCREDITSBYRESULT') {
    type = 'sub_opponent_credits_by_result';
    
  // Complex parameter commands (gestiti come stringa)
  } else if (upperLine.startsWith('SETADVPILE ')) {
    type = 'set_adv_pile';
    parameters = {
      paramsString: trimmed.substring(11).trim(),
      example: "1 3"
    };
  } else if (upperLine.startsWith('SETSECRETADVPILE ')) {
    type = 'set_secret_adv_pile';
    parameters = {
      paramsString: trimmed.substring(17).trim(),
      example: "2 1"
    };
  } else if (upperLine.startsWith('ADDPARTTOSHIP ')) {
    type = 'add_part_to_ship';
    parameters = {
      paramsString: trimmed.substring(14).trim(),
      example: "1 7 alienEngine 3333 0"
    };
  } else if (upperLine.startsWith('ADDPARTTOASIDESLOT ')) {
    type = 'add_part_to_aside_slot';
    parameters = {
      paramsString: trimmed.substring(19).trim(),
      example: "alienGun 2 1 2 0"
    };
  } else if (upperLine.startsWith('SETSPECCONDITION ')) {
    type = 'set_spec_condition';
    parameters = {
      paramsString: trimmed.substring(17).trim(),
      example: "bet"
    };
  } else if (upperLine.startsWith('ADDSHIPPARTS ')) {
    type = 'add_ship_parts';
    parameters = {
      paramsString: trimmed.substring(13).trim(),
      example: "parts/allParts.yaml"
    };
  } else if (upperLine.startsWith('SHOWHELPIMAGE ')) {
    type = 'show_help_image';
    parameters = {
      paramsString: trimmed.substring(14).trim(),
      example: "40 50 70 campaign/tutorial-purple.png"
    };
    
  // Focus and UI commands
  } else if (upperLine.startsWith('SETFOCUS ')) {
    type = 'set_focus';
    parameters = {
      button: trimmed.substring(9).trim()
    };
  } else if (upperLine.startsWith('RESETFOCUS ')) {
    type = 'reset_focus';
    parameters = {
      button: trimmed.substring(11).trim()
    };
  } else if (upperLine.startsWith('SETFOCUSIFCREDITS ')) {
    type = 'set_focus_if_credits';
    const parts = trimmed.split(' ');
    parameters = {
      button: parts[1],
      credits: parseInt(parts[2])
    };
  } else if (upperLine.startsWith('SETNODEKNOWN ')) {
    type = 'set_node_known';
    parameters = {
      node: trimmed.substring(13).trim()
    };
    
  // Achievement commands
  } else if (upperLine.startsWith('SETACHIEVEMENTPROGRESS ')) {
    type = 'set_achievement_progress';
    const parts = trimmed.split(' ');
    parameters = {
      achievement: parts[1],
      value: parseInt(parts[2])
    };
  } else if (upperLine.startsWith('SETACHIEVEMENTATTEMPT ')) {
    type = 'set_achievement_attempt';
    const parts = trimmed.split(' ');
    parameters = {
      achievement: parts[1],
      value: parseInt(parts[2])
    };
  } else if (upperLine.startsWith('UNLOCKACHIEVEMENT ')) {
    type = 'unlock_achievement';
    parameters = {
      achievement: trimmed.substring(18).trim()
    };
  } else if (upperLine.startsWith('UNLOCKSHIPPLAN ')) {
    type = 'unlock_ship_plan';
    parameters = {
      plan: trimmed.substring(15).trim()
    };
  } else if (upperLine === 'UNLOCKSHUTTLES') {
    type = 'unlock_shuttles';
    
  // System state commands
  } else if (upperLine === 'SAVESTATE') {
    type = 'save_state';
  } else if (upperLine === 'LOADSTATE') {
    type = 'load_state';
  } else if (upperLine === 'SETMISSIONASFAILED') {
    type = 'set_mission_as_failed';
  } else if (upperLine === 'SETMISSIONASCOMPLETED') {
    type = 'set_mission_as_completed';
  } else if (upperLine === 'ALLSHIPSGIVEUP') {
    type = 'all_ships_give_up';
  } else if (upperLine === 'GIVEUPFLIGHT') {
    type = 'give_up_flight';
  } else if (upperLine === 'QUITCAMPAIGN') {
    type = 'quit_campaign';
  } else if (upperLine.startsWith('ADDNODE ')) {
    type = 'add_node';
    parameters = {
      node: trimmed.substring(8).trim()
    };

  // Generic unknown command - passa al FE come contenitore stringa
  } else {
    type = 'unknown_command';
    parameters = {
      originalLine: trimmed,
      commandType: upperLine.split(' ')[0]
    };
  }

  return {
    type,
    line: lineNumber,
    content: trimmed,
    parameters
  };
}

function extractMetadataFromCommand(command, script) {
  // Initialize unknown commands counter if not exists
  if (!script.unknownCommands) {
    script.unknownCommands = [];
  }
  
  // Track unknown commands
  if (command.type === 'unknown_command') {
    script.unknownCommands.push({
      line: command.line,
      commandType: command.parameters.commandType,
      originalLine: command.parameters.originalLine
    });
    return;
  }
  
  // Extract variables/semafori
  if (command.type === 'semaforo_set' || command.type === 'semaforo_reset') {
    if (command.parameters.variable && !script.variables.includes(command.parameters.variable)) {
      script.variables.push(command.parameters.variable);
    }
  } else if (command.type === 'variable_set') {
    if (command.parameters.variable && !script.variables.includes(command.parameters.variable)) {
      script.variables.push(command.parameters.variable);
    }
  }
  
  // Extract characters
  if (command.type === 'show_character' || command.type === 'change_character' || command.type === 'hide_character' || command.type === 'add_opponent') {
    if (command.parameters.character && !script.characters.includes(command.parameters.character)) {
      script.characters.push(command.parameters.character);
    }
  }
  
  // Extract labels
  if (command.type === 'label') {
    if (command.parameters.label && !script.labels.includes(command.parameters.label)) {
      script.labels.push(command.parameters.label);
    }
  }
  
  // Extract nodes
  if (command.type === 'center_map_by_node' || command.type === 'show_node') {
    if (command.parameters.node && !script.nodes.includes(command.parameters.node)) {
      script.nodes.push(command.parameters.node);
    }
  }
  
  // Extract missions
  if (command.type === 'mission_start') {
    if (command.parameters.mission && !script.missions.includes(command.parameters.mission)) {
      script.missions.push(command.parameters.mission);
    }
  }
  
  // Extract scripts referenced
  if (command.type === 'script_call' || command.type === 'subscript_start') {
    if (!script.referencedScripts) {
      script.referencedScripts = [];
    }
    const scriptName = command.parameters.script;
    if (scriptName && !script.referencedScripts.includes(scriptName)) {
      script.referencedScripts.push(scriptName);
    }
  }
  
  // Extract paths
  if (command.type === 'show_path' || command.type === 'hide_path') {
    if (!script.paths) {
      script.paths = [];
    }
    const pathName = command.parameters.path;
    if (pathName && !script.paths.includes(pathName)) {
      script.paths.push(pathName);
    }
  }
}

module.exports = {
  parseScriptContent,
  parseCommand,
  extractMetadataFromCommand
};
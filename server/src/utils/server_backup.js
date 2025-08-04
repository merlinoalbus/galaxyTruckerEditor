const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const chokidar = require('chokidar');
// const rateLimit = require('express-rate-limit'); // DISABLED
const helmet = require('helmet');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 3001;

// Funzione per trovare tutte le immagini di un personaggio
async function findCharacterImages(characterName) {
  try {
    const imageDir = path.join(GAME_ROOT, 'campaign', 'campaignMap', 'big');
    
    if (!await fs.pathExists(imageDir)) {
      return [];
    }
    
    const files = await fs.readdir(imageDir);
    const imageExtensions = ['.png', '.jpg', '.jpeg'];
    const characterImages = [];
    
    // Cerca tutti i file che iniziano con il nome del personaggio
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const baseName = path.basename(file, ext);
      
      if (imageExtensions.includes(ext)) {
        // Controlla se il file inizia con il nome del personaggio
        if (baseName === characterName) {
          // Immagine base (default)
          characterImages.push({
            variant: 'default',
            fileName: file,
            url: `/api/character/image/${characterName}`,
            isDefault: true
          });
        } else if (baseName.startsWith(`${characterName}_`)) {
          // Immagini con varianti (es. "character_happy.png")
          const variant = baseName.substring(characterName.length + 1);
          characterImages.push({
            variant: variant,
            fileName: file,
            url: `/api/character/image/${characterName}?variant=${variant}`,
            isDefault: false
          });
        }
      }
    }
    
    // Ordina le immagini: default prima, poi per nome variante
    characterImages.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.variant.localeCompare(b.variant);
    });
    
    return characterImages;
    
  } catch (error) {
    logger.error(`Error finding images for character ${characterName}: ${error.message}`);
    return [];
  }
}

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

// Parser strutturale per conversione script-to-blocks con supporto annidamenti misti
function parseScriptToBlocks(commands) {
  const blocks = [];
  const stack = []; // Stack per tracking annidamenti misti
  let i = 0;

  while (i < commands.length) {
    const command = commands[i];
    
    // Container blocks (apertura)
    if (command.type === 'conditional_start') {
      const block = createConditionalBlock(command, commands, i);
      const result = parseConditionalWithElse(commands, i, 'conditional_end');
      block.children = result.trueBranch;
      block.hasElse = result.hasElse;
      block.elseBranch = result.elseBranch || [];
      blocks.push(block);
      i = result.nextIndex;
      
    } else if (command.type === 'menu_start') {
      const block = createMenuBlock(command, commands, i);
      const result = parseNestedBlock(commands, i, 'menu_end');
      block.options = result.children;
      blocks.push(block);
      i = result.nextIndex;
      
    } else if (command.type === 'subscript_start') {
      const block = createSubscriptBlock(command, commands, i);
      const result = parseNestedBlock(commands, i, 'subscript_end');
      block.children = result.children;
      blocks.push(block);
      i = result.nextIndex;
      
    } else if (command.type === 'loop_start') {
      const block = createLoopBlock(command, commands, i);
      const result = parseNestedBlock(commands, i, 'loop_end');
      block.children = result.children;
      blocks.push(block);
      i = result.nextIndex;
      
    } else if (command.type === 'parallel_start') {
      const block = createParallelBlock(command, commands, i);
      const result = parseNestedBlock(commands, i, 'parallel_end');
      block.children = result.children;
      blocks.push(block);
      i = result.nextIndex;
      
    // Menu option (caso speciale - può contenere blocchi annidati)
    } else if (command.type === 'menu_option' || command.type === 'menu_option_conditional') {
      const block = createOptionBlock(command, commands, i);
      const result = parseOptionContent(commands, i);
      block.children = result.children;
      blocks.push(block);
      i = result.nextIndex;
      
    // Atomic commands
    } else if (!isEndCommand(command.type)) {
      const block = createAtomicBlock(command);
      blocks.push(block);
      i++;
      
    } else {
      // End command - should be handled by parent parser
      i++;
    }
  }
  
  return blocks;
}

function parseConditionalWithElse(commands, startIndex, endType, maxDepth = 50) {
  const trueBranch = [];
  const elseBranch = [];
  let hasElse = false;
  let i = startIndex + 1; // Skip opening IF command
  let depth = 1;
  let inElseBranch = false;
  
  while (i < commands.length && depth > 0) {
    const command = commands[i];
    
    // Check for nested containers of same type
    if (isOpeningCommand(command.type, endType)) {
      depth++;
    } else if (command.type === endType) {
      depth--;
      if (depth === 0) break;
    } else if (command.type === 'else' && depth === 1) {
      // ELSE allo stesso livello del nostro IF
      hasElse = true;
      inElseBranch = true;
      i++;
      continue;
    }
    
    // Parse nested content solo al nostro livello
    if (depth === 1) {
      const nestedBlocks = parseScriptToBlocks([command]);
      if (inElseBranch) {
        elseBranch.push(...nestedBlocks);
      } else {
        trueBranch.push(...nestedBlocks);
      }
    }
    
    i++;
  }
  
  return {
    trueBranch,
    elseBranch,
    hasElse,
    nextIndex: i + 1 // Skip END_OF_IF command
  };
}

function parseNestedBlock(commands, startIndex, endType, maxDepth = 50) {
  const children = [];
  let i = startIndex + 1; // Skip opening command
  let depth = 1;
  let currentDepth = 0;
  
  while (i < commands.length && depth > 0 && currentDepth < maxDepth) {
    const command = commands[i];
    
    // Check for nested containers of same type
    if (isOpeningCommand(command.type, endType)) {
      depth++;
      currentDepth++;
    } else if (command.type === endType) {
      depth--;
      if (depth === 0) break;
      currentDepth = Math.max(0, currentDepth - 1);
    }
    
    // Parse nested content
    if (depth === 1) {
      const nestedBlocks = parseScriptToBlocks([command]);
      children.push(...nestedBlocks);
    }
    
    i++;
  }
  
  if (currentDepth >= maxDepth) {
    console.warn(`Maximum nesting depth ${maxDepth} reached in parseNestedBlock`);
  }
  
  return {
    children,
    nextIndex: i + 1 // Skip end command
  };
}

function parseOptionContent(commands, optionIndex) {
  const children = [];
  let i = optionIndex + 1;
  
  // Parse until next option or menu end
  while (i < commands.length) {
    const command = commands[i];
    
    if (command.type === 'menu_option' || 
        command.type === 'menu_option_conditional' || 
        command.type === 'menu_end') {
      break;
    }
    
    const nestedBlocks = parseScriptToBlocks([command]);
    children.push(...nestedBlocks);
    i++;
  }
  
  return {
    children,
    nextIndex: i
  };
}

function createConditionalBlock(command, commands, index) {
  // Determina il tipo specifico di IF
  let ifType = 'standard';
  let condition = '';
  
  if (command.parameters.type) {
    ifType = command.parameters.type; // probability, semaforo_not, variable_equals, etc.
  }
  
  if (command.parameters.condition) {
    condition = command.parameters.condition;
  } else if (command.parameters.semaforo) {
    condition = command.parameters.semaforo;
  } else if (command.parameters.variable) {
    condition = `${command.parameters.variable} ${command.parameters.value || ''}`.trim();
  }

  return {
    id: generateBlockId(),
    type: 'conditional',
    subtype: command.type,
    ifType: ifType, // standard, probability, semaforo_not, variable_equals, debug_mode, etc.
    condition: condition,
    parameters: command.parameters || {},
    children: [],
    hasElse: false, // Sarà aggiornato durante il parsing se trova ELSE
    elseBranch: [], // Branch ELSE se presente
    position: { x: 0, y: index * 100 },
    metadata: {
      line: command.line,
      originalContent: command.content,
      maxNestingDepth: 50
    }
  };
}

function createMenuBlock(command, commands, index) {
  return {
    id: generateBlockId(),
    type: 'menu',
    parameters: command.parameters || {},
    options: [],
    position: { x: 0, y: index * 100 },
    metadata: {
      line: command.line,
      originalContent: command.content
    }
  };
}

function createSubscriptBlock(command, commands, index) {
  return {
    id: generateBlockId(),
    type: 'subscript',
    parameters: command.parameters || {},
    children: [],
    position: { x: 0, y: index * 100 },
    metadata: {
      line: command.line,
      originalContent: command.content
    }
  };
}

function createLoopBlock(command, commands, index) {
  return {
    id: generateBlockId(),
    type: 'loop',
    parameters: command.parameters || {},
    children: [],
    position: { x: 0, y: index * 100 },
    metadata: {
      line: command.line,
      originalContent: command.content
    }
  };
}

function createParallelBlock(command, commands, index) {
  return {
    id: generateBlockId(),
    type: 'parallel',
    parameters: command.parameters || {},
    children: [],
    position: { x: 0, y: index * 100 },
    metadata: {
      line: command.line,
      originalContent: command.content
    }
  };
}

function createOptionBlock(command, commands, index) {
  return {
    id: generateBlockId(),
    type: 'option',
    subtype: command.type, // menu_option or menu_option_conditional
    parameters: command.parameters || {},
    children: [],
    position: { x: 50, y: index * 80 }, // Indented for menu options
    metadata: {
      line: command.line,
      originalContent: command.content
    }
  };
}

function createAtomicBlock(command) {
  return {
    id: generateBlockId(),
    type: 'atomic',
    subtype: command.type,
    parameters: command.parameters || {},
    position: { x: 0, y: 0 }, // Will be recalculated during layout
    metadata: {
      line: command.line,
      originalContent: command.content
    }
  };
}

function isOpeningCommand(commandType, correspondingEndType) {
  const openingMap = {
    'conditional_end': ['conditional_start', 'if_start', 'unless_start'],
    'menu_end': ['menu_start'],
    'subscript_end': ['subscript_start'],
    'loop_end': ['loop_start'],
    'parallel_end': ['parallel_start']
  };
  
  return openingMap[correspondingEndType]?.includes(commandType) || false;
}

function isEndCommand(commandType) {
  return ['conditional_end', 'menu_end', 'subscript_end', 'loop_end', 'parallel_end'].includes(commandType);
}

function generateBlockId() {
  return 'block_' + Math.random().toString(36).substr(2, 9);
}

// Funzione per consolidare comandi localizzabili da tutte le lingue
function consolidateMultilingualCommands(allLanguagesData) {
  const consolidated = {};
  
  // Per ogni script
  for (const [scriptName, scriptData] of Object.entries(allLanguagesData)) {
    if (!consolidated[scriptName]) {
      consolidated[scriptName] = {
        ...scriptData,
        commands: [],
        blocks: []
      };
    }
    
    // Prendi la versione EN come base di riferimento
    const baseCommands = scriptData.languages?.EN?.content || scriptData.commands || [];
    const consolidatedCommands = [];
    
    // Per ogni comando base (EN)
    baseCommands.forEach((baseCommand, index) => {
      const consolidatedCommand = { ...baseCommand };
      
      // Se il comando è localizzabile, crea l'array multilingua
      if (baseCommand.parameters?.isLocalizable && baseCommand.parameters?.text) {
        consolidatedCommand.parameters.localizedText = {};
        
        // Aggiungi tutte le lingue disponibili
        Object.keys(scriptData.languages || {}).forEach(lang => {
          const langCommands = scriptData.languages[lang]?.content || [];
          const langCommand = langCommands[index];
          
          if (langCommand && langCommand.parameters?.text) {
            consolidatedCommand.parameters.localizedText[lang] = langCommand.parameters.text;
          }
        });
        
        // Rimuovi il testo singolo, ora abbiamo l'array
        delete consolidatedCommand.parameters.text;
        delete consolidatedCommand.parameters.isLocalizable;
      }
      
      consolidatedCommands.push(consolidatedCommand);
    });
    
    consolidated[scriptName].commands = consolidatedCommands;
  }
  
  return consolidated;
}

// Writer strutturale per conversione blocks-to-script
function convertBlocksToScript(blocks, indentLevel = 0) {
  let script = '';
  const indent = '  '.repeat(indentLevel);
  
  for (const block of blocks) {
    if (block.type === 'conditional') {
      script += convertConditionalBlock(block, indentLevel);
    } else if (block.type === 'menu') {
      script += convertMenuBlock(block, indentLevel);
    } else if (block.type === 'subscript') {
      script += convertSubscriptBlock(block, indentLevel);
    } else if (block.type === 'loop') {
      script += convertLoopBlock(block, indentLevel);
    } else if (block.type === 'parallel') {
      script += convertParallelBlock(block, indentLevel);
    } else if (block.type === 'option') {
      script += convertOptionBlock(block, indentLevel);
    } else if (block.type === 'atomic') {
      script += convertAtomicBlock(block, indentLevel);
    }
  }
  
  return script;
}

function convertConditionalBlock(block, indentLevel = 0) {
  const indent = '  '.repeat(indentLevel);
  let script = '';
  
  // Opening
  if (block.subtype === 'if_start') {
    script += `${indent}IF ${block.parameters.condition || ''}\n`;
  } else if (block.subtype === 'unless_start') {
    script += `${indent}UNLESS ${block.parameters.condition || ''}\n`;
  }
  
  // Children
  if (block.children && block.children.length > 0) {
    script += convertBlocksToScript(block.children, indentLevel + 1);
  }
  
  // Closing
  script += `${indent}END_IF\n`;
  
  return script;
}

function convertMenuBlock(block, indentLevel = 0) {
  const indent = '  '.repeat(indentLevel);
  let script = '';
  
  // Opening
  script += `${indent}MENU\n`;
  
  // Options
  if (block.options && block.options.length > 0) {
    script += convertBlocksToScript(block.options, indentLevel + 1);
  }
  
  // Closing
  script += `${indent}END_OF_MENU\n`;
  
  return script;
}

function convertSubscriptBlock(block, indentLevel = 0) {
  const indent = '  '.repeat(indentLevel);
  let script = '';
  
  // Opening
  script += `${indent}SUB_SCRIPT ${block.parameters.name || ''}\n`;
  
  // Children
  if (block.children && block.children.length > 0) {
    script += convertBlocksToScript(block.children, indentLevel + 1);
  }
  
  // Closing
  script += `${indent}END_SUB_SCRIPT\n`;
  
  return script;
}

function convertLoopBlock(block, indentLevel = 0) {
  const indent = '  '.repeat(indentLevel);
  let script = '';
  
  // Opening
  script += `${indent}LOOP ${block.parameters.condition || ''}\n`;
  
  // Children
  if (block.children && block.children.length > 0) {
    script += convertBlocksToScript(block.children, indentLevel + 1);
  }
  
  // Closing
  script += `${indent}END_LOOP\n`;
  
  return script;
}

function convertParallelBlock(block, indentLevel = 0) {
  const indent = '  '.repeat(indentLevel);
  let script = '';
  
  // Opening
  script += `${indent}PARALLEL\n`;
  
  // Children
  if (block.children && block.children.length > 0) {
    script += convertBlocksToScript(block.children, indentLevel + 1);
  }
  
  // Closing
  script += `${indent}END_PARALLEL\n`;
  
  return script;
}

function convertOptionBlock(block, indentLevel = 0) {
  const indent = '  '.repeat(indentLevel);
  let script = '';
  
  // Option line con supporto multilingua
  const optionText = block.parameters.localizedText?.EN || block.parameters.text || '';
  
  if (block.subtype === 'menu_option_conditional') {
    const conditionType = block.parameters.conditionType === 'not' ? 'OPT_IFNOT' : 'OPT_IF';
    script += `${indent}${conditionType} ${block.parameters.condition || ''} "${optionText}"\n`;
  } else {
    script += `${indent}OPT "${optionText}"\n`;
  }
  
  // Option content (annidamenti misti supportati)
  if (block.children && block.children.length > 0) {
    script += convertBlocksToScript(block.children, indentLevel + 1);
  }
  
  return script;
}

function convertAtomicBlock(block, indentLevel = 0) {
  const indent = '  '.repeat(indentLevel);
  
  // Ricostruisci il comando originale o usa i parametri
  if (block.metadata && block.metadata.originalContent) {
    return `${indent}${block.metadata.originalContent}\n`;
  }
  
  // Ricostruzione da parametri per comandi principali
  switch (block.subtype) {
    case 'dialogue':
      const dialogText = block.parameters.localizedText?.EN || block.parameters.text || '';
      const dialogChar = block.parameters.character ? `SAYCHAR ${block.parameters.character} ` : 'SAY ';
      return `${indent}${dialogChar}"${dialogText}"\n`;
    case 'question':
      const questionText = block.parameters.localizedText?.EN || block.parameters.text || '';
      const questionChar = block.parameters.character ? `ASKCHAR ${block.parameters.character} ` : 'ASK ';
      return `${indent}${questionChar}"${questionText}"\n`;
    case 'announce':
      const announceText = block.parameters.localizedText?.EN || block.parameters.text || '';
      return `${indent}ANNOUNCE "${announceText}"\n`;
    case 'semaforo_set':
      return `${indent}SET ${block.parameters.variable || ''}\n`;
    case 'semaforo_reset':
      return `${indent}RESET ${block.parameters.variable || ''}\n`;
    case 'variable_set':
      return `${indent}SET_TO ${block.parameters.variable || ''} ${block.parameters.value || ''}\n`;
    case 'show_character':
      return `${indent}SHOWCHAR ${block.parameters.character || ''} ${block.parameters.position || 'center'} ${block.parameters.image || 'default'}\n`;
    case 'hide_character':
      return `${indent}HIDECHAR ${block.parameters.character || ''}\n`;
    case 'change_character':
      return `${indent}CHANGECHAR ${block.parameters.character || ''} ${block.parameters.image || ''}\n`;
    case 'dialog_scene_open':
      return `${indent}SHOWDLGSCENE\n`;
    case 'dialog_scene_close':
      return `${indent}HIDEDLGSCENE\n`;
    case 'label':
      return `${indent}LABEL ${block.parameters.label || ''}\n`;
    case 'goto':
      return `${indent}GO ${block.parameters.label || ''}\n`;
    case 'script_call':
      return `${indent}RUNSCRIPT ${block.parameters.script || ''}\n`;
    case 'return':
      return `${indent}RETURN\n`;
    case 'delay':
      return `${indent}DELAY ${block.parameters.milliseconds || ''}\n`;
    case 'wait':
      return `${indent}WAIT ${block.parameters.condition || ''}\n`;
    case 'show_path':
      return `${indent}SHOWPATH ${block.parameters.path || ''}\n`;
    case 'hide_path':
      return `${indent}HIDEPATH ${block.parameters.path || ''}\n`;
    case 'center_map':
      return `${indent}CENTER_MAP ${block.parameters.node || ''}\n`;
    case 'show_node':
      return `${indent}SHOW_NODE ${block.parameters.node || ''}\n`;
    case 'add_opponent':
      return `${indent}ADDOPPONENT ${block.parameters.character || ''}\n`;
    case 'menu_exit':
      return `${indent}EXIT_MENU\n`;
    case 'unknown_command':
      return `${indent}${block.parameters.originalLine || block.parameters.commandType || 'UNKNOWN'}\n`;
    default:
      return `${indent}# Unknown command: ${block.subtype}\n`;
  }
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
  if (command.type === 'center_map' || command.type === 'show_node') {
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

// Configurazione logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Path base del gioco (parent directory dell'editor)
const GAME_ROOT = path.resolve(__dirname, '../../');
const BACKUP_DIR = path.join(__dirname, 'backups');

// Assicurati che la directory backup esista
fs.ensureDirSync(BACKUP_DIR);

// Middleware di sicurezza
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting completely disabled for development
// app.use(limiter); // DISABLED to fix ERR_INSUFFICIENT_RESOURCES

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from game directory
app.use('/static', express.static(GAME_ROOT));

// Struttura dei file del gioco
const GAME_STRUCTURE = {
  missions: {
    path: 'multiplayermissions',
    extension: '.yaml',
    description: 'Multiplayer mission configurations'
  },
  deckScripts: {
    path: 'customScripts',
    extension: '.txt',
    description: 'Deck building scripts'
  },
  adventureCards: {
    path: 'advCards',
    extension: '.yaml',
    description: 'Adventure card definitions'
  },
  shipParts: {
    path: 'parts',
    extension: '.yaml',
    description: 'Ship part configurations'
  },
  localization: {
    path: 'localization_strings',
    extension: '.yaml',
    description: 'Localization strings'
  },
  aiConfigs: {
    path: 'aiConfigs',
    extension: '.ai',
    description: 'AI configuration files'
  },
  ships: {
    path: 'ships',
    extension: '.yaml',
    description: 'Ship template definitions'
  },
  campaign: {
    path: 'campaign',
    extension: '.yaml',
    description: 'Campaign configurations'
  },
  campaignMissions: {
    path: 'campaign/campaignScriptsEN',
    extension: ['.yaml', '.txt'],
    description: 'Campaign missions'
  },
  campaignScriptsCS: {
    path: 'campaign/campaignScriptsCS',
    extension: '.txt',
    description: 'Campaign scripts Czech'
  },
  campaignScriptsDE: {
    path: 'campaign/campaignScriptsDE',
    extension: '.txt',
    description: 'Campaign scripts German'
  },
  campaignScriptsES: {
    path: 'campaign/campaignScriptsES',
    extension: '.txt',
    description: 'Campaign scripts Spanish'
  },
  campaignScriptsFR: {
    path: 'campaign/campaignScriptsFR',
    extension: '.txt',
    description: 'Campaign scripts French'
  },
  campaignScriptsPL: {
    path: 'campaign/campaignScriptsPL',
    extension: '.txt',
    description: 'Campaign scripts Polish'
  },
  campaignScriptsRU: {
    path: 'campaign/campaignScriptsRU',
    extension: '.txt',
    description: 'Campaign scripts Russian'
  }
};

// Utility function per creare backup
async function createBackup(filePath, content) {
  try {
    const fileName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `${timestamp}_${fileName}`);
    await fs.writeFile(backupPath, content);
    logger.info(`Backup created: ${backupPath}`);
  } catch (error) {
    logger.error(`Failed to create backup: ${error.message}`);
  }
}

// Utility function per validare path
function validatePath(filePath) {
  const fullPath = path.resolve(GAME_ROOT, filePath);
  return fullPath.startsWith(path.resolve(GAME_ROOT));
}

// API per ottenere la struttura del gioco
app.get('/api/structure', (req, res) => {
  try {
    res.json({
      gameRoot: GAME_ROOT,
      structure: GAME_STRUCTURE,
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error getting structure: ${error.message}`);
    res.status(500).json({ error: 'Failed to get game structure' });
  }
});

// Health check - must come before parameterized routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    gameRoot: GAME_ROOT,
    backupDir: BACKUP_DIR
  });
});

// API 1: Lista immagini campagna (TUTTE le immagini JPG/PNG organizzate per tipologia)
app.get('/api/images/campaign', async (req, res) => {
  try {
    const imageExtensions = ['.png', '.jpg', '.jpeg'];
    const imagesByType = {};
    const allImages = [];
    
    // Funzione ricorsiva per scansionare directory
    async function scanDirectory(dirPath, parentType = null) {
      if (!await fs.pathExists(dirPath)) {
        return;
      }
      
      try {
        const items = await fs.readdir(dirPath);
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = await fs.stat(itemPath);
          
          if (stat.isDirectory()) {
            // Determina il tipo dalla directory (1 livello)
            const typeName = parentType || item;
            await scanDirectory(itemPath, typeName);
          } else if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase();
            const fileName = path.basename(item, ext);
            
            if (imageExtensions.includes(ext)) {
              const relativePath = path.relative(GAME_ROOT, itemPath).replace(/\\/g, '/');
              const typeName = parentType || 'root';
              
              const imageInfo = {
                nomefile: fileName,
                percorso: relativePath,
                tipo: typeName,
                extension: ext,
                size: stat.size,
                lastModified: stat.mtime
              };
              
              // Aggiungi a lista generale
              allImages.push(imageInfo);
              
              // Organizza per tipo
              if (!imagesByType[typeName]) {
                imagesByType[typeName] = [];
              }
              imagesByType[typeName].push(imageInfo);
            }
          }
        }
      } catch (error) {
        logger.warn(`Could not scan directory ${dirPath}: ${error.message}`);
      }
    }
    
    // Scansiona le directory principali che contengono immagini
    const imageDirs = [
      'campaign',
      'backgrounds',
      'common',
      'avatars',
      'buildScene',
      'flightScene',
      'mainMenu',
      'multiplayerMenu',
      'achievements',
      'parts',
      'ships',
      'catapult',
      'cursors',
      'final',
      'gameSelectScreen',
      'help',
      'hourglass',
      'levels',
      'music',
      'options',
      'ordinalTokens',
      'particles',
      'partsDesktop',
      'pauseMenu',
      'ProgressBar',
      'Profile',
      'Friendlist',
      'chatIcons',
      'multiplayermissionsImg'
    ];
    
    // Scansiona tutte le directory
    for (const dir of imageDirs) {
      const dirPath = path.join(GAME_ROOT, dir);
      await scanDirectory(dirPath);
    }
    
    // Ordina per tipo e nome file
    Object.keys(imagesByType).forEach(type => {
      imagesByType[type].sort((a, b) => a.nomefile.localeCompare(b.nomefile));
    });
    
    logger.info(`Found ${allImages.length} images across ${Object.keys(imagesByType).length} types`);
    
    res.json({
      totalImages: allImages.length,
      totalTypes: Object.keys(imagesByType).length,
      imagesByType: imagesByType,
      allImages: allImages.slice(0, 100), // Limita per response size
      supportedExtensions: imageExtensions,
      scannedDirectories: imageDirs,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Error scanning campaign images: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API 2: Recupero immagini in binary da array di percorsi
app.post('/api/images/bulk', async (req, res) => {
  try {
    const { paths } = req.body;
    
    if (!paths || !Array.isArray(paths)) {
      return res.status(400).json({ error: 'Paths array is required' });
    }
    
    const results = [];
    const errors = [];
    
    for (const imagePath of paths) {
      try {
        // Validazione sicurezza path
        const fullPath = path.resolve(GAME_ROOT, imagePath);
        if (!fullPath.startsWith(path.resolve(GAME_ROOT))) {
          errors.push({
            path: imagePath,
            error: 'Invalid path - outside game directory'
          });
          continue;
        }
        
        if (!await fs.pathExists(fullPath)) {
          errors.push({
            path: imagePath,
            error: 'File not found'
          });
          continue;
        }
        
        // Verifica che sia un'immagine
        const ext = path.extname(fullPath).toLowerCase();
        const validExtensions = ['.png', '.jpg', '.jpeg'];
        if (!validExtensions.includes(ext)) {
          errors.push({
            path: imagePath,
            error: 'Not a valid image file'
          });
          continue;
        }
        
        // Leggi l'immagine
        const imageBuffer = await fs.readFile(fullPath);
        const stats = await fs.stat(fullPath);
        
        // Determina content type
        const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
        
        results.push({
          path: imagePath,
          nomefile: path.basename(imagePath, ext),
          tipo: path.dirname(imagePath).split('/')[0] || 'root',
          binary: imageBuffer.toString('base64'),
          contentType: contentType,
          size: stats.size,
          lastModified: stats.mtime
        });
        
      } catch (error) {
        errors.push({
          path: imagePath,
          error: error.message
        });
      }
    }
    
    logger.info(`Bulk image request: ${results.length} successful, ${errors.length} errors`);
    
    res.json({
      totalRequested: paths.length,
      successful: results.length,
      errors: errors.length,
      images: results,
      errorDetails: errors,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Error in bulk image request: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API 3: Lista variabili scripts/missions
app.get('/api/campaign/variables', async (req, res) => {
  try {
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const variables = new Map(); // Nome variabile -> script che la usano
    
    // Scansiona tutti gli script
    for (const lang of languages) {
      const campaignDir = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`);
      if (!await fs.pathExists(campaignDir)) continue;
      
      const files = await fs.readdir(campaignDir);
      for (const filename of files.filter(f => f.endsWith('.txt'))) {
        const filePath = path.join(campaignDir, filename);
        const content = await fs.readFile(filePath, 'utf8');
        const scripts = parseScriptContent(content, filename, lang);
        
        // Solo per lingua EN (evitare duplicati)
        if (lang === 'EN') {
          for (const script of scripts) {
            script.commands.forEach(cmd => {
              if (cmd.type === 'variable_set' && cmd.parameters?.variable) {
                const varName = cmd.parameters.variable;
                if (!variables.has(varName)) {
                  variables.set(varName, new Set());
                }
                variables.get(varName).add(script.name);
              }
            });
          }
        }
      }
    }
    
    const result = Array.from(variables.entries()).map(([varName, scripts]) => ({
      nomevariabile: varName,
      listascriptchelausano: Array.from(scripts).sort()
    }));
    
    res.json({
      totalVariables: result.length,
      variables: result.sort((a, b) => a.nomevariabile.localeCompare(b.nomevariabile))
    });
    
  } catch (error) {
    logger.error(`Error getting variables: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API 4: Lista semafori scripts/missions
app.get('/api/campaign/semafori', async (req, res) => {
  try {
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const semafori = new Map(); // Nome semaforo -> script che lo usano
    
    // Scansiona tutti gli script
    for (const lang of languages) {
      const campaignDir = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`);
      if (!await fs.pathExists(campaignDir)) continue;
      
      const files = await fs.readdir(campaignDir);
      for (const filename of files.filter(f => f.endsWith('.txt'))) {
        const filePath = path.join(campaignDir, filename);
        const content = await fs.readFile(filePath, 'utf8');
        const scripts = parseScriptContent(content, filename, lang);
        
        // Solo per lingua EN (evitare duplicati)
        if (lang === 'EN') {
          for (const script of scripts) {
            script.commands.forEach(cmd => {
              if ((cmd.type === 'semaforo_set' || cmd.type === 'semaforo_reset') && cmd.parameters?.variable) {
                const semaforoName = cmd.parameters.variable;
                if (!semafori.has(semaforoName)) {
                  semafori.set(semaforoName, new Set());
                }
                semafori.get(semaforoName).add(script.name);
              }
            });
          }
        }
      }
    }
    
    const result = Array.from(semafori.entries()).map(([semaforoName, scripts]) => ({
      nomesemaforo: semaforoName,
      listascriptchelousano: Array.from(scripts).sort()
    }));
    
    res.json({
      totalSemafori: result.length,
      semafori: result.sort((a, b) => a.nomesemaforo.localeCompare(b.nomesemaforo))
    });
    
  } catch (error) {
    logger.error(`Error getting semafori: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API 5: Lista label scripts/missions
app.get('/api/campaign/labels', async (req, res) => {
  try {
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const labels = new Map(); // Nome label -> info
    
    // Scansiona tutti gli script
    for (const lang of languages) {
      const campaignDir = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`);
      if (!await fs.pathExists(campaignDir)) continue;
      
      const files = await fs.readdir(campaignDir);
      for (const filename of files.filter(f => f.endsWith('.txt'))) {
        const filePath = path.join(campaignDir, filename);
        const content = await fs.readFile(filePath, 'utf8');
        const scripts = parseScriptContent(content, filename, lang);
        
        // Solo per lingua EN (evitare duplicati)
        if (lang === 'EN') {
          for (const script of scripts) {
            script.commands.forEach(cmd => {
              // Label definite
              if (cmd.type === 'label' && cmd.parameters?.label) {
                const labelName = cmd.parameters.label;
                if (!labels.has(labelName)) {
                  labels.set(labelName, {
                    nomelabel: labelName,
                    scriptancoraggio: script.name,
                    scriptchelarichiamano: new Set()
                  });
                }
              }
              // GO che richiamano label
              if (cmd.type === 'goto' && cmd.parameters?.label) {
                const labelName = cmd.parameters.label;
                if (!labels.has(labelName)) {
                  labels.set(labelName, {
                    nomelabel: labelName,
                    scriptancoraggio: null,
                    scriptchelarichiamano: new Set()
                  });
                }
                labels.get(labelName).scriptchelarichiamano.add(script.name);
              }
            });
          }
        }
      }
    }
    
    const result = Array.from(labels.values()).map(label => ({
      nomelabel: label.nomelabel,
      scriptancoraggio: label.scriptancoraggio,
      scriptchelarichiamano: Array.from(label.scriptchelarichiamano).sort()
    }));
    
    res.json({
      totalLabels: result.length,
      labels: result.sort((a, b) => a.nomelabel.localeCompare(b.nomelabel))
    });
    
  } catch (error) {
    logger.error(`Error getting labels: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API 6: Lista personaggi
app.get('/api/campaign/characters', async (req, res) => {
  try {
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const characters = new Map(); // Nome personaggio -> info
    
    // Scansiona tutti gli script
    for (const lang of languages) {
      const campaignDir = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`);
      if (!await fs.pathExists(campaignDir)) continue;
      
      const files = await fs.readdir(campaignDir);
      for (const filename of files.filter(f => f.endsWith('.txt'))) {
        const filePath = path.join(campaignDir, filename);
        const content = await fs.readFile(filePath, 'utf8');
        const scripts = parseScriptContent(content, filename, lang);
        
        // Solo per lingua EN (evitare duplicati)
        if (lang === 'EN') {
          for (const script of scripts) {
            script.commands.forEach(cmd => {
              if ((cmd.type === 'show_character' || cmd.type === 'change_character' || cmd.type === 'hide_character') && cmd.parameters?.character) {
                const charName = cmd.parameters.character;
                if (!characters.has(charName)) {
                  characters.set(charName, {
                    nomepersonaggio: charName,
                    stato: 'INVISIBILE',
                    immaginebase: `campaign/${charName}.png`,
                    listaimmagini: [],
                    posizione: 'center'
                  });
                }
                
                const char = characters.get(charName);
                if (cmd.type === 'show_character') {
                  char.stato = 'VISIBILE';
                  char.posizione = cmd.parameters.position || 'center';
                }
              }
            });
          }
        }
      }
    }
    
    // Popola le immagini disponibili per ogni personaggio
    for (const [charName, charInfo] of characters.entries()) {
      try {
        const availableImages = await findCharacterImages(charName);
        charInfo.listaimmagini = availableImages.map(img => ({
          nomefile: img.fileName,
          percorso: `campaign/${img.fileName}`
        }));
      } catch (error) {
        logger.warn(`Could not load images for character ${charName}: ${error.message}`);
      }
    }
    
    const result = Array.from(characters.values());
    
    res.json({
      totalCharacters: result.length,
      characters: result.sort((a, b) => a.nomepersonaggio.localeCompare(b.nomepersonaggio))
    });
    
  } catch (error) {
    logger.error(`Error getting characters: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API 7: Lista nodi mappa da nodes.yaml (multilingua)
app.get('/api/campaign/nodes', async (req, res) => {
  try {
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const nodesData = {};
    
    // Carica nodes.yaml da tutte le lingue
    for (const lang of languages) {
      const nodesPath = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`, 'nodes.yaml');
      if (await fs.pathExists(nodesPath)) {
        try {
          const content = await fs.readFile(nodesPath, 'utf8');
          const parsedNodes = yaml.load(content);
          
          if (Array.isArray(parsedNodes)) {
            for (const node of parsedNodes) {
              if (!nodesData[node.name]) {
                nodesData[node.name] = {
                  name: node.name,
                  coordinates: node.coordinates,
                  image: node.image,
                  shuttles: node.shuttles || [],
                  buttons: node.buttons || [],
                  caption: {},
                  description: {}
                };
              }
              
              // Aggiungi testi localizzati
              if (node.caption) {
                nodesData[node.name].caption[lang] = node.caption;
              }
              if (node.description) {
                nodesData[node.name].description[lang] = node.description;
              }
            }
          }
        } catch (error) {
          logger.warn(`Could not parse nodes.yaml for ${lang}: ${error.message}`);
        }
      }
    }
    
    const result = Object.values(nodesData);
    
    res.json({
      totalNodes: result.length,
      nodes: result.sort((a, b) => a.name.localeCompare(b.name)),
      availableLanguages: languages
    });
    
  } catch (error) {
    logger.error(`Error getting nodes: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API 8: Lista archi mappa da missions.yaml (multilingua)
app.get('/api/campaign/missions-routes', async (req, res) => {
  try {
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const routesData = {};
    
    // Carica missions.yaml da tutte le lingue
    for (const lang of languages) {
      const missionsPath = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`, 'missions.yaml');
      if (await fs.pathExists(missionsPath)) {
        try {
          const content = await fs.readFile(missionsPath, 'utf8');
          const parsedMissions = yaml.load(content);
          
          if (Array.isArray(parsedMissions)) {
            for (const mission of parsedMissions) {
              if (!routesData[mission.name]) {
                routesData[mission.name] = {
                  name: mission.name,
                  source: mission.source,
                  destination: mission.destination,
                  missiontype: mission.missiontype,
                  license: mission.license,
                  button: mission.button || [],
                  caption: {},
                  description: {}
                };
              }
              
              // Aggiungi testi localizzati
              if (mission.caption) {
                routesData[mission.name].caption[lang] = mission.caption;
              }
              if (mission.description) {
                routesData[mission.name].description[lang] = mission.description;
              }
            }
          }
        } catch (error) {
          logger.warn(`Could not parse missions.yaml for ${lang}: ${error.message}`);
        }
      }
    }
    
    const result = Object.values(routesData);
    
    res.json({
      totalRoutes: result.length,
      routes: result.sort((a, b) => a.name.localeCompare(b.name)),
      availableLanguages: languages,
      missionTypes: [...new Set(result.map(r => r.missiontype))],
      licenseTypes: [...new Set(result.map(r => r.license))]
    });
    
  } catch (error) {
    logger.error(`Error getting mission routes: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API 9: Lista bottoni calcolata da nodi
app.get('/api/campaign/buttons', async (req, res) => {
  try {
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const buttonsData = {};
    
    // Estrae bottoni dai nodi
    for (const lang of languages) {
      const nodesPath = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`, 'nodes.yaml');
      if (await fs.pathExists(nodesPath)) {
        try {
          const content = await fs.readFile(nodesPath, 'utf8');
          const parsedNodes = yaml.load(content);
          
          if (Array.isArray(parsedNodes)) {
            for (const node of parsedNodes) {
              if (node.buttons && Array.isArray(node.buttons)) {
                for (const buttonDef of node.buttons) {
                  if (Array.isArray(buttonDef) && buttonDef.length >= 3) {
                    const [buttonId, scriptName, buttonText] = buttonDef;
                    
                    if (!buttonsData[buttonId]) {
                      buttonsData[buttonId] = {
                        buttonId: buttonId,
                        scriptName: scriptName,
                        nodeLocation: node.name,
                        text: {}
                      };
                    }
                    
                    // Aggiungi testo localizzato
                    if (buttonText) {
                      buttonsData[buttonId].text[lang] = buttonText;
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          logger.warn(`Could not parse nodes.yaml for buttons extraction (${lang}): ${error.message}`);
        }
      }
    }
    
    // Estrae bottoni dalle missions (routes)
    for (const lang of languages) {
      const missionsPath = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`, 'missions.yaml');
      if (await fs.pathExists(missionsPath)) {
        try {
          const content = await fs.readFile(missionsPath, 'utf8');
          const parsedMissions = yaml.load(content);
          
          if (Array.isArray(parsedMissions)) {
            for (const mission of parsedMissions) {
              if (mission.button && Array.isArray(mission.button) && mission.button.length >= 3) {
                const [buttonId, scriptName, missionName] = mission.button;
                
                if (!buttonsData[buttonId]) {
                  buttonsData[buttonId] = {
                    buttonId: buttonId,
                    scriptName: scriptName,
                    routeLocation: `${mission.source} -> ${mission.destination}`,
                    missionName: missionName,
                    text: {}
                  };
                }
                
                // Per le missions, il testo del bottone è di solito standard
                if (!buttonsData[buttonId].text[lang]) {
                  buttonsData[buttonId].text[lang] = mission.caption || `Launch mission ${mission.name}`;
                }
              }
            }
          }
        } catch (error) {
          logger.warn(`Could not parse missions.yaml for buttons extraction (${lang}): ${error.message}`);
        }
      }
    }
    
    const result = Object.values(buttonsData);
    
    res.json({
      totalButtons: result.length,
      buttons: result.sort((a, b) => a.buttonId.localeCompare(b.buttonId)),
      availableLanguages: languages
    });
    
  } catch (error) {
    logger.error(`Error getting buttons: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API 10: Lista scripts (versione semplificata)
app.get('/api/campaign/scripts/list', async (req, res) => {
  try {
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const scriptsData = {};
    const stellatedScripts = new Set(); // Script collegati a bottoni
    
    // Prima, trova tutti gli script collegati a bottoni (stellati)
    for (const lang of languages) {
      // Da nodi
      const nodesPath = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`, 'nodes.yaml');
      if (await fs.pathExists(nodesPath)) {
        try {
          const content = await fs.readFile(nodesPath, 'utf8');
          const parsedNodes = yaml.load(content);
          
          if (Array.isArray(parsedNodes)) {
            for (const node of parsedNodes) {
              if (node.buttons && Array.isArray(node.buttons)) {
                for (const buttonDef of node.buttons) {
                  if (Array.isArray(buttonDef) && buttonDef.length >= 2) {
                    const scriptName = buttonDef[1];
                    stellatedScripts.add(scriptName);
                  }
                }
              }
            }
          }
        } catch (error) {
          logger.warn(`Could not parse nodes.yaml for stellated scripts (${lang}): ${error.message}`);
        }
      }
      
      // Da missions
      const missionsPath = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`, 'missions.yaml');
      if (await fs.pathExists(missionsPath)) {
        try {
          const content = await fs.readFile(missionsPath, 'utf8');
          const parsedMissions = yaml.load(content);
          
          if (Array.isArray(parsedMissions)) {
            for (const mission of parsedMissions) {
              if (mission.button && Array.isArray(mission.button) && mission.button.length >= 2) {
                const scriptName = mission.button[1];
                stellatedScripts.add(scriptName);
              }
            }
          }
        } catch (error) {
          logger.warn(`Could not parse missions.yaml for stellated scripts (${lang}): ${error.message}`);
        }
      }
    }
    
    // Poi, scansiona tutti gli script
    for (const lang of languages) {
      const campaignDir = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`);
      if (!await fs.pathExists(campaignDir)) continue;
      
      const files = await fs.readdir(campaignDir);
      for (const filename of files.filter(f => f.endsWith('.txt'))) {
        const filePath = path.join(campaignDir, filename);
        const content = await fs.readFile(filePath, 'utf8');
        const scripts = parseScriptContent(content, filename, lang);
        
        // Solo per lingua EN (evitare duplicati)
        if (lang === 'EN') {
          for (const script of scripts) {
            if (!scriptsData[script.name]) {
              scriptsData[script.name] = {
                nomescript: script.name,
                percorso: `${filename}`,
                numeroblocchi: 0, // Calcolato dopo
                numerocomandi: script.commands.length,
                stellato: stellatedScripts.has(script.name) ? 'si' : 'no'
              };
            }
          }
        }
      }
    }
    
    // Calcola numero blocchi per ogni script
    for (const scriptName of Object.keys(scriptsData)) {
      try {
        // Usa il parser esistente per ottenere i blocchi
        const campaignDir = path.join(GAME_ROOT, 'campaign/campaignScriptsEN');
        const files = await fs.readdir(campaignDir);
        
        for (const filename of files.filter(f => f.endsWith('.txt'))) {
          const filePath = path.join(campaignDir, filename);
          const content = await fs.readFile(filePath, 'utf8');
          const scripts = parseScriptContent(content, filename, 'EN');
          
          const targetScript = scripts.find(s => s.name === scriptName);
          if (targetScript) {
            const blocks = parseScriptToBlocks(targetScript.commands);
            scriptsData[scriptName].numeroblocchi = blocks.length;
            break;
          }
        }
      } catch (error) {
        logger.warn(`Could not calculate blocks for script ${scriptName}: ${error.message}`);
      }
    }
    
    const result = Object.values(scriptsData);
    
    res.json({
      totalScripts: result.length,
      stellatedScripts: result.filter(s => s.stellato === 'si').length,
      nonStellatedScripts: result.filter(s => s.stellato === 'no').length,
      scripts: result.sort((a, b) => a.nomescript.localeCompare(b.nomescript))
    });
    
  } catch (error) {
    logger.error(`Error getting scripts list: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API 16: Lista achievement da achievements/achi.yaml (multilingua)
app.get('/api/achievements', async (req, res) => {
  try {
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const achievementsData = {};
    
    // Carica lista achievement dal file YAML
    const achiPath = path.join(GAME_ROOT, 'achievements', 'achi.yaml');
    if (!await fs.pathExists(achiPath)) {
      return res.status(404).json({ error: 'achievements/achi.yaml not found' });
    }
    
    const achiContent = await fs.readFile(achiPath, 'utf8');
    const achievements = yaml.load(achiContent);
    
    if (!Array.isArray(achievements)) {
      return res.status(500).json({ error: 'Invalid achievements YAML format' });
    }
    
    // Inizializza struttura dati
    for (const ach of achievements) {
      achievementsData[ach.name] = {
        name: ach.name,
        category: ach.category,
        points: ach.points,
        objectivesCount: ach.objectivesCount,
        hidden: ach.hidden,
        repeatable: ach.repeatable,
        preImage: ach.preImage,
        postImage: ach.postImage,
        preDesc: {},
        postDesc: {},
        categoryTitle: {}
      };
    }
    
    // Carica testi localizzati da tutti i file achievements_strings_*.yaml
    for (const lang of languages) {
      const stringsPath = path.join(GAME_ROOT, 'localization_strings', `achievements_strings_${lang}.yaml`);
      if (await fs.pathExists(stringsPath)) {
        try {
          const stringsContent = await fs.readFile(stringsPath, 'utf8');
          const strings = yaml.load(stringsContent);
          
          // Popola testi per ogni achievement
          for (const achName of Object.keys(achievementsData)) {
            const ach = achievementsData[achName];
            
            // Descrizioni pre e post
            if (strings[ach.preDesc]) {
              ach.preDesc[lang] = strings[ach.preDesc];
            }
            if (strings[ach.postDesc]) {
              ach.postDesc[lang] = strings[ach.postDesc];
            }
            
            // Titolo categoria
            if (strings[ach.category]) {
              ach.categoryTitle[lang] = strings[ach.category];
            }
          }
        } catch (error) {
          logger.warn(`Could not parse achievements_strings_${lang}.yaml: ${error.message}`);
        }
      }
    }
    
    const result = Object.values(achievementsData);
    
    // Raggruppa per categoria
    const categories = {};
    for (const ach of result) {
      if (!categories[ach.category]) {
        categories[ach.category] = [];
      }
      categories[ach.category].push(ach);
    }
    
    res.json({
      totalAchievements: result.length,
      totalCategories: Object.keys(categories).length,
      achievements: result.sort((a, b) => a.name.localeCompare(b.name)),
      achievementsByCategory: categories,
      availableLanguages: languages
    });
    
  } catch (error) {
    logger.error(`Error getting achievements: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API 17: Immagini achievement da achievements/images
app.get('/api/achievements/images', async (req, res) => {
  try {
    const imagesDir = path.join(GAME_ROOT, 'achievements', 'images');
    
    if (!await fs.pathExists(imagesDir)) {
      return res.status(404).json({ error: 'achievements/images directory not found' });
    }
    
    const files = await fs.readdir(imagesDir);
    const imageExtensions = ['.png', '.jpg', '.jpeg'];
    const images = [];
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const fileName = path.basename(file, ext);
      
      if (imageExtensions.includes(ext)) {
        const filePath = path.join(imagesDir, file);
        const stats = await fs.stat(filePath);
        
        // Determina se è pre o post achievement
        const isPreImage = fileName.startsWith('p_');
        const achievementName = isPreImage ? fileName.substring(2) : fileName;
        
        images.push({
          nomefile: fileName,
          percorso: `achievements/images/${file}`,
          tipo: isPreImage ? 'pre' : 'post',
          achievementName: achievementName,
          extension: ext,
          size: stats.size,
          lastModified: stats.mtime
        });
      }
    }
    
    // Raggruppa per achievement
    const imagesByAchievement = {};
    for (const img of images) {
      if (!imagesByAchievement[img.achievementName]) {
        imagesByAchievement[img.achievementName] = {
          achievementName: img.achievementName,
          preImage: null,
          postImage: null
        };
      }
      
      if (img.tipo === 'pre') {
        imagesByAchievement[img.achievementName].preImage = img;
      } else {
        imagesByAchievement[img.achievementName].postImage = img;
      }
    }
    
    res.json({
      totalImages: images.length,
      totalAchievements: Object.keys(imagesByAchievement).length,
      images: images.sort((a, b) => a.nomefile.localeCompare(b.nomefile)),
      imagesByAchievement: Object.values(imagesByAchievement).sort((a, b) => 
        a.achievementName.localeCompare(b.achievementName)
      ),
      supportedExtensions: imageExtensions
    });
    
  } catch (error) {
    logger.error(`Error getting achievement images: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API per servire singola immagine achievement
app.get('/api/achievements/image/:imageName', async (req, res) => {
  try {
    const { imageName } = req.params;
    const imagesDir = path.join(GAME_ROOT, 'achievements', 'images');
    
    // Cerca l'immagine con qualsiasi estensione valida
    const imageExtensions = ['.png', '.jpg', '.jpeg'];
    let imagePath = null;
    
    for (const ext of imageExtensions) {
      const testPath = path.join(imagesDir, `${imageName}${ext}`);
      if (await fs.pathExists(testPath)) {
        imagePath = testPath;
        break;
      }
    }
    
    if (!imagePath) {
      return res.status(404).json({ 
        error: 'Achievement image not found',
        imageName: imageName
      });
    }
    
    // Determina content type
    const ext = path.extname(imagePath).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
    
    // Leggi e servi l'immagine
    const imageBuffer = await fs.readFile(imagePath);
    
    res.set({
      'Content-Type': contentType,
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'public, max-age=3600' // Cache per 1 ora
    });
    
    res.send(imageBuffer);
    
    logger.info(`Achievement image served: ${imageName} -> ${path.basename(imagePath)}`);
    
  } catch (error) {
    logger.error(`Error serving achievement image: ${error.message}`);
    res.status(500).json({ error: 'Failed to serve achievement image' });
  }
});

// API generica: Lettura file da percorso
app.get('/api/file/*', async (req, res) => {
  try {
    // Ottieni il path dal wildcard
    const requestedPath = req.params[0];
    
    if (!requestedPath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    // Costruisci il path completo
    const fullPath = path.resolve(GAME_ROOT, requestedPath);
    
    // Validazione sicurezza path
    if (!fullPath.startsWith(path.resolve(GAME_ROOT))) {
      return res.status(403).json({ error: 'Invalid file path - outside game directory' });
    }
    
    if (!await fs.pathExists(fullPath)) {
      return res.status(404).json({ 
        error: 'File not found',
        path: requestedPath
      });
    }
    
    const stats = await fs.stat(fullPath);
    
    if (!stats.isFile()) {
      return res.status(400).json({ 
        error: 'Path is not a file',
        path: requestedPath
      });
    }
    
    // Leggi il contenuto del file
    const content = await fs.readFile(fullPath, 'utf8');
    const ext = path.extname(fullPath).toLowerCase();
    
    // Prova a fare parsing se è YAML
    let parsedContent = content;
    if (ext === '.yaml' || ext === '.yml') {
      try {
        parsedContent = yaml.load(content);
      } catch (yamlError) {
        logger.warn(`YAML parse error for ${requestedPath}: ${yamlError.message}`);
        parsedContent = content; // Fallback al contenuto raw
      }
    }
    
    res.json({
      path: requestedPath,
      filename: path.basename(fullPath),
      extension: ext,
      content: content,
      parsed: parsedContent,
      metadata: {
        size: stats.size,
        lastModified: stats.mtime,
        created: stats.birthtime,
        encoding: 'utf8'
      }
    });
    
    logger.info(`Generic file read: ${requestedPath}`);
    
  } catch (error) {
    logger.error(`Error reading file: ${error.message}`);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// API 12: Lista missions (versione semplificata)
app.get('/api/campaign/missions/list', async (req, res) => {
  try {
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const missionsData = {};
    const stellatedMissions = new Set(); // Mission collegate a bottoni
    
    // Prima, trova tutte le mission collegate a bottoni (stellate)
    for (const lang of languages) {
      // Da missions.yaml (routes che hanno bottoni)
      const missionsPath = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`, 'missions.yaml');
      if (await fs.pathExists(missionsPath)) {
        try {
          const content = await fs.readFile(missionsPath, 'utf8');
          const parsedMissions = yaml.load(content);
          
          if (Array.isArray(parsedMissions)) {
            for (const mission of parsedMissions) {
              if (mission.button && Array.isArray(mission.button) && mission.button.length >= 3) {
                const missionName = mission.button[2]; // Terzo elemento è il nome mission
                stellatedMissions.add(missionName);
              }
            }
          }
        } catch (error) {
          logger.warn(`Could not parse missions.yaml for stellated missions (${lang}): ${error.message}`);
        }
      }
    }
    
    // Poi, scansiona tutte le mission nei file script
    for (const lang of languages) {
      const campaignDir = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`);
      if (!await fs.pathExists(campaignDir)) continue;
      
      const files = await fs.readdir(campaignDir);
      for (const filename of files.filter(f => f.endsWith('.txt'))) {
        const filePath = path.join(campaignDir, filename);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Cerca blocchi MISSION
        const lines = content.split('\n');
        let currentMission = null;
        let commandCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (line.startsWith('MISSION ')) {
            if (currentMission) {
              // Salva mission precedente
              if (lang === 'EN' && !missionsData[currentMission]) {
                missionsData[currentMission] = {
                  nomemission: currentMission,
                  percorso: filename,
                  numeroblocchi: 0, // Calcolato dopo
                  numerocomandi: commandCount,
                  stellata: stellatedMissions.has(currentMission) ? 'si' : 'no'
                };
              }
            }
            
            // Inizia nuova mission
            currentMission = line.replace('MISSION ', '').trim();
            commandCount = 0;
            
          } else if (line === 'END_OF_MISSION') {
            // Fine mission corrente
            if (currentMission && lang === 'EN' && !missionsData[currentMission]) {
              missionsData[currentMission] = {
                nomemission: currentMission,
                percorso: filename,
                numeroblocchi: 0, // Calcolato dopo
                numerocomandi: commandCount,
                stellata: stellatedMissions.has(currentMission) ? 'si' : 'no'
              };
            }
            currentMission = null;
            commandCount = 0;
            
          } else if (currentMission && line && !line.startsWith('#')) {
            // Conta comandi dentro la mission
            commandCount++;
          }
        }
        
        // Gestisci ultima mission se il file finisce senza END_OF_MISSION
        if (currentMission && lang === 'EN' && !missionsData[currentMission]) {
          missionsData[currentMission] = {
            nomemission: currentMission,
            percorso: filename,
            numeroblocchi: 0,
            numerocomandi: commandCount,
            stellata: stellatedMissions.has(currentMission) ? 'si' : 'no'
          };
        }
      }
    }
    
    // Calcola numero blocchi per ogni mission
    for (const missionName of Object.keys(missionsData)) {
      try {
        // Trova e parsa la mission specifica
        const campaignDir = path.join(GAME_ROOT, 'campaign/campaignScriptsEN');
        const files = await fs.readdir(campaignDir);
        
        for (const filename of files.filter(f => f.endsWith('.txt'))) {
          const filePath = path.join(campaignDir, filename);
          const content = await fs.readFile(filePath, 'utf8');
          
          // Estrai solo la mission specifica
          const missionContent = extractMissionFromContent(content, missionName);
          if (missionContent) {
            // Usa il parser per ottenere i comandi
            const commands = [];
            const lines = missionContent.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line && !line.startsWith('#') && !line.startsWith('MISSION ') && line !== 'END_OF_MISSION') {
                const command = parseCommand(line, i + 1);
                commands.push(command);
              }
            }
            
            // Converti in blocchi
            const blocks = parseScriptToBlocks(commands);
            missionsData[missionName].numeroblocchi = blocks.length;
            break;
          }
        }
      } catch (error) {
        logger.warn(`Could not calculate blocks for mission ${missionName}: ${error.message}`);
      }
    }
    
    const result = Object.values(missionsData);
    
    res.json({
      totalMissions: result.length,
      stellatedMissions: result.filter(m => m.stellata === 'si').length,
      nonStellatedMissions: result.filter(m => m.stellata === 'no').length,
      missions: result.sort((a, b) => a.nomemission.localeCompare(b.nomemission))
    });
    
  } catch (error) {
    logger.error(`Error getting missions list: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Funzione helper per estrarre una mission specifica dal contenuto del file
function extractMissionFromContent(content, missionName) {
  const lines = content.split('\n');
  let inMission = false;
  let missionLines = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === `MISSION ${missionName}`) {
      inMission = true;
      missionLines.push(line);
    } else if (inMission && trimmed === 'END_OF_MISSION') {
      missionLines.push(line);
      break;
    } else if (inMission) {
      missionLines.push(line);
    }
  }
  
  return inMission ? missionLines.join('\n') : null;
}

// API 11: Script specifico con parsing completo (multilingua)
app.get('/api/campaign/script/:scriptName', async (req, res) => {
  try {
    const { scriptName } = req.params;
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    
    const scriptData = {
      nomescript: scriptName,
      languages: {},
      commands: [],
      blocks: [],
      metadata: {
        variables: [],
        characters: [],
        labels: [],
        nodes: [],
        missions: [],
        unknownCommands: []
      }
    };
    
    let foundScript = false;
    
    // Carica script da tutte le lingue
    for (const lang of languages) {
      const campaignDir = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`);
      
      if (await fs.pathExists(campaignDir)) {
        const files = await fs.readdir(campaignDir);
        
        for (const filename of files.filter(f => f.endsWith('.txt'))) {
          const filePath = path.join(campaignDir, filename);
          const content = await fs.readFile(filePath, 'utf8');
          const scripts = parseScriptContent(content, filename, lang);
          
          const targetScript = scripts.find(s => s.name === scriptName);
          if (targetScript) {
            foundScript = true;
            
            scriptData.languages[lang] = {
              content: targetScript.commands,
              fileName: filename,
              lastModified: (await fs.stat(filePath)).mtime
            };
            
            // Usa EN come base per metadati
            if (lang === 'EN') {
              scriptData.commands = targetScript.commands;
              scriptData.metadata = {
                variables: targetScript.variables || [],
                characters: targetScript.characters || [],
                labels: targetScript.labels || [],
                nodes: targetScript.nodes || [],
                missions: targetScript.missions || [],
                unknownCommands: targetScript.unknownCommands || []
              };
            }
            break;
          }
        }
      }
    }
    
    if (!foundScript) {
      return res.status(404).json({ error: `Script not found: ${scriptName}` });
    }
    
    // Consolida comandi multilingua
    const consolidatedCommands = [];
    scriptData.commands.forEach((baseCommand, index) => {
      const consolidatedCommand = { ...baseCommand };
      
      // Se il comando è localizzabile, crea l'oggetto multilingua
      if (baseCommand.parameters?.isLocalizable && baseCommand.parameters?.text) {
        consolidatedCommand.parameters.localizedText = {};
        
        // Aggiungi tutte le lingue disponibili
        Object.keys(scriptData.languages).forEach(lang => {
          const langCommands = scriptData.languages[lang]?.content || [];
          const langCommand = langCommands[index];
          
          if (langCommand && langCommand.parameters?.text) {
            consolidatedCommand.parameters.localizedText[lang] = langCommand.parameters.text;
          }
        });
        
        // Rimuovi il testo singolo, ora abbiamo l'oggetto multilingua
        delete consolidatedCommand.parameters.text;
        delete consolidatedCommand.parameters.isLocalizable;
      }
      
      consolidatedCommands.push(consolidatedCommand);
    });
    
    // Converti in blocchi strutturati
    try {
      scriptData.blocks = parseScriptToBlocks(consolidatedCommands);
    } catch (parseError) {
      logger.error(`Error parsing script ${scriptName} to blocks: ${parseError.message}`);
      scriptData.blocks = [];
    }
    
    // Determina se lo script è stellato
    const isStellated = await checkIfScriptIsStellated(scriptName);
    
    res.json({
      nomescript: scriptName,
      stellato: isStellated ? 'si' : 'no',
      availableLanguages: Object.keys(scriptData.languages),
      totalCommands: consolidatedCommands.length,
      totalBlocks: scriptData.blocks.length,
      
      // Codice originale (array di comandi testuali nell'ordine del file)
      originalCommands: consolidatedCommands,
      
      // Struttura rielaborata pronta per la visualizzazione a blocchi
      blocks: scriptData.blocks,
      
      // Metadati estratti
      metadata: scriptData.metadata,
      
      // Informazioni sui file
      fileInfo: Object.entries(scriptData.languages).map(([lang, info]) => ({
        language: lang,
        fileName: info.fileName,
        lastModified: info.lastModified
      }))
    });
    
  } catch (error) {
    logger.error(`Error getting script ${req.params.scriptName}: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Funzione helper per verificare se uno script è stellato
async function checkIfScriptIsStellated(scriptName) {
  const languages = ['EN'];
  
  try {
    // Controlla nei nodi
    for (const lang of languages) {
      const nodesPath = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`, 'nodes.yaml');
      if (await fs.pathExists(nodesPath)) {
        const content = await fs.readFile(nodesPath, 'utf8');
        const parsedNodes = yaml.load(content);
        
        if (Array.isArray(parsedNodes)) {
          for (const node of parsedNodes) {
            if (node.buttons && Array.isArray(node.buttons)) {
              for (const buttonDef of node.buttons) {
                if (Array.isArray(buttonDef) && buttonDef.length >= 2) {
                  if (buttonDef[1] === scriptName) {
                    return true;
                  }
                }
              }
            }
          }
        }
      }
      
      // Controlla nelle missions
      const missionsPath = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`, 'missions.yaml');
      if (await fs.pathExists(missionsPath)) {
        const content = await fs.readFile(missionsPath, 'utf8');
        const parsedMissions = yaml.load(content);
        
        if (Array.isArray(parsedMissions)) {
          for (const mission of parsedMissions) {
            if (mission.button && Array.isArray(mission.button) && mission.button.length >= 2) {
              if (mission.button[1] === scriptName) {
                return true;
              }
            }
          }
        }
      }
    }
  } catch (error) {
    logger.warn(`Error checking if script ${scriptName} is stellated: ${error.message}`);
  }
  
  return false;
}

// API per generare analisi completa dei comandi
app.get('/api/campaign/scripts/commands-analysis', async (req, res) => {
  try {
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const commandStats = new Map();
    const unknownCommands = new Set();
    const allCommands = [];
    let totalCommands = 0;
    
    // Scansiona tutti i file script
    for (const lang of languages) {
      const campaignDir = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`);
      
      if (await fs.pathExists(campaignDir)) {
        const files = await fs.readdir(campaignDir);
        const txtFiles = files.filter(f => f.endsWith('.txt'));
        
        for (const filename of txtFiles) {
          const filePath = path.join(campaignDir, filename);
          
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              
              if (line && !line.startsWith('#') && !line.startsWith('SCRIPT ') && line !== 'END_OF_SCRIPT' && line !== 'SCRIPTS') {
                const firstWord = line.split(' ')[0].toUpperCase();
                totalCommands++;
                
                allCommands.push({
                  command: line,
                  firstWord: firstWord,
                  file: filename,
                  language: lang,
                  line: i + 1
                });
                
                // Statistiche per prima parola
                if (!commandStats.has(firstWord)) {
                  commandStats.set(firstWord, {
                    count: 0,
                    examples: []
                  });
                }
                
                const stat = commandStats.get(firstWord);
                stat.count++;
                
                // Salva alcuni esempi
                if (stat.examples.length < 5) {
                  stat.examples.push({
                    command: line,
                    file: filename,
                    language: lang
                  });
                }
                
                // Verifica se è comando unknown
                const cmd = parseCommand(line, i + 1);
                if (cmd.type === 'unknown') {
                  unknownCommands.add(firstWord);
                }
              }
            }
          } catch (fileError) {
            logger.warn(`Could not read ${filePath}: ${fileError.message}`);
          }
        }
      }
    }
    
    // Ordina comandi per frequenza
    const sortedCommands = Array.from(commandStats.entries())
      .sort((a, b) => b[1].count - a[1].count);
    
    // Genera report
    const report = {
      summary: {
        totalCommands,
        uniqueCommandTypes: commandStats.size,
        unknownCommandTypes: unknownCommands.size,
        languages: languages.length
      },
      commandsByFrequency: sortedCommands.map(([command, stats]) => ({
        command,
        count: stats.count,
        percentage: ((stats.count / totalCommands) * 100).toFixed(2),
        isUnknown: unknownCommands.has(command),
        examples: stats.examples
      })),
      unknownCommands: Array.from(unknownCommands).sort(),
      allCommands: allCommands.slice(0, 1000) // Limita per dimensione response
    };
    
    // Salva report in SUPPORTOBUG.txt
    const reportText = `COMMAND ANALYSIS REPORT
Generated: ${new Date().toISOString()}
=================================

SUMMARY:
- Total Commands: ${report.summary.totalCommands}
- Unique Command Types: ${report.summary.uniqueCommandTypes}
- Unknown Command Types: ${report.summary.unknownCommandTypes}
- Languages Analyzed: ${report.summary.languages}

COMMANDS BY FREQUENCY:
${report.commandsByFrequency.map(cmd => 
  `${cmd.command.padEnd(20)} | ${cmd.count.toString().padStart(5)} (${cmd.percentage}%) ${cmd.isUnknown ? '❌ UNKNOWN' : '✅ PARSED'}`
).join('\n')}

UNKNOWN COMMANDS NEEDING IMPLEMENTATION:
${report.unknownCommands.map(cmd => `- ${cmd}`).join('\n')}

EXAMPLES OF EACH COMMAND TYPE:
${report.commandsByFrequency.map(cmd => 
  `\n${cmd.command} (${cmd.count} occurrences):\n${cmd.examples.map(ex => 
    `  ${ex.file}:${ex.language} - ${ex.command}`
  ).join('\n')}`
).join('\n')}
`;

    const reportPath = path.join(__dirname, '../reports/SUPPORTOBUG.txt');
    await fs.ensureDir(path.dirname(reportPath));
    await fs.writeFile(reportPath, reportText, 'utf8');
    
    logger.info(`Command analysis saved to ${reportPath}`);
    
    res.json({
      message: 'Command analysis completed',
      reportPath: reportPath,
      summary: report.summary,
      topCommands: report.commandsByFrequency.slice(0, 20),
      unknownCommands: report.unknownCommands
    });
    
  } catch (error) {
    logger.error(`Error analyzing commands: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API per servire immagini dei personaggi
app.get('/api/character/image/:characterName', async (req, res) => {
  try {
    const { characterName } = req.params;
    const { variant = 'default' } = req.query;
    
    // Path base delle immagini personaggi
    const imageDir = path.join(GAME_ROOT, 'campaign', 'campaignMap', 'big');
    let imagePath;
    
    // Prima prova con variante specifica se richiesta
    if (variant !== 'default') {
      imagePath = path.join(imageDir, `${characterName}_${variant}.png`);
      if (!await fs.pathExists(imagePath)) {
        imagePath = path.join(imageDir, `${characterName}_${variant}.jpg`);
      }
    }
    
    // Se non trovata o richiesta default, usa immagine base
    if (!imagePath || !await fs.pathExists(imagePath)) {
      imagePath = path.join(imageDir, `${characterName}.png`);
      if (!await fs.pathExists(imagePath)) {
        imagePath = path.join(imageDir, `${characterName}.jpg`);
      }
    }
    
    // Se ancora non trovata, usa placeholder con fallback completo
    if (!await fs.pathExists(imagePath)) {
      imagePath = await findPlaceholderImage(imageDir, characterName);
      
      if (!imagePath) {
        return res.status(404).json({ 
          error: 'Character image not found and no placeholder available',
          character: characterName,
          variant: variant,
          searchedPaths: [
            `${characterName}_${variant}.png/jpg`,
            `${characterName}.png/jpg`,
            'placeholder.png',
            'avatars/common/avatar_no_avatar.png'
          ]
        });
      }
    }
    
    // Determina content type
    const ext = path.extname(imagePath).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
    
    // Leggi e servi l'immagine
    const imageBuffer = await fs.readFile(imagePath);
    
    res.set({
      'Content-Type': contentType,
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'public, max-age=3600' // Cache per 1 ora
    });
    
    res.send(imageBuffer);
    
    logger.info(`Character image served: ${characterName} (${variant}) -> ${path.basename(imagePath)}`);
    
  } catch (error) {
    logger.error(`Error serving character image: ${error.message}`);
    res.status(500).json({ error: 'Failed to serve character image' });
  }
});

// API per ottenere tutte le immagini disponibili per un personaggio
app.get('/api/character/:characterName/images', async (req, res) => {
  try {
    const { characterName } = req.params;
    
    const availableImages = await findCharacterImages(characterName);
    
    res.json({
      character: characterName,
      totalImages: availableImages.length,
      images: availableImages
    });
    
    logger.info(`Character images listed: ${characterName} (${availableImages.length} images found)`);
    
  } catch (error) {
    logger.error(`Error listing character images: ${error.message}`);
    res.status(500).json({ error: 'Failed to list character images' });
  }
});

// API centralizzata per parsing completo degli script di campagna
app.get('/api/campaign/scripts/parsed', async (req, res) => {
  try {
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const scriptFiles = [
      'tutorials.txt', 'scripts1.txt', 'scripts2.txt', 'scripts3.txt', 
      'scripts4.txt', 'scripts5.txt', 'missions.txt', 'inits.txt',
      'base_inits.txt', 'ms_scripts.txt', 'stdMissions.txt', 'missions2.txt'
    ];

    const result = {
      scripts: {},
      semafori: new Map(), // Boolean variables (SET/RESET)
      variables: new Map(), // Numeric variables (SET_TO)  
      characters: new Map(), // Character data with states
      missions: new Map(), // Mission references
      labels: new Map(), // Label definitions and references
      nodes: new Map(), // Node references
      metadata: {
        totalScripts: 0,
        totalCommands: 0,
        languages: [],
        lastUpdated: new Date().toISOString()
      }
    };

    // Scansiona tutte le cartelle lingua per trovare file esistenti
    for (const lang of languages) {
      const campaignDir = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`);
      
      if (await fs.pathExists(campaignDir)) {
        result.metadata.languages.push(lang);
        const files = await fs.readdir(campaignDir);
        const txtFiles = files.filter(f => f.endsWith('.txt'));
        
        for (const filename of txtFiles) {
          const filePath = path.join(campaignDir, filename);
          
          try {
            const content = await fs.readFile(filePath, 'utf8');
            if (content.trim()) {
              const parsedScripts = parseScriptContent(content, filename, lang);
              
              // Raggruppa per nome script
              for (const script of parsedScripts) {
                if (!result.scripts[script.name]) {
                  result.scripts[script.name] = {
                    name: script.name,
                    fileName: filename,
                    languages: {},
                    commands: [],
                    variables: [],
                    characters: [],
                    missions: [],
                    labels: [],
                    nodes: []
                  };
                }
                
                // Aggiungi versione lingua
                result.scripts[script.name].languages[lang] = {
                  content: script.commands,
                  lastModified: (await fs.stat(filePath)).mtime
                };
                
                // Se è inglese, usa come reference per metadati e crea entità dettagliate
                if (lang === 'EN') {
                  result.scripts[script.name].commands = script.commands;
                  result.scripts[script.name].variables = script.variables;
                  result.scripts[script.name].characters = script.characters;
                  result.scripts[script.name].missions = script.missions;
                  result.scripts[script.name].labels = script.labels;
                  result.scripts[script.name].nodes = script.nodes;
                  
                  // Processa comandi per creare entità dettagliate
                  script.commands.forEach(cmd => {
                    // SEMAFORI (Boolean variables)
                    if (cmd.type === 'semaforo_set' || cmd.type === 'semaforo_reset') {
                      const varName = cmd.parameters?.variable;
                      if (varName) {
                        if (!result.semafori.has(varName)) {
                          result.semafori.set(varName, {
                            name: varName,
                            type: 'semaforo',
                            scripts: new Set(),
                            value: null,
                            operations: []
                          });
                        }
                        const semaforo = result.semafori.get(varName);
                        semaforo.scripts.add(script.name);
                        semaforo.operations.push({
                          script: script.name,
                          line: cmd.line,
                          operation: cmd.type === 'semaforo_set' ? 'SET' : 'RESET'
                        });
                      }
                    }
                    
                    // VARIABLES (Numeric variables)
                    else if (cmd.type === 'variable_set') {
                      const varName = cmd.parameters?.variable;
                      if (varName) {
                        if (!result.variables.has(varName)) {
                          result.variables.set(varName, {
                            name: varName,
                            type: 'variable',
                            scripts: new Set(),
                            value: null,
                            operations: []
                          });
                        }
                        const variable = result.variables.get(varName);
                        variable.scripts.add(script.name);
                        variable.operations.push({
                          script: script.name,
                          line: cmd.line,
                          operation: 'SET_TO',
                          value: cmd.parameters?.value
                        });
                      }
                    }
                    
                    // CHARACTERS
                    else if (cmd.type === 'show_character' || cmd.type === 'change_character' || cmd.type === 'hide_character') {
                      const charName = cmd.parameters?.character;
                      if (charName) {
                        if (!result.characters.has(charName)) {
                          result.characters.set(charName, {
                            name: charName,
                            scripts: new Set(),
                            states: [],
                            defaultImage: `/api/character/image/${charName}`,
                            availableImages: [], // Sarà popolato dopo
                            currentImage: 'default',
                            currentPosition: 'center',
                            visible: false
                          });
                        }
                        const character = result.characters.get(charName);
                        character.scripts.add(script.name);
                        character.states.push({
                          script: script.name,
                          line: cmd.line,
                          action: cmd.type,
                          image: cmd.parameters?.image,
                          position: cmd.parameters?.position
                        });
                        
                        // Aggiorna stato corrente
                        if (cmd.type === 'show_character') {
                          character.visible = true;
                          character.currentPosition = cmd.parameters?.position || 'center';
                          character.currentImage = cmd.parameters?.image || 'default';
                        } else if (cmd.type === 'hide_character') {
                          character.visible = false;
                        } else if (cmd.type === 'change_character') {
                          character.currentImage = cmd.parameters?.image || character.currentImage;
                        }
                      }
                    }
                    
                    // LABELS
                    else if (cmd.type === 'label') {
                      const labelName = cmd.parameters?.label;
                      if (labelName) {
                        if (!result.labels.has(labelName)) {
                          result.labels.set(labelName, {
                            name: labelName,
                            definedIn: null,
                            referencedBy: new Set()
                          });
                        }
                        const label = result.labels.get(labelName);
                        label.definedIn = {
                          script: script.name,
                          line: cmd.line
                        };
                      }
                    }
                    
                    // GOTO (Label references)
                    else if (cmd.type === 'goto') {
                      const labelName = cmd.parameters?.label;
                      if (labelName) {
                        if (!result.labels.has(labelName)) {
                          result.labels.set(labelName, {
                            name: labelName,
                            definedIn: null,
                            referencedBy: new Set()
                          });
                        }
                        const label = result.labels.get(labelName);
                        label.referencedBy.add({
                          script: script.name,
                          line: cmd.line
                        });
                      }
                    }
                    
                    // NODES
                    else if (cmd.type === 'center_map' || cmd.type === 'show_node') {
                      const nodeName = cmd.parameters?.node;
                      if (nodeName) {
                        if (!result.nodes.has(nodeName)) {
                          result.nodes.set(nodeName, {
                            name: nodeName,
                            scripts: new Set(),
                            operations: []
                          });
                        }
                        const node = result.nodes.get(nodeName);
                        node.scripts.add(script.name);
                        node.operations.push({
                          script: script.name,
                          line: cmd.line,
                          operation: cmd.type === 'center_map' ? 'CENTER' : 'SHOW'
                        });
                      }
                    }
                  });
                  
                  result.metadata.totalCommands += script.commands.length;
                }
              }
            }
          } catch (fileError) {
            logger.warn(`Could not read ${filePath}: ${fileError.message}`);
          }
        }
      }
    }

    result.metadata.totalScripts = Object.keys(result.scripts).length;
    
    // Popola le immagini disponibili per ogni personaggio
    for (const [charName, character] of result.characters.entries()) {
      try {
        const availableImages = await findCharacterImages(charName);
        character.availableImages = availableImages;
      } catch (error) {
        logger.warn(`Could not load images for character ${charName}: ${error.message}`);
        character.availableImages = [];
      }
    }
    
    // Converti Map e Set in oggetti/array JSON-serializzabili
    const response = {
      scripts: result.scripts,
      semafori: Object.fromEntries(
        Array.from(result.semafori.entries()).map(([key, value]) => [
          key, 
          {
            ...value,
            scripts: Array.from(value.scripts)
          }
        ])
      ),
      variables: Object.fromEntries(
        Array.from(result.variables.entries()).map(([key, value]) => [
          key,
          {
            ...value, 
            scripts: Array.from(value.scripts)
          }
        ])
      ),
      characters: Object.fromEntries(
        Array.from(result.characters.entries()).map(([key, value]) => [
          key,
          {
            ...value,
            scripts: Array.from(value.scripts)
          }
        ])
      ),
      labels: Object.fromEntries(
        Array.from(result.labels.entries()).map(([key, value]) => [
          key,
          {
            ...value,
            referencedBy: Array.from(value.referencedBy)
          }
        ])
      ),
      nodes: Object.fromEntries(
        Array.from(result.nodes.entries()).map(([key, value]) => [
          key,
          {
            ...value,
            scripts: Array.from(value.scripts)
          }
        ])
      ),
      metadata: result.metadata
    };

    // Converti script in struttura a blocchi per Visual Flow Editor
    for (const scriptName of Object.keys(result.scripts)) {
      const script = result.scripts[scriptName];
      if (script.commands && script.commands.length > 0) {
        try {
          // Consolida comandi multilingua per questo script specifico
          const consolidatedCommands = [];
          script.commands.forEach((baseCommand, index) => {
            const consolidatedCommand = { ...baseCommand };
            
            // Se il comando è localizzabile, crea l'array multilingua
            if (baseCommand.parameters?.isLocalizable && baseCommand.parameters?.text) {
              consolidatedCommand.parameters.localizedText = {};
              
              // Aggiungi tutte le lingue disponibili
              Object.keys(script.languages || {}).forEach(lang => {
                const langCommands = script.languages[lang]?.content || [];
                const langCommand = langCommands[index];
                
                if (langCommand && langCommand.parameters?.text) {
                  consolidatedCommand.parameters.localizedText[lang] = langCommand.parameters.text;
                }
              });
              
              // Rimuovi il testo singolo, ora abbiamo l'array
              delete consolidatedCommand.parameters.text;
              delete consolidatedCommand.parameters.isLocalizable;
            }
            
            consolidatedCommands.push(consolidatedCommand);
          });
          
          script.blocks = parseScriptToBlocks(consolidatedCommands);
        } catch (parseError) {
          logger.error(`Error parsing script ${scriptName} to blocks: ${parseError.message}`);
          script.blocks = [];
        }
      }
    }

    logger.info(`Parsed ${response.metadata.totalScripts} scripts with ${response.metadata.totalCommands} commands across ${response.metadata.languages.length} languages`);
    res.json(response);
  } catch (error) {
    logger.error(`Error parsing campaign scripts: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API per conversione specifica script-to-blocks
// Endpoint per parsare contenuto script in blocchi
app.post('/api/campaign/script/parse-content', async (req, res) => {
  try {
    const { script, fileName = 'unknown.txt' } = req.body;
    
    if (!script || typeof script !== 'string') {
      return res.status(400).json({ error: 'Script content is required as string' });
    }
    
    // Parsa il contenuto dello script
    const parsedScripts = parseScriptContent(script, fileName, 'EN');
    
    if (parsedScripts.length === 0) {
      return res.json({ 
        blocks: [],
        scripts: [],
        message: 'No scripts found in content'
      });
    }
    
    // Prendi il primo script se ce ne sono più di uno
    const scriptData = parsedScripts[0];
    
    // Converti in blocchi strutturati
    const blocks = parseScriptToBlocks(scriptData.commands);
    
    res.json({
      blocks: blocks,
      scriptName: scriptData.name,
      commands: scriptData.commands,
      variables: scriptData.variables || [],
      characters: scriptData.characters || [],
      totalBlocks: blocks.length,
      fileName: fileName
    });
    
  } catch (error) {
    console.error('Error parsing script content:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

app.post('/api/campaign/script/convert-to-blocks', async (req, res) => {
  try {
    const { scriptName, includeAllLanguages = true } = req.body;
    
    if (!scriptName) {
      return res.status(400).json({ error: 'Script name is required' });
    }
    
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const scriptData = {
      name: scriptName,
      languages: {},
      commands: [],
      blocks: []
    };
    
    // Carica script da tutte le lingue
    for (const lang of languages) {
      const campaignDir = path.join(GAME_ROOT, `campaign/campaignScripts${lang}`);
      
      if (await fs.pathExists(campaignDir)) {
        const files = await fs.readdir(campaignDir);
        
        for (const filename of files) {
          if (filename.endsWith('.txt')) {
            const filePath = path.join(campaignDir, filename);
            const content = await fs.readFile(filePath, 'utf8');
            const scripts = parseScriptContent(content, filename, lang);
            
            const targetScript = scripts.find(s => s.name === scriptName);
            if (targetScript) {
              scriptData.languages[lang] = {
                content: targetScript.commands,
                lastModified: (await fs.stat(filePath)).mtime
              };
              
              // Usa EN come base
              if (lang === 'EN') {
                scriptData.commands = targetScript.commands;
                scriptData.variables = targetScript.variables;
                scriptData.characters = targetScript.characters;
                scriptData.labels = targetScript.labels;
                scriptData.nodes = targetScript.nodes;
                scriptData.missions = targetScript.missions;
              }
              break;
            }
          }
        }
      }
    }
    
    if (!scriptData.commands || scriptData.commands.length === 0) {
      return res.status(404).json({ error: `Script not found: ${scriptName}` });
    }
    
    // Consolida comandi multilingua
    const consolidated = consolidateMultilingualCommands({ [scriptName]: scriptData });
    const consolidatedScript = consolidated[scriptName];
    
    // Converti in blocchi
    const blocks = parseScriptToBlocks(consolidatedScript.commands);
    
    res.json({
      scriptName: consolidatedScript.name,
      availableLanguages: Object.keys(scriptData.languages),
      originalCommands: consolidatedScript.commands,
      blocks,
      metadata: {
        variables: consolidatedScript.variables || [],
        characters: consolidatedScript.characters || [],
        labels: consolidatedScript.labels || [],
        nodes: consolidatedScript.nodes || [],
        missions: consolidatedScript.missions || [],
        unknownCommands: consolidatedScript.unknownCommands || []
      }
    });
    
  } catch (error) {
    logger.error(`Error converting script to blocks: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API per conversione blocks-to-script e aggiornamento file
app.post('/api/campaign/script/update-from-blocks', async (req, res) => {
  try {
    const { scriptName, language = 'EN', blocks } = req.body;
    
    if (!scriptName || !blocks) {
      return res.status(400).json({ error: 'Script name and blocks are required' });
    }
    
    // Converti blocchi in script
    const scriptContent = convertBlocksToScript(blocks);
    
    // Trova il file script esistente
    const campaignDir = path.join(GAME_ROOT, `campaign/campaignScripts${language}`);
    const originalFilePath = path.join(campaignDir, `${scriptName}.txt`);
    
    if (!await fs.pathExists(originalFilePath)) {
      return res.status(404).json({ error: `Script file not found: ${scriptName}` });
    }
    
    // Leggi contenuto esistente
    const originalContent = await fs.readFile(originalFilePath, 'utf8');
    
    // File di test per sicurezza - NON modificare originali
    const testFilePath = path.join(campaignDir, `${scriptName}_test.txt`);
    
    // Crea backup del file originale
    await createBackup(originalFilePath, originalContent);
    
    // Ricostruisci il file completo mantenendo header/footer
    const lines = originalContent.split('\n');
    let newContent = '';
    let inScript = false;
    let foundScript = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith(`SCRIPT ${scriptName}`)) {
        newContent += `${line}\n`;
        newContent += scriptContent;
        foundScript = true;
        inScript = true;
      } else if (line === 'END_OF_SCRIPT' && inScript) {
        newContent += `${line}\n`;
        inScript = false;
      } else if (!inScript) {
        newContent += `${lines[i]}\n`;
      }
      // Skip lines inside the target script
    }
    
    if (!foundScript) {
      return res.status(404).json({ error: `Script ${scriptName} not found in file` });
    }
    
    // Scrivi file TEST (sicurezza - non toccare originali)
    await fs.writeFile(testFilePath, newContent, 'utf8');
    
    logger.info(`Script ${scriptName} saved as TEST FILE in ${language}: ${testFilePath}`);
    
    res.json({
      message: 'Script saved as TEST FILE (original untouched)',
      scriptName,
      language,
      originalFilePath,
      testFilePath,
      backupCreated: true,
      linesUpdated: scriptContent.split('\n').length - 1,
      warning: 'This is a TEST FILE - original file was not modified'
    });
    
  } catch (error) {
    logger.error(`Error updating script from blocks: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API specifica per file di campagna con supporto multi-lingua
app.get('/api/campaign/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { lang = 'EN' } = req.query;
    
    // Determina la directory basata sulla lingua
    const campaignDir = `campaign/campaignScripts${lang.toUpperCase()}`;
    const filePath = path.join(GAME_ROOT, campaignDir, filename);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ 
        error: 'File not found',
        path: filePath,
        lang: lang.toUpperCase()
      });
    }

    const content = await fs.readFile(filePath, 'utf8');
    const stats = await fs.stat(filePath);
    
    logger.info(`Campaign file read: ${filePath} (lang: ${lang.toUpperCase()})`);
    
    res.json({
      filename,
      content,
      language: lang.toUpperCase(),
      lastModified: stats.mtime,
      size: stats.size
    });
    
  } catch (error) {
    logger.error(`Error reading campaign file: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API per salvare file di campagna con supporto multi-lingua
app.post('/api/campaign/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { lang = 'EN' } = req.query;
    const { content } = req.body;
    
    if (!content && content !== '') {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Determina la directory basata sulla lingua
    const campaignDir = `campaign/campaignScripts${lang.toUpperCase()}`;
    const filePath = path.join(GAME_ROOT, campaignDir, filename);
    
    // Crea backup prima di salvare
    if (await fs.pathExists(filePath)) {
      const backupName = `${filename}_${lang.toUpperCase()}_${Date.now()}.bak`;
      const backupPath = path.join(BACKUP_DIR, backupName);
      await fs.copy(filePath, backupPath);
      logger.info(`Backup created: ${backupPath}`);
    }
    
    // Assicurati che la directory esista
    await fs.ensureDir(path.dirname(filePath));
    
    // Salva il file
    await fs.writeFile(filePath, content, 'utf8');
    
    logger.info(`Campaign file saved: ${filePath} (lang: ${lang.toUpperCase()})`);
    
    res.json({
      message: 'File saved successfully',
      filename,
      language: lang.toUpperCase(),
      path: filePath
    });
    
  } catch (error) {
    logger.error(`Error saving campaign file: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API per listare file di una categoria
app.get('/api/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const config = GAME_STRUCTURE[category];
    
    if (!config) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const categoryPath = path.join(GAME_ROOT, config.path);
    
    if (!await fs.pathExists(categoryPath)) {
      return res.json({ files: [], message: 'Directory does not exist' });
    }

    const files = await fs.readdir(categoryPath);
    const extensions = Array.isArray(config.extension) ? config.extension : [config.extension];
    const filteredFiles = files.filter(file => 
      extensions.some(ext => file.endsWith(ext)) && !file.startsWith('.')
    );

    const fileList = await Promise.all(
      filteredFiles.map(async (file) => {
        const filePath = path.join(categoryPath, file);
        const stats = await fs.stat(filePath);
        
        return {
          name: file,
          path: path.relative(GAME_ROOT, filePath),
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime
        };
      })
    );

    res.json({
      category,
      path: config.path,
      files: fileList.sort((a, b) => a.name.localeCompare(b.name))
    });

  } catch (error) {
    logger.error(`Error listing ${req.params.category}: ${error.message}`);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// API per leggere un file specifico
app.get('/api/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;
    const config = GAME_STRUCTURE[category];
    
    if (!config) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const filePath = path.join(GAME_ROOT, config.path, filename);
    
    if (!validatePath(filePath)) {
      return res.status(403).json({ error: 'Invalid file path' });
    }

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = await fs.readFile(filePath, 'utf8');
    const stats = await fs.stat(filePath);

    // Parse YAML se applicabile
    let parsedContent = content;
    if (config.extension === '.yaml') {
      try {
        parsedContent = yaml.load(content);
      } catch (yamlError) {
        logger.warn(`YAML parse error for ${filename}: ${yamlError.message}`);
      }
    }

    res.json({
      filename,
      path: path.relative(GAME_ROOT, filePath),
      content,
      parsed: parsedContent,
      metadata: {
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        encoding: 'utf8'
      }
    });

  } catch (error) {
    logger.error(`Error reading file ${req.params.filename}: ${error.message}`);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// API per salvare/creare un file
app.put('/api/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;
    const { content, createBackup: shouldBackup = true } = req.body;
    const config = GAME_STRUCTURE[category];
    
    if (!config) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const filePath = path.join(GAME_ROOT, config.path, filename);
    
    if (!validatePath(filePath)) {
      return res.status(403).json({ error: 'Invalid file path' });
    }

    // Assicurati che la directory esista
    await fs.ensureDir(path.dirname(filePath));

    // Crea backup se il file esiste già
    if (shouldBackup && await fs.pathExists(filePath)) {
      const existingContent = await fs.readFile(filePath, 'utf8');
      await createBackup(filePath, existingContent);
    }

    // Valida YAML se applicabile
    if (config.extension === '.yaml') {
      try {
        yaml.load(content); // Testa se è YAML valido
      } catch (yamlError) {
        return res.status(400).json({ 
          error: 'Invalid YAML content',
          details: yamlError.message 
        });
      }
    }

    // Salva il file
    await fs.writeFile(filePath, content, 'utf8');
    const stats = await fs.stat(filePath);

    logger.info(`File saved: ${filePath}`);

    res.json({
      filename,
      path: path.relative(GAME_ROOT, filePath),
      saved: true,
      metadata: {
        size: stats.size,
        modified: stats.mtime
      }
    });

  } catch (error) {
    logger.error(`Error saving file ${req.params.filename}: ${error.message}`);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// API per eliminare un file
app.delete('/api/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;
    const { createBackup: shouldBackup = true } = req.body;
    const config = GAME_STRUCTURE[category];
    
    if (!config) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const filePath = path.join(GAME_ROOT, config.path, filename);
    
    if (!validatePath(filePath)) {
      return res.status(403).json({ error: 'Invalid file path' });
    }

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Crea backup prima di eliminare
    if (shouldBackup) {
      const content = await fs.readFile(filePath, 'utf8');
      await createBackup(filePath, content);
    }

    await fs.remove(filePath);
    logger.info(`File deleted: ${filePath}`);

    res.json({
      filename,
      deleted: true,
      backup: shouldBackup
    });

  } catch (error) {
    logger.error(`Error deleting file ${req.params.filename}: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// API per validare un file YAML
app.post('/api/validate/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { content } = req.body;
    const config = GAME_STRUCTURE[category];
    
    if (!config) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const errors = [];
    const warnings = [];

    // Valida YAML base
    if (config.extension === '.yaml') {
      try {
        const parsed = yaml.load(content);
        
        
      } catch (yamlError) {
        errors.push(`Invalid YAML: ${yamlError.message}`);
      }
    }

    res.json({
      valid: errors.length === 0,
      errors,
      warnings
    });

  } catch (error) {
    logger.error(`Error validating content: ${error.message}`);
    res.status(500).json({ error: 'Failed to validate content' });
  }
});

// API per ottenere i backup
app.get('/api/backups', async (req, res) => {
  try {
    const backupFiles = await fs.readdir(BACKUP_DIR);
    const backups = await Promise.all(
      backupFiles.map(async (file) => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          path: filePath
        };
      })
    );

    res.json({ 
      backups: backups.sort((a, b) => b.created - a.created)
    });

  } catch (error) {
    logger.error(`Error getting backups: ${error.message}`);
    res.status(500).json({ error: 'Failed to get backups' });
  }
});


// Error handler
app.use((error, req, res, next) => {
  logger.error(`Unhandled error: ${error.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// File watcher per notificare cambiamenti
const watcher = chokidar.watch(GAME_ROOT, {
  ignored: /(^|[\/\\])\../, // ignora file nascosti
  persistent: true,
  ignoreInitial: true
});

watcher.on('change', (filePath) => {
  logger.info(`File changed: ${filePath}`);
  // Qui potresti implementare notifiche WebSocket se necessario
});

// Trova immagine placeholder con fallback multipli
async function findPlaceholderImage(searchDir, characterName) {
  // Lista percorsi fallback in ordine di priorità
  const fallbackPaths = [
    path.join(searchDir, 'placeholder.png'),
    path.join(searchDir, 'unknown.png'),
    path.join(searchDir, 'default.png'),
    path.join(GAME_ROOT, 'avatars', 'common', 'avatar_no_avatar.png'),
    path.join(GAME_ROOT, 'campaign', 'placeholder.png'),
    path.join(GAME_ROOT, 'assets', 'placeholder.png')
  ];
  
  // Cerca ogni percorso fallback
  for (const fallbackPath of fallbackPaths) {
    if (await fs.pathExists(fallbackPath)) {
      logger.info(`Using placeholder image for ${characterName}: ${path.relative(GAME_ROOT, fallbackPath)}`);
      return fallbackPath;
    }
  }
  
  // Ultimo tentativo: genera placeholder dinamico se possibile
  try {
    const dynamicPlaceholder = await generateDynamicPlaceholder(searchDir, characterName);
    if (dynamicPlaceholder) {
      return dynamicPlaceholder;
    }
  } catch (error) {
    logger.warn(`Cannot generate dynamic placeholder: ${error.message}`);
  }
  
  return null;
}

// Genera placeholder dinamico semplice (file vuoto PNG valido)
async function generateDynamicPlaceholder(targetDir, characterName) {
  try {
    // Path per placeholder generato
    const generatedPath = path.join(targetDir, 'generated_placeholder.png');
    
    // Se già esiste, usalo
    if (await fs.pathExists(generatedPath)) {
      return generatedPath;
    }
    
    // Crea directory se non esiste
    await fs.ensureDir(targetDir);
    
    // Genera PNG 1x1 trasparente (minimo PNG valido)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk size
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
      0x1F, 0x15, 0xC4, 0x89, // CRC
      0x00, 0x00, 0x00, 0x0B, // IDAT chunk size
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00, 0x05, 0x00, 0x01,
      0x0D, 0x0A, 0x2D, 0xB4, // compressed data + CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk size
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    await fs.writeFile(generatedPath, pngData);
    logger.info(`Generated dynamic placeholder: ${path.relative(GAME_ROOT, generatedPath)}`);
    
    return generatedPath;
    
  } catch (error) {
    logger.error(`Failed to generate dynamic placeholder: ${error.message}`);
    return null;
  }
}

app.listen(PORT, () => {
  logger.info(`Galaxy Trucker Editor Server running on port ${PORT}`);
  logger.info(`Game root: ${GAME_ROOT}`);
  logger.info(`Backup directory: ${BACKUP_DIR}`);
});

module.exports = app;
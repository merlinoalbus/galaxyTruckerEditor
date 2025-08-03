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
      text: trimmed.substring(4).replace(/^"|"$/g, '')
    };
  } else if (upperLine === 'END_OF_OPT') {
    type = 'menu_option_end';
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
    type = 'menu_option_conditional';
    const match = trimmed.match(/OPT_IFNOT\s+(\w+)\s+"(.+)"/);
    if (match) {
      parameters = {
        condition: match[1],
        conditionType: 'not',
        text: match[2]
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
  
  // Dialog scene management
  } else if (upperLine === 'SHOWDLGSCENE') {
    type = 'dialog_scene_open';
  } else if (upperLine === 'HIDEDLGSCENE') {
    type = 'dialog_scene_close';
  
  // Dialogue commands
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
  } else if (upperLine.startsWith('ANNOUNCE ')) {
    type = 'announce';
    parameters = {
      text: trimmed.substring(9).replace(/^"|"$/g, '')
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
  } else if (upperLine.startsWith('RUNSCRIPT ')) {
    type = 'script_call';
    parameters = {
      script: trimmed.substring(10).trim()
    };
  } else if (upperLine === 'RETURN') {
    type = 'return';

  // Timing commands
  } else if (upperLine.startsWith('DELAY ')) {
    type = 'delay';
    parameters = {
      milliseconds: parseInt(trimmed.split(' ')[1])
    };
  } else if (upperLine.startsWith('WAIT ')) {
    type = 'wait';
    parameters = {
      condition: trimmed.substring(5).trim()
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
  } else if (upperLine.startsWith('CENTER_MAP ')) {
    type = 'center_map';
    parameters = {
      node: trimmed.substring(11).trim()
    };
  } else if (upperLine.startsWith('SHOW_NODE ')) {
    type = 'show_node';
    parameters = {
      node: trimmed.substring(10).trim()
    };

  // Opponent commands
  } else if (upperLine.startsWith('ADDOPPONENT ')) {
    type = 'add_opponent';
    parameters = {
      character: trimmed.substring(12).trim()
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
      const result = parseNestedBlock(commands, i, 'conditional_end');
      block.children = result.children;
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

function parseNestedBlock(commands, startIndex, endType) {
  const children = [];
  let i = startIndex + 1; // Skip opening command
  let depth = 1;
  
  while (i < commands.length && depth > 0) {
    const command = commands[i];
    
    // Check for nested containers of same type
    if (isOpeningCommand(command.type, endType)) {
      depth++;
    } else if (command.type === endType) {
      depth--;
      if (depth === 0) break;
    }
    
    // Parse nested content
    if (depth === 1) {
      const nestedBlocks = parseScriptToBlocks([command]);
      children.push(...nestedBlocks);
    }
    
    i++;
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
  return {
    id: generateBlockId(),
    type: 'conditional',
    subtype: command.type, // if_start, unless_start, etc.
    parameters: command.parameters || {},
    children: [],
    position: { x: 0, y: index * 100 },
    metadata: {
      line: command.line,
      originalContent: command.content
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
  
  // Option line
  if (block.subtype === 'menu_option_conditional') {
    script += `${indent}OPT_IF ${block.parameters.condition || ''} "${block.parameters.text || ''}"\n`;
  } else {
    script += `${indent}OPT "${block.parameters.text || ''}"\n`;
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
      return `${indent}SAY "${block.parameters.text || ''}"\n`;
    case 'question':
      return `${indent}ASK "${block.parameters.text || ''}"\n`;
    case 'announce':
      return `${indent}ANNOUNCE "${block.parameters.text || ''}"\n`;
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
    
    // Se ancora non trovata, usa placeholder
    if (!await fs.pathExists(imagePath)) {
      const placeholderPath = path.join(imageDir, 'placeholder.png');
      if (await fs.pathExists(placeholderPath)) {
        imagePath = placeholderPath;
      } else {
        return res.status(404).json({ 
          error: 'Character image not found',
          character: characterName,
          variant: variant
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
          script.blocks = parseScriptToBlocks(script.commands);
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
app.post('/api/campaign/script/convert-to-blocks', async (req, res) => {
  try {
    const { scriptName, language = 'EN' } = req.body;
    
    if (!scriptName) {
      return res.status(400).json({ error: 'Script name is required' });
    }
    
    // Trova il file script
    const campaignDir = path.join(GAME_ROOT, `campaign/campaignScripts${language}`);
    const filePath = path.join(campaignDir, `${scriptName}.txt`);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: `Script not found: ${scriptName}` });
    }
    
    // Leggi e parsa il file
    const content = await fs.readFile(filePath, 'utf8');
    const scripts = parseGameScriptFile(content, `${scriptName}.txt`);
    
    if (scripts.length === 0) {
      return res.status(404).json({ error: `No scripts found in file: ${scriptName}` });
    }
    
    // Prendi il primo script (dovrebbe corrispondere al nome file)
    const script = scripts.find(s => s.name === scriptName) || scripts[0];
    
    // Converti in blocchi
    const blocks = parseScriptToBlocks(script.commands);
    
    res.json({
      scriptName: script.name,
      language,
      originalCommands: script.commands,
      blocks,
      metadata: {
        variables: script.variables,
        characters: script.characters,
        labels: script.labels,
        nodes: script.nodes,
        missions: script.missions
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

app.listen(PORT, () => {
  logger.info(`Galaxy Trucker Editor Server running on port ${PORT}`);
  logger.info(`Game root: ${GAME_ROOT}`);
  logger.info(`Backup directory: ${BACKUP_DIR}`);
});

module.exports = app;
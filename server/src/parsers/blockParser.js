// blockParser.js - Parser per conversione script-to-blocks e blocks-to-script
const { parseCommand } = require('./scriptParser');

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
    case 'flight_status_bar':
      const statusText = block.parameters.localizedText?.EN || block.parameters.text || '';
      return `${indent}SETFLIGHTSTATUSBAR "${statusText}"\n`;
    case 'semaforo_set':
      return `${indent}SET ${block.parameters.variable || ''}\n`;
    case 'semaforo_reset':
      return `${indent}RESET ${block.parameters.variable || ''}\n`;
    case 'variable_set':
      return `${indent}SET_TO ${block.parameters.variable || ''} ${block.parameters.value || ''}\n`;
    case 'variable_add':
      return `${indent}ADD ${block.parameters.variable || ''} ${block.parameters.value || ''}\n`;
    case 'show_character':
      return `${indent}SHOWCHAR ${block.parameters.character || ''} ${block.parameters.position || 'center'} ${block.parameters.image || 'default'}\n`;
    case 'hide_character':
      return `${indent}HIDECHAR ${block.parameters.character || ''}\n`;
    case 'change_character':
      return `${indent}CHANGECHAR ${block.parameters.character || ''} ${block.parameters.image || ''}\n`;
    case 'focus_character':
      return `${indent}FOCUSCHAR ${block.parameters.character || ''}\n`;
    case 'dialog_scene_open':
      return `${indent}SHOWDLGSCENE\n`;
    case 'dialog_scene_close':
      return `${indent}HIDEDLGSCENE\n`;
    case 'label':
      return `${indent}LABEL ${block.parameters.label || ''}\n`;
    case 'goto':
      return `${indent}GO ${block.parameters.label || ''}\n`;
    case 'script_call':
      return `${indent}SUB_SCRIPT ${block.parameters.script || ''}\n`;
    case 'return':
      return `${indent}RETURN\n`;
    case 'delay':
      return `${indent}DELAY ${block.parameters.milliseconds || ''}\n`;
    case 'show_path':
      return `${indent}SHOWPATH ${block.parameters.path || ''}\n`;
    case 'hide_path':
      return `${indent}HIDEPATH ${block.parameters.path || ''}\n`;
    case 'center_map_by_node':
      return `${indent}CENTERMAPBYNODE ${block.parameters.node || ''}\n`;
    case 'center_map_by_path':
      return `${indent}CENTERMAPBYPATH ${block.parameters.path || ''}\n`;
    case 'show_node':
      return `${indent}SHOWNODE ${block.parameters.node || ''}\n`;
    case 'hide_node':
      return `${indent}HIDENODE ${block.parameters.node || ''}\n`;
    case 'show_button':
      return `${indent}SHOWBUTTON ${block.parameters.button || ''}\n`;
    case 'hide_button':
      return `${indent}HIDEBUTTON ${block.parameters.button || ''}\n`;
    case 'move_player_to_node':
      return `${indent}MOVEPLAYERTONODE ${block.parameters.node || ''}\n`;
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

module.exports = {
  parseScriptToBlocks,
  convertBlocksToScript,
  parseConditionalWithElse,
  parseNestedBlock,
  parseOptionContent,
  createConditionalBlock,
  createMenuBlock,
  createSubscriptBlock,
  createLoopBlock,
  createParallelBlock,
  createOptionBlock,
  createAtomicBlock,
  generateBlockId
};
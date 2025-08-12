// Struttura JSON che rappresenta lo script per l'API di salvataggio
export interface ScriptJson {
  name: string;         // Nome identificativo dello script (es. "tutorialDlg", "newbieDlg")
  fileName: string;     // Nome del file che contiene lo script (es. "scripts1.txt")
  blocks: JsonBlock[];  // Array dei blocchi che compongono lo script
}

// Rappresentazione JSON di un blocco
export interface JsonBlock {
  type: string;
  parameters?: Record<string, any>;
  children?: JsonBlock[];
  // Proprietà specifiche per blocchi container
  thenBranch?: JsonBlock[];
  elseBranch?: JsonBlock[];
  condition?: string;
  // Proprietà specifiche per MENU/OPT
  options?: JsonBlock[];
  text?: Record<string, string>; // Multilingua
}

// Esempi di strutture JSON per diversi tipi di blocchi

// Blocco SCRIPT (root)
export interface ScriptJsonRoot extends ScriptJson {
  blocks: JsonBlock[]; // Children del blocco SCRIPT
}

// Blocco IF
export interface IfJsonBlock extends JsonBlock {
  type: 'IF';
  condition: string;
  ifType: 'IF_SEMAPHORE' | 'IF_VARIABLE' | 'IF_DEBUG';
  negated: boolean;
  thenBranch: JsonBlock[];
  elseBranch: JsonBlock[];
}

// Blocco MENU
export interface MenuJsonBlock extends JsonBlock {
  type: 'MENU';
  children: OptionJsonBlock[];
}

// Blocco OPT
export interface OptionJsonBlock extends JsonBlock {
  type: 'OPT';
  text: Record<string, string>;
  optType: 'OPT_SIMPLE' | 'OPT_IF';
  children: JsonBlock[];
}

// Blocco SAY
export interface SayJsonBlock extends JsonBlock {
  type: 'SAY';
  parameters: {
    text: Record<string, string>;
  };
}

// Blocco DELAY
export interface DelayJsonBlock extends JsonBlock {
  type: 'DELAY';
  parameters: {
    milliseconds: number;
  };
}

// Blocco GO
export interface GotoJsonBlock extends JsonBlock {
  type: 'GO';
  parameters: {
    label: string;
  };
}

// Blocco LABEL
export interface LabelJsonBlock extends JsonBlock {
  type: 'LABEL';
  parameters: {
    name: string;
  };
}

// Utility per creare JSON iniziale per nuovo script
export const createInitialScriptJson = (scriptName: string, fileName: string): ScriptJson => ({
  name: scriptName,  // Nome identificativo dello script
  fileName,          // Nome del file .txt che conterrà lo script
  blocks: []         // Inizialmente vuoto
});

// Utility per convertire Block dell'editor in JsonBlock
export const blockToJson = (block: any): JsonBlock => {
  // Gestione speciale per blocco IF
  if (block.type === 'IF') {
    const ifBlock: any = {
      type: 'IF',
      ifType: block.ifType || 'IF',
      thenBlocks: block.thenBlocks ? block.thenBlocks.map(blockToJson) : [],
      elseBlocks: block.elseBlocks ? block.elseBlocks.map(blockToJson) : [],
      numThen: block.numThen || 0,
      numElse: block.numElse || 0
    };
    
    // Aggiungi campi opzionali se presenti
    if (block.variabile) ifBlock.variabile = block.variabile;
    if (block.valore !== undefined && block.valore !== null) ifBlock.valore = block.valore;
    
    return ifBlock;
  }

  const jsonBlock: JsonBlock = {
    type: block.type
  };

  // Aggiungi parameters se è un blocco comando
  if (!block.isContainer && block.parameters) {
    jsonBlock.parameters = block.parameters;
  }

  // Aggiungi children se è un blocco container
  if (block.isContainer && block.children) {
    jsonBlock.children = block.children.map(blockToJson);
  }

  // Gestione speciale per altri blocchi specifici
  switch (block.type) {
    case 'MENU':
      if (block.options) jsonBlock.children = block.options.map(blockToJson);
      break;
    
    case 'OPT':
      if (block.text) jsonBlock.text = block.text;
      if (block.commands) jsonBlock.children = block.commands.map(blockToJson);
      break;
  }

  return jsonBlock;
};

// Utility per convertire JsonBlock in Block dell'editor
export const jsonToBlock = (jsonBlock: JsonBlock, position = { x: 0, y: 0 }): any => {
  const block: any = {
    id: `${jsonBlock.type.toLowerCase()}-${Date.now()}-${Math.random()}`,
    type: jsonBlock.type,
    position,
    isContainer: !!(jsonBlock.children || jsonBlock.thenBranch || jsonBlock.options)
  };

  // Aggiungi parameters se presente
  if (jsonBlock.parameters) {
    block.parameters = jsonBlock.parameters;
  }

  // Gestione container
  if (block.isContainer) {
    block.children = [];
    block.anchorPoints = [{
      id: `anchor-${Date.now()}`,
      position: { x: position.x + 20, y: position.y + 80 },
      allowedTypes: ['IF', 'MENU', 'SAY', 'DELAY', 'GO', 'LABEL'],
      flowState: 'middle'
    }];

    // Converti children se presenti
    if (jsonBlock.children) {
      block.children = jsonBlock.children.map((child, index) => 
        jsonToBlock(child, { x: position.x + 20, y: position.y + 100 + (index * 120) })
      );
    }
  }

  // Gestione speciale per tipi specifici
  switch (jsonBlock.type) {
    case 'IF':
      block.condition = jsonBlock.condition || '';
      block.thenBranch = jsonBlock.thenBranch ? jsonBlock.thenBranch.map((child, index) => 
        jsonToBlock(child, { x: position.x + 20, y: position.y + 100 + (index * 120) })
      ) : [];
      block.elseBranch = jsonBlock.elseBranch ? jsonBlock.elseBranch.map((child, index) => 
        jsonToBlock(child, { x: position.x + 200, y: position.y + 100 + (index * 120) })
      ) : [];
      break;
    
    case 'OPT':
      block.text = jsonBlock.text || { EN: '' };
      break;
  }

  return block;
};
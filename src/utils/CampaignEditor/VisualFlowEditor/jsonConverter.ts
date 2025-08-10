export const convertBlocksToJson = (blocks: any[]): any[] => {
  return blocks.map(block => {
    const jsonBlock: any = {
      type: block.type,
      id: block.id
    };
    
    if (block.type === 'IF') {
      jsonBlock.ifType = block.ifType || 'IF';
      // SEMPRE includi variabile e valore, anche se vuoti
      jsonBlock.variabile = block.variabile || '';
      jsonBlock.valore = block.valore !== undefined ? block.valore : '';
      jsonBlock.numThen = block.numThen || 0;
      jsonBlock.numElse = block.numElse || 0;
      if (block.thenBlocks) {
        jsonBlock.thenBlocks = convertBlocksToJson(block.thenBlocks);
      }
      if (block.elseBlocks) {
        jsonBlock.elseBlocks = convertBlocksToJson(block.elseBlocks);
      }
    } else if (block.type === 'OPT') {
      // Gestione specifica per blocchi OPT
      jsonBlock.optType = block.optType || 'OPT_SIMPLE';
      jsonBlock.condition = block.condition || null;
      jsonBlock.text = block.text || {
        EN: '',
        CS: null,
        DE: null,
        ES: null,
        FR: null,
        PL: null,
        RU: null
      };
      jsonBlock.children = convertBlocksToJson(block.children || []);
    } else if (block.type === 'SCRIPT' && block.children) {
      jsonBlock.scriptName = block.scriptName || '';
      jsonBlock.fileName = block.fileName || '';
      jsonBlock.children = convertBlocksToJson(block.children);
    } else if (block.isContainer && block.children) {
      jsonBlock.children = convertBlocksToJson(block.children);
    } else if (block.parameters) {
      jsonBlock.parameters = block.parameters;
    }
    
    return jsonBlock;
  });
};

export const generateScriptJson = (scriptBlocks: any[]) => {
  const scriptBlock = scriptBlocks.find(b => b.type === 'SCRIPT');
  if (!scriptBlock) return null;
  
  return {
    name: scriptBlock.scriptName,
    fileName: scriptBlock.fileName,
    blocks: convertBlocksToJson(scriptBlock.children || [])
  };
};
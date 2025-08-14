export const convertBlocksToJson = (blocks: any[]): any[] => {
  return blocks.map(block => {
    const jsonBlock: any = {
      type: block.type,
      id: block.id
    };
    
    if (block.type === 'MISSION') {
      jsonBlock.missionName = block.missionName || '';
      jsonBlock.fileName = block.fileName || '';
      jsonBlock.blocksMission = convertBlocksToJson(block.blocksMission || []);
      jsonBlock.blocksFinish = convertBlocksToJson(block.blocksFinish || []);
    } else if (block.type === 'IF') {
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
    } else if (block.type === 'BUILD') {
      // Gestione specifica per blocco BUILD - NON usa children
      jsonBlock.blockInit = convertBlocksToJson(block.blockInit || []);
      jsonBlock.blockStart = convertBlocksToJson(block.blockStart || []);
      jsonBlock.numBlockInit = block.numBlockInit || 0;
      jsonBlock.numBlockStart = block.numBlockStart || 0;
    } else if (block.type === 'FLIGHT') {
      // Gestione specifica per blocco FLIGHT - NON usa children
      jsonBlock.blockInit = convertBlocksToJson(block.blockInit || []);
      jsonBlock.blockStart = convertBlocksToJson(block.blockStart || []);
      jsonBlock.blockEvaluate = convertBlocksToJson(block.blockEvaluate || []);
      jsonBlock.numBlockInit = block.numBlockInit || 0;
      jsonBlock.numBlockStart = block.numBlockStart || 0;
      jsonBlock.numBlockEvaluate = block.numBlockEvaluate || 0;
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
    } else if (block.type === 'SUB_SCRIPT' && block.parameters) {
      // SUB_SCRIPT usa solo 'script' come parametro
      jsonBlock.parameters = {
        script: block.parameters.script || ''
      };
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

export const generateMissionJson = (missionBlocks: any[]) => {
  const missionBlock = missionBlocks.find(b => b.type === 'MISSION');
  if (!missionBlock) return null;
  
  return {
    name: missionBlock.missionName,
    fileName: missionBlock.fileName,
    blocksMission: convertBlocksToJson(missionBlock.blocksMission || []),
    blocksFinish: convertBlocksToJson(missionBlock.blocksFinish || [])
  };
};
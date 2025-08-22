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
      const ifType = block.ifType || 'IF';
      jsonBlock.ifType = ifType;
      // Gestione parametri in base al tipo di IF
      const valueTypes = new Set(['IF_HAS_CREDITS','IF_IS','IF_MAX','IF_MIN','IF_PROB','IFMISSIONRESULTIS','IFMISSIONRESULTMIN','IF_ORDER','IF_POSITION_ORDER']);
      const variableTypes = new Set(['IF','IFNOT','IF_IS','IF_MAX','IF_MIN','IFMISSIONRESULTIS','IFMISSIONRESULTMIN']);

      if (variableTypes.has(ifType) && block.variabile !== undefined && block.variabile !== '') {
        jsonBlock.variabile = block.variabile;
      }
      if (valueTypes.has(ifType) && block.valore !== undefined && block.valore !== '') {
        jsonBlock.valore = block.valore;
      }
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
    } else if (block.type === 'ADDSHIPPARTS' && block.parameters) {
      // ADDSHIPPARTS usa 'params' per il percorso del file YAML
      jsonBlock.parameters = {
        params: block.parameters.params || ''
      };
    } else if ((block.type === 'SETDECKPREPARATIONSCRIPT' || block.type === 'SETFLIGHTDECKPREPARATIONSCRIPT') && block.parameters) {
      // Entrambi usano un singolo parametro 'script' come SUB_SCRIPT
      jsonBlock.parameters = {
        script: block.parameters.script || ''
      };
    } else if ((block.type === 'SETADVPILE' || block.type === 'SETSECRETADVPILE') && block.parameters) {
      // Entrambi usano un singolo parametro 'params' (stringa con due interi), senza virgolette lato serialize
      jsonBlock.parameters = {
        params: block.parameters.params || ''
      };
      } else if (
        (
          block.type === 'DECKADDCARDTYPE' ||
          block.type === 'DECKREMOVECARDTYPE' ||
          block.type === 'DECKADDALLCARDS' ||
          block.type === 'DECKADDCARDROUND' ||
          block.type === 'DECKADDRULEPOSITION' ||
          block.type === 'DECKADDRULERANGE' ||
          block.type === 'DECKSHUFFLE' ||
          block.type === 'SETSUPERCARDSCNT'
        )
      ) {
        // Comandi Deck: parametro generico 'params' o nessuno
        if (block.parameters && typeof block.parameters.params === 'string') {
          jsonBlock.parameters = { params: block.parameters.params };
        }
    } else if (block.type === 'UNLOCKSHIPPLAN' && block.parameters) {
      // Usa chiave standard 'shipPlan' (compat con legacy 'plan')
      const value = block.parameters.shipPlan || block.parameters.plan || block.parameters.params || '';
      jsonBlock.parameters = {
        shipPlan: value
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
    name: missionBlock.name || missionBlock.missionName,
    fileName: missionBlock.fileName,
    blocksMission: convertBlocksToJson(missionBlock.blocksMission || []),
    blocksFinish: convertBlocksToJson(missionBlock.blocksFinish || [])
  };
};
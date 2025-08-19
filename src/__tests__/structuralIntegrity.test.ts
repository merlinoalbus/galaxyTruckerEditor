import { addUniqueIds, allBlocksHaveIds } from '@/utils/CampaignEditor/VisualFlowEditor/blockIdManager';
import { cleanupScriptBlocks, normalizeBlockStructure } from '@/utils/CampaignEditor/VisualFlowEditor/blockCleaner';
import { convertBlocksToJson } from '@/utils/CampaignEditor/VisualFlowEditor/jsonConverter';

describe('Structural integrity - common FE blocks', () => {
  test('all sample blocks get unique ids and container arrays are present', () => {
    const sample = [
      { type: 'SCRIPT', scriptName: 'Main', fileName: 'Main.txt', children: [
        { type: 'LABEL', parameters: { name: 'L1' } },
        { type: 'SAY', parameters: { text: { EN: 'Hello' } } },
        { type: 'IF', thenBlocks: [ { type: 'MENU', children: [ { type: 'OPT', text: { EN: 'Opt' }, children: [] } ] } ] },
        { type: 'BUILD', blockInit: [ { type: 'SETADVPILE', parameters: { params: '1 2' } } ], blockStart: [] },
        { type: 'FLIGHT', blockInit: [], blockStart: [], blockEvaluate: [ { type: 'SETSPECCONDITION', parameters: { condition: 'COND_A' } } ] },
        { type: 'MISSION', missionName: 'M1', fileName: 'M1.txt', blocksMission: [ { type: 'SETDECKPREPARATIONSCRIPT', parameters: { script: 'Prep' } } ], blocksFinish: [] }
      ]}
    ];

    const cleaned = cleanupScriptBlocks(sample);
    const normalized = normalizeBlockStructure(cleaned);
    const withIds = addUniqueIds(normalized);
    expect(allBlocksHaveIds(withIds)).toBe(true);

    // I container hanno i loro array coerenti
    const script = withIds[0] as any;
    expect(Array.isArray(script.children)).toBe(true);
    const ifBlock = script.children.find((b: any) => b.type === 'IF');
    expect(Array.isArray(ifBlock.thenBlocks)).toBe(true);
    // elseBlocks potrebbe essere undefined per preservare lo stato
  });

  test('jsonConverter non introduce campi ridondanti e preserva i param per comandi speciali', () => {
    const blocks = [
      { id: 'sc', type: 'SCRIPT', scriptName: 'Main', fileName: 'Main.txt', children: [
        { id: 'lb', type: 'LABEL', parameters: { name: 'L' } },
        { id: 'dp', type: 'SETDECKPREPARATIONSCRIPT', parameters: { script: 'Prep' } },
        { id: 'sp', type: 'SETADVPILE', parameters: { params: '2 3' } },
      ]}
    ];
    const json = convertBlocksToJson(blocks);
    const script = (json[0] as any);
    expect(script.children).toBeDefined();
    const dp = script.children.find((b: any) => b.id === 'dp');
    const sp = script.children.find((b: any) => b.id === 'sp');
    expect(dp.parameters.script).toBe('Prep');
    expect(sp.parameters.params).toBe('2 3');
    // Nessun campo spurio
    expect(dp.parameters.params).toBeUndefined();
    expect(sp.parameters.script).toBeUndefined();
  });
});

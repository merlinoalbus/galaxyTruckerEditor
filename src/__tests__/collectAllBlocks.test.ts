import { collectAllBlocks } from '@/utils/CampaignEditor/VisualFlowEditor/collectAllBlocks';
import type { IFlowBlock } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

describe('collectAllBlocks', () => {
  test('collects nested structures (MISSION/IF/BUILD/FLIGHT/children)', () => {
    const blocks: IFlowBlock[] = [
      { id: '1', type: 'MISSION', isContainer: true, blocksMission: [
        { id: '2', type: 'IF', condition: 'x', thenBlocks: [
          { id: '3', type: 'LABEL', parameters: { name: 'L1' } }
        ]}
      ], blocksFinish: [ { id: '4', type: 'LABEL', parameters: { name: 'END' } } ] }
    ] as any;
    const all = collectAllBlocks(blocks);
    const ids = all.map(b => b.id);
    expect(ids).toEqual(['1','2','3','4']);
  });
});

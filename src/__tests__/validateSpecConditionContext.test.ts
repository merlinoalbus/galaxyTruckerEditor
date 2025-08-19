import { validateAllBlocks } from '@/hooks/CampaignEditor/VisualFlowEditor/blockManipulation/validation/validateOperations';

describe('validateAllBlocks - SETSPECCONDITION contextual warning', () => {
  test('warns when SETSPECCONDITION is used outside MISSION/BUILD/FLIGHT', () => {
    const blocks = [
      { id: 's1', type: 'SCRIPT', children: [
        { id: 'sc1', type: 'SETSPECCONDITION', parameters: { condition: 'SOME_COND' } }
      ]}
    ];

    const res = validateAllBlocks(blocks);
    expect(res.warnings).toBeGreaterThan(0);
    const detail = res.details.find(d => d.blockId === 'sc1' && d.errorType === 'SETSPECCONDITION_OUTSIDE_CONTEXT');
    expect(detail).toBeTruthy();
    expect(detail?.type).toBe('warning');
  });

  test('no warning inside BUILD', () => {
    const blocks = [
      { id: 's1', type: 'SCRIPT', children: [
        { id: 'b1', type: 'BUILD', blockInit: [
          { id: 'sc2', type: 'SETSPECCONDITION', parameters: { condition: 'SOME_COND' } }
        ]}
      ]}
    ];

    const res = validateAllBlocks(blocks);
    const detail = res.details.find(d => d.blockId === 'sc2' && d.errorType === 'SETSPECCONDITION_OUTSIDE_CONTEXT');
    expect(detail).toBeFalsy();
  });
});

import { validateAllBlocks } from '@/hooks/CampaignEditor/VisualFlowEditor/blockManipulation/validation/validateOperations';

describe('validateAllBlocks - additional rules', () => {
  test('MENU without OPT is an error', () => {
    const blocks = [ { id: 's', type: 'SCRIPT', children: [ { id: 'm', type: 'MENU', children: [] } ] } ];
    const res = validateAllBlocks(blocks);
    expect(res.errors).toBeGreaterThan(0);
    expect(res.details.find(d => d.blockId === 'm' && d.errorType === 'MENU_WITHOUT_OPT')?.type).toBe('error');
  });

  test('OPT outside MENU is an error', () => {
    const blocks = [ { id: 's', type: 'SCRIPT', children: [ { id: 'o', type: 'OPT', children: [] } ] } ];
    const res = validateAllBlocks(blocks);
    expect(res.errors).toBeGreaterThan(0);
    expect(res.details.find(d => d.blockId === 'o' && d.errorType === 'OPT_OUTSIDE_MENU')?.type).toBe('error');
  });

  test('EXIT_MENU outside OPT is an error', () => {
    const blocks = [ { id: 's', type: 'SCRIPT', children: [ { id: 'e', type: 'EXIT_MENU' } ] } ];
    const res = validateAllBlocks(blocks);
    expect(res.errors).toBeGreaterThan(0);
    expect(res.details.find(d => d.blockId === 'e' && d.errorType === 'EXIT_MENU_OUTSIDE_OPT')?.type).toBe('error');
  });

  test('GO without any LABEL in script is an error', () => {
    const blocks = [ { id: 's', type: 'SCRIPT', children: [ { id: 'g', type: 'GO', parameters: { label: 'L1' } } ] } ];
    const res = validateAllBlocks(blocks);
    expect(res.errors).toBeGreaterThan(0);
    expect(res.details.find(d => d.blockId === 'g' && d.errorType === 'GO_WITHOUT_LABEL')?.type).toBe('error');
  });

  test('SAY outside dialog scene is a warning', () => {
    const blocks = [ { id: 's', type: 'SCRIPT', children: [ { id: 'say', type: 'SAY', parameters: { text: { EN: 'Hi' } } } ] } ];
    const res = validateAllBlocks(blocks);
    expect(res.warnings).toBeGreaterThan(0);
    expect(res.details.find(d => d.blockId === 'say' && d.errorType === 'DIALOG_OUTSIDE_SCENE')?.type).toBe('warning');
  });
});

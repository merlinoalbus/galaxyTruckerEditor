import { validateAllBlocks } from '@/hooks/CampaignEditor/VisualFlowEditor/blockManipulation/validation/validateOperations';

// Helper per costruire un wrapper SCRIPT con children
const scriptWrap = (children: any[]) => ({ id: 'script-1', type: 'SCRIPT', isContainer: true, children });

describe('validateAllBlocks - regole specifiche ADVPILE/SECRETADVPILE/SETSPECCONDITION', () => {
  test('SETADVPILE fuori da BUILD genera warning setAdvPileNotInBuild', () => {
    const blocks = [
      scriptWrap([
        { id: 'a1', type: 'SETADVPILE', parameters: { params: '1 2' } }
      ])
    ];

    const res = validateAllBlocks(blocks);
    expect(res.warnings).toBeGreaterThanOrEqual(1);
    const entry = res.details.find(d => d.blockId === 'a1' && d.errorType === 'setAdvPileNotInBuild');
    expect(entry).toBeTruthy();
    expect(entry.type).toBe('warning');
  });

  test('SETADVPILE senza params è errore (SETADVPILE_NO_PARAMS) e non aggiunge warning di contesto', () => {
    const blocks = [
      scriptWrap([
        { id: 'a2', type: 'SETADVPILE', parameters: { } }
      ])
    ];

    const res = validateAllBlocks(blocks);
    const err = res.details.find(d => d.blockId === 'a2' && d.errorType === 'SETADVPILE_NO_PARAMS');
    expect(err).toBeTruthy();
    expect(err.type).toBe('error');
    // Non deve comparire anche il warning di contesto
    expect(res.details.find(d => d.blockId === 'a2' && d.errorType === 'setAdvPileNotInBuild')).toBeFalsy();
  });

  test('SETSECRETADVPILE fuori da BUILD genera warning setSecretAdvPileNotInBuild', () => {
    const blocks = [
      scriptWrap([
        { id: 's1', type: 'SETSECRETADVPILE', parameters: { params: '2 1' } }
      ])
    ];

    const res = validateAllBlocks(blocks);
    const warn = res.details.find(d => d.blockId === 's1' && d.errorType === 'setSecretAdvPileNotInBuild');
    expect(warn).toBeTruthy();
    expect(warn.type).toBe('warning');
  });

  test('SETSECRETADVPILE senza params è errore (SETSECRETADVPILE_NO_PARAMS)', () => {
    const blocks = [
      scriptWrap([
        { id: 's2', type: 'SETSECRETADVPILE', parameters: { } }
      ])
    ];

    const res = validateAllBlocks(blocks);
    const err = res.details.find(d => d.blockId === 's2' && d.errorType === 'SETSECRETADVPILE_NO_PARAMS');
    expect(err).toBeTruthy();
    expect(err.type).toBe('error');
  });

  test('SETSPECCONDITION fuori da MISSION/BUILD/FLIGHT è warning, con condition valorizzata', () => {
    const blocks = [
      scriptWrap([
        { id: 'c1', type: 'SETSPECCONDITION', parameters: { condition: 'SomeEnum' } }
      ])
    ];

    const res = validateAllBlocks(blocks);
    const warn = res.details.find(d => d.blockId === 'c1' && d.errorType === 'SETSPECCONDITION_OUTSIDE_CONTEXT');
    expect(warn).toBeTruthy();
    expect(warn.type).toBe('warning');
  });

  test('SETSPECCONDITION senza condition è errore (SETSPECCONDITION_NO_CONDITION)', () => {
    const blocks = [
      scriptWrap([
        { id: 'c2', type: 'SETSPECCONDITION', parameters: { } }
      ])
    ];

    const res = validateAllBlocks(blocks);
    const err = res.details.find(d => d.blockId === 'c2' && d.errorType === 'SETSPECCONDITION_NO_CONDITION');
    expect(err).toBeTruthy();
    expect(err.type).toBe('error');
  });
});

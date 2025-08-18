const { convertBlocksToScript, serializeElement } = require('./blockParser');

describe('blockParser serializer quoting rules', () => {
  test('SetDeckPreparationScript quotes script param', () => {
    const cmd = { type: 'SETDECKPREPARATIONSCRIPT', parameters: { script: 'PrepScript' } };
    const out = serializeElement(cmd);
    expect(out).toBe('SetDeckPreparationScript "PrepScript"');
  });

  test('SetFlightDeckPreparationScript quotes script param', () => {
    const cmd = { type: 'SETFLIGHTDECKPREPARATIONSCRIPT', parameters: { script: 'FlightPrep' } };
    const out = serializeElement(cmd);
    expect(out).toBe('SetFlightDeckPreparationScript "FlightPrep"');
  });

  test('SetSpecCondition quotes condition', () => {
    const cmd = { type: 'SETSPECCONDITION', parameters: { condition: 'TEST_COND' } };
    const out = serializeElement(cmd);
    expect(out).toBe('SetSpecCondition "TEST_COND"');
  });

  test('SetAdvPile keeps params unquoted', () => {
    const cmd = { type: 'SETADVPILE', parameters: { params: '1 3' } };
    const out = serializeElement(cmd);
    expect(out).toBe('SetAdvPile 1 3');
  });

  test('convertBlocksToScript wraps without END_OF_SCRIPTS and keeps command lines', () => {
    const blocks = [ { type: 'SETDECKPREPARATIONSCRIPT', parameters: { script: 'Prep' } } ];
    const out = convertBlocksToScript(blocks);
    expect(out).toContain('SCRIPTS');
    expect(out).toContain('SetDeckPreparationScript "Prep"');
    expect(out).toContain('END_OF_SCRIPTS');
  });
});

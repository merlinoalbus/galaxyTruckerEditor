import { convertBlocksToJson } from '@/utils/CampaignEditor/VisualFlowEditor/jsonConverter';

describe('jsonConverter - deck scripts quoting semantics (FE side)', () => {
  test('SetDeckPreparationScript/SetFlightDeckPreparationScript serialize to parameters.script (string value)', () => {
    const blocks = [
      { id: 's', type: 'SCRIPT', children: [
        { id: 'd1', type: 'SETDECKPREPARATIONSCRIPT', parameters: { script: 'PrepScript' } },
        { id: 'f1', type: 'SETFLIGHTDECKPREPARATIONSCRIPT', parameters: { script: 'FlightScript' } },
      ]}
    ];

    const out = convertBlocksToJson(blocks);
    // children of SCRIPT converted
    const converted = out[0].children;
    expect(converted[0]).toEqual({ type: 'SETDECKPREPARATIONSCRIPT', id: 'd1', parameters: { script: 'PrepScript' } });
    expect(converted[1]).toEqual({ type: 'SETFLIGHTDECKPREPARATIONSCRIPT', id: 'f1', parameters: { script: 'FlightScript' } });
  });

  test('SetAdvPile/SetSecretAdvPile map to parameters.params (unquoted semantics preserved client-side)', () => {
    const blocks = [
      { id: 's', type: 'SCRIPT', children: [
        { id: 'a1', type: 'SETADVPILE', parameters: { params: '2 5' } },
        { id: 'a2', type: 'SETSECRETADVPILE', parameters: { params: '3 7' } },
      ]}
    ];

    const out = convertBlocksToJson(blocks);
    const converted = out[0].children;
    expect(converted[0]).toEqual({ type: 'SETADVPILE', id: 'a1', parameters: { params: '2 5' } });
    expect(converted[1]).toEqual({ type: 'SETSECRETADVPILE', id: 'a2', parameters: { params: '3 7' } });
  });
});

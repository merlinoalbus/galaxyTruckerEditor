import { FileParser } from '@/utils/FileParser';
import type { Mission, DeckScript } from '@/types/GameTypes';

describe('FileParser', () => {
  test('parseMissionYAML and serializeMissionYAML roundtrip basic fields', () => {
    const yaml = `name: "Test Mission"\nmissionID: 1\nfligthsAvailabelToChange: [STI, STII, STIII]\nflightsPicked: [STI]\nplayersCount: [2, 4]\nshipPlans: [I, II, III]`;
    const mission: Mission = FileParser.parseMissionYAML(yaml);
    expect(mission.name).toBe('Test Mission');
    expect(mission.missionID).toBe(1);
    expect(mission.playersCount).toEqual([2, 4]);
    const serialized = FileParser.serializeMissionYAML(mission);
    expect(serialized).toContain('name: "Test Mission"');
    expect(serialized).toContain('missionID: 1');
  });

  test('validateMission detects basic errors', () => {
    const mission: Mission = {
      name: '',
      missionID: 0,
      flightsAvailableToChange: ['STI', 'STII', 'STIII'],
      flightsPicked: [],
      playersCount: [1, 5],
      shipPlans: []
    };
    const errors = FileParser.validateMission(mission);
    const fields = errors.map(e => e.field);
    expect(fields).toContain('name');
    expect(fields).toContain('missionID');
    expect(fields).toContain('playersCount');
    expect(fields).toContain('flightsPicked');
  });

  test('parseDeckScript and serializeDeckScript', () => {
    const input = `SCRIPTS\n\n  SCRIPT MyScript\n    TmpDeckLoad "deck.yaml"\n\tDeckAddCardType 1 openspace 3\n`;
    const parsed: DeckScript = FileParser.parseDeckScript(input);
    expect(parsed.name).toBe('MyScript');
    expect(parsed.commands[0]).toEqual({ type: 'TmpDeckLoad', deckFile: 'deck.yaml' });
    const out = FileParser.serializeDeckScript(parsed);
    expect(out).toContain('TmpDeckLoad "deck.yaml"');
    expect(out).toContain('DeckAddCardType 1 openspace 3');
  });

  test('detectMetacodes finds unique codes', () => {
    const text = 'Hello [player], you have [credits] credits. [player]';
    const codes = FileParser.detectMetacodes(text);
    expect(codes).toEqual(['[player]', '[credits]']);
  });

  test('replaceMetacodes replaces values', () => {
    const text = 'Hi [player], day [day]';
    const out = FileParser.replaceMetacodes(text, { player: 'Alex', day: '3' });
    expect(out).toBe('Hi Alex, day 3');
  });
});

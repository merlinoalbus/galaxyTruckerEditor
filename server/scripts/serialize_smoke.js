// Smoke test della serializzazione dei comandi chiave
// Esegue convertBlocksToScript per controllare:
// - SetDeckPreparationScript e SetFlightDeckPreparationScript con script tra virgolette
// - SetAdvPile e SetSecretAdvPile con params non quotati

const { convertBlocksToScript } = require('../src/parsers/blockParser');

function run() {
  const blocks = [
    {
      type: 'MISSION',
      name: 'TestMission',
      children: [
        { type: 'SETDECKPREPARATIONSCRIPT', parameters: { script: 'Prep1' } },
        { type: 'SETFLIGHTDECKPREPARATIONSCRIPT', parameters: { script: 'FlightPrepA' } },
        {
          type: 'BUILD',
          blockInit: [
            { type: 'ADDPARTTOSHIP', parameters: { params: '1 7 alienEngine 3333 0' } },
            { type: 'SETADVPILE', parameters: { params: '1 3' } },
            { type: 'SETSECRETADVPILE', parameters: { params: '2 1' } },
          ],
          blockStart: []
        },
      ],
      finishSection: [
        { type: 'SAY', parameters: { text: { EN: 'Done' } } },
      ],
    },
  ];

  const out = convertBlocksToScript(blocks, 'EN');
  console.log('--- SERIALIZED SCRIPT START ---');
  console.log(out);
  console.log('--- SERIALIZED SCRIPT END ---');

  // Check basilari
  const hasQuotedDeck = /SetDeckPreparationScript\s+"Prep1"/.test(out);
  const hasQuotedFlightDeck = /SetFlightDeckPreparationScript\s+"FlightPrepA"/i.test(out);
  const hasAdvPile = /SetAdvPile\s+1\s+3/i.test(out);
  const hasSecretAdvPile = /SetSecretAdvPile\s+2\s+1/i.test(out);

  const summary = {
    quotedDeckPreparationScript: hasQuotedDeck,
    quotedFlightDeckPreparationScript: hasQuotedFlightDeck,
    setAdvPileParamsUnquoted: hasAdvPile,
    setSecretAdvPileParamsUnquoted: hasSecretAdvPile,
  };

  console.log('--- CHECKS ---');
  console.log(JSON.stringify(summary, null, 2));
}

run();

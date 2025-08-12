// Test per le nuove validazioni dei blocchi
// 1. Due ASK consecutivi non sono permessi
// 2. BUILD non può contenere BUILD o FLIGHT
// 3. FLIGHT non può contenere BUILD o FLIGHT

console.log("Test Validazioni Blocchi Visual Flow Editor");
console.log("============================================\n");

// Test 1: Due ASK consecutivi
console.log("Test 1: Due ASK consecutivi");
console.log("----------------------------");
const askTest = {
  blocks: [
    { type: "ASK", id: "ask1", parameters: { text: { EN: "Prima domanda?" } } },
    { type: "ASK", id: "ask2", parameters: { text: { EN: "Seconda domanda?" } } }
  ],
  expected: "ERRORE - Due ASK consecutivi non sono permessi"
};
console.log("Struttura:", JSON.stringify(askTest.blocks, null, 2));
console.log("Risultato atteso:", askTest.expected);
console.log();

// Test 2: BUILD contiene BUILD (non permesso)
console.log("Test 2: BUILD contiene BUILD");
console.log("-----------------------------");
const buildInBuildTest = {
  block: {
    type: "BUILD",
    id: "build1",
    blockInit: [
      { type: "BUILD", id: "build2", blockInit: [], blockStart: [] }
    ]
  },
  expected: "ERRORE - BUILD non può contenere un altro BUILD"
};
console.log("Struttura:", JSON.stringify(buildInBuildTest.block, null, 2));
console.log("Risultato atteso:", buildInBuildTest.expected);
console.log();

// Test 3: BUILD contiene FLIGHT (non permesso)
console.log("Test 3: BUILD contiene FLIGHT");
console.log("------------------------------");
const flightInBuildTest = {
  block: {
    type: "BUILD",
    id: "build1",
    blockStart: [
      { type: "FLIGHT", id: "flight1", blockInit: [], blockStart: [], blockEvaluate: [] }
    ]
  },
  expected: "ERRORE - BUILD non può contenere FLIGHT"
};
console.log("Struttura:", JSON.stringify(flightInBuildTest.block, null, 2));
console.log("Risultato atteso:", flightInBuildTest.expected);
console.log();

// Test 4: FLIGHT contiene BUILD (non permesso)
console.log("Test 4: FLIGHT contiene BUILD");
console.log("------------------------------");
const buildInFlightTest = {
  block: {
    type: "FLIGHT",
    id: "flight1",
    blockInit: [
      { type: "BUILD", id: "build1", blockInit: [], blockStart: [] }
    ]
  },
  expected: "ERRORE - FLIGHT non può contenere BUILD"
};
console.log("Struttura:", JSON.stringify(buildInFlightTest.block, null, 2));
console.log("Risultato atteso:", buildInFlightTest.expected);
console.log();

// Test 5: FLIGHT contiene FLIGHT (non permesso)
console.log("Test 5: FLIGHT contiene FLIGHT");
console.log("-------------------------------");
const flightInFlightTest = {
  block: {
    type: "FLIGHT",
    id: "flight1",
    blockEvaluate: [
      { type: "FLIGHT", id: "flight2", blockInit: [], blockStart: [], blockEvaluate: [] }
    ]
  },
  expected: "ERRORE - FLIGHT non può contenere un altro FLIGHT"
};
console.log("Struttura:", JSON.stringify(flightInFlightTest.block, null, 2));
console.log("Risultato atteso:", flightInFlightTest.expected);
console.log();

// Test 6: Struttura valida con ASK seguito da SAY
console.log("Test 6: ASK seguito da SAY (valido)");
console.log("------------------------------------");
const validAskSayTest = {
  blocks: [
    { type: "ASK", id: "ask1", parameters: { text: { EN: "Come ti chiami?" } } },
    { type: "SAY", id: "say1", parameters: { text: { EN: "Piacere di conoscerti!" } } }
  ],
  expected: "OK - ASK seguito da SAY è permesso"
};
console.log("Struttura:", JSON.stringify(validAskSayTest.blocks, null, 2));
console.log("Risultato atteso:", validAskSayTest.expected);
console.log();

console.log("\n============================================");
console.log("Le validazioni sono state implementate in:");
console.log("- src/hooks/CampaignEditor/VisualFlowEditor/useBlockManipulation.ts");
console.log("  - validateBlockInsertion(): previene l'inserimento di blocchi non validi");
console.log("  - validateAllBlocks(): identifica blocchi non validi esistenti");
console.log("\nQueste validazioni vengono applicate:");
console.log("1. Durante il drag & drop (preventivamente)");
console.log("2. Durante la validazione dell'intero script");
console.log("3. I blocchi non validi vengono evidenziati in rosso nell'editor");
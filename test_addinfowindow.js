const { parseScriptToBlocks, serializeBlock } = require('./server/src/parsers/blockParser');

// Test cases
const testCases = [
  {
    name: 'ADDINFOWINDOW con virgolette',
    input: 'AddInfoWindow "nonno"',
    language: 'EN'
  },
  {
    name: 'ADDINFOWINDOW senza virgolette',
    input: 'AddInfoWindow nonno',
    language: 'EN'
  }
];

console.log('Testing ADDINFOWINDOW parsing and serialization:\n');

testCases.forEach(test => {
  console.log(`Test: ${test.name}`);
  console.log(`Input: ${test.input}`);
  
  // Parse
  const result = parseScriptToBlocks([test.input], test.language);
  
  if (result.blocks && result.blocks.length > 0) {
    const block = result.blocks[0];
    console.log(`Parsed type: ${block.type}`);
    console.log(`Parsed parameters:`, JSON.stringify(block.parameters));
    
    // Serialize
    const serialized = serializeBlock(block, test.language);
    console.log(`Serialized: ${serialized}`);
    console.log(`Has quotes: ${serialized.includes('"')}`);
  } else {
    console.log('ERROR: Failed to parse');
  }
  
  console.log('---\n');
});
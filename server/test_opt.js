const fetch = require('node-fetch');

async function testOptTranslation() {
  try {
    // 1. Ottieni il JSON con testi multilingua dai file ORIGINALI (scripts2.txt)
    const readResponse = await fetch('http://localhost:3001/api/scripts/merchantDlg?multilingua=true&format=blocks&fileName=scripts2.txt');
    const readData = await readResponse.json();
    
    const scriptData = readData.data.blocks ? readData.data : readData.data[0];
    
    // DEBUG: Trova l'OPT problematico con merchAlienQuestion
    let optCount = 0;
    let optExamples = [];
    let problematicOpt = null;
    function countOpts(blocks) {
      for (const block of blocks) {
        if (block.type === 'OPT') {
          optCount++;
          if (optExamples.length < 3) {
            optExamples.push({
              text: block.text,
              textType: typeof block.text,
              hasES: block.text && typeof block.text === 'object' && block.text.ES
            });
          }
          // Trova l'OPT con SET merchAlienQuestion nei children
          if (block.children && block.children.some(child => 
            child.type === 'SET' && child.parameters && child.parameters.semaphore === 'merchAlienQuestion')) {
            problematicOpt = {
              optType: block.optType,
              condition: block.condition,
              text: block.text,
              textType: typeof block.text,
              hasCondition: !!block.condition
            };
          }
        }
        if (block.children) countOpts(block.children);
        if (block.thenBranch) countOpts(block.thenBranch);
        if (block.elseBranch) countOpts(block.elseBranch);
      }
    }
    countOpts(scriptData.blocks);
    console.log(`JSON contains ${optCount} OPT elements`);
    console.log('First 3 OPT text examples:', JSON.stringify(optExamples, null, 2));
    console.log('PROBLEMATIC OPT (merchAlienQuestion):', JSON.stringify(problematicOpt, null, 2));
    
    // 2. Invia il JSON per la scrittura (singolo script object, non array)
    const writeResponse = await fetch('http://localhost:3001/api/scripts/saveScript', {
      method: 'POST',  
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'merchantDlg',
        fileName: 'scripts2test.txt',
        blocks: scriptData.blocks,
        languages: ['ES']
      })
    });
    
    const writeResult = await writeResponse.json();
    
    console.log('Save result:', writeResult.success ? 'SUCCESS' : 'FAILED');
    if (!writeResult.success) {
      console.log('Error:', writeResult.error);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testOptTranslation();
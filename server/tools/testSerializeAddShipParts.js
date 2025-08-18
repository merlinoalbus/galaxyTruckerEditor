const path = require('path');
const { convertBlocksToScript } = require('../src/parsers/blockParser');

const sample = {
  name: 'aaa_pippo',
  fileName: 'prova01.txt',
  blocks: [
    { type: 'SHOWDLGSCENE', id: 's1', parameters: {} },
    { type: 'ADDOPPONENT', id: 's2', parameters: { character: 'brown' } },
    { type: 'ADDPARTTOSHIP', id: 's3', parameters: { params: '2 8 alienEngine 3333 0 1' } },
    { type: 'ADDPARTTOASIDESLOT', id: 's4', parameters: { params: 'alienGun 2 1 2 0 2' } },
    { type: 'ADDSHIPPARTS', id: 's5', parameters: { params: 'parts/basic_set.yaml' } },
    { type: 'ANNOUNCE', id: 's6', parameters: { text: { EN: 'prova' } } }
  ]
};

const out = convertBlocksToScript(sample.blocks, 'EN');
console.log('--- SERIALIZED OUTPUT ---\n');
console.log(out);
console.log('\n--- END ---');

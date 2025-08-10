import React, { useState } from 'react';
import { JsonView } from './JsonView';

/**
 * Componente di esempio che dimostra l'uso del JsonView estratto
 */
export const JsonViewExample: React.FC = () => {
  const [showJson, setShowJson] = useState(true);
  
  // Dati di esempio
  const exampleData = {
    scriptName: "ExampleScript",
    filePath: "example.txt",
    blocks: [
      {
        type: "IF",
        id: "if-1",
        ifType: "IF_PROB",
        variabile: "",
        valore: 50,
        numThen: 1,
        numElse: 0,
        thenBlocks: [
          {
            type: "SAY",
            id: "say-1",
            parameters: {
              text: {
                EN: "Hello World!",
                IT: "Ciao Mondo!"
              }
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <div className="flex-1 p-8">
        <h1 className="text-white text-2xl font-bold mb-4">
          Esempio JsonView Estratto
        </h1>
        
        <div className="bg-slate-800 p-4 rounded-lg mb-4">
          <h2 className="text-white text-lg font-medium mb-2">
            Controlli
          </h2>
          
          <button
            onClick={() => setShowJson(!showJson)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {showJson ? 'Nascondi JSON' : 'Mostra JSON'}
          </button>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg">
          <h2 className="text-white text-lg font-medium mb-2">
            Dati Script di Esempio
          </h2>
          <p className="text-gray-400 text-sm">
            Script con un blocco IF con probabilità 50% e un messaggio SAY annidato
          </p>
        </div>
      </div>
      
      {/* JsonView con tutte le nuove funzionalità */}
      <JsonView
        showJsonView={showJson}
        scriptJson={exampleData}
        title="Script JSON"
        width={450}
        showToggle={true}
        onToggleView={setShowJson}
        emptyPlaceholder="Nessun dato disponibile"
        allowFormatting={true}
        indentSize={2}
      />
    </div>
  );
};
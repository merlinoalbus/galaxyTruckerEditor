import React, { useState } from 'react';
import { Settings, X, Save, Plus, Trash2 } from 'lucide-react';

interface ConfigurationEditorProps {
  configType: 'SET' | 'IF' | 'VARIABLE';
  initialConfig: any;
  onSave: (config: any) => void;
  onClose: () => void;
}

interface GameVariable {
  name: string;
  type: 'boolean' | 'number' | 'string';
  value: any;
  description: string;
}

interface ConditionConfig {
  variable: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: any;
  description: string;
}

const COMMON_VARIABLES = [
  { name: 'credits', type: 'number', description: 'Player credits' },
  { name: 'reputation', type: 'number', description: 'Player reputation' },
  { name: 'license', type: 'string', description: 'Current license (STI, STII, STIII)' },
  { name: 'tutor_met', type: 'boolean', description: 'Has met the tutor' },
  { name: 'tutor_somemissions', type: 'boolean', description: 'Completed some missions' },
  { name: 'tutor_moremissions', type: 'boolean', description: 'Completed many missions' },
  { name: 'class3', type: 'boolean', description: 'Has class 3 license' },
  { name: 'current_node', type: 'string', description: 'Current location' },
  { name: 'mission_completed', type: 'boolean', description: 'Last mission completed' }
];

export function ConfigurationEditor({ configType, initialConfig, onSave, onClose }: ConfigurationEditorProps) {
  const [config, setConfig] = useState(initialConfig || {});
  
  const renderSetEditor = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white mb-4">Imposta Variabile</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Variabile</label>
          <select
            value={config.variable || ''}
            onChange={(e) => setConfig({...config, variable: e.target.value})}
            className="form-select bg-gt-secondary text-white border-slate-600"
          >
            <option value="">Seleziona variabile...</option>
            {COMMON_VARIABLES.map(v => (
              <option key={v.name} value={v.name}>{v.name} ({v.description})</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Valore</label>
          <input
            type="text"
            value={config.value || ''}
            onChange={(e) => setConfig({...config, value: e.target.value})}
            className="form-input bg-gt-secondary text-white border-slate-600"
            placeholder="Nuovo valore..."
          />
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label">Tipo Operazione</label>
        <select
          value={config.operation || 'set'}
          onChange={(e) => setConfig({...config, operation: e.target.value})}
          className="form-select bg-gt-secondary text-white border-slate-600"
        >
          <option value="set">Imposta (=)</option>
          <option value="add">Aggiungi (+)</option>
          <option value="subtract">Sottrai (-)</option>
          <option value="toggle">Inverti (boolean)</option>
        </select>
      </div>
      
      <div className="p-3 bg-blue-900/20 border border-blue-700 rounded">
        <h4 className="text-blue-200 font-medium mb-2">Anteprima Comando</h4>
        <code className="text-blue-300 text-sm">
          SET {config.variable || 'variable'} {config.operation === 'set' ? '=' : config.operation === 'add' ? '+=' : config.operation === 'subtract' ? '-=' : '!'} {config.value || 'value'}
        </code>
      </div>
    </div>
  );

  const renderIfEditor = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white mb-4">Condizione IF</h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="form-group">
          <label className="form-label">Variabile</label>
          <select
            value={config.variable || ''}
            onChange={(e) => setConfig({...config, variable: e.target.value})}
            className="form-select bg-gt-secondary text-white border-slate-600"
          >
            <option value="">Seleziona...</option>
            {COMMON_VARIABLES.map(v => (
              <option key={v.name} value={v.name}>{v.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Operatore</label>
          <select
            value={config.operator || '=='}
            onChange={(e) => setConfig({...config, operator: e.target.value})}
            className="form-select bg-gt-secondary text-white border-slate-600"
          >
            <option value="==">=== Uguale</option>
            <option value="!=">!= Diverso</option>
            <option value=">">&gt; Maggiore</option>
            <option value="<">&lt; Minore</option>
            <option value=">=">&gt;= Maggiore uguale</option>
            <option value="<=">&lt;= Minore uguale</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Valore</label>
          <input
            type="text"
            value={config.value || ''}
            onChange={(e) => setConfig({...config, value: e.target.value})}
            className="form-input bg-gt-secondary text-white border-slate-600"
            placeholder="Valore confronto"
          />
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label">Descrizione</label>
        <input
          type="text"
          value={config.description || ''}
          onChange={(e) => setConfig({...config, description: e.target.value})}
          className="form-input bg-gt-secondary text-white border-slate-600"
          placeholder="Descrizione leggibile della condizione..."
        />
      </div>
      
      <div className="p-3 bg-orange-900/20 border border-orange-700 rounded">
        <h4 className="text-orange-200 font-medium mb-2">Anteprima Condizione</h4>
        <code className="text-orange-300 text-sm">
          IF {config.variable || 'variable'} {config.operator || '=='} {config.value || 'value'}
        </code>
        <p className="text-orange-200 text-xs mt-1">
          {config.description || 'Nessuna descrizione'}
        </p>
      </div>
    </div>
  );

  const renderVariableEditor = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white mb-4">Gestione Variabili</h3>
      
      <div className="bg-yellow-900/20 border border-yellow-700 rounded p-4">
        <h4 className="text-yellow-200 font-medium mb-3">Variabili Disponibili</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COMMON_VARIABLES.map(variable => (
            <div key={variable.name} className="bg-gt-secondary/30 rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-white">{variable.name}</span>
                <span className="text-xs text-gray-400">{variable.type}</span>
              </div>
              <p className="text-sm text-gray-300">{variable.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-3 bg-green-900/20 border border-green-700 rounded">
        <h4 className="text-green-200 font-medium mb-2">Aggiungere Nuove Variabili</h4>
        <p className="text-green-300 text-sm">
          Le variabili personalizzate possono essere definite tramite comandi SET nel script.
          Utilizzare nomi descrittivi come "quest_completed" o "items_collected".
        </p>
      </div>
    </div>
  );

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gt-primary rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gt-secondary p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-gt-accent" />
            <div>
              <h2 className="text-xl font-bold text-white">
                Editor {configType}
              </h2>
              <p className="text-sm text-gray-300">
                Configurazione avanzata elementi script
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Salva</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gt-primary rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {configType === 'SET' && renderSetEditor()}
          {configType === 'IF' && renderIfEditor()}
          {configType === 'VARIABLE' && renderVariableEditor()}
        </div>
      </div>
    </div>
  );
}
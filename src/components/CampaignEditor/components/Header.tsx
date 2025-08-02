import React from 'react';
import { useRealGameData } from '../../../contexts/RealGameDataContext';
import { RefreshCw, Download, Upload } from 'lucide-react';

export function Header() {
  const { loading, error, refreshAll } = useRealGameData();

  return (
    <header className="bg-gt-primary border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold font-game text-gt-accent">
            Galaxy Trucker Editor
          </h1>
          <div className="flex items-center space-x-2">
            <div className={`status-dot ${error ? 'error' : loading ? 'warning' : 'success'}`}></div>
            <span className="text-sm text-gray-400">
              {error ? 'Errore' : loading ? 'Caricamento...' : 'Connesso'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshAll}
            disabled={loading}
            className="btn-secondary flex items-center space-x-2 tooltip"
            data-tooltip="Ricarica dati"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Aggiorna</span>
          </button>
          
          <button className="btn-secondary flex items-center space-x-2 tooltip" data-tooltip="Esporta tutto">
            <Download className="w-4 h-4" />
            <span>Esporta</span>
          </button>
          
          <button className="btn-secondary flex items-center space-x-2 tooltip" data-tooltip="Importa file">
            <Upload className="w-4 h-4" />
            <span>Importa</span>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-3 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          <strong>Errore:</strong> {error}
        </div>
      )}
    </header>
  );
}
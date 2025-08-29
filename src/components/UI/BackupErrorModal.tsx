import React from 'react';
import { AlertTriangle, FileX, RotateCcw, X } from 'lucide-react';

interface BackupErrorDetails {
  scriptName: string;
  filePath: string;
  backupFile: string | null;
  lastError: string;
  retriesAttempted: number;
}

interface BackupErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string;
  backupDetails?: BackupErrorDetails;
}

export const BackupErrorModal: React.FC<BackupErrorModalProps> = ({
  isOpen,
  onClose,
  errorMessage,
  backupDetails
}) => {
  if (!isOpen) return null;

  const hasBackupDetails = backupDetails && backupDetails.backupFile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-800 rounded-lg shadow-xl border border-slate-600 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Errore durante il salvataggio
              </h2>
              <p className="text-sm text-gray-400">
                Si è verificato un problema durante il salvataggio dello script
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-lg">
            <div className="flex items-start gap-3">
              <FileX className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-300 mb-1">
                  Messaggio di errore:
                </p>
                <p className="text-sm text-red-200">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>

          {/* Backup Details */}
          {hasBackupDetails && (
            <div className="p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg">
              <div className="flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-300">
                    Dettagli sistema di backup:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400">Script:</span>
                      <p className="text-white font-mono break-all">
                        {backupDetails.scriptName}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-gray-400">Tentativi falliti:</span>
                      <p className="text-white">
                        {backupDetails.retriesAttempted}/5
                      </p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <span className="text-gray-400">File di backup:</span>
                      <p className="text-blue-200 font-mono text-xs break-all">
                        {backupDetails.backupFile}
                      </p>
                    </div>
                    
                    {backupDetails.lastError && (
                      <div className="md:col-span-2">
                        <span className="text-gray-400">Ultimo errore:</span>
                        <p className="text-red-200 text-xs">
                          {backupDetails.lastError}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 p-3 bg-green-600/10 border border-green-600/20 rounded">
                    <p className="text-xs text-green-300">
                      ✓ Il file originale è stato ripristinato automaticamente dal backup.
                      I tuoi dati sono al sicuro.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-300 mb-2">
              Cosa fare ora:
            </h3>
            <ul className="text-xs text-yellow-200 space-y-1">
              <li>• Verifica che non ci siano problemi di connessione di rete</li>
              <li>• Controlla che il server sia accessibile</li>
              <li>• Prova a rieffettuare il salvataggio</li>
              {hasBackupDetails && (
                <li>• Se il problema persiste, contatta il supporto tecnico con il nome del file di backup</li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-500 transition-colors rounded-lg"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
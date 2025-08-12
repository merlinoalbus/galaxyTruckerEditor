import React from 'react';
import { X, AlertTriangle, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ValidationError {
  blockId: string;
  blockType: string;
  errorType: string;
  message: string;
  path?: string[]; // percorso nel tree dei blocchi
}

interface ValidationErrorsModalProps {
  errors: ValidationError[];
  onClose: () => void;
  onNavigateToBlock?: (blockId: string) => void;
}

export const ValidationErrorsModal: React.FC<ValidationErrorsModalProps> = ({ 
  errors, 
  onClose,
  onNavigateToBlock 
}) => {
  // Raggruppa errori per tipo
  const errorsByType = errors.reduce((acc, error) => {
    if (!acc[error.errorType]) {
      acc[error.errorType] = [];
    }
    acc[error.errorType].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);

  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case 'CONSECUTIVE_ASK':
        return '❓❓';
      case 'BUILD_CONTAINS_BUILD':
      case 'BUILD_CONTAINS_FLIGHT':
        return '🔨❌';
      case 'FLIGHT_CONTAINS_BUILD':
      case 'FLIGHT_CONTAINS_FLIGHT':
        return '✈️❌';
      case 'MENU_WITHOUT_ASK':
        return '📋❌';
      case 'OPT_OUTSIDE_MENU':
        return '⭕❌';
      default:
        return '⚠️';
    }
  };

  const getErrorDescription = (errorType: string) => {
    switch (errorType) {
      case 'CONSECUTIVE_ASK':
        return 'Due blocchi ASK consecutivi non sono permessi';
      case 'BUILD_CONTAINS_BUILD':
        return 'BUILD non può contenere un altro blocco BUILD';
      case 'BUILD_CONTAINS_FLIGHT':
        return 'BUILD non può contenere un blocco FLIGHT';
      case 'FLIGHT_CONTAINS_BUILD':
        return 'FLIGHT non può contenere un blocco BUILD';
      case 'FLIGHT_CONTAINS_FLIGHT':
        return 'FLIGHT non può contenere un altro blocco FLIGHT';
      case 'MENU_WITHOUT_ASK':
        return 'MENU deve essere preceduto da un blocco ASK';
      case 'OPT_OUTSIDE_MENU':
        return 'OPT può essere inserito solo dentro un blocco MENU';
      default:
        return 'Errore di validazione generico';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-red-600 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-white">
              Errori di Validazione ({errors.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded transition-colors"
            title="Chiudi"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(errorsByType).map(([errorType, typeErrors]) => (
            <div key={errorType} className="mb-6">
              {/* Error Type Header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{getErrorIcon(errorType)}</span>
                <div>
                  <h3 className="text-white font-semibold">
                    {getErrorDescription(errorType)}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {typeErrors.length} {typeErrors.length === 1 ? 'occorrenza' : 'occorrenze'}
                  </span>
                </div>
              </div>
              
              {/* Error Details */}
              <div className="space-y-2 ml-7">
                {typeErrors.map((error, index) => (
                  <div 
                    key={`${error.blockId}-${index}`}
                    className="bg-slate-800/50 border border-slate-700 rounded p-3 hover:border-red-600/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">Blocco:</span>
                          <span className="font-mono text-white">{error.blockType}</span>
                          <span className="text-gray-500 text-xs">#{error.blockId.slice(0, 8)}</span>
                        </div>
                        
                        {/* Path nel tree */}
                        {error.path && error.path.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <span>Percorso:</span>
                            {error.path.map((step, i) => (
                              <React.Fragment key={i}>
                                {i > 0 && <ChevronRight className="w-3 h-3" />}
                                <span className="text-gray-400">{step}</span>
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                        
                        {/* Messaggio specifico */}
                        {error.message && (
                          <div className="mt-2 text-sm text-yellow-400">
                            💡 {error.message}
                          </div>
                        )}
                      </div>
                      
                      {/* Navigate button */}
                      {onNavigateToBlock && (
                        <button
                          onClick={() => {
                            onNavigateToBlock(error.blockId);
                            onClose();
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                          title="Vai al blocco"
                        >
                          Vai →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="text-sm text-gray-400">
            <p>
              ℹ️ Correggi questi errori per garantire il corretto funzionamento dello script.
              I blocchi con errori sono evidenziati in <span className="text-red-400">rosso</span> nell'editor.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
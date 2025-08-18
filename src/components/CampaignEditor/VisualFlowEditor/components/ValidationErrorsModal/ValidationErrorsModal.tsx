import React from 'react';
import { X, AlertTriangle, ChevronRight, ShieldOff, Shield } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/locales';

interface ValidationError {
  blockId: string;
  blockType: string;
  errorType: string;
  message: string;
  path?: string[]; // percorso nel tree dei blocchi
  type?: 'error' | 'warning' | 'info';
}

interface ValidationErrorsModalProps {
  errors: ValidationError[];
  displayType?: 'errors' | 'warnings';
  onClose: () => void;
  onNavigateToBlock?: (blockId: string) => void;
  bypassedErrors?: Set<string>;
  onToggleBypass?: (blockId: string) => void;
}

export const ValidationErrorsModal: React.FC<ValidationErrorsModalProps> = ({ 
  errors, 
  displayType = 'errors',
  onClose,
  onNavigateToBlock,
  bypassedErrors = new Set(),
  onToggleBypass
}) => {
  const { t } = useTranslation();
  
  // Filtra in base al tipo da visualizzare
  const filteredErrors = displayType === 'warnings' 
    ? errors.filter(e => e.type === 'warning')
    : errors.filter(e => e.type === 'error' || !e.type);
  
  // Raggruppa per tipo
  const groupedByType = filteredErrors.reduce((acc, error) => {
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
        return t('visualFlowEditor.validation.consecutiveAsk');
      case 'BUILD_CONTAINS_BUILD':
        return t('visualFlowEditor.validation.buildContainsBuild');
      case 'BUILD_CONTAINS_FLIGHT':
        return t('visualFlowEditor.validation.buildContainsFlight');
      case 'FLIGHT_CONTAINS_BUILD':
        return t('visualFlowEditor.validation.flightContainsBuild');
      case 'FLIGHT_CONTAINS_FLIGHT':
        return t('visualFlowEditor.validation.flightContainsFlight');
      case 'MENU_WITHOUT_ASK':
        return t('visualFlowEditor.validation.menuWithoutAsk');
      case 'OPT_OUTSIDE_MENU':
        return t('visualFlowEditor.validation.optOutsideMenu');
      default:
        return t('visualFlowEditor.validation.genericError');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`bg-slate-900 border ${displayType === 'warnings' ? 'border-orange-600' : 'border-red-600'} rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-6 h-6 ${displayType === 'warnings' ? 'text-orange-500' : 'text-red-500'}`} />
            <h2 className="text-xl font-bold text-white">
              {displayType === 'warnings' ? 'Warning' : 'Errori'} ({filteredErrors.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded transition-colors"
            title={t('visualFlowEditor.validation.close')}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(groupedByType).map(([errorType, typeErrors]) => (
            <div key={errorType} className="mb-6">
              {/* Error Type Header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{getErrorIcon(errorType)}</span>
                <div>
                  <h3 className="text-white font-semibold">
                    {getErrorDescription(errorType)}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {typeErrors.length} {typeErrors.length === 1 ? t('visualFlowEditor.validation.occurrence') : t('visualFlowEditor.validation.occurrences')}
                  </span>
                </div>
              </div>
              
              {/* Error Details */}
              <div className="space-y-2 ml-7">
                {typeErrors.map((error, index) => (
                  <div 
                    key={`${error.blockId}-${index}`}
                    className={`bg-slate-800/50 border ${displayType === 'warnings' ? 'border-orange-700' : 'border-slate-700'} rounded p-3 ${displayType === 'warnings' ? 'hover:border-orange-500/50' : 'hover:border-red-600/50'} transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">{t('visualFlowEditor.validation.block')}:</span>
                          <span className="font-mono text-white">{error.blockType}</span>
                          <span className="text-gray-500 text-xs">#{error.blockId.slice(0, 8)}</span>
                        </div>
                        
                        {/* Path nel tree */}
                        {error.path && error.path.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <span>{t('visualFlowEditor.validation.path')}:</span>
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
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {/* Bypass button - solo per errori, non per warning */}
                        {displayType === 'errors' && onToggleBypass && (
                          <button
                            onClick={() => onToggleBypass(error.blockId)}
                            className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${
                              bypassedErrors.has(error.blockId)
                                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                            }`}
                            title={bypassedErrors.has(error.blockId) 
                              ? 'Rimuovi bypass per questo errore' 
                              : 'Bypass questo errore (salva comunque)'}
                          >
                            {bypassedErrors.has(error.blockId) ? (
                              <>
                                <ShieldOff className="w-3 h-3" />
                                <span>Bypassed</span>
                              </>
                            ) : (
                              <>
                                <Shield className="w-3 h-3" />
                                <span>Bypass</span>
                              </>
                            )}
                          </button>
                        )}
                        
                        {/* Navigate button */}
                        {onNavigateToBlock && (
                          <button
                            onClick={() => {
                              onNavigateToBlock(error.blockId);
                              onClose();
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                            title={t('visualFlowEditor.validation.goToBlockTitle')}
                          >
                            {t('visualFlowEditor.validation.goToBlock')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <p>
              ℹ️ {t('visualFlowEditor.validation.footer')}
            </p>
            {displayType === 'errors' && bypassedErrors.size > 0 && (
              <div className="flex items-center gap-2 text-orange-400">
                <ShieldOff className="w-4 h-4" />
                <span>{bypassedErrors.size} error{bypassedErrors.size > 1 ? 'i' : 'e'} bypassat{bypassedErrors.size > 1 ? 'i' : 'o'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
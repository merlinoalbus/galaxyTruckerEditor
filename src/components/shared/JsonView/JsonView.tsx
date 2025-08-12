import React, { useState, useCallback } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';

export interface JsonViewProps {
  /** Se true, il componente è visibile */
  showJsonView: boolean;
  /** L'oggetto JSON da visualizzare */
  scriptJson: any;
  /** Titolo personalizzabile del pannello */
  title?: string;
  /** Larghezza del pannello in pixel */
  width?: number;
  /** Se true, mostra il pulsante per nascondere la vista */
  showToggle?: boolean;
  /** Callback chiamato quando si toglie la vista */
  onToggleView?: (isVisible: boolean) => void;
  /** Placeholder da mostrare quando non c'è JSON */
  emptyPlaceholder?: string;
  /** Se true, permette la formattazione del JSON */
  allowFormatting?: boolean;
  /** Numero di spazi per l'indentazione (default: 2) */
  indentSize?: number;
}

export const JsonView: React.FC<JsonViewProps> = ({
  showJsonView,
  scriptJson,
  title = 'JSON Output',
  width = 384, // 96 * 4 = w-96 in pixels
  showToggle = false,
  onToggleView,
  emptyPlaceholder = 'Nessuno script caricato',
  allowFormatting = true,
  indentSize = 2
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isMinified, setIsMinified] = useState(false);

  const handleCopyJson = useCallback(async () => {
    if (!scriptJson) return;

    try {
      const jsonText = isMinified || !allowFormatting
        ? JSON.stringify(scriptJson)
        : JSON.stringify(scriptJson, null, indentSize);
      
      await navigator.clipboard.writeText(jsonText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Errore nella copia del JSON:', error);
    }
  }, [scriptJson, isMinified, allowFormatting, indentSize]);

  const handleToggleMinified = useCallback(() => {
    setIsMinified(prev => !prev);
  }, []);

  const handleToggleView = useCallback(() => {
    if (onToggleView) {
      onToggleView(!showJsonView);
    }
  }, [showJsonView, onToggleView]);

  const formatJson = useCallback((json: any) => {
    if (!json) return emptyPlaceholder;
    
    if (isMinified || !allowFormatting) {
      return JSON.stringify(json);
    }
    
    return JSON.stringify(json, null, indentSize);
  }, [isMinified, allowFormatting, indentSize, emptyPlaceholder]);

  if (!showJsonView) return null;

  const inlineStyles = {
    width: `${width}px`
  };

  return (
    <div 
      className="bg-slate-800 border-l border-slate-600 p-4 overflow-y-auto" 
      style={inlineStyles}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          {title}
          {showToggle && (
            <button
              onClick={handleToggleView}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
              title={showJsonView ? "Nascondi vista JSON" : "Mostra vista JSON"}
            >
              {showJsonView ? (
                <EyeOff className="w-4 h-4 text-gray-400" />
              ) : (
                <Eye className="w-4 h-4 text-gray-400" />
              )}
            </button>
          )}
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Toggle formato compatto/espanso */}
          {allowFormatting && scriptJson && (
            <button
              onClick={handleToggleMinified}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors"
              title={isMinified ? "Espandi JSON" : "Comprimi JSON"}
            >
              {isMinified ? "Espandi" : "Comprimi"}
            </button>
          )}
          
          {/* Pulsante copia */}
          <button
            onClick={handleCopyJson}
            disabled={!scriptJson}
            className={`px-2 py-1 text-white text-xs rounded transition-colors flex items-center gap-1 ${
              scriptJson
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-slate-600 cursor-not-allowed opacity-50'
            }`}
            title="Copia JSON negli appunti"
          >
            {isCopied ? (
              <>
                <Check className="w-3 h-3" />
                Copiato!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copia
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* JSON Content */}
      <div className="bg-slate-900 rounded border border-slate-700">
        <pre className="p-3 text-xs text-green-400 overflow-x-auto whitespace-pre-wrap break-words">
          {formatJson(scriptJson)}
        </pre>
      </div>
      
      {/* Footer info (opzionale) */}
      {scriptJson && (
        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span>
            {Object.keys(scriptJson).length} chiavi
          </span>
          <span>
            {JSON.stringify(scriptJson).length} caratteri
          </span>
        </div>
      )}
    </div>
  );
};
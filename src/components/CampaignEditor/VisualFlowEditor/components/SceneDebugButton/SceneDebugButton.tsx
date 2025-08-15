import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Eye, Copy, X } from 'lucide-react';
import { useScene } from '@/contexts/SceneContext';
import type { IFlowBlock } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

interface SceneDebugButtonProps {
  block: IFlowBlock;
  allBlocks: IFlowBlock[];
  characters?: any[]; // Riceve i characters come prop opzionale
}

export const SceneDebugButton: React.FC<SceneDebugButtonProps> = ({
  block,
  allBlocks,
  characters = []
}) => {
  const [showModal, setShowModal] = useState(false);
  const [sceneState, setSceneState] = useState<any>(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { state, getCurrentScene } = useScene();

  const showSceneState = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Usa la utility condivisa per simulare lo stato
    const { simulateSceneExecution } = require('@/utils/CampaignEditor/VisualFlowEditor/sceneSimulation');
    const simulatedSceneState = simulateSceneExecution(allBlocks, block.id, characters);
    
    const simulatedState = {
      blockInfo: {
        id: block.id,
        type: block.type
      },
      simulatedExecution: simulatedSceneState,
      realContextState: {
        sceneStack: state.sceneStack,
        isInDialogScene: state.isInDialogScene,
        lastModifiedCharacter: state.lastModifiedCharacter,
        currentScene: getCurrentScene()
      }
    };
    
    setSceneState(simulatedState);
    
    // Calcola la posizione della modale basata sul click
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setModalPosition({
        x: rect.right + 10,
        y: rect.top
      });
    }
    
    setShowModal(true);
  }, [block, allBlocks, state, getCurrentScene, characters]);
  
  // Funzione per copiare il JSON senza binary
  const copyToClipboard = useCallback(() => {
    if (!sceneState) return;
    
    // Crea una copia deep del sceneState
    const stateCopy = JSON.parse(JSON.stringify(sceneState));
    
    // Funzione ricorsiva per sostituire i binary
    const replaceBinary = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(replaceBinary);
      }
      
      if (typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
          if (key === 'binary') {
            newObj[key] = '[BINARY_DATA_REMOVED]';
          } else {
            newObj[key] = replaceBinary(obj[key]);
          }
        }
        return newObj;
      }
      
      return obj;
    };
    
    const cleanedState = replaceBinary(stateCopy);
    const jsonString = JSON.stringify(cleanedState, null, 2);
    
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [sceneState]);
  
  // Chiudi la modale se si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false);
      }
    };
    
    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModal]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={showSceneState}
        className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-center transition-colors opacity-50 hover:opacity-100"
        title="Debug Scene State"
      >
        <Eye className="w-3 h-3 text-gray-400" />
      </button>
      
      {showModal && ReactDOM.createPortal(
        <div 
          ref={modalRef}
          className="fixed z-[9999] bg-gray-900 rounded-lg shadow-2xl border border-gray-700"
          style={{
            left: `${Math.min(modalPosition.x, window.innerWidth - 520)}px`,
            top: `${Math.min(modalPosition.y, window.innerHeight - 400)}px`,
            width: '500px',
            maxHeight: '400px'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Scene State Debug</h3>
              <span className="text-xs text-gray-400">
                {block.type} ({block.id.slice(0, 8)})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={copyToClipboard}
                className="p-1.5 rounded hover:bg-gray-800 transition-colors group"
                title="Copy JSON (without images)"
              >
                <Copy className={`w-3.5 h-3.5 transition-colors ${
                  copied ? 'text-green-400' : 'text-gray-400 group-hover:text-white'
                }`} />
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded hover:bg-gray-800 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="overflow-auto p-3" style={{ maxHeight: '350px' }}>
            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
              {JSON.stringify(sceneState, null, 2)}
            </pre>
          </div>
          
          {copied && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-green-600 text-white text-xs rounded">
              Copied to clipboard!
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
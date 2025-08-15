import React, { useState, useCallback } from 'react';
import { Eye } from 'lucide-react';
import { SceneStateModal } from '../SceneStateModal';
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
  const { state, getCurrentScene } = useScene();

  const showSceneState = useCallback(() => {
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
    setShowModal(true);
  }, [block, allBlocks, state, getCurrentScene, characters]);

  return (
    <>
      <button
        onClick={showSceneState}
        className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-center transition-colors opacity-50 hover:opacity-100"
        title="Debug Scene State"
      >
        <Eye className="w-3 h-3 text-gray-400" />
      </button>
      
      <SceneStateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        sceneState={sceneState}
        blockId={block.id}
        blockType={block.type}
      />
    </>
  );
};
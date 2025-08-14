import React, { useState, useCallback } from 'react';
import { Eye } from 'lucide-react';
import { SceneStateModal } from '../SceneStateModal';
import type { IFlowBlock } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

interface SceneDebugButtonProps {
  block: IFlowBlock;
  allBlocks: IFlowBlock[];
}

export const SceneDebugButton: React.FC<SceneDebugButtonProps> = ({
  block,
  allBlocks
}) => {
  const [showModal, setShowModal] = useState(false);
  const [sceneState, setSceneState] = useState<any>(null);

  const calculateSceneState = useCallback(() => {
    // Calcola lo stato delle scene fino a questo blocco
    const scenes: any[] = [];
    let currentSceneIndex = -1;
    
    // Funzione per processare i blocchi fino al target
    const processBlocksUntilTarget = (blocks: IFlowBlock[], targetId: string): boolean => {
      for (const b of blocks) {
        // Se abbiamo raggiunto il target, fermati
        if (b.id === targetId) {
          return true;
        }
        
        // Processa il blocco corrente
        if (b.type === 'SHOWDLGSCENE') {
          currentSceneIndex++;
          scenes.push({
            index: currentSceneIndex,
            type: 'DIALOG_SCENE',
            openedAt: b.id,
            characters: [],
            dialogsCount: 0,
            internalScene: false
          });
        } else if (b.type === 'HIDEDLGSCENE') {
          if (scenes.length > 0 && currentSceneIndex >= 0) {
            scenes[currentSceneIndex].closedAt = b.id;
            currentSceneIndex--;
          }
        } else if ((b.type === 'SAY' || b.type === 'ASK') && currentSceneIndex >= 0) {
          // Incrementa il contatore dei dialoghi nella scena corrente
          if (scenes[currentSceneIndex]) {
            scenes[currentSceneIndex].dialogsCount++;
          }
        }
        
        // Ricorsione per blocchi annidati
        if (b.type === 'IF') {
          if (b.thenBlocks && processBlocksUntilTarget(b.thenBlocks, targetId)) return true;
          if (b.elseBlocks && processBlocksUntilTarget(b.elseBlocks, targetId)) return true;
        } else if (b.type === 'MENU' && b.children) {
          if (processBlocksUntilTarget(b.children, targetId)) return true;
        } else if (b.type === 'OPT' && b.children) {
          if (processBlocksUntilTarget(b.children, targetId)) return true;
        } else if (b.type === 'BUILD') {
          if (b.blockInit && processBlocksUntilTarget(b.blockInit, targetId)) return true;
          if (b.blockStart && processBlocksUntilTarget(b.blockStart, targetId)) return true;
        } else if (b.type === 'FLIGHT') {
          if (b.blockInit && processBlocksUntilTarget(b.blockInit, targetId)) return true;
          if (b.blockStart && processBlocksUntilTarget(b.blockStart, targetId)) return true;
          if (b.blockEvaluate && processBlocksUntilTarget(b.blockEvaluate, targetId)) return true;
        } else if (b.type === 'MISSION') {
          if (b.blocksMission && processBlocksUntilTarget(b.blocksMission, targetId)) return true;
          if (b.blocksFinish && processBlocksUntilTarget(b.blocksFinish, targetId)) return true;
        } else if (b.children) {
          if (processBlocksUntilTarget(b.children, targetId)) return true;
        }
      }
      return false;
    };
    
    // Processa i blocchi fino a questo punto
    processBlocksUntilTarget(allBlocks, block.id);
    
    // Crea lo stato finale
    const state = {
      targetBlock: {
        id: block.id,
        type: block.type
      },
      scenesHistory: scenes,
      currentState: {
        openScenes: scenes.filter(s => !s.closedAt).length,
        activeSceneIndex: currentSceneIndex,
        isInDialogScene: currentSceneIndex >= 0,
        totalScenesOpened: scenes.length
      },
      activeScenes: scenes.filter(s => !s.closedAt).map(s => ({
        ...s,
        status: 'ACTIVE'
      })),
      closedScenes: scenes.filter(s => s.closedAt).map(s => ({
        ...s,
        status: 'CLOSED'
      }))
    };
    
    setSceneState(state);
    setShowModal(true);
  }, [block, allBlocks]);

  return (
    <>
      <button
        onClick={calculateSceneState}
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
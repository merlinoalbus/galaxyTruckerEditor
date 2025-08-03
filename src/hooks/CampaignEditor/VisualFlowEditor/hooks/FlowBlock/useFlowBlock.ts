import { useState, useCallback } from 'react';
import { FlowBlock, FlowBlockType } from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';
import { CampaignScript } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';

export interface UseFlowBlockReturn {
  blocks: FlowBlock[];
  selectedBlockId: string | undefined;
  setSelectedBlockId: (id: string | undefined) => void;
  initializeFromScript: (script: CampaignScript) => void;
  addBlock: (type: FlowBlockType, targetBlockId?: string, position?: 'before' | 'after') => void;
  updateBlock: (blockId: string, updates: Partial<FlowBlock>) => void;
  removeBlock: (blockId: string) => void;
  moveBlock: (blockId: string, targetBlockId: string, position: 'before' | 'after') => void;
  duplicateBlock: (blockId: string) => void;
}

export const useFlowBlock = (): UseFlowBlockReturn => {
  const [blocks, setBlocks] = useState<FlowBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>();

  const initializeFromScript = useCallback((script: CampaignScript) => {
    const parsedBlocks: FlowBlock[] = [
      {
        id: 'block-1',
        type: 'say',
        position: { x: 100, y: 100 },
        data: { text: 'Hello World' }
      }
    ];
    setBlocks(parsedBlocks);
  }, []);

  const addBlock = useCallback((type: FlowBlockType, targetBlockId?: string, position?: 'before' | 'after') => {
    const newBlock: FlowBlock = {
      id: `block-${Date.now()}`,
      type,
      position: { x: 100, y: blocks.length * 100 + 100 },
      data: {}
    };
    
    if (targetBlockId && position) {
      const targetIndex = blocks.findIndex(b => b.id === targetBlockId);
      if (targetIndex !== -1) {
        const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
        const newBlocks = [...blocks];
        newBlocks.splice(insertIndex, 0, newBlock);
        setBlocks(newBlocks);
        return;
      }
    }
    
    setBlocks(prev => [...prev, newBlock]);
  }, [blocks]);

  const updateBlock = useCallback((blockId: string, updates: Partial<FlowBlock>) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
  }, []);

  const removeBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(undefined);
    }
  }, [selectedBlockId]);

  const moveBlock = useCallback((blockId: string, targetBlockId: string, position: 'before' | 'after') => {
    const sourceIndex = blocks.findIndex(b => b.id === blockId);
    const targetIndex = blocks.findIndex(b => b.id === targetBlockId);
    
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(sourceIndex, 1);
    
    const insertIndex = position === 'after' ? 
      (sourceIndex < targetIndex ? targetIndex : targetIndex + 1) :
      (sourceIndex < targetIndex ? targetIndex - 1 : targetIndex);
    
    newBlocks.splice(Math.max(0, insertIndex), 0, movedBlock);
    setBlocks(newBlocks);
  }, [blocks]);

  const duplicateBlock = useCallback((blockId: string) => {
    const blockToDuplicate = blocks.find(b => b.id === blockId);
    if (!blockToDuplicate) return;
    
    const duplicatedBlock: FlowBlock = {
      ...blockToDuplicate,
      id: `block-${Date.now()}`,
      position: {
        x: blockToDuplicate.position.x + 20,
        y: blockToDuplicate.position.y + 20
      }
    };
    
    setBlocks(prev => [...prev, duplicatedBlock]);
  }, [blocks]);

  return {
    blocks,
    selectedBlockId,
    setSelectedBlockId,
    initializeFromScript,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    duplicateBlock
  };
};
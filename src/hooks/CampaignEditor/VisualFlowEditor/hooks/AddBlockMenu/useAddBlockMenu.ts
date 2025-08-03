import { useState, useCallback } from 'react';
import { 
  AddBlockMenuState,
  AvailableBlockType,
  Position
} from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';

export interface UseAddBlockMenuReturn {
  addBlockMenuState: AddBlockMenuState;
  openAddBlockMenu: (position: Position, availableTypes: AvailableBlockType[]) => void;
  closeAddBlockMenu: () => void;
}

export const useAddBlockMenu = (): UseAddBlockMenuReturn => {
  const [addBlockMenuState, setAddBlockMenuState] = useState<AddBlockMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    availableBlockTypes: []
  });

  const openAddBlockMenu = useCallback((position: Position, availableTypes: AvailableBlockType[]) => {
    setAddBlockMenuState({
      isOpen: true,
      position,
      availableBlockTypes: availableTypes
    });
  }, []);

  const closeAddBlockMenu = useCallback(() => {
    setAddBlockMenuState({
      isOpen: false,
      position: { x: 0, y: 0 },
      availableBlockTypes: []
    });
  }, []);

  return {
    addBlockMenuState,
    openAddBlockMenu,
    closeAddBlockMenu
  };
};
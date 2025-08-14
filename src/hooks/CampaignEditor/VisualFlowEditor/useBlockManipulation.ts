import { validateAllBlocks as validateAllBlocksBase } from './blockManipulation/validation/validateOperations';
import { getDropErrorMessage as getDropErrorMessageBase } from './blockManipulation/validation/validationMessages';
import { canDropBlock } from './blockManipulation/validation/dropValidation';
import { updateBlockRecursive } from './blockManipulation/operations/updateOperations';
import { removeBlockRecursive } from './blockManipulation/operations/removeOperations';
import { addBlockAtIndex, addBlockToContainer } from './blockManipulation/operations/insertOperations';
import { useTranslation } from '@/locales';
import { useCallback } from 'react';

export const useBlockManipulation = () => {
  const { t } = useTranslation();
  
  // Wrapper per getDropErrorMessage che passa t automaticamente
  const getDropErrorMessage = useCallback((
    blockType: string,
    containerId: string,
    containerType: string,
    blocks: any[],
    index?: number
  ) => {
    return getDropErrorMessageBase(blockType, containerId, containerType, blocks, index, t);
  }, [t]);
  
  // Wrapper per validateAllBlocks - memoizzato con useCallback
  // La funzione usa il t corrente al momento della chiamata
  const validateAllBlocks = useCallback((blocks: any[]) => {
    return validateAllBlocksBase(blocks, t);
  }, [t]);

  return {
    updateBlockRecursive,
    removeBlockRecursive,
    addBlockAtIndex,
    addBlockToContainer,
    canDropBlock,
    validateAllBlocks,
    getDropErrorMessage
  };
};
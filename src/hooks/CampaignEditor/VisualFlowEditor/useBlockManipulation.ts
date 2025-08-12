import { validateAllBlocks as validateAllBlocksBase } from './blockManipulation/validation/validateOperations';
import { getDropErrorMessage as getDropErrorMessageBase } from './blockManipulation/validation/validationMessages';
import { canDropBlock } from './blockManipulation/validation/dropValidation';
import { updateBlockRecursive } from './blockManipulation/operations/updateOperations';
import { removeBlockRecursive } from './blockManipulation/operations/removeOperations';
import { addBlockAtIndex, addBlockToContainer } from './blockManipulation/operations/insertOperations';
import { useTranslation } from '@/locales';

export const useBlockManipulation = () => {
  const { t } = useTranslation();
  
  // Wrapper per getDropErrorMessage che passa t automaticamente
  const getDropErrorMessage = (
    blockType: string,
    containerId: string,
    containerType: string,
    blocks: any[],
    index?: number
  ) => {
    return getDropErrorMessageBase(blockType, containerId, containerType, blocks, index, t);
  };
  
  // Wrapper per validateAllBlocks che passa t automaticamente
  const validateAllBlocks = (blocks: any[]) => {
    return validateAllBlocksBase(blocks, t);
  };

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
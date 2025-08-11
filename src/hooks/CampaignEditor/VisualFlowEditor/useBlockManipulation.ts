import { validateAllBlocks } from './blockManipulation/validation/validateOperations';
import { getDropErrorMessage } from './blockManipulation/validation/validationMessages';
import { canDropBlock } from './blockManipulation/validation/dropValidation';
import { updateBlockRecursive } from './blockManipulation/operations/updateOperations';
import { removeBlockRecursive } from './blockManipulation/operations/removeOperations';
import { addBlockAtIndex, addBlockToContainer } from './blockManipulation/operations/insertOperations';

export const useBlockManipulation = () => {
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
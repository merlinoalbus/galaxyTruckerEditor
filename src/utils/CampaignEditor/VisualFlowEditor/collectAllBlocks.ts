import { IFlowBlock } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

/**
 * Raccoglie tutti i blocchi da una struttura gerarchica, includendo mission blocks
 */
export function collectAllBlocks(blocks: IFlowBlock[]): IFlowBlock[] {
  const result: IFlowBlock[] = [];
  
  const collectFromBlock = (block: IFlowBlock) => {
    result.push(block);
    
    // Per blocchi MISSION, raccoglie sia blocksMission che blocksFinish
    if (block.type === 'MISSION') {
      if (block.blocksMission) {
        block.blocksMission.forEach(collectFromBlock);
      }
      if (block.blocksFinish) {
        block.blocksFinish.forEach(collectFromBlock);
      }
    }
    
    // Per blocchi IF, raccoglie thenBlocks e elseBlocks
    if (block.type === 'IF') {
      if (block.thenBlocks) {
        block.thenBlocks.forEach(collectFromBlock);
      }
      if (block.elseBlocks) {
        block.elseBlocks.forEach(collectFromBlock);
      }
    }
    
    // Per blocchi BUILD, raccoglie blockInit e blockStart
    if (block.type === 'BUILD') {
      if (block.blockInit) {
        block.blockInit.forEach(collectFromBlock);
      }
      if (block.blockStart) {
        block.blockStart.forEach(collectFromBlock);
      }
    }
    
    // Per blocchi FLIGHT, raccoglie blockInit, blockStart e blockEvaluate
    if (block.type === 'FLIGHT') {
      if (block.blockInit) {
        block.blockInit.forEach(collectFromBlock);
      }
      if (block.blockStart) {
        block.blockStart.forEach(collectFromBlock);
      }
      if (block.blockEvaluate) {
        block.blockEvaluate.forEach(collectFromBlock);
      }
    }
    
    // Per tutti gli altri blocchi con children
    if (block.children) {
      block.children.forEach(collectFromBlock);
    }
  };
  
  blocks.forEach(collectFromBlock);
  return result;
}
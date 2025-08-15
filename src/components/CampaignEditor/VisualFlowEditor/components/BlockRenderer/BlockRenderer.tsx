import React, { useCallback } from 'react';
import { ScriptBlock } from '../blocks/ScriptBlock/ScriptBlock';
import { IfBlock } from '../blocks/IfBlock/IfBlock';
import { CommandBlock } from '../blocks/CommandBlock/CommandBlock';
import { MenuBlock } from '../blocks/MenuBlock/MenuBlock';
import { OptBlock } from '../blocks/OptBlock/OptBlock';
import { MissionBlock } from '../blocks/MissionBlock/MissionBlock';
import { BuildBlock } from '../blocks/BuildBlock/BuildBlock';
import { FlightBlock } from '../blocks/FlightBlock/FlightBlock';
import { ChangeCharBlock } from '../blocks/ChangeCharBlock/ChangeCharBlock';
import { SayCharBlock } from '../blocks/SayCharBlock/SayCharBlock';
import { AnnounceBlock } from '../blocks/AnnounceBlock/AnnounceBlock';
import { ReturnBlock } from '../blocks/ReturnBlock/ReturnBlock';
import { SetBlock } from '../blocks/SetBlock/SetBlock';
import { ResetBlock } from '../blocks/ResetBlock/ResetBlock';
import type { IFlowBlock, BlockUpdate } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';

interface BlockRendererProps {
  block: IFlowBlock;
  depth?: number;
  onUpdateBlock: (blockId: string, updates: BlockUpdate) => void;
  onRemoveBlock: (blockId: string) => void;
  onDragStart: (e: React.DragEvent, block: IFlowBlock) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, containerId: string, containerType: string) => void;
  onDropAtIndex: (e: React.DragEvent, containerId: string, containerType: string, index: number) => void;
  isDragActive: boolean;
  onZoomIn?: (blockId: string) => void;
  onZoomOut?: () => void;
  isZoomed?: boolean;
  currentFocusedBlockId?: string | null;
  sessionData?: any;
  createDropValidator?: (containerId: string, containerType: string, index?: number) => (e: React.DragEvent) => boolean;
  invalidBlocks?: string[];
  blockValidationTypes?: Map<string, 'error' | 'warning'>;
  allBlocks?: IFlowBlock[];
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  depth = 0,
  onUpdateBlock,
  onRemoveBlock,
  onDragStart,
  onDragOver,
  onDrop,
  onDropAtIndex,
  isDragActive,
  onZoomIn,
  onZoomOut,
  isZoomed = false,
  currentFocusedBlockId,
  sessionData,
  createDropValidator,
  invalidBlocks = [],
  blockValidationTypes,
  allBlocks = []
}) => {
  const updateBlock = useCallback((updates: BlockUpdate) => {
    onUpdateBlock(block.id, updates);
  }, [block.id, onUpdateBlock]);

  const removeBlock = useCallback(() => {
    onRemoveBlock(block.id);
  }, [block.id, onRemoveBlock]);

  // Determina se questo blocco ha validazione e il tipo
  const validationType = blockValidationTypes?.get(block.id);
  const isInvalid = !!validationType; // Il blocco è invalido se ha un tipo di validazione
  
  // Determina se questo blocco è il root in zoom (non può essere eliminato)
  const isRootInZoom = isZoomed && depth === 0;

  const renderChildren = useCallback((blocks: IFlowBlock[]) => {
    return blocks.map((child: IFlowBlock) => (
      <BlockRenderer
        key={child.id}
        block={child}
        depth={depth + 1}
        onUpdateBlock={onUpdateBlock}
        onRemoveBlock={onRemoveBlock}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDropAtIndex={onDropAtIndex}
        isDragActive={isDragActive}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        isZoomed={isZoomed}
        currentFocusedBlockId={currentFocusedBlockId}
        sessionData={sessionData}
        createDropValidator={createDropValidator}
        invalidBlocks={invalidBlocks}
        blockValidationTypes={blockValidationTypes}
        allBlocks={allBlocks}
      />
    ));
  }, [depth, onUpdateBlock, onRemoveBlock, onDragStart, onDragOver, onDrop, onDropAtIndex, isDragActive, onZoomIn, onZoomOut, isZoomed, currentFocusedBlockId, sessionData, createDropValidator, invalidBlocks, blockValidationTypes, allBlocks]);

  // Render SCRIPT block
  if (block.type === 'SCRIPT') {
    return (
      <div data-block-id={block.id}>
        <ScriptBlock
          block={block}
          onUpdateName={(name) => updateBlock({ scriptName: name })}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, block.id, 'children')}
          onDropAtIndex={(e, index) => onDropAtIndex(e, block.id, 'children', index)}
          isDragActive={isDragActive}
          onZoomIn={onZoomIn ? (() => onZoomIn(block.id)) : undefined}
          onZoomOut={currentFocusedBlockId === block.id ? onZoomOut : undefined}
        >
          {renderChildren(block.children || [])}
        </ScriptBlock>
      </div>
    );
  }

  // Render IF block
  if (block.type === 'IF') {
    return (
      <div data-block-id={block.id}>
        <IfBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          onDragOver={onDragOver}
          onDropThen={(e) => onDrop(e, block.id, 'thenBlocks')}
          onDropElse={(e) => onDrop(e, block.id, 'elseBlocks')}
          onDropThenAtIndex={(e, index) => onDropAtIndex(e, block.id, 'thenBlocks', index)}
          onDropElseAtIndex={(e, index) => onDropAtIndex(e, block.id, 'elseBlocks', index)}
          renderChildren={renderChildren}
          isDragActive={isDragActive}
          onZoomIn={onZoomIn ? (() => onZoomIn(block.id)) : undefined}
          onZoomOut={currentFocusedBlockId === block.id ? onZoomOut : undefined}
          isZoomed={isZoomed}
          sessionData={sessionData}
          isInvalid={isInvalid}
          validationType={validationType}
        />
      </div>
    );
  }

  // Render OPT block
  if (block.type === 'OPT') {
    return (
      <div data-block-id={block.id}>
        <OptBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, block.id, 'children')}
          onDropAtIndex={(e, index) => onDropAtIndex(e, block.id, 'children', index)}
          renderChildren={renderChildren}
          isDragActive={isDragActive}
          onZoomIn={onZoomIn ? (() => onZoomIn(block.id)) : undefined}
          onZoomOut={currentFocusedBlockId === block.id ? onZoomOut : undefined}
          isZoomed={isZoomed}
          sessionData={sessionData}
          isInvalid={isInvalid}
          validationType={validationType}
        />
      </div>
    );
  }

  // Render MISSION block
  if (block.type === 'MISSION') {
    return (
      <div data-block-id={block.id}>
        <MissionBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, block.id, 'blocksMission')}
          onDropAtIndexMission={(e, index) => onDropAtIndex(e, block.id, 'blocksMission', index)}
          onDropAtIndexFinish={(e, index) => onDropAtIndex(e, block.id, 'blocksFinish', index)}
          renderChildren={renderChildren}
          isDragActive={isDragActive}
          onZoomIn={onZoomIn ? (() => onZoomIn(block.id)) : undefined}
          onZoomOut={currentFocusedBlockId === block.id ? onZoomOut : undefined}
          isZoomed={isZoomed}
          isInvalid={isInvalid}
          validationType={validationType}
        />
      </div>
    );
  }

  // Render BUILD block
  if (block.type === 'BUILD') {
    return (
      <div data-block-id={block.id}>
        <BuildBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          onDragOver={onDragOver}
          onDropInit={(e) => onDrop(e, block.id, 'blockInit')}
          onDropStart={(e) => onDrop(e, block.id, 'blockStart')}
          onDropInitAtIndex={(e, index) => onDropAtIndex(e, block.id, 'blockInit', index)}
          onDropStartAtIndex={(e, index) => onDropAtIndex(e, block.id, 'blockStart', index)}
          renderChildren={renderChildren}
          isDragActive={isDragActive}
          onZoomIn={onZoomIn ? (() => onZoomIn(block.id)) : undefined}
          onZoomOut={currentFocusedBlockId === block.id ? onZoomOut : undefined}
          isZoomed={isZoomed}
          isInvalid={isInvalid}
          validationType={validationType}
        />
      </div>
    );
  }

  // Render FLIGHT block
  if (block.type === 'FLIGHT') {
    return (
      <div data-block-id={block.id}>
        <FlightBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          onDragOver={onDragOver}
          onDropInit={(e) => onDrop(e, block.id, 'blockInit')}
          onDropStart={(e) => onDrop(e, block.id, 'blockStart')}
          onDropEvaluate={(e) => onDrop(e, block.id, 'blockEvaluate')}
          onDropInitAtIndex={(e, index) => onDropAtIndex(e, block.id, 'blockInit', index)}
          onDropStartAtIndex={(e, index) => onDropAtIndex(e, block.id, 'blockStart', index)}
          onDropEvaluateAtIndex={(e, index) => onDropAtIndex(e, block.id, 'blockEvaluate', index)}
          renderChildren={renderChildren}
          isDragActive={isDragActive}
          onZoomIn={onZoomIn ? (() => onZoomIn(block.id)) : undefined}
          onZoomOut={currentFocusedBlockId === block.id ? onZoomOut : undefined}
          isZoomed={isZoomed}
          isInvalid={isInvalid}
          validationType={validationType}
        />
      </div>
    );
  }

  // Render MENU blocks
  if (block.type === 'MENU') {
    return (
      <div data-block-id={block.id}>
        <MenuBlock
          block={block}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, block.id, 'children')}
          onDropAtIndex={(e, index) => onDropAtIndex(e, block.id, 'children', index)}
          renderChildren={renderChildren}
          isDragActive={isDragActive}
          onZoomIn={onZoomIn ? (() => onZoomIn(block.id)) : undefined}
          onZoomOut={currentFocusedBlockId === block.id ? onZoomOut : undefined}
          isZoomed={isZoomed}
          isInvalid={isInvalid}
          validationType={validationType}
        />
      </div>
    );
  }

  // Render CHANGECHAR block
  if (block.type === 'CHANGECHAR') {
    return (
      <div data-block-id={block.id}>
        <ChangeCharBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          sessionData={sessionData}
          isInvalid={isInvalid}
          validationType={validationType}
          allBlocks={allBlocks}
        />
      </div>
    );
  }

  // Render SAYCHAR block
  if (block.type === 'SAYCHAR') {
    return (
      <div data-block-id={block.id}>
        <SayCharBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          sessionData={sessionData}
          isInvalid={isInvalid}
          validationType={validationType}
          allBlocks={allBlocks}
        />
      </div>
    );
  }

  // Render ANNOUNCE block
  if (block.type === 'ANNOUNCE') {
    return (
      <div data-block-id={block.id}>
        <AnnounceBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          isInvalid={isInvalid}
          validationType={validationType}
        />
      </div>
    );
  }

  // Render RETURN block
  if (block.type === 'RETURN') {
    return (
      <div data-block-id={block.id}>
        <ReturnBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          isInvalid={isInvalid}
          validationType={validationType}
          navigationPath={sessionData?.navigationPath}
          onNavigateBack={sessionData?.onNavigateBack}
        />
      </div>
    );
  }

  // Render SET block
  if (block.type === 'SET') {
    return (
      <div data-block-id={block.id}>
        <SetBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          isInvalid={isInvalid}
          validationType={validationType}
        />
      </div>
    );
  }

  // Render RESET block
  if (block.type === 'RESET') {
    return (
      <div data-block-id={block.id}>
        <ResetBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          isInvalid={isInvalid}
          validationType={validationType}
        />
      </div>
    );
  }

  // Render command blocks (SAY, DELAY, GO, LABEL, ASK)
  return (
    <div data-block-id={block.id}>
      <CommandBlock
        block={block}
        onUpdate={updateBlock}
        onRemove={isRootInZoom ? undefined : removeBlock}
        onDragStart={(e) => onDragStart(e, block)}
        sessionData={sessionData}
        isInvalid={isInvalid}
        validationType={validationType}
        onGoToLabel={sessionData?.goToLabel}
        onNavigateToSubScript={sessionData?.onNavigateToSubScript}
        allBlocks={allBlocks}
      />
    </div>
  );
};
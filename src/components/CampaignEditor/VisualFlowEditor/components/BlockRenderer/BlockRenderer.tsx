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
import { SetToBlock } from '../blocks/SetToBlock/SetToBlock';
import { AddBlock } from '../blocks/AddBlock/AddBlock';
import { SetFocusIfCreditsBlock } from '../blocks/SetFocusIfCreditsBlock/SetFocusIfCreditsBlock';
import { AddPartToShipBlock } from '../blocks/AddPartToShipBlock/AddPartToShipBlock';
import { AddPartToAsideSlotBlock } from '../blocks/AddPartToAsideSlotBlock/AddPartToAsideSlotBlock';
import { AddShipPartsBlock } from '../blocks/AddShipPartsBlock/AddShipPartsBlock';
import { FinishMissionBlock } from '../blocks/FinishMissionBlock/FinishMissionBlock';
import { AnchorPoint } from '../AnchorPoint/AnchorPoint';
import { useTranslation } from '@/locales';
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
  collapseAllTrigger?: number;
  expandAllTrigger?: number;
  globalCollapseState?: 'collapsed' | 'expanded' | 'manual';
  isCustom?: boolean;
  availableLanguages?: string[];
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
  allBlocks = [],
  collapseAllTrigger = 0,
  expandAllTrigger = 0,
  globalCollapseState = 'manual',
  isCustom,
  availableLanguages
}) => {
  const { t } = useTranslation();
  
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
        collapseAllTrigger={collapseAllTrigger}
        expandAllTrigger={expandAllTrigger}
        globalCollapseState={globalCollapseState}
        isCustom={isCustom}
        availableLanguages={availableLanguages}
      />
    ));
  }, [depth, onUpdateBlock, onRemoveBlock, onDragStart, onDragOver, onDrop, onDropAtIndex, isDragActive, onZoomIn, onZoomOut, isZoomed, currentFocusedBlockId, sessionData, createDropValidator, invalidBlocks, blockValidationTypes, allBlocks, collapseAllTrigger, expandAllTrigger, globalCollapseState, isCustom, availableLanguages]);

  // Render virtual container blocks (THEN/ELSE)
  if ((block as any).isVirtualContainer) {
    const virtualBlock = block as any;
    const isThenn = virtualBlock.containerType === 'then';
    const containerName = isThenn ? 'THEN' : 'ELSE';
    const containerColor = isThenn ? 'from-emerald-950/90 to-emerald-950/95 border-emerald-700/80' : 'from-slate-800/90 to-slate-800/95 border-slate-600/80';
    const labelColor = isThenn ? 'text-emerald-400 bg-emerald-900/40' : 'text-slate-400 bg-slate-700/40';

    // Calcola validazioni sui blocchi figli
    const childrenValidations = virtualBlock.children?.map((child: any) => ({
      id: child.id,
      isInvalid: invalidBlocks.includes(child.id),
      validationType: blockValidationTypes?.get(child.id)
    })) || [];
    
    const hasInvalidChildren = childrenValidations.some((child: any) => child.isInvalid);
    const hasWarnings = childrenValidations.some((child: any) => child.validationType === 'warning');
    const hasErrors = childrenValidations.some((child: any) => child.validationType === 'error');
    
    // Il container virtuale è invalido se ha figli invalidi
    const virtualBlockIsInvalid = hasInvalidChildren || hasErrors;
    const virtualValidationType = hasErrors ? 'error' : (hasWarnings ? 'warning' : undefined);
    
    // Classi per validazione del container
    const validationClasses = virtualBlockIsInvalid 
      ? (virtualValidationType === 'warning' 
          ? 'border-orange-500 border-2 shadow-orange-500/50 shadow-lg'
          : 'border-red-500 border-2 shadow-red-500/50 shadow-lg')
      : '';

    return (
      <div data-block-id={block.id}>
        <div className={`relative bg-gradient-to-b ${containerColor} border rounded-xl p-3 min-h-[100px] shadow-inner ${validationClasses}`}>
          {/* Zoom-out button per il container virtuale */}
          {onZoomOut && (
            <button
              onClick={onZoomOut}
              className="absolute top-2 right-2 p-1 bg-slate-600/80 hover:bg-orange-600 border border-slate-500/50 rounded-md z-20 transition-all duration-200 backdrop-blur-sm"
              title={t('visualFlowEditor.zoom.goBack')}
            >
              <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          
          {/* Label del container */}
          <div className={`absolute top-2 left-3 text-[10px] ${labelColor} font-bold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-sm`}>
            {containerName} • {virtualBlock.children?.length || 0}
            {virtualBlockIsInvalid && (
              <span className={`ml-1 ${virtualValidationType === 'warning' ? 'text-orange-400' : 'text-red-400'}`}>
                {virtualValidationType === 'warning' ? '⚠' : '❌'}
              </span>
            )}
          </div>
          
          <div className="mt-6 space-y-1">
            {/* Punto di ancoraggio iniziale */}
            <AnchorPoint
              onDragOver={onDragOver}
              onDrop={(e) => {
                // Per i blocchi virtuali, usa l'ID del blocco virtuale stesso
                // Il sistema di drop dovrebbe gestire il mapping al padre reale
                onDropAtIndex(e, virtualBlock.id, 'children', 0);
              }}
              label={isThenn ? t('visualFlowEditor.if.insertInThen') : t('visualFlowEditor.if.insertInElse')}
            />
            
            {/* Render dei blocchi figli con ancoraggi */}
            {virtualBlock.children && virtualBlock.children.length > 0 ? (
              virtualBlock.children.map((childBlock: IFlowBlock, index: number) => (
                <div key={childBlock.id}>
                  <BlockRenderer
                    key={childBlock.id}
                    block={childBlock}
                    depth={depth + 1}
                    onUpdateBlock={(blockId, updates) => {
                      // Per i blocchi figli di container virtuali, propaga al blocco padre reale
                      onUpdateBlock(blockId, updates);
                      // Aggiorna anche il conteggio nel container virtuale
                      if (virtualBlock.containerType === 'then') {
                        virtualBlock.numThen = virtualBlock.children?.length || 0;
                      } else {
                        virtualBlock.numElse = virtualBlock.children?.length || 0;
                      }
                    }}
                    onRemoveBlock={(blockId) => {
                      // Rimuove il blocco e aggiorna i conteggi
                      onRemoveBlock(blockId);
                      // Aggiorna il conteggio nel container virtuale
                      if (virtualBlock.containerType === 'then') {
                        virtualBlock.numThen = Math.max(0, (virtualBlock.numThen || 0) - 1);
                      } else {
                        virtualBlock.numElse = Math.max(0, (virtualBlock.numElse || 0) - 1);
                      }
                    }}
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
                    collapseAllTrigger={collapseAllTrigger}
                    expandAllTrigger={expandAllTrigger}
                    globalCollapseState={globalCollapseState}
                    isCustom={isCustom}
                    availableLanguages={availableLanguages}
                  />
                  <AnchorPoint
                    onDragOver={onDragOver}
                    onDrop={(e) => {
                      // Per i blocchi virtuali, usa l'ID del blocco virtuale stesso
                      onDropAtIndex(e, virtualBlock.id, 'children', index + 1);
                    }}
                    label=""
                  />
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm text-center py-4">
                Nessun blocco in questo container
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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
          onZoomIn={onZoomIn}
          onZoomOut={currentFocusedBlockId === block.id ? onZoomOut : undefined}
          isZoomed={isZoomed}
          sessionData={sessionData}
          isInvalid={isInvalid}
          validationType={validationType}
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
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
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
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
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
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
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
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
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
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
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
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
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
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
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
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
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
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
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
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
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
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
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
        />
      </div>
    );
  }

  // Render SET_TO block
  if (block.type === 'SET_TO') {
    return (
      <div data-block-id={block.id}>
        <SetToBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          isInvalid={isInvalid}
          validationType={validationType}
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
        />
      </div>
    );
  }

  // Render ADD block
  if (block.type === 'ADD') {
    return (
      <div data-block-id={block.id}>
        <AddBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          isInvalid={isInvalid}
          validationType={validationType}
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
        />
      </div>
    );
  }

  // Render SETFOCUSIFCREDITS block
  if (block.type === 'SETFOCUSIFCREDITS') {
    return (
      <div data-block-id={block.id}>
        <SetFocusIfCreditsBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          isInvalid={isInvalid}
          validationType={validationType}
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
        />
      </div>
    );
  }

  // Render ADDPARTTOSHIP block
  if (block.type === 'ADDPARTTOSHIP') {
    return (
      <div data-block-id={block.id}>
        <AddPartToShipBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          isInvalid={isInvalid}
          validationType={validationType}
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
        />
      </div>
    );
  }

  // Render ADDPARTTOASIDESLOT block
  if (block.type === 'ADDPARTTOASIDESLOT') {
    return (
      <div data-block-id={block.id}>
        <AddPartToAsideSlotBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          isInvalid={isInvalid}
          validationType={validationType}
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
        />
      </div>
    );
  }

  // Render ADDSHIPPARTS block
  if (block.type === 'ADDSHIPPARTS') {
    return (
      <div data-block-id={block.id}>
        <AddShipPartsBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          isInvalid={isInvalid}
          validationType={validationType}
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
        />
      </div>
    );
  }

  // Render SETADVPILE block (same UI pattern as ADDPARTTOSHIP: single 'params' string)
  if (block.type === 'SETADVPILE') {
    return (
      <div data-block-id={block.id}>
        <AddPartToShipBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          isInvalid={isInvalid}
          validationType={validationType}
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
        />
      </div>
    );
  }


  // Render SETSECRETADVPILE block (same UI pattern as ADDPARTTOSHIP)
  if (block.type === 'SETSECRETADVPILE') {
    return (
      <div data-block-id={block.id}>
        <AddPartToShipBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          isInvalid={isInvalid}
          validationType={validationType}
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
        />
      </div>
    );
  }

  // Render SHOWHELPIMAGE block come CommandBlock (come tutti i blocchi comando)
  if (block.type === 'SHOWHELPIMAGE') {
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
          onNavigateToMission={sessionData?.onNavigateToMission}
          allBlocks={allBlocks}
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
        />
      </div>
    );
  }

  // HelpScript blocks are rendered by CommandBlock (fallback)

  // Render FINISH_MISSION block
  if (block.type === 'FINISH_MISSION') {
    return (
      <div data-block-id={block.id}>
        <FinishMissionBlock
          block={block}
          onUpdate={updateBlock}
          onRemove={isRootInZoom ? undefined : removeBlock}
          onDragStart={(e) => onDragStart(e, block)}
          isInvalid={isInvalid}
          validationType={validationType}
          collapseAllTrigger={collapseAllTrigger}
          expandAllTrigger={expandAllTrigger}
          globalCollapseState={globalCollapseState}
          isCustom={isCustom}
          availableLanguages={availableLanguages}
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
        onNavigateToMission={sessionData?.onNavigateToMission}
        allBlocks={allBlocks}
        collapseAllTrigger={collapseAllTrigger}
        expandAllTrigger={expandAllTrigger}
        globalCollapseState={globalCollapseState}
      />
    </div>
  );
};
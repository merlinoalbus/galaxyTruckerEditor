import React, { useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { Block } from '../../../../../../../types/CampaignEditor/VisualFlowEditor/BlockTypes';

interface IfContainerLogicProps {
  block: any;
  onUpdate: (updates: Partial<any>) => void;
  onBlockAdd: (parentId: string, branch: 'then' | 'else', blockData: Block) => void;
  onBlockRemove: (parentId: string, branch: 'then' | 'else', blockId: string) => void;
  onBlockUpdate: (parentId: string, branch: 'then' | 'else', blockId: string, updates: Partial<Block>) => void;
  onBlockMove: (parentId: string, branch: 'then' | 'else', fromIndex: number, toIndex: number) => void;
}

export const useIfContainerLogic = ({
  block,
  onUpdate,
  onBlockAdd,
  onBlockRemove,
  onBlockUpdate,
  onBlockMove
}: IfContainerLogicProps) => {
  
  // Gestione aggiunta blocchi nel ramo then
  const handleAddToThen = useCallback((blockData: Block) => {
    const newThenBlocks = [...(block.thenBlocks || []), blockData];
    onUpdate({
      thenBlocks: newThenBlocks,
      numThen: newThenBlocks.length
    });
    onBlockAdd(block.id, 'then', blockData);
  }, [block, onUpdate, onBlockAdd]);

  // Gestione aggiunta blocchi nel ramo else
  const handleAddToElse = useCallback((blockData: Block) => {
    const newElseBlocks = [...(block.elseBlocks || []), blockData];
    onUpdate({
      elseBlocks: newElseBlocks,
      numElse: newElseBlocks.length
    });
    onBlockAdd(block.id, 'else', blockData);
  }, [block, onUpdate, onBlockAdd]);

  // Gestione rimozione blocchi dal ramo then
  const handleRemoveFromThen = useCallback((blockId: string) => {
    const newThenBlocks = (block.thenBlocks || []).filter((b: Block) => b.id !== blockId);
    onUpdate({
      thenBlocks: newThenBlocks,
      numThen: newThenBlocks.length
    });
    onBlockRemove(block.id, 'then', blockId);
  }, [block, onUpdate, onBlockRemove]);

  // Gestione rimozione blocchi dal ramo else
  const handleRemoveFromElse = useCallback((blockId: string) => {
    const newElseBlocks = (block.elseBlocks || []).filter((b: Block) => b.id !== blockId);
    onUpdate({
      elseBlocks: newElseBlocks,
      numElse: newElseBlocks.length
    });
    onBlockRemove(block.id, 'else', blockId);
  }, [block, onUpdate, onBlockRemove]);

  // Gestione aggiornamento blocchi nel ramo then
  const handleUpdateInThen = useCallback((blockId: string, updates: Partial<Block>) => {
    const newThenBlocks = (block.thenBlocks || []).map((b: Block) => 
      b.id === blockId ? { ...b, ...updates } : b
    );
    onUpdate({ thenBlocks: newThenBlocks });
    onBlockUpdate(block.id, 'then', blockId, updates);
  }, [block, onUpdate, onBlockUpdate]);

  // Gestione aggiornamento blocchi nel ramo else
  const handleUpdateInElse = useCallback((blockId: string, updates: Partial<Block>) => {
    const newElseBlocks = (block.elseBlocks || []).map((b: Block) => 
      b.id === blockId ? { ...b, ...updates } : b
    );
    onUpdate({ elseBlocks: newElseBlocks });
    onBlockUpdate(block.id, 'else', blockId, updates);
  }, [block, onUpdate, onBlockUpdate]);

  // Gestione spostamento blocchi nel ramo then
  const handleMoveInThen = useCallback((fromIndex: number, toIndex: number) => {
    const newThenBlocks = [...(block.thenBlocks || [])];
    const [movedBlock] = newThenBlocks.splice(fromIndex, 1);
    newThenBlocks.splice(toIndex, 0, movedBlock);
    onUpdate({ thenBlocks: newThenBlocks });
    onBlockMove(block.id, 'then', fromIndex, toIndex);
  }, [block, onUpdate, onBlockMove]);

  // Gestione spostamento blocchi nel ramo else
  const handleMoveInElse = useCallback((fromIndex: number, toIndex: number) => {
    const newElseBlocks = [...(block.elseBlocks || [])];
    const [movedBlock] = newElseBlocks.splice(fromIndex, 1);
    newElseBlocks.splice(toIndex, 0, movedBlock);
    onUpdate({ elseBlocks: newElseBlocks });
    onBlockMove(block.id, 'else', fromIndex, toIndex);
  }, [block, onUpdate, onBlockMove]);

  // Validazione del blocco IF
  const validateIfBlock = useCallback(() => {
    const errors: string[] = [];
    
    // Validazione basata sul tipo di IF
    switch (block.ifType) {
      case 'IF':
      case 'IFNOT':
        if (!block.variabile) {
          errors.push('Semaforo richiesto');
        }
        break;
        
      case 'IF_IS':
      case 'IF_MAX':
      case 'IF_MIN':
        if (!block.variabile) {
          errors.push('Variabile richiesta');
        }
        if (block.valore === undefined || block.valore === null) {
          errors.push('Valore richiesto');
        }
        break;
        
      case 'IF_PROB':
        if (block.valore === undefined || block.valore < 0 || block.valore > 100) {
          errors.push('Percentuale deve essere tra 0 e 100');
        }
        break;
        
      case 'IF_HAS_CREDITS':
      case 'IFMISSIONRESULTMIN':
        if (block.valore === undefined || block.valore < 0) {
          errors.push('Valore deve essere >= 0');
        }
        break;
        
      case 'IFMISSIONRESULTIS':
        if (!block.valore) {
          errors.push('Risultato missione richiesto');
        }
        break;
        
      case 'IF_ORDER':
        if (!Array.isArray(block.valore) || block.valore.length === 0) {
          errors.push('Almeno una posizione richiesta');
        }
        break;
    }
    
    // Validazione strutturale
    if (block.numThen === 0 && block.numElse === 0) {
      errors.push('Almeno un ramo (then o else) deve contenere blocchi');
    }
    
    return errors;
  }, [block]);

  // Conversione per esportazione
  const exportIfBlock = useCallback(() => {
    const exported: any = {
      type: block.type,
      ifType: block.ifType,
      thenBlocks: block.thenBlocks || [],
      elseBlocks: block.elseBlocks || [],
      numThen: block.numThen || 0,
      numElse: block.numElse || 0
    };
    
    // Aggiungi campi opzionali solo se valorizzati
    if (block.variabile) {
      exported.variabile = block.variabile;
    }
    
    if (block.valore !== undefined && block.valore !== null) {
      exported.valore = block.valore;
    }
    
    return exported;
  }, [block]);

  // Importazione da JSON
  const importIfBlock = useCallback((data: any) => {
    const imported: any = {
      type: 'IF',
      ifType: data.ifType || 'IF',
      thenBlocks: data.thenBlocks || [],
      elseBlocks: data.elseBlocks || [],
      numThen: data.numThen || (data.thenBlocks?.length || 0),
      numElse: data.numElse || (data.elseBlocks?.length || 0)
    };
    
    if (data.variabile !== undefined) {
      imported.variabile = data.variabile;
    }
    
    if (data.valore !== undefined) {
      imported.valore = data.valore;
    }
    
    return imported;
  }, []);

  return {
    handlers: {
      handleAddToThen,
      handleAddToElse,
      handleRemoveFromThen,
      handleRemoveFromElse,
      handleUpdateInThen,
      handleUpdateInElse,
      handleMoveInThen,
      handleMoveInElse
    },
    validation: {
      validateIfBlock,
      errors: validateIfBlock()
    },
    export: {
      exportIfBlock,
      importIfBlock
    }
  };
};
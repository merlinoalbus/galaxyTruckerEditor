import React from 'react';
import { RotateCcw } from 'lucide-react';
import { BaseBlock } from './BaseBlock';
import { BlockProps } from './index';
import { VariableSelector } from '../components/VariableSelector';

export const ResetVariableBlock: React.FC<BlockProps> = (props) => {
  const { block, onDeleteBlock, variables, editingField, editingValue, onStartEditing, onSaveEdit, onEditingValueChange, onOpenVariablePicker } = props;
  
  const variableName = block.command.parameters?.variable;

  return (
    <BaseBlock
      className="bg-red-900/20 border border-red-700"
      icon={<RotateCcw className="w-5 h-5 text-red-400" />}
      title="Reset Semaforo"
      subtitle="→ OFF"
      titleWidth="w-48"
    >
      <VariableSelector
        blockId={block.id}
        field="variable"
        currentVariable={variableName}
        variables={variables}
        editingField={editingField}
        editingValue={editingValue}
        onStartEditing={onStartEditing}
        onSaveEdit={onSaveEdit}
        onEditingValueChange={onEditingValueChange}
        onOpenVariablePicker={onOpenVariablePicker}
        action="reset"
      />
    </BaseBlock>
  );
};
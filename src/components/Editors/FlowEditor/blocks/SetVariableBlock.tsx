import React from 'react';
import { Plus } from 'lucide-react';
import { BaseBlock } from './BaseBlock';
import { BlockProps } from './index';
import { VariableSelector } from '../components/VariableSelector';

export const SetVariableBlock: React.FC<BlockProps> = (props) => {
  const { block, onDeleteBlock, variables, editingField, editingValue, onStartEditing, onSaveEdit, onEditingValueChange, onOpenVariablePicker } = props;
  
  const variableName = block.command.parameters?.variable;
  const variableState = variables.get(variableName);

  return (
    <BaseBlock
      className="bg-green-900/20 border border-green-700"
      icon={<Plus className="w-5 h-5 text-green-400" />}
      title="Set Semaforo"
      subtitle="→ ON"
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
        action="set"
      />
    </BaseBlock>
  );
};
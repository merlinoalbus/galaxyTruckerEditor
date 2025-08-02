import React from 'react';
import { Equal } from 'lucide-react';
import { BaseBlock } from './BaseBlock';
import { BlockProps } from './index';
import { VariableSelector } from '../components/VariableSelector';

export const SetToVariableBlock: React.FC<BlockProps> = (props) => {
  const { block, onDeleteBlock, variables, editingField, editingValue, onStartEditing, onSaveEdit, onEditingValueChange, onOpenVariablePicker } = props;
  
  const variableName = block.command.parameters?.variable;
  const variableValue = block.command.parameters?.value;

  const handleValueChange = (newValue: string) => {
    // Update the block's parameters
    if (!block.command.parameters) block.command.parameters = {};
    block.command.parameters.value = newValue;
    
    // Update the command content
    block.command.content = `SET_TO ${variableName || 'newVariable'} ${newValue}`;
    
    // Trigger save
    if (onSaveEdit) onSaveEdit();
  };

  return (
    <BaseBlock
      className="bg-blue-900/20 border border-blue-700"
      icon={<Equal className="w-5 h-5 text-blue-400" />}
      title="Set Variable"
      subtitle=""
      titleWidth="w-48"
    >
      <div className="flex items-center space-x-3">
        {/* Variable Name Selector - Compact */}
        <div className="flex-1">
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
            action="set_to"
          />
        </div>
        
        {/* Equals Sign */}
        <span className="text-lg text-gray-400 font-mono">=</span>
        
        {/* Value Input - Inline */}
        <div className="w-20">
          {editingField?.blockId === block.id && editingField?.field === 'value' ? (
            <input
              type="text"
              value={editingValue}
              onChange={(e) => onEditingValueChange(e.target.value)}
              className="w-full bg-gt-secondary text-white px-2 py-1 rounded text-sm border border-blue-500 text-center"
              onBlur={onSaveEdit}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onSaveEdit();
                }
              }}
              autoFocus
              placeholder="0"
            />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartEditing(block.id, 'value', variableValue || '0');
              }}
              className="w-full bg-gt-secondary hover:bg-gt-accent/20 text-white px-2 py-1 rounded text-sm border border-transparent hover:border-blue-500 transition-colors text-center font-mono"
            >
              {variableValue || '0'}
            </button>
          )}
        </div>
      </div>
    </BaseBlock>
  );
};
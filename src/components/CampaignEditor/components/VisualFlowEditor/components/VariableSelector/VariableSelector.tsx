import React, { useState } from 'react';
import { Variable } from 'lucide-react';

interface VariableSelectorProps {
  blockId: string;
  field: string;
  currentVariable?: string;
  variables: Map<string, boolean> | Map<string, any>;
  editingField: any;
  editingValue: string;
  onStartEditing: (blockId: string, field: string, currentValue: string) => void;
  onSaveEdit: () => void;
  onEditingValueChange: (value: string) => void;
  action: 'set' | 'reset' | 'condition' | 'set_to';
}

export const VariableSelector: React.FC<VariableSelectorProps> = ({
  blockId,
  field,
  currentVariable,
  variables,
  editingField,
  editingValue,
  onStartEditing,
  onSaveEdit,
  onEditingValueChange,
  action
}) => {
  const isEditingVariable = editingField?.blockId === blockId && editingField?.field === field;
  const variableState = currentVariable ? variables.get(currentVariable) : undefined;
  const availableVariables = Array.from(variables.keys());
  
  const getActionColor = () => {
    switch (action) {
      case 'set': return 'text-green-400';
      case 'reset': return 'text-red-400';
      case 'condition': return 'text-orange-400';
      case 'set_to': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getResultState = () => {
    switch (action) {
      case 'set': return 'ON';
      case 'reset': return 'OFF';
      case 'condition': return variableState ? 'ON' : 'OFF';
      default: return '';
    }
  };

  return (
    <div className="flex items-center space-x-4 w-full">
      <div className="flex items-center space-x-2 flex-1">
        {isEditingVariable ? (
          <div className="flex-1">
            <input
              type="text"
              value={editingValue}
              onChange={(e) => onEditingValueChange(e.target.value)}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded text-sm border border-blue-500 focus:ring-2 focus:ring-blue-500"
              onBlur={onSaveEdit}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onSaveEdit();
                }
              }}
              autoFocus
              list={`variables-${blockId}`}
              placeholder="Enter variable name or select existing"
            />
            <datalist id={`variables-${blockId}`}>
              {availableVariables.map(variable => (
                <option key={variable} value={variable} />
              ))}
            </datalist>
          </div>
        ) : (
          <div 
            className={`flex items-center space-x-3 cursor-pointer hover:bg-blue-600/20 px-4 py-2 rounded-lg text-sm border flex-1 transition-all ${
              currentVariable ? 'border-gray-600 bg-gray-800/50' : 'border-dashed border-gray-500 bg-gray-800/30'
            } hover:border-blue-500`}
            onClick={(e) => {
              e.stopPropagation();
              onStartEditing(blockId, field, currentVariable || '');
            }}
          >
            <Variable className={`w-5 h-5 ${getActionColor()}`} />
            <div className="flex-1 min-w-0">
              <span className="text-white font-medium truncate block">
                {currentVariable || (action === 'set_to' ? 'Select/Create Variable' : 'Select/Create Semaforo')}
              </span>
              {currentVariable && availableVariables.length > 1 && (
                <div className="text-xs text-gray-400 mt-0.5">
                  {availableVariables.length} {action === 'set_to' ? 'variables' : 'semafori'} available
                </div>
              )}
            </div>
            
            {/* Current State Indicator */}
            {action !== 'set_to' && currentVariable && variableState !== undefined ? (
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className={`w-3 h-3 rounded-full ${
                  variableState ? 'bg-green-500' : 'bg-red-500'
                } shadow-lg`}></div>
                <span className={`text-sm font-medium ${
                  variableState ? 'text-green-400' : 'text-red-400'
                }`}>
                  {variableState ? 'ON' : 'OFF'}
                </span>
              </div>
            ) : currentVariable && (
              <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded flex-shrink-0">
                {action === 'set_to' ? 'VAR' : 'NEW'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Result */}
      {!isEditingVariable && action !== 'condition' && action !== 'set_to' && (
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="text-lg text-gray-400">→</span>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
            action === 'set' 
              ? 'bg-green-900/30 border border-green-700' 
              : 'bg-red-900/30 border border-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              action === 'set' ? 'bg-green-500' : 'bg-red-500'
            } shadow-lg`}></div>
            <span className={`text-sm font-medium ${
              action === 'set' ? 'text-green-400' : 'text-red-400'
            }`}>
              {getResultState()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
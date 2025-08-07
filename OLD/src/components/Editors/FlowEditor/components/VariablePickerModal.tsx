import React, { useState } from 'react';
import { X, Variable, Plus, Search } from 'lucide-react';

interface VariablePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVariable: (variableName: string) => void;
  currentVariable?: string;
  action: 'set' | 'reset' | 'condition' | 'set_to';
  variables: Map<string, boolean> | Map<string, any>; // semafori or realVariables
}

export const VariablePickerModal: React.FC<VariablePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectVariable,
  currentVariable,
  action,
  variables
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [newVariableName, setNewVariableName] = useState('');
  const [showCreateNew, setShowCreateNew] = useState(false);

  if (!isOpen) return null;

  const isVariableType = action === 'set_to';
  const availableVariables = Array.from(variables.keys());
  const filteredVariables = availableVariables.filter(name => 
    name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleCreateNew = () => {
    if (newVariableName.trim()) {
      onSelectVariable(newVariableName.trim());
      setNewVariableName('');
      setShowCreateNew(false);
      onClose();
    }
  };

  const getActionDescription = () => {
    switch (action) {
      case 'set': return 'turns semaforo ON';
      case 'reset': return 'turns semaforo OFF';
      case 'condition': return 'checks semaforo state';
      case 'set_to': return 'assign value to variable';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-gray-700 p-6 max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
              {isVariableType ? (
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Variable className="w-6 h-6 text-blue-400" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Variable className="w-6 h-6 text-green-400" />
                </div>
              )}
              <span>
                {isVariableType ? 'Select Variable' : 'Select Semaforo'}
              </span>
            </h3>
            <div className="text-sm text-gray-400 mt-2 ml-13">
              For {action.toUpperCase()} action - {getActionDescription()}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Filter */}
        <div className="mb-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${isVariableType ? 'variables' : 'semafori'}...`}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-gray-800/50 text-white pl-12 pr-4 py-3 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* Create New Section */}
        <div className="mb-6 p-5 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold text-lg flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-400" />
              <span>Create New {isVariableType ? 'Variable' : 'Semaforo'}</span>
            </h4>
            <button
              onClick={() => setShowCreateNew(!showCreateNew)}
              className={`p-2 rounded-lg transition-all ${showCreateNew ? 'bg-blue-500 text-white' : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'}`}
            >
              <Plus className={`w-5 h-5 transition-transform ${showCreateNew ? 'rotate-45' : ''}`} />
            </button>
          </div>
          
          {showCreateNew && (
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder={`Enter ${isVariableType ? 'variable' : 'semaforo'} name...`}
                value={newVariableName}
                onChange={(e) => setNewVariableName(e.target.value)}
                className="flex-1 bg-gray-700/50 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateNew();
                  }
                }}
                autoFocus
              />
              <button
                onClick={handleCreateNew}
                disabled={!newVariableName.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 disabled:scale-100"
              >
                Create
              </button>
            </div>
          )}
        </div>

        {/* Variables/Semafori List */}
        <div className="flex-1 overflow-hidden">
          <h4 className="text-white font-semibold text-lg mb-4 flex items-center justify-between">
            <span>Existing {isVariableType ? 'Variables' : 'Semafori'}</span>
            <span className="text-sm bg-gray-700 px-3 py-1 rounded-full text-gray-300">
              {filteredVariables.length}
            </span>
          </h4>
          
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {filteredVariables.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <Variable className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">No {isVariableType ? 'variables' : 'semafori'} found</p>
                {searchFilter && <p className="text-sm">matching "{searchFilter}"</p>}
              </div>
            ) : (
              filteredVariables.map((variableName) => {
                const isSelected = variableName === currentVariable;
                const variableState = variables.get(variableName);
                
                return (
                  <div
                    key={variableName}
                    onClick={() => {
                      onSelectVariable(variableName);
                      onClose();
                    }}
                    className={`
                      flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all transform hover:scale-[1.02]
                      ${isSelected 
                        ? 'bg-gradient-to-r from-blue-900/50 to-blue-800/50 border border-blue-500 shadow-lg' 
                        : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isVariableType ? 'bg-blue-500/20' : 'bg-green-500/20'
                      }`}>
                        <Variable className={`w-5 h-5 ${
                          isVariableType ? 'text-blue-400' : 'text-green-400'
                        }`} />
                      </div>
                      <div>
                        <span className="text-white font-semibold text-lg">{variableName}</span>
                        {isSelected && (
                          <div className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 rounded-full mt-1 inline-block">
                            SELECTED
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* State indicator for semafori only */}
                      {!isVariableType && typeof variableState === 'boolean' && (
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full shadow-lg ${
                            variableState ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                            variableState 
                              ? 'text-green-400 bg-green-900/30' 
                              : 'text-red-400 bg-red-900/30'
                          }`}>
                            {variableState ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      )}
                      
                      {/* Value indicator for variables */}
                      {isVariableType && variableState !== undefined && (
                        <div className="text-lg text-blue-400 font-mono bg-blue-900/30 px-3 py-1 rounded-lg">
                          = {variableState}
                        </div>
                      )}
                    </div>
                </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.8);
        }
      `}</style>
    </div>
  );
};
import React from 'react';
import { GitBranch, Plus, Settings } from 'lucide-react';
import { BaseBlock } from './BaseBlock';
import { BlockProps } from './index';
import { VariableSelector } from '../components/VariableSelector';

export const IfBlock: React.FC<BlockProps> = (props) => {
  const { block, isEditing, onDeleteBlock, variables, editingField, editingValue, onStartEditing, onSaveEdit, onEditingValueChange, onOpenVariablePicker } = props;
  
  // Local state to track current content for immediate display
  const [currentContent, setCurrentContent] = React.useState(block.command.content);
  
  // Initialize metadata if not present
  if (!block.metadata) {
    block.metadata = {};
  }
  
  // Determine if this is a predefined type based on command content
  const isPredefinedCommand = block.command.content && (
    block.command.content.startsWith('IF_TUTORIAL_SEEN') ||
    block.command.content.startsWith('IF_FROM_CAMPAIGN') ||
    block.command.content.startsWith('IF_DEBUG') ||
    block.command.content.startsWith('IF_MISSION_WON') ||
    block.command.content.startsWith('IF_PROB') ||
    block.command.content.startsWith('IF_MIN') ||
    block.command.content.startsWith('IF_MAX') ||
    block.command.content.startsWith('IF_IS') ||
    block.command.content.startsWith('IF_HAS_CREDITS') ||
    block.command.content.startsWith('IF_ORDER')
  );
  
  // Auto-detect and set metadata based on command content
  if (isPredefinedCommand && !block.metadata.ifType) {
    const commandParts = block.command.content.split(' ');
    const predType = commandParts[0];
    
    block.metadata.ifType = 'predefined';
    block.metadata.predefinedType = predType;
    block.metadata.condition = predType;
    
    // Parse existing parameters from command
    switch (predType) {
      case 'IF_PROB':
        if (commandParts[1]) block.metadata.probability = commandParts[1];
        break;
      case 'IF_MIN':
        if (commandParts[1]) block.metadata.variable = commandParts[1];
        if (commandParts[2]) block.metadata.minValue = commandParts[2];
        break;
      case 'IF_MAX':
        if (commandParts[1]) block.metadata.variable = commandParts[1];
        if (commandParts[2]) block.metadata.maxValue = commandParts[2];
        break;
      case 'IF_IS':
        if (commandParts[1]) block.metadata.variable = commandParts[1];
        if (commandParts[2]) block.metadata.exactValue = commandParts[2];
        break;
      case 'IF_HAS_CREDITS':
        if (commandParts[1]) block.metadata.creditsAmount = commandParts[1];
        break;
      case 'IF_ORDER':
        if (commandParts[1]) block.metadata.playerIndex = commandParts[1];
        if (commandParts[2]) block.metadata.positionValue = commandParts[2];
        break;
    }
  }
  
  // Use metadata from condition_container
  const condition = block.metadata?.condition || block.command.parameters?.condition || 'newVariable';
  const hasElse = block.metadata?.hasElse || false;
  const isNot = block.metadata?.isNot || false;
  const ifType = block.metadata?.ifType || 'standard'; // 'predefined' or 'standard'
  const predefinedType = block.metadata?.predefinedType;
  const variableName = ifType === 'standard' ? condition : undefined;
  
  // Predefined IF types based on complete Galaxy Trucker script analysis
  const predefinedTypes = [
    // State-based conditions
    { value: 'IF_TUTORIAL_SEEN', label: 'Tutorial Seen', description: 'Player has seen the tutorial before' },
    { value: 'IF_FROM_CAMPAIGN', label: 'From Campaign', description: 'Called from campaign mode' },
    { value: 'IF_DEBUG', label: 'Debug Mode', description: 'Debug mode is enabled' },
    { value: 'IF_MISSION_WON', label: 'Mission Won', description: 'Player won the current mission' },
    
    // Probability-based conditions
    { value: 'IF_PROB', label: 'Probability Check', description: 'Random probability check (requires number)' },
    
    // Comparison-based conditions
    { value: 'IF_MIN', label: 'Minimum Value', description: 'Variable is at least minimum value' },
    { value: 'IF_MAX', label: 'Maximum Value', description: 'Variable is at most maximum value' },
    { value: 'IF_IS', label: 'Exact Value', description: 'Variable equals exact value' },
    
    // Resource-based conditions
    { value: 'IF_HAS_CREDITS', label: 'Has Credits', description: 'Player has enough credits (requires amount)' },
    
    // Order-based conditions
    { value: 'IF_ORDER', label: 'Turn Order', description: 'Player position in turn order (requires parameters)' }
  ];
  
  const handleConditionModeChange = (isNotMode: boolean) => {
    block.metadata = {
      ...block.metadata,
      isNot: isNotMode
    };
    // Update command content
    const conditionName = condition;
    block.command.content = `${isNotMode ? 'IFNOT' : 'IF'} ${conditionName}`;
    if (onSaveEdit) onSaveEdit();
  };
  
  const handleVariableChange = (variable: string) => {
    block.metadata = {
      ...block.metadata,
      condition: variable
    };
    // Update command content
    const newContent = `${isNot ? 'IFNOT' : 'IF'} ${variable}`;
    block.command.content = newContent;
    block.command.parameters = { condition: variable };
    
    // CRITICAL: Also update the condition_start child that gets displayed in the UI
    if (block.children && block.children.length > 0) {
      const conditionStartChild = block.children.find((child: any) => child.type === 'condition_start');
      if (conditionStartChild) {
        conditionStartChild.content = newContent;
        conditionStartChild.parameters = { condition: variable };
      }
    }
    
    if (onSaveEdit) onSaveEdit();
  };
  
  const handleElseToggle = (checked: boolean) => {
    block.metadata = {
      ...block.metadata,
      hasElse: checked,
      elseIndex: checked ? (block.children?.length || 0) : -1
    };
    if (onSaveEdit) onSaveEdit();
  };

  const handlePredefinedParameterChange = (paramName: string, value: string) => {
    // Update metadata
    block.metadata = {
      ...block.metadata,
      [paramName]: value
    };
    
    // Immediately update command content with new parameter
    updatePredefinedCommandContent();
    
    // Save changes
    if (onSaveEdit) onSaveEdit();
  };

  const updatePredefinedCommandContent = () => {
    if (!predefinedType) return;
    
    let newContent = predefinedType;
    
    switch (predefinedType) {
      case 'IF_PROB':
        if (block.metadata.probability) {
          newContent = `IF_PROB ${block.metadata.probability}`;
        }
        break;
      case 'IF_MIN':
        if (block.metadata.variable && block.metadata.minValue) {
          newContent = `IF_MIN ${block.metadata.variable} ${block.metadata.minValue}`;
        }
        break;
      case 'IF_MAX':
        if (block.metadata.variable && block.metadata.maxValue) {
          newContent = `IF_MAX ${block.metadata.variable} ${block.metadata.maxValue}`;
        }
        break;
      case 'IF_IS':
        if (block.metadata.variable && block.metadata.exactValue) {
          newContent = `IF_IS ${block.metadata.variable} ${block.metadata.exactValue}`;
        }
        break;
      case 'IF_HAS_CREDITS':
        if (block.metadata.creditsAmount) {
          newContent = `IF_HAS_CREDITS ${block.metadata.creditsAmount}`;
        }
        break;
      case 'IF_ORDER':
        if (block.metadata.playerIndex !== undefined && block.metadata.positionValue !== undefined) {
          newContent = `IF_ORDER ${block.metadata.playerIndex} ${block.metadata.positionValue}`;
        }
        break;
      default:
        // For simple types without parameters (IF_TUTORIAL_SEEN, IF_FROM_CAMPAIGN, etc.)
        newContent = predefinedType;
        break;
    }
    
    // Update both block object AND local state for immediate UI update
    block.command.content = newContent;
    block.command.parameters = { condition: newContent };
    setCurrentContent(newContent);
    
    // CRITICAL: Also update the condition_start child that gets displayed in the UI
    if (block.children && block.children.length > 0) {
      const conditionStartChild = block.children.find((child: any) => child.type === 'condition_start');
      if (conditionStartChild) {
        conditionStartChild.content = newContent;
        conditionStartChild.parameters = { condition: newContent };
      }
    }
  };

  const handleIfTypeChange = (value: string) => {
    // Preserve existing values intelligently
    const currentMetadata = { ...block.metadata };
    
    if (value === 'standard') {
      // Switch to standard IF/IFNOT - preserve variable name if available
      const variableName = currentMetadata.variable || currentMetadata.condition || 'newVariable';
      block.metadata = {
        ...currentMetadata,
        ifType: 'standard',
        predefinedType: undefined,
        isNot: false,
        condition: variableName
      };
      const standardContent = `IF ${variableName}`;
      block.command.content = standardContent;
      block.command.parameters = { condition: variableName };
      setCurrentContent(standardContent);
      
      // CRITICAL: Also update the condition_start child for standard types
      if (block.children && block.children.length > 0) {
        const conditionStartChild = block.children.find((child: any) => child.type === 'condition_start');
        if (conditionStartChild) {
          conditionStartChild.content = standardContent;
          conditionStartChild.parameters = { condition: variableName };
        }
      }
    } else {
      // Switch to predefined type - intelligently preserve values
      const predType = value;
      block.metadata = {
        ...currentMetadata,
        ifType: 'predefined',
        predefinedType: predType,
        condition: predType
      };
      
      // Initialize parameters based on type, preserving existing values where possible
      switch (predType) {
        case 'IF_PROB':
          block.metadata.probability = currentMetadata.probability || '50';
          break;
        case 'IF_MIN':
          block.metadata.variable = currentMetadata.variable || currentMetadata.condition || 'visited';
          block.metadata.minValue = currentMetadata.minValue || currentMetadata.exactValue || '7';
          break;
        case 'IF_MAX':
          block.metadata.variable = currentMetadata.variable || currentMetadata.condition || 'opponents';
          block.metadata.maxValue = currentMetadata.maxValue || currentMetadata.exactValue || '2';
          break;
        case 'IF_IS':
          block.metadata.variable = currentMetadata.variable || currentMetadata.condition || 'sailor';
          block.metadata.exactValue = currentMetadata.exactValue || currentMetadata.minValue || currentMetadata.maxValue || '4';
          break;
        case 'IF_HAS_CREDITS':
          block.metadata.creditsAmount = currentMetadata.creditsAmount || '3';
          break;
        case 'IF_ORDER':
          block.metadata.playerIndex = currentMetadata.playerIndex || '0';
          block.metadata.positionValue = currentMetadata.positionValue || '1';
          break;
        default:
          // Simple predefined types without parameters
          break;
      }
      
      // Update command content after setting parameters
      updatePredefinedCommandContent();
    }
    
    if (onSaveEdit) onSaveEdit();
  };

  // Compact inline parameters for 1-line layout
  const renderCompactPredefinedParameters = () => {
    if (!predefinedType) return null;

    switch (predefinedType) {
      case 'IF_PROB':
        const probValue = parseInt(block.metadata.probability || '50');
        return (
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={probValue}
              onChange={(e) => handlePredefinedParameterChange('probability', e.target.value)}
              className="w-20 h-2 bg-yellow-950/50 rounded-lg appearance-none cursor-pointer slider"
              title="Probability (0-100)"
              style={{
                background: `linear-gradient(to right, #ca8a04 0%, #ca8a04 ${probValue}%, #422006 ${probValue}%, #422006 100%)`
              }}
            />
            <span className="text-xs text-yellow-300 font-mono w-8">{probValue}%</span>
          </div>
        );
      case 'IF_MIN':
        return (
          <>
            <select
              value={block.metadata.variable || ''}
              onChange={(e) => handlePredefinedParameterChange('variable', e.target.value)}
              className="bg-yellow-950/50 border border-yellow-800 rounded px-2 py-1 text-sm text-yellow-100"
              title="Variable"
            >
              <option value="">Select Variable</option>
              {Array.from(variables?.keys() || []).map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <span className="text-xs text-yellow-300">≥</span>
            <input
              type="number"
              value={block.metadata.minValue || ''}
              onChange={(e) => handlePredefinedParameterChange('minValue', e.target.value)}
              className="w-16 bg-yellow-950/50 border border-yellow-800 rounded px-2 py-1 text-sm text-yellow-100"
              placeholder="7"
              title="Minimum Value"
            />
          </>
        );
      case 'IF_MAX':
        return (
          <>
            <select
              value={block.metadata.variable || ''}
              onChange={(e) => handlePredefinedParameterChange('variable', e.target.value)}
              className="bg-yellow-950/50 border border-yellow-800 rounded px-2 py-1 text-sm text-yellow-100"
              title="Variable"
            >
              <option value="">Select Variable</option>
              {Array.from(variables?.keys() || []).map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <span className="text-xs text-yellow-300">≤</span>
            <input
              type="number"
              value={block.metadata.maxValue || ''}
              onChange={(e) => handlePredefinedParameterChange('maxValue', e.target.value)}
              className="w-16 bg-yellow-950/50 border border-yellow-800 rounded px-2 py-1 text-sm text-yellow-100"
              placeholder="2"
              title="Maximum Value"
            />
          </>
        );
      case 'IF_IS':
        return (
          <>
            <select
              value={block.metadata.variable || ''}
              onChange={(e) => handlePredefinedParameterChange('variable', e.target.value)}
              className="bg-yellow-950/50 border border-yellow-800 rounded px-2 py-1 text-sm text-yellow-100"
              title="Variable"
            >
              <option value="">Select Variable</option>
              {Array.from(variables?.keys() || []).map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <span className="text-xs text-yellow-300">=</span>
            <input
              type="number"
              value={block.metadata.exactValue || ''}
              onChange={(e) => handlePredefinedParameterChange('exactValue', e.target.value)}
              className="w-16 bg-yellow-950/50 border border-yellow-800 rounded px-2 py-1 text-sm text-yellow-100"
              placeholder="4"
              title="Exact Value"
            />
          </>
        );
      case 'IF_HAS_CREDITS':
        return (
          <input
            type="number"
            min="0"
            value={block.metadata.creditsAmount || ''}
            onChange={(e) => handlePredefinedParameterChange('creditsAmount', e.target.value)}
            className="w-16 bg-yellow-950/50 border border-yellow-800 rounded px-2 py-1 text-sm text-yellow-100"
            placeholder="3"
            title="Credits Amount"
          />
        );
      case 'IF_ORDER':
        return (
          <>
            <input
              type="number"
              min="0"
              max="3"
              value={block.metadata.playerIndex || ''}
              onChange={(e) => handlePredefinedParameterChange('playerIndex', e.target.value)}
              className="w-12 bg-yellow-950/50 border border-yellow-800 rounded px-2 py-1 text-sm text-yellow-100"
              placeholder="0"
              title="Player Index (0-3)"
            />
            <input
              type="number"
              min="1"
              max="4"
              value={block.metadata.positionValue || ''}
              onChange={(e) => handlePredefinedParameterChange('positionValue', e.target.value)}
              className="w-12 bg-yellow-950/50 border border-yellow-800 rounded px-2 py-1 text-sm text-yellow-100"
              placeholder="1"
              title="Position Value (1-4)"
            />
          </>
        );
      default:
        return null;
    }
  };

  const renderPredefinedParameters = () => {
    if (!predefinedType) return null;

    switch (predefinedType) {
      // 1. Simple types without parameters
      case 'IF_TUTORIAL_SEEN':
      case 'IF_FROM_CAMPAIGN':
      case 'IF_DEBUG':
      case 'IF_MISSION_WON':
        return (
          <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-800">
            <div className="text-sm text-yellow-200">
              <strong>Type:</strong> {predefinedType}
            </div>
            <div className="text-xs text-yellow-400 mt-1">
              This predefined condition requires no additional parameters
            </div>
          </div>
        );

      // 2. IF_PROB - requires 1 parameter: probability (0-100)
      case 'IF_PROB':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-yellow-200 mb-2">Probability (0-100):</label>
              <input
                type="number"
                min="0"
                max="100"
                value={block.metadata.probability || '50'}
                onChange={(e) => handlePredefinedParameterChange('probability', e.target.value)}
                className="w-full bg-yellow-950/50 border border-yellow-800 rounded px-3 py-2 text-yellow-100"
                placeholder="50"
              />
            </div>
          </div>
        );

      // 3. IF_MIN - requires 2 parameters: variable name, minimum value
      case 'IF_MIN':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-yellow-200 mb-2">Variable Name:</label>
              <VariableSelector
                blockId={block.id}
                field="variable"
                currentVariable={block.metadata.variable || ''}
                variables={variables}
                editingField={editingField}
                editingValue={editingValue}
                onStartEditing={onStartEditing}
                onSaveEdit={() => {
                  if (editingField?.blockId === block.id && editingField?.field === 'variable') {
                    handlePredefinedParameterChange('variable', editingValue);
                  }
                  onSaveEdit();
                }}
                onEditingValueChange={onEditingValueChange}
                onOpenVariablePicker={(blockId, field, current) => {
                  if (onOpenVariablePicker) {
                    onOpenVariablePicker(blockId, field, current, 'select');
                  }
                }}
                action="condition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-200 mb-2">Minimum Value:</label>
              <input
                type="number"
                value={block.metadata.minValue || ''}
                onChange={(e) => handlePredefinedParameterChange('minValue', e.target.value)}
                className="w-full bg-yellow-950/50 border border-yellow-800 rounded px-3 py-2 text-yellow-100"
                placeholder="7"
              />
            </div>
          </div>
        );

      // 4. IF_MAX - requires 2 parameters: variable name, maximum value
      case 'IF_MAX':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-yellow-200 mb-2">Variable Name:</label>
              <VariableSelector
                blockId={block.id}
                field="variable"
                currentVariable={block.metadata.variable || ''}
                variables={variables}
                editingField={editingField}
                editingValue={editingValue}
                onStartEditing={onStartEditing}
                onSaveEdit={() => {
                  if (editingField?.blockId === block.id && editingField?.field === 'variable') {
                    handlePredefinedParameterChange('variable', editingValue);
                  }
                  onSaveEdit();
                }}
                onEditingValueChange={onEditingValueChange}
                onOpenVariablePicker={(blockId, field, current) => {
                  if (onOpenVariablePicker) {
                    onOpenVariablePicker(blockId, field, current, 'select');
                  }
                }}
                action="condition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-200 mb-2">Maximum Value:</label>
              <input
                type="number"
                value={block.metadata.maxValue || ''}
                onChange={(e) => handlePredefinedParameterChange('maxValue', e.target.value)}
                className="w-full bg-yellow-950/50 border border-yellow-800 rounded px-3 py-2 text-yellow-100"
                placeholder="2"
              />
            </div>
          </div>
        );

      // 5. IF_IS - requires 2 parameters: variable name, exact value
      case 'IF_IS':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-yellow-200 mb-2">Variable Name:</label>
              <VariableSelector
                blockId={block.id}
                field="variable"
                currentVariable={block.metadata.variable || ''}
                variables={variables}
                editingField={editingField}
                editingValue={editingValue}
                onStartEditing={onStartEditing}
                onSaveEdit={() => {
                  if (editingField?.blockId === block.id && editingField?.field === 'variable') {
                    handlePredefinedParameterChange('variable', editingValue);
                  }
                  onSaveEdit();
                }}
                onEditingValueChange={onEditingValueChange}
                onOpenVariablePicker={(blockId, field, current) => {
                  if (onOpenVariablePicker) {
                    onOpenVariablePicker(blockId, field, current, 'select');
                  }
                }}
                action="condition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-200 mb-2">Exact Value:</label>
              <input
                type="text"
                value={block.metadata.exactValue || ''}
                onChange={(e) => handlePredefinedParameterChange('exactValue', e.target.value)}
                className="w-full bg-yellow-950/50 border border-yellow-800 rounded px-3 py-2 text-yellow-100"
                placeholder="4"
              />
            </div>
          </div>
        );

      // 6. IF_HAS_CREDITS - requires 1 parameter: credits amount
      case 'IF_HAS_CREDITS':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-yellow-200 mb-2">Credits Amount:</label>
              <input
                type="number"
                min="0"
                value={block.metadata.creditsAmount || ''}
                onChange={(e) => handlePredefinedParameterChange('creditsAmount', e.target.value)}
                className="w-full bg-yellow-950/50 border border-yellow-800 rounded px-3 py-2 text-yellow-100"
                placeholder="3"
              />
            </div>
          </div>
        );

      // 7. IF_ORDER - requires 2 parameters: player index (0-3), position value (1-4)
      case 'IF_ORDER':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-yellow-200 mb-2">Player Index (0-3):</label>
              <input
                type="number"
                min="0"
                max="3"
                value={block.metadata.playerIndex || ''}
                onChange={(e) => handlePredefinedParameterChange('playerIndex', e.target.value)}
                className="w-full bg-yellow-950/50 border border-yellow-800 rounded px-3 py-2 text-yellow-100"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-200 mb-2">Position Value (1-4):</label>
              <input
                type="number"
                min="1"
                max="4"
                value={block.metadata.positionValue || ''}
                onChange={(e) => handlePredefinedParameterChange('positionValue', e.target.value)}
                className="w-full bg-yellow-950/50 border border-yellow-800 rounded px-3 py-2 text-yellow-100"
                placeholder="1"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // If not in editing mode, show simple display
  if (!isEditing) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-white">
              {ifType === 'predefined' ? (
                <span className="font-mono text-yellow-300">{block.command.content}</span>
              ) : (
                <>
                  <span className={`px-2 py-1 rounded text-xs ${isNot ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
                    {isNot ? 'IFNOT' : 'IF'}
                  </span>
                  <span className="ml-2 text-yellow-300">{condition}</span>
                </>
              )}
            </span>
          </div>
          {onDeleteBlock && (
            <button
              onClick={() => onDeleteBlock(block.id)}
              className="p-1 text-red-400 hover:text-red-300"
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full editing interface - COMPACT 1-LINE VERSION
  return (
    <div className="bg-yellow-900/20 border border-yellow-700 rounded px-3 py-2">
      <div className="flex items-center space-x-3">
        <GitBranch className="w-4 h-4 text-yellow-400" />
        <span className="text-sm font-medium text-white">IF Config:</span>
        
        {/* IF Type Selection */}
        <select
          value={ifType === 'predefined' ? predefinedType : 'standard'}
          onChange={(e) => {
            const value = e.target.value;
            handleIfTypeChange(value);
          }}
          className="bg-yellow-950/50 border border-yellow-800 rounded px-2 py-1 text-sm text-yellow-100"
        >
          <optgroup label="Standard">
            <option value="standard">IF/IFNOT Variables</option>
          </optgroup>
          <optgroup label="Predefined">
            <option value="IF_TUTORIAL_SEEN">Tutorial Seen</option>
            <option value="IF_FROM_CAMPAIGN">From Campaign</option>
            <option value="IF_DEBUG">Debug Mode</option>
            <option value="IF_MISSION_WON">Mission Won</option>
            <option value="IF_PROB">Probability Check</option>
            <option value="IF_MIN">Minimum Value</option>
            <option value="IF_MAX">Maximum Value</option>
            <option value="IF_IS">Exact Value</option>
            <option value="IF_HAS_CREDITS">Has Credits</option>
            <option value="IF_ORDER">Turn Order</option>
          </optgroup>
        </select>

        {/* Compact Predefined Parameters - all inline */}
        {ifType === 'predefined' && renderCompactPredefinedParameters()}

        {/* Standard IF Configuration - compact inline */}
        {ifType === 'standard' && (
          <>
            <button
              onClick={() => handleConditionModeChange(!isNot)}
              className={`px-2 py-1 text-xs rounded ${
                isNot ? 'bg-red-900/30 text-red-200' : 'bg-green-900/30 text-green-200'
              }`}
              title="Toggle IF/IFNOT"
            >
              {isNot ? 'IFNOT' : 'IF'}
            </button>
            <VariableSelector
              blockId={block.id}
              field="condition"
              currentVariable={condition}
              variables={variables}
              editingField={editingField}
              editingValue={editingValue}
              onStartEditing={onStartEditing}
              onSaveEdit={() => {
                if (editingField?.blockId === block.id && editingField?.field === 'condition') {
                  handleVariableChange(editingValue);
                }
                onSaveEdit();
              }}
              onEditingValueChange={onEditingValueChange}
              onOpenVariablePicker={onOpenVariablePicker}
              action="condition"
            />
          </>
        )}

        {/* Else checkbox - inline */}
        <label className="flex items-center space-x-1 text-xs text-yellow-200">
          <input
            type="checkbox"
            checked={hasElse}
            onChange={(e) => handleElseToggle(e.target.checked)}
            className="rounded border-yellow-800 bg-yellow-950/50 text-yellow-500"
          />
          <span>ELSE</span>
        </label>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { 
  FlowBlock as FlowBlockType, 
  ValidationResult, 
  Position 
} from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';
import { BaseBlock } from '../BaseBlock/BaseBlock';
import { MultiLanguageTextEditor } from '../MultiLanguageTextEditor/MultiLanguageTextEditor';
import { CharacterSelector } from '../CharacterSelector/CharacterSelector';
import { VariableSelector } from '../VariableSelector/VariableSelector';

interface FlowBlockProps {
  block: FlowBlockType;
  isSelected: boolean;
  isDragging: boolean;
  validationResults: ValidationResult[];
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<FlowBlockType>) => void;
  onDragStart: (position: Position) => void;
  onDropZoneClick: (position: 'before' | 'after') => void;
}

export const FlowBlock: React.FC<FlowBlockProps> = ({
  block,
  isSelected,
  isDragging,
  validationResults,
  onSelect,
  onDelete,
  onUpdate,
  onDragStart,
  onDropZoneClick
}) => {
  const [editingField, setEditingField] = useState<any>(null);
  const [editingValue, setEditingValue] = useState('');
  const [selectedLanguage] = useState('EN');
  const [showAllLanguages] = useState(false);

  const getBlockIcon = () => {
    const icons = {
      'say': '💬',
      'ask': '❓',
      'announce': '📢',
      'show_character': '👤',
      'hide_character': '👻',
      'change_character': '🎭',
      'set_variable': '🔧',
      'reset_variable': '🔄',
      'set_to_variable': '📊',
      'dialog_container': '📝',
      'menu_container': '📋',
      'if_container': '🔀',
      'menu_option': '☰',
      'label': '🏷️',
      'goto': '➡️',
      'return': '↩️',
      'delay': '⏱️',
      'script_call': '📞',
      'unknown': '❓'
    };
    return icons[block.type] || '❔';
  };

  const getBlockTitle = () => {
    return block.type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getBlockSubtitle = () => {
    switch (block.type) {
      case 'if_container':
        return `Condition: ${block.data.condition || '?'}`;
      case 'say':
      case 'ask':
      case 'announce':
        return block.metadata?.currentCharacter ? `Speaker: ${block.metadata.currentCharacter}` : undefined;
      case 'label':
        return `Label: ${block.data.label || '?'}`;
      case 'goto':
        return `Target: ${block.data.label || '?'}`;
      case 'script_call':
        return `Script: ${block.data.script || '?'}`;
      case 'delay':
        return `${block.data.milliseconds || '?'} ms`;
      default:
        return undefined;
    }
  };

  const handleStartEditing = (blockId: string, field: string, currentValue: string, language?: string) => {
    setEditingField({ blockId, field, language });
    setEditingValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (editingField) {
      const { field, language } = editingField;
      
      if (language && ['say', 'ask', 'announce'].includes(block.type)) {
        // Update localized text
        const currentLocalized = block.data.localizedText as Record<string, string> || {};
        const newLocalized = { ...currentLocalized, [language]: editingValue };
        onUpdate({ 
          data: { 
            ...block.data, 
            localizedText: newLocalized,
            ...(language === 'EN' && { [field]: editingValue }) // Also update main field for EN
          } 
        });
      } else {
        // Update regular field
        onUpdate({ data: { ...block.data, [field]: editingValue } });
      }
    }
    
    setEditingField(null);
    setEditingValue('');
  };

  const handleCharacterPicker = (blockId: string, field: string, current?: string) => {
    // TODO: Implement character picker modal
    console.log('Open character picker for', blockId, field, current);
  };

  const isContainer = ['if_container', 'menu_container'].includes(block.type);
  const childBlocks = block.children || [];
  const elseBlocks = block.elseBranch || [];

  // Mock data - in real app these would come from context
  const characters = [
    { name: 'tutor', displayName: 'Tutor', images: [] },
    { name: 'player', displayName: 'Player', images: [] }
  ];
  const variables = new Map([['class3', true], ['tutorial_complete', false]]);

  const renderBlockContent = () => {
    switch (block.type) {
      case 'say':
      case 'ask':
      case 'announce':
        return (
          <div className="space-y-3">
            <MultiLanguageTextEditor
              block={block}
              fieldName="text"
              defaultText=""
              placeholder={`Enter ${block.type} text...`}
              editingField={editingField}
              editingValue={editingValue}
              selectedLanguage={selectedLanguage}
              showAllLanguages={showAllLanguages}
              onStartEditing={handleStartEditing}
              onSaveEdit={handleSaveEdit}
              onEditingValueChange={setEditingValue}
            />
            {['say', 'ask'].includes(block.type) && (
              <CharacterSelector
                blockId={block.id}
                field="character"
                currentCharacter={block.data.character as string}
                characters={characters}
                onOpenCharacterPicker={handleCharacterPicker}
                showImage={true}
              />
            )}
          </div>
        );

      case 'set_variable':
      case 'reset_variable':
        return (
          <VariableSelector
            blockId={block.id}
            field="variable"
            currentVariable={block.data.variable as string}
            variables={variables}
            editingField={editingField}
            editingValue={editingValue}
            onStartEditing={handleStartEditing}
            onSaveEdit={handleSaveEdit}
            onEditingValueChange={setEditingValue}
            action={block.type === 'set_variable' ? 'set' : 'reset'}
          />
        );

      case 'show_character':
      case 'hide_character':
      case 'change_character':
        return (
          <CharacterSelector
            blockId={block.id}
            field="character"
            currentCharacter={block.data.character as string}
            characters={characters}
            onOpenCharacterPicker={handleCharacterPicker}
            showImage={true}
          />
        );

      case 'if_container':
        return (
          <div className="space-y-4">
            <div className="text-sm">
              <span className="text-gray-400">Condition: </span>
              <span className="text-white font-mono">{block.data.condition || 'undefined'}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TRUE Branch */}
              <div>
                <div className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-2">
                  <span>✓ TRUE</span>
                  <span className="text-gray-400">({childBlocks.length} blocks)</span>
                </div>
                <div className="min-h-16 border-2 border-dashed border-green-600 rounded-lg p-3 bg-green-900/20">
                  {childBlocks.length === 0 ? (
                    <div className="text-center text-gray-500 text-xs py-4">
                      💡 Drop blocks here
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {childBlocks.map((childId, index) => (
                        <div key={childId} className="text-xs text-gray-300 bg-gray-600 p-2 rounded">
                          #{index + 1} {childId}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* ELSE Branch */}
              {block.data.hasElse && (
                <div>
                  <div className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <span>✗ ELSE</span>
                    <span className="text-gray-400">({elseBlocks.length} blocks)</span>
                  </div>
                  <div className="min-h-16 border-2 border-dashed border-red-600 rounded-lg p-3 bg-red-900/20">
                    {elseBlocks.length === 0 ? (
                      <div className="text-center text-gray-500 text-xs py-4">
                        💡 Drop blocks here
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {elseBlocks.map((elseId, index) => (
                          <div key={elseId} className="text-xs text-gray-300 bg-gray-600 p-2 rounded">
                            #{index + 1} {elseId}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'menu_container':
        return (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-2">
              <span>☰ OPTIONS</span>
              <span className="text-gray-400">({childBlocks.length} options)</span>
            </div>
            <div className="min-h-16 border-2 border-dashed border-blue-600 rounded-lg p-3 bg-blue-900/20">
              {childBlocks.length === 0 ? (
                <div className="text-center text-gray-500 text-xs py-4">
                  💡 Drop menu options here
                </div>
              ) : (
                <div className="space-y-1">
                  {childBlocks.map((childId, index) => (
                    <div key={childId} className="text-xs text-gray-300 bg-gray-600 p-2 rounded">
                      Option #{index + 1}: {childId}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'set_to_variable':
        return (
          <div className="space-y-2">
            <VariableSelector
              blockId={block.id}
              field="variable"
              currentVariable={block.data.variable as string}
              variables={variables}
              editingField={editingField}
              editingValue={editingValue}
              onStartEditing={handleStartEditing}
              onSaveEdit={handleSaveEdit}
              onEditingValueChange={setEditingValue}
              action="set_to"
            />
            <div className="text-sm">
              <span className="text-gray-400">Value: </span>
              <span className="text-white font-mono">{block.data.value || 'undefined'}</span>
            </div>
          </div>
        );

      case 'label':
        return (
          <div className="text-sm">
            <span className="text-gray-400">Label: </span>
            <span className="text-yellow-400 font-mono">{block.data.label || 'unnamed'}</span>
          </div>
        );

      case 'goto':
        return (
          <div className="text-sm">
            <span className="text-gray-400">Jump to: </span>
            <span className="text-blue-400 font-mono">{block.data.label || 'undefined'}</span>
          </div>
        );

      case 'script_call':
        return (
          <div className="text-sm">
            <span className="text-gray-400">Call: </span>
            <span className="text-purple-400 font-mono">{block.data.script || 'undefined'}</span>
          </div>
        );

      case 'delay':
        return (
          <div className="text-sm">
            <span className="text-gray-400">Wait: </span>
            <span className="text-cyan-400 font-mono">{block.data.milliseconds || '?'} ms</span>
          </div>
        );

      case 'return':
        return (
          <div className="text-sm text-orange-400">
            Return to caller script
          </div>
        );

      case 'unknown':
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-400">Command: </span>
              <span className="text-red-400 font-mono">{String(block.data.commandType) || 'UNKNOWN'}</span>
            </div>
            {block.data.originalLine && (
              <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded border-l-4 border-red-500">
                <span className="text-gray-400">Raw: </span>
                <span className="font-mono">{block.data.originalLine}</span>
              </div>
            )}
            {block.data.parameters && Object.keys(block.data.parameters).length > 0 && (
              <div className="text-xs text-gray-500">
                <span className="text-gray-400">Params: </span>
                <span className="font-mono">{JSON.stringify(block.data.parameters, null, 2)}</span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <div className="text-sm text-gray-300">
              {block.data.text || 'No content'}
            </div>
            {Object.keys(block.data).length > 1 && (
              <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded">
                <pre>{JSON.stringify(block.data, null, 2)}</pre>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="relative">
      <BaseBlock
        blockId={block.id}
        icon={<span className="text-2xl">{getBlockIcon()}</span>}
        title={getBlockTitle()}
        subtitle={getBlockSubtitle()}
        isSelected={isSelected}
        isDragging={isDragging}
        validationResults={validationResults}
        onSelect={onSelect}
        onDelete={onDelete}
        onDragStart={onDragStart}
        className={isContainer ? 'min-h-32' : 'min-h-16'}
        style={{
          position: 'absolute',
          left: block.position.x,
          top: block.position.y,
          width: isContainer ? '600px' : '400px'
        }}
      >
        {renderBlockContent()}
      </BaseBlock>

      {/* Drop zones */}
      <div
        className="absolute -top-2 left-0 right-0 h-2 bg-blue-500 opacity-0 hover:opacity-75 cursor-pointer transition-opacity rounded-full"
        style={{ width: isContainer ? '600px' : '400px' }}
        onClick={(e) => {
          e.stopPropagation();
          onDropZoneClick('before');
        }}
      />
      <div
        className="absolute -bottom-2 left-0 right-0 h-2 bg-blue-500 opacity-0 hover:opacity-75 cursor-pointer transition-opacity rounded-full"
        style={{ width: isContainer ? '600px' : '400px' }}
        onClick={(e) => {
          e.stopPropagation();
          onDropZoneClick('after');
        }}
      />
    </div>
  );
};
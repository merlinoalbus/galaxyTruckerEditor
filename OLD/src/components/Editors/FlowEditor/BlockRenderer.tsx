import React from 'react';
import { 
  MessageCircle, 
  HelpCircle, 
  Volume2,
  User, 
  UserX, 
  EyeOff,
  UserCheck,
  Play,
  MapPin,
  Square,
  Target,
  RotateCcw,
  Coins,
  BarChart3
} from 'lucide-react';

// Import the new modular block components
import { renderBlockContent as renderModularBlock } from './BlockRendererRefactored';
import { CharacterState } from './blocks/index';

// Import interfaces from the main file to avoid conflicts
interface Character {
  name: string;
  images: string[];
  displayName: string;
}

interface StructuredBlock {
  id: string;
  type: string;
  command: {
    line: number;
    content: string;
    type: string;
    parameters?: any; // Make optional to match ScriptCommand
  };
  children: StructuredBlock[];
  depth: number;
  metadata: {
    scriptName: string;
    [key: string]: any;
  };
}

interface EditingField {
  blockId: string;
  field: string;
  language?: string;
}

interface BlockRendererProps {
  block: StructuredBlock;
  isEditing: boolean;
  editingField: EditingField | null;
  editingValue: string;
  selectedLanguage: string;
  showAllLanguages: boolean;
  translations: Map<string, Record<string, string>>;
  availableNodes: any[];
  variables: Map<string, boolean>;
  characters: Character[];
  characterStates: Map<string, CharacterState>;
  languages: string[];
  onStartEditing: (blockId: string, field: string, currentValue: string, language?: string) => void;
  onSaveEdit: () => void;
  onEditingValueChange: (value: string) => void;
  onOpenCharacterPicker: (blockId: string, field: string, current?: string) => void;
  onOpenVariablePicker: (blockId: string, field: string, current?: string, action?: string) => void;
  onOpenNodeSelector: (blockId: string, field: string, current?: string) => void;
  onOpenButtonSelector: (blockId: string, field: string, current?: string) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
  onDeleteBlock?: (blockId: string) => void;
}

export const renderBlockContent = (props: BlockRendererProps): JSX.Element => {
  // Try the new modular renderer first
  try {
    return renderModularBlock({
      ...props,
      onDeleteBlock: props.onDeleteBlock,
      onMoveUp: props.onMoveUp,
      onMoveDown: props.onMoveDown,
      onOpenVariablePicker: props.onOpenVariablePicker || (() => {})
    });
  } catch (error) {
    console.warn('Modular renderer failed, falling back to legacy renderer:', error);
    // Fall back to legacy implementation if needed
    return renderLegacyBlockContent(props);
  }
};

// Legacy implementation kept as fallback
const renderLegacyBlockContent = (props: BlockRendererProps): JSX.Element => {
  const {
    block,
    isEditing,
    editingField,
    editingValue,
    selectedLanguage,
    showAllLanguages,
    translations,
    availableNodes,
    variables,
    characters,
    characterStates,
    languages,
    onStartEditing,
    onSaveEdit,
    onEditingValueChange,
    onOpenCharacterPicker,
    onOpenNodeSelector,
    onOpenButtonSelector
  } = props;

  const translationKey = `${block.command.line}`;
  const blockTranslations = translations.get(translationKey);

  // Multi-language text renderer
  const renderMultiLanguageText = (fieldName: string, defaultText: string) => {
    if (showAllLanguages) {
      return (
        <div className="space-y-1">
          {languages.map(lang => {
            const isEditingThisLang = editingField?.blockId === block.id && 
                                    editingField?.field === fieldName && 
                                    editingField?.language === lang;
            const textValue = (blockTranslations && blockTranslations[lang]) || 
                            (lang === 'EN' && block.command.parameters?.[fieldName]) || 
                            '';
            
            return (
              <div key={lang} className="flex items-start space-x-2">
                <span className="text-xs font-medium text-gray-400 w-8">{lang}:</span>
                {isEditingThisLang ? (
                  <textarea
                    value={editingValue}
                    onChange={(e) => onEditingValueChange(e.target.value)}
                    className="text-sm text-gray-300 flex-1 bg-gt-secondary border border-blue-500 rounded px-2 py-1 resize-none"
                    rows={2}
                    onBlur={onSaveEdit}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        onSaveEdit();
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <span 
                    className="text-sm text-gray-300 flex-1 cursor-pointer hover:bg-blue-600/20 px-1 rounded min-h-[20px] border border-transparent hover:border-blue-600/50"
                    onClick={() => onStartEditing(block.id, fieldName, textValue, lang)}
                  >
                    "{textValue || '(no translation)'}"
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );
    } else {
      const isEditingThis = editingField?.blockId === block.id && 
                           editingField?.field === fieldName && 
                           editingField?.language === selectedLanguage;
      const textValue = (blockTranslations && blockTranslations[selectedLanguage]) || 
                       block.command.parameters?.[fieldName] || 
                       defaultText;
      
      return (
        <div className="text-sm text-gray-300">
          {isEditingThis ? (
            <textarea
              value={editingValue}
              onChange={(e) => onEditingValueChange(e.target.value)}
              className="w-full bg-gt-secondary border border-blue-500 rounded px-2 py-1 resize-none"
              rows={2}
              onBlur={onSaveEdit}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  onSaveEdit();
                }
              }}
              autoFocus
            />
          ) : (
            <span 
              className="cursor-pointer hover:bg-blue-600/20 px-1 rounded min-h-[20px] block border border-transparent hover:border-blue-600/50"
              onClick={() => onStartEditing(block.id, fieldName, textValue, selectedLanguage)}
            >
              "{textValue}"
            </span>
          )}
        </div>
      );
    }
  };

  switch (block.command.type) {
    case 'dialogue':
    case 'question':
      return (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <span className="font-medium text-white">
              {block.command.type === 'dialogue' ? 'Say' : 'Ask'}
            </span>
            {block.metadata.currentCharacter && (
              <span className="text-sm text-gray-400">
                ({block.metadata.currentCharacter.name})
              </span>
            )}
          </div>
          {renderMultiLanguageText('text', block.command.type === 'dialogue' ? 'New dialogue' : 'New question')}
        </div>
      );

    case 'announce':
      return (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Volume2 className="w-5 h-5 text-yellow-400" />
            <span className="font-medium text-white">Announce</span>
          </div>
          {renderMultiLanguageText('text', 'New announcement')}
        </div>
      );

    case 'hide_character':
      const characterName = block.command.parameters?.character;
      
      return (
        <div className="flex items-center space-x-3">
          <EyeOff className="w-5 h-5 text-red-400" />
          <div className="flex items-center space-x-2">
            <span className="font-medium text-white">Hide Character:</span>
            <span 
              className="cursor-pointer hover:bg-blue-600/20 px-2 py-1 rounded border border-transparent hover:border-blue-500 flex items-center space-x-2"
              onClick={() => onOpenCharacterPicker(block.id, 'character', characterName)}
            >
              <span>{characterName || 'Select Character'}</span>
              <span className="text-xs text-gray-400">👤</span>
            </span>
            {/* Character Image Preview - Shows BASE character image */}
            {characterName && (() => {
              const characterData = characters.find(c => c.name === characterName);
              const baseCharacterImage = characterData?.images[0];
              
              return baseCharacterImage ? (
                <div className="ml-2">
                  <img 
                    src={`/campaign/${baseCharacterImage}`}
                    alt={`${characterName} (base)`}
                    className="w-8 h-8 rounded border border-gray-600"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = '/campaign/default-character.png';
                    }}
                  />
                </div>
              ) : null;
            })()}
          </div>
        </div>
      );

    case 'variable_set':
    case 'variable_reset':
      const isSet = block.command.type === 'variable_set';
      const isEditingVariable = editingField?.blockId === block.id && editingField?.field === 'variable';
      const variableName = block.command.parameters?.variable;
      const variableState = variables.get(variableName);
      const availableVariables = Array.from(variables.keys());
      
      return (
        <div className="flex items-center space-x-3">
          <div className={`w-5 h-5 font-bold flex items-center justify-center text-xs ${
            isSet ? 'text-green-400' : 'text-red-400'
          }`}>
            {isSet ? 'SET' : 'RST'}
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-white">
              {isSet ? 'Set Variable:' : 'Reset Variable:'}
            </span>
            {isEditingVariable ? (
              <input
                type="text"
                value={editingValue}
                onChange={(e) => onEditingValueChange(e.target.value)}
                className="bg-gt-secondary text-white px-2 py-1 rounded text-sm"
                onBlur={onSaveEdit}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    onSaveEdit();
                  }
                }}
                autoFocus
                list={`variables-${block.id}`}
              />
            ) : (
              <span 
                className="cursor-pointer hover:bg-blue-600/20 px-2 py-1 rounded border border-transparent hover:border-blue-500 flex items-center space-x-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEditing(block.id, 'variable', variableName || 'newVariable');
                }}
              >
                <span>{variableName || 'Select Variable'}</span>
                {variableState !== undefined && (
                  <span className={`text-xs px-1 rounded ${
                    variableState ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {variableState ? 'ON' : 'OFF'}
                  </span>
                )}
              </span>
            )}
            <datalist id={`variables-${block.id}`}>
              {availableVariables.map(variable => (
                <option key={variable} value={variable} />
              ))}
            </datalist>
            <span className={`text-xs ${isSet ? 'text-green-400' : 'text-red-400'}`}>
              → {isSet ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      );

    // Add more cases as needed...

    default:
      return (
        <div className="flex items-center space-x-2">
          <span className="font-medium text-white">{block.command.type}:</span>
          <span className="text-gray-300">{block.command.content}</span>
        </div>
      );
  }
};
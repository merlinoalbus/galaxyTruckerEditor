import React from 'react';
import { 
  MessageCircle, 
  HelpCircle, 
  Volume2,
  User, 
  UserX, 
  UserCheck,
  Play,
  MapPin,
  Square,
  Target,
  RotateCcw,
  Coins,
  BarChart3,
  EyeOff,
  Eye
} from 'lucide-react';
import { 
  StructuredBlock, 
  EditingField, 
  CHARACTER_POSITIONS, 
  LANGUAGES,
  Character
} from './types';

interface BlockRendererProps {
  block: StructuredBlock;
  isEditing: boolean;
  editingField: EditingField | null;
  editingValue: string;
  selectedLanguage: string;
  showAllLanguages: boolean;
  translations: Record<string, Record<string, string>>;
  availableNodes: any[];
  variables: Map<string, boolean>;
  characters: Character[];
  onStartEditing: (blockId: string, field: string, currentValue: string, language?: string) => void;
  onSaveEdit: () => void;
  onEditingValueChange: (value: string) => void;
  onOpenCharacterPicker: (blockId: string, field: string, current?: string) => void;
  onOpenNodeSelector: (blockId: string, field: string, current?: string) => void;
  onOpenButtonSelector: (blockId: string, field: string, current?: string) => void;
}

export const renderBlockContent = (props: BlockRendererProps): JSX.Element => {
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
    onStartEditing,
    onSaveEdit,
    onEditingValueChange,
    onOpenCharacterPicker,
    onOpenNodeSelector,
    onOpenButtonSelector
  } = props;

  const blockTranslations = translations[block.id] || {};

  // Multi-language text renderer
  const renderMultiLanguageText = (fieldName: string, defaultText: string) => {
    if (showAllLanguages) {
      return (
        <div className="space-y-1">
          {LANGUAGES.map(lang => {
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
      const isEditingThis = editingField?.blockId === block.id && editingField?.field === fieldName;
      const textValue = (blockTranslations && blockTranslations[selectedLanguage]) || 
                       block.command.parameters?.[fieldName] || 
                       defaultText;
      
      return (
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">{selectedLanguage}:</span>
          {isEditingThis ? (
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
              onClick={() => onStartEditing(block.id, fieldName, textValue, selectedLanguage)}
            >
              "{textValue}"
            </span>
          )}
        </div>
      );
    }
  };

  switch (block.type) {
    case 'dialogue':
      return (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <span className="font-medium text-white">Say</span>
            {block.metadata.currentCharacter && (
              <span className="text-sm text-gray-400">
                ({block.metadata.currentCharacter.name})
              </span>
            )}
          </div>
          {renderMultiLanguageText('text', 'New dialogue')}
        </div>
      );

    case 'question':
      return (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <HelpCircle className="w-5 h-5 text-green-400" />
            <span className="font-medium text-white">Ask</span>
            {block.metadata.currentCharacter && (
              <span className="text-sm text-gray-400">
                ({block.metadata.currentCharacter.name})
              </span>
            )}
          </div>
          {renderMultiLanguageText('text', 'New question')}
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

    case 'show_character':
      const isEditingCharacter = editingField?.blockId === block.id && editingField?.field === 'character';
      const isEditingPosition = editingField?.blockId === block.id && editingField?.field === 'position';
      
      return (
        <div className="flex items-center space-x-3">
          <User className="w-5 h-5 text-green-400" />
          <div className="flex items-center space-x-2">
            <span className="font-medium text-white">Show Character:</span>
            {isEditingCharacter ? (
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
              />
            ) : (
              <span 
                className="cursor-pointer hover:bg-blue-600/20 px-2 py-1 rounded border border-transparent hover:border-blue-500 flex items-center space-x-2"
                onClick={() => onOpenCharacterPicker(block.id, 'character', block.command.parameters?.character)}
              >
                <span>{block.command.parameters?.character || 'Select Character'}</span>
                <span className="text-xs text-gray-400">👤</span>
              </span>
            )}
            
            <span className="text-white">at</span>
            
            {isEditingPosition ? (
              <select
                value={editingValue}
                onChange={(e) => onEditingValueChange(e.target.value)}
                className="bg-gt-secondary text-white px-2 py-1 rounded text-sm"
                onBlur={onSaveEdit}
                autoFocus
              >
                {CHARACTER_POSITIONS.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            ) : (
              <span 
                className="cursor-pointer hover:bg-blue-600/20 px-2 py-1 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEditing(block.id, 'position', block.command.parameters?.position || 'center');
                }}
              >
                {block.command.parameters?.position || 'center'}
              </span>
            )}
          </div>
        </div>
      );

    case 'hide_character':
      const isEditingHideCharacter = editingField?.blockId === block.id && editingField?.field === 'character';
      
      return (
        <div className="flex items-center space-x-3">
          <EyeOff className="w-5 h-5 text-red-400" />
          <div className="flex items-center space-x-2">
            <span className="font-medium text-white">Hide Character:</span>
            {isEditingHideCharacter ? (
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
              />
            ) : (
              <span 
                className="cursor-pointer hover:bg-blue-600/20 px-2 py-1 rounded border border-transparent hover:border-blue-500 flex items-center space-x-2"
                onClick={() => onOpenCharacterPicker(block.id, 'character', block.command.parameters?.character)}
              >
                <span>{block.command.parameters?.character || 'Select Character'}</span>
                <span className="text-xs text-gray-400">👤</span>
              </span>
            )}
            {/* Character Image Preview */}
            {block.command.parameters?.character && (
              <div className="ml-2">
                <img 
                  src={`/campaign/${block.command.parameters.character}.png`}
                  alt={block.command.parameters.character}
                  className="w-8 h-8 rounded border border-gray-600"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/campaign/default-character.png';
                  }}
                />
              </div>
            )}
          </div>
        </div>
      );

    case 'change_character':
      const changeCharacterData = characters.find(c => c.name === block.command.parameters?.character);
      const currentImage = block.command.parameters?.image;
      
      return (
        <div className="flex items-center space-x-3">
          <UserCheck className="w-5 h-5 text-blue-400" />
          <div className="flex-1">
            <div className="font-medium text-white flex items-center space-x-2 mb-2">
              <span>Change Character:</span>
              <span 
                className="cursor-pointer hover:bg-blue-600/20 px-2 py-1 rounded border border-transparent hover:border-blue-500 flex items-center space-x-2"
                onClick={() => onOpenCharacterPicker(block.id, 'character', block.command.parameters?.character)}
              >
                <span>{block.command.parameters?.character || 'Select Character'}</span>
                <span className="text-xs text-gray-400">👤</span>
              </span>
            </div>
            
            {/* Current Image Preview */}
            {currentImage && (
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-gray-400">Current:</span>
                <img 
                  src={`/${currentImage}`}
                  alt="Current character"
                  className="w-12 h-12 rounded border border-gray-600"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/campaign/default-character.png';
                  }}
                />
              </div>
            )}
            
            {/* Available Images for Character */}
            {changeCharacterData && changeCharacterData.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {changeCharacterData.images.map((image, index) => (
                  <div 
                    key={index}
                    className={`cursor-pointer border-2 rounded p-1 transition-colors ${
                      currentImage === image 
                        ? 'border-blue-500 bg-blue-900/20' 
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                    onClick={() => onStartEditing(block.id, 'image', image)}
                  >
                    <img 
                      src={`/${image}`}
                      alt={`${changeCharacterData.name} variant`}
                      className="w-full h-12 object-cover rounded"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = '/campaign/default-character.png';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

    case 'variable_set':
      const isEditingSetVariable = editingField?.blockId === block.id && editingField?.field === 'variable';
      const variableName = block.command.parameters?.variable;
      const variableState = variables.get(variableName);
      
      return (
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 text-green-400 font-bold flex items-center justify-center text-xs">SET</div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-white">Set Variable:</span>
            {isEditingSetVariable ? (
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
                  <span className={`text-xs px-1 rounded ${variableState ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {variableState ? 'ON' : 'OFF'}
                  </span>
                )}
              </span>
            )}
            <datalist id={`variables-${block.id}`}>
              {Array.from(variables.keys()).map(variable => (
                <option key={variable} value={variable} />
              ))}
            </datalist>
            <span className="text-xs text-green-400">→ ON</span>
          </div>
        </div>
      );

    case 'variable_reset':
      const isEditingResetVariable = editingField?.blockId === block.id && editingField?.field === 'variable';
      const resetVariableName = block.command.parameters?.variable;
      const resetVariableState = variables.get(resetVariableName);
      
      return (
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 text-red-400 font-bold flex items-center justify-center text-xs">RST</div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-white">Reset Variable:</span>
            {isEditingResetVariable ? (
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
                list={`variables-reset-${block.id}`}
              />
            ) : (
              <span 
                className="cursor-pointer hover:bg-blue-600/20 px-2 py-1 rounded border border-transparent hover:border-blue-500 flex items-center space-x-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEditing(block.id, 'variable', resetVariableName || 'newVariable');
                }}
              >
                <span>{resetVariableName || 'Select Variable'}</span>
                {resetVariableState !== undefined && (
                  <span className={`text-xs px-1 rounded ${resetVariableState ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {resetVariableState ? 'ON' : 'OFF'}
                  </span>
                )}
              </span>
            )}
            <datalist id={`variables-reset-${block.id}`}>
              {Array.from(variables.keys()).map(variable => (
                <option key={variable} value={variable} />
              ))}
            </datalist>
            <span className="text-xs text-red-400">→ OFF</span>
          </div>
        </div>
      );

    // Add more cases as needed...

    default:
      return (
        <div className="flex items-center space-x-2">
          <span className="font-medium text-white">{block.type}:</span>
          <span className="text-gray-300">{block.command.content}</span>
        </div>
      );
  }
};
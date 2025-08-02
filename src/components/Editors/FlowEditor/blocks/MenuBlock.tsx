import React from 'react';
import { Menu, Plus } from 'lucide-react';
import { BaseBlock } from './BaseBlock';
import { BlockProps } from './index';
import { MultiLanguageTextEditor } from '../components/MultiLanguageTextEditor';

export const MenuBlock: React.FC<BlockProps> = (props) => {
  const { block, onDeleteBlock, languages, onStartEditing, onSaveEdit, editingField, editingValue, onEditingValueChange, selectedLanguage, showAllLanguages, translations } = props;
  
  const menuOptions = block.command.parameters?.options || [];
  
  const handleAddOption = () => {
    const newOption: any = {
      text: {},
      action: ''
    };
    languages.forEach(lang => {
      newOption.text[lang] = '';
    });
    
    block.command.parameters = {
      ...block.command.parameters,
      options: [...menuOptions, newOption]
    };
    if (onSaveEdit) onSaveEdit();
  };
  
  
  const handleOptionTextChange = (index: number, lang: string, text: string) => {
    const newOptions = [...menuOptions];
    if (!newOptions[index].text) newOptions[index].text = {};
    newOptions[index].text[lang] = text;
    block.command.parameters = {
      ...block.command.parameters,
      options: newOptions
    };
    if (onSaveEdit) onSaveEdit();
  };
  
  const handleOptionActionChange = (index: number, action: string) => {
    const newOptions = [...menuOptions];
    newOptions[index].action = action;
    block.command.parameters = {
      ...block.command.parameters,
      options: newOptions
    };
    if (onSaveEdit) onSaveEdit();
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = menuOptions.filter((_option: any, i: number) => i !== index);
    block.command.parameters = {
      ...block.command.parameters,
      options: newOptions
    };
    if (onSaveEdit) onSaveEdit();
  };

  return (
    <BaseBlock
      className="bg-cyan-900/20 border border-cyan-700"
      icon={<Menu className="w-5 h-5 text-cyan-400" />}
      title="Menu"
      onDeleteBlock={onDeleteBlock}
      blockId={block.id}
    >
      <div className="space-y-3">
        <div className="text-sm text-cyan-200">Menu Options:</div>
        
        {menuOptions.length === 0 ? (
          <div className="text-sm text-gray-400 italic">No options added yet</div>
        ) : (
          <div className="space-y-2">
            {menuOptions.map((option: any, index: number) => (
              <div key={index} className="bg-cyan-900/30 rounded-lg p-3 border border-cyan-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-cyan-200">Option {index + 1}</span>
                  <button
                    onClick={() => handleRemoveOption(index)}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-900/20 hover:bg-red-900/30 rounded transition-colors"
                    title="Remove option"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Multilingual option text */}
                <div className="space-y-1 mb-2">
                  <label className="block text-xs text-cyan-300 mb-1">Option Text:</label>
                  {languages.map(lang => (
                    <div key={lang} className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400 w-8">{lang}:</span>
                      <input
                        type="text"
                        className="flex-1 text-sm bg-cyan-950/50 border border-cyan-800 rounded px-2 py-1 text-cyan-100"
                        placeholder={`Option text in ${lang}...`}
                        value={option.text?.[lang] || ''}
                        onChange={(e) => handleOptionTextChange(index, lang, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Option action */}
                <div>
                  <label className="block text-xs text-cyan-300 mb-1">Action:</label>
                  <input
                    type="text"
                    className="w-full text-sm bg-cyan-950/50 border border-cyan-800 rounded px-2 py-1 text-cyan-100"
                    placeholder="Action (e.g., goto_node, run_script)"
                    value={option.action || ''}
                    onChange={(e) => handleOptionActionChange(index, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Add new option button */}
        <button
          className="flex items-center space-x-2 text-sm text-cyan-300 hover:text-cyan-200 bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-800 rounded-lg px-3 py-2 w-full"
          onClick={handleAddOption}
        >
          <Plus className="w-4 h-4" />
          <span>Add Option</span>
        </button>
        
        <div className="text-xs text-cyan-400">
          Note: Only OPT and OPT IF blocks are allowed inside menus
        </div>
      </div>
    </BaseBlock>
  );
};
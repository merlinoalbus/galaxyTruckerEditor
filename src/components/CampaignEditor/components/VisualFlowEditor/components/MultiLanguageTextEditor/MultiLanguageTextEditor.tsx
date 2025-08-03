import React from 'react';
import { FlowBlock } from '@/types/CampaignEditor/types/VisualFlowEditor/VisualFlowEditor.types';

interface MultiLanguageTextEditorProps {
  block: FlowBlock;
  fieldName: keyof FlowBlock['data'];
  defaultText?: string;
  placeholder?: string;
  editingField: any;
  editingValue: string;
  selectedLanguage: string;
  showAllLanguages: boolean;
  onStartEditing: (blockId: string, field: string, currentValue: string, language?: string) => void;
  onSaveEdit: () => void;
  onEditingValueChange: (value: string) => void;
}

const LANGUAGES = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];

export const MultiLanguageTextEditor: React.FC<MultiLanguageTextEditorProps> = ({
  block,
  fieldName,
  defaultText = '',
  placeholder,
  editingField,
  editingValue,
  selectedLanguage,
  showAllLanguages,
  onStartEditing,
  onSaveEdit,
  onEditingValueChange
}) => {
  const localizedData = block.data.localizedText as Record<string, string> || {};

  if (showAllLanguages) {
    return (
      <div className="space-y-2">
        {LANGUAGES.map(lang => {
          const isEditingThisLang = editingField?.blockId === block.id && 
                                  editingField?.field === fieldName && 
                                  editingField?.language === lang;
          const textValue = localizedData[lang] || 
                          (lang === 'EN' && block.data[fieldName] as string) || 
                          '';
          
          return (
            <div key={lang} className="flex items-start space-x-2">
              <span className="text-xs font-medium text-gray-400 w-8 mt-2 flex-shrink-0">{lang}:</span>
              {isEditingThisLang ? (
                <textarea
                  value={editingValue}
                  onChange={(e) => onEditingValueChange(e.target.value)}
                  className="text-sm text-gray-300 flex-1 bg-gray-800 border border-blue-500 rounded px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  onBlur={onSaveEdit}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      onSaveEdit();
                    }
                  }}
                  autoFocus
                  placeholder={placeholder}
                />
              ) : (
                <div 
                  className="text-sm text-gray-300 flex-1 cursor-pointer hover:bg-blue-600/20 px-3 py-2 rounded min-h-[32px] border border-transparent hover:border-blue-600/50 transition-colors flex items-center"
                  onClick={() => onStartEditing(block.id, fieldName as string, textValue, lang)}
                >
                  {textValue ? `"${textValue}"` : <span className="text-gray-500 italic">(click to add {lang} translation)</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Single language mode
  const isEditingThis = editingField?.blockId === block.id && 
                       editingField?.field === fieldName && 
                       editingField?.language === selectedLanguage;
  const textValue = localizedData[selectedLanguage] || 
                   (block.data[fieldName] as string) || 
                   '';
  
  return (
    <div className="text-sm text-gray-300">
      {isEditingThis ? (
        <textarea
          value={editingValue}
          onChange={(e) => onEditingValueChange(e.target.value)}
          className="w-full bg-gray-800 border border-blue-500 rounded px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          onBlur={onSaveEdit}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              onSaveEdit();
            }
          }}
          autoFocus
          placeholder={placeholder}
        />
      ) : (
        <div 
          className="cursor-pointer hover:bg-blue-600/20 px-3 py-2 rounded min-h-[32px] border border-transparent hover:border-blue-600/50 transition-colors flex items-center"
          onClick={() => onStartEditing(block.id, fieldName as string, textValue || defaultText, selectedLanguage)}
        >
          {textValue ? `"${textValue}"` : <span className="text-gray-500 italic">{placeholder || `Click to add ${fieldName}...`}</span>}
        </div>
      )}
    </div>
  );
};
import React from 'react';

interface MultiLanguageTextEditorProps {
  block: any;
  fieldName: string;
  defaultText: string;
  placeholder?: string;
  editingField: any;
  editingValue: string;
  selectedLanguage: string;
  showAllLanguages: boolean;
  translations: Map<string, Record<string, string>>;
  languages: string[];
  onStartEditing: (blockId: string, field: string, currentValue: string, language?: string) => void;
  onSaveEdit: () => void;
  onEditingValueChange: (value: string) => void;
}

export const MultiLanguageTextEditor: React.FC<MultiLanguageTextEditorProps> = ({
  block,
  fieldName,
  defaultText,
  placeholder,
  editingField,
  editingValue,
  selectedLanguage,
  showAllLanguages,
  translations,
  languages,
  onStartEditing,
  onSaveEdit,
  onEditingValueChange
}) => {
  const translationKey = `${block.command.line}`;
  const blockTranslations = translations.get(translationKey);

  if (showAllLanguages) {
    return (
      <div className="space-y-2">
        {languages.map(lang => {
          const isEditingThisLang = editingField?.blockId === block.id && 
                                  editingField?.field === fieldName && 
                                  editingField?.language === lang;
          const textValue = (blockTranslations && blockTranslations[lang]) || 
                          (lang === 'EN' && block.command.parameters?.[fieldName]) || 
                          '';
          
          return (
            <div key={lang} className="flex items-start space-x-2">
              <span className="text-xs font-medium text-gray-400 w-8 mt-2">{lang}:</span>
              {isEditingThisLang ? (
                <textarea
                  value={editingValue}
                  onChange={(e) => onEditingValueChange(e.target.value)}
                  className="text-sm text-gray-300 flex-1 bg-gray-800 border border-blue-500 rounded px-3 py-1 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="text-sm text-gray-300 flex-1 cursor-pointer hover:bg-blue-600/20 px-3 py-1 rounded min-h-[28px] border border-transparent hover:border-blue-600/50 transition-colors"
                  onClick={() => onStartEditing(block.id, fieldName, textValue, lang)}
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
  const textValue = (blockTranslations && blockTranslations[selectedLanguage]) || 
                   block.command.parameters?.[fieldName] || 
                   '';
  
  return (
    <div className="text-sm text-gray-300">
      {isEditingThis ? (
        <textarea
          value={editingValue}
          onChange={(e) => onEditingValueChange(e.target.value)}
          className="w-full bg-gray-800 border border-blue-500 rounded px-3 py-1 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="cursor-pointer hover:bg-blue-600/20 px-3 py-1 rounded min-h-[28px] border border-transparent hover:border-blue-600/50 transition-colors flex items-center"
          onClick={() => onStartEditing(block.id, fieldName, textValue || defaultText, selectedLanguage)}
        >
          {textValue ? `"${textValue}"` : <span className="text-gray-500 italic">{placeholder || `Click to add ${fieldName}...`}</span>}
        </div>
      )}
    </div>
  );
};
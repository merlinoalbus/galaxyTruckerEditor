import React from 'react';
import { LANGUAGES } from './types';

interface MultiLanguageTextEditorProps {
  blockId: string;
  field: string;
  currentText: string;
  translations: Record<string, string>;
  selectedLanguage: string;
  showAllLanguages: boolean;
  editingField: { blockId: string; field: string } | null;
  editingValue: string;
  onStartEditing: (blockId: string, field: string, currentValue: string) => void;
  onSaveEdit: () => void;
  onEditingValueChange: (value: string) => void;
}

export const MultiLanguageTextEditor: React.FC<MultiLanguageTextEditorProps> = ({
  blockId,
  field,
  currentText,
  translations,
  selectedLanguage,
  showAllLanguages,
  editingField,
  editingValue,
  onStartEditing,
  onSaveEdit,
  onEditingValueChange
}) => {
  const isEditing = editingField?.blockId === blockId && editingField?.field === field;

  if (showAllLanguages) {
    return (
      <div className="space-y-2">
        {LANGUAGES.map(lang => (
          <div key={lang} className="flex items-center space-x-2">
            <span className="text-xs text-gray-400 w-6">{lang}:</span>
            {isEditing && selectedLanguage === lang ? (
              <input
                type="text"
                value={editingValue}
                onChange={(e) => onEditingValueChange(e.target.value)}
                className="flex-1 bg-gt-secondary text-white px-2 py-1 rounded text-sm"
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
                className="flex-1 cursor-pointer hover:bg-blue-600/20 px-2 py-1 rounded text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEditing(blockId, field, translations[lang] || currentText);
                }}
              >
                "{translations[lang] || currentText}"
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs text-gray-400">{selectedLanguage}:</span>
      {isEditing ? (
        <input
          type="text"
          value={editingValue}
          onChange={(e) => onEditingValueChange(e.target.value)}
          className="bg-gt-secondary text-white px-2 py-1 rounded text-sm flex-1"
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
          className="cursor-pointer hover:bg-blue-600/20 px-2 py-1 rounded text-sm flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onStartEditing(blockId, field, translations[selectedLanguage] || currentText);
          }}
        >
          "{translations[selectedLanguage] || currentText}"
        </span>
      )}
    </div>
  );
};
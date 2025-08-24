// CategoryList.tsx - Lista delle categorie di traduzione
import React from 'react';
import { Folder, FileText, RefreshCw } from 'lucide-react';

import type { LocalizationCategory } from '@/hooks/CampaignEditor/useLocalizationStrings';

interface CategoryListProps {
  categories: LocalizationCategory[];
  selectedCategory: LocalizationCategory | null;
  onCategorySelect: (categoryId: string) => void;
  isLoading: boolean;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  isLoading
}) => {
  // Raggruppa le categorie per tipo (sottocartelle vs file normali)
  const groupedCategories = categories.reduce((acc, category) => {
    if (category.nome.includes('/')) {
      const [folder] = category.nome.split('/');
      if (!acc.folders[folder]) {
        acc.folders[folder] = [];
      }
      acc.folders[folder].push(category);
    } else {
      acc.root.push(category);
    }
    return acc;
  }, { root: [] as LocalizationCategory[], folders: {} as Record<string, LocalizationCategory[]> });

  const renderCategory = (category: LocalizationCategory, isNested = false) => (
    <button
      key={category.id}
      onClick={() => onCategorySelect(category.id)}
      disabled={isLoading}
      className={`
        w-full text-left px-3 py-2 rounded-lg transition-colors
        ${selectedCategory?.id === category.id 
          ? 'bg-blue-600 text-white' 
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }
        ${isNested ? 'ml-4' : ''}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className="flex items-center space-x-2">
        <FileText className="w-4 h-4 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {isNested ? category.nome.split('/')[1] : category.nome}
          </div>
          <div className="text-xs opacity-75">
            {category.numKeys} stringhe
          </div>
        </div>
        {isLoading && selectedCategory?.id === category.id && (
          <RefreshCw className="w-4 h-4 animate-spin" />
        )}
      </div>
    </button>
  );

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Categorie</h2>
        <p className="text-sm text-gray-400">{categories.length} categorie trovate</p>
      </div>

      {/* Lista categorie */}
      <div className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Categorie nella root */}
        {groupedCategories.root.map(category => renderCategory(category))}

        {/* Categorie nelle sottocartelle */}
        {Object.entries(groupedCategories.folders).map(([folder, folderCategories]) => (
          <div key={folder} className="mt-4">
            <div className="flex items-center space-x-2 px-3 py-1 text-gray-400">
              <Folder className="w-4 h-4" />
              <span className="text-sm font-medium uppercase tracking-wide">
                {folder}
              </span>
            </div>
            <div className="space-y-1">
              {folderCategories.map(category => renderCategory(category, true))}
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nessuna categoria trovata</p>
          </div>
        )}
      </div>

      {/* Footer con statistiche */}
      <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
        <div className="flex justify-between">
          <span>Totale categorie:</span>
          <span className="font-medium text-white">{categories.length}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Stringhe totali:</span>
          <span className="font-medium text-white">
            {categories.reduce((sum, cat) => sum + cat.numKeys, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};
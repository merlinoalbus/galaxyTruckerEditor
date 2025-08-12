import React from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from '@/locales';
import { scriptSelectorStyles } from '@/styles/CampaignEditor/InteractiveMap/styles/ScriptSelector/ScriptSelector.styles';

interface SearchInputProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ searchTerm, onSearchChange }) => {
  const { t } = useTranslation();

  return (
    <div className={scriptSelectorStyles.searchContainerEnhanced}>
      <div className="relative">
        <input
          type="text"
          placeholder={t('scriptSelector.searchScripts')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={scriptSelectorStyles.searchInputEnhanced}
        />
        <Search 
          size={16} 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
      </div>
    </div>
  );
};
import React from 'react';
import { X, Search } from 'lucide-react';
import { ScriptSelectorProps } from '../../../../../types/CampaignEditor/InteractiveMap/types/ScriptSelector/ScriptSelector.types';
import { useScriptSelector } from '../../../../../hooks/CampaignEditor/InteractiveMap/hooks/ScriptSelector/useScriptSelector';
import { scriptSelectorStyles } from '../../../../../styles/CampaignEditor/InteractiveMap/styles/ScriptSelector/ScriptSelector.styles';

export const ScriptSelector: React.FC<ScriptSelectorProps> = ({
  isOpen,
  scripts,
  title,
  onScriptSelect,
  onClose
}) => {
  const {
    searchTerm,
    filteredScripts,
    setSearchTerm,
    getScriptPreview
  } = useScriptSelector(scripts);

  if (!isOpen) return null;

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={scriptSelectorStyles.overlay} onClick={handleOverlayClick}>
      <div className={scriptSelectorStyles.modal}>
        <div className={scriptSelectorStyles.header}>
          <h3 className={scriptSelectorStyles.title}>{title}</h3>
          <button className={scriptSelectorStyles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={scriptSelectorStyles.searchContainer}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search scripts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={scriptSelectorStyles.searchInput}
            />
            <Search 
              size={16} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        <div className={scriptSelectorStyles.scriptList}>
          {filteredScripts.length === 0 ? (
            <div className={scriptSelectorStyles.emptyState}>
              {searchTerm ? 'No scripts found matching your search.' : 'No scripts available.'}
            </div>
          ) : (
            filteredScripts.map((script, index) => (
              <div
                key={`${script.fileName}-${script.name}-${index}`}
                onClick={() => onScriptSelect(script)}
                className={scriptSelectorStyles.scriptItem}
              >
                <div className={scriptSelectorStyles.scriptName}>{script.name}</div>
                <div className={scriptSelectorStyles.scriptFile}>{script.fileName}</div>
                <div className={scriptSelectorStyles.scriptPreview}>{getScriptPreview(script)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
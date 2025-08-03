import React from 'react';
import { X, Search } from 'lucide-react';
import { ScriptSelectorProps } from '@/types/CampaignEditor/InteractiveMap/types/ScriptSelector/ScriptSelector.types';
import { useScriptSelector } from '@/hooks/CampaignEditor/InteractiveMap/hooks/ScriptSelector/useScriptSelector';
import { scriptSelectorStyles } from '@/styles/CampaignEditor/InteractiveMap/styles/ScriptSelector/ScriptSelector.styles';

export const ScriptSelector: React.FC<ScriptSelectorProps> = ({
  isOpen,
  scripts,
  title,
  startScripts = [],
  onScriptSelect,
  onClose
}) => {
  const {
    searchTerm,
    filteredScripts,
    setSearchTerm,
    getScriptPreview,
    isStartScript
  } = useScriptSelector(scripts, startScripts);

  // Debug logging
  console.log('ScriptSelector - startScripts:', startScripts);
  console.log('ScriptSelector - script names:', scripts.map(s => s.name));
  
  // Test start script detection
  startScripts?.forEach(startScript => {
    const foundByName = scripts.find(script => script.name === startScript);
    const foundByContent = scripts.find(script => isStartScript(script));
    console.log(`Looking for "${startScript}"`);
    console.log(`  - By name: ${foundByName?.name || 'NOT FOUND'}`);
    console.log(`  - By content check: ${foundByContent?.name || 'NOT FOUND'}`);
  });
  
  const detectedStartScripts = scripts.filter(script => isStartScript(script));
  console.log('Detected start scripts:', detectedStartScripts.map(s => s.name));

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
            (() => {
              const startScripts = filteredScripts.filter(script => isStartScript(script));
              const regularScripts = filteredScripts.filter(script => !isStartScript(script));
              
              return (
                <>
                  {/* Start Scripts Section */}
                  {startScripts.length > 0 && (
                    <>
                      <div className={scriptSelectorStyles.separatorLabel}>
                        ⭐ Mission Start Scripts
                      </div>
                      {startScripts.map((script, index) => (
                        <div
                          key={`start-${script.fileName}-${script.name}-${index}`}
                          onClick={() => onScriptSelect(script)}
                          className={scriptSelectorStyles.startScriptItem}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400 text-sm">⭐</span>
                            <span className={scriptSelectorStyles.scriptName}>{script.name}</span>
                          </div>
                          <span className={scriptSelectorStyles.scriptFile}>({script.fileName})</span>
                        </div>
                      ))}
                      
                      {/* Separator */}
                      {regularScripts.length > 0 && (
                        <>
                          <div className={scriptSelectorStyles.separator}></div>
                          <div className={scriptSelectorStyles.separatorLabel}>
                            Other Scripts
                          </div>
                        </>
                      )}
                    </>
                  )}
                  
                  {/* Regular Scripts */}
                  {regularScripts.map((script, index) => (
                    <div
                      key={`regular-${script.fileName}-${script.name}-${index}`}
                      onClick={() => onScriptSelect(script)}
                      className={scriptSelectorStyles.scriptItem}
                    >
                      <div className="flex items-center gap-2">
                        <span className={scriptSelectorStyles.scriptName}>{script.name}</span>
                      </div>
                      <span className={scriptSelectorStyles.scriptFile}>({script.fileName})</span>
                    </div>
                  ))}
                </>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
};
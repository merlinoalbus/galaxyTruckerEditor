import React, { useCallback } from 'react';
import { Database, Search, SortAsc, Hash, ToggleLeft, Tag, Users, Image, Trophy } from 'lucide-react';
import { useVariablesSystemData } from '@/hooks/CampaignEditor/VariablesSystem/useVariablesSystemData';
import { ElementType } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { CompactListView } from './components/CompactListView/CompactListView';
import { DetailView } from './components/DetailView/DetailView';
import { CharactersView } from './components/CharactersView/CharactersView';
import { useTranslation } from '@/locales/translations';

interface VariablesSystemProps {
  analysis?: any;
}

export const VariablesSystem: React.FC<VariablesSystemProps> = ({ analysis }) => {
  const { t } = useTranslation();
  
  const {
    activeTab,
    searchTerm,
    sortBy,
    selectedItem,
    loading,
    error,
    currentItems,
    tabCounts,
    setActiveTab,
    setSearchTerm,
    setSortBy,
    setSelectedItem,
    refreshData
  } = useVariablesSystemData();

  // State for character view
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  // Listen for tab change events from ElementCounters
  React.useEffect(() => {
    const handleSetTab = (event: CustomEvent) => {
      const elementType = event.detail;
      if (elementType) {
        setActiveTab(elementType as ElementType);
      }
    };

    window.addEventListener('setVariablesTab', handleSetTab as EventListener);
    return () => {
      window.removeEventListener('setVariablesTab', handleSetTab as EventListener);
    };
  }, [setActiveTab]);

  // Handle navigation to Visual Flow Editor
  const handleNavigateToScript = useCallback((scriptName: string, elementName: string) => {
    // Dispatch event to navigate to Visual Flow Editor with specific script and element
    const event = new CustomEvent('navigateToVisualFlow', {
      detail: {
        scriptName,
        elementName,
        elementType: activeTab
      }
    });
    window.dispatchEvent(event);
  }, [activeTab]);

  const tabs: { id: ElementType; label: string; icon: React.FC<any>; color: string }[] = [
    { id: 'variables', label: t('elements.variables'), icon: Hash, color: 'text-cyan-400' },
    { id: 'semafori', label: t('elements.semaphores'), icon: ToggleLeft, color: 'text-yellow-400' },
    { id: 'labels', label: t('elements.labels'), icon: Tag, color: 'text-green-400' },
    { id: 'characters', label: t('elements.characters'), icon: Users, color: 'text-purple-400' },
    { id: 'images', label: t('elements.images'), icon: Image, color: 'text-pink-400' },
    { id: 'achievements', label: t('elements.achievements'), icon: Trophy, color: 'text-orange-400' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">{t('variablesSystem.loadingData')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">{t('variablesSystem.errorLoading')}</h3>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={refreshData}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {t('variablesSystem.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-white mb-2 galaxy-title">{t('variablesSystem.title')}</h2>
        <p className="text-gray-400">
          {t('variablesSystem.description')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-2 border-b border-gray-700">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const count = tabCounts[tab.id];
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 transition-all
                ${isActive 
                  ? 'border-b-2 border-blue-500 text-white bg-gray-800/50' 
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? tab.color : ''}`} />
              <span>{tab.label}</span>
              <span className={`
                text-xs px-2 py-1 rounded-full
                ${isActive ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400'}
              `}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-2">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={`${t('variablesSystem.searchPlaceholder')} ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <SortAsc className="w-5 h-5 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="name">{t('variablesSystem.sortBy')} {t('variablesSystem.name')}</option>
            <option value="usage">{t('variablesSystem.sortBy')} {t('variablesSystem.usage')}</option>
          </select>
        </div>
      </div>

      {/* Content - Layout condizionale per characters */}
      {activeTab === 'characters' ? (
        <CharactersView
          characters={currentItems}
          onNavigateToScript={handleNavigateToScript}
        />
      ) : (
        /* Two Panel Layout per altri elementi */
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Left Panel - Compact List */}
          <div className="w-1/3 min-w-[300px] bg-gray-900/30 rounded-lg border border-gray-800 overflow-hidden flex flex-col">
            <CompactListView
              type={activeTab}
              items={currentItems}
              selectedItem={selectedItem}
              onSelectItem={setSelectedItem}
            />
          </div>
          
          {/* Right Panel - Details */}
          <div className="flex-1 min-w-[400px]">
            <DetailView
              type={activeTab}
              item={selectedItem}
              onNavigateToScript={handleNavigateToScript}
            />
          </div>
        </div>
      )}
    </div>
  );
};
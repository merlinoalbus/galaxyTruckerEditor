import React from 'react';

import { Save } from 'lucide-react';

import { useCampaignEditor } from '@/hooks/CampaignEditor';

import { InteractiveMap } from './InteractiveMap/InteractiveMap';
import { VariablesSystem } from './VariablesSystem/VariablesSystem';
import { Overview } from './Overview/Overview';
import { ElementCounters } from './components/Header/components/ElementCounters/ElementCounters';
import { useTranslation } from '@/locales/translations';

export const CampaignEditor: React.FC = () => {
  const { t } = useTranslation();
  
  const {
    activeTab,
    setActiveTab,
    analysis,
    selectedNode,
    selectedScript,
    isLoading,
    error,
    handleScriptChange,
    handleSaveAll,
    handleScriptSelect
  } = useCampaignEditor();

  const tabs = [
    { id: 'map', label: t('tabs.interactiveMap') },
    { id: 'variables', label: t('tabs.variablesSystem') },
    { id: 'overview', label: t('tabs.overview') }
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-red-500">{t('common.error')}: {error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-white">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white galaxy-title">Complete Campaign Editor</h1>
          <p className="text-gray-400">Interactive map-based script editing with complete flow visualization</p>
        </div>
        <button
          onClick={handleSaveAll}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>{t('header.saveAll')}</span>
        </button>
      </div>

      {/* Stats */}
      <ElementCounters 
        scriptsCount={analysis?.scripts?.length} 
        onElementClick={(elementType) => {
          setActiveTab('variables');
          // We'll need to pass this to VariablesSystem
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('setVariablesTab', { detail: elementType }));
          }, 100);
        }}
      />

      {/* Tabs */}
      <div className="border-b border-gray-700 flex-shrink-0">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-gt-accent text-gt-accent'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-gt-primary rounded-lg flex-1 min-h-0">
        {activeTab === 'map' && (
          <InteractiveMap 
            onScriptSelect={handleScriptSelect}
          />
        )}


        {activeTab === 'variables' && (
          <VariablesSystem analysis={analysis} />
        )}

        {activeTab === 'overview' && (
          <Overview analysis={analysis} />
        )}
      </div>
    </div>
  );
};
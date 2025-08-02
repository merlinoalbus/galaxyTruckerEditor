import React from 'react';
import { Save } from 'lucide-react';
import { InteractiveMap } from './InteractiveMap/InteractiveMap';
import { VisualFlowEditor } from './components/VisualFlowEditor';
import { VariablesSystem } from './VariablesSystem';
import { Overview } from './Overview';
import { useCampaignEditor } from '../../hooks/CampaignEditor';

export const CampaignEditor: React.FC = () => {
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
    { id: 'map', label: 'Interactive Map' },
    { id: 'flow', label: 'Visual Flow Editor' },
    { id: 'variables', label: 'Variables & System' },
    { id: 'overview', label: 'Overview' }
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-red-500">Error loading campaign data: {error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-white">Loading campaign data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Complete Campaign Editor</h1>
          <p className="text-gray-400">Interactive map-based script editing with complete flow visualization</p>
        </div>
        <button
          onClick={handleSaveAll}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save All</span>
        </button>
      </div>

      {/* Stats */}
      {analysis && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gt-secondary rounded-lg p-4">
            <p className="text-gt-accent font-bold text-lg">{analysis.scripts?.length || 0} scripts loaded</p>
          </div>
          <div className="bg-gt-secondary rounded-lg p-4">
            <p className="text-gt-accent font-bold text-lg">{analysis.variables?.size || 0} variables</p>
          </div>
          <div className="bg-gt-secondary rounded-lg p-4">
            <p className="text-gt-accent font-bold text-lg">{analysis.characters?.size || 0} characters</p>
          </div>
          <div className="bg-gt-secondary rounded-lg p-4">
            <p className="text-gt-accent font-bold text-lg">{analysis.missions?.size || 0} missions</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-700">
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
      <div className="bg-gt-primary rounded-lg min-h-96">
        {activeTab === 'map' && (
          <InteractiveMap 
            onScriptSelect={handleScriptSelect}
          />
        )}

        {activeTab === 'flow' && (
          <VisualFlowEditor
            selectedScript={selectedScript}
            selectedNode={selectedNode}
            onScriptChange={handleScriptChange}
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
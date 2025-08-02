import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { InteractiveMap } from './CampaignEditor/InteractiveMap';
import { VisualFlowEditor } from './CampaignEditor/VisualFlowEditor';
import { VariablesSystem } from './CampaignEditor/VariablesSystem';
import { Overview } from './CampaignEditor/Overview';
import { CampaignScriptParser } from '../../services/CampaignScriptParser';

interface MapNode {
  name: string;
  coordinates: [number, number];
  image: string;
  script?: string;
}

interface Connection {
  from: string;
  to: string;
  image: string;
}

export const CampaignEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [analysis, setAnalysis] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [selectedScript, setSelectedScript] = useState<string>('');

  // Load campaign data on mount
  useEffect(() => {
    const loadCampaignData = async () => {
      try {
        const parser = new CampaignScriptParser();
        const analysisResult = await parser.loadAndAnalyzeAllScripts();
        setAnalysis(analysisResult);
      } catch (error) {
        console.error('Error loading campaign data:', error);
      }
    };

    loadCampaignData();
  }, []);

  const handleNodeClick = (node: MapNode) => {
    setSelectedNode(node);
    setSelectedScript(node.script || '');
  };

  const handleConnectionClick = (connection: Connection) => {
    console.log('Connection clicked:', connection);
  };

  const handleScriptChange = (newScript: string) => {
    setSelectedScript(newScript);
    // TODO: Save script changes
  };

  const handleSaveAll = () => {
    console.log('Saving all changes...');
    // TODO: Implement save all functionality
  };

  const tabs = [
    { id: 'map', label: 'Interactive Map' },
    { id: 'flow', label: 'Visual Flow Editor' },
    { id: 'variables', label: 'Variables & System' },
    { id: 'overview', label: 'Overview' }
  ];

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
            <p className="text-gt-accent font-bold text-lg">{analysis.variables?.length || 0} variables</p>
          </div>
          <div className="bg-gt-secondary rounded-lg p-4">
            <p className="text-gt-accent font-bold text-lg">{analysis.characters?.length || 0} characters</p>
          </div>
          <div className="bg-gt-secondary rounded-lg p-4">
            <p className="text-gt-accent font-bold text-lg">{analysis.missions?.length || 0} missions</p>
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
            onNodeClick={handleNodeClick}
            onConnectionClick={handleConnectionClick}
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
import React, { useState, useEffect } from 'react';
import { Save, FileText, Map, Users, Zap, Settings } from 'lucide-react';
import { InteractiveCampaignMap } from './InteractiveCampaignMap';
import { StructuredCampaignFlowEditor } from './StructuredCampaignFlowEditor';
import { CampaignScriptParser } from '../../services/CampaignScriptParser';

interface MapNode {
  name: string;
  coordinates: [number, number];
  image: string;
  caption: string;
  description: string;
  shuttles?: Array<[string, number]>;
  buttons?: Array<[string, string, string]>;
}

interface MapConnection {
  from: string;
  to: string;
  cost: number;
}

interface Script {
  name: string;
  commands: any[];
  relatedNodes: string[];
  relatedConnections: string[];
}

export function CampaignEditor() {
  const [parser] = useState(() => CampaignScriptParser.getInstance());
  const [analysis, setAnalysis] = useState<any>(null);
  const [selectedScript, setSelectedScript] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'map' | 'flow' | 'variables' | 'overview'>('map');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptSelectionMode, setScriptSelectionMode] = useState<{ show: boolean; scripts: Script[]; node?: string; connection?: string }>({ show: false, scripts: [] });

  useEffect(() => {
    initializeCampaignEditor();
  }, []);

  const initializeCampaignEditor = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load and analyze all campaign scripts
      const campaignAnalysis = await parser.loadAndAnalyzeAllScripts();
      setAnalysis(campaignAnalysis);

      // Start with the first available script or campaignIntro
      const introScript = campaignAnalysis.scripts.find(s => s.name.toLowerCase().includes('intro'));
      if (introScript) {
        setSelectedScript(introScript.name);
      } else if (campaignAnalysis.scripts.length > 0) {
        setSelectedScript(campaignAnalysis.scripts[0].name);
      }

    } catch (error) {
      console.error('Error initializing campaign editor:', error);
      setError('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (node: MapNode, scripts: Script[]) => {
    console.log('Node clicked:', node.name, 'Scripts found:', scripts.length);
    
    if (scripts.length === 0) {
      alert(`No scripts found for node: ${node.caption}`);
      return;
    }

    if (scripts.length === 1) {
      // Single script - open directly
      setSelectedScript(scripts[0].name);
      setSelectedNode(node.name);
      setActiveTab('flow');
    } else {
      // Multiple scripts - show selection dialog
      setScriptSelectionMode({
        show: true,
        scripts,
        node: node.name
      });
    }
  };

  const handleConnectionClick = (connection: MapConnection, scripts: Script[]) => {
    console.log('Connection clicked:', `${connection.from} → ${connection.to}`, 'Scripts found:', scripts.length);
    
    if (scripts.length === 0) {
      alert(`No scripts found for connection: ${connection.from} → ${connection.to}`);
      return;
    }

    if (scripts.length === 1) {
      // Single script - open directly
      setSelectedScript(scripts[0].name);
      setActiveTab('flow');
    } else {
      // Multiple scripts - show selection dialog
      setScriptSelectionMode({
        show: true,
        scripts,
        connection: `${connection.from}-${connection.to}`
      });
    }
  };

  const handleScriptSelection = (scriptName: string) => {
    setSelectedScript(scriptName);
    setScriptSelectionMode({ show: false, scripts: [] });
    setActiveTab('flow');
  };

  const handleScriptChange = (scriptName: string, content: any) => {
    console.log('Script changed:', scriptName, content);
    // TODO: Implement script saving logic
  };

  const handleSaveAll = async () => {
    try {
      // TODO: Implement comprehensive save logic
      alert('Save functionality will be implemented');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gt-accent mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Loading Complete Campaign System...</h2>
          <p className="text-gray-400">Analyzing all scripts, nodes, and connections</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">
          <Zap className="w-16 h-16 mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Campaign</h2>
        <p className="text-gray-400 mb-4">{error}</p>
        <button 
          onClick={initializeCampaignEditor}
          className="btn-primary"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Complete Campaign Editor</h1>
          <p className="text-gray-400">Interactive map-based script editing with complete flow visualization</p>
          {analysis && (
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>{analysis.scripts.length} scripts loaded</span>
              <span>{analysis.variables.size} variables</span>
              <span>{analysis.characters.size} characters</span>
              <span>{analysis.missions.size} missions</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleSaveAll}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save All</span>
          </button>
          <button 
            onClick={initializeCampaignEditor}
            className="px-3 py-2 bg-gt-secondary text-white rounded hover:bg-slate-600 transition-colors"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-slate-700">
        {[
          { id: 'map', label: 'Interactive Map', icon: Map },
          { id: 'flow', label: 'Visual Flow Editor', icon: FileText },
          { id: 'variables', label: 'Variables & System', icon: Settings },
          { id: 'overview', label: 'Campaign Overview', icon: Users }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-gt-accent text-gt-accent'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-gt-primary rounded-lg min-h-96">
        {activeTab === 'map' && (
          <InteractiveCampaignMap 
            onNodeClick={handleNodeClick}
            onConnectionClick={handleConnectionClick}
          />
        )}

        {activeTab === 'flow' && (
          <StructuredCampaignFlowEditor
            selectedScript={selectedScript}
            selectedNode={selectedNode}
            onScriptChange={handleScriptChange}
          />
        )}

        {activeTab === 'variables' && analysis && (
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Campaign Variables & System</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gt-secondary rounded-lg p-4">
                <h4 className="font-bold text-white mb-3">Boolean Variables</h4>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {Array.from(analysis.variables as Set<string>).map((variable) => (
                    <div key={variable} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{variable}</span>
                      <span className="text-orange-400">bool</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gt-secondary rounded-lg p-4">
                <h4 className="font-bold text-white mb-3">Characters</h4>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {Array.from(analysis.characters as Set<string>).map((character) => (
                    <div key={character} className="flex items-center space-x-2 text-sm">
                      <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                        <Users className="w-3 h-3 text-gray-400" />
                      </div>
                      <span className="text-gray-300">{character}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gt-secondary rounded-lg p-4">
                <h4 className="font-bold text-white mb-3">Missions</h4>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {Array.from(analysis.missions as Set<string>).map((mission) => (
                    <div key={mission} className="flex items-center space-x-2 text-sm">
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                        <Zap className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-300">{mission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && analysis && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-gt-secondary rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-2">Total Scripts</h3>
                <p className="text-3xl font-bold text-gt-accent">{analysis.scripts.length}</p>
                <p className="text-gray-400 text-sm">Across all files</p>
              </div>
              <div className="bg-gt-secondary rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-2">Map Nodes</h3>
                <p className="text-3xl font-bold text-gt-accent">{analysis.nodeScriptMap.size}</p>
                <p className="text-gray-400 text-sm">Interactive locations</p>
              </div>
              <div className="bg-gt-secondary rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-2">Variables</h3>
                <p className="text-3xl font-bold text-gt-accent">{analysis.variables.size}</p>
                <p className="text-gray-400 text-sm">Boolean flags</p>
              </div>
              <div className="bg-gt-secondary rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-2">Characters</h3>
                <p className="text-3xl font-bold text-gt-accent">{analysis.characters.size}</p>
                <p className="text-gray-400 text-sm">Dialogue characters</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gt-secondary rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-4">Script Interconnections</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Array.from((analysis.scriptConnections as Map<string, string[]>).entries()).map(([scriptName, connections]) => (
                    <div key={scriptName} className="p-2 bg-slate-700 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium">{scriptName}</span>
                        <span className="text-gt-accent text-xs">{connections.length} connections</span>
                      </div>
                      {connections.length > 0 && (
                        <div className="mt-1 text-xs text-gray-400">
                          → {connections.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gt-secondary rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-4">Node-Script Mapping</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Array.from((analysis.nodeScriptMap as Map<string, string[]>).entries()).map(([nodeName, scriptNames]) => (
                    <div key={nodeName} className="p-2 bg-slate-700 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium">{nodeName}</span>
                        <span className="text-gt-accent text-xs">{scriptNames.length} scripts</span>
                      </div>
                      {scriptNames.length > 0 && (
                        <div className="mt-1 text-xs text-gray-400">
                          {scriptNames.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Script Selection Modal */}
      {scriptSelectionMode.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gt-primary rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-4">
              Select Script to Edit
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {scriptSelectionMode.node && `Node: ${scriptSelectionMode.node}`}
              {scriptSelectionMode.connection && `Connection: ${scriptSelectionMode.connection.replace('-', ' → ')}`}
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {scriptSelectionMode.scripts.map(script => (
                <button
                  key={script.name}
                  onClick={() => handleScriptSelection(script.name)}
                  className="w-full p-3 text-left bg-gt-secondary hover:bg-slate-600 rounded transition-colors"
                >
                  <div className="font-medium text-white">{script.name}</div>
                  <div className="text-sm text-gray-400">{script.commands.length} commands</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setScriptSelectionMode({ show: false, scripts: [] })}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
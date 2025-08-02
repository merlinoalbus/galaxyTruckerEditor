import { useState, useEffect } from 'react';
import { CampaignScriptParser } from '../../services/CampaignEditor/CampaignScriptParser';
import { CampaignAnalysis, MapNode } from '../../types/CampaignEditor';

export const useCampaignEditor = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [analysis, setAnalysis] = useState<CampaignAnalysis | null>(null);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [selectedScript, setSelectedScript] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCampaignData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const parser = new CampaignScriptParser();
        const analysisResult = await parser.loadAndAnalyzeAllScripts();
        setAnalysis(analysisResult);
      } catch (error) {
        console.error('Error loading campaign data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaignData();
  }, []);

  const handleNodeClick = (node: MapNode) => {
    setSelectedNode(node);
    setSelectedScript(node.script || '');
  };

  const handleScriptChange = (newScript: string) => {
    setSelectedScript(newScript);
    // TODO: Save script changes
  };

  const handleSaveAll = () => {
    console.log('Saving all changes...');
    // TODO: Implement save all functionality
  };

  return {
    activeTab,
    setActiveTab,
    analysis,
    selectedNode,
    selectedScript,
    isLoading,
    error,
    handleNodeClick,
    handleScriptChange,
    handleSaveAll
  };
};
import { useState, useEffect } from 'react';
import { campaignScriptParserService } from '@/services/CampaignEditor/CampaignScriptParserService';
import { CampaignAnalysis, CampaignScript } from '../../types/CampaignEditor';
import { MapNode } from '../../types/CampaignEditor/InteractiveMap/InteractiveMap.types';

export const useCampaignEditor = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [analysis, setAnalysis] = useState<CampaignAnalysis | null>(null);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [selectedScript, setSelectedScript] = useState<CampaignScript | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCampaignData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const analysisResult = await campaignScriptParserService.loadAndAnalyzeAllScripts();
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
    // For now, clear selected script when clicking a node
    // Script selection will be handled by InteractiveMap component
    setSelectedScript(null);
  };

  const handleScriptChange = (newScript: CampaignScript) => {
    setSelectedScript(newScript);
    // TODO: Save script changes
  };

  const handleScriptSelect = (script: CampaignScript) => {
    setSelectedScript(script);
    setActiveTab('flow');
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
    handleScriptSelect,
    handleSaveAll
  };
};
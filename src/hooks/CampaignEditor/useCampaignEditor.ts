import { useState, useEffect, useRef } from 'react';
import { campaignScriptParserService } from '@/services/CampaignEditor/CampaignScriptParserService';
import { CampaignAnalysis, CampaignScript } from '@/types/CampaignEditor';
import { MapNode } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { API_CONSTANTS } from '@/constants/VisualFlowEditor.constants';

export const useCampaignEditor = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [analysis, setAnalysis] = useState<CampaignAnalysis | null>(null);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [selectedScript, setSelectedScript] = useState<CampaignScript | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialized = useRef(false);
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

    if (!initialized.current) {
      initialized.current = true;
      loadCampaignData();
    }
  }, []);

  const handleNodeClick = (node: MapNode) => {
    setSelectedNode(node);
    // For now, clear selected script when clicking a node
    // Script selection will be handled by InteractiveMap component
    setSelectedScript(null);
  };

  const handleScriptChange = async (newScript: CampaignScript) => {
    setSelectedScript(newScript);
    
    // Auto-save script changes
    try {
      const response = await fetch(`http://localhost:${API_CONSTANTS.DEFAULT_PORT}/api/scripts/saveScript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          name: newScript.nomescript,
          filename: newScript.nomefile,
          language: 'IT' // Default language
        }])
      });
      
      const result = await response.json();
      if (!result.success) {
        console.error('Failed to save script:', result.error);
      }
    } catch (error) {
      console.error('Error saving script:', error);
    }
  };

  const handleScriptSelect = (script: CampaignScript) => {
    setSelectedScript(script);
    setActiveTab('flow');
  };

  const handleSaveAll = async () => {
    // Saving all changes
    try {
      // Get all modified scripts (this would need to be tracked in state)
      // For now, we'll save the currently selected script if it exists
      if (selectedScript) {
        const response = await fetch(`http://localhost:${API_CONSTANTS.DEFAULT_PORT}/api/scripts/saveScript`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{
            name: selectedScript.nomescript,
            filename: selectedScript.nomefile,
            language: 'IT' // Default language
          }])
        });
        
        const result = await response.json();
        if (result.success) {
          // All changes saved successfully
        } else {
          console.error('Failed to save all changes:', result.error);
        }
      }
    } catch (error) {
      console.error('Error saving all changes:', error);
    }
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
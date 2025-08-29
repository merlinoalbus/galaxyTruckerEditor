import React, { useEffect } from 'react';

import { Save } from 'lucide-react';

import { useCampaignEditor } from '@/hooks/CampaignEditor';
import { useFullscreen } from '@/contexts/FullscreenContext';

import { InteractiveMap } from './InteractiveMap/InteractiveMap';
import { VisualFlowEditor } from './VisualFlowEditor/VisualFlowEditor';
import { ImagesProvider } from '@/contexts/ImagesContext';
import { VariablesSystem } from './VariablesSystem/VariablesSystem';
import { Overview } from './Overview/Overview';
import { ElementCounters } from './components/Header/components/ElementCounters/ElementCounters';
import { useTranslation } from '@/locales';

export const CampaignEditor: React.FC = () => {
  const { t } = useTranslation();
  const { isMapFullscreen, isFlowFullscreen, exitAllFullscreen } = useFullscreen();
  const isAnyFullscreen = isMapFullscreen || isFlowFullscreen;
  
  const {
    activeTab,
    setActiveTab,
    analysis,
    selectedScript,
    isLoading,
    error,
    handleSaveAll,
    handleScriptSelect
  } = useCampaignEditor();

  // Ascolta il cambio di backend per ricaricare i dati
  useEffect(() => {
    const handleBackendChanged = (event: CustomEvent) => {
      console.log('🔄 Backend changed detected in CampaignEditor, data will be refreshed by GameDataContext');
    };
    
    window.addEventListener('backendChanged', handleBackendChanged as EventListener);
    
    return () => {
      window.removeEventListener('backendChanged', handleBackendChanged as EventListener);
    };
  }, []);

  // Exit fullscreen when changing tabs
  useEffect(() => {
    if ((activeTab !== 'map' && isMapFullscreen) || (activeTab !== 'flow' && isFlowFullscreen)) {
      exitAllFullscreen();
    }
  }, [activeTab, isMapFullscreen, isFlowFullscreen, exitAllFullscreen]);

  // Handle navigation from Variables & System to Visual Flow Editor
  useEffect(() => {
    const handleNavigateToVisualFlow = (event: CustomEvent) => {
      const { scriptName, elementName, elementType } = event.detail;
      
      // Switch to Visual Flow Editor tab
      setActiveTab('flow');
      
      // After switching tab, dispatch event to Visual Flow Editor to navigate to specific script
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('loadScriptWithElement', {
          detail: {
            scriptName,
            elementName,
            elementType
          }
        }));
      }, 100);
    };

    window.addEventListener('navigateToVisualFlow', handleNavigateToVisualFlow as EventListener);
    return () => {
      window.removeEventListener('navigateToVisualFlow', handleNavigateToVisualFlow as EventListener);
    };
  }, [setActiveTab]);

  // Handle navigation from Interactive Map to Visual Flow Editor for missions
  useEffect(() => {
    const handleNavigateToVisualFlowMission = (event: CustomEvent) => {
      const { missionName } = event.detail || {};
      if (!missionName) return;

      // Switch to Visual Flow Editor tab
      setActiveTab('flow');

      // After switching tab, ask Visual Flow Editor to load the mission
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('VFE:loadMissionByName', { detail: { missionName } }));
      }, 100);
    };

    window.addEventListener('navigateToVisualFlowMission', handleNavigateToVisualFlowMission as EventListener);
    return () => {
      window.removeEventListener('navigateToVisualFlowMission', handleNavigateToVisualFlowMission as EventListener);
    };
  }, [setActiveTab]);

  const tabs = [
    { id: 'map', label: t('tabs.interactiveMap') },
    { id: 'flow', label: t('tabs.visualFlowEditor') },
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
    <div className={`h-full flex flex-col ${!isAnyFullscreen ? 'gap-6' : ''}`}>
      {/* Header - Hidden in fullscreen */}
      {!isAnyFullscreen && (
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-white galaxy-title">{t('campaignEditor.title')}</h1>
            <p className="text-gray-400">{t('campaignEditor.description')}</p>
          </div>
        </div>
      )}

      {/* Stats - Hidden in fullscreen */}
      {!isAnyFullscreen && (
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
      )}

      {/* Tabs - Hidden in fullscreen */}
      {!isAnyFullscreen && (
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
      )}

      {/* Content */}
      <div className={`bg-gt-primary rounded-lg flex-1 min-h-0 ${isAnyFullscreen ? 'rounded-none' : ''}`}>
        {activeTab === 'map' && (
          <InteractiveMap 
            onScriptSelect={handleScriptSelect}
          />
        )}

    {activeTab === 'flow' && (
          <ImagesProvider>
            <VisualFlowEditor 
              analysis={analysis}
      scriptId={selectedScript?.nomescript || null}
              onScriptSelect={(scriptName: string) => {
                // Qui dovremmo trovare lo script completo per nome
                // Per ora passiamo solo il nome
                handleScriptSelect(scriptName as any);
              }}
            />
          </ImagesProvider>
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
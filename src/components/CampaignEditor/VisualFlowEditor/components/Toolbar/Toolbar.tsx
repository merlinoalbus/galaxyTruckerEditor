import React from 'react';
import { Code2, List, Plus, FileText, Save, Maximize2, Minimize2, AlertCircle, Target } from 'lucide-react';
import { visualFlowEditorStyles } from '@/styles/CampaignEditor/VisualFlowEditor/VisualFlowEditor.styles';
import { NavigationBreadcrumb } from '../NavigationBreadcrumb';
import { NavigationPathItem } from '@/hooks/CampaignEditor/VisualFlowEditor/useZoomNavigation';
import { useTranslation } from '@/locales';

interface ToolbarProps {
  isFlowFullscreen: boolean;
  toggleFlowFullscreen: () => void;
  showScriptsList: boolean;
  setShowScriptsList: (show: boolean) => void;
  showMissionsList?: boolean;
  setShowMissionsList?: (show: boolean) => void;
  showJsonView: boolean;
  setShowJsonView: (show: boolean) => void;
  handleNewScript: () => void;
  currentScript: any;
  isZoomed: boolean;
  onZoomOut: (targetLevel?: number) => void;
  /** Path di navigazione utilizzato dal componente NavigationBreadcrumb */
  navigationPath: NavigationPathItem[];
  validationErrors?: number;
  onValidationErrorsClick?: () => void;
  onSaveScript?: () => Promise<{ success: boolean; error?: string }>;
  scriptsButtonRef?: React.RefObject<HTMLButtonElement>;
  missionsButtonRef?: React.RefObject<HTMLButtonElement>;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  isFlowFullscreen,
  toggleFlowFullscreen,
  showScriptsList,
  setShowScriptsList,
  showMissionsList = false,
  setShowMissionsList,
  showJsonView,
  setShowJsonView,
  handleNewScript,
  currentScript,
  isZoomed = false,
  onZoomOut,
  navigationPath = [],
  validationErrors = 0,
  onValidationErrorsClick,
  onSaveScript,
  scriptsButtonRef: externalScriptsButtonRef,
  missionsButtonRef: externalMissionsButtonRef
}) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = React.useState(false);
  const internalScriptsButtonRef = React.useRef<HTMLButtonElement>(null);
  const internalMissionsButtonRef = React.useRef<HTMLButtonElement>(null);
  
  const scriptsButtonRef = externalScriptsButtonRef || internalScriptsButtonRef;
  const missionsButtonRef = externalMissionsButtonRef || internalMissionsButtonRef;
  
  const handleSave = async () => {
    if (!onSaveScript || validationErrors > 0) return;
    
    setIsSaving(true);
    try {
      const result = await onSaveScript();
      if (!result.success) {
        console.error(t('visualFlowEditor.toolbar.saveError'), result.error);
      }
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="space-y-2">
      {/* Breadcrumb di navigazione */}
      <NavigationBreadcrumb
        navigationPath={navigationPath}
        onNavigate={onZoomOut}
        className={navigationPath.length > 0 ? 'bg-slate-700' : ''}
      />
      
      <div className={visualFlowEditorStyles.header.container}>
        <div className={visualFlowEditorStyles.header.titleSection}>
          <Code2 className={visualFlowEditorStyles.header.icon} />
          <div>
            <h3 className={visualFlowEditorStyles.header.title}>
              {t('visualFlowEditor.title')}
            </h3>
            <p className={visualFlowEditorStyles.header.subtitle}>
              {t('visualFlowEditor.subtitle')}
            </p>
          </div>
        </div>
      
        <div className={visualFlowEditorStyles.header.actions}>
          {/* Indicatore errori di validazione */}
          {validationErrors > 0 && (
            <button
              onClick={onValidationErrorsClick}
              className="flex items-center gap-2 px-3 py-2 bg-red-900/50 border border-red-600 text-red-400 rounded-lg hover:bg-red-900/70 transition-colors cursor-pointer"
              title={t('visualFlowEditor.toolbar.clickToSeeErrors')}
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{validationErrors} {validationErrors === 1 ? t('visualFlowEditor.toolbar.error') : t('visualFlowEditor.toolbar.errors')}</span>
            </button>
          )}
          
          <button
          ref={scriptsButtonRef}
          onClick={() => setShowScriptsList(!showScriptsList)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          title={t('visualFlowEditor.toolbar.scriptManagement')}
        >
          <List className="w-4 h-4" />
          {t('visualFlowEditor.toolbar.scripts')}
        </button>
        
        {setShowMissionsList && (
          <button
            ref={missionsButtonRef}
            onClick={() => setShowMissionsList(!showMissionsList)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            title={t('visualFlowEditor.toolbar.missionManagement')}
          >
            <Target className="w-4 h-4" />
            {t('visualFlowEditor.toolbar.missions')}
          </button>
        )}
        
        <button
          onClick={handleNewScript}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          title={t('visualFlowEditor.toolbar.newScript')}
        >
          <Plus className="w-4 h-4" />
          {t('visualFlowEditor.toolbar.new')}
        </button>
        
        <button
          onClick={() => setShowJsonView(!showJsonView)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          title={t('visualFlowEditor.toolbar.viewJson')}
        >
          <FileText className="w-4 h-4" />
          {t('visualFlowEditor.toolbar.json')}
        </button>
        
        {currentScript && (
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              validationErrors > 0 || isSaving
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
            title={validationErrors > 0 ? t('visualFlowEditor.toolbar.fixErrorsBeforeSaving').replace('{count}', validationErrors.toString()) : t('visualFlowEditor.toolbar.saveScript')}
            disabled={validationErrors > 0 || isSaving}
          >
            <Save className="w-4 h-4" />
            {isSaving ? t('visualFlowEditor.toolbar.saving') : t('visualFlowEditor.toolbar.save')}
          </button>
        )}
        
        <button
          onClick={toggleFlowFullscreen}
          className="flex items-center justify-center w-10 h-10 bg-slate-700 hover:bg-gt-accent text-gray-300 hover:text-white rounded-lg transition-all"
        >
          {isFlowFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
        </div>
      </div>
    </div>
  );
};
import { logger } from '@/utils/logger';
import React from 'react';
import { Code2, List, Plus, FileText, Save, Maximize2, Minimize2, AlertCircle, Target, ChevronsDown, ChevronsUp, Wand2 } from 'lucide-react';
import { visualFlowEditorStyles } from '@/styles/CampaignEditor/VisualFlowEditor/VisualFlowEditor.styles';
import { NavigationBreadcrumb } from '../NavigationBreadcrumb';
import { NavigationPathItem } from '@/hooks/CampaignEditor/VisualFlowEditor/useZoomNavigation';
import { useTranslation } from '@/locales';
import type { ScriptData } from '../ScriptsList/ScriptsList.types';

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
  currentScript: ScriptData | null;
  isZoomed: boolean;
  onZoomOut: (targetLevel?: number) => void;
  /** Path di navigazione utilizzato dal componente NavigationBreadcrumb */
  navigationPath: NavigationPathItem[];
  /** Path di navigazione tra script diversi */
  scriptNavigationPath?: Array<{ scriptName: string; parentBlockId?: string }>;
  /** Funzione per navigare tra script */
  onNavigateToScript?: (index: number) => void;
  validationErrors?: number;
  validationWarnings?: number;
  onValidationErrorsClick?: () => void;
  onValidationWarningsClick?: () => void;
  onSaveScript?: () => Promise<{ success: boolean; error?: string }>;
  scriptsButtonRef?: React.RefObject<HTMLButtonElement>;
  missionsButtonRef?: React.RefObject<HTMLButtonElement>;
  onCollapseAll?: () => void;
  onExpandAll?: () => void;
  bypassedErrorsCount?: number;
  totalErrors?: number;
  onOpenAiAllModal?: () => void;
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
  scriptNavigationPath = [],
  onNavigateToScript,
  validationErrors = 0,
  validationWarnings = 0,
  onValidationErrorsClick,
  onValidationWarningsClick,
  onSaveScript,
  scriptsButtonRef: externalScriptsButtonRef,
  missionsButtonRef: externalMissionsButtonRef,
  onCollapseAll,
  onExpandAll,
  bypassedErrorsCount = 0,
  totalErrors = 0,
  onOpenAiAllModal
}) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = React.useState(false);
  const internalScriptsButtonRef = React.useRef<HTMLButtonElement>(null);
  const internalMissionsButtonRef = React.useRef<HTMLButtonElement>(null);
  
  const scriptsButtonRef = externalScriptsButtonRef || internalScriptsButtonRef;
  const missionsButtonRef = externalMissionsButtonRef || internalMissionsButtonRef;
  
  const handleSave = async () => {
    // Permetti il salvataggio se ci sono solo warning o se tutti gli errori sono bypassati
    // validationErrors già contiene il numero di errori effettivi (totale - bypassati)
    if (!onSaveScript || validationErrors > 0) return;
    
    setIsSaving(true);
    try {
      const result = await onSaveScript();
      if (!result.success) {
  logger.error(t('visualFlowEditor.toolbar.saveError'), result.error);
      }
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="space-y-2">
      {/* Breadcrumb unificato per navigazione zoom e script */}
      <NavigationBreadcrumb
        navigationPath={navigationPath}
        onNavigate={onZoomOut}
        className={(navigationPath.length > 0 || scriptNavigationPath.length > 0) ? 'bg-slate-700' : ''}
        scriptNavigationPath={scriptNavigationPath}
        onNavigateToScript={onNavigateToScript}
        currentScriptName={currentScript?.name}
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
          {/* Indicatore errori di validazione - pulsante rosso */}
          {validationErrors > 0 && (
            <button
              onClick={onValidationErrorsClick}
              className="flex items-center gap-2 px-3 py-2 bg-red-900/50 border border-red-600 text-red-400 rounded-lg hover:bg-red-900/70 transition-colors cursor-pointer"
              title={t('visualFlowEditor.toolbar.clickToSeeErrors')}
            >
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium">
                {validationErrors} {validationErrors === 1 ? t('visualFlowEditor.toolbar.error') : t('visualFlowEditor.toolbar.errors')}
                {bypassedErrorsCount > 0 && (
                  <span className="text-xs text-orange-400 ml-1">
                    ({bypassedErrorsCount} bypassed)
                  </span>
                )}
              </span>
            </button>
          )}
          
          {/* Indicatore quando tutti gli errori sono bypassati */}
          {validationErrors === 0 && totalErrors > 0 && bypassedErrorsCount > 0 && (
            <button
              onClick={onValidationErrorsClick}
              className="flex items-center gap-2 px-3 py-2 bg-orange-900/50 border border-orange-600 text-orange-400 rounded-lg hover:bg-orange-900/70 transition-colors cursor-pointer"
              title="Tutti gli errori sono stati bypassati"
            >
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium">
                {bypassedErrorsCount} {bypassedErrorsCount === 1 ? 'errore bypassato' : 'errori bypassati'}
              </span>
            </button>
          )}
          
          {/* Indicatore warnings di validazione - pulsante arancione */}
          {validationWarnings > 0 && (
            <button
              onClick={onValidationWarningsClick}
              className="flex items-center gap-2 px-3 py-2 bg-orange-900/50 border border-orange-600 text-orange-400 rounded-lg hover:bg-orange-900/70 transition-colors cursor-pointer"
              title="Clicca per vedere i warning"
            >
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium">
                {validationWarnings} {validationWarnings === 1 ? 'warning' : 'warnings'}
              </span>
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

        {/* Suggerisci AI All */}
        {currentScript && (
          <button
            onClick={onOpenAiAllModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            title={(t as any)('visualFlowEditor.toolbar.aiSuggestAll') || 'Suggerisci AI All'}
          >
            <Wand2 className="w-4 h-4" />
            {(t as any)('visualFlowEditor.toolbar.aiAll') || 'AI All'}
          </button>
        )}
        
        {/* Replace static icons with dynamic rendering */}
        {currentScript && (
          <>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                validationErrors > 0 || isSaving
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                  : bypassedErrorsCount > 0
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : validationWarnings > 0
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
              title={
                validationErrors > 0 
                  ? t('visualFlowEditor.toolbar.fixErrorsBeforeSaving').replace('{count}', validationErrors.toString())
                  : bypassedErrorsCount > 0
                  ? `${t('visualFlowEditor.toolbar.saveScript')} (${bypassedErrorsCount} error${bypassedErrorsCount > 1 ? 'i' : 'e'} bypassa${bypassedErrorsCount > 1 ? 'ti' : 'to'})`
                  : validationWarnings > 0
                  ? `${t('visualFlowEditor.toolbar.saveScript')} (${validationWarnings} warning${validationWarnings > 1 ? 's' : ''})`
                  : t('visualFlowEditor.toolbar.saveScript')
              }
              disabled={validationErrors > 0 || isSaving}
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('visualFlowEditor.toolbar.saving') : t('visualFlowEditor.toolbar.save')}
              {bypassedErrorsCount > 0 && !isSaving && (
                <span className="text-xs bg-orange-800/50 px-1 rounded">
                  {bypassedErrorsCount} bypass
                </span>
              )}
            </button>
            
            {/* Collapse/Expand All buttons */}
            <div className="flex gap-1">
              <button
                onClick={onCollapseAll}
                className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                title="Collapse All Blocks"
              >
                <ChevronsDown className="w-4 h-4" />
                <span className="text-sm">Collapse</span>
              </button>
              <button
                onClick={onExpandAll}
                className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                title="Expand All Blocks"
              >
                <ChevronsUp className="w-4 h-4" />
                <span className="text-sm">Expand</span>
              </button>
            </div>
          </>
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
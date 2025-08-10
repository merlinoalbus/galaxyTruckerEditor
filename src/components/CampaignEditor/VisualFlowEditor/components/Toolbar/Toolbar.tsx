import React from 'react';
import { Code2, List, Plus, FileText, Save, Maximize2, Minimize2, AlertCircle } from 'lucide-react';
import { visualFlowEditorStyles } from '@/styles/CampaignEditor/VisualFlowEditor/VisualFlowEditor.styles';
import { NavigationBreadcrumb } from '../NavigationBreadcrumb';
import { NavigationPathItem } from '@/hooks/CampaignEditor/VisualFlowEditor/useZoomNavigation';

interface ToolbarProps {
  isFlowFullscreen: boolean;
  toggleFlowFullscreen: () => void;
  showScriptsList: boolean;
  setShowScriptsList: (show: boolean) => void;
  showJsonView: boolean;
  setShowJsonView: (show: boolean) => void;
  handleNewScript: () => void;
  currentScript: any;
  isZoomed: boolean;
  onZoomOut: (targetLevel?: number) => void;
  /** Path di navigazione utilizzato dal componente NavigationBreadcrumb */
  navigationPath: NavigationPathItem[];
  validationErrors?: number;
  onSaveScript?: () => Promise<{ success: boolean; error?: string }>;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  isFlowFullscreen,
  toggleFlowFullscreen,
  showScriptsList,
  setShowScriptsList,
  showJsonView,
  setShowJsonView,
  handleNewScript,
  currentScript,
  isZoomed = false,
  onZoomOut,
  navigationPath = [],
  validationErrors = 0,
  onSaveScript
}) => {
  const [isSaving, setIsSaving] = React.useState(false);
  
  const handleSave = async () => {
    if (!onSaveScript || validationErrors > 0) return;
    
    setIsSaving(true);
    try {
      const result = await onSaveScript();
      if (!result.success) {
        console.error('Errore nel salvataggio:', result.error);
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
              Visual Flow Editor
            </h3>
            <p className={visualFlowEditorStyles.header.subtitle}>
              Editor visuale completo con tutti i 14 tipi di IF
            </p>
          </div>
        </div>
      
        <div className={visualFlowEditorStyles.header.actions}>
          {/* Indicatore errori di validazione */}
          {validationErrors > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-900/50 border border-red-600 text-red-400 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{validationErrors} errori</span>
            </div>
          )}
          
          <button
          onClick={() => setShowScriptsList(!showScriptsList)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          title="Gestione Script"
        >
          <List className="w-4 h-4" />
          Scripts
        </button>
        
        <button
          onClick={handleNewScript}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          title="Nuovo Script"
        >
          <Plus className="w-4 h-4" />
          Nuovo
        </button>
        
        <button
          onClick={() => setShowJsonView(!showJsonView)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          title="Visualizza JSON"
        >
          <FileText className="w-4 h-4" />
          JSON
        </button>
        
        {currentScript && (
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              validationErrors > 0 || isSaving
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
            title={validationErrors > 0 ? `Correggi ${validationErrors} errori prima di salvare` : 'Salva Script'}
            disabled={validationErrors > 0 || isSaving}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvataggio...' : 'Salva'}
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
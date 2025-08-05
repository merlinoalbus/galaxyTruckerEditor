import React from 'react';
import { Code2, Settings, Play, Maximize2, Minimize2 } from 'lucide-react';

import { useVisualFlowEditor } from '@/hooks/CampaignEditor/VisualFlowEditor/useVisualFlowEditor';
import { visualFlowEditorStyles } from '@/styles/CampaignEditor/VisualFlowEditor/VisualFlowEditor.styles';
import { useTranslation } from '@/locales/translations';
import { useFullscreen } from '@/contexts/FullscreenContext';
import type { VisualFlowEditorProps } from '@/types/CampaignEditor/VisualFlowEditor/VisualFlowEditor.types';

export const VisualFlowEditor: React.FC<VisualFlowEditorProps> = ({ 
  analysis 
}) => {
  const { t } = useTranslation();
  const { isFlowFullscreen, toggleFlowFullscreen } = useFullscreen();
  const { 
    isInitialized, 
    isLoading, 
    selectedScript 
  } = useVisualFlowEditor(analysis || null);

  if (isLoading) {
    return (
      <div className={visualFlowEditorStyles.loadingState}>
        <Code2 className="w-8 h-8 animate-pulse" />
        <span>Caricamento Visual Flow Editor...</span>
      </div>
    );
  }

  return (
    <div className={`${visualFlowEditorStyles.container} ${isFlowFullscreen ? 'h-full overflow-y-auto' : ''}`}>
      {/* Header */}
      <div className={visualFlowEditorStyles.header.container}>
        <div className={visualFlowEditorStyles.header.titleSection}>
          <Code2 className={visualFlowEditorStyles.header.icon} />
          <div>
            <h3 className={visualFlowEditorStyles.header.title}>
              Visual Flow Editor
            </h3>
            <p className={visualFlowEditorStyles.header.subtitle}>
              Editor visuale per la creazione e modifica di script di campagna
            </p>
          </div>
        </div>
        
        <div className={visualFlowEditorStyles.header.actions}>
          <button className={visualFlowEditorStyles.button.secondary}>
            <Settings className="w-4 h-4" />
            Configurazione
          </button>
          <button className={visualFlowEditorStyles.button.primary}>
            <Play className="w-4 h-4" />
            Anteprima
          </button>
          <button
            onClick={toggleFlowFullscreen}
            className="flex items-center justify-center w-10 h-10 bg-slate-700 hover:bg-gt-accent text-gray-300 hover:text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-gt-accent/30 ml-2"
            title={isFlowFullscreen ? t('interactiveMap.exitFullscreen') : t('interactiveMap.enterFullscreen')}
          >
            {isFlowFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className={visualFlowEditorStyles.placeholder.container}>
        <div className={visualFlowEditorStyles.placeholder.content}>
          <div className={visualFlowEditorStyles.placeholder.icon}>
            <Code2 className="w-16 h-16" />
          </div>
          
          <h4 className={visualFlowEditorStyles.placeholder.title}>
            Visual Flow Editor
          </h4>
          
          <p className={visualFlowEditorStyles.placeholder.description}>
            Questo componente sarà il nostro editor visuale per creare e modificare
            i flussi di script in modo grafico e intuitivo.
          </p>
          
          <div className={visualFlowEditorStyles.placeholder.features}>
            <div className={visualFlowEditorStyles.placeholder.feature}>
              <span className={visualFlowEditorStyles.placeholder.featureBullet}>•</span>
              <span>Editing drag & drop dei blocchi di comando</span>
            </div>
            <div className={visualFlowEditorStyles.placeholder.feature}>
              <span className={visualFlowEditorStyles.placeholder.featureBullet}>•</span>
              <span>Visualizzazione grafica dei flussi condizionali</span>
            </div>
            <div className={visualFlowEditorStyles.placeholder.feature}>
              <span className={visualFlowEditorStyles.placeholder.featureBullet}>•</span>
              <span>Validazione in tempo reale della sintassi</span>
            </div>
            <div className={visualFlowEditorStyles.placeholder.feature}>
              <span className={visualFlowEditorStyles.placeholder.featureBullet}>•</span>
              <span>Preview e test degli script</span>
            </div>
          </div>
          
          <div className={visualFlowEditorStyles.placeholder.status}>
            <span className={visualFlowEditorStyles.placeholder.statusBadge}>
              🚧 In Sviluppo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
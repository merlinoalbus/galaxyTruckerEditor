import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Home, RotateCcw, ChevronUp, ChevronDown, Navigation } from 'lucide-react';
import { useTranslation } from '@/locales/translations';

import { MapControlsProps } from '@/types/CampaignEditor/InteractiveMap/types/MapControls/MapControls.types';
import { useMapControls } from '@/hooks/CampaignEditor/InteractiveMap/hooks/MapControls/useMapControls';
import { mapControlsStyles } from '@/styles/CampaignEditor/InteractiveMap/styles/MapControls/MapControls.styles';

export const MapControls: React.FC<MapControlsProps> = ({
  viewport,
  onViewportChange,
  onResetView
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  
  const { 
    zoomIn, 
    zoomOut, 
    resetView, 
    centerOnNewbie,
    getZoomPercentage,
    setCustomZoom 
  } = useMapControls(viewport, onViewportChange, onResetView);

  const zoomPercentage = getZoomPercentage();

  return (
    <div className={mapControlsStyles.containerCollapsible}>
      {/* Header chiudibile */}
      <div 
        className={mapControlsStyles.header}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={mapControlsStyles.headerContent}>
          <Navigation className="w-3 h-3" />
          <span className={mapControlsStyles.headerTitle}>{t('mapControls.title')}</span>
        </div>
        {isOpen ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
      </div>
      
      {isOpen && (
        <div className={mapControlsStyles.controlsWrapper}>
          {/* Prima riga: Controlli zoom principali */}
          <div className={mapControlsStyles.row}>
            {/* Zoom Out Button */}
            <button
              onClick={zoomOut}
              disabled={viewport.scale <= 0.1}
              className={`${mapControlsStyles.controlButton} ${
                viewport.scale <= 0.1 ? mapControlsStyles.disabled : ''
              }`}
              title={t('mapControls.zoomOut')}
            >
              <ZoomOut size={18} />
            </button>

            {/* Zoom Display */}
            <div className={mapControlsStyles.zoomDisplay}>
              <span className={mapControlsStyles.zoomText}>
                {zoomPercentage}%
              </span>
            </div>

            {/* Zoom In Button */}
            <button
              onClick={zoomIn}
              disabled={viewport.scale >= 5}
              className={`${mapControlsStyles.controlButton} ${
                viewport.scale >= 5 ? mapControlsStyles.disabled : ''
              }`}
              title={t('mapControls.zoomIn')}
            >
              <ZoomIn size={18} />
            </button>
          </div>

          {/* Seconda riga: Controlli navigazione */}
          <div className={mapControlsStyles.row}>
            {/* Home Button - Center on Port Newbie */}
            <button
              onClick={centerOnNewbie}
              className={mapControlsStyles.controlButton}
              title={t('mapControls.centerNewbie')}
            >
              <Home size={18} />
            </button>

            {/* 100% Zoom Button */}
            <button
              onClick={() => setCustomZoom(1)}
              className={mapControlsStyles.controlButton}
              title="Zoom 100%"
            >
              <span className={mapControlsStyles.zoomLabel}>100%</span>
            </button>

            {/* Reset Button - Reset to center and 100% */}
            <button
              onClick={resetView}
              className={mapControlsStyles.controlButton}
              title={t('mapControls.resetView')}
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
import React from 'react';
import { ZoomIn, ZoomOut, Home, RotateCcw } from 'lucide-react';

import { MapControlsProps } from '@/types/CampaignEditor/InteractiveMap/types/MapControls/MapControls.types';
import { useMapControls } from '@/hooks/CampaignEditor/InteractiveMap/hooks/MapControls/useMapControls';
import { mapControlsStyles } from '@/styles/CampaignEditor/InteractiveMap/styles/MapControls/MapControls.styles';

export const MapControls: React.FC<MapControlsProps> = ({
  viewport,
  onViewportChange,
  onResetView
}) => {
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
    <div className={mapControlsStyles.container}>
      {/* Prima riga: Controlli zoom principali */}
      <div className={mapControlsStyles.row}>
        {/* Zoom Out Button */}
        <button
          onClick={zoomOut}
          disabled={viewport.scale <= 0.1}
          className={`${mapControlsStyles.controlButton} ${
            viewport.scale <= 0.1 ? mapControlsStyles.disabled : ''
          }`}
          title="Zoom Out (-)"
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
          title="Zoom In (+)"
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
          title="Center on Port Newbie"
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
          title="Reset View (Center + 100%)"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
};
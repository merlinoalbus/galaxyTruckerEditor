import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useTranslation } from '@/locales';

interface ZoomControlsProps {
  /** Funzione per fare zoom in sul blocco */
  onZoomIn?: () => void;
  /** Funzione per fare zoom out (tornare indietro) */
  onZoomOut?: () => void;
  /** Dimensione delle icone (small, medium, large) */
  size?: 'small' | 'medium' | 'large';
  /** Posizione del controllo */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Classi CSS aggiuntive */
  className?: string;
}

/**
 * Componente per gestire i controlli di zoom sui blocchi
 * Mostra un pulsante zoom-in o zoom-out a seconda della modalità
 */
export const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  size = 'medium',
  position = 'top-left',
  className = ''
}) => {
  const { t } = useTranslation();
  // Se nessuna funzione è fornita, non renderizzare nulla
  if (!onZoomIn && !onZoomOut) {
    return null;
  }

  // Configurazioni per le dimensioni
  const sizeConfig = {
    small: {
      button: 'p-1',
      icon: 'w-3 h-3'
    },
    medium: {
      button: 'p-1.5',
      icon: 'w-4 h-4'
    },
    large: {
      button: 'p-2',
      icon: 'w-5 h-5'
    }
  };

  // Configurazioni per le posizioni
  const positionConfig = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2'
  };

  const config = sizeConfig[size];
  const positionClass = positionConfig[position];

  // Determina se è in modalità back
  const isBackMode = !!onZoomOut;

  return (
    <button
      onClick={onZoomOut || onZoomIn}
      className={`
        absolute ${positionClass} ${config.button}
        ${isBackMode 
          ? 'bg-slate-600/80 hover:bg-orange-600 border-slate-500/50' 
          : 'bg-slate-700/80 hover:bg-blue-600 border-slate-600/50'
        }
        border rounded-md z-10 transition-all duration-200 backdrop-blur-sm
        ${className}
      `}
      title={isBackMode ? t('visualFlowEditor.zoom.goBack') : t('visualFlowEditor.zoom.zoomIn')}
    >
      {isBackMode 
        ? <ZoomOut className={`${config.icon} text-gray-300`} />
        : <ZoomIn className={`${config.icon} text-gray-400`} />
      }
    </button>
  );
};

/**
 * Variante inline per i controlli di zoom (senza posizionamento assoluto)
 */
export const InlineZoomControls: React.FC<Omit<ZoomControlsProps, 'position'>> = ({
  onZoomIn,
  onZoomOut,
  size = 'medium',
  className = ''
}) => {
  const { t } = useTranslation();
  if (!onZoomIn && !onZoomOut) {
    return null;
  }

  const sizeConfig = {
    small: {
      button: 'p-1',
      icon: 'w-3 h-3'
    },
    medium: {
      button: 'p-1.5',
      icon: 'w-4 h-4'
    },
    large: {
      button: 'p-2',
      icon: 'w-5 h-5'
    }
  };

  const config = sizeConfig[size];
  const isBackMode = !!onZoomOut;

  return (
    <button
      onClick={onZoomOut || onZoomIn}
      className={`
        ${config.button}
        ${isBackMode 
          ? 'bg-slate-600 hover:bg-orange-600 border-slate-500' 
          : 'bg-slate-700 hover:bg-blue-600 border-slate-600'
        }
        border rounded transition-all duration-200 opacity-80 hover:opacity-100
        ${className}
      `}
      title={isBackMode ? t('visualFlowEditor.zoom.goBack') : t('visualFlowEditor.zoom.zoomIn')}
    >
      {isBackMode 
        ? <ZoomOut className={`${config.icon} text-gray-300`} />
        : <ZoomIn className={`${config.icon} text-gray-400`} />
      }
    </button>
  );
};
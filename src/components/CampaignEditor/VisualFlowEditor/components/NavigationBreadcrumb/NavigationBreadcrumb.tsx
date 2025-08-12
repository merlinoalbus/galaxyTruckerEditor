import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { NavigationPathItem } from '@/hooks/CampaignEditor/VisualFlowEditor/useZoomNavigation';
import { useTranslation } from '@/locales';

interface NavigationBreadcrumbProps {
  navigationPath: NavigationPathItem[];
  onNavigate: (targetLevel: number) => void;
  className?: string;
}

/**
 * Componente breadcrumb per la navigazione gerarchica dei blocchi
 * Mostra il percorso corrente e permette di navigare ai livelli superiori
 */
export const NavigationBreadcrumb: React.FC<NavigationBreadcrumbProps> = ({
  navigationPath,
  onNavigate,
  className = ''
}) => {
  const { t } = useTranslation();
  if (navigationPath.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 px-3 py-2 bg-gray-800 rounded-lg ${className}`}>
      {/* Home button per tornare alla root */}
      <button
        onClick={() => onNavigate(-1)}
        className="p-1 hover:bg-gray-700 rounded transition-colors"
        title={t('visualFlowEditor.navigation.backToMain')}
      >
        <Home className="w-4 h-4 text-gray-400" />
      </button>
      
      <ChevronRight className="w-4 h-4 text-gray-500" />
      
      {/* Path items */}
      {navigationPath.map((item, index) => (
        <React.Fragment key={item.id}>
          <button
            onClick={() => onNavigate(index)}
            className={`
              px-2 py-1 text-sm rounded transition-colors
              ${index === navigationPath.length - 1
                ? 'text-white bg-blue-600 cursor-default'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }
            `}
            disabled={index === navigationPath.length - 1}
          >
            {item.name}
          </button>
          
          {index < navigationPath.length - 1 && (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * Versione compatta del breadcrumb per spazi ristretti
 */
export const CompactNavigationBreadcrumb: React.FC<NavigationBreadcrumbProps> = ({
  navigationPath,
  onNavigate,
  className = ''
}) => {
  if (navigationPath.length === 0) {
    return null;
  }

  const currentItem = navigationPath[navigationPath.length - 1];
  const parentItem = navigationPath.length > 1 ? navigationPath[navigationPath.length - 2] : null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {parentItem && (
        <>
          <button
            onClick={() => onNavigate(navigationPath.length - 2)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← {parentItem.name}
          </button>
          <span className="text-gray-500">/</span>
        </>
      )}
      <span className="text-sm font-semibold text-white">{currentItem.name}</span>
    </div>
  );
};
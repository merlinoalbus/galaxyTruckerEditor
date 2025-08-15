import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { NavigationPathItem } from '@/hooks/CampaignEditor/VisualFlowEditor/useZoomNavigation';
import { useTranslation } from '@/locales';

interface NavigationBreadcrumbProps {
  navigationPath: NavigationPathItem[];
  onNavigate: (targetLevel: number) => void;
  className?: string;
  scriptNavigationPath?: Array<{ scriptName: string; parentBlockId?: string }>;
  onNavigateToScript?: (targetIndex: number, zoomToBlockIndex?: number) => void;
  currentScriptName?: string; // Nome dello script principale
}

/**
 * Componente breadcrumb per la navigazione gerarchica dei blocchi
 * Mostra il percorso corrente e permette di navigare ai livelli superiori
 */
export const NavigationBreadcrumb: React.FC<NavigationBreadcrumbProps> = ({
  navigationPath,
  onNavigate,
  className = '',
  scriptNavigationPath = [],
  onNavigateToScript,
  currentScriptName
}) => {
  const { t } = useTranslation();
  
  // Se non c'è nulla da mostrare, ritorna null
  if (navigationPath.length === 0 && scriptNavigationPath.length === 0) {
    return null;
  }

  // Costruisci un percorso unificato basato su una logica corretta
  const unifiedPath: Array<{ type: 'home' | 'zoom' | 'script', name: string, onClick: () => void, isLast: boolean }> = [];
  
  // Ottieni SEMPRE il nome dello script principale
  let mainScriptName = currentScriptName || '';
  if (!mainScriptName && scriptNavigationPath && scriptNavigationPath.length > 0) {
    mainScriptName = scriptNavigationPath[0].scriptName;
  }
  
  // Aggiungi il pulsante home con il nome dello script principale
  unifiedPath.push({
    type: 'home',
    name: mainScriptName,
    onClick: () => {
      // Torna SEMPRE alla vista completa dello script principale senza zoom
      if (scriptNavigationPath.length > 1 && onNavigateToScript) {
        // Se siamo in un sub-script, torna allo script principale SENZA zoom
        // Passa undefined come secondo parametro per indicare "nessuno zoom"
        onNavigateToScript(-1, -1); // -1 come secondo parametro significa "vista root"
      } else if (navigationPath.length > 0) {
        // Se siamo in zoom (ma nello script principale), esci completamente dallo zoom
        onNavigate(-1);
      }
    },
    isLast: false
  });
  
  // Costruisci il percorso di navigazione unificato
  if (navigationPath.length > 0) {
    const subscriptIndex = navigationPath.findIndex(item => item.id.startsWith('subscript-'));
    
    if (subscriptIndex >= 0) {
      // Siamo in un sub-script o abbiamo attraversato un sub-script
      
      // Aggiungi i livelli di zoom prima del subscript (nello script principale)
      for (let i = 0; i < subscriptIndex; i++) {
        const item = navigationPath[i];
        const itemIndex = i; // Cattura l'indice per la closure
        // Salta elementi vuoti o Script wrapper
        if (!item.name || item.name === '' || item.name.startsWith('Script: ')) {
          continue;
        }
        unifiedPath.push({
          type: 'zoom',
          name: item.name,
          onClick: () => {
            // Navigazione diretta al livello di zoom nello script principale
            // Questo deve essere gestito in modo speciale per andare direttamente al blocco giusto
            if (onNavigateToScript) {
              // Usa una navigazione combinata: torna allo script principale E vai al blocco specifico
              onNavigateToScript(-1, itemIndex); // Passa l'indice del blocco target
            }
          },
          isLast: false
        });
      }
      
      // Aggiungi il sub-script con icona 📄
      const subscriptItem = navigationPath[subscriptIndex];
      const subscriptName = subscriptItem.name;
      unifiedPath.push({
        type: 'script',
        name: subscriptName,
        onClick: () => {
          // SEMPRE naviga al livello del sub-script per tornare alla sua vista root
          // Questo resetterà qualsiasi zoom all'interno del sub-script
          onNavigate(subscriptIndex);
        },
        isLast: false
      });
      
      // Aggiungi i livelli di zoom dopo il subscript (nel sub-script)
      for (let i = subscriptIndex + 1; i < navigationPath.length; i++) {
        const item = navigationPath[i];
        const itemIndex = i; // Cattura l'indice per la closure
        unifiedPath.push({
          type: 'zoom',
          name: item.name,
          onClick: () => {
            // Naviga direttamente al livello di zoom nel sub-script
            if (onNavigate) {
              onNavigate(itemIndex);
            }
          },
          isLast: false
        });
      }
    } else {
      // Siamo nello script principale, aggiungi solo i livelli di zoom
      navigationPath.forEach((item, index) => {
        // Salta il primo elemento se è lo script stesso (Script: xxx)
        if (item.name.startsWith('Script: ')) {
          return;
        }
        const itemIndex = index; // Cattura l'indice per la closure
        unifiedPath.push({
          type: 'zoom',
          name: item.name,
          onClick: () => {
            // Naviga al livello di zoom nello script principale
            if (onNavigate) {
              onNavigate(itemIndex);
            }
          },
          isLast: false
        });
      });
    }
  }
  
  // Segna l'ultimo elemento
  if (unifiedPath.length > 0) {
    unifiedPath[unifiedPath.length - 1].isLast = true;
  }

  return (
    <div className={`flex items-center gap-1 px-3 py-2 bg-gray-800 rounded-lg ${className}`}>
      {unifiedPath.map((item, index) => (
        <React.Fragment key={`path-${index}`}>
          {item.type === 'home' ? (
            <button
              onClick={item.onClick}
              className="flex items-center gap-1 px-2 py-1 hover:bg-gray-700 rounded transition-colors"
              title={t('visualFlowEditor.navigation.backToMain')}
            >
              <Home className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">{item.name}</span>
            </button>
          ) : (
            <>
              <ChevronRight className="w-4 h-4 text-gray-500" />
              <button
                onClick={item.onClick}
                className={`
                  px-2 py-1 text-sm rounded transition-colors flex items-center gap-1
                  ${item.isLast
                    ? 'text-white bg-blue-600 cursor-default'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
                disabled={item.isLast}
              >
                {item.type === 'script' && '📄 '}
                {item.name}
              </button>
            </>
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
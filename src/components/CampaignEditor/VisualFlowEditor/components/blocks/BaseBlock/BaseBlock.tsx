import React, { useState, ReactNode, useRef, useEffect } from 'react';
import { Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { getBlockColors } from '@/utils/CampaignEditor/VisualFlowEditor/blockColors';
import { useTranslation } from '@/locales';
import { CharacterAvatar } from '../../CharacterAvatar';

interface BaseBlockProps {
  // Identificazione blocco
  blockType: string;
  blockIcon: ReactNode;
  
  // Controlli
  onRemove?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  
  // Stato collapse
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  
  // Contenuto parametri per visualizzazione compatta
  compactParams?: ReactNode | { params?: ReactNode; elementCount?: ReactNode }; // Parametri da mostrare quando collapsed
  
  // Styling
  className?: string;
  isInvalid?: boolean;
  validationType?: 'error' | 'warning';
  blockColor?: string; // Per personalizzare il colore del drag handle
  iconBgColor?: string; // Colore di sfondo per l'icona
  
  // Content
  children: ReactNode;
  
  // Se true, nasconde i controlli (per ScriptBlock root)
  hideControls?: boolean;
  
  // Componente aggiuntivo da renderizzare (es. SceneDebugButton)
  extraControls?: ReactNode;
  
  // Mostra avatar per blocchi SAY/ASK
  showAvatar?: boolean;
  avatarCharacter?: any; // Personaggio da mostrare nell'avatar
  isShipType?: boolean; // Indica se l'avatar è per SETSHIPTYPE
  isNodeType?: boolean; // Indica se l'avatar è per comandi mappa (nodo)
  // Azioni sempre visibili nella header (es. navigate to script)
  headerActions?: React.ReactNode;
}

/**
 * Componente base per tutti i blocchi
 * Fornisce delete button, collapse/expand, drag handle e header standardizzato
 */
export const BaseBlock: React.FC<BaseBlockProps> = ({
  blockType,
  blockIcon,
  onRemove,
  onDragStart,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  compactParams,
  className = '',
  isInvalid = false,
  validationType,
  blockColor = 'bg-gray-700',
  iconBgColor = '',
  children,
  hideControls = false,
  extraControls,
  showAvatar = false,
  avatarCharacter,
  isShipType = false,
  isNodeType = false
  , headerActions
}) => {
  const { t } = useTranslation();
  // Stato interno per collapse se non è controllato dall'esterno
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [showCompactParams, setShowCompactParams] = useState(true);
  const [showElementCount, setShowElementCount] = useState(true);
  const headerRef = useRef<HTMLDivElement>(null);
  
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  
  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  // Controlla overflow progressivo senza entrare in loop di aggiornamento
  const showCompactParamsRef = useRef(showCompactParams);
  const showElementCountRef = useRef(showElementCount);
  useEffect(() => {
    showCompactParamsRef.current = showCompactParams;
  }, [showCompactParams]);
  useEffect(() => {
    showElementCountRef.current = showElementCount;
  }, [showElementCount]);

  useEffect(() => {
    const header = headerRef.current;
    if (!isCollapsed || !header) {
      if (!showCompactParamsRef.current) setShowCompactParams(true);
      if (!showElementCountRef.current) setShowElementCount(true);
      return;
    }

    const checkOverflow = () => {
      const h = headerRef.current;
      if (!h) return;
      const containerWidth = h.clientWidth;
      const contentWidth = h.scrollWidth;

      if (contentWidth > containerWidth) {
        if (showCompactParamsRef.current) {
          showCompactParamsRef.current = false;
          setShowCompactParams(false);
          return;
        }
        if (showElementCountRef.current) {
          showElementCountRef.current = false;
          setShowElementCount(false);
          return;
        }
      } else {
        if (!showElementCountRef.current) {
          showElementCountRef.current = true;
          setShowElementCount(true);
        } else if (!showCompactParamsRef.current) {
          showCompactParamsRef.current = true;
          setShowCompactParams(true);
        }
      }
    };

    // Esegui un primo controllo e attiva observer
    checkOverflow();
    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(header);
    return () => resizeObserver.disconnect();
  }, [isCollapsed, compactParams]);

  // Calcola il padding in base allo stato collapsed
  const paddingClass = isCollapsed ? 'p-2' : 'p-4';
  
  // Ottieni i colori per questo tipo di blocco
  const blockColors = getBlockColors(blockType);
  const effectiveIconBg = iconBgColor || blockColors.icon;
  const effectiveDragHandle = blockColor || blockColors.dragHandle;

  // Determina le classi di bordo in base al tipo di validazione
  const getValidationClasses = () => {
    if (!isInvalid) return '';
    
    // Se validationType è esplicitamente 'warning', usa arancione
    if (validationType === 'warning') {
      return 'border-orange-500 border-2 shadow-orange-500/50 shadow-lg';
    }
    // Altrimenti usa rosso (per 'error' o undefined)
    return 'border-red-500 border-2 shadow-red-500/50 shadow-lg';
  };

  return (
    <div className={`relative ${className || ''} ${paddingClass} ${getValidationClasses()}`}>
      {/* Delete button - solo se onRemove è definito e non hideControls */}
      {!hideControls && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 bg-slate-700/80 hover:bg-red-600 border border-slate-600/50 rounded-md z-10 transition-all duration-200 backdrop-blur-sm"
          title={t('visualFlowEditor.block.deleteTitle')}
        >
          <Trash2 className="w-3 h-3 text-gray-400 hover:text-white" />
        </button>
      )}
      
      {/* Collapse/Expand button - sempre visibile se non hideControls */}
      {!hideControls && (
        <button
          onClick={handleToggleCollapse}
          className="absolute top-8 right-2 p-1 bg-slate-700/80 hover:bg-slate-600 border border-slate-600/50 rounded-md z-10 transition-all duration-200 backdrop-blur-sm"
          title={isCollapsed ? t('visualFlowEditor.block.expandTitle') : t('visualFlowEditor.block.collapseTitle')}
        >
          {isCollapsed 
            ? <ChevronDown className="w-3 h-3 text-gray-400" />
            : <ChevronUp className="w-3 h-3 text-gray-400" />
          }
        </button>
      )}
      
      {/* Drag handle - se onDragStart è definito */}
      {onDragStart && (
        <div
          className={`absolute -left-3 top-1/2 -translate-y-1/2 p-1 ${effectiveDragHandle} hover:opacity-100 opacity-70 rounded cursor-move transition-opacity`}
          draggable
          onDragStart={onDragStart}
          title={t('visualFlowEditor.block.dragToMove')}
        >
          <GripVertical className="w-3 h-3 text-white" />
        </div>
      )}
      
      {/* Extra controls (es. Scene Debug Button) */}
      {extraControls}
      
      {/* Header standardizzato */}
      <div 
        ref={headerRef}
        className={`flex items-center ${!isCollapsed ? 'mb-3 pb-3 border-b border-gray-600/50' : ''} overflow-hidden`}
        style={{ paddingRight: hideControls ? '0' : '60px' }} // Spazio per i pulsanti
      >
        {/* Spaziatura per zoom controls nei container */}
        <div className="w-5 flex-shrink-0" />
        
        {/* Icona blocco - dimensione aumentata del 40% */}
        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center ${effectiveIconBg} rounded-lg`}>
          <div className="text-gray-400 flex items-center justify-center" style={{ fontSize: '20px', lineHeight: '1' }}>
            {blockIcon}
          </div>
        </div>
        
        {/* Label blocco */}
        <span className="text-base font-semibold text-white tracking-wide whitespace-nowrap ml-2 flex-shrink-0 galaxy-title">
          {blockType}
        </span>
        
        {/* Gestione parametri compatti e conteggio elementi */}
        {(() => {
          // Se compactParams è un oggetto con params e elementCount
          if (compactParams && typeof compactParams === 'object' && !React.isValidElement(compactParams) && 'params' in compactParams) {
            const { params, elementCount } = compactParams as { params?: ReactNode; elementCount?: ReactNode };
            
            if (isCollapsed) {
              return (
                <>
                  {/* Parametri - nascosti se showCompactParams è false */}
                  {params && showCompactParams && (
                    <div className="ml-3 text-xs text-gray-400 flex-1 min-w-0 overflow-hidden">
                      {params}
                    </div>
                  )}
                  {/* Spacer se i parametri sono nascosti */}
                  {(!params || !showCompactParams) && <div className="flex-1" />}
                  {/* Conteggio elementi - nascosto se showElementCount è false */}
                  {elementCount && showElementCount && (
                    <div className="text-xs ml-2">
                      {elementCount}
                    </div>
                  )}
                </>
              );
            } else {
              // Versione espansa - mostra sempre il conteggio
              return (
                <>
                  <div className="flex-1" />
                  {elementCount && (
                    <div className="text-xs ml-2">
                      {elementCount}
                    </div>
                  )}
                </>
              );
            }
          }
          
          // Compatibilità con il vecchio formato (solo ReactNode)
          if (compactParams && (typeof compactParams !== 'object' || React.isValidElement(compactParams) || !('params' in compactParams))) {
            if (isCollapsed && showCompactParams) {
              return (
                <div className="flex items-center gap-2 ml-3 text-xs text-gray-400 flex-1 min-w-0 overflow-hidden">
                  {compactParams as ReactNode}
                </div>
              );
            } else if (!isCollapsed) {
              return (
                <div className="flex items-center gap-2 ml-3 text-xs text-gray-400 flex-1 min-w-0">
                  {compactParams as ReactNode}
                </div>
              );
            }
          }
          
          return null;
        })()}
        
        {/* Avatar per SAY/ASK sempre visibile */}
        {showAvatar && (
          <div className="ml-auto mr-2">
            {/* Gestione speciale per HIDEALLPATHS con due avatar e freccia + X */}
            {avatarCharacter && typeof avatarCharacter === 'object' && 'node1' in avatarCharacter && 'node2' in avatarCharacter ? (
              <div className="flex items-center gap-2">
                <CharacterAvatar character={(avatarCharacter as any).node1} isNodeType={true} size="small" />
                {/* Freccia con X sovrapposta */}
                <div className="relative flex items-center justify-center w-6 h-6">
                  <div className="text-sm">➡️</div>
                  <div className="absolute top-0 right-0 text-red-500 text-xs">❌</div>
                </div>
                <CharacterAvatar character={(avatarCharacter as any).node2} isNodeType={true} size="small" />
              </div>
            ) : (
              <CharacterAvatar character={avatarCharacter} isShipType={isShipType} isNodeType={isNodeType} />
            )}
          </div>
        )}

        {/* Header actions - sempre visibili e non soggette a hide del summary */}
        {headerActions && (
          <div className="ml-2 flex items-center gap-1 flex-shrink-0">
            {headerActions}
          </div>
        )}
      </div>
      
      {/* Main content - visibile solo se non collapsed */}
      {!isCollapsed && children}
    </div>
  );
};
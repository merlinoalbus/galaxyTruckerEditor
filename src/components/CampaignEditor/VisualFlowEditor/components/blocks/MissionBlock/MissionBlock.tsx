import React, { useState, useEffect, useRef } from 'react';
import { Target, Flag, ChevronDown, ChevronUp } from 'lucide-react';
import { AnchorPoint } from '../../AnchorPoint/AnchorPoint';
import { InlineZoomControls } from '../../ZoomControls';
import { useTranslation } from '@/locales';

interface MissionBlockProps {
  block: any;
  onUpdate: (updates: any) => void;
  onRemove?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDropAtIndexMission: (e: React.DragEvent, index: number) => void;
  onDropAtIndexFinish: (e: React.DragEvent, index: number) => void;
  renderChildren: (blocks: any[]) => React.ReactNode;
  isDragActive?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  isZoomed?: boolean;
  isInvalid?: boolean;
  validationType?: 'error' | 'warning';
  collapseAllTrigger?: number;
  expandAllTrigger?: number;
  globalCollapseState?: 'collapsed' | 'expanded' | 'manual';
  isCustom?: boolean;
  availableLanguages?: string[];
}

export const MissionBlock: React.FC<MissionBlockProps> = ({
  block,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDropAtIndexMission,
  onDropAtIndexFinish,
  renderChildren,
  isDragActive = false,
  onZoomIn,
  onZoomOut,
  isZoomed = false,
  isInvalid = false,
  validationType = 'error',
  collapseAllTrigger = 0,
  expandAllTrigger = 0,
  globalCollapseState = 'manual',
  isCustom,
  availableLanguages
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return globalCollapseState === 'collapsed';
  });
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Reagisci ai trigger di collapse/expand all
  useEffect(() => {
    if (collapseAllTrigger > 0) {
      setIsCollapsed(true);
      setIsManuallyExpanded(false);
    }
  }, [collapseAllTrigger]);
  
  useEffect(() => {
    if (expandAllTrigger > 0) {
      setIsCollapsed(false);
      setIsManuallyExpanded(true);
    }
  }, [expandAllTrigger]);
  
  // Auto-collapse se lo spazio è insufficiente
  useEffect(() => {
    const checkSpace = () => {
      if (isManuallyExpanded) return;
      
      if (containerRef.current && !isCollapsed) {
        const container = containerRef.current;
        const width = container.offsetWidth;
        const minRequiredWidth = 650;
        
        if (width < minRequiredWidth) {
          setIsCollapsed(true);
        }
      }
    };
    
    checkSpace();
    const resizeObserver = new ResizeObserver(checkSpace);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [isCollapsed, isManuallyExpanded]);

  return (
    <div ref={containerRef} className="bg-gradient-to-br from-purple-900/90 to-purple-950/90 rounded-lg p-6 relative border border-purple-700/50 backdrop-blur-sm shadow-xl w-full" style={{ minWidth: '90%' }}>
      {/* Zoom controls in alto a sinistra - NO per MissionBlock come da specifica */}
      {/* MissionBlock è come ScriptBlock, non ha zoom controls perché è il contenitore radice */}
      
      {/* Collapse/Expand button - stesso stile di ScriptBlock */}
      <button
        onClick={() => {
          const newCollapsedState = !isCollapsed;
          setIsCollapsed(newCollapsedState);
          if (!newCollapsedState) {
            setIsManuallyExpanded(true);
          } else {
            setIsManuallyExpanded(false);
          }
        }}
        className="absolute top-8 right-3 p-1 bg-slate-700/80 hover:bg-slate-600 border border-slate-600/50 rounded-md z-10 transition-all duration-200 backdrop-blur-sm"
        title={isCollapsed ? t('visualFlowEditor.mission.expand') : t('visualFlowEditor.mission.collapse')}
      >
        {isCollapsed 
          ? <ChevronDown className="w-3 h-3 text-gray-400" />
          : <ChevronUp className="w-3 h-3 text-gray-400" />
        }
      </button>
      
      {/* Header del blocco MISSION - stesso pattern di ScriptBlock */}
      <div className={`flex items-center gap-3 ${!isCollapsed ? 'mb-4 pb-4 border-b border-purple-600' : ''} pr-10`}>
        <div className="bg-purple-800/50 p-2 rounded-lg">
          <Target className="w-4 h-4 text-purple-400" />
        </div>
        <label className="text-xs text-gray-400">{t('visualFlowEditor.mission.missionNameLabel')}</label>
        <input
          type="text"
          className="bg-purple-900/50 text-white px-2 py-1 rounded text-sm w-48 border border-purple-600 focus:border-purple-500 focus:outline-none"
          value={block.missionName || ''}
          onChange={(e) => {
            const newName = e.target.value;
            onUpdate({ missionName: newName });
          }}
          placeholder={t('visualFlowEditor.mission.missionName')}
        />
        
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
          <span>{t('visualFlowEditor.mission.fileLabel')} {block.fileName}</span>
          <span>{t('visualFlowEditor.mission.blocksLabel')} {(block.blocksMission?.length || 0) + (block.blocksFinish?.length || 0)}</span>
        </div>
      </div>
      
      {/* Contenuto - visibile solo se non collassato */}
      {!isCollapsed && (
        <div className="space-y-4">
          {/* Area Mission principale */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">{t('visualFlowEditor.mission.missionBlocksTitle')}</span>
              <span className="text-xs text-gray-400">
                ({block.blocksMission?.length || 0} {t('visualFlowEditor.mission.elements')})
              </span>
            </div>
            
            <div className="bg-purple-950/30 rounded-lg border border-purple-700/30 p-3 min-h-[100px]">
              {/* Initial anchor point */}
              <AnchorPoint
                onDragOver={onDragOver}
                onDrop={(e) => onDropAtIndexMission(e, 0)}
                label={t('visualFlowEditor.mission.insertHere')}
              />
              
              {/* Render mission blocks */}
              {block.blocksMission && block.blocksMission.length > 0 ? (
                block.blocksMission.map((child: any, index: number) => (
                  <React.Fragment key={child.id || index}>
                    {renderChildren([child])}
                    <AnchorPoint
                      onDragOver={onDragOver}
                      onDrop={(e) => onDropAtIndexMission(e, index + 1)}
                      label=""
                    />
                  </React.Fragment>
                ))
              ) : (
                <div className="text-center text-purple-500 text-lg py-2">
                  +
                </div>
              )}
            </div>
          </div>

          {/* Area Finish Mission */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flag className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">{t('visualFlowEditor.mission.missionFinishTitle')}</span>
              <span className="text-xs text-gray-400">
                ({block.blocksFinish?.length || 0} {t('visualFlowEditor.mission.elements')})
              </span>
            </div>
            
            <div className="bg-green-950/30 rounded-lg border border-green-700/30 p-3 min-h-[100px]">
              {/* Initial anchor point */}
              <AnchorPoint
                onDragOver={onDragOver}
                onDrop={(e) => onDropAtIndexFinish(e, 0)}
                label={t('visualFlowEditor.mission.insertHere')}
              />
              
              {/* Render finish blocks */}
              {block.blocksFinish && block.blocksFinish.length > 0 ? (
                block.blocksFinish.map((child: any, index: number) => (
                  <React.Fragment key={child.id || index}>
                    {renderChildren([child])}
                    <AnchorPoint
                      onDragOver={onDragOver}
                      onDrop={(e) => onDropAtIndexFinish(e, index + 1)}
                      label=""
                    />
                  </React.Fragment>
                ))
              ) : (
                <div className="text-center text-green-500 text-lg py-2">
                  +
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
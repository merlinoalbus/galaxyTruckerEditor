import React, { useState } from 'react';
import { Target, Flag, ChevronDown, ChevronUp, Trash2, GripVertical, Edit2 } from 'lucide-react';
import { AnchorPoint } from '../../AnchorPoint/AnchorPoint';
import { ZoomControls } from '../../ZoomControls';

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
  isInvalid = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(block.missionName || '');

  const handleNameSave = () => {
    if (tempName.trim()) {
      onUpdate({ missionName: tempName.trim() });
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName(block.missionName || '');
    setIsEditingName(false);
  };

  return (
    <div
      className={`relative bg-purple-950/90 rounded-lg border-2 ${
        isInvalid 
          ? 'border-red-500 shadow-red-500/50 shadow-lg' 
          : 'border-purple-700'
      } p-4 mb-3`}
    >
      {/* Delete button - solo se onRemove è definito */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 bg-slate-700/80 hover:bg-red-600 border border-slate-600/50 rounded-md z-10 transition-all duration-200"
          title="Elimina missione"
        >
          <Trash2 className="w-3 h-3 text-gray-400 hover:text-white" />
        </button>
      )}
      
      {/* Collapse/Expand button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-8 right-2 p-1 bg-slate-700/80 hover:bg-slate-600 border border-slate-600/50 rounded-md z-10 transition-all duration-200"
        title={isCollapsed ? "Espandi missione" : "Comprimi missione"}
      >
        {isCollapsed 
          ? <ChevronDown className="w-3 h-3 text-gray-400" />
          : <ChevronUp className="w-3 h-3 text-gray-400" />
        }
      </button>
      
      {/* Controlli Zoom */}
      {(onZoomIn || onZoomOut) && (
        <ZoomControls
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          size="small"
          position="top-left"
          className="opacity-80 hover:opacity-100"
        />
      )}
      
      {/* Drag handle */}
      <div 
        className="absolute -left-3 top-1/2 -translate-y-1/2 p-1 bg-purple-700 hover:bg-purple-600 rounded cursor-move"
        draggable
        onDragStart={onDragStart}
      >
        <GripVertical className="w-3 h-3 text-white" />
      </div>
      
      {/* Header con nome missione */}
      <div className="mb-4 pb-2 border-b border-purple-700/50 pl-8">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          <span className="text-xs font-bold text-purple-300 uppercase">MISSION</span>
          
          {/* Nome missione editabile */}
          <div className="flex-1 flex items-center gap-2">
            {isEditingName ? (
              <>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave();
                    if (e.key === 'Escape') handleNameCancel();
                  }}
                  className="flex-1 bg-slate-800 text-white px-2 py-1 rounded text-sm border border-purple-600 focus:border-purple-400 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleNameSave}
                  className="text-green-400 hover:text-green-300 text-xs"
                >
                  ✓
                </button>
                <button
                  onClick={handleNameCancel}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  ✗
                </button>
              </>
            ) : (
              <>
                <span className="text-white font-medium">
                  {block.missionName || 'Nuova Missione'}
                </span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-purple-400 hover:text-purple-300"
                  title="Modifica nome"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
          
          <span className="text-xs text-gray-400">
            {block.fileName}
          </span>
        </div>
      </div>
      
      {/* Contenuto - visibile solo se non collassato */}
      {!isCollapsed && (
        <div className="space-y-4 pl-8">
          {/* Area Mission principale */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">Missione</span>
              <span className="text-xs text-gray-400">
                ({block.blocksMission?.length || 0} elementi)
              </span>
            </div>
            
            <div className="bg-slate-800/30 rounded-lg border border-purple-700/30 p-3 min-h-[100px]">
              {/* Initial anchor point */}
              <AnchorPoint
                onDragOver={onDragOver}
                onDrop={(e) => onDropAtIndexMission(e, 0)}
                label="Inserisci qui"
              />
              
              {/* Render mission blocks */}
              {block.blocksMission && block.blocksMission.length > 0 ? (
                block.blocksMission.map((child: any, index: number) => (
                  <React.Fragment key={child.id}>
                    {renderChildren([child])}
                    <AnchorPoint
                      onDragOver={onDragOver}
                      onDrop={(e) => onDropAtIndexMission(e, index + 1)}
                      label=""
                    />
                  </React.Fragment>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p className="text-xs">Container vuoto</p>
                  <p className="text-xs text-gray-600 mt-1">Trascina qui i blocchi della missione</p>
                </div>
              )}
            </div>
          </div>

          {/* Area Finish Mission */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flag className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">Fine Missione</span>
              <span className="text-xs text-gray-400">
                ({block.blocksFinish?.length || 0} elementi)
              </span>
            </div>
            
            <div className="bg-slate-800/30 rounded-lg border border-green-700/30 p-3 min-h-[100px]">
              {/* Initial anchor point */}
              <AnchorPoint
                onDragOver={onDragOver}
                onDrop={(e) => onDropAtIndexFinish(e, 0)}
                label="Inserisci qui"
              />
              
              {/* Render finish blocks */}
              {block.blocksFinish && block.blocksFinish.length > 0 ? (
                block.blocksFinish.map((child: any, index: number) => (
                  <React.Fragment key={child.id}>
                    {renderChildren([child])}
                    <AnchorPoint
                      onDragOver={onDragOver}
                      onDrop={(e) => onDropAtIndexFinish(e, index + 1)}
                      label=""
                    />
                  </React.Fragment>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p className="text-xs">Container vuoto</p>
                  <p className="text-xs text-gray-600 mt-1">Trascina qui i blocchi di fine missione</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
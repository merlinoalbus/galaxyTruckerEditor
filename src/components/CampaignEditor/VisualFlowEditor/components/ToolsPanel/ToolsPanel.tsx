import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { TOOL_CATEGORIES, Tool, ToolCategory } from '@/types/CampaignEditor/VisualFlowEditor/ToolCategories';

interface ToolsPanelProps {
  onToolDragStart: (e: React.DragEvent, tool: Tool) => void;
}

interface TooltipData {
  tool: Tool;
  x: number;
  y: number;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({ onToolDragStart }) => {
  // Tutte le categorie chiuse di default (nessuna categoria è sempre visibile ora)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Filtra tools in base alla ricerca (esclusi i comandi Generale che sono sempre visibili)
  const getFilteredTools = (tools: Tool[], categoryId: string) => {
    if (!searchText || categoryId === 'general') return tools;
    const searchLower = searchText.toLowerCase();
    return tools.filter(tool => 
      tool.name.toLowerCase().includes(searchLower) ||
      tool.description?.toLowerCase().includes(searchLower)
    );
  };

  const handleMouseEnter = (e: React.MouseEvent, tool: Tool) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Calcola posizione per il tooltip
    let x = rect.left + rect.width / 2;
    const y = rect.top - 10; // Sopra l'elemento
    
    // Se il tooltip uscirebbe dal lato sinistro, spostalo a destra
    if (x < 150) {
      x = rect.right + 10; // A destra dell'elemento
    }
    
    setTooltipData({ tool, x, y });
  };

  const handleMouseLeave = () => {
    setTooltipData(null);
  };

  const renderTool = (tool: Tool) => {
    const isHovered = tooltipData?.tool.id === tool.id;
    
    // Determina la classe in base allo stato
    let toolClass = '';
    if (tool.inProgress) {
      // Comandi in corso di implementazione - giallo
      toolClass = 'bg-yellow-700 hover:bg-yellow-600 cursor-move hover:shadow-lg';
    } else if (tool.implemented) {
      // Comandi implementati - blu/slate
      toolClass = 'bg-slate-700 hover:bg-slate-600 cursor-move hover:shadow-lg';
    } else {
      // Comandi non implementati - grigi
      toolClass = 'bg-gray-800 opacity-40 cursor-not-allowed';
    }

    const isDraggable = tool.implemented || tool.inProgress;

    return (
      <div
        key={tool.id}
        draggable={isDraggable}
        onDragStart={(e) => isDraggable && onToolDragStart(e, tool)}
        onMouseEnter={(e) => handleMouseEnter(e, tool)}
        onMouseLeave={handleMouseLeave}
        className={`relative ${toolClass} rounded-lg p-2 transition-all duration-200 transform ${isHovered && isDraggable ? 'scale-110 z-10' : ''}`}
        title=""
      >
        {/* Icona principale - solo icona nel pulsante */}
        <div className="text-xl text-center select-none">
          {tool.icon}
        </div>
      </div>
    );
  };

  const renderCategory = (category: ToolCategory) => {
    const isExpanded = expandedCategories.has(category.id);
    const filteredTools = getFilteredTools(category.tools, category.id);
    
    // Non mostrare categoria se nessun tool corrisponde alla ricerca (tranne Generale)
    if (searchText && filteredTools.length === 0 && category.id !== 'general') return null;

    // Conta strumenti implementati o in sviluppo
    const activeCount = filteredTools.filter(t => t.implemented || t.inProgress).length;

    return (
      <div key={category.id} className="mb-3">
        {/* Header categoria */}
        <div
          onClick={() => toggleCategory(category.id)}
          className={`flex items-center gap-2 text-white font-medium mb-2 cursor-pointer 
            hover:text-blue-400 transition-colors px-2 py-1 rounded`}
        >
          <span className="text-sm">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
          <span className="text-lg">{category.icon}</span>
          <span className="text-sm flex-1">{category.name}</span>
          <span className="text-xs text-gray-400">
            {activeCount}/{filteredTools.length}
          </span>
        </div>
        
        {/* Tools della categoria - griglia di sole icone */}
        {isExpanded && (
          <div className="grid grid-cols-5 gap-1 ml-6">
            {filteredTools.map(tool => renderTool(tool))}
          </div>
        )}
      </div>
    );
  };

  // Ottieni i comandi Generale
  const generalCategory = TOOL_CATEGORIES.find(cat => cat.id === 'general');
  const generalTools = generalCategory?.tools || [];

  // Ottieni altre categorie (Costrutti come primo elemento)
  const otherCategories = TOOL_CATEGORIES.filter(cat => cat.id !== 'general');
  // Riordina per mettere Costrutti per primo
  const sortedCategories = [
    ...otherCategories.filter(cat => cat.id === 'constructs'),
    ...otherCategories.filter(cat => cat.id !== 'constructs')
  ];

  return (
    <>
      <div className="w-80 bg-slate-800 h-full flex flex-col">
        {/* Header fisso con comandi Generale */}
        <div className="bg-slate-900 border-b border-slate-700">
          <div className="p-4 pb-2">
            <h4 className="text-white font-bold text-lg mb-3">🛠️ Strumenti</h4>
            
            {/* Comandi Generale sempre visibili - non filtrabili */}
            {generalTools.length > 0 && (
              <div className="mb-3">
                <div className="grid grid-cols-6 gap-1">
                  {generalTools.map(tool => renderTool(tool))}
                </div>
              </div>
            )}
            
            {/* Campo ricerca (non filtra i comandi Generale) */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca comando..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-700 text-white rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm
                  placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Area scrollabile con categorie */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Categorie filtrabili */}
          <div>
            {sortedCategories.map(category => renderCategory(category))}
          </div>
        </div>
        
        {/* Footer info - ridotto e posizionato più in basso */}
        <div className="p-2 bg-slate-900 border-t border-slate-700 text-xs text-gray-500 text-center" 
             style={{ paddingBottom: '2.5%' }}>
          <div className="text-[10px] leading-tight">
            ✋ Trascina 🖱️ Info
          </div>
        </div>
      </div>

      {/* Tooltip renderizzato tramite Portal */}
      {tooltipData && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl border border-gray-700 
            whitespace-nowrap pointer-events-none"
          style={{ 
            left: `${tooltipData.x}px`,
            top: `${tooltipData.y}px`,
            transform: tooltipData.x < 150 ? 'translateY(-100%)' : 'translate(-50%, -100%)',
            zIndex: 9999
          }}
        >
          <div className="font-bold text-sm">{tooltipData.tool.name}</div>
          {tooltipData.tool.description && (
            <div className="text-xs text-gray-300 mt-1">{tooltipData.tool.description}</div>
          )}
          {tooltipData.tool.inProgress && (
            <div className="text-xs text-yellow-400 mt-1">⚠️ In sviluppo</div>
          )}
          {!tooltipData.tool.implemented && !tooltipData.tool.inProgress && (
            <div className="text-xs text-orange-400 mt-1">⚠️ Non implementato</div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
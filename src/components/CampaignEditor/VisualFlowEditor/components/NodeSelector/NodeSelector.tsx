import React, { useEffect, useMemo, useState } from 'react';
import { Search, Check } from 'lucide-react';
import { useTranslation } from '@/locales';
import type { MapNode } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { interactiveMapService } from '@/services/CampaignEditor/InteractiveMap/interactiveMapService';
import { API_CONFIG } from '@/config/constants';

interface NodeSelectorProps {
  value: string;
  onChange: (nodeName: string) => void;
  className?: string;
  nodes?: MapNode[]; // opzionale: se non passato, li carica via servizio
  forceColumns?: number;
  excludeNodes?: string[]; // nodi da escludere/nascondere dalla lista
}

export const NodeSelector: React.FC<NodeSelectorProps> = ({
  value,
  onChange,
  className = '',
  nodes: propsNodes,
  forceColumns,
  excludeNodes = []
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [loadedNodes, setLoadedNodes] = useState<MapNode[]>([]);
  const nodes = useMemo(() => propsNodes ?? loadedNodes, [propsNodes, loadedNodes]);

  // Carica i nodi se non forniti
  useEffect(() => {
    if (!propsNodes) {
      interactiveMapService.loadNodes().then(setLoadedNodes).catch(() => setLoadedNodes([]));
    }
  }, [propsNodes]);

  const filteredNodes = useMemo(() => {
    let nodesToFilter = nodes.filter(n => !excludeNodes.includes(n.name));
    
    if (!searchTerm) return nodesToFilter;
    const term = searchTerm.toLowerCase();
    return nodesToFilter.filter(n => {
      const name = (n.name || '').toLowerCase();
      const caption = (n.localizedCaptions?.EN || n.caption || '').toLowerCase();
      return name.includes(term) || caption.includes(term);
    });
  }, [nodes, searchTerm, excludeNodes]);

  const getNodeImage = (node: MapNode): string | null => {
    if (node.imageBinary) return `data:image/png;base64,${node.imageBinary}`;
    if (node.imagePath) return node.imagePath;
    return null;
  };

  // Fallback image: meteor_small from game static assets
  const fallbackMeteor = `${API_CONFIG.ASSETS_BASE_URL}/meteor_small.png`;

  return (
    <div className={`${className} h-full flex flex-col`}>
      <div className="mb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('visualFlowEditor.blocks.nodeSelector.search')}
            className="w-full pl-7 pr-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white placeholder-gray-500"
            style={{ height: '28px' }}
          />
        </div>
      </div>

      <div className="overflow-y-auto bg-slate-800 border border-slate-600 rounded p-1 flex-1" style={{ minHeight: 0 }}>
        <div
          className={`grid gap-1 ${!forceColumns ? 'grid-cols-8' : ''}`}
          style={forceColumns ? { gridTemplateColumns: `repeat(${forceColumns}, minmax(0, 1fr))` } : {}}
        >
          {/* Opzione Nessuno / None */}
          <div
            onClick={() => onChange('')}
            className={`relative cursor-pointer transition-all rounded p-1 flex flex-col items-center ${value === '' ? 'ring-1 ring-teal-500 bg-slate-700' : 'hover:bg-slate-700'}`}
            title={t('visualFlowEditor.blocks.nodeSelector.none')}
          >
            <div className="w-full aspect-square mb-0.5 overflow-hidden rounded transform scale-90">
              <img
                src={fallbackMeteor}
                alt="none"
                className="w-full h-full object-contain border border-slate-600 bg-slate-800"
                style={{ objectPosition: 'center' }}
                onError={(e) => {
                  // Graceful fallback to a simple placeholder if image missing
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div className="text-[9px] text-gray-300 text-center truncate w-full leading-tight">{t('visualFlowEditor.blocks.nodeSelector.none')}</div>
            {value === '' && (
              <div className="absolute top-0.5 right-0.5">
                <Check className="w-2.5 h-2.5 text-teal-400" />
              </div>
            )}
          </div>

          {filteredNodes.map((node) => {
            const imageUrl = getNodeImage(node);
            const isSelected = value === node.name;
            const label = node.localizedCaptions?.EN || node.caption || node.name;
            return (
              <div
                key={node.name}
                onClick={() => onChange(node.name)}
                className={`relative cursor-pointer transition-all rounded p-1 flex flex-col items-center ${isSelected ? 'ring-1 ring-teal-500 bg-slate-700' : 'hover:bg-slate-700'}`}
                title={label}
              >
                <div className="w-full aspect-square mb-0.5 overflow-hidden rounded transform scale-90">
                  <img
                    src={imageUrl || fallbackMeteor}
                    alt={node.name}
                    className="w-full h-full object-cover border border-slate-600 bg-slate-700"
                    style={{ objectPosition: 'center' }}
                    onError={(e) => {
                      // If both specific and fallback fail, hide img and show minimal placeholder
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  {!imageUrl && (
                    <></>
                  )}
                </div>
                <div className="text-[9px] text-gray-300 text-center truncate w-full leading-tight">{label}</div>
                {isSelected && (
                  <div className="absolute top-0.5 right-0.5">
                    <Check className="w-2.5 h-2.5 text-teal-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ArrowRight, Star, Lock, PlayCircle, Users, Clock, Zap, Edit3 } from 'lucide-react';
import { CampaignMissionEditor } from './CampaignMissionEditor';
import { getCampaignMapImage } from '../../utils/imageUtils';

interface CampaignMission {
  name: string;
  source: string;
  destination: string;
  missiontype: 'NORMAL' | 'UNIQUE';
  license: string;
  button: string[];
  caption: string;
  description: string;
}

interface CampaignNode {
  name: string;
  coordinates?: [number, number];
  image?: string;
  caption?: string;
  description?: string;
  shuttles?: [string, number][];
  buttons?: [string, string, string][];
}

interface FlowVisualizerProps {
  missions: CampaignMission[];
  nodes: CampaignNode[];
  onMissionSelect: (mission: CampaignMission) => void;
  onMissionSave: (mission: CampaignMission) => void;
  selectedMission: CampaignMission | null;
}

interface VisualNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  image?: string;
  missions: CampaignMission[];
  connections: string[];
}

export function CampaignFlowVisualizer({ missions, nodes, onMissionSelect, onMissionSave, selectedMission }: FlowVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [visualNodes, setVisualNodes] = useState<VisualNode[]>([]);
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [editingMission, setEditingMission] = useState<CampaignMission | null>(null);

  useEffect(() => {
    generateVisualLayout();
  }, [missions, nodes]);

  const getNodeTypeFromImage = (imageName: string): string => {
    if (!imageName) return 'default';
    const name = imageName.toLowerCase();
    if (name.includes('newbie')) return 'start';
    if (name.includes('spacebar') || name.includes('bar')) return 'bar';
    if (name.includes('outpost') || name.includes('regula')) return 'dock';
    if (name.includes('workshop') || name.includes('forge') || name.includes('lab')) return 'shop';
    if (name.includes('club') || name.includes('mine')) return 'end';
    if (name.includes('home')) return 'home';
    return 'default';
  };

  const generateVisualLayout = () => {
    if (!missions || !nodes || missions.length === 0 || nodes.length === 0) return;

    // Create a map of node positions
    const nodePositions = new Map<string, { x: number; y: number }>();
    nodes.forEach((node, index) => {
      if (node.coordinates) {
        nodePositions.set(node.name, { 
          x: node.coordinates[0] / 5, // Scale down from game coordinates
          y: node.coordinates[1] / 5 
        });
      } else {
        // Auto-layout for nodes without positions
        const angle = (index / nodes.length) * 2 * Math.PI;
        const radius = 250;
        nodePositions.set(node.name, {
          x: 400 + Math.cos(angle) * radius,
          y: 300 + Math.sin(angle) * radius
        });
      }
    });

    // Group missions by source node
    const missionsByNode = new Map<string, CampaignMission[]>();
    missions.forEach(mission => {
      const source = mission.source;
      if (!missionsByNode.has(source)) {
        missionsByNode.set(source, []);
      }
      missionsByNode.get(source)!.push(mission);
    });

    // Create visual nodes
    const vNodes: VisualNode[] = nodes.filter(node => node && node.name).map(node => {
      const pos = nodePositions.get(node.name) || { x: 0, y: 0 };
      // Infer node type from image name or other properties
      const nodeType = getNodeTypeFromImage(node.image || '');
      
      return {
        id: node.name,
        name: node.caption || node.name,
        type: nodeType,
        x: pos.x,
        y: pos.y,
        image: node.image,
        missions: missionsByNode.get(node.name) || [],
        connections: node.shuttles?.map(s => s[0]) || []
      };
    });

    setVisualNodes(vNodes);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = (e.clientX - lastPanPoint.x) / scale;
      const deltaY = (e.clientY - lastPanPoint.y) / scale;
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY !== 0) {
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.max(0.5, Math.min(3, prev * scaleFactor)));
    }
  };

  const getNodeColor = (type: string) => {
    if (!type) return '#6B7280'; // gray
    switch (type.toLowerCase()) {
      case 'start': return '#10B981'; // green
      case 'end': return '#EF4444'; // red
      case 'shop': return '#F59E0B'; // amber
      case 'bar': return '#8B5CF6'; // purple
      case 'dock': return '#06B6D4'; // cyan
      case 'home': return '#EC4899'; // pink
      default: return '#6B7280'; // gray
    }
  };

  const getNodeIcon = (type: string) => {
    if (!type) return <MapPin className="w-4 h-4" />;
    switch (type.toLowerCase()) {
      case 'start': return <PlayCircle className="w-4 h-4" />;
      case 'end': return <Star className="w-4 h-4" />;
      case 'shop': return <MapPin className="w-4 h-4" />;
      case 'bar': return <Users className="w-4 h-4" />;
      case 'dock': return <Zap className="w-4 h-4" />;
      case 'home': return <MapPin className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const renderConnections = () => {
    const connections: JSX.Element[] = [];
    
    visualNodes.forEach(node => {
      node.connections.forEach(targetId => {
        const target = visualNodes.find(n => n.id === targetId);
        if (target) {
          const key = `${node.id}-${targetId}`;
          connections.push(
            <line
              key={key}
              x1={node.x}
              y1={node.y}
              x2={target.x}
              y2={target.y}
              stroke="#4B5563"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.6"
            />
          );
          
          // Arrow marker
          const midX = (node.x + target.x) / 2;
          const midY = (node.y + target.y) / 2;
          const angle = Math.atan2(target.y - node.y, target.x - node.x);
          
          connections.push(
            <polygon
              key={`${key}-arrow`}
              points="0,-4 8,0 0,4"
              fill="#4B5563"
              transform={`translate(${midX},${midY}) rotate(${angle * 180 / Math.PI}) scale(0.8)`}
              opacity="0.6"
            />
          );
        }
      });
    });
    
    return connections;
  };

  const renderMissionRoutes = () => {
    const routes: JSX.Element[] = [];
    
    missions.forEach((mission, index) => {
      const source = visualNodes.find(n => n.id === mission.source);
      const destination = visualNodes.find(n => n.id === mission.destination);
      
      if (source && destination && source.id !== destination.id) {
        const isSelected = selectedMission?.name === mission.name;
        const strokeColor = mission.missiontype === 'UNIQUE' ? '#A855F7' : '#3B82F6';
        const strokeWidth = isSelected ? '4' : '2';
        const opacity = isSelected ? '1' : '0.7';
        
        routes.push(
          <line
            key={`route-${index}`}
            x1={source.x}
            y1={source.y}
            x2={destination.x}
            y2={destination.y}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
            className="cursor-pointer hover:opacity-100"
            onClick={() => onMissionSelect(mission)}
          />
        );
        
        // Mission label at midpoint
        const midX = (source.x + destination.x) / 2;
        const midY = (source.y + destination.y) / 2;
        
        routes.push(
          <g key={`route-label-${index}`}>
            <rect
              x={midX - 30}
              y={midY - 8}
              width="60"
              height="16"
              fill="rgba(0,0,0,0.8)"
              rx="8"
              className="cursor-pointer"
              onClick={() => onMissionSelect(mission)}
            />
            <text
              x={midX}
              y={midY + 3}
              textAnchor="middle"
              className="fill-white text-xs cursor-pointer"
              onClick={() => onMissionSelect(mission)}
            >
              {mission.license}
            </text>
          </g>
        );
      }
    });
    
    return routes;
  };

  return (
    <div className="w-full h-full bg-gt-primary rounded-lg overflow-hidden relative">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        <button
          onClick={() => {
            setScale(1);
            setPanOffset({ x: 0, y: 0 });
          }}
          className="px-3 py-1 bg-gt-secondary text-white rounded text-sm hover:bg-gt-secondary/80"
        >
          Reset View
        </button>
        <span className="text-white text-sm bg-gt-secondary/80 px-2 py-1 rounded">
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* Help Text */}
      <div className="absolute bottom-4 right-4 z-10 bg-gt-secondary/90 rounded-lg p-3 text-sm max-w-xs">
        <h4 className="text-white font-medium mb-2">💡 Come modificare le missioni:</h4>
        <div className="space-y-1 text-xs text-gray-300">
          <p>1. <strong>Clicca su una rotta</strong> (linea blu/viola)</p>
          <p>2. <strong>Vedi dettagli</strong> nel pannello in basso</p>
          <p>3. <strong>Clicca "Modifica"</strong> per aprire l'editor</p>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-gt-secondary/90 rounded-lg p-3 text-sm">
        <h4 className="text-white font-medium mb-2">Legenda</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-300">Missione Normale</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-gray-300">Missione Unica</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-1 bg-gray-500 rounded"></div>
            <span className="text-gray-300">Connessione</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        viewBox={`${-panOffset.x / scale} ${-panOffset.y / scale} ${800 / scale} ${600 / scale}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Grid Pattern */}
        <defs>
          <pattern id="grid" width={20 / scale} height={20 / scale} patternUnits="userSpaceOnUse">
            <path d={`M ${20 / scale} 0 L 0 0 0 ${20 / scale}`} fill="none" stroke="#374151" strokeWidth={0.5 / scale} opacity="0.3"/>
          </pattern>
        </defs>
        <rect x={-panOffset.x / scale} y={-panOffset.y / scale} width={800 / scale} height={600 / scale} fill="url(#grid)" />

        {/* Connections */}
        <g>{renderConnections()}</g>

        {/* Mission Routes */}
        <g>{renderMissionRoutes()}</g>

        {/* Nodes */}
        {visualNodes.filter(node => node && node.id).map(node => (
          <g key={node.id}>
            {/* Node Circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r="25"
              fill={getNodeColor(node.type)}
              stroke="#FFFFFF"
              strokeWidth="3"
              className="drop-shadow-lg"
            />
            
            {/* Node Image */}
            <foreignObject
              x={node.x - 20}
              y={node.y - 20}
              width="40"
              height="40"
            >
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-white shadow-lg">
                <img
                  src={getCampaignMapImage(node.image || 'unknown.png')}
                  alt={node.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback all'icona se l'immagine non si carica
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-full bg-gray-600 flex items-center justify-center text-white">
                  {getNodeIcon(node.type)}
                </div>
              </div>
            </foreignObject>
            
            {/* Node Label */}
            <text
              x={node.x}
              y={node.y + 40}
              textAnchor="middle"
              className="fill-white text-sm font-medium"
            >
              {node.name}
            </text>
            
            {/* Mission Count Badge */}
            {node.missions.length > 0 && (
              <g>
                <circle
                  cx={node.x + 20}
                  cy={node.y - 20}
                  r="8"
                  fill="#EF4444"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <text
                  x={node.x + 20}
                  y={node.y - 16}
                  textAnchor="middle"
                  className="fill-white text-xs font-bold"
                >
                  {node.missions.length}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>

      {/* Mission Details Panel */}
      {selectedMission && (
        <div className="absolute bottom-4 left-4 right-4 bg-gt-secondary/95 rounded-lg p-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-bold text-lg">{selectedMission.caption}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  selectedMission.missiontype === 'UNIQUE' 
                    ? 'bg-purple-600' 
                    : 'bg-blue-600'
                }`}>
                  {selectedMission.missiontype}
                </span>
                <span className="px-2 py-1 bg-gray-600 rounded text-xs">
                  {selectedMission.license}
                </span>
              </div>
              <p className="text-gray-300 text-sm mb-2">{selectedMission.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Route: {selectedMission.source} → {selectedMission.destination}</span>
                <span>ID: {selectedMission.name}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => setEditingMission(selectedMission)}
                className="px-3 py-1 bg-gt-accent hover:bg-gt-accent/80 rounded text-sm flex items-center space-x-1"
              >
                <Edit3 className="w-4 h-4" />
                <span>Modifica</span>
              </button>
              <button
                onClick={() => onMissionSelect(null as any)}
                className="px-3 py-1 bg-gt-primary hover:bg-gt-primary/80 rounded text-sm"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mission Editor Modal */}
      {editingMission && (
        <CampaignMissionEditor
          mission={editingMission}
          onClose={() => setEditingMission(null)}
          onSave={(mission) => {
            onMissionSave(mission);
            setEditingMission(null);
          }}
        />
      )}
    </div>
  );
}
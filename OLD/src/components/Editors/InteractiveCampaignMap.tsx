import React, { useState, useEffect, useRef } from 'react';
import { Play, Edit, FileText, ArrowRight } from 'lucide-react';
import yaml from 'js-yaml';

interface MapNode {
  name: string;
  coordinates: [number, number];
  image: string;
  caption: string;
  description: string;
  shuttles?: Array<[string, number]>;
  buttons?: Array<[string, string, string]>;
}

interface MapConnection {
  from: string;
  to: string;
  cost: number;
}

interface Script {
  name: string;
  commands: any[];
  relatedNodes: string[];
  relatedConnections: string[];
}

interface InteractiveCampaignMapProps {
  onNodeClick: (node: MapNode, scripts: Script[]) => void;
  onConnectionClick: (connection: MapConnection, scripts: Script[]) => void;
}

export function InteractiveCampaignMap({ onNodeClick, onConnectionClick }: InteractiveCampaignMapProps) {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [connections, setConnections] = useState<MapConnection[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapDimensions, setMapDimensions] = useState({ width: 2200, height: 2800 });
  const [viewBox, setViewBox] = useState('0 0 2200 2800');
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);

      // Load nodes configuration from EN folder
      const nodesResponse = await fetch('http://localhost:3001/api/campaignMissions/nodes.yaml');
      const nodesData = await nodesResponse.json();
      
      // Parse YAML content
      let parsedNodes: MapNode[] = [];
      if (nodesData.content) {
        try {
          parsedNodes = yaml.load(nodesData.content) as MapNode[];
          if (!Array.isArray(parsedNodes)) {
            console.error('Parsed nodes is not an array');
            parsedNodes = [];
          }
        } catch (e) {
          console.error('Failed to parse nodes YAML:', e);
          parsedNodes = [];
        }
      }
      
      // Build connections from shuttles data
      const connections: MapConnection[] = [];
      parsedNodes.forEach(node => {
        if (node.shuttles) {
          node.shuttles.forEach(([targetNode, cost]) => {
            connections.push({
              from: node.name,
              to: targetNode,
              cost: cost
            });
          });
        }
      });

      // Load all script files to identify connections to nodes
      const scriptFiles = ['tutorials.txt', 'scripts1.txt', 'scripts2.txt', 'scripts3.txt', 'scripts4.txt', 'scripts5.txt', 'missions.txt', 'inits.txt'];
      const allScripts: Script[] = [];

      for (const fileName of scriptFiles) {
        try {
          const response = await fetch(`http://localhost:3001/api/campaign/${fileName}`);
          const data = await response.json();
          const scriptContent = data.content || '';
          const parsedScripts = parseScriptFile(scriptContent, fileName);
          allScripts.push(...parsedScripts);
        } catch (error) {
          console.warn(`Could not load ${fileName}:`, error);
        }
      }

      // Analyze script connections to nodes and paths
      allScripts.forEach(script => {
        script.relatedNodes = findRelatedNodes(script, parsedNodes);
        script.relatedConnections = findRelatedConnections(script, connections);
      });

      setNodes(parsedNodes);
      setConnections(connections);
      setScripts(allScripts);
      
      // Calculate map bounds
      const minX = Math.min(...parsedNodes.map(n => n.coordinates[0]));
      const maxX = Math.max(...parsedNodes.map(n => n.coordinates[0]));
      const minY = Math.min(...parsedNodes.map(n => n.coordinates[1]));
      const maxY = Math.max(...parsedNodes.map(n => n.coordinates[1]));
      
      const padding = 200;
      const width = maxX - minX + padding * 2;
      const height = maxY - minY + padding * 2;
      
      setMapDimensions({ width, height });
      setViewBox(`${minX - padding} ${minY - padding} ${width} ${height}`);
      
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseScriptFile = (content: string, fileName: string): Script[] => {
    const scripts: Script[] = [];
    const lines = content.split('\n');
    let currentScript: any = null;
    let currentCommands: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('SCRIPT ')) {
        // Save previous script if exists
        if (currentScript) {
          scripts.push({
            name: currentScript.name,
            commands: currentCommands,
            relatedNodes: [],
            relatedConnections: []
          });
        }
        
        // Start new script
        const scriptName = line.replace('SCRIPT ', '').trim();
        currentScript = { name: scriptName, file: fileName };
        currentCommands = [];
      } else if (line === 'END_OF_SCRIPT') {
        // End current script
        if (currentScript) {
          scripts.push({
            name: currentScript.name,
            commands: currentCommands,
            relatedNodes: [],
            relatedConnections: []
          });
          currentScript = null;
          currentCommands = [];
        }
      } else if (currentScript && line && !line.startsWith('SCRIPTS')) {
        // Add command to current script
        currentCommands.push({
          line: i + 1,
          content: line,
          type: identifyCommandType(line)
        });
      }
    }

    return scripts;
  };

  const identifyCommandType = (line: string): string => {
    const upperLine = line.toUpperCase().trim();
    
    if (upperLine.startsWith('SHOWDLGSCENE')) return 'dialog_start';
    if (upperLine.startsWith('HIDEDLGSCENE')) return 'dialog_end';
    if (upperLine.startsWith('SHOWCHAR')) return 'show_character';
    if (upperLine.startsWith('HIDECHAR')) return 'hide_character';
    if (upperLine.startsWith('CHANGECHAR')) return 'change_character';
    if (upperLine.startsWith('SAY')) return 'dialogue';
    if (upperLine.startsWith('ASK')) return 'question';
    if (upperLine.startsWith('MENU')) return 'menu_start';
    if (upperLine.startsWith('END_OF_MENU')) return 'menu_end';
    if (upperLine.startsWith('OPT')) return 'menu_option';
    if (upperLine.startsWith('END_OF_OPT')) return 'menu_option_end';
    if (upperLine.startsWith('EXIT_MENU')) return 'menu_exit';
    if (upperLine.startsWith('IF') || upperLine.startsWith('IFNOT')) return 'condition_start';
    if (upperLine.startsWith('ELSE')) return 'condition_else';
    if (upperLine.startsWith('END_OF_IF')) return 'condition_end';
    if (upperLine.startsWith('SET')) return 'variable_set';
    if (upperLine.startsWith('RESET')) return 'variable_reset';
    if (upperLine.startsWith('DELAY')) return 'delay';
    if (upperLine.startsWith('LABEL')) return 'label';
    if (upperLine.startsWith('GO')) return 'goto';
    if (upperLine.startsWith('SUB_SCRIPT')) return 'subscript';
    if (upperLine.startsWith('ACT_MISSION')) return 'start_mission';
    if (upperLine.startsWith('SETCREDITS')) return 'set_credits';
    if (upperLine.startsWith('CENTERMAPBYNODE')) return 'center_map';
    if (upperLine.startsWith('ADDINFOWINDOW') || upperLine.startsWith('SHOWINFOWINDOW')) return 'info_window';
    if (upperLine.startsWith('SETFLIGHTSTATUSBAR')) return 'status_bar';
    
    return 'unknown';
  };

  const findRelatedNodes = (script: Script, nodes: MapNode[]): string[] => {
    const relatedNodes: string[] = [];
    const scriptContent = script.commands.map(cmd => cmd.content).join(' ').toLowerCase();
    
    // Look for direct node references
    nodes.forEach(node => {
      if (scriptContent.includes(node.name.toLowerCase()) ||
          scriptContent.includes(node.caption.toLowerCase().replace(/\s+/g, ''))) {
        relatedNodes.push(node.name);
      }
    });

    // Look for CenterMapByNode commands
    script.commands.forEach(cmd => {
      if (cmd.type === 'center_map') {
        const match = cmd.content.match(/CenterMapByNode\s+(\w+)/i);
        if (match && !relatedNodes.includes(match[1])) {
          relatedNodes.push(match[1]);
        }
      }
    });

    return relatedNodes;
  };

  const findRelatedConnections = (script: Script, connections: MapConnection[]): string[] => {
    const relatedConnections: string[] = [];
    const scriptContent = script.commands.map(cmd => cmd.content).join(' ').toLowerCase();
    
    // Look for references to paths/shuttles between nodes
    connections.forEach(conn => {
      const connectionId = `${conn.from}-${conn.to}`;
      if (scriptContent.includes(conn.from.toLowerCase()) && 
          scriptContent.includes(conn.to.toLowerCase())) {
        relatedConnections.push(connectionId);
      }
    });

    return relatedConnections;
  };

  const handleNodeClick = (node: MapNode) => {
    const relatedScripts = scripts.filter(script => 
      script.relatedNodes.includes(node.name) ||
      (node.buttons && node.buttons.some(btn => 
        script.name.toLowerCase().includes(btn[1].toLowerCase())
      ))
    );
    
    setSelectedNode(node.name);
    onNodeClick(node, relatedScripts);
  };

  const handleConnectionClick = (connection: MapConnection) => {
    const connectionId = `${connection.from}-${connection.to}`;
    const relatedScripts = scripts.filter(script => 
      script.relatedConnections.includes(connectionId)
    );
    
    setSelectedConnection(connectionId);
    onConnectionClick(connection, relatedScripts);
  };

  const getNodeScreenPosition = (node: MapNode) => {
    return {
      x: node.coordinates[0],
      y: node.coordinates[1]
    };
  };

  const renderConnection = (connection: MapConnection) => {
    const fromNode = nodes.find(n => n.name === connection.from);
    const toNode = nodes.find(n => n.name === connection.to);
    
    if (!fromNode || !toNode) return null;

    const fromPos = getNodeScreenPosition(fromNode);
    const toPos = getNodeScreenPosition(toNode);
    
    const connectionId = `${connection.from}-${connection.to}`;
    const isSelected = selectedConnection === connectionId;
    const isHovered = hoveredElement === connectionId;
    const hasScripts = scripts.some(script => script.relatedConnections.includes(connectionId));

    return (
      <g key={connectionId}>
        {/* Connection line */}
        <line
          x1={fromPos.x}
          y1={fromPos.y}
          x2={toPos.x}
          y2={toPos.y}
          stroke={hasScripts ? '#fbbf24' : '#64748b'}
          strokeWidth={isSelected ? 4 : isHovered ? 3 : 2}
          strokeOpacity={hasScripts ? 0.8 : 0.4}
          strokeDasharray={hasScripts ? '0' : '5,5'}
          className="cursor-pointer transition-all duration-200"
          onMouseEnter={() => setHoveredElement(connectionId)}
          onMouseLeave={() => setHoveredElement(null)}
          onClick={() => handleConnectionClick(connection)}
        />
        
        {/* Cost label */}
        <text
          x={(fromPos.x + toPos.x) / 2}
          y={(fromPos.y + toPos.y) / 2}
          textAnchor="middle"
          className={`text-xs fill-white pointer-events-none ${isHovered ? 'font-bold' : ''}`}
          dy="-5"
        >
          {connection.cost}
        </text>

        {/* Script indicator */}
        {hasScripts && (
          <circle
            cx={(fromPos.x + toPos.x) / 2}
            cy={(fromPos.y + toPos.y) / 2 + 15}
            r="8"
            fill="#fbbf24"
            stroke="#1f2937"
            strokeWidth="2"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredElement(connectionId)}
            onMouseLeave={() => setHoveredElement(null)}
            onClick={() => handleConnectionClick(connection)}
          >
            <title>Scripts available for this connection</title>
          </circle>
        )}
      </g>
    );
  };

  const renderNode = (node: MapNode) => {
    const pos = getNodeScreenPosition(node);
    const isSelected = selectedNode === node.name;
    const isHovered = hoveredElement === node.name;
    const relatedScripts = scripts.filter(script => script.relatedNodes.includes(node.name));
    const hasScripts = relatedScripts.length > 0;
    const hasButtons = node.buttons && node.buttons.length > 0;

    return (
      <g key={node.name}>
        {/* Node background circle */}
        <circle
          cx={pos.x}
          cy={pos.y}
          r={isSelected ? 45 : isHovered ? 40 : 35}
          fill={hasScripts ? '#fbbf24' : '#374151'}
          stroke={isSelected ? '#fbbf24' : hasScripts ? '#f59e0b' : '#6b7280'}
          strokeWidth={isSelected ? 4 : 2}
          className="cursor-pointer transition-all duration-200"
          onMouseEnter={() => setHoveredElement(node.name)}
          onMouseLeave={() => setHoveredElement(null)}
          onClick={() => handleNodeClick(node)}
        />

        {/* Node image placeholder (we'll load actual images later) */}
        <circle
          cx={pos.x}
          cy={pos.y}
          r={25}
          fill="#1f2937"
          stroke="#4b5563"
          strokeWidth="1"
          className="pointer-events-none"
        />

        {/* Node caption */}
        <text
          x={pos.x}
          y={pos.y + 55}
          textAnchor="middle"
          className={`text-sm fill-white pointer-events-none ${isHovered ? 'font-bold' : ''}`}
        >
          {node.caption}
        </text>

        {/* Script count indicator */}
        {hasScripts && (
          <g>
            <circle
              cx={pos.x + 25}
              cy={pos.y - 25}
              r="12"
              fill="#ef4444"
              stroke="#1f2937"
              strokeWidth="2"
              className="cursor-pointer"
            />
            <text
              x={pos.x + 25}
              y={pos.y - 25}
              textAnchor="middle"
              dy="4"
              className="text-xs fill-white font-bold pointer-events-none"
            >
              {relatedScripts.length}
            </text>
          </g>
        )}

        {/* Button indicator */}
        {hasButtons && (
          <circle
            cx={pos.x - 25}
            cy={pos.y - 25}
            r="8"
            fill="#22c55e"
            stroke="#1f2937"
            strokeWidth="2"
            className="cursor-pointer"
          >
            <title>{node.buttons!.length} interactive buttons available</title>
          </circle>
        )}
      </g>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gt-primary rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gt-accent mb-4"></div>
          <p className="text-white">Loading campaign map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gt-primary rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Interactive Campaign Map</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span>Has Scripts</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Script Count</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Interactive Buttons</span>
          </div>
        </div>
      </div>

      {/* Map SVG */}
      <div className="bg-slate-800 rounded-lg overflow-hidden" style={{ height: '600px' }}>
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="w-full h-full"
          style={{ background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)' }}
        >
          {/* Render connections first (so they appear behind nodes) */}
          {connections.map(connection => renderConnection(connection))}
          
          {/* Render nodes */}
          {nodes.map(node => renderNode(node))}
        </svg>
      </div>

      {/* Selected element info */}
      {(selectedNode || selectedConnection) && (
        <div className="mt-4 p-4 bg-gt-secondary rounded-lg">
          {selectedNode && (
            <div>
              <h4 className="font-bold text-white mb-2">
                {nodes.find(n => n.name === selectedNode)?.caption}
              </h4>
              <p className="text-gray-300 text-sm mb-2">
                {nodes.find(n => n.name === selectedNode)?.description}
              </p>
              <div className="text-sm text-gray-400">
                Scripts: {scripts.filter(s => s.relatedNodes.includes(selectedNode)).length}
              </div>
            </div>
          )}
          {selectedConnection && (
            <div>
              <h4 className="font-bold text-white mb-2">
                Connection: {selectedConnection.replace('-', ' → ')}
              </h4>
              <div className="text-sm text-gray-400">
                Scripts: {scripts.filter(s => s.relatedConnections.includes(selectedConnection)).length}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
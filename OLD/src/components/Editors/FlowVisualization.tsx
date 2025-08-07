import React from 'react';
import { 
  MessageSquare,
  Clock,
  User,
  BarChart3,
  Menu,
  MapPin,
  GitBranch,
  ArrowDown,
  ArrowRight
} from 'lucide-react';

interface ScriptBlock {
  id: string;
  type: string;
  line: number;
}

interface FlowVisualizationProps {
  blocks: ScriptBlock[];
  selectedBlockId?: string | null;
  onBlockSelect: (blockId: string) => void;
}

export function FlowVisualization({ blocks, selectedBlockId, onBlockSelect }: FlowVisualizationProps) {
  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'dialogue': return <MessageSquare className="w-4 h-4" />;
      case 'delay': return <Clock className="w-4 h-4" />;
      case 'character': return <User className="w-4 h-4" />;
      case 'stats': return <BarChart3 className="w-4 h-4" />;
      case 'menu': return <Menu className="w-4 h-4" />;
      case 'node': return <MapPin className="w-4 h-4" />;
      default: return <GitBranch className="w-4 h-4" />;
    }
  };

  const getBlockColor = (type: string) => {
    switch (type) {
      case 'dialogue': return 'bg-green-900/30 border-green-500 text-green-200';
      case 'delay': return 'bg-yellow-900/30 border-yellow-500 text-yellow-200';
      case 'character': return 'bg-blue-900/30 border-blue-500 text-blue-200';
      case 'stats': return 'bg-purple-900/30 border-purple-500 text-purple-200';
      case 'menu': return 'bg-cyan-900/30 border-cyan-500 text-cyan-200';
      case 'node': return 'bg-orange-900/30 border-orange-500 text-orange-200';
      default: return 'bg-gray-900/30 border-gray-500 text-gray-200';
    }
  };

  const getBlockTitle = (block: any) => {
    switch (block.type) {
      case 'dialogue':
        const dialogueText = block.text?.EN || block.text?.[Object.keys(block.text)[0]] || 'Dialogue';
        return dialogueText.length > 30 ? dialogueText.substring(0, 30) + '...' : dialogueText;
      case 'delay':
        return `Pausa ${block.milliseconds}ms`;
      case 'character':
        return `${block.action} ${block.character}`;
      case 'stats':
        return `${block.operation === 'add' ? '+' : block.operation === 'subtract' ? '-' : '='}${block.change} ${block.statType}`;
      case 'menu':
        return `Menu (${block.options?.length || 0} opzioni)`;
      case 'node':
        return `${block.action} ${block.nodeId}`;
      default:
        return block.type || 'Unknown';
    }
  };

  const renderBlock = (block: any, index: number) => {
    const isSelected = selectedBlockId === block.id;
    const isMenu = block.type === 'menu';
    
    return (
      <div key={block.id} className="flex flex-col items-center">
        {/* Connection Line from Previous Block */}
        {index > 0 && (
          <div className="w-0.5 bg-slate-600 h-6"></div>
        )}
        
        {/* Block */}
        <div
          onClick={() => onBlockSelect(block.id)}
          className={`
            relative p-3 rounded-lg border-2 cursor-pointer transition-all
            ${getBlockColor(block.type)}
            ${isSelected ? 'ring-2 ring-gt-accent' : 'hover:ring-1 hover:ring-slate-400'}
            min-w-[200px] max-w-[300px]
          `}
        >
          <div className="flex items-center space-x-2 mb-1">
            {getBlockIcon(block.type)}
            <span className="font-medium text-sm capitalize">{block.type}</span>
            <span className="text-xs opacity-70">#{block.line}</span>
          </div>
          <div className="text-sm">{getBlockTitle(block)}</div>
          
          {/* Menu Options */}
          {isMenu && block.options && block.options.length > 0 && (
            <div className="mt-2 space-y-1">
              {block.options.map((option: any, optIndex: number) => (
                <div key={optIndex} className="text-xs bg-black/20 rounded px-2 py-1">
                  {option.text?.EN || option.text?.[Object.keys(option.text)[0]] || `Option ${optIndex + 1}`}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Menu Branching */}
        {isMenu && block.options && block.options.length > 1 && (
          <div className="mt-2 flex flex-col items-center w-full">
            <div className="w-0.5 bg-slate-600 h-4"></div>
            
            {/* Branch Point */}
            <div className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            
            {/* Parallel Paths */}
            <div className="flex justify-center items-start space-x-8 mt-4 mb-4 w-full">
              {block.options.map((option: any, optIndex: number) => (
                <div key={optIndex} className="flex flex-col items-center min-w-[120px]">
                  <div className="w-full bg-cyan-900/20 border border-cyan-700 rounded p-2 text-center cursor-pointer hover:bg-cyan-900/40">
                    <div className="text-xs text-cyan-200 font-medium mb-1">
                      Opzione {optIndex + 1}
                    </div>
                    <div className="text-xs text-cyan-300">
                      {option.text?.EN || option.text?.[Object.keys(option.text)[0]] || `Option ${optIndex + 1}`}
                    </div>
                    {option.action && (
                      <div className="text-xs text-cyan-400 mt-1 font-mono">
                        → {option.action}
                      </div>
                    )}
                  </div>
                  
                  {/* Path continuation */}
                  <div className="w-0.5 bg-cyan-500 h-8 mt-2"></div>
                  <div className="text-xs text-cyan-400 bg-cyan-900/20 px-2 py-1 rounded">
                    Path {optIndex + 1}
                  </div>
                  <div className="w-0.5 bg-cyan-500 h-8 mt-2"></div>
                </div>
              ))}
            </div>
            
            {/* Reconvergence Point */}
            <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded mt-2">
              ↓ Paths Reconverge ↓
            </div>
          </div>
        )}
        
        {/* Connection Line to Next Block */}
        {index < blocks.length - 1 && !isMenu && (
          <ArrowDown className="w-4 h-4 text-slate-500 mt-2" />
        )}
      </div>
    );
  };

  return (
    <div className="p-4 bg-gt-primary/50 rounded-lg overflow-y-auto max-h-[600px]">
      <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
        <GitBranch className="w-5 h-5 text-gt-accent" />
        <span>Flusso Script</span>
      </h3>
      
      {blocks.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <GitBranch className="w-12 h-12 mx-auto mb-2" />
          <p>Nessun blocco nel flusso</p>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <div className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded mb-4">
            Script Start
          </div>
          {blocks.map((block, index) => renderBlock(block, index))}
          <div className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded mt-4">
            Script End
          </div>
        </div>
      )}
    </div>
  );
}
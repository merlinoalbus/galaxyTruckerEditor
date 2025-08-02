import React, { useState, useEffect } from 'react';
import { X, Code, Eye, EyeOff } from 'lucide-react';

interface CodeDiffViewerProps {
  originalScript: string;
  currentScript: string;
  scriptName: string;
  language: string;
  onClose: () => void;
}

export const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({
  originalScript,
  currentScript,
  scriptName,
  language,
  onClose
}) => {
  const [showSideBySide, setShowSideBySide] = useState(true);
  const [highlightChanges, setHighlightChanges] = useState(true);

  // Simple diff algorithm - highlights changed lines
  const getDiffLines = () => {
    const originalLines = originalScript.split('\n');
    const currentLines = currentScript.split('\n');
    const maxLines = Math.max(originalLines.length, currentLines.length);
    
    const diffResult: Array<{
      lineNumber: number;
      original: string;
      current: string;
      type: 'unchanged' | 'modified' | 'added' | 'removed';
    }> = [];

    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const currentLine = currentLines[i] || '';
      
      let type: 'unchanged' | 'modified' | 'added' | 'removed' = 'unchanged';
      
      if (originalLine && !currentLine) {
        type = 'removed';
      } else if (!originalLine && currentLine) {
        type = 'added';
      } else if (originalLine !== currentLine) {
        type = 'modified';
      }

      diffResult.push({
        lineNumber: i + 1,
        original: originalLine,
        current: currentLine,
        type
      });
    }

    return diffResult;
  };

  const diffLines = getDiffLines();
  const hasChanges = diffLines.some(line => line.type !== 'unchanged');

  const getLineClassName = (type: string) => {
    if (!highlightChanges) return '';
    
    switch (type) {
      case 'added':
        return 'bg-green-900/30 border-l-4 border-green-500';
      case 'removed':
        return 'bg-red-900/30 border-l-4 border-red-500';
      case 'modified':
        return 'bg-yellow-900/30 border-l-4 border-yellow-500';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Code className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Script Changes</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <span>{scriptName}</span>
                <span>•</span>
                <span>{language}</span>
                <span>•</span>
                <span className={hasChanges ? 'text-yellow-400' : 'text-green-400'}>
                  {hasChanges ? 'Modified' : 'No changes'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSideBySide(!showSideBySide)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm rounded ${
                showSideBySide ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {showSideBySide ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Side by Side</span>
            </button>
            
            <button
              onClick={() => setHighlightChanges(!highlightChanges)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm rounded ${
                highlightChanges ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span>Highlight Changes</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {showSideBySide ? (
            // Side by side view
            <div className="flex h-full">
              {/* Original */}
              <div className="w-1/2 border-r border-gray-700">
                <div className="bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 border-b border-gray-700">
                  Original Script
                </div>
                <div className="overflow-auto h-full p-4 bg-gray-950">
                  <pre className="text-sm text-gray-300 font-mono leading-relaxed">
                    {diffLines.map((line, index) => (
                      <div
                        key={index}
                        className={`flex ${getLineClassName(line.type)} ${
                          line.type === 'added' ? 'opacity-50' : ''
                        }`}
                      >
                        <span className="text-gray-500 w-12 flex-shrink-0 text-right pr-4">
                          {line.original ? line.lineNumber : ''}
                        </span>
                        <span className="flex-1">{line.original || ' '}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              </div>

              {/* Current */}
              <div className="w-1/2">
                <div className="bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 border-b border-gray-700">
                  Current Script
                </div>
                <div className="overflow-auto h-full p-4 bg-gray-950">
                  <pre className="text-sm text-gray-300 font-mono leading-relaxed">
                    {diffLines.map((line, index) => (
                      <div
                        key={index}
                        className={`flex ${getLineClassName(line.type)} ${
                          line.type === 'removed' ? 'opacity-50' : ''
                        }`}
                      >
                        <span className="text-gray-500 w-12 flex-shrink-0 text-right pr-4">
                          {line.current ? line.lineNumber : ''}
                        </span>
                        <span className="flex-1">{line.current || ' '}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            // Unified view
            <div className="h-full">
              <div className="bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 border-b border-gray-700">
                Unified Diff View
              </div>
              <div className="overflow-auto h-full p-4 bg-gray-950">
                <pre className="text-sm text-gray-300 font-mono leading-relaxed">
                  {diffLines.map((line, index) => (
                    <div key={index}>
                      {line.type === 'removed' && (
                        <div className={`flex ${getLineClassName('removed')}`}>
                          <span className="text-red-400 w-4 flex-shrink-0">-</span>
                          <span className="text-gray-500 w-12 flex-shrink-0 text-right pr-4">
                            {line.lineNumber}
                          </span>
                          <span className="flex-1">{line.original}</span>
                        </div>
                      )}
                      {line.type === 'added' && (
                        <div className={`flex ${getLineClassName('added')}`}>
                          <span className="text-green-400 w-4 flex-shrink-0">+</span>
                          <span className="text-gray-500 w-12 flex-shrink-0 text-right pr-4">
                            {line.lineNumber}
                          </span>
                          <span className="flex-1">{line.current}</span>
                        </div>
                      )}
                      {line.type === 'modified' && (
                        <>
                          <div className={`flex ${getLineClassName('removed')}`}>
                            <span className="text-red-400 w-4 flex-shrink-0">-</span>
                            <span className="text-gray-500 w-12 flex-shrink-0 text-right pr-4">
                              {line.lineNumber}
                            </span>
                            <span className="flex-1">{line.original}</span>
                          </div>
                          <div className={`flex ${getLineClassName('added')}`}>
                            <span className="text-green-400 w-4 flex-shrink-0">+</span>
                            <span className="text-gray-500 w-12 flex-shrink-0 text-right pr-4">
                              {line.lineNumber}
                            </span>
                            <span className="flex-1">{line.current}</span>
                          </div>
                        </>
                      )}
                      {line.type === 'unchanged' && (
                        <div className="flex">
                          <span className="text-gray-600 w-4 flex-shrink-0"> </span>
                          <span className="text-gray-500 w-12 flex-shrink-0 text-right pr-4">
                            {line.lineNumber}
                          </span>
                          <span className="flex-1">{line.current}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Footer */}
        <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
          <div className="flex items-center space-x-6 text-sm">
            <span className="text-gray-300">
              Total lines: {Math.max(originalScript.split('\n').length, currentScript.split('\n').length)}
            </span>
            <span className="text-green-400">
              Added: {diffLines.filter(l => l.type === 'added').length}
            </span>
            <span className="text-red-400">
              Removed: {diffLines.filter(l => l.type === 'removed').length}
            </span>
            <span className="text-yellow-400">
              Modified: {diffLines.filter(l => l.type === 'modified').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
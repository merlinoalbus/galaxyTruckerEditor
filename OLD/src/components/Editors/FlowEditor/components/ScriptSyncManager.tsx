import React, { useState, useEffect } from 'react';
import { Code, GitCompare, RefreshCw, Download, Upload, AlertTriangle } from 'lucide-react';
import { CodeDiffViewer } from './CodeDiffViewer';

interface ScriptSyncManagerProps {
  scriptName: string;
  language: string;
  blocks: any[];
  onScriptGenerated: (script: string) => void;
  onScriptImported: (blocks: any[]) => void;
}

export const ScriptSyncManager: React.FC<ScriptSyncManagerProps> = ({
  scriptName,
  language,
  blocks,
  onScriptGenerated,
  onScriptImported
}) => {
  const [originalScript, setOriginalScript] = useState<string>('');
  const [currentScript, setCurrentScript] = useState<string>('');
  const [showDiff, setShowDiff] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load original script on mount
  useEffect(() => {
    loadOriginalScript();
  }, [scriptName, language]);

  // Update current script when blocks change
  useEffect(() => {
    const generated = generateScriptFromBlocks();
    setCurrentScript(generated);
    setHasChanges(generated !== originalScript);
  }, [blocks, originalScript]);

  const loadOriginalScript = async () => {
    try {
      const categoryName = language === 'EN' ? 'campaignMissions' : `campaignScripts${language}`;
      const response = await fetch(`http://localhost:3001/api/${categoryName}/${scriptName}`);
      
      if (response.ok) {
        const data = await response.json();
        const content = data.content || '';
        setOriginalScript(content);
      }
    } catch (error) {
      console.error('Error loading original script:', error);
    }
  };

  const generateScriptFromBlocks = (): string => {
    const scriptLines: string[] = [
      '// Generated script from Visual Editor',
      'SCRIPTS',
      ''
    ];

    blocks.forEach(block => {
      switch (block.command?.type) {
        case 'dialogue':
          const text = block.command.parameters?.text || '';
          scriptLines.push(`Say "${text}"`);
          break;
        case 'question':
          const questionText = block.command.parameters?.text || '';
          scriptLines.push(`Ask "${questionText}"`);
          break;
        case 'announce':
          const announceText = block.command.parameters?.text || '';
          scriptLines.push(`Announce "${announceText}"`);
          break;
        case 'show_character':
          const showChar = block.command.parameters?.character || 'tutor';
          const position = block.command.parameters?.position || 'left';
          scriptLines.push(`ShowChar ${showChar} ${position}`);
          break;
        case 'hide_character':
          const hideChar = block.command.parameters?.character || 'tutor';
          scriptLines.push(`HideChar ${hideChar}`);
          break;
        case 'change_character':
          const changeChar = block.command.parameters?.character || 'tutor';
          const newImage = block.command.parameters?.image || 'tutor.png';
          scriptLines.push(`ChangeChar ${changeChar} ${newImage}`);
          break;
        case 'variable_set':
          const setVar = block.command.parameters?.variable || 'newVariable';
          scriptLines.push(`SetVar ${setVar} true`);
          break;
        case 'variable_reset':
          const resetVar = block.command.parameters?.variable || 'newVariable';
          scriptLines.push(`SetVar ${resetVar} false`);
          break;
        case 'menu_container':
          scriptLines.push('MENU');
          // Add menu options logic here
          const options = block.command.parameters?.options || [];
          options.forEach((option: any) => {
            const optText = option.text?.[language] || option.text?.['EN'] || '';
            scriptLines.push(`OPT "${optText}"`);
            if (option.action) {
              scriptLines.push(`  ${option.action}`);
            }
            scriptLines.push('END_OF_OPT');
          });
          break;
        case 'condition_container':
          const condVar = block.command.parameters?.variable || 'variable';
          const condType = block.command.parameters?.conditionType || 'equals';
          scriptLines.push(`IF ${condVar} ${condType}`);
          // Add condition logic here
          if (block.command.parameters?.hasElse) {
            scriptLines.push('ELSE');
          }
          scriptLines.push('END_OF_IF');
          break;
        case 'dialog_container':
          scriptLines.push('// Dialog container start');
          break;
        default:
          if (block.command?.content) {
            scriptLines.push(block.command.content);
          }
      }
    });

    return scriptLines.join('\n');
  };

  const handleGenerateScript = async () => {
    setIsGenerating(true);
    try {
      const generated = generateScriptFromBlocks();
      setCurrentScript(generated);
      onScriptGenerated(generated);
      
      // Optional: Save to server
      const categoryName = language === 'EN' ? 'campaignMissions' : `campaignScripts${language}`;
      await fetch(`http://localhost:3001/api/${categoryName}/${scriptName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: generated })
      });
      
      setOriginalScript(generated);
      setHasChanges(false);
    } catch (error) {
      console.error('Error generating script:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportScript = async () => {
    try {
      // This would parse the current script and convert it back to blocks
      // Implementation would depend on the CampaignScriptParser
      console.log('Import script functionality would go here');
    } catch (error) {
      console.error('Error importing script:', error);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Script Status Indicator */}
      <div className={`w-3 h-3 rounded-full ${
        hasChanges ? 'bg-yellow-500' : 'bg-green-500'
      }`} title={hasChanges ? 'Script has unsaved changes' : 'Script is synchronized'} />

      {/* View Diff Button */}
      <button
        onClick={() => setShowDiff(true)}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        title="View code differences"
      >
        <GitCompare className="w-4 h-4" />
        <span>View Changes</span>
        {hasChanges && (
          <span className="bg-yellow-500 text-xs px-1 rounded-full min-w-[16px] h-4 flex items-center justify-center">
            !
          </span>
        )}
      </button>

      {/* Generate Script Button */}
      <button
        onClick={handleGenerateScript}
        disabled={isGenerating}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition-colors"
        title="Generate script from visual blocks"
      >
        {isGenerating ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isGenerating ? 'Generating...' : 'Generate Script'}</span>
      </button>

      {/* Import Script Button */}
      <button
        onClick={handleImportScript}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
        title="Import script and convert to visual blocks"
      >
        <Upload className="w-4 h-4" />
        <span>Import Script</span>
      </button>

      {/* Raw Code Button */}
      <button
        onClick={() => {
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head><title>Script Code - ${scriptName}</title></head>
                <body style="font-family: monospace; background: #1a1a1a; color: #e0e0e0; padding: 20px;">
                  <h2>Original Script</h2>
                  <pre style="background: #2a2a2a; padding: 15px; border-radius: 5px; overflow: auto;">${originalScript}</pre>
                  <h2>Current Script</h2>
                  <pre style="background: #2a2a2a; padding: 15px; border-radius: 5px; overflow: auto;">${currentScript}</pre>
                </body>
              </html>
            `);
            newWindow.document.close();
          }
        }}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
        title="View raw script code"
      >
        <Code className="w-4 h-4" />
        <span>Raw Code</span>
      </button>

      {/* Changes Warning */}
      {hasChanges && (
        <div className="flex items-center space-x-1 text-yellow-400 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Unsaved changes</span>
        </div>
      )}

      {/* Code Diff Viewer Modal */}
      {showDiff && (
        <CodeDiffViewer
          originalScript={originalScript}
          currentScript={currentScript}
          scriptName={scriptName}
          language={language}
          onClose={() => setShowDiff(false)}
        />
      )}
    </div>
  );
};
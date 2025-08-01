import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  FileText, 
  Languages, 
  Eye,
  Play,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { DialoguePreview } from './DialoguePreview';

interface ScriptEditorProps {
  language: string; // EN, CS, DE, etc.
  filename: string; // scripts1.txt, missions.txt, etc.
  onClose: () => void;
}

interface ScriptCommand {
  type: 'SAY' | 'SHOW_CHAR' | 'HIDE_CHAR' | 'CHANGE_CHAR' | 'DELAY' | 'MENU' | 'IF' | 'SCRIPT' | 'MISSION' | 'OTHER';
  command: string;
  content: string;
  line: number;
}

export function CampaignScriptEditor({ language, filename, onClose }: ScriptEditorProps) {
  const [scriptContent, setScriptContent] = useState<string>('');
  const [parsedCommands, setParsedCommands] = useState<ScriptCommand[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'syntax'>('edit');
  const [syntaxErrors, setSyntaxErrors] = useState<string[]>([]);
  const [showDialoguePreview, setShowDialoguePreview] = useState(false);

  useEffect(() => {
    loadScript();
  }, [language, filename]);

  useEffect(() => {
    parseScript(scriptContent);
  }, [scriptContent]);

  const loadScript = async () => {
    setLoading(true);
    try {
      // Use campaignMissions for EN, campaignScriptsXX for other languages
      const categoryName = language === 'EN' ? 'campaignMissions' : `campaignScripts${language}`;
      const response = await fetch(`http://localhost:3001/api/${categoryName}/${filename}`);
      if (response.ok) {
        const data = await response.json();
        setScriptContent(data.content || '');
      } else {
        console.error('Failed to load script:', response.statusText);
        setScriptContent('// Script non trovato o errore di caricamento\nSCRIPTS\n\n');
      }
    } catch (error) {
      console.error('Error loading script:', error);
      setScriptContent('// Errore di caricamento\nSCRIPTS\n\n');
    } finally {
      setLoading(false);
    }
  };

  const parseScript = (content: string) => {
    const lines = content.split('\n');
    const commands: ScriptCommand[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) return;

      let type: ScriptCommand['type'] = 'OTHER';
      let command = '';
      let commandContent = trimmed;

      // Parse different command types
      if (trimmed.startsWith('Say ') || trimmed.startsWith('Ask ')) {
        type = 'SAY';
        const match = trimmed.match(/^(Say|Ask)\s+"(.+)"$/);
        if (match) {
          command = match[1];
          commandContent = match[2];
        } else {
          errors.push(`Line ${index + 1}: Invalid Say/Ask syntax`);
        }
      } else if (trimmed.startsWith('ShowChar ')) {
        type = 'SHOW_CHAR';
        command = 'ShowChar';
        commandContent = trimmed.substring(9);
      } else if (trimmed.startsWith('HideChar ')) {
        type = 'HIDE_CHAR';
        command = 'HideChar';
        commandContent = trimmed.substring(9);
      } else if (trimmed.startsWith('ChangeChar ')) {
        type = 'CHANGE_CHAR';
        command = 'ChangeChar';
        commandContent = trimmed.substring(11);
      } else if (trimmed.startsWith('Delay ')) {
        type = 'DELAY';
        command = 'Delay';
        const delayMatch = trimmed.match(/^Delay\s+(\d+)$/);
        if (delayMatch) {
          commandContent = `${delayMatch[1]}ms`;
        } else {
          errors.push(`Line ${index + 1}: Invalid Delay syntax`);
        }
      } else if (trimmed === 'MENU') {
        type = 'MENU';
        command = 'MENU';
        commandContent = 'Menu Start';
      } else if (trimmed.startsWith('IF ')) {
        type = 'IF';
        command = 'IF';
        commandContent = trimmed.substring(3);
      } else if (trimmed.startsWith('SCRIPT ')) {
        type = 'SCRIPT';
        command = 'SCRIPT';
        commandContent = trimmed.substring(7);
      } else if (trimmed.startsWith('MISSION ')) {
        type = 'MISSION';
        command = 'MISSION';
        commandContent = trimmed.substring(8);
      }

      commands.push({
        type,
        command,
        content: commandContent,
        line: index + 1
      });
    });

    setParsedCommands(commands);
    setSyntaxErrors(errors);
  };

  const handleContentChange = (newContent: string) => {
    setScriptContent(newContent);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const categoryName = language === 'EN' ? 'campaignMissions' : `campaignScripts${language}`;
      const response = await fetch(`http://localhost:3001/api/${categoryName}/${filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: scriptContent })
      });

      if (response.ok) {
        setHasChanges(false);
        console.log('Script saved successfully');
      } else {
        console.error('Failed to save script:', response.statusText);
        alert('Errore durante il salvataggio dello script');
      }
    } catch (error) {
      console.error('Error saving script:', error);
      alert('Errore durante il salvataggio dello script');
    } finally {
      setSaving(false);
    }
  };

  const getCommandIcon = (type: ScriptCommand['type']) => {
    switch (type) {
      case 'SAY': return '💬';
      case 'SHOW_CHAR': return '👤';
      case 'HIDE_CHAR': return '👻';
      case 'CHANGE_CHAR': return '🔄';
      case 'DELAY': return '⏱️';
      case 'MENU': return '📋';
      case 'IF': return '❓';
      case 'SCRIPT': return '📜';
      case 'MISSION': return '🚀';
      default: return '⚙️';
    }
  };

  const getCommandColor = (type: ScriptCommand['type']) => {
    switch (type) {
      case 'SAY': return 'text-green-400';
      case 'SHOW_CHAR': return 'text-blue-400';
      case 'HIDE_CHAR': return 'text-gray-400';
      case 'CHANGE_CHAR': return 'text-purple-400';
      case 'DELAY': return 'text-yellow-400';
      case 'MENU': return 'text-cyan-400';
      case 'IF': return 'text-orange-400';
      case 'SCRIPT': return 'text-pink-400';
      case 'MISSION': return 'text-red-400';
      default: return 'text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gt-primary rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gt-accent mx-auto mb-4"></div>
          <p className="text-white">Caricamento script...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gt-primary rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gt-secondary p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-gt-accent" />
            <div>
              <h2 className="text-xl font-bold text-white">{filename}</h2>
              <div className="flex items-center space-x-2 text-sm">
                <Languages className="w-4 h-4 text-gray-300" />
                <span className="text-gray-300">Lingua: {language}</span>
                {hasChanges && (
                  <span className="text-yellow-400 ml-2">• Non salvato</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDialoguePreview(true)}
              className="btn-secondary flex items-center space-x-2"
              title="Anteprima Dialoghi"
            >
              <Play className="w-4 h-4" />
              <span>Anteprima</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvataggio...' : 'Salva'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gt-primary rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700">
          <nav className="flex px-4">
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'edit'
                  ? 'border-gt-accent text-gt-accent'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'preview'
                  ? 'border-gt-accent text-gt-accent'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Anteprima ({parsedCommands.length} comandi)</span>
            </button>
            <button
              onClick={() => setActiveTab('syntax')}
              className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'syntax'
                  ? 'border-gt-accent text-gt-accent'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {syntaxErrors.length > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>Sintassi ({syntaxErrors.length} errori)</span>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ height: 'calc(95vh - 140px)' }}>
          {activeTab === 'edit' && (
            <div className="p-4">
              <textarea
                value={scriptContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full min-h-[600px] bg-gt-secondary text-white p-4 rounded border border-slate-600 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gt-accent"
                placeholder="Inserisci qui il contenuto dello script..."
                spellCheck={false}
              />
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="p-4">
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700 rounded">
                <h3 className="font-medium text-blue-200 mb-2">Anteprima Strutturata Script</h3>
                <p className="text-sm text-blue-300">
                  Editor strutturato per dialoghi e comandi script campagna.
                </p>
              </div>

              {parsedCommands.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-2" />
                  <p>Script vuoto - inizia scrivendo nell'editor</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {parsedCommands.map((cmd, index) => (
                    <div key={index} className="bg-gt-secondary/30 rounded-lg p-3 border-l-4 border-gt-accent">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">{getCommandIcon(cmd.type)}</span>
                            <span className={`font-medium ${getCommandColor(cmd.type)}`}>
                              {cmd.command || cmd.type}
                            </span>
                            <span className="text-xs text-gray-400">Riga {cmd.line}</span>
                          </div>
                          
                          {cmd.type === 'SAY' && (
                            <div className="bg-green-900/20 border border-green-700/50 rounded p-3">
                              <div className="text-green-200 font-medium mb-1">Dialogo:</div>
                              <div className="text-white">{cmd.content}</div>
                            </div>
                          )}
                          
                          {cmd.type === 'SHOW_CHAR' && (
                            <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3">
                              <div className="text-blue-200 font-medium mb-1">Mostra Personaggio:</div>
                              <div className="text-white">{cmd.content}</div>
                            </div>
                          )}
                          
                          {cmd.type === 'DELAY' && (
                            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-3">
                              <div className="text-yellow-200 font-medium mb-1">Pausa:</div>
                              <div className="text-white">{cmd.content}</div>
                            </div>
                          )}
                          
                          {cmd.type === 'IF' && (
                            <div className="bg-orange-900/20 border border-orange-700/50 rounded p-3">
                              <div className="text-orange-200 font-medium mb-1">Condizione:</div>
                              <div className="text-white font-mono text-sm">{cmd.content}</div>
                            </div>
                          )}
                          
                          {!['SAY', 'SHOW_CHAR', 'DELAY', 'IF'].includes(cmd.type) && (
                            <div className="bg-gray-900/20 border border-gray-700/50 rounded p-3">
                              <div className="text-gray-200 font-medium mb-1">Comando:</div>
                              <div className="text-white font-mono text-sm">{cmd.content}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'syntax' && (
            <div className="p-4">
              <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded">
                <h3 className="font-medium text-green-200 mb-2">Controllo Sintassi Script</h3>
                <p className="text-sm text-green-300">
                  Verifica automatica della sintassi del script per identificare errori comuni.
                </p>
              </div>

              {syntaxErrors.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-green-400 mb-2">Sintassi Corretta</h3>
                  <p className="text-gray-400">Nessun errore di sintassi rilevato nello script.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-medium text-red-400 mb-4">
                    Errori Trovati ({syntaxErrors.length})
                  </h3>
                  {syntaxErrors.map((error, index) => (
                    <div key={index} className="p-3 bg-red-900/20 border border-red-700 rounded">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                        <div>
                          <p className="text-red-200">{error}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Syntax Help */}
              <div className="mt-8 p-4 bg-gt-secondary/30 rounded">
                <h4 className="font-medium text-white mb-3">Sintassi Comuni</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="text-green-400 font-medium mb-2">Dialoghi</h5>
                    <div className="space-y-1 text-gray-300 font-mono">
                      <div>Say "Testo del dialogo"</div>
                      <div>Ask "Domanda?"</div>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-blue-400 font-medium mb-2">Personaggi</h5>
                    <div className="space-y-1 text-gray-300 font-mono">
                      <div>ShowChar tutor left</div>
                      <div>HideChar tutor</div>
                      <div>ChangeChar tutor image.png</div>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-yellow-400 font-medium mb-2">Controllo</h5>
                    <div className="space-y-1 text-gray-300 font-mono">
                      <div>Delay 1000</div>
                      <div>IF condizione</div>
                      <div>MENU</div>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-purple-400 font-medium mb-2">Script</h5>
                    <div className="space-y-1 text-gray-300 font-mono">
                      <div>SCRIPT nomeScript</div>
                      <div>MISSION nomeMissione</div>
                      <div>SUB_SCRIPT subScript</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogue Preview Modal */}
      {showDialoguePreview && (
        <DialoguePreview
          scriptContent={scriptContent}
          onClose={() => setShowDialoguePreview(false)}
        />
      )}
    </div>
  );
}
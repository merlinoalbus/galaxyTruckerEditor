import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  FileText, 
  Languages, 
  FolderPlus,
  Copy,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Folder
} from 'lucide-react';

interface FileManagerProps {
  onClose: () => void;
  onEditFile: (language: string, filename: string) => void;
}

interface CampaignFile {
  name: string;
  size: number;
  modified: string;
  exists: boolean;
}

interface LanguageFiles {
  [filename: string]: CampaignFile;
}

const LANGUAGES = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
const CAMPAIGN_FILES = [
  'base_inits.txt',
  'inits.txt', 
  'missions.txt',
  'missions.yaml',
  'missions2.txt',
  'ms_scripts.txt',
  'nodes.yaml',
  'scripts1.txt',
  'scripts2.txt',
  'scripts3.txt',
  'scripts4.txt',
  'scripts5.txt',
  'stdMissions.txt',
  'tutorials.txt'
];

export function CampaignFileManager({ onClose, onEditFile }: FileManagerProps) {
  const [languageFiles, setLanguageFiles] = useState<Record<string, LanguageFiles>>({});
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [copying, setCopying] = useState<{from: string, to: string, file: string} | null>(null);

  useEffect(() => {
    loadAllFiles();
  }, []);

  const loadAllFiles = async () => {
    setLoading(true);
    const allFiles: Record<string, LanguageFiles> = {};

    for (const lang of LANGUAGES) {
      const categoryName = lang === 'EN' ? 'campaignMissions' : `campaignScripts${lang}`;
      try {
        const response = await fetch(`http://localhost:3001/api/${categoryName}`);
        if (response.ok) {
          const data = await response.json();
          const files: LanguageFiles = {};
          
          // Check which files exist
          for (const file of CAMPAIGN_FILES) {
            const fileData = data.files?.find((f: any) => f.name === file);
            files[file] = {
              name: file,
              size: fileData?.size || 0,
              modified: fileData?.modified || 'Never',
              exists: !!fileData
            };
          }
          
          allFiles[lang] = files;
        }
      } catch (error) {
        console.warn(`Could not load files for ${lang}:`, error);
        // Create empty structure for missing languages
        const files: LanguageFiles = {};
        for (const file of CAMPAIGN_FILES) {
          files[file] = {
            name: file,
            size: 0,
            modified: 'Never',
            exists: false
          };
        }
        allFiles[lang] = files;
      }
    }

    setLanguageFiles(allFiles);
    setLoading(false);
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    
    setCreating(true);
    try {
      const categoryName = selectedLanguage === 'EN' ? 'campaignMissions' : `campaignScripts${selectedLanguage}`;
      const fileName = newFileName.trim();
      
      // Create empty file
      const response = await fetch(`http://localhost:3001/api/${categoryName}/${fileName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '// New script file\nSCRIPTS\n\n' })
      });

      if (response.ok) {
        setNewFileName('');
        await loadAllFiles(); // Refresh
      } else {
        alert('Errore durante la creazione del file');
      }
    } catch (error) {
      console.error('Error creating file:', error);
      alert('Errore durante la creazione del file');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyFile = async (fromLang: string, toLang: string, filename: string) => {
    setCopying({from: fromLang, to: toLang, file: filename});
    
    try {
      const fromCategory = fromLang === 'EN' ? 'campaignMissions' : `campaignScripts${fromLang}`;
      const toCategory = toLang === 'EN' ? 'campaignMissions' : `campaignScripts${toLang}`;
      
      // Load source file
      const sourceResponse = await fetch(`http://localhost:3001/api/${fromCategory}/${filename}`);
      if (!sourceResponse.ok) {
        alert('File sorgente non trovato');
        return;
      }
      
      const sourceData = await sourceResponse.json();
      
      // Save to destination
      const destResponse = await fetch(`http://localhost:3001/api/${toCategory}/${filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: sourceData.content })
      });

      if (destResponse.ok) {
        await loadAllFiles(); // Refresh
      } else {
        alert('Errore durante la copia del file');
      }
    } catch (error) {
      console.error('Error copying file:', error);
      alert('Errore durante la copia del file');
    } finally {
      setCopying(null);
    }
  };

  const handleDeleteFile = async (language: string, filename: string) => {
    if (!confirm(`Sei sicuro di voler eliminare ${filename} da ${language}?`)) {
      return;
    }

    try {
      const categoryName = language === 'EN' ? 'campaignMissions' : `campaignScripts${language}`;
      const response = await fetch(`http://localhost:3001/api/${categoryName}/${filename}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadAllFiles(); // Refresh
      } else {
        alert('Errore durante l\'eliminazione del file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Errore durante l\'eliminazione del file');
    }
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.yaml')) return '📄';
    if (filename.includes('script')) return '📜';
    if (filename.includes('mission')) return '🚀';
    if (filename.includes('init')) return '⚙️';
    if (filename.includes('tutorial')) return '🎓';
    return '📝';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    if (dateString === 'Never') return 'Mai';
    try {
      return new Date(dateString).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gt-primary rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gt-accent mx-auto mb-4"></div>
          <p className="text-white">Caricamento file campagna...</p>
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
            <Folder className="w-6 h-6 text-gt-accent" />
            <div>
              <h2 className="text-xl font-bold text-white">Gestione File Campagna</h2>
              <p className="text-sm text-gray-300">
                Gestisci tutti i file script per tutte le lingue
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={loadAllFiles}
              className="btn-secondary flex items-center space-x-2"
              title="Ricarica"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Ricarica</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gt-primary rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Language Selector */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-4">
            <span className="text-white font-medium">Lingua selezionata:</span>
            <div className="flex space-x-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    selectedLanguage === lang
                      ? 'bg-gt-accent text-white'
                      : 'bg-gt-secondary text-gray-300 hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Create File */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="nome_file.txt"
              className="form-input flex-1"
            />
            <button
              onClick={handleCreateFile}
              disabled={creating || !newFileName.trim()}
              className="btn-primary flex items-center space-x-2"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{creating ? 'Creando...' : 'Crea File'}</span>
            </button>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 300px)' }}>
          <div className="p-4">
            {/* Current Language Files */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                <Languages className="w-5 h-5 text-gt-accent" />
                <span>File {selectedLanguage}</span>
              </h3>
              
              <div className="grid gap-2">
                {CAMPAIGN_FILES.map(filename => {
                  const file = languageFiles[selectedLanguage]?.[filename];
                  if (!file) return null;
                  
                  return (
                    <div
                      key={filename}
                      className={`p-3 rounded-lg border ${
                        file.exists
                          ? 'bg-gt-secondary/30 border-gt-secondary'
                          : 'bg-red-900/20 border-red-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getFileIcon(filename)}</span>
                          <div>
                            <h4 className="font-medium text-white">{filename}</h4>
                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                              <span>{formatFileSize(file.size)}</span>
                              <span>Modificato: {formatDate(file.modified)}</span>
                              {!file.exists && (
                                <span className="text-red-400 flex items-center space-x-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Non esiste</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {file.exists && (
                            <>
                              <button
                                onClick={() => onEditFile(selectedLanguage, filename)}
                                className="p-2 text-gt-accent hover:bg-gt-accent/20 rounded"
                                title="Modifica"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              
                              {/* Copy to other languages */}
                              <div className="relative group">
                                <button className="p-2 text-blue-400 hover:bg-blue-400/20 rounded">
                                  <Copy className="w-4 h-4" />
                                </button>
                                <div className="absolute right-0 top-full mt-1 bg-gt-secondary border border-slate-600 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  <div className="p-2 text-xs text-gray-300 border-b border-slate-600">
                                    Copia in:
                                  </div>
                                  {LANGUAGES.filter(lang => lang !== selectedLanguage).map(lang => (
                                    <button
                                      key={lang}
                                      onClick={() => handleCopyFile(selectedLanguage, lang, filename)}
                                      disabled={copying?.file === filename}
                                      className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gt-primary hover:text-white"
                                    >
                                      {copying?.file === filename && copying.to === lang ? 'Copiando...' : lang}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              
                              <button
                                onClick={() => handleDeleteFile(selectedLanguage, filename)}
                                className="p-2 text-red-400 hover:bg-red-400/20 rounded"
                                title="Elimina"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {!file.exists && (
                            <button
                              onClick={() => {
                                // Try to copy from EN if exists
                                const enFile = languageFiles['EN']?.[filename];
                                if (enFile?.exists) {
                                  handleCopyFile('EN', selectedLanguage, filename);
                                } else {
                                  // Create empty file
                                  setNewFileName(filename);
                                  handleCreateFile();
                                }
                              }}
                              className="btn-secondary text-sm"
                            >
                              <FolderPlus className="w-3 h-3 mr-1" />
                              Crea
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Overview Grid */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Panoramica Tutte le Lingue</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-2 text-gray-300">File</th>
                      {LANGUAGES.map(lang => (
                        <th key={lang} className="text-center p-2 text-gray-300">{lang}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CAMPAIGN_FILES.map(filename => (
                      <tr key={filename} className="border-b border-slate-800">
                        <td className="p-2 text-white font-medium">
                          <div className="flex items-center space-x-2">
                            <span>{getFileIcon(filename)}</span>
                            <span>{filename}</span>
                          </div>
                        </td>
                        {LANGUAGES.map(lang => {
                          const file = languageFiles[lang]?.[filename];
                          return (
                            <td key={lang} className="text-center p-2">
                              {file?.exists ? (
                                <button
                                  onClick={() => onEditFile(lang, filename)}
                                  className="text-green-400 hover:text-green-300"
                                  title={`${formatFileSize(file.size)} - ${formatDate(file.modified)}`}
                                >
                                  <CheckCircle className="w-4 h-4 mx-auto" />
                                </button>
                              ) : (
                                <AlertTriangle className="w-4 h-4 mx-auto text-red-400" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
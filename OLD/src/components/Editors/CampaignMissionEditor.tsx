import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Edit3, 
  MapPin, 
  Zap, 
  Languages, 
  Settings,
  Play,
  Star,
  AlertTriangle
} from 'lucide-react';
import * as yaml from 'js-yaml';

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

interface MissionEditorProps {
  mission: CampaignMission;
  onClose: () => void;
  onSave: (mission: CampaignMission) => void;
}

interface LocalizedString {
  key: string;
  en: string;
  [lang: string]: string;
}

export function CampaignMissionEditor({ mission, onClose, onSave }: MissionEditorProps) {
  const [editedMission, setEditedMission] = useState<CampaignMission>(mission);
  const [localizedStrings, setLocalizedStrings] = useState<LocalizedString[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'localization' | 'advanced'>('basic');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];

  useEffect(() => {
    loadMissionLocalizations();
  }, [mission]);

  const loadMissionLocalizations = async () => {
    // Carica le stringhe localizzate per questa missione
    try {
      const strings: LocalizedString[] = [
        {
          key: `mission.${mission.name}.caption`,
          en: mission.caption
        },
        {
          key: `mission.${mission.name}.description`, 
          en: mission.description
        }
      ];

      // Carica traduzioni esistenti per ogni lingua
      for (const lang of languages) {
        if (lang === 'EN') continue;
        
        try {
          // Salta il caricamento per ora - implementeremo dopo aver sistemato il server
          console.log(`Skipping ${lang} translations for now`);
        } catch (error) {
          console.warn(`Could not load ${lang} campaign scripts:`, error);
        }
      }

      setLocalizedStrings(strings);
    } catch (error) {
      console.error('Error loading mission localizations:', error);
    }
  };

  const handleMissionChange = (field: keyof CampaignMission, value: any) => {
    setEditedMission(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleLocalizationChange = (stringIndex: number, lang: string, value: string) => {
    const newStrings = [...localizedStrings];
    newStrings[stringIndex][lang.toLowerCase()] = value;
    setLocalizedStrings(newStrings);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Salva le modifiche della missione
      await onSave(editedMission);
      
      // Salva le traduzioni aggiornate nei file campaignScripts
      for (const lang of languages) {
        if (lang === 'EN') continue;
        
        const langCode = lang.toLowerCase();
        const campaignCategory = `campaignScripts${lang}`;
        
        try {
          // Carica il file missions.txt esistente
          const response = await fetch(`http://localhost:3001/api/${campaignCategory}/missions.txt`);
          let content = '';
          if (response.ok) {
            const data = await response.json();
            content = data.content || '';
          }
          
          // Aggiorna le traduzioni nel contenuto
          localizedStrings.forEach(str => {
            if (str[langCode]) {
              const isCaption = str.key.includes('caption');
              const suffix = isCaption ? '_caption' : '_description';
              const key = `${mission.name}${suffix}`;
              const newLine = `${key}=${str[langCode]}`;
              
              // Sostituisci la riga esistente o aggiungila
              const lines = content.split('\n');
              const existingIndex = lines.findIndex(line => line.startsWith(`${key}=`));
              
              if (existingIndex >= 0) {
                lines[existingIndex] = newLine;
              } else {
                lines.push(newLine);
              }
              
              content = lines.join('\n');
            }
          });
          
          // Salva il file aggiornato
          if (content.trim()) {
            await fetch(`http://localhost:3001/api/${campaignCategory}/missions.txt`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: content })
            });
          }
        } catch (error) {
          console.warn(`Could not save ${lang} campaign translations:`, error);
        }
      }
      
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Error saving mission:', error);
      alert('Errore durante il salvataggio della missione');
    } finally {
      setSaving(false);
    }
  };

  const getMissionTypeIcon = (type: string) => {
    switch (type) {
      case 'UNIQUE': return <Star className="w-4 h-4 text-purple-400" />;
      case 'NORMAL': return <Play className="w-4 h-4 text-blue-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLicenseColor = (license: string) => {
    switch (license) {
      case 'STI': return 'bg-green-600';
      case 'STII': return 'bg-yellow-600';  
      case 'STIII': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gt-primary rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gt-secondary p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getMissionTypeIcon(editedMission.missiontype)}
            <div>
              <h2 className="text-xl font-bold text-white">{editedMission.caption}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <span>ID: {editedMission.name}</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded text-xs text-white ${getLicenseColor(editedMission.license)}`}>
                  {editedMission.license}
                </span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{editedMission.source} → {editedMission.destination}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <span className="text-yellow-400 text-sm flex items-center space-x-1">
                <Edit3 className="w-4 h-4" />
                <span>Non salvato</span>
              </span>
            )}
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
              onClick={() => setActiveTab('basic')}
              className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'basic'
                  ? 'border-gt-accent text-gt-accent'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Impostazioni Base</span>
            </button>
            <button
              onClick={() => setActiveTab('localization')}
              className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'localization'
                  ? 'border-gt-accent text-gt-accent'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Languages className="w-4 h-4" />
              <span>Localizzazione</span>
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'advanced'
                  ? 'border-gt-accent text-gt-accent'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Avanzate</span>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">ID Missione</label>
                  <input
                    type="text"
                    value={editedMission.name}
                    onChange={(e) => handleMissionChange('name', e.target.value)}
                    className="form-input"
                    placeholder="R1-1a"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo Missione</label>
                  <select
                    value={editedMission.missiontype}
                    onChange={(e) => handleMissionChange('missiontype', e.target.value as 'NORMAL' | 'UNIQUE')}
                    className="form-input form-select"
                  >
                    <option value="NORMAL">Normale</option>
                    <option value="UNIQUE">Unica</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Licenza Richiesta</label>
                  <select
                    value={editedMission.license}
                    onChange={(e) => handleMissionChange('license', e.target.value)}
                    className="form-input form-select"
                  >
                    <option value="STI">Star Trucker I</option>
                    <option value="STII">Star Trucker II</option>
                    <option value="STIII">Star Trucker III</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nodo Partenza</label>
                  <input
                    type="text"
                    value={editedMission.source}
                    onChange={(e) => handleMissionChange('source', e.target.value)}
                    className="form-input"
                    placeholder="newbie"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nodo Destinazione</label>
                  <input
                    type="text"
                    value={editedMission.destination}
                    onChange={(e) => handleMissionChange('destination', e.target.value)}
                    className="form-input"
                    placeholder="bar"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Titolo Missione (EN)</label>
                <input
                  type="text"
                  value={editedMission.caption}
                  onChange={(e) => handleMissionChange('caption', e.target.value)}
                  className="form-input"
                  placeholder="Regular Route to Space Bar"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descrizione Missione (EN)</label>
                <textarea
                  value={editedMission.description}
                  onChange={(e) => handleMissionChange('description', e.target.value)}
                  className="form-input resize-none"
                  rows={3}
                  placeholder="Good mission to start with, for a newbie trucker."
                />
              </div>
            </div>
          )}

          {activeTab === 'localization' && (
            <div className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <h3 className="font-medium text-blue-200 mb-2">Gestione Traduzioni</h3>
                <p className="text-sm text-blue-300">
                  Modifica le traduzioni per titolo e descrizione della missione in tutte le lingue supportate.
                </p>
              </div>

              {localizedStrings.map((str, index) => (
                <div key={str.key} className="card">
                  <h4 className="font-medium text-white mb-3">
                    {str.key.includes('caption') ? 'Titolo Missione' : 'Descrizione Missione'}
                  </h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {languages.map(lang => (
                      <div key={lang} className="form-group">
                        <label className="form-label text-xs">{lang}</label>
                        {str.key.includes('description') ? (
                          <textarea
                            value={str[lang.toLowerCase()] || ''}
                            onChange={(e) => handleLocalizationChange(index, lang, e.target.value)}
                            className="form-input text-sm resize-none"
                            rows={2}
                            placeholder={`Traduzione in ${lang}...`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={str[lang.toLowerCase()] || ''}
                            onChange={(e) => handleLocalizationChange(index, lang, e.target.value)}
                            className="form-input text-sm"
                            placeholder={`Traduzione in ${lang}...`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="form-group">
                <label className="form-label">Comandi Button Script</label>
                <div className="space-y-2">
                  {editedMission.button.map((btn, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={btn}
                        onChange={(e) => {
                          const newButtons = [...editedMission.button];
                          newButtons[index] = e.target.value;
                          handleMissionChange('button', newButtons);
                        }}
                        className="form-input flex-1"
                        placeholder="blaunch"
                      />
                      <button
                        onClick={() => {
                          const newButtons = editedMission.button.filter((_, i) => i !== index);
                          handleMissionChange('button', newButtons);
                        }}
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                      const newButtons = [...editedMission.button, ''];
                      handleMissionChange('button', newButtons);
                    }}
                    className="btn-secondary text-sm"
                  >
                    + Aggiungi Comando
                  </button>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                <h4 className="font-medium text-yellow-200 mb-2">Comandi Button Comuni:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-yellow-300">
                  <div><strong>blaunch:</strong> Avvia missione</div>
                  <div><strong>camp_takeRoute:</strong> Prendi rotta</div>
                  <div><strong>ms_*:</strong> Mission script specifico</div>
                  <div><strong>adv*:</strong> Adventure deck standard</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
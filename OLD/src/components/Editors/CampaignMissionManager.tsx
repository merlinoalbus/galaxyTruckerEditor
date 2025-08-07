import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Edit3, 
  Languages, 
  Eye,
  Plus,
  Trash2,
  MapPin,
  Star,
  Play,
  Copy,
  FileText
} from 'lucide-react';
import { getCampaignCharacterImage } from '../../utils/imageUtils';

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

interface MissionTranslation {
  [key: string]: {
    caption: string;
    description: string;
  };
}

interface Character {
  name: string;
  image: string;
  displayName: string;
}

const LANGUAGES = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
const CHARACTERS: Character[] = [
  { name: 'tutor', image: 'tutor.png', displayName: 'Tutor' },
  { name: 'roughtrucker', image: 'roughtrucker.png', displayName: 'Rough Trucker' },
  { name: 'mechanic', image: 'mechanic.png', displayName: 'Mechanic' },
  { name: 'bartender', image: 'bartender.png', displayName: 'Bartender' },
  { name: 'clerk', image: 'clerk.png', displayName: 'Clerk' },
  { name: 'alien_purple', image: 'alien-purple.png', displayName: 'Purple Alien' },
  { name: 'alien_brown', image: 'alien-brown.png', displayName: 'Brown Alien' },
  { name: 'alien_cyan', image: 'alien-cyan.png', displayName: 'Cyan Alien' }
];

interface Props {
  onClose: () => void;
}

export function CampaignMissionManager({ onClose }: Props) {
  const [missions, setMissions] = useState<CampaignMission[]>([]);
  const [translations, setTranslations] = useState<Record<string, MissionTranslation>>({});
  const [selectedMission, setSelectedMission] = useState<CampaignMission | null>(null);
  const [editingTranslations, setEditingTranslations] = useState<Record<string, MissionTranslation>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load missions
      const missionsResponse = await fetch(`http://localhost:3001/api/campaignMissions/missions.yaml`);
      if (missionsResponse.ok) {
        const data = await missionsResponse.json();
        const yaml = await import('js-yaml');
        const parsedMissions = yaml.load(data.content) as CampaignMission[];
        setMissions(Array.isArray(parsedMissions) ? parsedMissions : []);
      }

      // Load translations for all languages
      const allTranslations: Record<string, MissionTranslation> = {};
      
      for (const lang of LANGUAGES) {
        try {
          const categoryName = lang === 'EN' ? 'campaignMissions' : `campaignScripts${lang}`;
          const response = await fetch(`http://localhost:3001/api/${categoryName}/missions.txt`);
          
          if (response.ok) {
            const data = await response.json();
            const content = data.content || '';
            const translations = parseMissionTranslations(content);
            allTranslations[lang] = translations;
          } else {
            allTranslations[lang] = {};
          }
        } catch (error) {
          console.warn(`Could not load translations for ${lang}:`, error);
          allTranslations[lang] = {};
        }
      }
      
      setTranslations(allTranslations);
      setEditingTranslations(JSON.parse(JSON.stringify(allTranslations)));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseMissionTranslations = (content: string): MissionTranslation => {
    const translations: MissionTranslation = {};
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && trimmed.includes('=')) {
        const [key, value] = trimmed.split('=', 2);
        const cleanKey = key.trim();
        const cleanValue = value.trim();
        
        if (cleanKey.endsWith('_caption')) {
          const missionName = cleanKey.replace('_caption', '');
          if (!translations[missionName]) translations[missionName] = { caption: '', description: '' };
          translations[missionName].caption = cleanValue;
        } else if (cleanKey.endsWith('_description')) {
          const missionName = cleanKey.replace('_description', '');
          if (!translations[missionName]) translations[missionName] = { caption: '', description: '' };
          translations[missionName].description = cleanValue;
        }
      }
    });
    
    return translations;
  };

  const generateTranslationContent = (translations: MissionTranslation): string => {
    const lines: string[] = ['// Mission translations', ''];
    
    Object.keys(translations).forEach(missionName => {
      const trans = translations[missionName];
      if (trans.caption) {
        lines.push(`${missionName}_caption=${trans.caption}`);
      }
      if (trans.description) {
        lines.push(`${missionName}_description=${trans.description}`);
      }
      lines.push('');
    });
    
    return lines.join('\n');
  };

  const handleTranslationChange = (missionName: string, lang: string, field: 'caption' | 'description', value: string) => {
    setEditingTranslations(prev => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [missionName]: {
          ...prev[lang]?.[missionName],
          [field]: value
        }
      }
    }));
  };

  const handleSaveTranslations = async () => {
    setSaving(true);
    try {
      for (const lang of LANGUAGES) {
        if (lang === 'EN') continue; // Skip EN as it's stored in YAML
        
        const categoryName = `campaignScripts${lang}`;
        const content = generateTranslationContent(editingTranslations[lang] || {});
        
        await fetch(`http://localhost:3001/api/${categoryName}/missions.txt`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });
      }
      
      setTranslations(JSON.parse(JSON.stringify(editingTranslations)));
      console.log('Translations saved successfully');
    } catch (error) {
      console.error('Error saving translations:', error);
      alert('Errore durante il salvataggio delle traduzioni');
    } finally {
      setSaving(false);
    }
  };

  const copyFromEnglish = (missionName: string, toLang: string) => {
    const mission = missions.find(m => m.name === missionName);
    if (mission) {
      handleTranslationChange(missionName, toLang, 'caption', mission.caption);
      handleTranslationChange(missionName, toLang, 'description', mission.description);
    }
  };

  const filteredMissions = missions.filter(mission => 
    mission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mission.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mission.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mission.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMissionTypeIcon = (type: string) => {
    return type === 'UNIQUE' ? <Star className="w-4 h-4 text-purple-400" /> : <Play className="w-4 h-4 text-blue-400" />;
  };

  const getLicenseColor = (license: string) => {
    switch (license) {
      case 'STI': return 'bg-green-600';
      case 'STII': return 'bg-yellow-600';  
      case 'STIII': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gt-primary rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gt-accent mx-auto mb-4"></div>
          <p className="text-white">Caricamento missioni campagna...</p>
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
              <h2 className="text-xl font-bold text-white">Gestione Missioni Campagna</h2>
              <p className="text-sm text-gray-300">
                {missions.length} missioni totali - Editor completo con traduzioni integrate
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveTranslations}
              disabled={saving}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvataggio...' : 'Salva Traduzioni'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gt-primary rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and Character Selection */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cerca missioni per nome, titolo, source, destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input w-full"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm">Personaggio:</span>
              <select
                value={selectedCharacter?.name || ''}
                onChange={(e) => {
                  const char = CHARACTERS.find(c => c.name === e.target.value);
                  setSelectedCharacter(char || null);
                }}
                className="form-input form-select"
              >
                <option value="">Tutti</option>
                {CHARACTERS.map(char => (
                  <option key={char.name} value={char.name}>{char.displayName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Character Preview */}
        {selectedCharacter && (
          <div className="p-4 border-b border-slate-700 bg-gt-secondary/30">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden">
                <img
                  src={getCampaignCharacterImage(selectedCharacter.image)}
                  alt={selectedCharacter.displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h3 className="text-white font-medium">{selectedCharacter.displayName}</h3>
                <p className="text-gray-400 text-sm">File: {selectedCharacter.image}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mission List */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 200px)' }}>
          <div className="p-4 space-y-4">
            {filteredMissions.map((mission, index) => (
              <div key={mission.name} className="bg-gt-secondary/30 rounded-lg border border-slate-600">
                {/* Mission Header */}
                <div className="p-4 border-b border-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getMissionTypeIcon(mission.missiontype)}
                      <div>
                        <h3 className="font-bold text-white">{mission.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <MapPin className="w-3 h-3" />
                          <span>{mission.source} → {mission.destination}</span>
                          <span className={`px-2 py-1 rounded text-xs text-white ${getLicenseColor(mission.license)}`}>
                            {mission.license}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedMission(selectedMission?.name === mission.name ? null : mission)}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>{selectedMission?.name === mission.name ? 'Chiudi' : 'Modifica'}</span>
                    </button>
                  </div>
                </div>

                {/* Mission Content - Always visible now */}
                <div className="p-4">
                  {/* English Version */}
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-2 flex items-center space-x-2">
                      <span>🇬🇧 Inglese (Originale)</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 text-sm mb-1">Titolo</label>
                        <div className="form-input bg-gt-primary/50 text-white">{mission.caption}</div>
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm mb-1">Descrizione</label>
                        <div className="form-input bg-gt-primary/50 text-white">{mission.description}</div>
                      </div>
                    </div>
                  </div>

                  {/* Translations */}
                  <div className="space-y-4">
                    {LANGUAGES.filter(lang => lang !== 'EN').map(lang => (
                      <div key={lang} className="border border-slate-600 rounded p-3">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-white font-medium">
                            {lang === 'CS' && '🇨🇿 Ceco'}
                            {lang === 'DE' && '🇩🇪 Tedesco'}
                            {lang === 'ES' && '🇪🇸 Spagnolo'}
                            {lang === 'FR' && '🇫🇷 Francese'}
                            {lang === 'PL' && '🇵🇱 Polacco'}
                            {lang === 'RU' && '🇷🇺 Russo'}
                          </h4>
                          <button
                            onClick={() => copyFromEnglish(mission.name, lang)}
                            className="text-xs btn-secondary flex items-center space-x-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copia da EN</span>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-300 text-sm mb-1">Titolo</label>
                            <input
                              type="text"
                              value={editingTranslations[lang]?.[mission.name]?.caption || ''}
                              onChange={(e) => handleTranslationChange(mission.name, lang, 'caption', e.target.value)}
                              className="form-input w-full"
                              placeholder={`Traduzione titolo in ${lang}...`}
                            />
                          </div>
                          <div>
                            <label className="block text-gray-300 text-sm mb-1">Descrizione</label>
                            <textarea
                              value={editingTranslations[lang]?.[mission.name]?.description || ''}
                              onChange={(e) => handleTranslationChange(mission.name, lang, 'description', e.target.value)}
                              className="form-input w-full resize-none"
                              rows={2}
                              placeholder={`Traduzione descrizione in ${lang}...`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
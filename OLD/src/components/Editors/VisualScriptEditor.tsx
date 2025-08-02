import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Plus,
  Trash2,
  GripVertical,
  MessageSquare,
  Clock,
  BarChart3,
  GitBranch,
  Menu,
  Eye,
  EyeOff,
  Rocket,
  User,
  MapPin,
  Languages,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getCampaignCharacterImage, getCampaignMapImage } from '../../utils/imageUtils';
import { FlowVisualization } from './FlowVisualization';
import { ConfigurationEditor } from './ConfigurationEditor';

// Types for script blocks
interface BaseScriptBlock {
  id: string;
  type: string;
  line: number;
}

interface DialogueBlock extends BaseScriptBlock {
  type: 'dialogue';
  character: string;
  characterImage: string;
  text: { [lang: string]: string };
  characterPosition?: 'left' | 'center' | 'right';
}

interface DelayBlock extends BaseScriptBlock {
  type: 'delay';
  milliseconds: number;
}

interface CharacterBlock extends BaseScriptBlock {
  type: 'character';
  action: 'show' | 'hide' | 'change';
  character: string;
  characterImage: string;
  position?: 'left' | 'center' | 'right';
}

interface StatsBlock extends BaseScriptBlock {
  type: 'stats';
  statType: 'credits' | 'reputation' | 'license';
  change: number;
  operation: 'add' | 'subtract' | 'set';
}

interface ConditionBlock extends BaseScriptBlock {
  type: 'condition';
  condition: string;
  description: string;
}

interface MenuBlock extends BaseScriptBlock {
  type: 'menu';
  options: Array<{
    text: { [lang: string]: string };
    action: string;
  }>;
}

interface SceneBlock extends BaseScriptBlock {
  type: 'scene';
  action: 'show' | 'hide';
  sceneType: 'dialogue' | 'mission' | 'custom';
}

interface MissionBlock extends BaseScriptBlock {
  type: 'mission';
  missionId: string;
  missionName: string;
  action: 'start' | 'complete' | 'fail';
}

interface NodeBlock extends BaseScriptBlock {
  type: 'node';
  nodeId: string;
  nodeName: string;
  nodeImage: string;
  action: 'goto' | 'unlock' | 'lock';
}

type ScriptBlock = DialogueBlock | DelayBlock | CharacterBlock | StatsBlock | 
                  ConditionBlock | MenuBlock | SceneBlock | MissionBlock | NodeBlock;

interface Character {
  name: string;
  images: string[];
  displayName: string;
}

interface ScriptFile {
  name: string;
  displayName: string;
  language: string;
}

const LANGUAGES = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
const LANGUAGE_FLAGS = {
  'EN': '🇬🇧',
  'CS': '🇨🇿', 
  'DE': '🇩🇪',
  'ES': '🇪🇸',
  'FR': '🇫🇷',
  'PL': '🇵🇱',
  'RU': '🇷🇺'
};

const CHARACTERS: Character[] = [
  { name: 'tutor', images: ['tutor.png', 'tutor-happy.png', 'tutor-angry.png', 'tutor-pizza.png', 'tutor-hidden.png'], displayName: 'Tutor' },
  { name: 'mechanic', images: ['mechanic.png'], displayName: 'Mechanic' },
  { name: 'bartender', images: ['bartender.png'], displayName: 'Bartender' },
  { name: 'clerk', images: ['clerk.png'], displayName: 'Clerk' },
  { name: 'roughtrucker', images: ['roughtrucker.png'], displayName: 'Rough Trucker' },
  { name: 'purplealien', images: ['purplealien.png'], displayName: 'Purple Alien' },
  { name: 'brownalien', images: ['brownalien.png'], displayName: 'Brown Alien' },
  { name: 'cyanalien', images: ['cyanalien.png'], displayName: 'Cyan Alien' },
  { name: 'ambassador', images: ['ambassador.png'], displayName: 'Ambassador' },
  { name: 'foreman', images: ['foreman.png'], displayName: 'Foreman' },
  { name: 'scientist', images: ['scientist.png'], displayName: 'Scientist' }
];

const SCRIPT_FILES: ScriptFile[] = [
  { name: 'scripts1.txt', displayName: 'Pre-Mission Scripts', language: 'EN' },
  { name: 'scripts2.txt', displayName: 'Advanced Scripts', language: 'EN' },
  { name: 'missions.txt', displayName: 'Post-Mission Scripts', language: 'EN' },
  { name: 'inits.txt', displayName: 'Initialization Scripts', language: 'EN' },
  { name: 'tutorials.txt', displayName: 'Tutorial Scripts', language: 'EN' }
];

interface Props {
  language: string;
  filename: string;
  onClose: () => void;
}

export function VisualScriptEditor({ language, filename, onClose }: Props) {
  const [scriptBlocks, setScriptBlocks] = useState<ScriptBlock[]>([]);
  const [activeFile, setActiveFile] = useState(filename);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showFlowView, setShowFlowView] = useState(false);
  const [showConfigEditor, setShowConfigEditor] = useState<{type: 'SET' | 'IF' | 'VARIABLE', config: any} | null>(null);

  useEffect(() => {
    loadScript();
  }, [language, activeFile]);

  const loadScript = async () => {
    setLoading(true);
    try {
      // Load script content for all languages
      const allLanguageContent: Record<string, string> = {};
      
      for (const lang of LANGUAGES) {
        try {
          const categoryName = lang === 'EN' ? 'campaignMissions' : `campaignScripts${lang}`;
          const response = await fetch(`http://localhost:3001/api/${categoryName}/${activeFile}`);
          
          if (response.ok) {
            const data = await response.json();
            allLanguageContent[lang] = data.content || '';
          }
        } catch (error) {
          console.warn(`Could not load ${lang} version of ${activeFile}:`, error);
        }
      }
      
      // Parse the main language (prioritize EN, then current language)
      const mainContent = allLanguageContent['EN'] || allLanguageContent[language] || '';
      const blocks = parseScriptToBlocks(mainContent, allLanguageContent);
      setScriptBlocks(blocks);
    } catch (error) {
      console.error('Error loading script:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseScriptToBlocks = (content: string, allLanguageContent: Record<string, string> = {}): ScriptBlock[] => {
    const lines = content.split('\n');
    const blocks: ScriptBlock[] = [];
    let blockId = 0;
    let currentMenu: MenuBlock | null = null;

    // Parse translations for dialogue text
    const parseDialogueTranslations = (englishText: string, lineIndex: number): Record<string, string> => {
      const translations: Record<string, string> = { 'EN': englishText };
      
      // Try to find corresponding translations at same line position
      LANGUAGES.forEach(lang => {
        if (lang === 'EN') return;
        const langContent = allLanguageContent[lang];
        if (langContent) {
          const langLines = langContent.split('\n');
          
          // First try: exact line position match
          if (langLines[lineIndex]) {
            const langMatch = langLines[lineIndex].match(/^(Say|Ask)\s+"(.+)"$/);
            if (langMatch) {
              translations[lang] = langMatch[2];
              return;
            }
          }
          
          // Second try: search for similar dialogue in vicinity
          const searchRange = 5; // Look 5 lines before/after
          for (let i = Math.max(0, lineIndex - searchRange); i < Math.min(langLines.length, lineIndex + searchRange); i++) {
            const langMatch = langLines[i].match(/^(Say|Ask)\s+"(.+)"$/);
            if (langMatch && !translations[lang]) {
              // Basic similarity check - could be improved
              const similarity = calculateSimilarity(englishText.toLowerCase(), langMatch[2].toLowerCase());
              if (similarity > 0.5) { // 50% similarity threshold
                translations[lang] = langMatch[2];
                break;
              }
            }
          }
        }
      });
      
      return translations;
    };

    const calculateSimilarity = (str1: string, str2: string): number => {
      if (str1 === str2) return 1;
      if (str1.length === 0 || str2.length === 0) return 0;
      
      // Simple word-based similarity
      const words1 = str1.split(' ');
      const words2 = str2.split(' ');
      const commonWords = words1.filter(word => words2.includes(word));
      
      return (commonWords.length * 2) / (words1.length + words2.length);
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) return;

      // Parse different block types
      if (trimmed.startsWith('Say ') || trimmed.startsWith('Ask ')) {
        const match = trimmed.match(/^(Say|Ask)\s+"(.+)"$/);
        if (match) {
          const translations = parseDialogueTranslations(match[2], index);
          blocks.push({
            id: `block_${blockId++}`,
            type: 'dialogue',
            line: index + 1,
            character: 'tutor', // Default character
            characterImage: 'tutor.png',
            text: translations,
            characterPosition: 'left'
          } as DialogueBlock);
        }
      } else if (trimmed.startsWith('Delay ')) {
        const match = trimmed.match(/^Delay\s+(\d+)$/);
        if (match) {
          blocks.push({
            id: `block_${blockId++}`,
            type: 'delay',
            line: index + 1,
            milliseconds: parseInt(match[1])
          } as DelayBlock);
        }
      } else if (trimmed.startsWith('ShowChar ')) {
        const parts = trimmed.substring(9).split(' ');
        blocks.push({
          id: `block_${blockId++}`,
          type: 'character',
          line: index + 1,
          action: 'show',
          character: parts[0] || 'tutor',
          characterImage: `${parts[0] || 'tutor'}.png`,
          position: (parts[1] as 'left' | 'center' | 'right') || 'left'
        } as CharacterBlock);
      } else if (trimmed.startsWith('HideChar ')) {
        const character = trimmed.substring(9).trim();
        blocks.push({
          id: `block_${blockId++}`,
          type: 'character',
          line: index + 1,
          action: 'hide',
          character: character || 'tutor',
          characterImage: `${character || 'tutor'}.png`
        } as CharacterBlock);
      } else if (trimmed.startsWith('ChangeChar ')) {
        const parts = trimmed.substring(11).split(' ');
        blocks.push({
          id: `block_${blockId++}`,
          type: 'character',
          line: index + 1,
          action: 'change',
          character: parts[0] || 'tutor',
          characterImage: parts[1] || `${parts[0] || 'tutor'}.png`
        } as CharacterBlock);
      } else if (trimmed === 'MENU') {
        currentMenu = {
          id: `block_${blockId++}`,
          type: 'menu',
          line: index + 1,
          options: []
        } as MenuBlock;
        blocks.push(currentMenu);
      } else if (trimmed.startsWith('OPT ') && currentMenu) {
        const match = trimmed.match(/^OPT\s+"(.+)"$/);
        if (match) {
          const optionText = parseDialogueTranslations(match[1], index);
          currentMenu.options.push({
            text: optionText,
            action: ''
          });
        }
      } else if (trimmed === 'END_OF_OPT') {
        // End of current option
      } else if (currentMenu && currentMenu.options.length > 0 && !trimmed.startsWith('OPT ') && trimmed !== 'MENU') {
        // This might be an action for the last option
        const lastOption = currentMenu.options[currentMenu.options.length - 1];
        if (!lastOption.action) {
          lastOption.action = trimmed;
        }
      } else if (trimmed.startsWith('//')) {
        // Skip comments
      } else if (trimmed && !['SCRIPTS', 'END_OF_OPT', 'RETURN', 'END_OF_IF'].includes(trimmed)) {
        // Generic command block for unrecognized commands
        blocks.push({
          id: `block_${blockId++}`,
          type: 'other',
          line: index + 1,
          command: trimmed
        } as any);
      }
    });

    return blocks;
  };

  const generateScriptFromBlocks = (): string => {
    const scriptLines: string[] = [
      '// Generated script from Visual Editor',
      'SCRIPTS',
      ''
    ];

    scriptBlocks.forEach(block => {
      switch (block.type) {
        case 'dialogue':
          const dialogueBlock = block as DialogueBlock;
          const text = dialogueBlock.text[selectedLanguage] || dialogueBlock.text['EN'] || '';
          scriptLines.push(`Say "${text}"`);
          break;
        case 'delay':
          const delayBlock = block as DelayBlock;
          scriptLines.push(`Delay ${delayBlock.milliseconds}`);
          break;
        case 'character':
          const charBlock = block as CharacterBlock;
          if (charBlock.action === 'show') {
            scriptLines.push(`ShowChar ${charBlock.character} ${charBlock.position || 'left'}`);
          } else if (charBlock.action === 'hide') {
            scriptLines.push(`HideChar ${charBlock.character}`);
          } else if (charBlock.action === 'change') {
            scriptLines.push(`ChangeChar ${charBlock.character} ${charBlock.characterImage}`);
          }
          break;
        case 'stats':
          const statsBlock = block as StatsBlock;
          const op = statsBlock.operation === 'add' ? '+' : statsBlock.operation === 'subtract' ? '-' : '=';
          scriptLines.push(`// ${op}${statsBlock.change} ${statsBlock.statType}`);
          break;
        case 'menu':
          const menuBlock = block as MenuBlock;
          scriptLines.push('MENU');
          menuBlock.options.forEach(option => {
            const text = option.text[selectedLanguage] || option.text['EN'] || '';
            scriptLines.push(`OPT "${text}"`);
            if (option.action) {
              scriptLines.push(`  ${option.action}`);
            }
            scriptLines.push('END_OF_OPT');
          });
          break;
        case 'node':
          const nodeBlock = block as NodeBlock;
          if (nodeBlock.action === 'goto') {
            scriptLines.push(`// Go to node: ${nodeBlock.nodeId}`);
          }
          break;
        default:
          scriptLines.push(`// Unknown block type: ${block.type}`);
      }
    });

    return scriptLines.join('\n');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const scriptContent = generateScriptFromBlocks();
      const categoryName = language === 'EN' ? 'campaignMissions' : `campaignScripts${language}`;
      
      const response = await fetch(`http://localhost:3001/api/${categoryName}/${activeFile}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: scriptContent })
      });

      if (response.ok) {
        console.log('Script saved successfully');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Error saving script:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (type: string) => {
    const newBlock: ScriptBlock = {
      id: `block_${Date.now()}`,
      type,
      line: scriptBlocks.length + 1
    } as any;

    // Set defaults based on type
    if (type === 'dialogue') {
      Object.assign(newBlock, {
        character: 'tutor',
        characterImage: 'tutor.png',
        text: { [selectedLanguage]: 'New dialogue...' },
        characterPosition: 'left'
      });
    } else if (type === 'delay') {
      Object.assign(newBlock, {
        milliseconds: 1000
      });
    } else if (type === 'character') {
      Object.assign(newBlock, {
        action: 'show',
        character: 'tutor',
        characterImage: 'tutor.png',
        position: 'left'
      });
    } else if (type === 'stats') {
      Object.assign(newBlock, {
        statType: 'credits',
        change: 100,
        operation: 'add'
      });
    } else if (type === 'menu') {
      Object.assign(newBlock, {
        options: [{ text: { [selectedLanguage]: 'Option 1...' }, action: '' }]
      });
    } else if (type === 'node') {
      Object.assign(newBlock, {
        nodeId: 'newbie',
        nodeName: 'Port Newbie',
        nodeImage: 'newbieport.png',
        action: 'goto'
      });
    }

    setScriptBlocks([...scriptBlocks, newBlock]);
  };

  const updateBlock = (blockId: string, updates: any) => {
    setScriptBlocks(blocks => 
      blocks.map(block => 
        block.id === blockId ? { ...block, ...updates } as ScriptBlock : block
      )
    );
  };

  const deleteBlock = (blockId: string) => {
    setScriptBlocks(blocks => blocks.filter(block => block.id !== blockId));
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...scriptBlocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    setScriptBlocks(newBlocks);
  };

  const handleFlowBlockSelect = (blockId: string) => {
    setSelectedBlockId(blockId);
    // Scroll to the block in the editor
    const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
    if (blockElement) {
      blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const renderDialogueBlock = (block: DialogueBlock, index: number) => (
    <div key={block.id} className="bg-green-900/20 border border-green-700 rounded-lg p-4">
      <div className="flex items-start space-x-4">
        {/* Character Image */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden">
            <img
              src={getCampaignCharacterImage(block.characterImage)}
              alt={block.character}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <select
            value={block.characterImage}
            onChange={(e) => updateBlock(block.id, { characterImage: e.target.value })}
            className="form-select text-xs mt-1 w-full bg-gt-secondary text-white border-slate-600"
          >
            {CHARACTERS.find(c => c.name === block.character)?.images.map(img => (
              <option key={img} value={img}>{img}</option>
            ))}
          </select>
        </div>
        
        {/* Dialogue Content */}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquare className="w-4 h-4 text-green-400" />
            <select
              value={block.character}
              onChange={(e) => {
                const char = CHARACTERS.find(c => c.name === e.target.value);
                updateBlock(block.id, { 
                  character: e.target.value,
                  characterImage: char?.images[0] || 'tutor.png'
                });
              }}
              className="form-select bg-gt-secondary text-white border-slate-600"
            >
              {CHARACTERS.map(char => (
                <option key={char.name} value={char.name}>{char.displayName}</option>
              ))}
            </select>
            <select
              value={block.characterPosition || 'left'}
              onChange={(e) => updateBlock(block.id, { characterPosition: e.target.value as any })}
              className="form-select bg-gt-secondary text-white border-slate-600"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          
          {/* Multilingual Text */}
          <div className="space-y-2">
            {LANGUAGES.map(lang => (
              <div key={lang} className="flex items-center space-x-2">
                <span className="text-sm">{LANGUAGE_FLAGS[lang as keyof typeof LANGUAGE_FLAGS]}</span>
                <input
                  type="text"
                  value={block.text[lang] || ''}
                  onChange={(e) => updateBlock(block.id, { 
                    text: { ...block.text, [lang]: e.target.value }
                  })}
                  className="form-input flex-1 bg-gt-secondary text-white border-slate-600"
                  placeholder={`Dialogue in ${lang}...`}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col space-y-1">
          <button
            className="p-1 text-gray-400 hover:text-white cursor-grab"
            onMouseDown={() => setDraggedBlock(block.id)}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteBlock(block.id)}
            className="p-1 text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderDelayBlock = (block: DelayBlock, index: number) => (
    <div key={block.id} className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
      <div className="flex items-center space-x-4">
        <Clock className="w-6 h-6 text-yellow-400" />
        <div className="flex-1">
          <label className="block text-yellow-200 text-sm mb-2">Pausa (millisecondi)</label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={block.milliseconds}
              onChange={(e) => updateBlock(block.id, { milliseconds: parseInt(e.target.value) })}
              className="flex-1"
            />
            <input
              type="number"
              value={block.milliseconds}
              onChange={(e) => updateBlock(block.id, { milliseconds: parseInt(e.target.value) || 1000 })}
              className="form-input w-20"
            />
            <span className="text-yellow-200 text-sm">ms</span>
          </div>
        </div>
        <div className="flex flex-col space-y-1">
          <button
            className="p-1 text-gray-400 hover:text-white cursor-grab"
            onMouseDown={() => setDraggedBlock(block.id)}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteBlock(block.id)}
            className="p-1 text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderCharacterBlock = (block: CharacterBlock, index: number) => (
    <div key={block.id} className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
      <div className="flex items-center space-x-4">
        <User className="w-6 h-6 text-blue-400" />
        <div className="w-12 h-12 bg-gray-700 rounded overflow-hidden">
          <img
            src={getCampaignCharacterImage(block.characterImage)}
            alt={block.character}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex space-x-2">
            <select
              value={block.action}
              onChange={(e) => updateBlock(block.id, { action: e.target.value as any })}
              className="form-select bg-gt-secondary text-white border-slate-600"
            >
              <option value="show">Show Character</option>
              <option value="hide">Hide Character</option>
              <option value="change">Change Image</option>
            </select>
            <select
              value={block.character}
              onChange={(e) => {
                const char = CHARACTERS.find(c => c.name === e.target.value);
                updateBlock(block.id, { 
                  character: e.target.value,
                  characterImage: char?.images[0] || 'tutor.png'
                });
              }}
              className="form-select bg-gt-secondary text-white border-slate-600"
            >
              {CHARACTERS.map(char => (
                <option key={char.name} value={char.name}>{char.displayName}</option>
              ))}
            </select>
          </div>
          {block.action === 'show' && (
            <select
              value={block.position || 'left'}
              onChange={(e) => updateBlock(block.id, { position: e.target.value as any })}
              className="form-select bg-gt-secondary text-white border-slate-600"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          )}
        </div>
        <div className="flex flex-col space-y-1">
          <button
            className="p-1 text-gray-400 hover:text-white cursor-grab"
            onMouseDown={() => setDraggedBlock(block.id)}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteBlock(block.id)}
            className="p-1 text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStatsBlock = (block: StatsBlock, index: number) => (
    <div key={block.id} className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
      <div className="flex items-center space-x-4">
        <BarChart3 className="w-6 h-6 text-purple-400" />
        <div className="flex-1 space-y-2">
          <div className="flex space-x-2">
            <select
              value={block.statType}
              onChange={(e) => updateBlock(block.id, { statType: e.target.value as any })}
              className="form-select bg-gt-secondary text-white border-slate-600"
            >
              <option value="credits">💰 Crediti</option>
              <option value="reputation">⭐ Reputazione</option>
              <option value="license">🎫 Licenza</option>
            </select>
            <select
              value={block.operation}
              onChange={(e) => updateBlock(block.id, { operation: e.target.value as any })}
              className="form-select bg-gt-secondary text-white border-slate-600"
            >
              <option value="add">Aggiungi (+)</option>
              <option value="subtract">Sottrai (-)</option>
              <option value="set">Imposta (=)</option>
            </select>
            <input
              type="number"
              value={block.change}
              onChange={(e) => updateBlock(block.id, { change: parseInt(e.target.value) || 0 })}
              className="form-input w-24"
              placeholder="Valore"
            />
          </div>
          <div className="text-sm text-purple-200">
            {block.operation === 'add' && `+${block.change}`} 
            {block.operation === 'subtract' && `-${block.change}`}
            {block.operation === 'set' && `= ${block.change}`} {block.statType}
          </div>
        </div>
        <div className="flex flex-col space-y-1">
          <button
            className="p-1 text-gray-400 hover:text-white cursor-grab"
            onMouseDown={() => setDraggedBlock(block.id)}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteBlock(block.id)}
            className="p-1 text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderMenuBlock = (block: MenuBlock, index: number) => (
    <div key={block.id} className="bg-cyan-900/20 border border-cyan-700 rounded-lg p-4">
      <div className="flex items-start space-x-4">
        <Menu className="w-6 h-6 text-cyan-400 mt-1" />
        <div className="flex-1">
          <h4 className="text-cyan-200 font-medium mb-3">Menu Opzioni</h4>
          <div className="space-y-3">
            {block.options.map((option, optIndex) => (
              <div key={optIndex} className="bg-gt-secondary/30 rounded p-3">
                <div className="space-y-2">
                  {LANGUAGES.map(lang => (
                    <div key={lang} className="flex items-center space-x-2">
                      <span className="text-xs">{LANGUAGE_FLAGS[lang as keyof typeof LANGUAGE_FLAGS]}</span>
                      <input
                        type="text"
                        value={option.text[lang] || ''}
                        onChange={(e) => {
                          const newOptions = [...block.options];
                          newOptions[optIndex].text[lang] = e.target.value;
                          updateBlock(block.id, { options: newOptions });
                        }}
                        className="form-input flex-1 text-sm"
                        placeholder={`Opzione in ${lang}...`}
                      />
                    </div>
                  ))}
                  <input
                    type="text"
                    value={option.action}
                    onChange={(e) => {
                      const newOptions = [...block.options];
                      newOptions[optIndex].action = e.target.value;
                      updateBlock(block.id, { options: newOptions });
                    }}
                    className="form-input text-sm"
                    placeholder="Azione (es: goto_node, run_script, etc.)"
                  />
                </div>
                <button
                  onClick={() => {
                    const newOptions = block.options.filter((_, i) => i !== optIndex);
                    updateBlock(block.id, { options: newOptions });
                  }}
                  className="mt-2 text-red-400 hover:text-red-300 text-xs"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newOptions = [...block.options, { text: {}, action: '' }];
                updateBlock(block.id, { options: newOptions });
              }}
              className="btn-secondary text-sm flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Aggiungi Opzione</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col space-y-1">
          <button
            className="p-1 text-gray-400 hover:text-white cursor-grab"
            onMouseDown={() => setDraggedBlock(block.id)}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteBlock(block.id)}
            className="p-1 text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderNodeBlock = (block: NodeBlock, index: number) => (
    <div key={block.id} className="bg-orange-900/20 border border-orange-700 rounded-lg p-4">
      <div className="flex items-center space-x-4">
        <MapPin className="w-6 h-6 text-orange-400" />
        <div className="w-12 h-12 bg-gray-700 rounded overflow-hidden">
          <img
            src={getCampaignMapImage(block.nodeImage)}
            alt={block.nodeId}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex space-x-2">
            <select
              value={block.action}
              onChange={(e) => updateBlock(block.id, { action: e.target.value as any })}
              className="form-select bg-gt-secondary text-white border-slate-600"
            >
              <option value="goto">Vai al Nodo</option>
              <option value="unlock">Sblocca Nodo</option>
              <option value="lock">Blocca Nodo</option>
            </select>
            <input
              type="text"
              value={block.nodeId}
              onChange={(e) => updateBlock(block.id, { nodeId: e.target.value, nodeName: e.target.value })}
              className="form-input"
              placeholder="ID nodo (es: newbie, bar, etc.)"
            />
          </div>
          <div className="text-sm text-orange-200">
            {block.action === 'goto' && '🚀 '}{block.action === 'unlock' && '🔓 '}{block.action === 'lock' && '🔒 '}
            {block.nodeName || block.nodeId}
          </div>
        </div>
        <div className="flex flex-col space-y-1">
          <button
            className="p-1 text-gray-400 hover:text-white cursor-grab"
            onMouseDown={() => setDraggedBlock(block.id)}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteBlock(block.id)}
            className="p-1 text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

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
      <div className="bg-gt-primary rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gt-secondary p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-6 h-6 text-gt-accent" />
            <div>
              <h2 className="text-xl font-bold text-white">Editor Script Visuale</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <span>{activeFile}</span>
                <span>•</span>
                <span>{language}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={saving}
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

        {/* File Tabs */}
        <div className="border-b border-slate-700">
          <div className="flex overflow-x-auto">
            {SCRIPT_FILES.map(file => (
              <button
                key={file.name}
                onClick={() => setActiveFile(file.name)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 ${
                  activeFile === file.name
                    ? 'border-gt-accent text-gt-accent'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {file.displayName}
              </button>
            ))}
          </div>
        </div>

        {/* Add Block Toolbar */}
        <div className="p-4 border-b border-slate-700 bg-gt-secondary/30">
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm font-medium">Aggiungi Blocco:</span>
            <button
              onClick={() => addBlock('dialogue')}
              className="btn-secondary text-sm flex items-center space-x-1"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Dialogo</span>
            </button>
            <button
              onClick={() => addBlock('delay')}
              className="btn-secondary text-sm flex items-center space-x-1"
            >
              <Clock className="w-4 h-4" />
              <span>Pausa</span>
            </button>
            <button
              onClick={() => addBlock('character')}
              className="btn-secondary text-sm flex items-center space-x-1"
            >
              <User className="w-4 h-4" />
              <span>Personaggio</span>
            </button>
            <button
              onClick={() => addBlock('stats')}
              className="btn-secondary text-sm flex items-center space-x-1"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Stats</span>
            </button>
            <button
              onClick={() => addBlock('menu')}
              className="btn-secondary text-sm flex items-center space-x-1"
            >
              <Menu className="w-4 h-4" />
              <span>Menu</span>
            </button>
            <button
              onClick={() => addBlock('node')}
              className="btn-secondary text-sm flex items-center space-x-1"
            >
              <MapPin className="w-4 h-4" />
              <span>Nodo</span>
            </button>
            <div className="flex-1"></div>
            <button
              onClick={() => setShowFlowView(!showFlowView)}
              className={`btn-secondary text-sm flex items-center space-x-1 ${showFlowView ? 'bg-gt-accent/20' : ''}`}
            >
              <GitBranch className="w-4 h-4" />
              <span>Flusso</span>
            </button>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="form-select text-sm bg-gt-secondary text-white border-slate-600"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{LANGUAGE_FLAGS[lang as keyof typeof LANGUAGE_FLAGS]} {lang}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex" style={{ height: 'calc(95vh - 200px)' }}>
          {/* Script Blocks Editor */}
          <div className={`${showFlowView ? 'w-2/3' : 'w-full'} overflow-y-auto p-4 space-y-4 border-r border-slate-700`}>
            {scriptBlocks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="w-16 h-16 mx-auto mb-4" />
                <h3 className="font-medium mb-2">Script Vuoto</h3>
                <p className="text-sm">Aggiungi il primo blocco per iniziare a creare il tuo script</p>
              </div>
            ) : (
              scriptBlocks.map((block, index) => {
                const isSelected = selectedBlockId === block.id;
                const blockElement = (() => {
                  switch (block.type) {
                    case 'dialogue':
                      return renderDialogueBlock(block as DialogueBlock, index);
                    case 'delay':
                      return renderDelayBlock(block as DelayBlock, index);
                    case 'character':
                      return renderCharacterBlock(block as CharacterBlock, index);
                    case 'stats':
                      return renderStatsBlock(block as StatsBlock, index);
                    case 'menu':
                      return renderMenuBlock(block as MenuBlock, index);
                    case 'node':
                      return renderNodeBlock(block as NodeBlock, index);
                    default:
                      return null;
                  }
                })();

                return (
                  <div
                    key={block.id}
                    data-block-id={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`${isSelected ? 'ring-2 ring-gt-accent' : ''} rounded-lg transition-all`}
                  >
                    {blockElement}
                  </div>
                );
              })
            )}
          </div>

          {/* Flow Visualization */}
          {showFlowView && (
            <div className="w-1/3 bg-gt-secondary/30">
              <FlowVisualization
                blocks={scriptBlocks}
                selectedBlockId={selectedBlockId}
                onBlockSelect={handleFlowBlockSelect}
              />
            </div>
          )}
        </div>
      </div>

      {/* Configuration Editor Modal */}
      {showConfigEditor && (
        <ConfigurationEditor
          configType={showConfigEditor.type}
          initialConfig={showConfigEditor.config}
          onSave={(config) => {
            // Handle save logic here
            console.log('Saved config:', config);
            setShowConfigEditor(null);
          }}
          onClose={() => setShowConfigEditor(null)}
        />
      )}
    </div>
  );
}
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  MessageCircle, 
  User, 
  Settings, 
  Clock, 
  Tag, 
  ArrowRight, 
  FileText, 
  Zap,
  MapPin,
  Eye,
  EyeOff,
  Menu as MenuIcon,
  GitBranch,
  Variable,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Image,
  BarChart3
} from 'lucide-react';
import { CampaignScriptParser, ParsedScript, ScriptBlock } from '../../services/CampaignScriptParser';

interface Character {
  name: string;
  images: string[];
  displayName: string;
}

interface DialogueTranslations {
  [key: string]: string; // language code -> translated text
}

interface VisualScriptComponent {
  id: string;
  type: string;
  content: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  connections: string[];
  metadata: any;
}

interface CompleteCampaignFlowEditorProps {
  selectedScript?: string;
  selectedNode?: string;
  onScriptChange?: (scriptName: string, content: any) => void;
}

const CHARACTERS: Character[] = [
  { name: 'tutor', images: ['tutor.png', 'tutor-smile.png', 'tutor-scary.png', 'tutor-hidden.png', 'tutor-out.png', 'tutor-pizza.png'], displayName: 'Tutor' },
  { name: 'mechanic', images: ['mech.png', 'mech-blush.png', 'mech-explaining.png', 'mech-f.png', 'mech-intercom.png', 'mech-kiss.png', 'mech-thumbup.png', 'mech-thumbup-f.png'], displayName: 'Mechanic' },
  { name: 'ambassador', images: ['ambassador.png', 'ambassador-happy.png', 'ambassador-peek.png'], displayName: 'Ambassador' },
  { name: 'bartender', images: ['bartender.png', 'bartender-close.png', 'bartender-overIntercom.png', 'bartender-overIntercom1.png', 'bartender-warehouse.png'], displayName: 'Bartender' },
  { name: 'brown', images: ['brown.png', 'brown-frown.png', 'brown-purr.png'], displayName: 'Brown Alien' },
  { name: 'cyan', images: ['cyan.png'], displayName: 'Cyan Alien' },
  { name: 'purple', images: ['purple.png'], displayName: 'Purple Alien' },
  { name: 'chair', images: ['chair.png', 'chair-no.png', 'chair-no-smile.png', 'chair-smile.png', 'chair-sorry.png', 'chair-welcome.png'], displayName: 'Club President' },
  { name: 'clerk', images: ['clerk.png', 'clerk-frown.png'], displayName: 'Clerk' },
  { name: 'designer', images: ['designer.png', 'designer-butterfly.png', 'designer-down.png', 'designer-expl.png', 'designer-game.png', 'designer-hi.png', 'designer-note.png', 'designer-point.png'], displayName: 'Designer' },
  { name: 'foreman', images: ['foreman.png', 'foreman-hello.png', 'foreman-list.png', 'foreman-no.png', 'foreman-smile.png', 'foreman-whatsup.png'], displayName: 'Foreman' },
  { name: 'merchant', images: ['merch.png', 'merch-disappointed.png', 'merch-inviting.png', 'merch-laughA1.png', 'merch-laughA2.png', 'merch-laughB1.png', 'merch-laughB2.png', 'merch-sitting.png'], displayName: 'Merchant' },
  { name: 'pirate', images: ['pirate.png', 'pirate-closed.png', 'pirate-freeze.png', 'pirate-hands.png', 'pirate-hands-closed.png', 'pirate-hands-threaten.png'], displayName: 'Pirate' },
  { name: 'prisoner1', images: ['prisoner1.png', 'prisoner1-calmer.png', 'prisoner1-worried.png'], displayName: 'Prisoner 1' },
  { name: 'prisoner2', images: ['prisoner2.png'], displayName: 'Prisoner 2' },
  { name: 'rat', images: ['rat.png', 'rat-finger-frown.png', 'rat-finger-smile.png', 'rat-frown.png', 'rat-peek.png', 'rat-smile.png', 'rat-tied.png', 'rat-tied-down.png', 'rat-turn.png'], displayName: 'Rat' },
  { name: 'rich', images: ['rich.png', 'rich-bored.png', 'rich-bored-cheer.png', 'rich-smile.png', 'rich-smile-blink.png', 'rich-smile-cheer.png'], displayName: 'Rich VIP' },
  { name: 'sailor', images: ['sailor.png', 'sailor0.png', 'sailor1.png', 'sailor2.png', 'sailor3.png', 'sailor-dead.png', 'sailor-dying.png'], displayName: 'Sailor' },
  { name: 'guru', images: ['guru.png'], displayName: 'Robotic Guru' },
  { name: 'programmer', images: ['programmer.png'], displayName: 'Programmer' },
  { name: 'policeBot', images: ['policeBot.png'], displayName: 'Police Bot' },
  { name: 'securitybot', images: ['securitybot-sad.png'], displayName: 'Security Bot' }
];

export function CompleteCampaignFlowEditor({ selectedScript, selectedNode, onScriptChange }: CompleteCampaignFlowEditorProps) {
  const [parser] = useState(() => CampaignScriptParser.getInstance());
  const [analysis, setAnalysis] = useState<any>(null);
  const [currentScript, setCurrentScript] = useState<ParsedScript | null>(null);
  const [scriptFlow, setScriptFlow] = useState<ScriptBlock[]>([]);
  const [visualComponents, setVisualComponents] = useState<VisualScriptComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCharacter, setCurrentCharacter] = useState<{ name: string; image: string; position: string } | null>(null);
  const [variables, setVariables] = useState<Map<string, boolean>>(new Map());
  const [showAllScripts, setShowAllScripts] = useState(false);
  const [allScriptsList, setAllScriptsList] = useState<ParsedScript[]>([]);
  const [translations, setTranslations] = useState<Map<string, DialogueTranslations>>(new Map());
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeEditor();
  }, []);

  useEffect(() => {
    if (selectedScript && analysis) {
      loadScript(selectedScript);
    }
  }, [selectedScript, analysis]);

  useEffect(() => {
    if (selectedNode && analysis) {
      const nodeScripts = parser.getScriptsByNode(selectedNode);
      if (nodeScripts.length > 0) {
        loadScript(nodeScripts[0].name);
      }
    }
  }, [selectedNode, analysis]);

  const initializeEditor = async () => {
    try {
      setLoading(true);
      const campaignAnalysis = await parser.loadAndAnalyzeAllScripts();
      setAnalysis(campaignAnalysis);
      
      // Initialize variables with common campaign variables
      const variableMap = new Map<string, boolean>();
      campaignAnalysis.variables.forEach(variable => {
        variableMap.set(variable, false);
      });
      setVariables(variableMap);
      
      // Load all scripts for navigation
      setAllScriptsList(campaignAnalysis.scripts);
      
      // Load the first script or tutorial if no specific script selected
      if (!selectedScript && campaignAnalysis.scripts.length > 0) {
        const tutorialScript = campaignAnalysis.scripts.find(s => s.name.toLowerCase().includes('intro')) || campaignAnalysis.scripts[0];
        loadScript(tutorialScript.name);
      }
      
    } catch (error) {
      console.error('Error initializing campaign editor:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScript = async (scriptName: string) => {
    if (!analysis) return;

    const script = analysis.scriptMap.get(scriptName);
    if (!script) {
      console.warn(`Script not found: ${scriptName}`);
      return;
    }

    setCurrentScript(script);
    const flow = parser.getScriptFlow(scriptName);
    setScriptFlow(flow);
    
    // Convert script blocks to visual components
    const components = await buildVisualComponents(flow, script);
    setVisualComponents(components);
    
    // Load translations for all languages
    await loadScriptTranslations(script);
    
    // Reset character state
    setCurrentCharacter(null);
  };

  const loadScriptTranslations = async (script: ParsedScript) => {
    const languages = ['CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const translationMap = new Map<string, DialogueTranslations>();

    // Process each command that contains translatable text
    for (const command of script.commands) {
      if ((['dialogue', 'question', 'menu_option', 'menu_option_conditional', 'menu_option_conditional_not'].includes(command.type)) && command.parameters?.text) {
        const translations: DialogueTranslations = { EN: command.parameters.text };
        
        // Try to find translations in other language files
        for (const lang of languages) {
          try {
            const response = await fetch(`http://localhost:3001/api/campaign/${script.fileName}?lang=${lang}`);
            if (response.ok) {
              const data = await response.json();
              const content = data.content || '';
              
              // Simple translation matching - could be improved with better algorithm
              const langLines = content.split('\n');
              const matchingLine = langLines.find((line: string) => 
                line.toLowerCase().includes(command.parameters.text.substring(0, 20).toLowerCase())
              );
              
              if (matchingLine) {
                const translatedText = matchingLine.replace(/^(SAY|ASK|OPT)\s*/, '').replace(/^"|"$/g, '').trim();
                if (translatedText) {
                  translations[lang] = translatedText;
                }
              }
            }
          } catch (error) {
            console.warn(`Could not load translations for ${lang}:`, error);
          }
        }
        
        translationMap.set(`${command.line}`, translations);
      }
    }

    setTranslations(translationMap);
  };

  const buildVisualComponents = async (blocks: ScriptBlock[], script: ParsedScript): Promise<VisualScriptComponent[]> => {
    const components: VisualScriptComponent[] = [];
    let yPosition = 50;
    const xOffset = 50;
    let componentId = 0;

    const processBlocks = (blockList: ScriptBlock[], xPos: number, parentId?: string): { components: VisualScriptComponent[], maxY: number } => {
      let currentY = yPosition;
      const resultComponents: VisualScriptComponent[] = [];

      for (const block of blockList) {
        const component = createVisualComponent(block, xPos, currentY, `comp_${componentId++}`, script);
        resultComponents.push(component);

        if (parentId) {
          // Add connection to parent
          const parentComp = components.find(c => c.id === parentId);
          if (parentComp) {
            parentComp.connections.push(component.id);
          }
        }

        currentY += component.size.height + 20;

        // Process children recursively
        if (block.children && block.children.length > 0) {
          const childResult = processBlocks(block.children, xPos + 300, component.id);
          resultComponents.push(...childResult.components);
          currentY = Math.max(currentY, childResult.maxY);
        }
      }

      return { components: resultComponents, maxY: currentY };
    };

    const result = processBlocks(blocks, xOffset);
    yPosition = result.maxY;
    
    return result.components;
  };

  const createVisualComponent = (block: ScriptBlock, x: number, y: number, id: string, script: ParsedScript): VisualScriptComponent => {
    const baseComponent: VisualScriptComponent = {
      id,
      type: block.type,
      content: block.parameters,
      position: { x, y },
      size: { width: 280, height: 80 },
      connections: [],
      metadata: {
        ...block.metadata,
        originalBlock: block,
        script: script.name
      }
    };

    // Customize component based on type
    switch (block.type) {
      case 'dialog_start':
        baseComponent.size = { width: 400, height: 300 };
        baseComponent.content = {
          type: 'dialog_container',
          title: 'Dialog Scene',
          character: currentCharacter
        };
        break;

      case 'show_character':
        const characterData = CHARACTERS.find(c => c.name === block.parameters?.character);
        baseComponent.content = {
          ...block.parameters,
          characterData,
          availableImages: characterData?.images || []
        };
        baseComponent.size = { width: 300, height: 120 };
        break;

      case 'dialogue':
      case 'question':
        const translationKey = `${block.startLine}`;
        const dialogueTranslations = translations.get(translationKey) || { EN: block.parameters?.text || '' };
        
        baseComponent.content = {
          ...block.parameters,
          translations: dialogueTranslations,
          character: currentCharacter
        };
        baseComponent.size = { width: 350, height: 100 };
        break;

      case 'menu_start':
        baseComponent.size = { width: 400, height: 200 };
        baseComponent.content = {
          type: 'menu_container',
          title: 'Menu Options'
        };
        break;

      case 'menu_option':
      case 'menu_option_conditional':
      case 'menu_option_conditional_not':
        const optionTranslationKey = `${block.startLine}`;
        const optionTranslations = translations.get(optionTranslationKey) || { EN: block.parameters?.text || '' };
        
        baseComponent.content = {
          ...block.parameters,
          translations: optionTranslations,
          isConditional: block.type.includes('conditional')
        };
        baseComponent.size = { width: 320, height: 80 };
        break;

      case 'condition_start':
      case 'condition_start_not':
      case 'condition_tutorial_seen':
      case 'condition_from_campaign':
        baseComponent.content = {
          ...block.parameters,
          conditionType: block.type,
          availableVariables: Array.from(variables.keys())
        };
        baseComponent.size = { width: 300, height: 100 };
        break;

      case 'variable_set':
      case 'variable_reset':
        baseComponent.content = {
          ...block.parameters,
          action: block.type === 'variable_set' ? 'SET' : 'RESET',
          availableVariables: Array.from(variables.keys())
        };
        baseComponent.size = { width: 250, height: 70 };
        break;

      case 'subscript':
        const connectedScripts = parser.getConnectedScripts(script.name);
        baseComponent.content = {
          ...block.parameters,
          availableScripts: allScriptsList.map(s => s.name),
          connectedScripts: connectedScripts.map(s => s.name)
        };
        baseComponent.size = { width: 280, height: 90 };
        break;

      case 'start_mission':
        baseComponent.content = {
          ...block.parameters,
          availableMissions: Array.from(analysis?.missions || [])
        };
        baseComponent.size = { width: 300, height: 90 };
        break;

      case 'center_map':
        baseComponent.content = {
          ...block.parameters,
          availableNodes: analysis ? Array.from(analysis.nodeScriptMap.keys()) : []
        };
        break;

      default:
        baseComponent.size = { width: 250, height: 60 };
    }

    return baseComponent;
  };

  const renderVisualComponent = (component: VisualScriptComponent) => {
    const isSelected = selectedComponent === component.id;
    const isEditing = editingComponent === component.id;

    const baseClasses = `absolute border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 ${
      isSelected ? 'border-gt-accent bg-gt-accent/20' : 'border-slate-600 bg-gt-secondary'
    } ${isEditing ? 'ring-2 ring-blue-400' : ''}`;

    const handleClick = () => {
      setSelectedComponent(component.id);
      if (isSelected) {
        setEditingComponent(component.id);
      }
    };

    const handleDoubleClick = () => {
      setEditingComponent(component.id);
    };

    return (
      <div
        key={component.id}
        className={baseClasses}
        style={{
          left: component.position.x,
          top: component.position.y,
          width: component.size.width,
          height: component.size.height
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {renderComponentContent(component, isEditing)}
      </div>
    );
  };

  const renderComponentContent = (component: VisualScriptComponent, isEditing: boolean) => {
    switch (component.type) {
      case 'dialog_start':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center space-x-2 mb-2">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-white">Dialog Scene</span>
            </div>
            <div className="flex-1 bg-slate-700 rounded p-2 text-sm text-gray-300">
              <p>Dialog container - contains character interactions</p>
              {component.content.character && (
                <div className="mt-2 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{component.content.character.name}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'show_character':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-5 h-5 text-green-400" />
              <span className="font-bold text-white">Show Character</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-600 rounded border flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <select 
                    className="w-full p-1 rounded bg-slate-700 text-white text-sm"
                    value={component.content.character || ''}
                    onChange={(e) => updateComponent(component.id, { character: e.target.value })}
                  >
                    <option value="">Select Character</option>
                    {CHARACTERS.map(char => (
                      <option key={char.name} value={char.name}>{char.displayName}</option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <div className="font-medium text-white text-sm">
                      {component.content.characterData?.displayName || component.content.character}
                    </div>
                    <div className="text-xs text-gray-400">
                      Position: {component.content.position || 'center'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'dialogue':
      case 'question':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center space-x-2 mb-2">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-white">{component.type === 'dialogue' ? 'Say' : 'Ask'}</span>
            </div>
            <div className="flex-1">
              {isEditing ? (
                <textarea
                  className="w-full h-16 p-2 rounded bg-slate-700 text-white text-sm resize-none"
                  value={component.content.translations?.EN || ''}
                  onChange={(e) => updateDialogueTranslation(component.id, 'EN', e.target.value)}
                  placeholder="Enter dialogue text..."
                />
              ) : (
                <div className="text-sm text-gray-300 line-clamp-3">
                  {component.content.translations?.EN || component.content.text || 'No text'}
                </div>
              )}
            </div>
            {component.content.character && (
              <div className="mt-1 flex items-center space-x-1 text-xs text-gray-400">
                <User className="w-3 h-3" />
                <span>{component.content.character.name}</span>
              </div>
            )}
          </div>
        );

      case 'menu_start':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center space-x-2 mb-2">
              <MenuIcon className="w-5 h-5 text-purple-400" />
              <span className="font-bold text-white">Menu</span>
            </div>
            <div className="flex-1 bg-slate-700 rounded p-2 text-sm text-gray-300">
              <p>Menu container - contains multiple choice options</p>
            </div>
          </div>
        );

      case 'menu_option':
      case 'menu_option_conditional':
      case 'menu_option_conditional_not':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center space-x-2 mb-2">
              <ArrowRight className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-white text-sm">Option</span>
              {component.content.isConditional && (
                <span className="text-xs bg-yellow-600 px-1 rounded">IF</span>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  className="w-full p-1 rounded bg-slate-700 text-white text-sm"
                  value={component.content.translations?.EN || ''}
                  onChange={(e) => updateDialogueTranslation(component.id, 'EN', e.target.value)}
                  placeholder="Option text..."
                />
              ) : (
                <div className="text-sm text-gray-300">
                  {component.content.translations?.EN || component.content.text || 'No text'}
                </div>
              )}
            </div>
            {component.content.condition && (
              <div className="text-xs text-yellow-400 mt-1">
                If: {component.content.condition}
              </div>
            )}
          </div>
        );

      case 'condition_start':
      case 'condition_start_not':
      case 'condition_tutorial_seen':
      case 'condition_from_campaign':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center space-x-2 mb-2">
              <GitBranch className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-white">IF Condition</span>
            </div>
            <div className="flex-1">
              {isEditing ? (
                <select 
                  className="w-full p-1 rounded bg-slate-700 text-white text-sm"
                  value={component.content.condition || ''}
                  onChange={(e) => updateComponent(component.id, { condition: e.target.value })}
                >
                  <option value="">Select Variable</option>
                  {component.content.availableVariables?.map((variable: string) => (
                    <option key={variable} value={variable}>{variable}</option>
                  ))}
                </select>
              ) : (
                <div className="text-sm">
                  <div className="text-yellow-400 font-medium">
                    {component.type.includes('not') ? 'IF NOT' : 'IF'} {component.content.condition || 'condition'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Type: {component.content.conditionType}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'variable_set':
      case 'variable_reset':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center space-x-2 mb-2">
              <Variable className="w-5 h-5 text-orange-400" />
              <span className="font-bold text-white">{component.content.action}</span>
            </div>
            <div className="flex-1">
              {isEditing ? (
                <select 
                  className="w-full p-1 rounded bg-slate-700 text-white text-sm"
                  value={component.content.variable || ''}
                  onChange={(e) => updateComponent(component.id, { variable: e.target.value })}
                >
                  <option value="">Select Variable</option>
                  {component.content.availableVariables?.map((variable: string) => (
                    <option key={variable} value={variable}>{variable}</option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-orange-300">
                  Variable: {component.content.variable || 'none'}
                </div>
              )}
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="h-full flex flex-col justify-center">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="font-bold text-white">Delay</span>
            </div>
            {isEditing ? (
              <input
                type="number"
                className="w-full p-1 rounded bg-slate-700 text-white text-sm"
                value={component.content.milliseconds || 0}
                onChange={(e) => updateComponent(component.id, { milliseconds: parseInt(e.target.value) || 0 })}
                placeholder="Milliseconds"
              />
            ) : (
              <div className="text-sm text-gray-300">
                {component.content.milliseconds || 0} ms
              </div>
            )}
          </div>
        );

      case 'subscript':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-white">Sub Script</span>
            </div>
            <div className="flex-1">
              {isEditing ? (
                <select 
                  className="w-full p-1 rounded bg-slate-700 text-white text-sm"
                  value={component.content.scriptName || ''}
                  onChange={(e) => updateComponent(component.id, { scriptName: e.target.value })}
                >
                  <option value="">Select Script</option>
                  {component.content.availableScripts?.map((scriptName: string) => (
                    <option key={scriptName} value={scriptName}>{scriptName}</option>
                  ))}
                </select>
              ) : (
                <div className="text-sm">
                  <div className="text-cyan-300 font-medium">
                    {component.content.scriptName || 'No script'}
                  </div>
                  <button 
                    className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (component.content.scriptName) {
                        loadScript(component.content.scriptName);
                      }
                    }}
                  >
                    Open Script →
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'start_mission':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center space-x-2 mb-2">
              <Play className="w-5 h-5 text-green-400" />
              <span className="font-bold text-white">Start Mission</span>
            </div>
            <div className="flex-1">
              {isEditing ? (
                <select 
                  className="w-full p-1 rounded bg-slate-700 text-white text-sm"
                  value={component.content.missionName || ''}
                  onChange={(e) => updateComponent(component.id, { missionName: e.target.value })}
                >
                  <option value="">Select Mission</option>
                  {component.content.availableMissions?.map((missionName: string) => (
                    <option key={missionName} value={missionName}>{missionName}</option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-green-300">
                  Mission: {component.content.missionName || 'none'}
                </div>
              )}
            </div>
          </div>
        );

      case 'center_map':
        return (
          <div className="h-full flex flex-col justify-center">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-white">Center Map</span>
            </div>
            {isEditing ? (
              <select 
                className="w-full p-1 rounded bg-slate-700 text-white text-sm"
                value={component.content.nodeName || ''}
                onChange={(e) => updateComponent(component.id, { nodeName: e.target.value })}
              >
                <option value="">Select Node</option>
                {component.content.availableNodes?.map((nodeName: string) => (
                  <option key={nodeName} value={nodeName}>{nodeName}</option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-blue-300">
                Node: {component.content.nodeName || 'none'}
              </div>
            )}
          </div>
        );

      case 'set_credits':
        return (
          <div className="h-full flex flex-col justify-center">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-white">Set Credits</span>
            </div>
            {isEditing ? (
              <input
                type="number"
                className="w-full p-1 rounded bg-slate-700 text-white text-sm"
                value={component.content.amount || 0}
                onChange={(e) => updateComponent(component.id, { amount: parseInt(e.target.value) || 0 })}
                placeholder="Credit amount"
              />
            ) : (
              <div className="text-sm text-yellow-300">
                Amount: {component.content.amount || 0}
              </div>
            )}
          </div>
        );

      case 'add_info_window':
      case 'show_info_window':
        return (
          <div className="h-full flex flex-col justify-center">
            <div className="flex items-center space-x-2 mb-2">
              <Image className="w-5 h-5 text-purple-400" />
              <span className="font-bold text-white">Info Window</span>
            </div>
            {isEditing && component.type === 'add_info_window' ? (
              <input
                type="text"
                className="w-full p-1 rounded bg-slate-700 text-white text-sm"
                value={component.content.image || ''}
                onChange={(e) => updateComponent(component.id, { image: e.target.value })}
                placeholder="Image filename"
              />
            ) : (
              <div className="text-sm text-purple-300">
                {component.type === 'add_info_window' ? `Image: ${component.content.image || 'none'}` : 'Show Info Window'}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="h-full flex flex-col justify-center">
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="w-5 h-5 text-gray-400" />
              <span className="font-bold text-white text-sm">{component.type}</span>
            </div>
            <div className="text-xs text-gray-400">
              {component.content.originalBlock?.content || 'Unknown command'}
            </div>
          </div>
        );
    }
  };

  const updateComponent = (componentId: string, updates: any) => {
    setVisualComponents(prev => 
      prev.map(comp => 
        comp.id === componentId 
          ? { ...comp, content: { ...comp.content, ...updates } }
          : comp
      )
    );
  };

  const updateDialogueTranslation = (componentId: string, language: string, text: string) => {
    setVisualComponents(prev => 
      prev.map(comp => 
        comp.id === componentId 
          ? { 
              ...comp, 
              content: { 
                ...comp.content, 
                translations: { 
                  ...comp.content.translations, 
                  [language]: text 
                } 
              }
            }
          : comp
      )
    );
  };

  const renderConnections = () => {
    return visualComponents.map(component => {
      return component.connections.map(targetId => {
        const target = visualComponents.find(c => c.id === targetId);
        if (!target) return null;

        const startX = component.position.x + component.size.width / 2;
        const startY = component.position.y + component.size.height;
        const endX = target.position.x + target.size.width / 2;
        const endY = target.position.y;

        return (
          <svg
            key={`${component.id}-${targetId}`}
            className="absolute pointer-events-none"
            style={{
              left: Math.min(startX, endX) - 10,
              top: Math.min(startY, endY) - 10,
              width: Math.abs(endX - startX) + 20,
              height: Math.abs(endY - startY) + 20
            }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                      refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
              </marker>
            </defs>
            <line
              x1={startX - Math.min(startX, endX) + 10}
              y1={startY - Math.min(startY, endY) + 10}
              x2={endX - Math.min(startX, endX) + 10}
              y2={endY - Math.min(startY, endY) + 10}
              stroke="#fbbf24"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          </svg>
        );
      });
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gt-primary rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gt-accent mb-4"></div>
          <p className="text-white">Loading complete campaign flow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gt-primary rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-bold text-white">Campaign Flow Editor</h3>
          {currentScript && (
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <FileText className="w-4 h-4" />
              <span>{currentScript.name}</span>
              <span className="text-gray-500">({currentScript.fileName})</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAllScripts(!showAllScripts)}
            className="px-3 py-1 bg-gt-secondary text-white rounded text-sm hover:bg-gt-accent transition-colors"
          >
            {showAllScripts ? 'Hide' : 'Show'} All Scripts
          </button>
          <button
            onClick={() => setEditingComponent(null)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Stop Editing
          </button>
        </div>
      </div>

      {/* Scripts List */}
      {showAllScripts && (
        <div className="mb-4 bg-gt-secondary rounded-lg p-3">
          <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
            {allScriptsList.map(script => (
              <button
                key={script.name}
                onClick={() => loadScript(script.name)}
                className={`p-2 rounded text-xs text-left transition-colors ${
                  currentScript?.name === script.name
                    ? 'bg-gt-accent text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <div className="font-medium">{script.name}</div>
                <div className="text-gray-400">{script.fileName}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 bg-slate-800 rounded-lg overflow-auto relative" ref={canvasRef}>
        <div className="relative min-w-full min-h-full" style={{ width: '2000px', height: '3000px' }}>
          {/* Connection lines */}
          {renderConnections()}
          
          {/* Visual components */}
          {visualComponents.map(component => renderVisualComponent(component))}
        </div>
      </div>

      {/* Footer with script info */}
      {currentScript && (
        <div className="mt-4 p-3 bg-gt-secondary rounded-lg">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Commands:</span>
              <span className="text-white ml-2">{currentScript.commands.length}</span>
            </div>
            <div>
              <span className="text-gray-400">Variables:</span>
              <span className="text-white ml-2">{currentScript.variables.length}</span>
            </div>
            <div>
              <span className="text-gray-400">Characters:</span>
              <span className="text-white ml-2">{currentScript.characters.length}</span>
            </div>
            <div>
              <span className="text-gray-400">Sub-scripts:</span>
              <span className="text-white ml-2">{currentScript.subScripts.length}</span>
            </div>
          </div>
        </div>   
      )}
    </div>
  );
}
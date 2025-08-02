import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCharacterStates, calculateCharacterStatesUpToBlock } from './FlowEditor/hooks/useCharacterStates';
import { getCampaignCharacterImage } from '../../utils/imageUtils';
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
  Plus as PlusIcon,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Image,
  BarChart3,
  ChevronRight,
  ChevronDown,
  Languages,
  ArrowLeft,
  Info,
  AlertCircle,
  HelpCircle,
  Shield,
  Star,
  Globe,
  Code,
  Target,
  SquareDot,
  RotateCcw,
  Volume2
} from 'lucide-react';
import yaml from 'js-yaml';
import { CampaignScriptParser, ParsedScript, ScriptBlock, ScriptCommand } from '../../services/CampaignScriptParser';
import { renderBlockContent } from './FlowEditor/BlockRenderer';
import { IfBlock } from './FlowEditor/blocks/IfBlock';
import { ScriptSyncManager } from './FlowEditor/components/ScriptSyncManager';

interface Character {
  name: string;
  images: string[];
  displayName: string;
}

interface MapNode {
  name: string;
  coordinates: [number, number];
  image: string;
  caption: string;
  description: string;
  shuttles?: Array<[string, number]>;
  buttons?: Array<[string, string, string]>;
}

interface GameButton {
  id: string;
  name: string;
  description: string;
  category: 'tutorial' | 'navigation' | 'interface' | 'action';
}

interface DialogueTranslations {
  [key: string]: string; // language code -> translated text
}

interface StructuredBlock {
  id: string;
  type: string;
  command: ScriptCommand;
  children: StructuredBlock[];
  depth: number;
  parent?: string;
  metadata: any;
}

interface BlockPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface StructuredCampaignFlowEditorProps {
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

const LANGUAGES = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];

export function StructuredCampaignFlowEditor({ selectedScript, selectedNode, onScriptChange }: StructuredCampaignFlowEditorProps) {
  const [parser] = useState(() => CampaignScriptParser.getInstance());
  const [analysis, setAnalysis] = useState<any>(null);
  const [currentScript, setCurrentScript] = useState<ParsedScript | null>(null);
  const [structuredBlocks, setStructuredBlocks] = useState<StructuredBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCharacter, setCurrentCharacter] = useState<{ name: string; image: string; position: string } | null>(null);
  const [variables, setVariables] = useState<Map<string, boolean>>(new Map()); // Legacy mixed
  const [semafori, setSemafori] = useState<Map<string, boolean>>(new Map()); // Boolean semafori
  const [realVariables, setRealVariables] = useState<Map<string, any>>(new Map()); // Numeric variables
  const [showAllScripts, setShowAllScripts] = useState(false);
  const [allScriptsList, setAllScriptsList] = useState<ParsedScript[]>([]);
  const [translations, setTranslations] = useState<Map<string, DialogueTranslations>>(new Map());
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [navigationStack, setNavigationStack] = useState<{ scriptName: string; blockId?: string }[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('EN');
  const [showAllLanguages, setShowAllLanguages] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editingValue, setEditingValue] = useState<string>('');
  const [editingField, setEditingField] = useState<{ blockId: string; field: string; language?: string } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPosition, setAddMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [showCharacterPicker, setShowCharacterPicker] = useState(false);
  const [characterPickerData, setCharacterPickerData] = useState<{ blockId: string; field: string; current?: string; blockType?: string } | null>(null);
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  const [variablePickerData, setVariablePickerData] = useState<{ blockId: string; field: string; current?: string; action?: string } | null>(null);
  const [variableSearchFilter, setVariableSearchFilter] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerData, setImagePickerData] = useState<{ blockId: string; characterName: string; currentImage?: string } | null>(null);
  const [insertPosition, setInsertPosition] = useState<{ parentId: string | null; index: number } | null>(null);
  const [showIfTypeSelector, setShowIfTypeSelector] = useState(false);
  const [pendingIfCreation, setPendingIfCreation] = useState<{ parentId: string | null; index: number } | null>(null);
  
  // Node and Button Selectors
  const [showNodeSelector, setShowNodeSelector] = useState(false);
  const [nodeSelectorData, setNodeSelectorData] = useState<{ blockId: string; field: string; current?: string } | null>(null);
  const [showButtonSelector, setShowButtonSelector] = useState(false);
  const [buttonSelectorData, setButtonSelectorData] = useState<{ blockId: string; field: string; current?: string } | null>(null);
  const [availableNodes, setAvailableNodes] = useState<MapNode[]>([]);
  const [availableButtons, setAvailableButtons] = useState<GameButton[]>([]);
  
  // Character states map - tracks character visibility and current images
  const characterStates = useCharacterStates(structuredBlocks, CHARACTERS);

  useEffect(() => {
    initializeEditor();
    loadGameData();
  }, []);
  
  // No need to track character states since Hide Character shows base image

  const loadGameData = async () => {
    try {
      // Load nodes from campaign configuration
      const nodesResponse = await fetch('http://localhost:3001/api/campaignMissions/nodes.yaml');
      if (nodesResponse.ok) {
        const nodesData = await nodesResponse.json();
        if (nodesData.content) {
          const parsedNodes = yaml.load(nodesData.content) as MapNode[];
          if (Array.isArray(parsedNodes)) {
            setAvailableNodes(parsedNodes);
          }
        }
      }

      // Define common game buttons (these would typically come from game data)
      const gameButtons: GameButton[] = [
        { id: 'btutor', name: 'Tutorial Button', description: 'Main tutorial button', category: 'tutorial' },
        { id: 'bnext', name: 'Next Button', description: 'Next/Continue button', category: 'navigation' },
        { id: 'bprev', name: 'Previous Button', description: 'Previous/Back button', category: 'navigation' },
        { id: 'bskip', name: 'Skip Button', description: 'Skip tutorial button', category: 'navigation' },
        { id: 'bmenu', name: 'Menu Button', description: 'Main menu button', category: 'interface' },
        { id: 'bhelp', name: 'Help Button', description: 'Help/Info button', category: 'interface' },
        { id: 'baction', name: 'Action Button', description: 'Generic action button', category: 'action' },
        { id: 'bconfirm', name: 'Confirm Button', description: 'Confirm/OK button', category: 'action' },
        { id: 'bcancel', name: 'Cancel Button', description: 'Cancel button', category: 'action' },
      ];
      setAvailableButtons(gameButtons);

    } catch (error) {
      console.error('Error loading game data:', error);
    }
  };

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
      const variableMap = new Map<string, boolean>(); // Legacy mixed
      campaignAnalysis.variables.forEach((variable: string) => {
        variableMap.set(variable, false);
      });
      setVariables(variableMap);
      
      // Initialize separated semafori and variables
      const semaforoMap = new Map<string, boolean>();
      campaignAnalysis.semafori.forEach((semaforo: string) => {
        semaforoMap.set(semaforo, false);
      });
      setSemafori(semaforoMap);
      
      const realVarMap = new Map<string, any>();
      campaignAnalysis.realVariables.forEach((variable: string) => {
        realVarMap.set(variable, 0); // Default value for numeric variables
      });
      setRealVariables(realVarMap);
      
      // Load all scripts for navigation
      setAllScriptsList(campaignAnalysis.scripts);
      
      // Load the first script or tutorial if no specific script selected
      if (!selectedScript && campaignAnalysis.scripts.length > 0) {
        const tutorialScript = campaignAnalysis.scripts.find((s: ParsedScript) => s.name.toLowerCase().includes('intro')) || campaignAnalysis.scripts[0];
        loadScript(tutorialScript.name);
      }
      
    } catch (error) {
      console.error('Error initializing campaign editor:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScript = async (scriptName: string, jumpToBlock?: string) => {
    if (!analysis) return;

    const script = analysis.scriptMap.get(scriptName);
    if (!script) {
      console.warn(`Script not found: ${scriptName}`);
      return;
    }

    // Update navigation stack
    if (jumpToBlock) {
      setNavigationStack(prev => [...prev, { scriptName: currentScript?.name || '', blockId: selectedBlock || undefined }]);
    } else if (currentScript && currentScript.name !== scriptName) {
      setNavigationStack(prev => [...prev, { scriptName: currentScript.name }]);
    }

    setCurrentScript(script);
    
    // Build structured blocks from commands
    const blocks = buildStructuredBlocks(script.commands, script);
    setStructuredBlocks(blocks);
    
    // Load translations for all languages
    await loadScriptTranslations(script);
    
    // Reset character state
    setCurrentCharacter(null);
    
    // Expand all container blocks by default for better visibility
    const containerIds = new Set<string>();
    blocks.forEach(block => {
      if (isContainerBlock(block)) {
        containerIds.add(block.id);
      }
    });
    setExpandedBlocks(containerIds);
    
    // Jump to specific block if requested
    if (jumpToBlock) {
      setSelectedBlock(jumpToBlock);
      // Auto-scroll to block (implementation would go here)
    }
  };

  const buildStructuredBlocks = (commands: ScriptCommand[], script: ParsedScript): StructuredBlock[] => {
    const blocks: StructuredBlock[] = [];
    const stack: { block: StructuredBlock; endTypes: string[] }[] = [];
    let blockIdCounter = 0;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      const blockId = `${script.name}_block_${blockIdCounter++}`;

      // Create basic block
      const block: StructuredBlock = {
        id: blockId,
        type: command.type,
        command: command,
        children: [],
        depth: stack.length,
        metadata: {
          scriptName: script.name
        }
      };

      // Handle container types that need special treatment
      switch (command.type) {
        case 'dialog_start':
          // ShowDlgScene starts a dialog container
          const dialogContainer: StructuredBlock = {
            id: `${blockId}_dialog`,
            type: 'dialog_container',
            command: command,
            children: [],
            depth: stack.length,
            metadata: { 
              scriptName: script.name,
              title: 'Apri Dialogo'
            }
          };
          addBlockToStructure(dialogContainer, blocks, stack);
          stack.push({ block: dialogContainer, endTypes: ['dialog_end'] });
          break;

        case 'dialog_end':
          // HideDlgScene ends the dialog container
          if (stack.length > 0 && stack[stack.length - 1].endTypes.includes('dialog_end')) {
            stack.pop();
          }
          break;

        case 'menu_start':
          // MENU starts a menu container
          const menuContainer: StructuredBlock = {
            id: `${blockId}_menu`,
            type: 'menu_container',
            command: command,
            children: [],
            depth: stack.length,
            metadata: { 
              scriptName: script.name,
              title: 'MENU'
            }
          };
          addBlockToStructure(menuContainer, blocks, stack);
          stack.push({ block: menuContainer, endTypes: ['menu_end'] });
          break;

        case 'menu_end':
          // END_OF_MENU ends the menu container
          if (stack.length > 0 && stack[stack.length - 1].endTypes.includes('menu_end')) {
            stack.pop();
          }
          break;

        case 'menu_option':
        case 'menu_option_conditional':
        case 'menu_option_conditional_not':
          // OPT starts an option container within a menu
          const optionContainer: StructuredBlock = {
            id: `${blockId}_option`,
            type: 'option_container',
            command: command,
            children: [],
            depth: stack.length,
            metadata: { 
              scriptName: script.name,
              isConditional: command.type.includes('conditional'),
              condition: command.parameters?.condition
            }
          };
          addBlockToStructure(optionContainer, blocks, stack);
          stack.push({ block: optionContainer, endTypes: ['menu_option_end'] });
          break;

        case 'menu_option_end':
          // END_OF_OPT ends the option container
          if (stack.length > 0 && stack[stack.length - 1].endTypes.includes('menu_option_end')) {
            stack.pop();
          }
          break;

        case 'condition_start':
        case 'condition_start_not':
        case 'condition_tutorial_seen':
        case 'condition_from_campaign':
        case 'condition_predefined':
          // IF/IFNOT starts a condition container
          const conditionContainer: StructuredBlock = {
            id: `${blockId}_condition`,
            type: 'condition_container',
            command: command,
            children: [],
            depth: stack.length,
            metadata: { 
              scriptName: script.name,
              hasElse: false,
              elseIndex: -1,
              condition: command.parameters?.condition || command.content.replace(/^(IF|IFNOT|IF_TUTORIAL_SEEN|IF_FROM_CAMPAIGN)\s*/i, ''),
              isNot: command.type.includes('not') || command.content.toUpperCase().startsWith('IFNOT'),
              // Add predefined condition metadata
              ...(command.type === 'condition_predefined' && {
                ifType: 'predefined',
                predefinedType: command.parameters?.predefinedType,
                // Include all parsed parameters for predefined conditions
                ...command.parameters
              })
            }
          };
          addBlockToStructure(conditionContainer, blocks, stack);
          stack.push({ block: conditionContainer, endTypes: ['condition_end'] });
          break;

        case 'condition_else':
          // ELSE marks the else section in a condition
          if (stack.length > 0) {
            const currentContainer = stack[stack.length - 1].block;
            if (currentContainer.type === 'condition_container') {
              currentContainer.metadata.hasElse = true;
              currentContainer.metadata.elseIndex = currentContainer.children.length;
            }
          }
          // Don't add ELSE as a separate block, it's just a marker
          break;

        case 'condition_end':
          // END_OF_IF ends the condition container
          if (stack.length > 0 && stack[stack.length - 1].endTypes.includes('condition_end')) {
            stack.pop();
          }
          break;

        default:
          // All other commands are added to the current container or root
          addBlockToStructure(block, blocks, stack);
          break;
      }
    }

    return blocks;
  };

  const addBlockToStructure = (block: StructuredBlock, blocks: StructuredBlock[], stack: any[]) => {
    if (stack.length > 0) {
      const parent = stack[stack.length - 1].block;
      parent.children.push(block);
      block.parent = parent.id;
    } else {
      blocks.push(block);
    }
  };

  const isContainerBlock = (block: StructuredBlock): boolean => {
    return [
      'dialog_container',
      'menu_container',
      'option_container',
      'condition_container'
    ].includes(block.type);
  };

  const loadScriptTranslations = async (script: ParsedScript) => {
    const languages = ['CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const translationMap = new Map<string, DialogueTranslations>();

    // Extract all text-bearing commands
    const textCommands = script.commands.filter(cmd => 
      ['dialogue', 'question', 'menu_option', 'menu_option_conditional', 'menu_option_conditional_not'].includes(cmd.type) && 
      cmd.parameters?.text
    );

    // For each text command, try to find translations
    for (const command of textCommands) {
      const translations: DialogueTranslations = { EN: command.parameters.text };
      
      // Try to find translations in other language files
      for (const lang of languages) {
        try {
          const response = await fetch(`http://localhost:3001/api/campaign/${script.fileName}?lang=${lang}`);
          if (response.ok) {
            const data = await response.json();
            const content = data.content || '';
            
            // Find the corresponding line in the translated file
            const translatedText = findTranslatedText(content, command, script.commands);
            if (translatedText) {
              translations[lang] = translatedText;
            }
          }
        } catch (error) {
          console.warn(`Could not load translations for ${lang}:`, error);
        }
      }
      
      translationMap.set(`${command.line}`, translations);
    }

    setTranslations(translationMap);
  };

  const findTranslatedText = (content: string, targetCommand: ScriptCommand, allCommands: ScriptCommand[]): string | null => {
    const lines = content.split('\n');
    
    // Try to find by line number first
    if (targetCommand.line && targetCommand.line < lines.length) {
      const line = lines[targetCommand.line - 1].trim();
      if (line.startsWith('Say ') || line.startsWith('Ask ') || line.startsWith('OPT')) {
        const match = line.match(/^(?:Say|Ask|OPT(?:_IF|_IFNOT)?\s+\w+)?\s*"(.+)"/);
        if (match) {
          return match[1];
        }
      }
    }
    
    // If not found by line number, try context matching
    // Find surrounding non-text commands for context
    const contextBefore: string[] = [];
    const contextAfter: string[] = [];
    
    const targetIndex = allCommands.findIndex(cmd => cmd === targetCommand);
    
    // Get context before
    for (let i = targetIndex - 1; i >= 0 && contextBefore.length < 3; i--) {
      const cmd = allCommands[i];
      if (!['dialogue', 'question', 'menu_option'].includes(cmd.type)) {
        contextBefore.unshift(cmd.content);
      }
    }
    
    // Get context after
    for (let i = targetIndex + 1; i < allCommands.length && contextAfter.length < 3; i++) {
      const cmd = allCommands[i];
      if (!['dialogue', 'question', 'menu_option'].includes(cmd.type)) {
        contextAfter.push(cmd.content);
      }
    }
    
    // Try to find similar context in translated file
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('Say ') || line.startsWith('Ask ') || line.startsWith('OPT')) {
        // Check if context matches
        let contextMatches = true;
        
        // Check context before
        for (let j = 0; j < contextBefore.length; j++) {
          if (i - j - 1 < 0 || !lines[i - j - 1].includes(contextBefore[contextBefore.length - 1 - j])) {
            contextMatches = false;
            break;
          }
        }
        
        if (contextMatches) {
          const match = line.match(/^(?:Say|Ask|OPT(?:_IF|_IFNOT)?\s+\w+)?\s*"(.+)"/);
          if (match) {
            return match[1];
          }
        }
      }
    }
    
    return null;
  };

  const navigateBack = (targetIndex?: number) => {
    if (navigationStack.length > 0) {
      if (targetIndex !== undefined && targetIndex < navigationStack.length) {
        // Navigate to a specific point in the stack
        const targetLocation = navigationStack[targetIndex];
        setNavigationStack(prev => prev.slice(0, targetIndex));
        loadScript(targetLocation.scriptName, targetLocation.blockId);
      } else {
        // Navigate back one step
        const previousLocation = navigationStack[navigationStack.length - 1];
        setNavigationStack(prev => prev.slice(0, -1));
        loadScript(previousLocation.scriptName, previousLocation.blockId);
      }
    }
  };

  const toggleBlockExpanded = (blockId: string) => {
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  };

  const startEditing = (blockId: string, field: string, currentValue: string, language?: string) => {
    setEditingField({ blockId, field, language });
    setEditingValue(currentValue);
    setEditMode(true);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditingValue('');
    setEditMode(false);
  };

  const saveEdit = async () => {
    if (!editingField || !currentScript) return;

    const { blockId, field, language } = editingField;
    
    // Find the block and update its value
    const updateBlock = (blocks: StructuredBlock[]): boolean => {
      for (const block of blocks) {
        if (block.id === blockId) {
          // Update the block's command parameters
          if (field === 'text') {
            if (!block.command.parameters) block.command.parameters = {};
            block.command.parameters.text = editingValue;
            
            // Update translations if editing in a specific language
            if (language && language !== 'EN') {
              const translationKey = `${block.command.line}`;
              const currentTranslations = translations.get(translationKey) || { EN: block.command.parameters.text };
              (currentTranslations as any)[language] = editingValue;
              translations.set(translationKey, currentTranslations);
              setTranslations(new Map(translations));
            }
          } else if (field === 'character') {
            if (!block.command.parameters) block.command.parameters = {};
            block.command.parameters.character = editingValue;
          } else if (field === 'position') {
            if (!block.command.parameters) block.command.parameters = {};
            block.command.parameters.position = editingValue;
          } else if (field === 'variable') {
            if (!block.command.parameters) block.command.parameters = {};
            block.command.parameters.variable = editingValue;
          } else if (field === 'delay') {
            if (!block.command.parameters) block.command.parameters = {};
            block.command.parameters.milliseconds = parseInt(editingValue) || 0;
          } else if (field === 'condition') {
            if (!block.command.parameters) block.command.parameters = {};
            block.command.parameters.condition = editingValue;
            block.metadata.condition = editingValue;
          } else if (field === 'message') {
            if (!block.command.parameters) block.command.parameters = {};
            block.command.parameters.message = editingValue;
          } else if (field === 'missionName') {
            if (!block.command.parameters) block.command.parameters = {};
            block.command.parameters.missionName = editingValue;
          } else if (field === 'amount') {
            if (!block.command.parameters) block.command.parameters = {};
            block.command.parameters.amount = parseInt(editingValue) || 0;
          }
          
          return true;
        }
        
        if (updateBlock(block.children)) {
          return true;
        }
      }
      return false;
    };

    // Update the block
    updateBlock(structuredBlocks);
    setStructuredBlocks([...structuredBlocks]);

    // Save to all language files if this is a text edit
    if (field === 'text') {
      await saveToAllLanguages(blockId, editingValue, language || 'EN');
    } else {
      // Save the script file for other changes
      await saveScriptChanges();
    }

    cancelEditing();
  };

  const saveToAllLanguages = async (blockId: string, newText: string, changedLanguage: string) => {
    if (!currentScript) return;

    // For now, just log - full implementation would save to all language files
    console.log(`Saving text change for block ${blockId} in language ${changedLanguage}: "${newText}"`);
    
    // TODO: Implement actual saving to script files in all languages
    if (onScriptChange) {
      onScriptChange(currentScript.name, structuredBlocks);
    }
  };

  const serializeBlocksToScript = (blocks: StructuredBlock[], indentLevel: number = 0): string[] => {
    const lines: string[] = [];
    const indent = '  '.repeat(indentLevel);

    for (const block of blocks) {
      if (block.type === 'condition_container') {
        // Handle IF conditions
        const ifType = block.metadata?.ifType;
        const predefinedType = block.metadata?.predefinedType;
        
        if (ifType === 'predefined' && predefinedType) {
          // Serialize predefined IF types with their parameters
          switch (predefinedType) {
            case 'IF_PROB':
              lines.push(`${indent}IF_PROB ${block.metadata.probability || '50'}`);
              break;
            case 'IF_MIN':
              lines.push(`${indent}IF_MIN ${block.metadata.variable || 'visited'} ${block.metadata.minValue || '7'}`);
              break;
            case 'IF_MAX':
              lines.push(`${indent}IF_MAX ${block.metadata.variable || 'opponents'} ${block.metadata.maxValue || '2'}`);
              break;
            case 'IF_IS':
              lines.push(`${indent}IF_IS ${block.metadata.variable || 'sailor'} ${block.metadata.exactValue || '4'}`);
              break;
            case 'IF_HAS_CREDITS':
              lines.push(`${indent}IF_HAS_CREDITS ${block.metadata.creditsAmount || '3'}`);
              break;
            case 'IF_ORDER':
              lines.push(`${indent}IF_ORDER ${block.metadata.playerIndex || '0'} ${block.metadata.positionValue || '1'}`);
              break;
            default:
              // Simple predefined types without parameters
              lines.push(`${indent}${predefinedType}`);
              break;
          }
        } else {
          // Standard IF/IFNOT with variables
          const condition = block.metadata?.condition || 'newVariable';
          const isNot = block.metadata?.isNot;
          lines.push(`${indent}${isNot ? 'IFNOT' : 'IF'} ${condition}`);
        }

        // Handle ELSE section if present
        const hasElse = block.metadata?.hasElse;
        const elseIndex = block.metadata?.elseIndex || block.children.length;
        
        if (hasElse && elseIndex > 0) {
          // Serialize IF section children
          const ifChildren = block.children.slice(0, elseIndex);
          lines.push(...serializeBlocksToScript(ifChildren, indentLevel + 1));
          
          // Add ELSE
          lines.push(`${indent}ELSE`);
          
          // Serialize ELSE section children
          const elseChildren = block.children.slice(elseIndex);
          lines.push(...serializeBlocksToScript(elseChildren, indentLevel + 1));
        } else {
          // Serialize all children
          lines.push(...serializeBlocksToScript(block.children, indentLevel + 1));
        }

        // Close condition
        lines.push(`${indent}END_OF_IF`);
        
      } else if (block.type === 'dialog_container') {
        lines.push(`${indent}ShowDlgScene`);
        lines.push(...serializeBlocksToScript(block.children, indentLevel + 1));
        lines.push(`${indent}HideDlgScene`);
        
      } else if (block.type === 'menu_container') {
        lines.push(`${indent}MENU`);
        lines.push(...serializeBlocksToScript(block.children, indentLevel + 1));
        lines.push(`${indent}END_OF_MENU`);
        
      } else {
        // Regular blocks - use their command content
        lines.push(`${indent}${block.command.content}`);
        
        // Serialize children if any
        if (block.children && block.children.length > 0) {
          lines.push(...serializeBlocksToScript(block.children, indentLevel + 1));
        }
      }
    }

    return lines;
  };

  const saveScriptChanges = async () => {
    if (!currentScript) return;

    console.log('Saving script changes for:', currentScript.name);
    
    // Convert structured blocks back to script format
    const scriptLines = serializeBlocksToScript(structuredBlocks);
    const scriptContent = scriptLines.join('\n');
    
    console.log('Generated script content:', scriptContent);
    
    if (onScriptChange) {
      onScriptChange(currentScript.name, scriptContent);
    }
  };

  const findLabelBlock = (labelName: string): StructuredBlock | null => {
    const findInBlocks = (blocks: StructuredBlock[]): StructuredBlock | null => {
      for (const block of blocks) {
        if (block.command.type === 'label' && block.command.parameters?.name === labelName) {
          return block;
        }
        const found = findInBlocks(block.children);
        if (found) return found;
      }
      return null;
    };
    return findInBlocks(structuredBlocks);
  };

  const scrollToBlock = (blockId: string) => {
    const element = document.getElementById(blockId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the block temporarily
      element.classList.add('ring-2', 'ring-yellow-400');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-yellow-400');
      }, 2000);
    }
  };

  const addMenuOption = (menuBlockId: string, optionType: 'option' | 'option_conditional' | 'option_conditional_not' = 'option') => {
    const updateBlock = (blocks: StructuredBlock[]): boolean => {
      for (const block of blocks) {
        if (block.id === menuBlockId && block.type === 'menu_container') {
          const newOptionId = `${menuBlockId}_new_option_${Date.now()}`;
          const newOption: StructuredBlock = {
            id: newOptionId,
            type: 'option_container',
            command: {
              line: 0,
              content: `OPT${optionType.includes('conditional') ? '_IF' : ''} "New Option"`,
              type: optionType as any,
              parameters: {
                text: 'New Option',
                condition: optionType.includes('conditional') ? 'someVariable' : undefined
              }
            },
            children: [],
            depth: block.depth + 1,
            metadata: {
              scriptName: block.metadata.scriptName,
              isConditional: optionType.includes('conditional'),
              condition: optionType.includes('conditional') ? 'someVariable' : undefined
            }
          };
          
          block.children.push(newOption);
          return true;
        }
        
        if (updateBlock(block.children)) {
          return true;
        }
      }
      return false;
    };

    updateBlock(structuredBlocks);
    setStructuredBlocks([...structuredBlocks]);
    saveScriptChanges();
  };

  const removeMenuOption = (optionBlockId: string) => {
    const updateBlock = (blocks: StructuredBlock[]): boolean => {
      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id === optionBlockId) {
          blocks.splice(i, 1);
          return true;
        }
        
        if (updateBlock(blocks[i].children)) {
          return true;
        }
      }
      return false;
    };

    updateBlock(structuredBlocks);
    setStructuredBlocks([...structuredBlocks]);
    saveScriptChanges();
  };

  const addNewComponent = (parentBlockId: string | null, componentType: string, insertIndex?: number) => {
    const newComponentId = `new_${componentType}_${Date.now()}`;
    let newBlock: StructuredBlock;

    switch (componentType) {
      case 'delay':
        newBlock = {
          id: newComponentId,
          type: 'delay',
          command: {
            line: 0,
            content: 'Delay 1000',
            type: 'delay',
            parameters: { milliseconds: 1000 }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'dialogue':
        newBlock = {
          id: newComponentId,
          type: 'dialogue',
          command: {
            line: 0,
            content: 'Say "New dialogue"',
            type: 'dialogue',
            parameters: { text: 'New dialogue' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'question':
        newBlock = {
          id: newComponentId,
          type: 'question',
          command: {
            line: 0,
            content: 'Ask "New question"',
            type: 'question',
            parameters: { text: 'New question' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'variable_set':
        newBlock = {
          id: newComponentId,
          type: 'variable_set',
          command: {
            line: 0,
            content: 'SET newVariable',
            type: 'variable_set',
            parameters: { variable: 'newVariable' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'show_character':
        newBlock = {
          id: newComponentId,
          type: 'show_character',
          command: {
            line: 0,
            content: 'ShowChar tutor center',
            type: 'show_character',
            parameters: { character: 'tutor', position: 'center' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'hide_character':
        newBlock = {
          id: newComponentId,
          type: 'hide_character',
          command: {
            line: 0,
            content: 'HideChar tutor',
            type: 'hide_character',
            parameters: { character: 'tutor' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'change_character':
        newBlock = {
          id: newComponentId,
          type: 'change_character',
          command: {
            line: 0,
            content: 'ChangeChar tutor campaign/tutor-smile.png',
            type: 'change_character',
            parameters: { character: 'tutor', image: 'campaign/tutor-smile.png' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'variable_reset':
        newBlock = {
          id: newComponentId,
          type: 'variable_reset',
          command: {
            line: 0,
            content: 'RESET newSemaforo',
            type: 'variable_reset',
            parameters: { variable: 'newSemaforo' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'variable_set_to':
        newBlock = {
          id: newComponentId,
          type: 'variable_set_to',
          command: {
            line: 0,
            content: 'SET_TO newVariable 0',
            type: 'variable_set_to',
            parameters: { variable: 'newVariable', value: '0' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'label':
        newBlock = {
          id: newComponentId,
          type: 'label',
          command: {
            line: 0,
            content: 'LABEL newLabel',
            type: 'label',
            parameters: { name: 'newLabel' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '', isAnchor: true }
        };
        break;
        
      case 'goto':
        newBlock = {
          id: newComponentId,
          type: 'goto',
          command: {
            line: 0,
            content: 'GO newLabel',
            type: 'goto',
            parameters: { target: 'newLabel' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'subscript':
        newBlock = {
          id: newComponentId,
          type: 'subscript',
          command: {
            line: 0,
            content: 'SUB_SCRIPT newScript',
            type: 'subscript',
            parameters: { scriptName: 'newScript' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'return':
        newBlock = {
          id: newComponentId,
          type: 'return',
          command: {
            line: 0,
            content: 'RETURN',
            type: 'return',
            parameters: {}
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'show_node':
        newBlock = {
          id: newComponentId,
          type: 'show_node',
          command: {
            line: 0,
            content: 'ShowNode newbie',
            type: 'show_node',
            parameters: { nodeName: 'newbie' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'set_node_known':
        newBlock = {
          id: newComponentId,
          type: 'set_node_known',
          command: {
            line: 0,
            content: 'SetNodeKnown newbie',
            type: 'set_node_known',
            parameters: { nodeName: 'newbie' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'show_path':
        newBlock = {
          id: newComponentId,
          type: 'show_path',
          command: {
            line: 0,
            content: 'ShowPath R1-2a',
            type: 'show_path',
            parameters: { pathName: 'R1-2a' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'hide_path':
        newBlock = {
          id: newComponentId,
          type: 'hide_path',
          command: {
            line: 0,
            content: 'HidePath R1-2a',
            type: 'hide_path',
            parameters: { pathName: 'R1-2a' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'move_player_to_node':
        newBlock = {
          id: newComponentId,
          type: 'move_player_to_node',
          command: {
            line: 0,
            content: 'MovePlayerToNode newbie',
            type: 'move_player_to_node',
            parameters: { nodeName: 'newbie' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'show_button':
        newBlock = {
          id: newComponentId,
          type: 'show_button',
          command: {
            line: 0,
            content: 'ShowButton btutor',
            type: 'show_button',
            parameters: { buttonName: 'btutor' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'hide_button':
        newBlock = {
          id: newComponentId,
          type: 'hide_button',
          command: {
            line: 0,
            content: 'HideButton btutor',
            type: 'hide_button',
            parameters: { buttonName: 'btutor' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'set_focus':
        newBlock = {
          id: newComponentId,
          type: 'set_focus',
          command: {
            line: 0,
            content: 'SetFocus btutor',
            type: 'set_focus',
            parameters: { buttonName: 'btutor' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'reset_focus':
        newBlock = {
          id: newComponentId,
          type: 'reset_focus',
          command: {
            line: 0,
            content: 'ResetFocus btutor',
            type: 'reset_focus',
            parameters: { buttonName: 'btutor' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'announce':
        newBlock = {
          id: newComponentId,
          type: 'announce',
          command: {
            line: 0,
            content: 'Announce "New announcement"',
            type: 'announce',
            parameters: { text: 'New announcement' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'menu_container':
        newBlock = {
          id: newComponentId,
          type: 'menu_container',
          command: {
            line: 0,
            content: 'MENU',
            type: 'menu_start',
            parameters: {}
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '', title: 'MENU' }
        };
        break;
        
      case 'condition_container':
        // Open IF type selector instead of creating directly
        setPendingIfCreation({ parentId: parentBlockId, index: insertIndex || 0 });
        setShowIfTypeSelector(true);
        setShowAddMenu(false);
        return; // Don't create block yet
        
      case 'dialog_container':
        newBlock = {
          id: newComponentId,
          type: 'dialog_container',
          command: {
            line: 0,
            content: 'ShowDlgScene',
            type: 'dialog_start',
            parameters: {}
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '', title: 'DIALOG' }
        };
        break;
        
      case 'set_status_bar':
        newBlock = {
          id: newComponentId,
          type: 'set_status_bar',
          command: {
            line: 0,
            content: 'SetFlightStatusBar "New status message"',
            type: 'status_bar',
            parameters: { message: 'New status message' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'add_info_window':
        newBlock = {
          id: newComponentId,
          type: 'add_info_window',
          command: {
            line: 0,
            content: 'AddInfoWindow "info_image.png" "Info title"',
            type: 'add_info_window',
            parameters: { 
              image: 'info_image.png',
              title: 'Info title'
            }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'show_info_window':
        newBlock = {
          id: newComponentId,
          type: 'show_info_window',
          command: {
            line: 0,
            content: 'ShowInfoWindow "info_image.png" "Info title"',
            type: 'show_info_window',
            parameters: { 
              image: 'info_image.png',
              title: 'Info title'
            }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'start_mission':
        newBlock = {
          id: newComponentId,
          type: 'start_mission',
          command: {
            line: 0,
            content: 'StartMission "NewMission"',
            type: 'start_mission',
            parameters: { missionName: 'NewMission' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'center_map':
        newBlock = {
          id: newComponentId,
          type: 'center_map',
          command: {
            line: 0,
            content: 'CenterMap newbie',
            type: 'center_map',
            parameters: { nodeName: 'newbie' }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      case 'set_credits':
        newBlock = {
          id: newComponentId,
          type: 'set_credits',
          command: {
            line: 0,
            content: 'SetCredits 1000',
            type: 'set_credits',
            parameters: { amount: 1000 }
          },
          children: [],
          depth: 0,
          metadata: { scriptName: currentScript?.name || '' }
        };
        break;
        
      default:
        return;
    }

    const insertBlock = (blocks: StructuredBlock[], targetId: string | null): boolean => {
      if (targetId === null) {
        // Insert at root level
        if (insertIndex !== undefined) {
          blocks.splice(insertIndex, 0, newBlock);
        } else {
          blocks.push(newBlock);
        }
        return true;
      }
      
      for (const block of blocks) {
        if (block.id === targetId) {
          // Insert into this block's children
          if (insertIndex !== undefined && insertIndex < block.children.length) {
            block.children.splice(insertIndex, 0, newBlock);
          } else {
            block.children.push(newBlock);
          }
          newBlock.depth = block.depth + 1;
          return true;
        }
        
        if (insertBlock(block.children, targetId)) {
          return true;
        }
      }
      return false;
    };

    insertBlock(structuredBlocks, parentBlockId);
    setStructuredBlocks([...structuredBlocks]);
    saveScriptChanges();
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const moveInBlocks = (blocks: StructuredBlock[]): boolean => {
      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id === blockId) {
          if (direction === 'up' && i > 0) {
            [blocks[i], blocks[i - 1]] = [blocks[i - 1], blocks[i]];
            return true;
          } else if (direction === 'down' && i < blocks.length - 1) {
            [blocks[i], blocks[i + 1]] = [blocks[i + 1], blocks[i]];
            return true;
          }
          return false;
        }
        
        if (moveInBlocks(blocks[i].children)) {
          return true;
        }
      }
      return false;
    };

    if (moveInBlocks(structuredBlocks)) {
      setStructuredBlocks([...structuredBlocks]);
      saveScriptChanges();
    }
  };

  const openCharacterPicker = (blockId: string, field: string, current?: string) => {
    // Find the block to determine its type
    const findBlock = (blocks: any[]): any => {
      for (const block of blocks) {
        if (block.id === blockId) return block;
        if (block.children) {
          const found = findBlock(block.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const block = findBlock(structuredBlocks);
    const blockType = block?.command?.type;
    
    setCharacterPickerData({ blockId, field, current, blockType });
    setShowCharacterPicker(true);
  };

  const openVariablePicker = (blockId: string, field: string, current?: string, action?: string) => {
    setVariablePickerData({ blockId, field, current, action });
    setShowVariablePicker(true);
  };

  const createIfBlockWithType = (ifType: 'predefined' | 'standard', predefinedType?: string) => {
    if (!pendingIfCreation) return;
    
    const { parentId, index } = pendingIfCreation;
    const newComponentId = Date.now().toString();
    
    let condition: string;
    let commandContent: string;
    const ifMode = false; // Always start with IF (not IFNOT) for simplicity
    
    // Initialize metadata with default parameters for predefined types
    let metadata: any = { 
      scriptName: currentScript?.name || '', 
      hasElse: false,
      elseIndex: -1,
      isNot: ifMode,
      ifType,
      predefinedType: ifType === 'predefined' ? predefinedType : undefined
    };

    if (ifType === 'predefined' && predefinedType) {
      condition = predefinedType;
      commandContent = predefinedType; // Start with base predefined type
      
      // Set default parameters based on predefined type
      switch (predefinedType) {
        case 'IF_PROB':
          metadata.probability = '50';
          commandContent = 'IF_PROB 50';
          break;
        case 'IF_MIN':
          metadata.variable = 'visited';
          metadata.minValue = '7';
          commandContent = 'IF_MIN visited 7';
          break;
        case 'IF_MAX':
          metadata.variable = 'opponents';
          metadata.maxValue = '2';
          commandContent = 'IF_MAX opponents 2';
          break;
        case 'IF_IS':
          metadata.variable = 'sailor';
          metadata.exactValue = '4';
          commandContent = 'IF_IS sailor 4';
          break;
        case 'IF_HAS_CREDITS':
          metadata.creditsAmount = '3';
          commandContent = 'IF_HAS_CREDITS 3';
          break;
        case 'IF_ORDER':
          metadata.playerIndex = '0';
          metadata.positionValue = '1';
          commandContent = 'IF_ORDER 0 1';
          break;
        default:
          // Simple predefined types (IF_TUTORIAL_SEEN, IF_DEBUG, etc.) - no parameters needed
          commandContent = predefinedType;
          break;
      }
    } else {
      condition = 'newVariable';
      commandContent = `${ifMode ? 'IFNOT' : 'IF'} ${condition}`;
    }
    
    // Add condition to metadata for both types
    metadata.condition = condition;
    
    const newBlock: StructuredBlock = {
      id: newComponentId,
      type: 'condition_container',
      command: {
        line: 0,
        content: commandContent,
        type: 'condition_start',
        parameters: { condition: commandContent }
      },
      children: [],
      depth: 0,
      metadata
    };

    // Insert the block
    const insertBlock = (blocks: StructuredBlock[]): StructuredBlock[] => {
      if (!parentId) {
        // Insert at root level
        const newBlocks = [...blocks];
        newBlocks.splice(index, 0, newBlock);
        return newBlocks;
      } else {
        // Insert into parent's children
        return blocks.map(block => {
          if (block.id === parentId) {
            const newChildren = [...block.children];
            newChildren.splice(index, 0, newBlock);
            return { ...block, children: newChildren };
          }
          if (block.children.length > 0) {
            return { ...block, children: insertBlock(block.children) };
          }
          return block;
        });
      }
    };

    setStructuredBlocks(insertBlock(structuredBlocks));
    saveScriptChanges();
    
    // Close selectors
    setShowIfTypeSelector(false);
    setPendingIfCreation(null);
  };

  const openNodeSelector = (blockId: string, field: string, current?: string) => {
    setNodeSelectorData({ blockId, field, current });
    setShowNodeSelector(true);
  };

  const selectNode = (nodeName: string) => {
    if (!nodeSelectorData) return;

    const updateBlock = (blocks: StructuredBlock[]): boolean => {
      for (const block of blocks) {
        if (block.id === nodeSelectorData.blockId) {
          if (!block.command.parameters) block.command.parameters = {};
          block.command.parameters[nodeSelectorData.field] = nodeName;
          return true;
        }
        if (updateBlock(block.children)) return true;
      }
      return false;
    };

    updateBlock(structuredBlocks);
    setStructuredBlocks([...structuredBlocks]);
    saveScriptChanges();
    setShowNodeSelector(false);
  };

  const openButtonSelector = (blockId: string, field: string, current?: string) => {
    setButtonSelectorData({ blockId, field, current });
    setShowButtonSelector(true);
  };

  const selectButton = (buttonId: string) => {
    if (!buttonSelectorData) return;

    const updateBlock = (blocks: StructuredBlock[]): boolean => {
      for (const block of blocks) {
        if (block.id === buttonSelectorData.blockId) {
          if (!block.command.parameters) block.command.parameters = {};
          block.command.parameters[buttonSelectorData.field] = buttonId;
          return true;
        }
        if (updateBlock(block.children)) return true;
      }
      return false;
    };

    updateBlock(structuredBlocks);
    setStructuredBlocks([...structuredBlocks]);
    saveScriptChanges();
    setShowButtonSelector(false);
  };

  const selectCharacter = (characterName: string, imagePath?: string) => {
    if (!characterPickerData) return;

    const { blockId, field } = characterPickerData;
    
    const updateBlock = (blocks: StructuredBlock[]): boolean => {
      for (const block of blocks) {
        if (block.id === blockId) {
          if (!block.command.parameters) block.command.parameters = {};
          
          if (field === 'character') {
            block.command.parameters.character = characterName;
          } else if (field === 'character_image') {
            block.command.parameters.character = characterName;
            if (imagePath) {
              block.command.parameters.image = imagePath;
            }
          }
          
          return true;
        }
        
        if (updateBlock(block.children)) {
          return true;
        }
      }
      return false;
    };

    updateBlock(structuredBlocks);
    setStructuredBlocks([...structuredBlocks]);
    saveScriptChanges();
    setShowCharacterPicker(false);
    setCharacterPickerData(null);
  };

  const selectVariable = (variableName: string) => {
    if (!variablePickerData) return;

    const { blockId, field } = variablePickerData;
    
    const updateBlock = (blocks: StructuredBlock[]): boolean => {
      for (const block of blocks) {
        if (block.id === blockId) {
          // Handle condition_container specially
          if (block.type === 'condition_container' && field === 'condition') {
            // Block changes to predefined conditions
            if (block.metadata.ifType === 'predefined') {
              console.warn('Cannot change variable for predefined condition type');
              return false;
            }
            block.metadata.condition = variableName;
            block.command.content = `${block.metadata.isNot ? 'IFNOT' : 'IF'} ${variableName}`;
            block.command.parameters = { condition: variableName };
          } else {
            // Handle regular blocks
            if (!block.command.parameters) block.command.parameters = {};
            block.command.parameters[field] = variableName;
          }
          return true;
        }
        
        if (updateBlock(block.children)) {
          return true;
        }
      }
      return false;
    };

    updateBlock(structuredBlocks);
    setStructuredBlocks([...structuredBlocks]);
    saveScriptChanges();
    setShowVariablePicker(false);
    setVariablePickerData(null);
  };

  const openInsertMenu = (event: React.MouseEvent, parentId: string | null, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    setAddMenuPosition({ x: rect.left + rect.width / 2, y: rect.bottom + 5 });
    setInsertPosition({ parentId, index });
    setShowAddMenu(true);
  };

  const findBlockPosition = (blockId: string): { parentId: string | null; index: number } | null => {
    const findInBlocks = (blocks: StructuredBlock[], parentId: string | null = null): { parentId: string | null; index: number } | null => {
      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id === blockId) {
          return { parentId, index: i };
        }
        
        const found = findInBlocks(blocks[i].children, blocks[i].id);
        if (found) return found;
      }
      return null;
    };
    
    return findInBlocks(structuredBlocks);
  };

  const renderInsertZone = (parentId: string | null, index: number, isChild: boolean = false): JSX.Element => {
    return (
      <div 
        className={`
          ${isChild ? 'ml-8' : ''} 
          h-2 flex items-center justify-center group cursor-pointer
          hover:bg-blue-500/10 rounded transition-all
        `}
        onClick={(e) => openInsertMenu(e, parentId, index)}
      >
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-1 bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
            <span>+</span>
            <span>Insert here</span>
          </div>
        </div>
        <div className="absolute inset-x-0 h-px bg-blue-500/20 group-hover:bg-blue-500/50 transition-colors"></div>
      </div>
    );
  };

  const renderStructuredBlock = (block: StructuredBlock, isChild: boolean = false): JSX.Element => {
    const isSelected = selectedBlock === block.id;
    const isEditing = editingBlock === block.id;
    const isExpanded = expandedBlocks.has(block.id);
    const isContainer = isContainerBlock(block);

    const handleClick = () => {
      setSelectedBlock(block.id);
      if (isSelected && !isEditing) {
        setEditingBlock(block.id);
      }
    };

    const blockClasses = `
      ${isChild ? 'ml-8' : ''} 
      mb-2 
      ${isContainer ? 'border-l-4 pl-4' : 'pl-6'}
      ${isContainer && block.type === 'dialog_container' ? 'border-blue-500' : ''}
      ${isContainer && block.type === 'menu_container' ? 'border-purple-500' : ''}
      ${isContainer && block.type === 'option_container' ? 'border-purple-400' : ''}
      ${isContainer && block.type === 'condition_container' ? 'border-yellow-500' : ''}
    `;

    return (
      <div key={block.id} className={blockClasses}>
        {/* Container Header */}
        {isContainer && (
          <div 
            className={`
              flex items-center justify-between mb-2 cursor-pointer p-2 rounded
              ${isSelected ? 'bg-gt-accent/20' : 'hover:bg-gt-secondary/50'}
            `}
            onClick={() => toggleBlockExpanded(block.id)}
          >
            <div className="flex items-center space-x-2">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {block.type === 'dialog_container' && <MessageCircle className="w-5 h-5 text-blue-400" />}
            {block.type === 'menu_container' && <MenuIcon className="w-5 h-5 text-purple-400" />}
            {block.type === 'option_container' && <ArrowRight className="w-5 h-5 text-purple-300" />}
            {block.type === 'condition_container' && <GitBranch className="w-5 h-5 text-yellow-400" />}
            <span className="font-medium text-white">
              {block.type === 'dialog_container' && (block.metadata.title || 'Apri Dialogo')}
              {block.type === 'menu_container' && (block.metadata.title || 'MENU')}
              {block.type === 'option_container' && (
                <>
                  <div className="flex items-center space-x-2">
                    <span>OPT</span>
                    {block.metadata.isConditional && (
                      <span 
                        className="text-xs bg-yellow-600 px-1 rounded cursor-pointer hover:bg-yellow-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(block.id, 'condition', block.metadata.condition || 'someVariable');
                        }}
                      >
                        IF {editingField?.blockId === block.id && editingField?.field === 'condition' ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="bg-yellow-700 text-white text-xs w-20 px-1"
                            onBlur={saveEdit}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                saveEdit();
                              }
                            }}
                            autoFocus
                            list={`conditions-${block.id}`}
                          />
                        ) : (
                          block.metadata.condition || block.command.parameters?.condition
                        )}
                        <datalist id={`conditions-${block.id}`}>
                          {Array.from(variables.keys()).map(variable => (
                            <option key={variable} value={variable} />
                          ))}
                        </datalist>
                      </span>
                    )}
                    {editingField?.blockId === block.id && editingField?.field === 'text' ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="text-sm bg-gt-secondary text-gray-300 px-2 py-1 rounded border border-blue-500"
                        onBlur={saveEdit}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            saveEdit();
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="text-sm text-gray-300 cursor-pointer hover:bg-blue-600/20 px-1 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(block.id, 'text', block.command.parameters?.text || 'New Option');
                        }}
                      >
                        "{block.command.parameters?.text || 'New Option'}"
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 ml-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle conditional
                        const updateBlock = (blocks: StructuredBlock[]): boolean => {
                          for (const b of blocks) {
                            if (b.id === block.id) {
                              b.metadata.isConditional = !b.metadata.isConditional;
                              if (b.metadata.isConditional) {
                                b.metadata.condition = 'someVariable';
                                b.command.type = 'menu_option_conditional';
                              } else {
                                b.metadata.condition = undefined;
                                b.command.type = 'menu_option';
                              }
                              return true;
                            }
                            if (updateBlock(b.children)) return true;
                          }
                          return false;
                        };
                        updateBlock(structuredBlocks);
                        setStructuredBlocks([...structuredBlocks]);
                        saveScriptChanges();
                      }}
                      className={`text-xs px-2 py-1 rounded ${
                        block.metadata.isConditional 
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                      title={block.metadata.isConditional ? "Remove Condition" : "Add Condition"}
                    >
                      IF
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMenuOption(block.id);
                      }}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                      title="Remove Option"
                    >
                      ×
                    </button>
                  </div>
                </>
              )}
              {block.type === 'condition_container' && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    {/* Display predefined conditions differently */}
                    {block.metadata.ifType === 'predefined' ? (
                      <>
                        <span className="text-sm px-2 py-1 rounded bg-yellow-900/30 text-yellow-300 font-mono mr-2">
                          {block.command.content}
                        </span>
                        <select
                          value={block.metadata.predefinedType || 'IF_MIN'}
                          onChange={(e) => {
                            const newType = e.target.value;
                            block.metadata.predefinedType = newType;
                            
                            // Set default values based on type
                            switch (newType) {
                              case 'IF_TUTORIAL_SEEN':
                                block.command.content = 'IF_TUTORIAL_SEEN';
                                break;
                              case 'IF_FROM_CAMPAIGN':
                                block.command.content = 'IF_FROM_CAMPAIGN';
                                break;
                              case 'IF_DEBUG':
                                block.command.content = 'IF_DEBUG';
                                break;
                              case 'IF_MISSION_WON':
                                block.command.content = 'IF_MISSION_WON';
                                break;
                              case 'IF_PROB':
                                block.metadata.probability = '50';
                                block.command.content = 'IF_PROB 50';
                                break;
                              case 'IF_MIN':
                                block.metadata.variable = 'visited';
                                block.metadata.minValue = '7';
                                block.command.content = 'IF_MIN visited 7';
                                break;
                              case 'IF_MAX':
                                block.metadata.variable = 'opponents';
                                block.metadata.maxValue = '2';
                                block.command.content = 'IF_MAX opponents 2';
                                break;
                              case 'IF_IS':
                                block.metadata.variable = 'sailor';
                                block.metadata.exactValue = '4';
                                block.command.content = 'IF_IS sailor 4';
                                break;
                              case 'IF_HAS_CREDITS':
                                block.metadata.creditsAmount = '3';
                                block.command.content = 'IF_HAS_CREDITS 3';
                                break;
                              case 'IF_ORDER':
                                block.metadata.orderPositions = '0';
                                block.command.content = 'IF_ORDER 0';
                                break;
                            }
                            
                            // Update child content
                            if (block.children?.[0]) {
                              (block.children[0] as any).content = block.command.content;
                            }
                            
                            setStructuredBlocks([...structuredBlocks]);
                            saveScriptChanges();
                          }}
                          className="text-xs px-2 py-1 bg-yellow-950/50 border border-yellow-800 rounded text-yellow-100 mr-2"
                        >
                          <option value="IF_TUTORIAL_SEEN">Tutorial Seen</option>
                          <option value="IF_FROM_CAMPAIGN">From Campaign</option>
                          <option value="IF_DEBUG">Debug Mode</option>
                          <option value="IF_MISSION_WON">Mission Won</option>
                          <option value="IF_PROB">Probability</option>
                          <option value="IF_MIN">Minimum</option>
                          <option value="IF_MAX">Maximum</option>
                          <option value="IF_IS">Exact</option>
                          <option value="IF_HAS_CREDITS">Credits</option>
                          <option value="IF_ORDER">Turn Order</option>
                        </select>
                        
                        {/* Inline parameter inputs based on type */}
                        {block.metadata.predefinedType === 'IF_PROB' && (
                          <div className="flex items-center space-x-1">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={block.metadata.probability || '50'}
                              onChange={(e) => {
                                block.metadata.probability = e.target.value;
                                block.command.content = `IF_PROB ${e.target.value}`;
                                if (block.children?.[0]) {
                                  (block.children[0] as any).content = block.command.content;
                                }
                                setStructuredBlocks([...structuredBlocks]);
                              }}
                              className="w-20 mx-2"
                            />
                            <span className="text-xs text-yellow-300 font-mono min-w-8">{block.metadata.probability || '50'}%</span>
                          </div>
                        )}
                        
                        {(block.metadata.predefinedType === 'IF_MIN' || block.metadata.predefinedType === 'IF_MAX' || block.metadata.predefinedType === 'IF_IS') && (
                          <>
                            <select
                              value={block.metadata.variable || 'visited'}
                              onChange={(e) => {
                                block.metadata.variable = e.target.value;
                                const op = block.metadata.predefinedType === 'IF_MIN' ? block.metadata.minValue : 
                                          block.metadata.predefinedType === 'IF_MAX' ? block.metadata.maxValue : block.metadata.exactValue;
                                block.command.content = `${block.metadata.predefinedType} ${e.target.value} ${op || '7'}`;
                                if (block.children?.[0]) {
                                  (block.children[0] as any).content = block.command.content;
                                }
                                setStructuredBlocks([...structuredBlocks]);
                              }}
                              className="text-xs px-1 py-1 bg-yellow-950/50 border border-yellow-800 rounded text-yellow-100 mx-1"
                            >
                              {Array.from(variables?.keys() || []).map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={block.metadata.predefinedType === 'IF_MIN' ? (block.metadata.minValue || '7') :
                                    block.metadata.predefinedType === 'IF_MAX' ? (block.metadata.maxValue || '2') : 
                                    (block.metadata.exactValue || '4')}
                              onChange={(e) => {
                                const field = block.metadata.predefinedType === 'IF_MIN' ? 'minValue' :
                                            block.metadata.predefinedType === 'IF_MAX' ? 'maxValue' : 'exactValue';
                                block.metadata[field] = e.target.value;
                                block.command.content = `${block.metadata.predefinedType} ${block.metadata.variable || 'visited'} ${e.target.value}`;
                                if (block.children?.[0]) {
                                  (block.children[0] as any).content = block.command.content;
                                }
                                setStructuredBlocks([...structuredBlocks]);
                              }}
                              className="w-12 text-xs px-1 py-1 bg-yellow-950/50 border border-yellow-800 rounded text-yellow-100 mx-1"
                            />
                          </>
                        )}
                        
                        {block.metadata.predefinedType === 'IF_HAS_CREDITS' && (
                          <input
                            type="number"
                            value={block.metadata.creditsAmount || '3'}
                            onChange={(e) => {
                              block.metadata.creditsAmount = e.target.value;
                              block.command.content = `IF_HAS_CREDITS ${e.target.value}`;
                              if (block.children?.[0]) {
                                (block.children[0] as any).content = block.command.content;
                              }
                              setStructuredBlocks([...structuredBlocks]);
                            }}
                            className="w-12 text-xs px-1 py-1 bg-yellow-950/50 border border-yellow-800 rounded text-yellow-100 mx-1"
                          />
                        )}
                        
                        {block.metadata.predefinedType === 'IF_ORDER' && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-yellow-300">Positions:</span>
                            <div className="flex items-center space-x-1">
                              {[0, 1, 2, 3, 4, 5].map(pos => {
                                const isSelected = (block.metadata.orderPositions || '0').split(' ').includes(pos.toString());
                                const labels = ['🥇', '🥈', '🥉', '4th', '5th', '6th'];
                                return (
                                  <label key={pos} className="flex items-center space-x-1 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        const currentPositions = (block.metadata.orderPositions || '0').split(' ').filter((p: string) => p);
                                        let newPositions;
                                        if (e.target.checked) {
                                          newPositions = [...currentPositions, pos.toString()].sort();
                                        } else {
                                          newPositions = currentPositions.filter((p: string) => p !== pos.toString());
                                        }
                                        if (newPositions.length === 0) newPositions = ['0']; // At least one position
                                        block.metadata.orderPositions = newPositions.join(' ');
                                        block.command.content = `IF_ORDER ${newPositions.join(' ')}`;
                                        if (block.children?.[0]) {
                                          (block.children[0] as any).content = block.command.content;
                                        }
                                        setStructuredBlocks([...structuredBlocks]);
                                      }}
                                      className="w-3 h-3 text-yellow-500 rounded border-yellow-600 focus:ring-yellow-500"
                                    />
                                    <span className="text-xs text-yellow-300">{labels[pos]}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <span className={`text-sm px-2 py-1 rounded ${block.metadata.isNot ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'} mr-2`}>
                          {block.metadata.isNot ? 'IFNOT' : 'IF'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setVariablePickerData({ 
                              blockId: block.id, 
                              field: 'condition', 
                              current: block.metadata.condition,
                              action: 'condition'
                            });
                            setShowVariablePicker(true);
                          }}
                          className="text-yellow-300 font-medium hover:text-yellow-200 hover:bg-yellow-900/20 px-2 py-1 rounded transition-colors mr-2"
                          title="Click to change variable"
                        >
                          {block.metadata.condition}
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Quick Config Buttons - ONLY for standard conditions */}
                  {block.metadata.ifType !== 'predefined' && (
                    <div className="flex items-center space-x-1">
                      {/* IF/IFNOT Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          block.metadata.isNot = !block.metadata.isNot;
                          block.command.content = `${block.metadata.isNot ? 'IFNOT' : 'IF'} ${block.metadata.condition}`;
                          setStructuredBlocks([...structuredBlocks]);
                          saveScriptChanges();
                        }}
                        className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                      title={`Switch to ${block.metadata.isNot ? 'IF' : 'IFNOT'}`}
                    >
                      ⇄
                      </button>
                      
                    </div>
                  )}
                  
                  {/* ELSE Toggle - available for all IF types */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      block.metadata.hasElse = !block.metadata.hasElse;
                      if (block.metadata.hasElse && block.metadata.elseIndex === -1) {
                        // Default ELSE position: middle of existing children, or 0 if no children
                        block.metadata.elseIndex = Math.floor(block.children.length / 2);
                      } else if (!block.metadata.hasElse) {
                        block.metadata.elseIndex = -1;
                      }
                      setStructuredBlocks([...structuredBlocks]);
                      saveScriptChanges();
                    }}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      block.metadata.hasElse 
                        ? 'bg-yellow-700 hover:bg-yellow-600 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                    title={`${block.metadata.hasElse ? 'Remove' : 'Add'} ELSE block`}
                  >
                    {block.metadata.hasElse ? 'ELSE ✓' : 'ELSE'}
                  </button>
                    
                    {/* ELSE Position Controls */}
                    {block.metadata.hasElse && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (block.metadata.elseIndex > 0) {
                              block.metadata.elseIndex--;
                              setStructuredBlocks([...structuredBlocks]);
                              saveScriptChanges();
                            }
                          }}
                          className="text-xs px-1 py-1 bg-yellow-800 hover:bg-yellow-700 text-white rounded transition-colors"
                          title="Move ELSE up"
                          disabled={block.metadata.elseIndex <= 0}
                        >
                          ↑
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (block.metadata.elseIndex < block.children.length) {
                              block.metadata.elseIndex++;
                              setStructuredBlocks([...structuredBlocks]);
                              saveScriptChanges();
                            }
                          }}
                          className="text-xs px-1 py-1 bg-yellow-800 hover:bg-yellow-700 text-white rounded transition-colors"
                          title="Move ELSE down"
                          disabled={block.metadata.elseIndex >= block.children.length}
                        >
                          ↓
                        </button>
                      </>
                    )}
                    
                    {/* Type Toggle Button - Switch between standard and predefined */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const isCurrentlyPredefined = block.metadata.ifType === 'predefined';
                        
                        if (isCurrentlyPredefined) {
                          // Switch to standard IF/IFNOT
                          const variableName = block.metadata.variable || block.metadata.condition || 'newVariable';
                          block.metadata = {
                            ...block.metadata,
                            ifType: 'standard',
                            predefinedType: undefined,
                            isNot: false,
                            condition: variableName
                          };
                          block.command.content = `IF ${variableName}`;
                          block.command.parameters = { condition: variableName };
                          
                          // Update condition_start child
                          if (block.children?.[0]) {
                            (block.children[0] as any).content = block.command.content;
                            (block.children[0] as any).parameters = { condition: variableName };
                          }
                        } else {
                          // Switch to predefined - default to IF_MIN
                          block.metadata = {
                            ...block.metadata,
                            ifType: 'predefined',
                            predefinedType: 'IF_MIN',
                            condition: 'IF_MIN',
                            variable: block.metadata.condition || 'visited',
                            minValue: '7'
                          };
                          block.command.content = `IF_MIN ${block.metadata.variable} ${block.metadata.minValue}`;
                          block.command.parameters = { condition: block.command.content };
                          
                          // Update condition_start child
                          if (block.children?.[0]) {
                            (block.children[0] as any).content = block.command.content;
                            (block.children[0] as any).parameters = { condition: block.command.content };
                          }
                        }
                        
                        setStructuredBlocks([...structuredBlocks]);
                        saveScriptChanges();
                      }}
                      className="text-xs px-2 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded transition-colors"
                      title={`Switch to ${block.metadata.ifType === 'predefined' ? 'Standard' : 'Predefined'} IF type`}
                    >
                      {block.metadata.ifType === 'predefined' ? '📝' : '⚙️'}
                      <span className="ml-1">{block.metadata.ifType === 'predefined' ? 'STD' : 'PRE'}</span>
                    </button>
                </div>
              )}
            </span>
            <span className="text-xs text-gray-400">
              ({block.children.length} items)
            </span>
            </div>
            
            {/* Container Controls - Same style as other blocks */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveBlock(block.id, 'up');
                }}
                className="w-6 h-6 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center justify-center transition-colors"
                title="Move Up"
              >
                ↑
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveBlock(block.id, 'down');
                }}
                className="w-6 h-6 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center justify-center transition-colors"
                title="Move Down"
              >
                ↓
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const removeBlock = (blocks: StructuredBlock[]): boolean => {
                    for (let i = 0; i < blocks.length; i++) {
                      if (blocks[i].id === block.id) {
                        blocks.splice(i, 1);
                        return true;
                      }
                      if (removeBlock(blocks[i].children)) return true;
                    }
                    return false;
                  };
                  if (removeBlock(structuredBlocks)) {
                    setStructuredBlocks([...structuredBlocks]);
                    saveScriptChanges();
                    setSelectedBlock(null);
                  }
                }}
                className="w-6 h-6 bg-red-700 hover:bg-red-600 text-white rounded text-xs flex items-center justify-center transition-colors"
                title="Delete Container"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {/* Container Specific Controls */}
        {isContainer && (
          <div className="mb-2 flex items-center justify-center space-x-2">
            {block.type === 'menu_container' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addMenuOption(block.id, 'option');
                      }}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                      title="Add Option"
                    >
                      + OPT
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addMenuOption(block.id, 'option_conditional');
                      }}
                      className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded"
                      title="Add Conditional Option"
                    >
                      + IF
                    </button>
                  </>
                )}
                
                {/* Universal Add Component for all containers */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setAddMenuPosition({ x: rect.left, y: rect.bottom + 5 });
                    setShowAddMenu(true);
                    // Store the target container for insertion
                    (window as any).tempAddTarget = block.id;
                  }}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                  title="Add Component"
                >
                  + ⚡
                </button>
          </div>
        )}

        {/* Container Children or Regular Block Content */}
        {isContainer && isExpanded ? (
          <div className="ml-4">
            
            {isEditing && block.type === 'dialog_container' && (
              <div className="mb-4">
                {renderBlockContent({
                  block,
                  isEditing,
                  editingField,
                  editingValue,
                  selectedLanguage,
                  showAllLanguages,
                  translations,
                  availableNodes,
                  variables: block.command.type === 'variable_set_to' ? realVariables : semafori,
                  characters: CHARACTERS,
                  characterStates,
                  languages: ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'],
                  onStartEditing: startEditing,
                  onSaveEdit: () => {
                    setStructuredBlocks([...structuredBlocks]);
                    saveScriptChanges();
                  },
                  onEditingValueChange: setEditingValue,
                  onOpenCharacterPicker: openCharacterPicker,
                  onOpenVariablePicker: openVariablePicker,
                  onOpenNodeSelector: openNodeSelector,
                  onOpenButtonSelector: openButtonSelector,
                  onDeleteBlock: (blockId: string) => {
                    // Handle block deletion
                    console.log('Delete block:', blockId);
                  }
                })}
              </div>
            )}
            {/* Insert zone before first child */}
            <div key={`insert_${block.id}_0`}>
              {renderInsertZone(block.id, 0, true)}
            </div>
            
            {block.children.map((child, index) => {
              const elements = [];
              const isInElseSection = block.type === 'condition_container' && 
                                     block.metadata.hasElse && 
                                     index >= block.metadata.elseIndex;
              
              // Handle ELSE separator in condition containers
              if (block.type === 'condition_container' && 
                  block.metadata.hasElse && 
                  index === block.metadata.elseIndex) {
                elements.push(
                  <div key={`else_separator_${index}`} className="flex items-center space-x-2 my-3 text-yellow-400">
                    <div className="flex-1 h-px bg-yellow-400/50"></div>
                    <div className="flex items-center space-x-2 bg-yellow-900/30 px-3 py-1 rounded-lg border border-yellow-600">
                      <span className="text-sm font-medium">ELSE</span>
                      <span className="text-xs opacity-75">({block.children.length - block.metadata.elseIndex} items)</span>
                    </div>
                    <div className="flex-1 h-px bg-yellow-400/50"></div>
                  </div>
                );
              }
              
              // Add section indicator for IF/ELSE visual distinction
              const childWithSection = (
                <div key={child.id} className={`${isInElseSection ? 'border-l-2 border-yellow-400/30 pl-2' : ''}`}>
                  {isInElseSection && index === block.metadata.elseIndex && (
                    <div className="text-xs text-yellow-400 mb-1 opacity-75">
                      ELSE Section
                    </div>
                  )}
                  {!isInElseSection && index === 0 && block.metadata.hasElse && (
                    <div className="text-xs text-green-400 mb-1 opacity-75">
                      IF Section
                    </div>
                  )}
                  {renderStructuredBlock(child, true)}
                </div>
              );
              
              // Add the block with section styling
              elements.push(childWithSection);
              
              // Add insert zone after each block (except the last one, handled separately)
              if (index < block.children.length - 1) {
                elements.push(
                  <div key={`insert_${block.id}_${index + 1}`}>
                    {renderInsertZone(block.id, index + 1, true)}
                  </div>
                );
              }
              
              return (
                <React.Fragment key={child.id}>
                  {elements}
                </React.Fragment>
              );
            })}
            
            {/* Insert zone after last child */}
            {block.children.length > 0 && (
              <div key={`insert_${block.id}_${block.children.length}`}>
                {renderInsertZone(block.id, block.children.length, true)}
              </div>
            )}
          </div>
        ) : !isContainer ? (
          <div className="relative group">
            <div 
              id={block.id}
              className={`
                bg-gt-secondary rounded-lg p-3 cursor-pointer transition-all flex items-start justify-between
                ${isSelected ? 'ring-2 ring-gt-accent' : 'hover:bg-gt-secondary/80'}
                ${isEditing ? 'ring-2 ring-blue-400' : ''}
              `}
              onClick={handleClick}
            >
              <div className="flex-1">
                {renderBlockContent({
                  block,
                  isEditing,
                  editingField,
                  editingValue,
                  selectedLanguage,
                  showAllLanguages,
                  translations,
                  availableNodes,
                  variables: block.command.type === 'variable_set_to' ? realVariables : semafori,
                  characters: CHARACTERS,
                  characterStates: calculateCharacterStatesUpToBlock(structuredBlocks, CHARACTERS, block.id),
                  languages: LANGUAGES,
                  onStartEditing: startEditing,
                  onSaveEdit: saveEdit,
                  onEditingValueChange: setEditingValue,
                  onOpenCharacterPicker: openCharacterPicker,
                  onOpenVariablePicker: openVariablePicker,
                  onOpenNodeSelector: openNodeSelector,
                  onOpenButtonSelector: openButtonSelector,
                  onMoveUp: (blockId: string) => moveBlock(blockId, 'up'),
                  onMoveDown: (blockId: string) => moveBlock(blockId, 'down'),
                  onDeleteBlock: (blockId: string) => {
                    const removeBlock = (blocks: StructuredBlock[]): boolean => {
                      for (let i = 0; i < blocks.length; i++) {
                        if (blocks[i].id === blockId) {
                          blocks.splice(i, 1);
                          return true;
                        }
                        if (removeBlock(blocks[i].children)) return true;
                      }
                      return false;
                    };
                    removeBlock(structuredBlocks);
                    setStructuredBlocks([...structuredBlocks]);
                    saveScriptChanges();
                  }
                })}
              </div>
              
              {/* Block Controls - Always Visible (except for container blocks) */}
              {block.type !== 'dialog_container' && (
                <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveBlock(block.id, 'up');
                  }}
                  className="w-6 h-6 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center justify-center transition-colors"
                  title="Move Up"
                >
                  ↑
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveBlock(block.id, 'down');
                  }}
                  className="w-6 h-6 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center justify-center transition-colors"
                  title="Move Down"
                >
                  ↓
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Remove block
                    const removeBlock = (blocks: StructuredBlock[]): boolean => {
                      for (let i = 0; i < blocks.length; i++) {
                        if (blocks[i].id === block.id) {
                          blocks.splice(i, 1);
                          return true;
                        }
                        if (removeBlock(blocks[i].children)) return true;
                      }
                      return false;
                    };
                    if (removeBlock(structuredBlocks)) {
                      setStructuredBlocks([...structuredBlocks]);
                      saveScriptChanges();
                      setSelectedBlock(null);
                    }
                  }}
                  className="w-6 h-6 bg-red-700 hover:bg-red-600 text-white rounded text-xs flex items-center justify-center transition-colors"
                  title="Delete Block"
                >
                  ×
                </button>
              </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    );
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gt-primary rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gt-accent mb-4"></div>
          <p className="text-white">Loading structured campaign flow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gt-primary rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-bold text-white">Structured Flow Editor</h3>
          {currentScript && (
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <FileText className="w-4 h-4" />
              <span>{currentScript.name}</span>
              <span className="text-gray-500">({currentScript.fileName})</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Edit Mode Toggle */}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1 ${
              editMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gt-secondary text-gray-300 hover:bg-slate-600'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{editMode ? 'Viewing' : 'Edit Mode'}</span>
          </button>
          
          {/* Cancel Edit */}
          {editingField && (
            <button
              onClick={cancelEditing}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors flex items-center space-x-1"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          )}
          
          {/* Navigation Back */}
          {navigationStack.length > 0 && (
            <button
              onClick={() => navigateBack()}
              className="px-3 py-1 bg-gt-secondary text-white rounded text-sm hover:bg-slate-600 transition-colors flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
          
          {/* Language Controls */}
          <div className="flex items-center space-x-2 border-l border-slate-600 pl-2">
            <button
              onClick={() => setShowAllLanguages(!showAllLanguages)}
              className={`px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1 ${
                showAllLanguages 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gt-secondary text-gray-300 hover:bg-slate-600'
              }`}
            >
              <Languages className="w-4 h-4" />
              <span>{showAllLanguages ? 'All' : selectedLanguage}</span>
            </button>
            
            {!showAllLanguages && (
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-2 py-1 bg-gt-secondary text-white rounded text-sm"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            )}
          </div>
          
          {/* Scripts List Toggle */}
          <button
            onClick={() => setShowAllScripts(!showAllScripts)}
            className="px-3 py-1 bg-gt-secondary text-white rounded text-sm hover:bg-slate-600 transition-colors"
          >
            {showAllScripts ? 'Hide' : 'Show'} Scripts
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

      {/* Structured Flow */}
      <div className="flex-1 bg-slate-800 rounded-lg overflow-auto p-4">
        {structuredBlocks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>No script loaded or script is empty</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Insert zone before first block */}
            <div key="insert_root_0">
              {renderInsertZone(null, 0)}
            </div>
            
            {structuredBlocks.map((block, index) => (
              <React.Fragment key={block.id}>
                {renderStructuredBlock(block)}
                {/* Insert zone after each block */}
                <div key={`insert_root_${index + 1}`}>
                  {renderInsertZone(null, index + 1)}
                </div>
              </React.Fragment>
            ))}
            
            {/* Add Component Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setAddMenuPosition({ x: rect.left, y: rect.bottom + 5 });
                  setShowAddMenu(true);
                }}
                className="px-4 py-2 bg-gt-accent hover:bg-orange-600 text-white rounded-lg flex items-center space-x-2 shadow-lg"
              >
                <span className="text-lg">+</span>
                <span>Add Component</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Component Menu - Redesigned */}
      {showAddMenu && addMenuPosition && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowAddMenu(false)}
          />
          <div 
            className="fixed z-50 bg-gt-primary border border-gray-600 rounded-xl shadow-2xl"
            style={{ 
              left: Math.min(addMenuPosition.x, window.innerWidth - 600),
              top: Math.min(addMenuPosition.y, window.innerHeight - 500),
              width: '580px',
              maxHeight: '480px'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-600">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span className="text-2xl">⚡</span>
                <span>Add Component</span>
              </h3>
              <button 
                onClick={() => setShowAddMenu(false)}
                className="text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: '400px' }}>
              {(() => {
                const componentCategories = {
                  dialogue: {
                    title: '💬 Dialogue & Text',
                    color: '#3b82f6',
                    bgColor: 'rgba(59, 130, 246, 0.1)',
                    components: [
                      { type: 'dialogue', label: 'Say (Dialogue)', icon: '💬', description: 'Character speaks a line' },
                      { type: 'question', label: 'Ask (Question)', icon: '❓', description: 'Ask player a question' },
                      { type: 'announce', label: 'Announce', icon: '📢', description: 'System announcement' },
                    ]
                  },
                  character: {
                    title: '👤 Characters',
                    color: '#10b981',
                    bgColor: 'rgba(16, 185, 129, 0.1)',
                    components: [
                      { type: 'show_character', label: 'Show Character', icon: '👤', description: 'Display character on screen' },
                      { type: 'hide_character', label: 'Hide Character', icon: '👥', description: 'Hide character from screen' },
                      { type: 'change_character', label: 'Change Character', icon: '🔄', description: 'Switch character image/pose' },
                    ]
                  },
                  variables: {
                    title: '📝 Variables & Semafori',
                    color: '#f59e0b',
                    bgColor: 'rgba(245, 158, 11, 0.1)',
                    components: [
                      { type: 'variable_set', label: 'SET Semaforo', icon: '🚦', description: 'Set boolean semaforo to true' },
                      { type: 'variable_reset', label: 'RESET Semaforo', icon: '🗑️', description: 'Set boolean semaforo to false' },
                      { type: 'variable_set_to', label: 'SET_TO Variable', icon: '📝', description: 'Set variable to specific value' },
                    ]
                  },
                  containers: {
                    title: '📦 Containers',
                    color: '#8b5cf6',
                    bgColor: 'rgba(139, 92, 246, 0.1)',
                    components: [
                      { type: 'dialog_container', label: 'Dialog Scene', icon: '🗣️', description: 'ShowDlgScene container' },
                      { type: 'menu_container', label: 'Menu', icon: '📋', description: 'Interactive menu container' },
                      { type: 'condition_container', label: 'IF Condition', icon: '🔀', description: 'Conditional logic block' },
                    ]
                  },
                  navigation: {
                    title: '🧭 Navigation & Flow',
                    color: '#ec4899',
                    bgColor: 'rgba(236, 72, 153, 0.1)',
                    components: [
                      { type: 'label', label: 'Label', icon: '🏷️', description: 'Define a jump point' },
                      { type: 'goto', label: 'Go To Label', icon: '➡️', description: 'Jump to a label' },
                      { type: 'subscript', label: 'Sub-Script', icon: '📄', description: 'Call another script' },
                      { type: 'delay', label: 'Delay', icon: '⏱️', description: 'Wait for specified time' },
                    ]
                  },
                  interface: {
                    title: '🖥️ Interface & UI',
                    color: '#14b8a6',
                    bgColor: 'rgba(20, 184, 166, 0.1)',
                    components: [
                      { type: 'center_map', label: 'Center Map', icon: '🗺️', description: 'CenterMapByNode' },
                      { type: 'show_node', label: 'Show Node', icon: '🌟', description: 'Display map node' },
                      { type: 'show_button', label: 'Show Button', icon: '🔘', description: 'Display interface button' },
                      { type: 'hide_button', label: 'Hide Button', icon: '⚫', description: 'Hide interface button' },
                      { type: 'set_focus', label: 'Set Focus', icon: '🎯', description: 'Focus on UI element' },
                      { type: 'reset_focus', label: 'Reset Focus', icon: '🔄', description: 'Clear UI focus' },
                      { type: 'show_info_window', label: 'Show Info Window', icon: '📺', description: 'Display information window' },
                      { type: 'add_info_window', label: 'Add Info Window', icon: '➕', description: 'Add info window to queue' },
                    ]
                  },
                  game: {
                    title: '🚀 Game Actions',
                    color: '#eab308',
                    bgColor: 'rgba(234, 179, 8, 0.1)',
                    components: [
                      { type: 'start_mission', label: 'Start Mission', icon: '🚀', description: 'Activate a mission' },
                      { type: 'set_credits', label: 'Set Credits', icon: '💰', description: 'Set player credits' },
                      { type: 'set_status_bar', label: 'Set Status Bar', icon: '📊', description: 'Update flight status bar' },
                    ]
                  }
                };

                return (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(componentCategories).map(([categoryKey, category]) => (
                      <div key={categoryKey} className="bg-gt-secondary rounded-lg border border-gray-600">
                        {/* Category Header */}
                        <div 
                          className="p-3 rounded-t-lg border-b border-gray-600 flex items-center justify-between"
                          style={{ 
                            backgroundColor: category.bgColor,
                            borderColor: category.color + '40'
                          }}
                        >
                          <h4 className="font-bold text-white text-sm">{category.title}</h4>
                          <span className="text-xs text-gray-300">{category.components.length}</span>
                        </div>

                        {/* Components Grid */}
                        <div className="p-2">
                          <div className="grid grid-cols-1 gap-1">
                            {category.components.map(component => (
                              <button
                                key={component.type}
                                onClick={() => {
                                  const targetId = (window as any).tempAddTarget || insertPosition?.parentId || null;
                                  const index = insertPosition?.index;
                                  addNewComponent(targetId, component.type, index);
                                  setShowAddMenu(false);
                                  setInsertPosition(null);
                                  (window as any).tempAddTarget = null;
                                }}
                                className="w-full text-left p-2 rounded text-white text-sm flex items-center space-x-3 hover:bg-gt-primary transition-all duration-150 group"
                                title={component.description}
                              >
                                <span className="text-lg group-hover:scale-110 transition-transform">{component.icon}</span>
                                <div className="flex-1">
                                  <div className="font-medium">{component.label}</div>
                                  {component.description && (
                                    <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {component.description}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">+</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}
      {/* Character Picker Modal */}
      {showCharacterPicker && characterPickerData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gt-primary rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Select Character</h3>
                <div className="text-sm text-gray-400 mt-1">
                  For {characterPickerData.blockType?.replace('_', ' ').toUpperCase()} block
                </div>
              </div>
              <button 
                onClick={() => setShowCharacterPicker(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* Legend */}
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
              <div className="text-sm text-gray-300 mb-2 font-medium">Legend:</div>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">✓</div>
                  <span className="text-green-400">Visible character (selectable)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center text-gray-300 font-bold">○</div>
                  <span className="text-gray-400">Hidden character {characterPickerData.blockType === 'show_character' ? '(selectable)' : '(not selectable)'}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {CHARACTERS.map(character => {
                // Calculate character state up to the current block
                const currentBlockCharacterStates = calculateCharacterStatesUpToBlock(
                  structuredBlocks, 
                  CHARACTERS, 
                  characterPickerData.blockId
                );
                const characterState = currentBlockCharacterStates.get(character.name);
                const isShown = characterState?.isShown || false;
                
                // Determine if character is selectable based on block type
                const isSelectable = characterPickerData.blockType === 'show_character' || isShown;
                const isCurrentSelection = characterPickerData.current === character.name;
                
                return (
                  <div 
                    key={character.name}
                    className={`
                      p-4 rounded-lg transition-all border-2 relative
                      ${isCurrentSelection 
                        ? 'border-blue-500 bg-blue-900/20' 
                        : isSelectable 
                          ? 'border-gray-600 hover:border-gray-400 bg-gt-secondary hover:bg-slate-600 cursor-pointer'
                          : 'border-red-800 bg-red-900/10 cursor-not-allowed opacity-60'
                      }
                    `}
                    onClick={() => isSelectable && selectCharacter(character.name)}
                  >
                    <div className="text-center">
                      <div className="mb-3 relative">
                        <img 
                          src={getCampaignCharacterImage(character.images[0])}
                          alt={character.displayName}
                          className="w-16 h-16 object-contain mx-auto rounded border border-gray-500"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjE0Ij7wn5GKPC90ZXh0Pgo8L3N2Zz4K';
                          }}
                        />
                        {/* Status indicator */}
                        <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isShown ? 'bg-green-500 text-white' : 'bg-gray-500 text-gray-300'
                        }`}>
                          {isShown ? '✓' : '○'}
                        </div>
                      </div>
                      <div className="font-medium text-white text-sm mb-1">
                        {character.displayName}
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        {character.name}
                      </div>
                      <div className={`text-xs ${isShown ? 'text-green-400' : 'text-gray-500'}`}>
                        {isShown ? 'VISIBLE' : 'HIDDEN'}
                      </div>
                      {!isSelectable && (
                        <div className="text-xs text-red-400 mt-1">
                          Not available
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* IF Type Selector Modal */}
      {showIfTypeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gt-primary rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <GitBranch className="w-6 h-6 text-yellow-400" />
                <span>Select IF Block Type</span>
              </h3>
              <button 
                onClick={() => {
                  setShowIfTypeSelector(false);
                  setPendingIfCreation(null);
                }}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-300 text-sm mb-4">
                Choose the type of IF condition you want to create:
              </p>
              
              {/* Predefined IF Option */}
              <div className="space-y-3">
                <h4 className="text-lg font-medium text-yellow-300">Predefined IF Conditions</h4>
                <p className="text-sm text-gray-400 mb-3">
                  Use predefined game state conditions found in Galaxy Trucker scripts:
                </p>
                
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  {[
                    { value: 'IF_TUTORIAL_SEEN', label: 'Tutorial Seen', description: 'Player has seen the tutorial before' },
                    { value: 'IF_FROM_CAMPAIGN', label: 'From Campaign', description: 'Called from campaign mode' },
                    { value: 'IF_DEBUG', label: 'Debug Mode', description: 'Debug mode is enabled' },
                    { value: 'IF_MISSION_WON', label: 'Mission Won', description: 'Player won the current mission' },
                    { value: 'IF_PROB', label: 'Probability Check', description: 'Random probability check (requires number)' },
                    { value: 'IF_MIN', label: 'Minimum Value', description: 'Variable is at least minimum value' },
                    { value: 'IF_MAX', label: 'Maximum Value', description: 'Variable is at most maximum value' },
                    { value: 'IF_IS', label: 'Exact Value', description: 'Variable equals exact value' },
                    { value: 'IF_HAS_CREDITS', label: 'Has Credits', description: 'Player has enough credits (requires amount)' },
                    { value: 'IF_ORDER', label: 'Turn Order', description: 'Player position in turn order (requires parameters)' }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => createIfBlockWithType('predefined', type.value)}
                      className="p-3 bg-blue-900/30 hover:bg-blue-800/50 border border-blue-700 rounded-lg text-left transition-colors"
                    >
                      <div className="font-medium text-blue-200">{type.label}</div>
                      <div className="text-xs text-blue-300 mt-1">{type.value}</div>
                      <div className="text-xs text-gray-400 mt-1">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-gray-600 pt-4">
                <h4 className="text-lg font-medium text-green-300 mb-3">Standard IF/IFNOT with Variables</h4>
                <p className="text-sm text-gray-400 mb-3">
                  Create custom IF conditions using variables/semafori:
                </p>
                
                <button
                  onClick={() => createIfBlockWithType('standard')}
                  className="w-full p-4 bg-green-900/30 hover:bg-green-800/50 border border-green-700 rounded-lg text-left transition-colors"
                >
                  <div className="font-medium text-green-200">Standard IF Block</div>
                  <div className="text-sm text-green-300 mt-1">IF/IFNOT with custom variables</div>
                  <div className="text-xs text-gray-400 mt-1">Create conditions using your own variables and semafori</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Node Selector Modal */}
      {showNodeSelector && nodeSelectorData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gt-primary rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-purple-400" />
                <span>Select Map Node</span>
              </h3>
              <button 
                onClick={() => setShowNodeSelector(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableNodes.map(node => (
                <div 
                  key={node.name}
                  className={`
                    p-4 rounded-lg cursor-pointer transition-all border-2
                    ${nodeSelectorData.current === node.name 
                      ? 'border-purple-500 bg-purple-900/20' 
                      : 'border-gray-600 hover:border-gray-400 bg-gt-secondary hover:bg-slate-600'
                    }
                  `}
                  onClick={() => selectNode(node.name)}
                >
                  <div className="text-center">
                    <div className="mb-3">
                      <div className="w-16 h-16 mx-auto bg-purple-600/20 rounded-full flex items-center justify-center border border-purple-500/30">
                        <MapPin className="w-8 h-8 text-purple-400" />
                      </div>
                    </div>
                    <div className="font-medium text-white text-sm mb-1">
                      {node.caption}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      {node.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {node.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Button Selector Modal */}
      {showButtonSelector && buttonSelectorData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gt-primary rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Square className="w-5 h-5 text-green-400" />
                <span>Select Interface Button</span>
              </h3>
              <button 
                onClick={() => setShowButtonSelector(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* Group buttons by category */}
            {['tutorial', 'navigation', 'interface', 'action'].map(category => {
              const categoryButtons = availableButtons.filter(b => b.category === category);
              if (categoryButtons.length === 0) return null;
              
              return (
                <div key={category} className="mb-6">
                  <h4 className="text-sm font-bold text-white mb-3 capitalize border-b border-gray-600 pb-2">
                    {category} Buttons
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categoryButtons.map(button => (
                      <div 
                        key={button.id}
                        className={`
                          p-3 rounded-lg cursor-pointer transition-all border-2
                          ${buttonSelectorData.current === button.id 
                            ? 'border-green-500 bg-green-900/20' 
                            : 'border-gray-600 hover:border-gray-400 bg-gt-secondary hover:bg-slate-600'
                          }
                        `}
                        onClick={() => selectButton(button.id)}
                      >
                        <div className="text-center">
                          <div className="mb-2">
                            <div className="w-12 h-12 mx-auto bg-green-600/20 rounded-full flex items-center justify-center border border-green-500/30">
                              <Square className="w-6 h-6 text-green-400" />
                            </div>
                          </div>
                          <div className="font-medium text-white text-sm mb-1">
                            {button.name}
                          </div>
                          <div className="text-xs text-gray-400 mb-1">
                            {button.id}
                          </div>
                          <div className="text-xs text-gray-500">
                            {button.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Variable Picker Modal */}
      {showVariablePicker && variablePickerData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gt-primary rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Variable className="w-5 h-5 text-purple-400" />
                  <span>Select Variable/Semaforo</span>
                </h3>
                <div className="text-sm text-gray-400 mt-1">
                  For {variablePickerData.action?.toUpperCase()} action - {variablePickerData.action === 'set' ? 'turns semaforo ON' : 'turns semaforo OFF'}
                </div>
              </div>
              <button 
                onClick={() => setShowVariablePicker(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* Search Filter */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search variables/semafori... (case sensitive)"
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                value={variableSearchFilter || ''}
                onChange={(e) => setVariableSearchFilter(e.target.value)}
              />
            </div>

            {/* Legend */}
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
              <div className="text-sm text-gray-300 mb-2 font-medium">Legend:</div>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-400">Variable ON/True</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-400">Variable OFF/False</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full border-2 border-dashed border-gray-400"></div>
                  <span className="text-gray-400">Create New Variable (always first option)</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Create New Variable Option - ALWAYS FIRST */}
              <div 
                className="p-4 rounded-lg cursor-pointer transition-all border-2 border-dashed border-purple-500 hover:border-purple-400 bg-purple-900/10 hover:bg-purple-900/20 order-first"
                onClick={() => {
                  const newVariableName = prompt('Enter new variable/semaforo name:');
                  if (newVariableName && newVariableName.trim()) {
                    selectVariable(newVariableName.trim());
                  }
                }}
              >
                <div className="text-center">
                  <div className="mb-3">
                    <div className="w-16 h-16 mx-auto bg-purple-700/30 rounded-full flex items-center justify-center border-2 border-dashed border-purple-500">
                      <PlusIcon className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  <div className="font-medium text-purple-300 text-sm mb-1">
                    Create New Variable
                  </div>
                  <div className="text-xs text-purple-400">
                    Click to add new semaforo
                  </div>
                </div>
              </div>

              {/* Existing Variables - Filtered and Sorted */}
              {Array.from(variables.entries())
                .filter(([variableName]) => 
                  !variableSearchFilter || variableName.includes(variableSearchFilter)
                )
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([variableName, variableState]) => (
                <div 
                  key={variableName}
                  className={`
                    p-4 rounded-lg cursor-pointer transition-all border-2 relative
                    ${variablePickerData.current === variableName 
                      ? 'border-purple-500 bg-purple-900/20' 
                      : 'border-gray-600 hover:border-gray-400 bg-gt-secondary hover:bg-slate-600'
                    }
                  `}
                  onClick={() => selectVariable(variableName)}
                >
                  <div className="text-center">
                    <div className="mb-3 relative">
                      <div className="w-16 h-16 mx-auto bg-purple-600/20 rounded-full flex items-center justify-center border border-purple-500/30">
                        <Variable className="w-8 h-8 text-purple-400" />
                      </div>
                      {/* Status indicator */}
                      <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
                        variableState ? 'bg-green-500' : 'bg-red-500'
                      } shadow-lg`}>
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="font-medium text-white text-sm mb-1">
                      {variableName}
                    </div>
                    <div className={`text-xs font-medium ${variableState ? 'text-green-400' : 'text-red-400'}`}>
                      {variableState ? 'ON (TRUE)' : 'OFF (FALSE)'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Will become: {variablePickerData.action === 'set' ? 'ON' : 'OFF'}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* No Results Message */}
              {variableSearchFilter && 
               Array.from(variables.entries()).filter(([variableName]) => 
                 variableName.includes(variableSearchFilter)
               ).length === 0 && (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-400 text-sm">
                    No variables found matching "{variableSearchFilter}"
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    Search is case-sensitive. Try adjusting your search term.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Stack */}
      {navigationStack.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-gt-primary rounded-lg p-3 shadow-xl border border-gray-600">
          <div className="flex items-center space-x-2 mb-2">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-white font-medium">Navigation Stack</span>
          </div>
          <div className="space-y-1">
            {navigationStack.map((item, index) => (
              <button
                key={index}
                onClick={() => navigateBack(index)}
                className="block w-full text-left px-2 py-1 text-xs bg-gt-secondary hover:bg-slate-600 rounded transition-colors text-gray-300"
              >
                {item.scriptName} {item.blockId && `(${item.blockId})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Script Info Panel */}
      {currentScript && (
        <div className="fixed bottom-4 left-4 bg-gt-primary rounded-lg p-3 shadow-xl border border-gray-600 max-w-xs">
          <div className="text-sm text-white font-medium mb-2">{currentScript.name}</div>
          <div className="space-y-1 text-xs text-gray-400">
            <div>
              <span className="text-gray-400">Blocks:</span>
              <span className="text-white ml-2">{structuredBlocks.length}</span>
            </div>
            <div>
              <span className="text-gray-400">Characters:</span>
              <span className="text-white ml-2">{currentScript.characters.length}</span>
            </div>
            <div>
              <span className="text-gray-400">Variables:</span>
              <span className="text-white ml-2">{currentScript.variables.length}</span>
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
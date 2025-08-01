import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw,
  Users,
  MessageSquare
} from 'lucide-react';
import { getCampaignCharacterImage } from '../../utils/imageUtils';

interface DialoguePreviewProps {
  scriptContent: string;
  onClose: () => void;
}

interface DialogueStep {
  type: 'say' | 'show_char' | 'hide_char' | 'change_char' | 'delay' | 'menu';
  character?: string;
  text?: string;
  image?: string;
  position?: 'left' | 'right' | 'center';
  delay?: number;
  options?: string[];
}

interface Character {
  name: string;
  image: string;
  position: 'left' | 'right' | 'center';
  visible: boolean;
}

export function DialoguePreview({ scriptContent, onClose }: DialoguePreviewProps) {
  const [dialogueSteps, setDialogueSteps] = useState<DialogueStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [characters, setCharacters] = useState<Record<string, Character>>({});
  const [currentText, setCurrentText] = useState('');
  const [currentSpeaker, setCurrentSpeaker] = useState('');

  useEffect(() => {
    parseDialogue(scriptContent);
  }, [scriptContent]);

  useEffect(() => {
    if (isPlaying && currentStep < dialogueSteps.length) {
      const step = dialogueSteps[currentStep];
      executeStep(step);
    }
  }, [currentStep, isPlaying, dialogueSteps]);

  const parseDialogue = (content: string) => {
    const lines = content.split('\n');
    const steps: DialogueStep[] = [];
    
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('SCRIPT') || trimmed === 'SCRIPTS') return;
      
      // Parse Say commands
      const sayMatch = trimmed.match(/^Say\s+"(.+)"$/);
      if (sayMatch) {
        steps.push({
          type: 'say',
          text: sayMatch[1],
          character: currentSpeaker || 'Narrator'
        });
        return;
      }
      
      // Parse SayChar commands
      const sayCharMatch = trimmed.match(/^SayChar\s+(\w+)\s+"(.+)"$/);
      if (sayCharMatch) {
        steps.push({
          type: 'say',
          character: sayCharMatch[1],
          text: sayCharMatch[2]
        });
        return;
      }
      
      // Parse ShowChar commands
      const showCharMatch = trimmed.match(/^ShowChar\s+(\w+)\s+(left|right|center)$/);
      if (showCharMatch) {
        steps.push({
          type: 'show_char',
          character: showCharMatch[1],
          position: showCharMatch[2] as 'left' | 'right' | 'center'
        });
        return;
      }
      
      // Parse HideChar commands
      const hideCharMatch = trimmed.match(/^HideChar\s+(\w+)$/);
      if (hideCharMatch) {
        steps.push({
          type: 'hide_char',
          character: hideCharMatch[1]
        });
        return;
      }
      
      // Parse ChangeChar commands
      const changeCharMatch = trimmed.match(/^ChangeChar\s+(\w+)\s+(.+)$/);
      if (changeCharMatch) {
        steps.push({
          type: 'change_char',
          character: changeCharMatch[1],
          image: changeCharMatch[2]
        });
        return;
      }
      
      // Parse Delay commands
      const delayMatch = trimmed.match(/^Delay\s+(\d+)$/);
      if (delayMatch) {
        steps.push({
          type: 'delay',
          delay: parseInt(delayMatch[1])
        });
        return;
      }
      
      // Parse Menu commands (simplified)
      if (trimmed === 'MENU') {
        steps.push({
          type: 'menu',
          options: ['Opzione 1', 'Opzione 2'] // Simplified for preview
        });
        return;
      }
    });
    
    setDialogueSteps(steps);
  };

  const executeStep = async (step: DialogueStep) => {
    switch (step.type) {
      case 'say':
        if (step.character) {
          setCurrentSpeaker(step.character);
        }
        if (step.text) {
          setCurrentText(step.text);
        }
        setTimeout(() => {
          if (isPlaying) {
            setCurrentStep(prev => prev + 1);
          }
        }, 2000);
        break;
        
      case 'show_char':
        if (step.character && step.position) {
          setCharacters(prev => ({
            ...prev,
            [step.character!]: {
              name: step.character!,
              image: getCharacterImage(step.character!),
              position: step.position!,
              visible: true
            }
          }));
        }
        setTimeout(() => {
          if (isPlaying) {
            setCurrentStep(prev => prev + 1);
          }
        }, 500);
        break;
        
      case 'hide_char':
        if (step.character) {
          setCharacters(prev => ({
            ...prev,
            [step.character!]: {
              ...prev[step.character!],
              visible: false
            }
          }));
        }
        setTimeout(() => {
          if (isPlaying) {
            setCurrentStep(prev => prev + 1);
          }
        }, 500);
        break;
        
      case 'change_char':
        if (step.character && step.image) {
          setCharacters(prev => ({
            ...prev,
            [step.character!]: {
              ...prev[step.character!],
              image: step.image!.replace('campaign/', '')
            }
          }));
        }
        setTimeout(() => {
          if (isPlaying) {
            setCurrentStep(prev => prev + 1);
          }
        }, 300);
        break;
        
      case 'delay':
        setTimeout(() => {
          if (isPlaying) {
            setCurrentStep(prev => prev + 1);
          }
        }, step.delay || 1000);
        break;
        
      case 'menu':
        setIsPlaying(false); // Pause on menu
        break;
        
      default:
        setTimeout(() => {
          if (isPlaying) {
            setCurrentStep(prev => prev + 1);
          }
        }, 100);
        break;
    }
  };

  const getCharacterImage = (characterName: string): string => {
    // Map character names to their default images
    const characterImages: Record<string, string> = {
      'tutor': 'tutor.png',
      'roughtrucker': 'roughtrucker.png',
      'merch': 'merch.png',
      'bartender': 'bartender.png',
      'pirate': 'pirate.png',
      'rich': 'rich.png',
      'purple': 'purple.png',
      'cyan': 'cyan.png',
      'brown': 'brown.png',
      'rat': 'rat.png',
      'mech': 'mech.png',
      'chair': 'chair.png',
      'foreman': 'foreman.png',
      'clerk': 'clerk.png'
    };
    
    return characterImages[characterName] || 'unknown.png';
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleNext = () => {
    if (currentStep < dialogueSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCurrentText('');
    setCurrentSpeaker('');
    setCharacters({});
    setIsPlaying(false);
  };

  const renderCharacter = (character: Character) => {
    if (!character.visible) return null;
    
    const positionClass = {
      left: 'left-8',
      right: 'right-8',
      center: 'left-1/2 transform -translate-x-1/2'
    }[character.position];

    return (
      <div
        key={character.name}
        className={`absolute bottom-20 ${positionClass} transition-all duration-500`}
      >
        <div className="relative">
          <img
            src={getCampaignCharacterImage(character.image)}
            alt={character.name}
            className="w-32 h-48 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden w-32 h-48 bg-gray-600 rounded flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs">
            {character.name}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gt-primary rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gt-secondary p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-6 h-6 text-gt-accent" />
            <div>
              <h2 className="text-xl font-bold text-white">Anteprima Dialoghi</h2>
              <p className="text-sm text-gray-300">
                Step {currentStep + 1} di {dialogueSteps.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="p-2 text-gray-400 hover:text-white hover:bg-gt-primary rounded"
              title="Reset"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 text-gray-400 hover:text-white hover:bg-gt-primary rounded"
              title="Next Step"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            {isPlaying ? (
              <button
                onClick={handlePause}
                className="p-2 text-gray-400 hover:text-white hover:bg-gt-primary rounded"
                title="Pause"
              >
                <Pause className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handlePlay}
                className="p-2 text-gray-400 hover:text-white hover:bg-gt-primary rounded"
                title="Play"
              >
                <Play className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gt-primary rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dialogue Scene */}
        <div className="relative h-96 bg-gradient-to-b from-blue-900/20 to-purple-900/20 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gray-900/80"></div>
          
          {/* Characters */}
          {Object.values(characters).map(renderCharacter)}
          
          {/* No dialogue yet */}
          {!currentText && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MessageSquare className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg">Premi Play per iniziare l'anteprima</p>
                <p className="text-sm">
                  Trovati {dialogueSteps.length} step di dialogo nello script
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dialogue Text Box */}
        {currentText && (
          <div className="bg-gt-secondary/90 p-4 m-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gt-accent/20 rounded-full flex items-center justify-center">
                  <span className="text-gt-accent font-bold text-sm">
                    {currentSpeaker.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gt-accent text-sm">
                    {currentSpeaker}
                  </span>
                </div>
                <p className="text-white">{currentText}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Step Info */}
        <div className="p-4 bg-gt-primary/50 text-center">
          {currentStep < dialogueSteps.length && (
            <div className="text-sm text-gray-300">
              <span className="font-medium">Step corrente: </span>
              {dialogueSteps[currentStep]?.type.toUpperCase()}
              {dialogueSteps[currentStep]?.character && (
                <span> - {dialogueSteps[currentStep].character}</span>
              )}
            </div>
          )}
          
          {currentStep >= dialogueSteps.length && (
            <div className="text-center">
              <h3 className="text-lg font-medium text-white mb-2">Fine Anteprima</h3>
              <p className="text-gray-400">Tutti gli step di dialogo sono stati eseguiti</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
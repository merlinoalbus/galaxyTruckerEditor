import { useState, useEffect, useMemo } from 'react';
import { CharacterState } from '../blocks/index';

interface Character {
  name: string;
  images: string[];
  displayName: string;
}

// Funzione helper per calcolare lo stato dei personaggi fino a un blocco specifico
export const calculateCharacterStatesUpToBlock = (
  blocks: any[], 
  characters: Character[], 
  stopAtBlockId: string
): Map<string, CharacterState> => {
  const states = new Map<string, CharacterState>();
  
  // Initialize with base images - tutti NOT SHOWN inizialmente
  characters.forEach(char => {
    states.set(char.name, {
      baseImage: char.images[0],
      currentImage: char.images[0],
      isShown: false
    });
  });

  // Process blocks IN ORDER fino al blocco target (ESCLUSO)
  const processBlocks = (blockList: any[]): boolean => {
    for (const block of blockList) {
      // Se abbiamo raggiunto il blocco target, fermati PRIMA di processarlo
      if (block.id === stopAtBlockId) {
        return true; // Stop found
      }

      const charName = block.command?.parameters?.character;
      
      if (block.command?.type === 'show_character' && charName) {
        const state = states.get(charName);
        if (state) {
          states.set(charName, {
            ...state,
            isShown: true
          });
        }
      } else if (block.command?.type === 'change_character' && charName) {
        const newImage = block.command?.parameters?.image;
        const state = states.get(charName);
        if (state && newImage) {
          states.set(charName, {
            ...state,
            currentImage: newImage
          });
        }
      } else if (block.command?.type === 'hide_character' && charName) {
        const state = states.get(charName);
        if (state) {
          states.set(charName, {
            ...state,
            isShown: false
          });
        }
      }
      
      // Process children recursively
      if (block.children && block.children.length > 0) {
        if (processBlocks(block.children)) {
          return true; // Stop found in children
        }
      }
    }
    return false; // Stop not found
  };
  
  processBlocks(blocks);
  return states;
};

export const useCharacterStates = (blocks: any[], characters: Character[], stopAtBlockId?: string) => {
  const [characterStates, setCharacterStates] = useState<Map<string, CharacterState>>(new Map());

  useEffect(() => {
    const states = new Map<string, CharacterState>();
    
    // Initialize with base images - tutti NOT SHOWN inizialmente
    characters.forEach(char => {
      states.set(char.name, {
        baseImage: char.images[0],
        currentImage: char.images[0],
        isShown: false
      });
    });

    let shouldStop = false;

    // Process blocks IN ORDER to track character flow - STOP al blocco corrente
    const processBlocks = (blockList: any[]) => {
      for (const block of blockList) {
        // Se abbiamo raggiunto il blocco target, fermati PRIMA di processarlo
        if (stopAtBlockId && block.id === stopAtBlockId) {
          shouldStop = true;
          return;
        }

        const charName = block.command?.parameters?.character;
        
        if (block.command?.type === 'show_character' && charName) {
          const state = states.get(charName);
          if (state) {
            states.set(charName, {
              ...state,
              isShown: true
            });
          }
        } else if (block.command?.type === 'change_character' && charName) {
          const newImage = block.command?.parameters?.image;
          const state = states.get(charName);
          if (state && newImage) {
            states.set(charName, {
              ...state,
              currentImage: newImage
            });
          }
        } else if (block.command?.type === 'hide_character' && charName) {
          const state = states.get(charName);
          if (state) {
            states.set(charName, {
              ...state,
              isShown: false
            });
          }
        }
        
        // Process children recursively
        if (block.children && block.children.length > 0) {
          processBlocks(block.children);
          if (shouldStop) return;
        }
      }
    };
    
    processBlocks(blocks);

    setCharacterStates(states);
  }, [blocks, characters, stopAtBlockId]);

  return characterStates;
};
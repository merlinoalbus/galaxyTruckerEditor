import type { IFlowBlock } from '@/types/CampaignEditor/VisualFlowEditor/blocks.types';
import type { Character } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';

export interface SimulatedImage {
  nomefile: string;
  percorso?: string;
  binary?: string;
}

export interface SimulatedCharacter {
  nomepersonaggio: string;
  lastImmagine: SimulatedImage | null;
  visible: boolean;
  posizione: 'left' | 'right' | 'top' | 'bottom' | 'lefttop' | 'leftbottom' | 'righttop' | 'rightbottom';
}

export interface SimulatedScene {
  personaggi: SimulatedCharacter[];
  internalScene: boolean;
}

export interface SimulatedSceneState {
  sceneStack: SimulatedScene[];
  isInDialogScene: boolean;
  lastModifiedCharacter: string | null;
  currentScene: SimulatedScene | null;
}

/**
 * Simula l'esecuzione dei blocchi fino a un certo punto e ritorna lo stato della scena
 */
export function simulateSceneExecution(
  allBlocks: IFlowBlock[], 
  targetBlockId: string,
  charactersData?: Character[]
): SimulatedSceneState {
  const sceneStack: SimulatedScene[] = [];
  let lastModifiedCharacter: string | null = null;
  
  // Helper per ottenere l'immagine base di un personaggio
  const getCharacterBaseImage = (characterName: string): SimulatedImage | null => {
    if (!charactersData) return null;
    
    const char = charactersData.find(c => c.nomepersonaggio === characterName);
    if (!char) return null;
    
    // Prima prova con immaginebase
    if (char.immaginebase) {
      return {
        nomefile: char.immaginebase.nomefile || '',
        percorso: char.immaginebase.percorso,
        binary: char.immaginebase.binary
      };
    }
    
    // Altrimenti usa la prima immagine della lista
    if (char.listaimmagini && char.listaimmagini.length > 0) {
      const firstImage = char.listaimmagini[0];
      return {
        nomefile: firstImage.nomefile || '',
        percorso: firstImage.percorso,
        binary: firstImage.binary
      };
    }
    
    return null;
  };
  
  const processBlocksUntilTarget = (blocks: IFlowBlock[]): boolean => {
    for (const block of blocks) {
      // Se abbiamo raggiunto il target, fermati PRIMA di processarlo
      if (block.id === targetBlockId) {
        return true;
      }
      
      // Processa il blocco corrente
      if (block.type === 'SHOWDLGSCENE') {
        // Quando apriamo una nuova scena, partiamo SEMPRE con una scena vuota
        // La scena precedente rimane congelata nello stack ma non influenza quella nuova
        sceneStack.push({
          personaggi: [], // Sempre vuota, ogni scena è isolata
          internalScene: block.parameters?.internalScene === true || block.parameters?.internalScene === 'true'
        });
        // In una nuova scena vuota non c'è nessun personaggio modificato
        lastModifiedCharacter = null;
      } else if (block.type === 'HIDEDLGSCENE') {
        if (sceneStack.length > 0) {
          // Quando chiudiamo una scena, torniamo alla scena precedente
          // Il lastModifiedCharacter deve essere aggiornato in base alla scena che torna attiva
          sceneStack.pop();
          
          // Se c'è ancora una scena attiva, trova l'ultimo personaggio modificato visibile in quella scena
          if (sceneStack.length > 0) {
            const currentScene = sceneStack[sceneStack.length - 1];
            const lastVisible = currentScene.personaggi.find(p => p.visible);
            lastModifiedCharacter = lastVisible ? lastVisible.nomepersonaggio : null;
          } else {
            lastModifiedCharacter = null;
          }
        }
      } else if (block.type === 'SHOWCHAR' && block.parameters?.character) {
        if (sceneStack.length > 0) {
          const currentScene = sceneStack[sceneStack.length - 1];
          const position = block.parameters.position || 'left';
          
          // Trova se c'è già un personaggio visibile nella stessa posizione
          const charInSamePosition = currentScene.personaggi.find(
            p => p.posizione === position && p.visible
          );
          
          // Se c'è un personaggio nella stessa posizione, nascondilo
          if (charInSamePosition) {
            charInSamePosition.visible = false;
          }
          
          // Trova se il personaggio da mostrare esiste già nella scena
          const existingCharIndex = currentScene.personaggi.findIndex(
            p => p.nomepersonaggio === block.parameters!.character
          );
          
          // Determina l'immagine da usare
          let imageToUse: SimulatedImage | null = null;
          if (existingCharIndex >= 0) {
            // Se il personaggio esiste già, usa la sua lastImmagine
            imageToUse = currentScene.personaggi[existingCharIndex].lastImmagine;
          } else {
            // Altrimenti usa l'immagine base
            imageToUse = getCharacterBaseImage(block.parameters.character);
          }
          
          const newChar: SimulatedCharacter = {
            nomepersonaggio: block.parameters.character,
            lastImmagine: imageToUse,
            visible: true,
            posizione: position
          };
          
          if (existingCharIndex >= 0) {
            // Aggiorna il personaggio esistente
            currentScene.personaggi[existingCharIndex] = newChar;
          } else {
            // Aggiungi il nuovo personaggio
            currentScene.personaggi.push(newChar);
          }
          
          lastModifiedCharacter = block.parameters.character;
        }
      } else if (block.type === 'HIDECHAR' && block.parameters?.character) {
        if (sceneStack.length > 0) {
          const currentScene = sceneStack[sceneStack.length - 1];
          const charIndex = currentScene.personaggi.findIndex(
            p => p.nomepersonaggio === block.parameters!.character
          );
          if (charIndex >= 0) {
            // Nascondi il personaggio
            currentScene.personaggi[charIndex].visible = false;
            
            // Trova il primo personaggio ancora visibile e impostalo come lastModifiedCharacter
            const firstVisible = currentScene.personaggi.find(p => p.visible);
            lastModifiedCharacter = firstVisible ? firstVisible.nomepersonaggio : null;
          }
        }
      } else if (block.type === 'CHANGECHAR' && block.parameters?.character && block.parameters?.image) {
        if (sceneStack.length > 0) {
          const currentScene = sceneStack[sceneStack.length - 1];
          const charIndex = currentScene.personaggi.findIndex(
            p => p.nomepersonaggio === block.parameters!.character && p.visible
          );
          if (charIndex >= 0) {
            // Trova l'immagine selezionata dai dati del personaggio
            if (charactersData) {
              const charData = charactersData.find(c => c.nomepersonaggio === block.parameters!.character);
              if (charData && charData.listaimmagini) {
                const selectedImage = charData.listaimmagini.find(img => 
                  img.percorso === block.parameters!.image ||
                  img.nomefile === block.parameters!.image // fallback per compatibilità
                );
                
                if (selectedImage) {
                  // Aggiorna la lastImmagine del personaggio
                  currentScene.personaggi[charIndex].lastImmagine = {
                    nomefile: selectedImage.nomefile || '',
                    percorso: selectedImage.percorso,
                    binary: selectedImage.binary
                  };
                  
                  // Imposta questo personaggio come lastModifiedCharacter
                  lastModifiedCharacter = block.parameters.character;
                }
              }
            }
          }
        }
      } else if (block.type === 'SAYCHAR' && block.parameters?.character) {
        if (sceneStack.length > 0) {
          const currentScene = sceneStack[sceneStack.length - 1];
          
          // Trova se il personaggio è già presente nella scena
          const existingCharIndex = currentScene.personaggi.findIndex(
            p => p.nomepersonaggio === block.parameters!.character
          );
          
          if (existingCharIndex >= 0) {
            // Se il personaggio esiste già, rendilo visibile
            currentScene.personaggi[existingCharIndex].visible = true;
          } else {
            // Se il personaggio non esiste, aggiungilo alla scena a sinistra (comportamento default)
            const imageToUse = getCharacterBaseImage(block.parameters.character);
            
            const newChar: SimulatedCharacter = {
              nomepersonaggio: block.parameters.character,
              lastImmagine: imageToUse,
              visible: true,
              posizione: 'left' // SAYCHAR mette sempre il personaggio a sinistra per default
            };
            
            // Nascondi eventuali personaggi nella stessa posizione
            const charInSamePosition = currentScene.personaggi.find(
              p => p.posizione === 'left' && p.visible
            );
            if (charInSamePosition) {
              charInSamePosition.visible = false;
            }
            
            currentScene.personaggi.push(newChar);
          }
          
          // Imposta come ultimo personaggio modificato
          lastModifiedCharacter = block.parameters.character;
        }
      }
      
      // Ricorsione per blocchi annidati
      if (block.type === 'IF') {
        if (block.thenBlocks && processBlocksUntilTarget(block.thenBlocks)) return true;
        if (block.elseBlocks && processBlocksUntilTarget(block.elseBlocks)) return true;
      } else if (block.type === 'MENU' && block.children) {
        if (processBlocksUntilTarget(block.children)) return true;
      } else if (block.type === 'OPT' && block.children) {
        if (processBlocksUntilTarget(block.children)) return true;
      } else if ((block as any).children) {
        if (processBlocksUntilTarget((block as any).children)) return true;
      }
    }
    return false;
  };
  
  // Processa i blocchi fino al target
  processBlocksUntilTarget(allBlocks);
  
  return {
    sceneStack,
    isInDialogScene: sceneStack.length > 0,
    lastModifiedCharacter,
    currentScene: sceneStack.length > 0 ? sceneStack[sceneStack.length - 1] : null
  };
}

/**
 * Ottiene i personaggi visibili nella scena corrente
 */
export function getVisibleCharactersInScene(state: SimulatedSceneState): SimulatedCharacter[] {
  if (!state.currentScene) return [];
  return state.currentScene.personaggi.filter(p => p.visible);
}

/**
 * Ottiene l'ultimo personaggio modificato se è visibile
 */
export function getLastModifiedVisibleCharacter(state: SimulatedSceneState): SimulatedCharacter | null {
  if (!state.lastModifiedCharacter || !state.currentScene) return null;
  
  const char = state.currentScene.personaggi.find(
    p => p.nomepersonaggio === state.lastModifiedCharacter && p.visible
  );
  
  return char || null;
}
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
          
          if (existingCharIndex >= 0) {
            // Se il personaggio esiste già, aggiorna visible e posizione
            // MA mantieni la lastImmagine esistente (potrebbe essere stata modificata da CHANGECHAR)
            currentScene.personaggi[existingCharIndex].visible = true;
            currentScene.personaggi[existingCharIndex].posizione = position;
          } else {
            // Se non esiste, crea con immagine base
            const baseImage = getCharacterBaseImage(block.parameters.character);
            currentScene.personaggi.push({
              nomepersonaggio: block.parameters.character,
              lastImmagine: baseImage,
              visible: true,
              posizione: position
            });
          }
          
          lastModifiedCharacter = block.parameters.character;
        }
      } else if (block.type === 'HIDECHAR' && block.parameters?.character) {
        if (sceneStack.length > 0) {
          const currentScene = sceneStack[sceneStack.length - 1];
          let charIndex = currentScene.personaggi.findIndex(
            p => p.nomepersonaggio === block.parameters!.character
          );
          
          // Se il personaggio non esiste in scena, lo aggiungiamo con visible: false
          if (charIndex < 0) {
            const baseImage = getCharacterBaseImage(block.parameters.character);
            currentScene.personaggi.push({
              nomepersonaggio: block.parameters.character,
              lastImmagine: baseImage,
              visible: false,
              posizione: 'left'
            });
            charIndex = currentScene.personaggi.length - 1;
          }
          
          // Nascondi il personaggio
          currentScene.personaggi[charIndex].visible = false;
          
          // Trova un altro personaggio visibile in scena e impostalo come lastModifiedCharacter
          // Se non ci sono personaggi visibili, imposta null
          const otherVisible = currentScene.personaggi.find(p => p.visible && p.nomepersonaggio !== block.parameters!.character);
          lastModifiedCharacter = otherVisible ? otherVisible.nomepersonaggio : null;
        }
      } else if (block.type === 'CHANGECHAR' && block.parameters?.character && block.parameters?.image) {
        if (sceneStack.length > 0) {
          const currentScene = sceneStack[sceneStack.length - 1];
          // Cerca il personaggio in scena (anche se non visibile)
          let charIndex = currentScene.personaggi.findIndex(
            p => p.nomepersonaggio === block.parameters!.character
          );
          // Se non esiste ancora in scena, crealo come non visibile con posizione di default
          if (charIndex < 0) {
            const baseImage = getCharacterBaseImage(block.parameters.character);
            currentScene.personaggi.push({
              nomepersonaggio: block.parameters.character,
              lastImmagine: baseImage, // Usa immagine base inizialmente
              visible: false,
              posizione: 'left'
            });
            charIndex = currentScene.personaggi.length - 1;
          }
          // Trova l'immagine selezionata dai dati del personaggio, se disponibile
          let newImage: SimulatedImage | null = null;
          if (charactersData) {
            const charData = charactersData.find(c => c.nomepersonaggio === block.parameters!.character);
            if (charData && charData.listaimmagini) {
              const selectedImage = charData.listaimmagini.find(img => 
                img.percorso === block.parameters!.image ||
                img.nomefile === block.parameters!.image // fallback per compatibilità
              );
              if (selectedImage) {
                newImage = {
                  nomefile: selectedImage.nomefile || '',
                  percorso: selectedImage.percorso,
                  binary: selectedImage.binary
                };
              }
            }
          }
          // Se non trovata nei dati, crea un riferimento di fallback usando percorso/nome
          if (!newImage) {
            const path = String(block.parameters.image);
            const fileName = path.split('/').pop() || path;
            newImage = { nomefile: fileName, percorso: path };
          }
          // Aggiorna lastImmagine anche se il personaggio non è visibile
          currentScene.personaggi[charIndex].lastImmagine = newImage;
          // Aggiorna lastModifiedCharacter
          lastModifiedCharacter = block.parameters.character;
        }
      } else if (block.type === 'SAYCHAR' && block.parameters?.character) {
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
          
          // Trova se il personaggio è già presente nella scena
          const existingCharIndex = currentScene.personaggi.findIndex(
            p => p.nomepersonaggio === block.parameters!.character
          );
          
          if (existingCharIndex >= 0) {
            // Se il personaggio esiste già, rendilo visibile e aggiorna posizione
            currentScene.personaggi[existingCharIndex].visible = true;
            currentScene.personaggi[existingCharIndex].posizione = position;
          } else {
            // Se il personaggio non esiste, aggiungilo alla scena
            const baseImage = getCharacterBaseImage(block.parameters.character);
            currentScene.personaggi.push({
              nomepersonaggio: block.parameters.character,
              lastImmagine: baseImage,
              visible: true,
              posizione: position
            });
          }
          
          // Imposta come ultimo personaggio modificato
          lastModifiedCharacter = block.parameters.character;
        }
      } else if (block.type === 'ASKCHAR' && block.parameters?.character) {
        // Comportamento analogo a SAYCHAR: assicura presenza/visibilità del personaggio e aggiorna lastModified
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
          
          const existingCharIndex = currentScene.personaggi.findIndex(
            p => p.nomepersonaggio === block.parameters!.character
          );
          
          if (existingCharIndex >= 0) {
            currentScene.personaggi[existingCharIndex].visible = true;
            currentScene.personaggi[existingCharIndex].posizione = position;
          } else {
            const baseImage = getCharacterBaseImage(block.parameters.character);
            currentScene.personaggi.push({
              nomepersonaggio: block.parameters.character,
              lastImmagine: baseImage,
              visible: true,
              posizione: position
            });
          }
          lastModifiedCharacter = block.parameters.character;
        }
      } else if (block.type === 'FOCUSCHAR' && block.parameters?.character) {
        // Porta il personaggio selezionato in focus: mantieni visibile, aggiorna lastModified e opzionalmente porta in primo piano la posizione corrente
        if (sceneStack.length > 0) {
          const currentScene = sceneStack[sceneStack.length - 1];
          const charIndex = currentScene.personaggi.findIndex(p => p.nomepersonaggio === block.parameters!.character);
          if (charIndex >= 0) {
            currentScene.personaggi[charIndex].visible = true;
            // Mantieni la posizione esistente. Se non esiste, aggiungi a sinistra con immagine base
          } else {
            const imageToUse = getCharacterBaseImage(block.parameters.character);
            currentScene.personaggi.push({
              nomepersonaggio: block.parameters.character,
              lastImmagine: imageToUse,
              visible: true,
              posizione: 'left'
            });
          }
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

/**
 * Ottiene l'ultimo personaggio modificato (anche se non visibile)
 */
export function getLastModifiedCharacter(state: SimulatedSceneState): SimulatedCharacter | null {
  if (!state.lastModifiedCharacter || !state.currentScene) return null;
  
  const char = state.currentScene.personaggi.find(
    p => p.nomepersonaggio === state.lastModifiedCharacter
  );
  
  return char || null;
}

/**
 * Simula l'esecuzione fino al blocco PRECEDENTE e ritorna lo stato
 * Utile per ottenere lo stato "prima" di un blocco per mostrare le transizioni
 * 
 * NOTA: Questa è una implementazione semplificata che funziona solo per blocchi al livello root
 * Per una implementazione completa, serve refactoring per passare l'indice del blocco
 */
export function simulateSceneBeforeBlock(
  allBlocks: IFlowBlock[], 
  targetBlockId: string,
  charactersData?: Character[]
): SimulatedSceneState {
  // Strategia alternativa: cerchiamo il blocco per content matching se l'ID non funziona
  let targetIndex = -1;
  
  // Prima prova con ID esatto
  for (let i = 0; i < allBlocks.length; i++) {
    if (allBlocks[i].id === targetBlockId) {
      targetIndex = i;
      break;
    }
  }
  
  // Se il primo metodo fallisce, è probabile che il targetBlockId sia diverso 
  // dall'ID reale nell'array allBlocks. In questo caso, per ora ritorniamo 
  // uno stato "sicuro" che non rompa l'interfaccia.
  if (targetIndex < 0) {
    // Fallback: ritorna stato vuoto per evitare errori
    return {
      sceneStack: [],
      isInDialogScene: false,
      lastModifiedCharacter: null,
      currentScene: null
    };
  }
  
  // Se è il primo blocco, ritorna stato vuoto
  if (targetIndex === 0) {
    return {
      sceneStack: [],
      isInDialogScene: false,
      lastModifiedCharacter: null,
      currentScene: null
    };
  }
  
  // Simula tutti i blocchi fino a quello precedente al target
  const blocksBefore = allBlocks.slice(0, targetIndex);
  return simulateSceneExecution(blocksBefore, 'dummy-never-found', charactersData);
}
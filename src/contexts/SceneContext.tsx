import React, { createContext, useContext, useCallback, useReducer, ReactNode } from 'react';

interface Character {
  nomepersonaggio: string;
  lastImmagine: string;
  visible: boolean;
  posizione: 'left' | 'right' | 'center';
}

interface Scene {
  personaggi: Character[];
  internalScene: boolean;
}

interface SceneState {
  sceneStack: Scene[];
  isInDialogScene: boolean;
}

type SceneAction = 
  | { type: 'SHOW_DIALOG_SCENE'; payload: { internalScene?: boolean } }
  | { type: 'HIDE_DIALOG_SCENE' }
  | { type: 'ADD_CHARACTER'; payload: { character: Character } }
  | { type: 'UPDATE_CHARACTER'; payload: { nomepersonaggio: string; updates: Partial<Character> } }
  | { type: 'REMOVE_CHARACTER'; payload: { nomepersonaggio: string } }
  | { type: 'CLEAR_SCENES' };

interface SceneContextType {
  state: SceneState;
  showDialogScene: (internalScene?: boolean) => void;
  hideDialogScene: () => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (nomepersonaggio: string, updates: Partial<Character>) => void;
  removeCharacter: (nomepersonaggio: string) => void;
  clearScenes: () => void;
  getCurrentScene: () => Scene | null;
  isInDialogScene: boolean;
  isValidForDialogCommands: (blockType: string) => boolean;
}

const initialState: SceneState = {
  sceneStack: [],
  isInDialogScene: false
};

function sceneReducer(state: SceneState, action: SceneAction): SceneState {
  switch (action.type) {
    case 'SHOW_DIALOG_SCENE': {
      const newScene: Scene = {
        personaggi: [],
        internalScene: action.payload.internalScene || false
      };
      
      const newState = {
        ...state,
        sceneStack: [...state.sceneStack, newScene],
        isInDialogScene: true
      };
      
      return newState;
    }
    
    case 'HIDE_DIALOG_SCENE': {
      if (state.sceneStack.length === 0) {
        return state;
      }
      
      const newStack = state.sceneStack.slice(0, -1);
      const newState = {
        ...state,
        sceneStack: newStack,
        isInDialogScene: newStack.length > 0
      };
      
      return newState;
    }
    
    case 'ADD_CHARACTER': {
      if (state.sceneStack.length === 0) {
        return state;
      }
      
      const currentScene = state.sceneStack[state.sceneStack.length - 1];
      const existingCharacterIndex = currentScene.personaggi.findIndex(
        p => p.nomepersonaggio === action.payload.character.nomepersonaggio
      );
      
      if (existingCharacterIndex >= 0) {
        // Aggiorna personaggio esistente
        const updatedPersonaggi = [...currentScene.personaggi];
        updatedPersonaggi[existingCharacterIndex] = action.payload.character;
        
        const updatedScene = {
          ...currentScene,
          personaggi: updatedPersonaggi
        };
        
        const newStack = [...state.sceneStack];
        newStack[newStack.length - 1] = updatedScene;
        
        const newState = {
          ...state,
          sceneStack: newStack
        };
        
        return newState;
      } else {
        // Aggiungi nuovo personaggio
        const updatedScene = {
          ...currentScene,
          personaggi: [...currentScene.personaggi, action.payload.character]
        };
        
        const newStack = [...state.sceneStack];
        newStack[newStack.length - 1] = updatedScene;
        
        const newState = {
          ...state,
          sceneStack: newStack
        };
        
        return newState;
      }
    }
    
    case 'UPDATE_CHARACTER': {
      if (state.sceneStack.length === 0) {
        return state;
      }
      
      const currentScene = state.sceneStack[state.sceneStack.length - 1];
      const characterIndex = currentScene.personaggi.findIndex(
        p => p.nomepersonaggio === action.payload.nomepersonaggio
      );
      
      if (characterIndex === -1) {
        return state;
      }
      
      const updatedPersonaggi = [...currentScene.personaggi];
      updatedPersonaggi[characterIndex] = {
        ...updatedPersonaggi[characterIndex],
        ...action.payload.updates
      };
      
      const updatedScene = {
        ...currentScene,
        personaggi: updatedPersonaggi
      };
      
      const newStack = [...state.sceneStack];
      newStack[newStack.length - 1] = updatedScene;
      
      return {
        ...state,
        sceneStack: newStack
      };
    }
    
    case 'REMOVE_CHARACTER': {
      if (state.sceneStack.length === 0) {
        return state;
      }
      
      const currentScene = state.sceneStack[state.sceneStack.length - 1];
      const updatedPersonaggi = currentScene.personaggi.filter(
        p => p.nomepersonaggio !== action.payload.nomepersonaggio
      );
      
      const updatedScene = {
        ...currentScene,
        personaggi: updatedPersonaggi
      };
      
      const newStack = [...state.sceneStack];
      newStack[newStack.length - 1] = updatedScene;
      
      return {
        ...state,
        sceneStack: newStack
      };
    }
    
    case 'CLEAR_SCENES': {
      const newState = initialState;
      return newState;
    }
    
    default:
      return state;
  }
}

const SceneContext = createContext<SceneContextType | undefined>(undefined);

export const useScene = (): SceneContextType => {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within a SceneProvider');
  }
  return context;
};

interface SceneProviderProps {
  children: ReactNode;
}

export const SceneProvider: React.FC<SceneProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(sceneReducer, initialState);

  const showDialogScene = useCallback((internalScene?: boolean) => {
    dispatch({ type: 'SHOW_DIALOG_SCENE', payload: { internalScene } });
  }, []);

  const hideDialogScene = useCallback(() => {
    dispatch({ type: 'HIDE_DIALOG_SCENE' });
  }, []);

  const addCharacter = useCallback((character: Character) => {
    dispatch({ type: 'ADD_CHARACTER', payload: { character } });
  }, []);

  const updateCharacter = useCallback((nomepersonaggio: string, updates: Partial<Character>) => {
    dispatch({ type: 'UPDATE_CHARACTER', payload: { nomepersonaggio, updates } });
  }, []);

  const removeCharacter = useCallback((nomepersonaggio: string) => {
    dispatch({ type: 'REMOVE_CHARACTER', payload: { nomepersonaggio } });
  }, []);

  const clearScenes = useCallback(() => {
    dispatch({ type: 'CLEAR_SCENES' });
  }, []);

  const getCurrentScene = useCallback((): Scene | null => {
    if (state.sceneStack.length === 0) {
      return null;
    }
    return state.sceneStack[state.sceneStack.length - 1];
  }, [state.sceneStack]);

  // Validazione per comandi che richiedono dialog scene attiva
  const isValidForDialogCommands = useCallback((blockType: string) => {
    const dialogCommands = ['SAY', 'ASK', 'SHOWCHAR', 'HIDECHAR', 'CHANGECHAR', 'SAYCHAR', 'ASKCHAR', 'FOCUSCHAR'];
    
    if (blockType === 'HIDEDLGSCENE') {
      // HIDEDLGSCENE valido solo se c'è una scena attiva
      return state.isInDialogScene;
    }
    
    if (dialogCommands.includes(blockType)) {
      // Altri comandi dialogo validi solo se c'è una scena attiva
      return state.isInDialogScene;
    }
    
    // Altri comandi sempre validi
    return true;
  }, [state.isInDialogScene]);

  const value: SceneContextType = {
    state,
    showDialogScene,
    hideDialogScene,
    addCharacter,
    updateCharacter,
    removeCharacter,
    clearScenes,
    getCurrentScene,
    isInDialogScene: state.isInDialogScene,
    isValidForDialogCommands
  };

  return (
    <SceneContext.Provider value={value}>
      {children}
    </SceneContext.Provider>
  );
};

export default SceneContext;
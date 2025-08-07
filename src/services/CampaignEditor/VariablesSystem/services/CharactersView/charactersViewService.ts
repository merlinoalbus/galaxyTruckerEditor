import { Character } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';

class CharactersViewService {
  // Per ora questo service non ha metodi perché la logica è gestita dal backend
  // Ma lo creiamo per rispettare la struttura mirror richiesta dall'architettura
  
  processCharacterData(character: Character): Character {
    // Potrebbe essere usato in futuro per processare dati dei personaggi
    return character;
  }
}

export const charactersViewService = new CharactersViewService();
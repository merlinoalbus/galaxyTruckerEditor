import { Character } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';

export interface CharactersViewProps {
  characters: Character[];
  onNavigateToScript?: (scriptName: string, characterName: string) => void;
}

export interface CharacterImage {
  name: string;
  url: string;
}

export interface CharactersViewState {
  selectedCharacter: Character | null;
  selectedImage: string | null;
}
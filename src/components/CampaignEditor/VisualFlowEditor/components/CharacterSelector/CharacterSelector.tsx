import React, { useState, useMemo, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import { useTranslation } from '@/locales';
import { Character } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { useScene } from '@/contexts/SceneContext';
import type { SimulatedSceneState } from '@/utils/CampaignEditor/VisualFlowEditor/sceneSimulation';

interface CharacterSelectorProps {
  value: string;
  onChange: (character: string) => void;
  mode: 'show' | 'hide';
  className?: string;
  characters?: Character[];  // Opzionale, se passato usa questi invece di caricarli
  simulatedSceneState?: SimulatedSceneState | null;  // Stato simulato della scena
  forceColumns?: number;  // Forza un numero specifico di colonne
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  value,
  onChange,
  mode,
  className = '',
  characters: propsCharacters,
  simulatedSceneState,
  forceColumns
}) => {
  const { t } = useTranslation();
  const { getCurrentScene } = useScene();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Usa sempre i personaggi passati come props
  const characters = propsCharacters || [];
  
  // Costruisci la mappa delle immagini dai personaggi
  const characterImages = useMemo(() => {
    const images: Record<string, string> = {};
    for (const char of characters) {
      if (char.immaginebase?.binary) {
        images[char.nomepersonaggio] = `data:image/png;base64,${char.immaginebase.binary}`;
      } else if (char.listaimmagini?.[0]?.binary) {
        images[char.nomepersonaggio] = `data:image/png;base64,${char.listaimmagini[0].binary}`;
      }
    }
    return images;
  }, [characters]);
  
  // Filtra i personaggi in base al mode e alla scena simulata
  const availableCharacters = useMemo(() => {
    // Usa lo stato simulato se disponibile, altrimenti usa il context
    const scenePersonaggi: any[] = simulatedSceneState?.currentScene?.personaggi || getCurrentScene()?.personaggi || [];
    
    if (scenePersonaggi.length === 0) {
      return mode === 'show' ? characters : [];
    }
    
    if (mode === 'show') {
      // Mostra personaggi non in scena o con visible=false
      return characters.filter(char => {
        const inScene = scenePersonaggi.find(
          p => p.nomepersonaggio === char.nomepersonaggio
        );
        return !inScene || !inScene.visible;
      });
    } else {
      // mode === 'hide': mostra solo personaggi visibili nella scena
      return characters.filter(char => {
        const inScene = scenePersonaggi.find(
          p => p.nomepersonaggio === char.nomepersonaggio && p.visible
        );
        return !!inScene;
      });
    }
  }, [characters, mode, simulatedSceneState, getCurrentScene]);
  
  // Filtra per ricerca
  const filteredCharacters = useMemo(() => {
    if (!searchTerm) return availableCharacters;
    
    return availableCharacters.filter(char =>
      char.nomepersonaggio.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableCharacters, searchTerm]);
  
  return (
    <div className={`${className} h-full flex flex-col`}>
      {/* Search compatta */}
      <div className="mb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('visualFlowEditor.blocks.characterSelector.search')}
            className="w-full pl-7 pr-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white placeholder-gray-500"
            style={{ height: '28px' }}
          />
        </div>
      </div>
      
      {/* Character grid con immagini */}
      <div className="overflow-y-auto bg-slate-800 border border-slate-600 rounded p-1 flex-1" style={{ minHeight: 0 }}>
        {filteredCharacters.length === 0 ? (
          <div className="text-center text-gray-500 text-xs py-2">
            {mode === 'show'
              ? t('visualFlowEditor.blocks.characterSelector.noAvailable')
              : t('visualFlowEditor.blocks.characterSelector.noVisible')}
          </div>
        ) : (
          <div 
            className={`grid gap-1 ${!forceColumns ? (mode === 'hide' ? 'grid-cols-10' : 'grid-cols-7') : ''}`}
            style={forceColumns ? { gridTemplateColumns: `repeat(${forceColumns}, minmax(0, 1fr))` } : {}}
          >
            {/* Opzione "Nessuno" per deselezionare */}
            {mode === 'show' && (
              <div
                onClick={() => onChange('')}
                className={`
                  relative cursor-pointer transition-all rounded p-1 flex flex-col items-center
                  ${value === '' ? 'ring-1 ring-purple-500 bg-slate-700' : 'hover:bg-slate-700'}
                `}
                title="Nessuno"
              >
                <div className="w-full aspect-square mb-0.5 overflow-hidden rounded transform scale-90">
                  <div className="w-full h-full rounded bg-slate-800 border border-slate-600 flex items-center justify-center">
                    <span className="text-[16px] text-gray-400">∅</span>
                  </div>
                </div>
                <div className="text-[9px] text-gray-300 text-center truncate w-full leading-tight">
                  Nessuno
                </div>
                {value === '' && (
                  <div className="absolute top-0.5 right-0.5">
                    <Check className="w-2.5 h-2.5 text-purple-400" />
                  </div>
                )}
              </div>
            )}
            {filteredCharacters.map((char) => {
              const imageUrl = characterImages[char.nomepersonaggio];
              const isSelected = value === char.nomepersonaggio;
              
              return (
                <div
                  key={char.nomepersonaggio}
                  onClick={() => onChange(char.nomepersonaggio)}
                  className={`
                    relative cursor-pointer transition-all rounded p-1 flex flex-col items-center
                    ${isSelected ? 'ring-1 ring-purple-500 bg-slate-700' : 'hover:bg-slate-700'}
                  `}
                  title={char.nomepersonaggio}
                >
                  {/* Character image - quadrata con object-position per taglio dall'alto */}
                  <div className="w-full aspect-square mb-0.5 overflow-hidden rounded transform scale-90">
                    {imageUrl ? (
                      <img 
                        src={imageUrl}
                        alt={char.nomepersonaggio}
                        className="w-full h-full object-cover object-top border border-slate-600"
                        style={{ objectPosition: 'center top' }}
                      />
                    ) : (
                      <div className="w-full h-full rounded bg-slate-700 border border-slate-600 flex items-center justify-center">
                        <span className="text-[10px] text-gray-500">?</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Character name */}
                  <div className="text-[9px] text-gray-300 text-center truncate w-full leading-tight">
                    {char.nomepersonaggio}
                  </div>
                  
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-0.5 right-0.5">
                      <Check className="w-2.5 h-2.5 text-purple-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
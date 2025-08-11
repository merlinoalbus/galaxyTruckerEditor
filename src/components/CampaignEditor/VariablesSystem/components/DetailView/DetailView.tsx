import React from 'react';
import { Info } from 'lucide-react';
import { 
  ElementType, 
  Variable, 
  Semaforo, 
  Label, 
  Character, 
  GameImage, 
  Achievement 
} from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { useTranslation } from '@/locales';
import { VariableDetail } from './components/VariableDetail/VariableDetail';
import { SemaforoDetail } from './components/SemaforoDetail/SemaforoDetail';
import { LabelDetail } from './components/LabelDetail/LabelDetail';
import { CharacterDetail } from './components/CharacterDetail/CharacterDetail';
import { ImageDetail } from './components/ImageDetail/ImageDetail';
import { AchievementDetail } from './components/AchievementDetail/AchievementDetail';

interface DetailViewProps {
  type: ElementType;
  item: Variable | Semaforo | Label | Character | GameImage | Achievement | null;
  onNavigateToScript?: (scriptName: string, itemName: string) => void;
}

export const DetailView: React.FC<DetailViewProps> = ({ 
  type, 
  item,
  onNavigateToScript
}) => {
  const { t } = useTranslation();

  if (!item) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900/20 rounded-lg">
        <div className="text-center">
          <Info className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{t('detailView.selectElement')}</p>
        </div>
      </div>
    );
  }

  const renderDetail = () => {
    switch (type) {
      case 'variables':
        return <VariableDetail item={item as Variable} onNavigateToScript={onNavigateToScript} />;
      case 'semafori':
        return <SemaforoDetail item={item as Semaforo} onNavigateToScript={onNavigateToScript} />;
      case 'labels':
        return <LabelDetail item={item as Label} onNavigateToScript={onNavigateToScript} />;
      case 'characters':
        return <CharacterDetail item={item as Character} onNavigateToScript={onNavigateToScript} />;
      case 'images':
        return <ImageDetail item={item as GameImage & { scripts?: string[] }} onNavigateToScript={onNavigateToScript} />;
      case 'achievements':
        return <AchievementDetail item={item as Achievement & { achievement?: string; scripts?: string[] }} onNavigateToScript={onNavigateToScript} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-gray-900/30 rounded-lg overflow-hidden">
      {renderDetail()}
    </div>
  );
};
import React from 'react';
import { ElementType } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { VariableView } from '../VariableView/VariableView';
import { SemaforoView } from '../SemaforoView/SemaforoView';
import { LabelView } from '../LabelView/LabelView';
import { CharacterView } from '../CharacterView/CharacterView';
import { ImageView } from '../ImageView/ImageView';
import { AchievementView } from '../AchievementView/AchievementView';
import { useTranslation } from '@/locales/translations';

interface ListViewProps {
  type: ElementType;
  items: any[];
  selectedItem: any | null;
  onSelectItem: (item: any) => void;
}

export const ListView: React.FC<ListViewProps> = ({ 
  type, 
  items, 
  selectedItem,
  onSelectItem 
}) => {
  const { t } = useTranslation();
  const renderItem = (item: any, index: number) => {
    switch (type) {
      case 'variables':
        return <VariableView key={index} variable={item} isSelected={selectedItem === item} onSelect={onSelectItem} />;
      case 'semafori':
        return <SemaforoView key={index} semaforo={item} isSelected={selectedItem === item} onSelect={onSelectItem} />;
      case 'labels':
        return <LabelView key={index} label={item} isSelected={selectedItem === item} onSelect={onSelectItem} />;
      case 'characters':
        return <CharacterView key={index} character={item} isSelected={selectedItem === item} onSelect={onSelectItem} />;
      case 'images':
        return <ImageView key={index} image={item} isSelected={selectedItem === item} onSelect={onSelectItem} />;
      case 'achievements':
        return <AchievementView key={index} achievement={item} isSelected={selectedItem === item} onSelect={onSelectItem} />;
      default:
        return null;
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">{t('listView.noElementsFound')}</p>
          <p className="text-gray-500 text-sm mt-2">{t('listView.tryModifyingSearch')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto flex-1">
      {items.map((item, index) => renderItem(item, index))}
    </div>
  );
};
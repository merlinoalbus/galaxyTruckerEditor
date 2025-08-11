import React from 'react';
import { Hash, ToggleLeft, Tag, Users, Image, Trophy, FileText, Activity } from 'lucide-react';
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

type ElementItem = Variable | Semaforo | Label | Character | GameImage | Achievement;

interface CompactListViewProps {
  type: ElementType;
  items: ElementItem[];
  selectedItem: ElementItem | null;
  onSelectItem: (item: ElementItem) => void;
}

export const CompactListView: React.FC<CompactListViewProps> = ({ 
  type, 
  items, 
  selectedItem,
  onSelectItem 
}) => {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (type) {
      case 'variables':
        return Hash;
      case 'semafori':
        return ToggleLeft;
      case 'labels':
        return Tag;
      case 'characters':
        return Users;
      case 'images':
        return Image;
      case 'achievements':
        return Trophy;
      default:
        return Hash;
    }
  };

  const getItemName = (item: ElementItem) => {
    switch (type) {
      case 'variables':
        return (item as Variable).nomevariabile;
      case 'semafori':
        return (item as Semaforo).nomesemaforo;
      case 'labels':
        return (item as Label).nomelabel;
      case 'characters':
        return (item as Character).nomepersonaggio;
      case 'images':
        return (item as GameImage).nomefile;
      case 'achievements':
        return (item as Achievement).name;
      default:
        return '';
    }
  };

  const getItemUsage = (item: ElementItem) => {
    switch (type) {
      case 'variables':
        return (item as Variable).utilizzi_totali || 0;
      case 'semafori':
        return (item as Semaforo).utilizzi_totali || 0;
      case 'labels':
        return (item as Label).utilizzi_totali || 0;
      case 'characters':
        return (item as Character).utilizzi_totali || 0;
      case 'images':
        return 0; // GameImage non ha campo utilizzi
      case 'achievements':
        return (item as Achievement).utilizzi_totali || 0;
      default:
        return 0;
    }
  };

  const Icon = getIcon();

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
    <div className="flex-1 overflow-y-auto">
      {items.map((item, index) => {
        const name = getItemName(item);
        const usage = getItemUsage(item);
        const isSelected = selectedItem === item;
        
        return (
          <div
            key={index}
            onClick={() => onSelectItem(item)}
            className={`
              flex items-center justify-between px-4 py-3 cursor-pointer transition-all
              border-b border-gray-800
              ${isSelected 
                ? 'bg-blue-900/30 border-l-4 border-l-blue-500' 
                : 'hover:bg-gray-800/50'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-gray-500'}`} />
              <span className={`font-mono ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                {name}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {usage > 0 && (
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">{usage}</span>
                </div>
              )}
              {(() => {
                const hasScripts = 
                  (type === 'variables' && (item as Variable).listascriptchelausano?.length) ||
                  (type === 'semafori' && (item as Semaforo).listascriptchelousano?.length) ||
                  (type === 'labels' && (item as Label).riferimenti?.length) ||
                  (type === 'characters' && (item as Character).script_che_lo_usano?.length) ||
                  (type === 'achievements' && (item as Achievement).script_che_lo_utilizzano?.length);
                
                if (!hasScripts) return null;
                
                const scriptCount = 
                  (type === 'variables' ? (item as Variable).listascriptchelausano?.length :
                   type === 'semafori' ? (item as Semaforo).listascriptchelousano?.length :
                   type === 'labels' ? (item as Label).riferimenti?.length :
                   type === 'characters' ? (item as Character).script_che_lo_usano?.length :
                   type === 'achievements' ? (item as Achievement).script_che_lo_utilizzano?.length :
                   0) || 0;
                
                return (
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">{scriptCount}</span>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
};
import React from 'react';
import { Hash, ToggleLeft, Tag, Users, Image, Trophy, FileText, Activity } from 'lucide-react';
import { ElementType } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { useTranslation } from '@/locales/translations';

interface CompactListViewProps {
  type: ElementType;
  items: any[];
  selectedItem: any | null;
  onSelectItem: (item: any) => void;
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

  const getItemName = (item: any) => {
    switch (type) {
      case 'variables':
        return item.nomevariabile || item.name;
      case 'semafori':
        return item.nomesemaforo || item.name;
      case 'labels':
        return item.nomelabel || item.label;
      case 'characters':
        return item.nomepersonaggio || item.character;
      case 'images':
        return item.nomefile || item.image;
      case 'achievements':
        return item.achievement;
      default:
        return '';
    }
  };

  const getItemUsage = (item: any) => {
    switch (type) {
      case 'variables':
      case 'semafori':
        return item.utilizzi_totali || 0;
      case 'labels':
        return item.utilizzi || 0;
      case 'characters':
      case 'images':
      case 'achievements':
        return item.scripts?.length || 0;
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
              {((item.listascriptchelausano && item.listascriptchelausano.length > 0) || 
                (item.listascriptchelousano && item.listascriptchelousano.length > 0) ||
                (item.scripts && item.scripts.length > 0)) && (
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    {item.listascriptchelausano?.length || item.listascriptchelousano?.length || item.scripts?.length || 0}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
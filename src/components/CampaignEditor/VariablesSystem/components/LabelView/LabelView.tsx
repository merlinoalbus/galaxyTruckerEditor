import React from 'react';
import { Tag } from 'lucide-react';
import { Label } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { useTranslation } from '@/locales/translations';

interface LabelViewProps {
  label: Label;
  isSelected: boolean;
  onSelect: (label: Label) => void;
}

export const LabelView: React.FC<LabelViewProps> = ({ 
  label, 
  isSelected, 
  onSelect 
}) => {
  const { t } = useTranslation();
  return (
    <div
      className={`
        bg-gray-800 rounded-lg p-4 cursor-pointer transition-all
        ${isSelected ? 'ring-2 ring-blue-500 bg-gray-700' : 'hover:bg-gray-700'}
      `}
      onClick={() => onSelect(label)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-green-400" />
          <h3 className="text-white font-bold">{label.nomelabel}</h3>
          <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded-full">
            {t('labelView.label')}
          </span>
        </div>
        <div className="text-sm text-gray-400">
          {label.utilizzi_totali} {t('labelView.uses')}
        </div>
      </div>

      <div className="flex gap-4 text-xs">
        <div>
          <span className="text-gray-400">{t('labelView.script')}: </span>
          <span className="text-gray-300">{label.scriptancoraggio}</span>
        </div>
        {label.posizione_definizione && (
          <div>
            <span className="text-gray-400">{t('labelView.line')}: </span>
            <span className="text-gray-300">{label.posizione_definizione.linea}</span>
          </div>
        )}
      </div>

      {label.riferimenti && label.riferimenti.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-1">{t('labelView.references')}:</div>
          <div className="space-y-1">
            {label.riferimenti.slice(0, 3).map((ref, index) => (
              <div key={index} className="text-xs">
                <span className="text-gray-500">L{ref.linea}: </span>
                <span className="text-gray-300 font-mono">{ref.comando}</span>
              </div>
            ))}
            {label.riferimenti.length > 3 && (
              <span className="text-xs text-gray-400">
                +{label.riferimenti.length - 3} {t('labelView.otherReferences')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
import React from 'react';
import { Hash } from 'lucide-react';
import { Variable } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { useTranslation } from '@/locales';

interface VariableViewProps {
  variable: Variable;
  isSelected: boolean;
  onSelect: (variable: Variable) => void;
}

export const VariableView: React.FC<VariableViewProps> = ({ 
  variable, 
  isSelected, 
  onSelect 
}) => {
  const { t } = useTranslation();
  const totalOps = Object.values(variable.operazioni).reduce((sum, val) => sum + (val || 0), 0);

  return (
    <div
      className={`
        bg-gray-800 rounded-lg p-4 cursor-pointer transition-all
        ${isSelected ? 'ring-2 ring-blue-500 bg-gray-700' : 'hover:bg-gray-700'}
      `}
      onClick={() => onSelect(variable)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-bold">{variable.nomevariabile}</h3>
          <span className="text-xs px-2 py-1 bg-cyan-900/30 text-cyan-400 rounded-full">
            {t('variableView.numericVariable')}
          </span>
        </div>
        <div className="text-sm text-gray-400">
          {variable.utilizzi_totali} {t('variableView.uses')}
        </div>
      </div>

      {variable.valori_utilizzati && variable.valori_utilizzati.length > 0 && (
        <div className="mb-2">
          <span className="text-xs text-gray-400">{t('variableView.values')}: </span>
          <span className="text-xs text-gray-300">
            {variable.valori_utilizzati.slice(0, 5).join(', ')}
            {variable.valori_utilizzati.length > 5 && '...'}
          </span>
        </div>
      )}

      <div className="flex gap-4 text-xs">
        {Object.entries(variable.operazioni).map(([op, count]) => count && count > 0 && (
          <div key={op} className="flex items-center gap-1">
            <span className="text-gray-400">{op}:</span>
            <span className="text-gray-300">{count}</span>
          </div>
        ))}
      </div>

      {variable.listascriptchelausano.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-1">{t('common.usedIn')}</div>
          <div className="flex flex-wrap gap-1">
            {variable.listascriptchelausano.slice(0, 3).map(script => (
              <span key={script} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
                {script}
              </span>
            ))}
            {variable.listascriptchelausano.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-400">
                +{variable.listascriptchelausano.length - 3} {t('common.others')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
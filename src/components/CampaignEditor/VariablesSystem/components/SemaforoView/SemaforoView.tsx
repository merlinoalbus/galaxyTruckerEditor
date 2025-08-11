import React from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { Semaforo } from '@/types/CampaignEditor/VariablesSystem/VariablesSystem.types';
import { useTranslation } from '@/locales';

interface SemaforoViewProps {
  semaforo: Semaforo;
  isSelected: boolean;
  onSelect: (semaforo: Semaforo) => void;
}

export const SemaforoView: React.FC<SemaforoViewProps> = ({ 
  semaforo, 
  isSelected, 
  onSelect 
}) => {
  const { t } = useTranslation();
  const isSet = semaforo.stato_finale_probabile === 'SET';

  return (
    <div
      className={`
        bg-gray-800 rounded-lg p-4 cursor-pointer transition-all
        ${isSelected ? 'ring-2 ring-blue-500 bg-gray-700' : 'hover:bg-gray-700'}
      `}
      onClick={() => onSelect(semaforo)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isSet ? 
            <ToggleRight className="w-5 h-5 text-green-400" /> : 
            <ToggleLeft className="w-5 h-5 text-gray-400" />
          }
          <h3 className="text-white font-bold">{semaforo.nomesemaforo}</h3>
          <span className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded-full">
            {t('semaforoView.semaphore')}
          </span>
        </div>
        <div className="text-sm text-gray-400">
          {semaforo.utilizzi_totali} {t('semaforoView.uses')}
        </div>
      </div>

      <div className="flex gap-4 text-xs mb-2">
        {Object.entries(semaforo.operazioni).map(([op, count]) => count && count > 0 && (
          <div key={op} className="flex items-center gap-1">
            <span className="text-gray-400">{op}:</span>
            <span className="text-gray-300">{count}</span>
          </div>
        ))}
      </div>

      {semaforo.stato_finale_probabile && (
        <div className="text-xs">
          <span className="text-gray-400">{t('semaforoView.finalState')}: </span>
          <span className={isSet ? 'text-green-400' : 'text-gray-400'}>
            {semaforo.stato_finale_probabile}
          </span>
        </div>
      )}

      {semaforo.listascriptchelousano.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-1">{t('common.usedIn')}</div>
          <div className="flex flex-wrap gap-1">
            {semaforo.listascriptchelousano.slice(0, 3).map(script => (
              <span key={script} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
                {script}
              </span>
            ))}
            {semaforo.listascriptchelousano.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-400">
                +{semaforo.listascriptchelousano.length - 3} {t('common.others')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
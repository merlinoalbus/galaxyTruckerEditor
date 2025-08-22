import React from 'react';
import { SelectWithModal } from '../../SelectWithModal/SelectWithModal';
import { useTranslation } from '@/locales';

interface IfBlockParametersProps {
  block: any;
  onUpdate: (updates: any) => void;
  sessionData?: any;
}

export const IfBlockParameters: React.FC<IfBlockParametersProps> = ({ block, onUpdate, sessionData }) => {
  const { t } = useTranslation();
  const ifType = block.ifType || 'IF';
  
  switch (ifType) {
    case 'IF':
    case 'IFNOT':
      return (
        <SelectWithModal
          type="semaphore"
          value={block.variabile || ''}
          onChange={(value) => onUpdate({ variabile: value })}
          placeholder={t('visualFlowEditor.if.selectSemaphore')}
          availableItems={sessionData?.semaphores || []}
          onAddItem={sessionData?.addSemaphore}
          className="flex-1"
        />
      );
    
    case 'IF_IS':
    case 'IF_MAX':
    case 'IF_MIN':
      return (
        <div className="flex gap-2">
          <SelectWithModal
            type="variable"
            value={block.variabile || ''}
            onChange={(value) => onUpdate({ variabile: value })}
            placeholder={t('visualFlowEditor.if.selectVariable')}
            availableItems={sessionData?.variables || []}
            onAddItem={sessionData?.addVariable}
            className="flex-1"
          />
          <input
            type="text"
            className="flex-1 bg-slate-800/50 text-white px-2 py-1 rounded text-xs border border-slate-700 focus:border-blue-600 focus:outline-none"
            placeholder={t('visualFlowEditor.if.value')}
            value={block.valore || ''}
            onChange={(e) => onUpdate({ valore: e.target.value })}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    
    case 'IF_PROB':
      return (
        <input
          type="number"
          className="bg-slate-800/50 text-white px-2 py-1 rounded text-xs border border-slate-700 focus:border-blue-600 focus:outline-none"
          placeholder={t('visualFlowEditor.if.percentage')}
          min="0"
          max="100"
          value={block.valore || ''}
          onChange={(e) => onUpdate({ valore: parseInt(e.target.value) })}
          onClick={(e) => e.stopPropagation()}
        />
      );
    
    case 'IF_HAS_CREDITS':
      return (
        <input
          type="number"
          className="bg-slate-800/50 text-white px-2 py-1 rounded text-xs border border-slate-700 focus:border-blue-600 focus:outline-none"
          placeholder={t('visualFlowEditor.if.credits')}
          value={block.valore || ''}
          onChange={(e) => onUpdate({ valore: parseInt(e.target.value) })}
          onClick={(e) => e.stopPropagation()}
        />
      );
    
    case 'IFMISSIONRESULTIS':
      return (
        <div className="flex gap-2">
          <SelectWithModal
            type="mission"
            value={block.variabile || ''}
            onChange={(value) => onUpdate({ variabile: value })}
            placeholder={t('visualFlowEditor.if.selectMission')}
            availableItems={sessionData?.missions || []}
            onAddItem={sessionData?.addMission}
            className="flex-1"
          />
          <input
            type="text"
            className="flex-1 bg-slate-800/50 text-white px-2 py-1 rounded text-xs border border-slate-700 focus:border-blue-600 focus:outline-none"
            placeholder={t('visualFlowEditor.if.result')}
            value={block.valore || ''}
            onChange={(e) => onUpdate({ valore: e.target.value })}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    
    case 'IFMISSIONRESULTMIN':
      return (
        <div className="flex gap-2">
          <SelectWithModal
            type="mission"
            value={block.variabile || ''}
            onChange={(value) => onUpdate({ variabile: value })}
            placeholder={t('visualFlowEditor.if.selectMission')}
            availableItems={sessionData?.missions || []}
            onAddItem={sessionData?.addMission}
            className="flex-1"
          />
          <input
            type="number"
            className="flex-1 bg-slate-800/50 text-white px-2 py-1 rounded text-xs border border-slate-700 focus:border-blue-600 focus:outline-none"
            placeholder={t('visualFlowEditor.if.minResult')}
            value={block.valore || ''}
            onChange={(e) => onUpdate({ valore: parseInt(e.target.value) })}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    
  case 'IF_ORDER':
  case 'IF_POSITION_ORDER':
      const orderValues = Array.isArray(block.valore) ? block.valore : [];
      return (
        <div className="mt-1">
          <span className="text-xs text-gray-400">{t('visualFlowEditor.if.orderPositions')}</span>
          <div className="flex gap-2 mt-1">
            {[0, 1, 2, 3].map(position => (
              <label key={position} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={orderValues.includes(position)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...orderValues, position]
                      : orderValues.filter((v: number) => v !== position);
                    onUpdate({ valore: newValues });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="accent-blue-600"
                />
                <span className="text-xs text-white">{position}</span>
              </label>
            ))}
          </div>
        </div>
      );
    
    case 'IF_DEBUG':
    case 'IF_FROM_CAMPAIGN':
    case 'IF_MISSION_WON':
    case 'IF_TUTORIAL_SEEN':
    case 'IF_ALL_RESIGNED':
      return null; // Nessun parametro per questi tipi
    
    default:
      return null;
  }
};
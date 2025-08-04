import React from 'react';
import { MapNode } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedString } from '@/utils/localization';
import { X } from 'lucide-react';

interface NodeInfoModalProps {
  node: MapNode | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NodeInfoModal: React.FC<NodeInfoModalProps> = ({
  node,
  isOpen,
  onClose
}) => {
  const { currentLanguage } = useLanguage();

  if (!isOpen || !node) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gt-primary border border-gt-accent rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-white">
            {getLocalizedString(node.localizedCaptions, currentLanguage, node.name)}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-1">Nome Tecnico</h3>
            <p className="text-white font-mono">
              {node.name}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-1">Descrizione</h3>
            <p className="text-gray-300 text-sm">
              {getLocalizedString(node.localizedDescriptions, currentLanguage, 'Nessuna descrizione disponibile')}
            </p>
          </div>

          {node.buttons && node.buttons.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Pulsanti Interattivi</h3>
              <div className="space-y-2">
                {node.buttons.map((button, index) => (
                  <div key={index} className="bg-gt-secondary rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gt-accent font-medium">
                        {getLocalizedString(button.localizedLabels, currentLanguage, button.id)}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        [{button.id}]
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Script: <span className="text-yellow-400">{button.script}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-1">Collegamenti</h3>
              <p className="text-white">
                {node.shuttles?.length || 0} rotte
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-1">Script Collegati</h3>
              <p className="text-white">
                {node.script_che_lo_usano?.length || 0} script
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
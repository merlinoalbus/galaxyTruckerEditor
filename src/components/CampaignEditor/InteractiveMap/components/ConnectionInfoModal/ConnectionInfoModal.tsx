import React from 'react';
import { MapConnection } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedString } from '@/utils/localization';
import { X } from 'lucide-react';

interface ConnectionInfoModalProps {
  connection: MapConnection | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionInfoModal: React.FC<ConnectionInfoModalProps> = ({
  connection,
  isOpen,
  onClose
}) => {
  const { currentLanguage } = useLanguage();

  if (!isOpen || !connection || !connection.missions || connection.missions.length === 0) {
    return null;
  }

  // Get first mission data (usually routes have one mission)
  const mission = connection.missions[0];
  
  const getLicenseColor = (license?: string) => {
    switch (license) {
      case 'STI': return 'text-green-400';
      case 'STII': return 'text-yellow-400';
      case 'STIII': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getMissionTypeStyle = (type?: string) => {
    return type === 'UNIQUE' ? 'text-purple-400' : 'text-blue-400';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gt-primary border border-gt-accent rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-white">
            {getLocalizedString(mission.localizedCaptions, currentLanguage, `${connection.from} → ${connection.to}`)}
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
            <h3 className="text-sm font-semibold text-gray-400 mb-1">Licenza di Volo</h3>
            <p className={`font-bold ${getLicenseColor(mission.license)}`}>
              {mission.license || 'N/A'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-1">Tipo Missione</h3>
            <p className={`font-bold ${getMissionTypeStyle(mission.missiontype)}`}>
              {mission.missiontype || 'NORMAL'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-1">Nome Rotta</h3>
            <p className="text-white">
              {mission.name}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-1">Descrizione</h3>
            <p className="text-gray-300 text-sm">
              {getLocalizedString(mission.localizedDescriptions, currentLanguage, 'Nessuna descrizione disponibile')}
            </p>
          </div>

          {mission.button && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-1">Script Associato</h3>
              <p className="text-gt-accent">
                ⭐ {mission.button.script}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
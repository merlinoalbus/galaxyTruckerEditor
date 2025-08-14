import React, { useState, useEffect, useRef } from 'react';
import { Search, Star } from 'lucide-react';
import type { MissionsListProps, MissionItem } from './MissionsList.types';
import { useTranslation } from '@/locales';
import { API_CONSTANTS } from '@/constants/VisualFlowEditor.constants';

export const MissionsList: React.FC<MissionsListProps> = ({
  showMissionsList,
  setShowMissionsList,
  loadMission,
  buttonRef
}) => {
  const { t } = useTranslation();
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<MissionItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Carica missions all'apertura
  useEffect(() => {
    if (showMissionsList && missions.length === 0) {
      fetchMissions();
    }
  }, [showMissionsList]);

  // Calcola posizione contestuale al pulsante
  useEffect(() => {
    if (showMissionsList && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const modalWidth = 384; // w-96 = 24rem = 384px
      const modalHeight = 500; // stimato
      
      let top = rect.bottom + 8;
      let left = rect.left;
      
      // Aggiusta se esce dai bordi della finestra
      if (left + modalWidth > window.innerWidth) {
        left = window.innerWidth - modalWidth - 16;
      }
      
      if (top + modalHeight > window.innerHeight) {
        top = rect.top - modalHeight - 8;
      }
      
      setPosition({ top, left });
    }
  }, [showMissionsList, buttonRef]);

  // Gestione click esterno per chiudere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) &&
          buttonRef?.current && !buttonRef.current.contains(event.target as Node)) {
        setShowMissionsList(false);
      }
    };

    if (showMissionsList) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMissionsList, setShowMissionsList, buttonRef]);

  const fetchMissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:${API_CONSTANTS.DEFAULT_PORT}/api/missions`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setMissions(result.data);
        setFilteredMissions(result.data);
      }
    } catch (error) {
      console.error('Errore nel caricamento delle missions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtra missions in base al testo di ricerca
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredMissions(missions);
    } else {
      const searchLower = searchText.toLowerCase();
      const filtered = missions.filter(mission => 
        mission.nomemission.toLowerCase().includes(searchLower) ||
        mission.nomefile.toLowerCase().includes(searchLower)
      );
      setFilteredMissions(filtered);
    }
  }, [searchText, missions]);

  if (!showMissionsList) return null;

  const positionStyle = buttonRef ? {
    position: 'fixed' as const,
    top: `${position.top}px`,
    left: `${position.left}px`,
    zIndex: 50
  } : {
    position: 'absolute' as const,
    top: '80px',
    left: '4px',
    zIndex: 50
  };

  return (
    <div 
      ref={modalRef}
      className="w-96 bg-slate-800 rounded-lg shadow-xl border border-slate-600 p-4"
      style={positionStyle}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold">{t('visualFlowEditor.missionsList.title')}</h3>
        <button
          onClick={() => setShowMissionsList(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      {/* Campo di ricerca */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('visualFlowEditor.missionsList.searchPlaceholder')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-10 pr-3 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Lista missions */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-gray-400 text-center py-4">
            {t('visualFlowEditor.missionsList.loadingMissions')}
          </div>
        ) : filteredMissions.length > 0 ? (
          filteredMissions.map(mission => (
            <div
              key={mission.nomemission}
              className="p-3 bg-slate-700 hover:bg-slate-600 rounded cursor-pointer transition-colors"
              onClick={() => {
                loadMission(mission.nomemission);
                setShowMissionsList(false);
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium flex items-center gap-2">
                    {mission.nomemission}
                    {mission.stellato && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                  </div>
                  <div className="text-xs text-gray-400">
                    {mission.nomefile} • {mission.numero_blocchi} blocchi • {mission.numero_comandi} comandi
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Lingue: {mission.languages.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-400 text-center py-4">
            Nessuna mission trovata
          </div>
        )}
      </div>
    </div>
  );
};
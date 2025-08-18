import { logger } from '@/utils/logger';
import React, { useEffect, useState } from 'react';
import { Code, Map, Zap, Tag, Users, Database, Image, Trophy } from 'lucide-react';
import { API_CONFIG, API_ENDPOINTS } from '@/config/constants';
import { useTranslation } from '@/locales';

interface ElementCounts {
  scripts: number;
  missions: number;
  semaphores: number;
  labels: number;
  characters: number;
  variables: number;
  images: number;
  achievements: number;
}

interface ElementCountersProps {
  scriptsCount?: number;
  onElementClick?: (elementType: string) => void;
}

export const ElementCounters: React.FC<ElementCountersProps> = ({ scriptsCount, onElementClick }) => {
  const { t } = useTranslation();
  const [counts, setCounts] = useState<ElementCounts>({
    scripts: scriptsCount || 0,
    missions: 0,
    semaphores: 0,
    labels: 0,
    characters: 0,
    variables: 0,
    images: 0,
    achievements: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        
        // Fetch all counts in parallel
        const [
          scriptsRes,
          missionsRes,
          semaphoresRes,
          labelsRes,
          charactersRes,
          variablesRes,
          imagesRes,
          achievementsRes
        ] = await Promise.all([
          fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS}`),
          fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.MISSIONS}`),
          fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_SEMAPHORES}`),
          fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_LABELS}`),
          fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.GAME_CHARACTERS}`),
          fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS_VARIABLES}`),
          fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.IMAGES}`),
          fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.GAME_ACHIEVEMENTS}`)
        ]);

        const [
          scriptsData,
          missionsData,
          semaphoresData,
          labelsData,
          charactersData,
          variablesData,
          imagesData,
          achievementsData
        ] = await Promise.all([
          scriptsRes.json(),
          missionsRes.json(),
          semaphoresRes.json(),
          labelsRes.json(),
          charactersRes.json(),
          variablesRes.json(),
          imagesRes.json(),
          achievementsRes.json()
        ]);

        setCounts({
          scripts: scriptsCount || scriptsData.count || 0,
          missions: missionsData.count || 0,
          semaphores: semaphoresData.count || 0,
          labels: labelsData.count || 0,
          characters: charactersData.count || 0,
          variables: variablesData.count || 0,
          images: imagesData.count || 0,
          achievements: achievementsData.count || 0
        });
      } catch (error) {
  logger.error('Error fetching element counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [scriptsCount]);

  const counters = [
    { icon: Code, label: t('elements.scripts'), count: counts.scripts, color: 'text-amber-400', bgColor: 'bg-amber-900/20', elementType: null },
    { icon: Map, label: t('elements.missions'), count: counts.missions, color: 'text-blue-400', bgColor: 'bg-blue-900/20', elementType: null },
    { icon: Zap, label: t('elements.semaphores'), count: counts.semaphores, color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', elementType: 'semafori' },
    { icon: Tag, label: t('elements.labels'), count: counts.labels, color: 'text-green-400', bgColor: 'bg-green-900/20', elementType: 'labels' },
    { icon: Users, label: t('elements.characters'), count: counts.characters, color: 'text-purple-400', bgColor: 'bg-purple-900/20', elementType: 'characters' },
    { icon: Database, label: t('elements.variables'), count: counts.variables, color: 'text-cyan-400', bgColor: 'bg-cyan-900/20', elementType: 'variables' },
    { icon: Image, label: t('elements.images'), count: counts.images, color: 'text-pink-400', bgColor: 'bg-pink-900/20', elementType: 'images' },
    { icon: Trophy, label: t('elements.achievements'), count: counts.achievements, color: 'text-orange-400', bgColor: 'bg-orange-900/20', elementType: 'achievements' }
  ];

  return (
    <div className="grid grid-cols-4 gap-3 w-full">
      {counters.map(({ icon: Icon, label, count, color, bgColor, elementType }) => (
        <div
          key={label}
          className={`${bgColor} backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 transition-all hover:border-gray-600 ${
            elementType && onElementClick ? 'cursor-pointer hover:scale-105' : ''
          }`}
          onClick={() => elementType && onElementClick && onElementClick(elementType)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-gray-300 text-sm font-medium">{label}</span>
            </div>
            <span className={`font-bold text-lg ${loading ? 'animate-pulse text-gray-500' : 'text-white'}`}>
              {loading ? '...' : count}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
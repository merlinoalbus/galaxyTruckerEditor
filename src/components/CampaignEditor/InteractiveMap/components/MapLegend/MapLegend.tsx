import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/locales/translations';

export const MapLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  
  return (
    <div className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-90 border border-gray-700 rounded-lg z-10 text-xs">
      <div 
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-800 hover:bg-opacity-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-gray-400 uppercase tracking-wider text-xs font-semibold">{t('mapLegend.title')}</span>
        {isOpen ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronUp className="w-3 h-3 text-gray-400" />}
      </div>
      {isOpen && (
        <div className="flex gap-4 p-3 pt-0">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">{t('mapLegend.flightLicenses')}</span>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-300">STI</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-gray-300">STII</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-gray-300">STIII</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">{t('mapLegend.routeTypes')}</span>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <svg width="24" height="2" className="flex-shrink-0">
                  <line x1="0" y1="1" x2="24" y2="1" stroke="#9CA3AF" strokeWidth="2" />
                </svg>
                <span className="text-gray-300">{t('mapLegend.normalMissions')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="24" height="2" className="flex-shrink-0">
                  <line x1="0" y1="1" x2="24" y2="1" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="4,4" />
                </svg>
                <span className="text-gray-300">{t('mapLegend.uniqueMissions')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="24" height="2" className="flex-shrink-0">
                  <line x1="0" y1="1" x2="24" y2="1" stroke="#6B7280" strokeWidth="2" strokeDasharray="2,8" />
                </svg>
                <span className="text-gray-300">{t('mapLegend.shuttles')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
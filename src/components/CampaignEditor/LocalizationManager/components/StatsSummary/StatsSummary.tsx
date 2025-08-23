// StatsSummary.tsx - Riassunto statistiche traduzioni
import React from 'react';
import { Globe, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

import type { LocalizationCategory } from '@/hooks/CampaignEditor/useLocalizationStrings';

interface StatsSummaryProps {
  categories: LocalizationCategory[];
  selectedCategory: LocalizationCategory | null;
  categoryStats: {
    totalKeys: number;
    translatedKeys: { [key: string]: number };
  } | null;
  supportedLanguages: string[];
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({
  categories,
  selectedCategory,
  categoryStats,
  supportedLanguages
}) => {
  // Calcola statistiche globali
  const globalStats = React.useMemo(() => {
    const totalKeys = categories.reduce((sum, cat) => sum + cat.numKeys, 0);
    
    const languageStats = supportedLanguages.reduce((stats, lang) => {
      // Per calcolare le statistiche globali dovremmo caricare tutte le categorie
      // Per ora mostriamo solo quelle della categoria selezionata
      stats[lang] = categoryStats?.translatedKeys[lang] || 0;
      return stats;
    }, {} as { [key: string]: number });

    return { totalKeys, languageStats };
  }, [categories, categoryStats, supportedLanguages]);

  const StatCard: React.FC<{
    title: string;
    value: number;
    total?: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, total, icon, color }) => {
    const percentage = total && total > 0 ? Math.round((value / total) * 100) : 0;
    
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {value}
              {total && <span className="text-sm text-gray-400">/{total}</span>}
            </div>
            {total && (
              <div className="text-sm text-gray-400">
                {percentage}%
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-400">{title}</div>
        {total && (
          <div className="mt-2 bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                percentage === 100 ? 'bg-green-500' : 
                percentage >= 75 ? 'bg-blue-500' :
                percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Statistiche globali */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Categorie Totali"
          value={categories.length}
          icon={<FileText className="w-5 h-5" />}
          color="bg-blue-600"
        />
        
        <StatCard
          title="Stringhe Totali"
          value={globalStats.totalKeys}
          icon={<Globe className="w-5 h-5" />}
          color="bg-purple-600"
        />
        
        {selectedCategory && categoryStats && (
          <>
            <StatCard
              title={`Completate (${selectedCategory.nome})`}
              value={Math.max(...supportedLanguages.map(lang => categoryStats.translatedKeys[lang] || 0))}
              total={categoryStats.totalKeys}
              icon={<CheckCircle className="w-5 h-5" />}
              color="bg-green-600"
            />
            
            <StatCard
              title={`Mancanti (${selectedCategory.nome})`}
              value={Math.min(...supportedLanguages.map(lang => 
                categoryStats.totalKeys - (categoryStats.translatedKeys[lang] || 0)
              ))}
              total={categoryStats.totalKeys}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="bg-red-600"
            />
          </>
        )}
      </div>

      {/* Dettagli per lingua (solo se categoria selezionata) */}
      {selectedCategory && categoryStats && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Progresso per lingua - {selectedCategory.nome}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {supportedLanguages.map(lang => {
              const translated = categoryStats.translatedKeys[lang] || 0;
              const percentage = Math.round((translated / categoryStats.totalKeys) * 100);
              
              return (
                <div key={lang} className="text-center">
                  <div className={`
                    w-16 h-16 mx-auto rounded-full flex items-center justify-center text-sm font-bold mb-2
                    ${percentage === 100 ? 'bg-green-600 text-white' :
                      percentage >= 75 ? 'bg-blue-600 text-white' :
                      percentage >= 50 ? 'bg-yellow-600 text-black' :
                      percentage > 0 ? 'bg-red-600 text-white' :
                      'bg-gray-700 text-gray-400'
                    }
                  `}>
                    {percentage}%
                  </div>
                  <div className="text-sm font-medium text-white">{lang}</div>
                  <div className="text-xs text-gray-400">
                    {translated}/{categoryStats.totalKeys}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
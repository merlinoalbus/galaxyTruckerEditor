import React from 'react';

import { RefreshCw, Download, Upload } from 'lucide-react';

import { useGameData } from '@/contexts/GameDataContext';
import { LanguageSelector } from './components/LanguageSelector/LanguageSelector';
import { useTranslation } from '@/locales/translations';

export function Header() {
  const { loading, error, refreshAll } = useGameData();
  const { t } = useTranslation();

  return (
    <header className="bg-gt-primary border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold font-game text-gt-accent">
            {t('header.title')}
          </h1>
          <div className="flex items-center space-x-2">
            <div className={`status-dot ${error ? 'error' : loading ? 'warning' : 'success'}`}></div>
            <span className="text-sm text-gray-400">
              {error ? t('common.error') : loading ? t('common.loading') : t('common.connected')}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <LanguageSelector />
          <button
            onClick={refreshAll}
            disabled={loading}
            className="btn-secondary flex items-center space-x-2 tooltip"
            data-tooltip={t('header.refreshTooltip')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('header.update')}</span>
          </button>
          
          <button className="btn-secondary flex items-center space-x-2 tooltip" data-tooltip={t('header.exportTooltip')}>
            <Download className="w-4 h-4" />
            <span>{t('common.export')}</span>
          </button>
          
          <button className="btn-secondary flex items-center space-x-2 tooltip" data-tooltip={t('header.importTooltip')}>
            <Upload className="w-4 h-4" />
            <span>{t('common.import')}</span>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-3 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          <strong>{t('common.error')}:</strong> {error}
        </div>
      )}
    </header>
  );
}
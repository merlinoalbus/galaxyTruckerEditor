import React, { useState } from 'react';

import { Download } from 'lucide-react';

import { useGameData } from '@/contexts/GameDataContext';
import { LanguageSelector } from '@/components/CampaignEditor/components/Header/components/LanguageSelector/LanguageSelector';
import { ExportModal, ExportConfiguration } from '@/components/CampaignEditor/components/Header/components/ExportModal';
import { useTranslation } from '@/locales';
import { useLanguage } from '@/contexts/LanguageContext';
import { API_CONFIG } from '@/config/constants';

export function Header() {
  const { loading, error } = useGameData();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (config: ExportConfiguration) => {
    setIsExporting(true);
    
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/export/languages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'export');
      }

      // Get the filename from the response headers
      const disposition = response.headers.get('content-disposition');
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'galaxy-trucker-translations.zip';

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setShowExportModal(false);
    } catch (error) {
      console.error('Errore durante l\'export:', error);
      alert('Errore durante l\'export delle traduzioni');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="bg-gt-primary border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 
            key={`title-${currentLanguage}`} 
            className="font-bold font-game galaxy-title galaxy-title-main"
          >
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
            onClick={() => setShowExportModal(true)}
            disabled={isExporting}
            className="btn-secondary flex items-center space-x-2 tooltip"
            data-tooltip="Esporta traduzioni per l'installazione nel gioco"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-3 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          <strong>{t('common.error')}:</strong> {error}
        </div>
      )}
      
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={handleExport}
        isExporting={isExporting}
      />
    </header>
  );
}
// LocalizationManager.tsx - Componente principale per la gestione delle traduzioni
import React, { useState } from 'react';
import { Globe, Save, Bot, RefreshCw, AlertCircle, CheckCircle, FileText, Map } from 'lucide-react';

import { useLocalizationStrings } from '@/hooks/CampaignEditor/useLocalizationStrings';
import { useCampaignTranslations } from '@/hooks/CampaignEditor/useCampaignTranslations';

import { CategoryList } from './components/CategoryList/CategoryList';
import { StringsEditor } from './components/StringsEditor/StringsEditor';
import { CampaignEditor } from './components/CampaignEditor/CampaignEditor';
import { StatsSummary } from './components/StatsSummary/StatsSummary';
import { AITranslationModal } from './components/AITranslationModal/AITranslationModal';

type TranslationMode = 'strings' | 'campaign';

export const LocalizationManager: React.FC = () => {
  const [showAIModal, setShowAIModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [translationMode, setTranslationMode] = useState<TranslationMode>('strings');

  const {
    categories,
    selectedCategory,
    isLoading: isLoadingStrings,
    isLoadingCategory,
    isSaving: isSavingStrings,
    isTranslating: isTranslatingStrings,
    error: stringsError,
    searchTerm: stringsSearchTerm,
    selectedLanguage: stringsSelectedLanguage,
    filteredStrings,
    categoryStats,
    setSearchTerm: setStringsSearchTerm,
    setSelectedLanguage: setStringsSelectedLanguage,
    setError: setStringsError,
    loadCategory,
    saveCategory,
    translateString,
    translateCategory,
    updateString,
    SUPPORTED_LANGUAGES
  } = useLocalizationStrings();

  const {
    currentData: campaignData,
    selectedFileType,
    isLoading: isLoadingCampaign,
    isSaving: isSavingCampaign,
    error: campaignError,
    successMessage: campaignSuccessMessage,
    searchTerm: campaignSearchTerm,
    selectedLanguage: campaignSelectedLanguage,
    filteredItems: campaignFilteredItems,
    languageStats: campaignLanguageStats,
    setFileType,
    setSearchTerm: setCampaignSearchTerm,
    setSelectedLanguage: setCampaignSelectedLanguage,
    setError: setCampaignError,
    setSuccessMessage: setCampaignSuccessMessage,
    saveCampaignFile,
    updateTranslation,
    CAMPAIGN_LANGUAGES
  } = useCampaignTranslations();

  // Gestione valori dinamici basati sulla modalità
  const isLoading = translationMode === 'strings' ? isLoadingStrings : isLoadingCampaign;
  const isSaving = translationMode === 'strings' ? isSavingStrings : isSavingCampaign;
  const error = translationMode === 'strings' ? stringsError : campaignError;
  const currentSuccessMessage = translationMode === 'strings' ? successMessage : campaignSuccessMessage;

  const handleCategorySelect = (categoryId: string) => {
    loadCategory(categoryId);
  };

  const handleSaveCategory = async () => {
    if (translationMode === 'strings' && selectedCategory) {
      const result = await saveCategory(selectedCategory.id, selectedCategory.listKeys);
      if (result.success) {
        setSuccessMessage(`Categoria ${selectedCategory.nome} salvata con successo!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } else if (translationMode === 'campaign' && campaignData) {
      const result = await saveCampaignFile(selectedFileType, campaignData.items);
      if (result.success) {
        // Il messaggio di successo è gestito dall'hook
      }
    }
  };

  const handleStringUpdate = (stringId: string, language: string, value: string) => {
    updateString(stringId, language, value);
  };

  const handleCampaignUpdate = (
    itemId: string, 
    language: string, 
    field: 'caption' | 'description', 
    value: string
  ) => {
    updateTranslation(itemId, language, field, value);
  };

  const handleAITranslateAll = () => {
    setShowAIModal(true);
  };

  const handleAITranslate = async (fromLanguage: string, toLanguage: string) => {
    if (translationMode === 'strings' && selectedCategory) {
      const result = await translateCategory(selectedCategory.id, fromLanguage, toLanguage);
      if (result.success && result.translations) {
        // Applica le traduzioni
        result.translations.forEach(translation => {
          updateString(translation.key, toLanguage, translation.translatedText);
        });
        
        setSuccessMessage(`Categoria tradotta da ${fromLanguage} a ${toLanguage}!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } else if (translationMode === 'campaign') {
      // TODO: Implementare traduzione AI per campaign
      setSuccessMessage('Traduzione AI per campaign non ancora implementata');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    
    setShowAIModal(false);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-3 text-white">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Caricamento categorie di traduzione...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Globe className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Gestione Traduzioni</h1>
            <p className="text-gray-400">
              Gestisci le traduzioni delle stringhe di localizzazione e campagne
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Selettore modalità */}
          <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setTranslationMode('strings')}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${translationMode === 'strings' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }
              `}
            >
              <FileText className="w-4 h-4" />
              <span>Stringhe</span>
            </button>
            <button
              onClick={() => setTranslationMode('campaign')}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${translationMode === 'campaign' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }
              `}
            >
              <Map className="w-4 h-4" />
              <span>Campagne</span>
            </button>
          </div>

          {((translationMode === 'strings' && selectedCategory) || 
            (translationMode === 'campaign' && campaignData)) && (
            <>
              <button
                onClick={handleAITranslateAll}
                disabled={translationMode === 'strings' ? isTranslatingStrings : false}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded-lg text-white transition-colors"
              >
                <Bot className="w-4 h-4" />
                <span>AI All</span>
              </button>
              
              <button
                onClick={handleSaveCategory}
                disabled={isSaving}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-white transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Salvando...' : 'Salva'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center space-x-2 bg-red-900/50 border border-red-700 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-200">{error}</span>
          <button
            onClick={() => {
              if (translationMode === 'strings') {
                setStringsError(null);
              } else {
                setCampaignError(null);
              }
            }}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {currentSuccessMessage && (
        <div className="flex items-center space-x-2 bg-green-900/50 border border-green-700 rounded-lg p-4">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-200">{currentSuccessMessage}</span>
          <button
            onClick={() => {
              if (translationMode === 'strings') {
                setSuccessMessage(null);
              } else {
                setCampaignSuccessMessage(null);
              }
            }}
            className="ml-auto text-green-400 hover:text-green-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Statistiche */}
      <StatsSummary 
        categories={categories}
        selectedCategory={selectedCategory}
        categoryStats={categoryStats}
        supportedLanguages={SUPPORTED_LANGUAGES}
      />

      {/* Contenuto principale */}
      <div className="flex-1 flex space-x-6 min-h-0">
        {translationMode === 'strings' ? (
          <>
            {/* Lista categorie */}
            <div className="w-80 flex-shrink-0">
              <CategoryList 
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
                isLoading={isLoadingCategory}
              />
            </div>

            {/* Editor stringhe */}
            <div className="flex-1 min-w-0">
              {selectedCategory ? (
                <StringsEditor
                  category={selectedCategory}
                  strings={filteredStrings}
                  searchTerm={stringsSearchTerm}
                  selectedLanguage={stringsSelectedLanguage}
                  supportedLanguages={SUPPORTED_LANGUAGES}
                  isLoading={isLoadingCategory}
                  isTranslating={isTranslatingStrings}
                  onSearchChange={setStringsSearchTerm}
                  onLanguageChange={setStringsSelectedLanguage}
                  onStringUpdate={handleStringUpdate}
                  onTranslateString={translateString}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-600">
                  <div className="text-center text-gray-400">
                    <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Seleziona una categoria per iniziare</p>
                    <p className="text-sm mt-2">
                      Scegli una categoria dalla lista a sinistra per modificarne le traduzioni
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Editor campagne - occupa tutta la larghezza */}
            <div className="flex-1 min-w-0">
              {campaignData ? (
                <CampaignEditor
                  data={campaignData}
                  items={campaignFilteredItems}
                  searchTerm={campaignSearchTerm}
                  selectedLanguage={campaignSelectedLanguage}
                  selectedFileType={selectedFileType}
                  supportedLanguages={CAMPAIGN_LANGUAGES}
                  languageStats={campaignLanguageStats}
                  isLoading={isLoadingCampaign}
                  onSearchChange={setCampaignSearchTerm}
                  onLanguageChange={setCampaignSelectedLanguage}
                  onFileTypeChange={setFileType}
                  onUpdate={handleCampaignUpdate}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-600">
                  <div className="text-center text-gray-400">
                    <Map className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Caricamento dati campagna...</p>
                    <p className="text-sm mt-2">
                      I dati delle missioni e nodi si stanno caricando
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal AI Translation */}
      {showAIModal && (
        <AITranslationModal
          supportedLanguages={translationMode === 'strings' ? SUPPORTED_LANGUAGES : CAMPAIGN_LANGUAGES}
          isTranslating={translationMode === 'strings' ? isTranslatingStrings : false}
          onTranslate={handleAITranslate}
          onClose={() => setShowAIModal(false)}
        />
      )}
    </div>
  );
};
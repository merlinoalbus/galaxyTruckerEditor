import { SupportedLanguage } from '@/contexts/LanguageContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Import all language modules
import * as enModules from './en';
import * as itModules from './it';
import * as csModules from './cs';
import * as deModules from './de';
import * as esModules from './es';
import * as frModules from './fr';
import * as plModules from './pl';
import * as ruModules from './ru';

export type TranslationKey = 
  // Common
  | 'common.loading'
  | 'common.error'
  | 'common.save'
  | 'common.cancel'
  | 'common.close'
  | 'common.search'
  | 'common.refresh'
  | 'common.export'
  | 'common.import'
  | 'common.connected'
  | 'common.connecting'
  | 'common.noData'
  | 'common.usedIn'
  | 'common.others'
  
  // Header
  | 'header.title'
  | 'header.saveAll'
  | 'header.update'
  | 'header.exportTooltip'
  | 'header.importTooltip'
  | 'header.refreshTooltip'
  
  // Tabs
  | 'tabs.interactiveMap'
  | 'tabs.visualFlowEditor'
  | 'tabs.variablesSystem'
  | 'tabs.overview'
  
  // Campaign Editor
  | 'campaignEditor.title'
  | 'campaignEditor.description'
  | 'campaignEditor.interactiveMapTitle'
  
  // Sidebar
  | 'sidebar.navigation'
  | 'sidebar.campaign'
  | 'sidebar.translations'
  | 'sidebar.footerTitle'
  | 'sidebar.footerSubtitle'
  
  // Overview
  | 'overview.title'
  | 'overview.description'
  | 'overview.loading'
  | 'overview.noCampaignData'
  | 'overview.loadCampaignMessage'
  | 'overview.scripts'
  | 'overview.variables'
  | 'overview.characters'
  | 'overview.missions'
  | 'overview.totalCommands'
  | 'overview.semaphores'
  | 'overview.numeric'
  | 'overview.missionsReferenced'
  | 'overview.languageDistribution'
  | 'overview.complexityAnalysis'
  | 'overview.averageCommandsPerScript'
  | 'overview.mostComplexScript'
  | 'overview.scriptConnections'
  | 'overview.campaignEntities'
  | 'overview.labels'
  | 'overview.avgPerScript'
  | 'overview.commands'
  
  // Map Controls
  | 'mapControls.title'
  | 'mapControls.zoomIn'
  | 'mapControls.zoomOut'
  | 'mapControls.centerNewbie'
  | 'mapControls.resetView'
  
  // Map Legend
  | 'mapLegend.title'
  | 'mapLegend.flightLicenses'
  | 'mapLegend.routeTypes'
  | 'mapLegend.normalMissions'
  | 'mapLegend.uniqueMissions'
  | 'mapLegend.shuttles'
  
  // Interactive Map
  | 'interactiveMap.enterFullscreen'
  | 'interactiveMap.exitFullscreen'
  
  // Element Counters
  | 'elements.scripts'
  | 'elements.missions'
  | 'elements.semaphores'
  | 'elements.labels'
  | 'elements.characters'
  | 'elements.variables'
  | 'elements.images'
  | 'elements.achievements'
  
  // Variables System
  | 'variablesSystem.title'
  | 'variablesSystem.description'
  | 'variablesSystem.searchPlaceholder'
  | 'variablesSystem.loadingData'
  | 'variablesSystem.errorLoading'
  | 'variablesSystem.retry'
  | 'variablesSystem.sortBy'
  | 'variablesSystem.name'
  | 'variablesSystem.usage'
  | 'variablesSystem.noResults'
  | 'variablesSystem.tryDifferentSearch'
  | 'variablesSystem.selectItem'
  | 'variablesSystem.usedIn'
  | 'variablesSystem.others'
  | 'variablesSystem.operations'
  | 'variablesSystem.position'
  | 'variablesSystem.objectives'
  | 'variablesSystem.hidden'
  | 'variablesSystem.repeatable'
  | 'variablesSystem.points'
  
  // Script Selector
  | 'scriptSelector.searchScripts'
  | 'scriptSelector.starScripts'
  | 'scriptSelector.otherScripts'
  | 'scriptSelector.uniqueMissions'
  | 'scriptSelector.normalMissions'
  | 'scriptSelector.noScriptsFound'
  | 'scriptSelector.noMissionsFound'
  | 'scriptSelector.noScriptsAvailable'
  | 'scriptSelector.noMissionsAvailable'
  
  // Tooltips
  | 'tooltip.interactiveButtons'
  | 'tooltip.routes'
  | 'tooltip.scripts'
  | 'tooltip.buttons'
  | 'tooltip.license'
  | 'tooltip.type'
  
  // ListView
  | 'listView.noElementsFound'
  | 'listView.tryModifyingSearch'
  
  // CharacterView
  | 'characterView.character'
  | 'characterView.uses'
  | 'characterView.availableImages'
  
  // VariableView
  | 'variableView.numericVariable'
  | 'variableView.uses'
  | 'variableView.values'
  
  // LabelView
  | 'labelView.label'
  | 'labelView.uses'
  | 'labelView.script'
  | 'labelView.line'
  | 'labelView.references'
  | 'labelView.otherReferences'
  
  // AchievementView
  | 'achievementView.objectives'
  | 'achievementView.hidden'
  | 'achievementView.repeatable'
  | 'achievementView.points'
  | 'achievementView.uses'
  | 'achievementView.before'
  | 'achievementView.after'
  | 'achievementView.preDescription'
  | 'achievementView.postDescription'
  | 'achievementView.noDescription'
  | 'achievementView.usageStatistics'
  | 'achievementView.totalUses'
  | 'achievementView.scriptsCount'
  | 'achievementView.usedInScripts'
  | 'achievementView.selectAchievement'
  
  // SemaforoView
  | 'semaforoView.semaphore'
  | 'semaforoView.uses'
  | 'semaforoView.finalState'
  
  // ImageView
  | 'imageView.modified'
  | 'imageView.depth'
  | 'imageView.size'
  | 'imageView.selectImage'
  | 'imageView.imageDetails'
  | 'imageView.searchPlaceholder'
  | 'imageView.clickToDownload'
  | 'imageView.loadingImages'
  | 'imageView.loading'
  | 'imageView.allCategories'
  | 'imageView.imagesFound'
  
  // DetailView
  | 'detailView.selectElement'
  | 'detailView.initialValue'
  | 'detailView.totalUsage'
  | 'detailView.commandsUsed'
  | 'detailView.scriptsUsing'
  | 'detailView.goToScript'
  | 'detailView.numericVariable'
  | 'detailView.semaphore'
  | 'detailView.label'
  | 'detailView.character'
  | 'detailView.image'
  | 'detailView.achievement'
  | 'detailView.labelDefinition'
  | 'detailView.labelReferences'
  | 'detailView.goToDefinition'
  | 'detailView.goToLine'
  | 'charactersView.charactersList'
  | 'charactersView.visible'
  | 'charactersView.hidden'
  | 'charactersView.visibleInGame'
  | 'charactersView.hiddenInGame'
  | 'charactersView.basicInfo'
  | 'charactersView.internalName'
  | 'charactersView.visibility'
  | 'charactersView.scriptCount'
  | 'charactersView.imageGallery'
  | 'charactersView.scriptsUsing'
  | 'charactersView.goToScript'
  | 'charactersView.selectCharacter'
  | 'charactersView.imagePreview'
  | 'charactersView.noImageSelected'
  | 'charactersView.totalUsage'
  | 'charactersView.usedInScripts'
  | 'charactersView.commands'
  
  // Visual Flow Editor
  | 'visualFlowEditor.title'
  | 'visualFlowEditor.addBlock'
  | 'visualFlowEditor.deleteBlock'
  | 'visualFlowEditor.moveUp'
  | 'visualFlowEditor.moveDown'
  | 'visualFlowEditor.duplicate'
  | 'visualFlowEditor.cut'
  | 'visualFlowEditor.copy'
  | 'visualFlowEditor.paste'
  | 'visualFlowEditor.undo'
  | 'visualFlowEditor.redo'
  | 'visualFlowEditor.search'
  | 'visualFlowEditor.searchPlaceholder'
  | 'visualFlowEditor.noResults'
  | 'visualFlowEditor.validation.error'
  | 'visualFlowEditor.validation.askAfterMenu'
  | 'visualFlowEditor.validation.menuAfterAsk'
  | 'visualFlowEditor.validation.consecutiveAsk'
  | 'visualFlowEditor.validation.buildInsideContainer'
  | 'visualFlowEditor.validation.flightInsideContainer'
  | 'visualFlowEditor.validation.invalidPosition'
  | 'visualFlowEditor.validation.missingRequired'
  | 'visualFlowEditor.dragDrop.hint'
  | 'visualFlowEditor.container.then'
  | 'visualFlowEditor.container.else'
  | 'visualFlowEditor.container.empty'
  | 'visualFlowEditor.block.command'
  | 'visualFlowEditor.block.condition'
  | 'visualFlowEditor.block.container'
  | 'visualFlowEditor.block.special'
  | 'visualFlowEditor.save'
  | 'visualFlowEditor.cancel'
  | 'visualFlowEditor.confirmDelete'
  | 'visualFlowEditor.unsavedChanges'
  | 'visualFlowEditor.loadError'
  | 'visualFlowEditor.saveSuccess'
  | 'visualFlowEditor.saveError'
  
  // Errors
  | 'error.loadingData'
  | 'error.savingData'
  | 'error.networkError'
  | 'error.unexpectedError';

type Translations = {
  [key in SupportedLanguage]: {
    [key in TranslationKey]: string;
  };
};

// Helper function to merge language modules
function mergeLanguageModules(modules: any) {
  return {
    ...modules.commonTranslations,
    ...modules.errorTranslations,
    ...modules.headerTranslations,
    ...modules.tabsTranslations,
    ...modules.overviewTranslations,
    ...modules.mapControlsTranslations,
    ...modules.mapLegendTranslations,
    ...modules.interactiveMapTranslations,
    ...modules.elementsTranslations,
    ...modules.variablesSystemTranslations,
    ...modules.scriptSelectorTranslations,
    ...modules.tooltipTranslations,
    ...modules.viewsTranslations,
    ...modules.visualFlowEditorTranslations,
  };
}

// Reconstruct translations structure for backward compatibility
export const translations: Translations = {
  EN: mergeLanguageModules(enModules),
  IT: mergeLanguageModules(itModules),
  CS: mergeLanguageModules(csModules),
  DE: mergeLanguageModules(deModules),
  ES: mergeLanguageModules(esModules),
  FR: mergeLanguageModules(frModules),
  PL: mergeLanguageModules(plModules),
  RU: mergeLanguageModules(ruModules),
} as Translations;

// Custom hook for translations - maintains exact same functionality
export function useTranslation() {
  const { currentLanguage } = useLanguage();
  
  const t = (key: TranslationKey): string => {
    return translations[currentLanguage]?.[key] || translations.EN?.[key] || key;
  };
  
  return { t };
}

// Export individual language modules for direct access if needed
export * as en from './en';
export * as it from './it';
export * as cs from './cs';
export * as de from './de';
export * as es from './es';
export * as fr from './fr';
export * as pl from './pl';
export * as ru from './ru';
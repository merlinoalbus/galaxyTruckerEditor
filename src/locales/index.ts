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
  | 'overview.maxCommandsPerScript'
  | 'overview.exportReport'
  | 'overview.importantWarnings'
  | 'overview.suggestedOptimizations'
  | 'overview.languageCoverage'
  | 'overview.coverage'
  | 'overview.criticalGaps'
  | 'overview.criticalScriptsMissing'
  | 'overview.complexityAnalysisTitle'
  | 'overview.mostComplexScripts'
  | 'overview.orphanScripts'
  | 'overview.circularDependencies'
  | 'overview.mostReferencedScripts'
  | 'overview.score'
  | 'overview.others'
  | 'overview.cycles'
  | 'overview.codeQuality'
  | 'overview.otherIssues'
  | 'overview.severity.critical'
  | 'overview.severity.high'
  | 'overview.severity.medium'
  | 'overview.severity.low'
  | 'overview.maintenanceMetrics'
  | 'overview.modularity'
  | 'overview.coupling'
  | 'overview.cohesion'
  | 'overview.technicalDebt'
  | 'overview.scriptSizeDistribution'
  | 'overview.largest'
  | 'overview.smallest'
  | 'overview.lines'
  | 'overview.size.tiny'
  | 'overview.size.small'
  | 'overview.size.medium'
  | 'overview.size.large'
  | 'overview.size.huge'
  | 'overview.refactoringRecommendations'
  | 'overview.impact'
  | 'overview.maintainability'
  | 'overview.performance'
  | 'overview.readability'
  | 'overview.effort'
  | 'overview.noRefactoringSuggestions'
  | 'overview.priority.high'
  | 'overview.priority.medium'
  | 'overview.priority.low'
  
  // Quality Analysis Service
  | 'overview.quality.oversizedScript'
  | 'overview.quality.oversizedScriptSuggestion'
  | 'overview.quality.tooManyVariables'
  | 'overview.quality.tooManyVariablesSuggestion'
  | 'overview.quality.orphanScript'
  | 'overview.quality.orphanScriptSuggestion.large'
  | 'overview.quality.orphanScriptSuggestion.small'
  | 'overview.quality.circularDependency'
  | 'overview.quality.circularDependencySuggestion'
  | 'overview.quality.monoStateSemaphore'
  | 'overview.quality.monoStateSemaphoreSuggestion'
  
  // Refactoring Service
  | 'overview.refactoring.oversizedScript'
  | 'overview.refactoring.splitActions'
  | 'overview.refactoring.smallRelatedScripts'
  | 'overview.refactoring.mergeActions'
  | 'overview.refactoring.duplicatedPattern'
  | 'overview.refactoring.extractActions'
  | 'overview.refactoring.highComplexity'
  | 'overview.refactoring.simplifyActions'
  | 'overview.refactoring.deadScript'
  | 'overview.refactoring.removeActions'
  
  // Warnings
  | 'overview.warnings.criticalIssues'
  | 'overview.warnings.hugeScripts'
  | 'overview.warnings.circularDependencies'
  | 'overview.warnings.lowCoverage'
  
  // Optimizations
  | 'overview.optimizations.improveModularity'
  | 'overview.optimizations.reduceCoupling'
  | 'overview.optimizations.improveCohesion'
  | 'overview.optimizations.reduceTechnicalDebt'
  | 'overview.optimizations.refactorHugeScripts'
  | 'overview.optimizations.mergeSmallScripts'
  
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
  
  // Image categories
  | 'imageView.category.achievements'
  | 'imageView.category.aliens'
  | 'imageView.category.arrows'
  | 'imageView.category.avatars'
  | 'imageView.category.backgrounds'
  | 'imageView.category.batteries'
  | 'imageView.category.buttons'
  | 'imageView.category.campaign'
  | 'imageView.category.cards'
  | 'imageView.category.cargo'
  | 'imageView.category.common'
  | 'imageView.category.effects'
  | 'imageView.category.engines'
  | 'imageView.category.flags'
  | 'imageView.category.flight'
  | 'imageView.category.frames'
  | 'imageView.category.icons'
  | 'imageView.category.interface'
  | 'imageView.category.manual'
  | 'imageView.category.meteors'
  | 'imageView.category.misc'
  | 'imageView.category.multiplayer'
  | 'imageView.category.particles'
  | 'imageView.category.parts'
  | 'imageView.category.planets'
  | 'imageView.category.sd'
  | 'imageView.category.shields'
  | 'imageView.category.ships'
  | 'imageView.category.stars'
  | 'imageView.category.videos'
  | 'imageView.category.weapons'
  | 'imageView.category.windows'
  
  // Image subcategories
  | 'imageView.subcategory.generic'
  | 'imageView.subcategory.image'
  | 'imageView.subcategory.sequence'
  | 'imageView.subcategory.variant'
  | 'imageView.subcategory.background'
  | 'imageView.subcategory.character'
  | 'imageView.subcategory.decoration'
  
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
    ...modules.campaignEditorTranslations,
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
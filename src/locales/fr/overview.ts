/**
 * Overview translations for French
 */

export const overviewTranslations = {
  'overview.title': 'Analyse avancée de campagne',
  'overview.description': 'Métriques détaillées et suggestions pour améliorer la qualité du code',
  'overview.exportReport': 'Exporter le rapport',
  'overview.importantWarnings': 'Avertissements importants',
  'overview.suggestedOptimizations': 'Optimisations suggérées',
  'overview.loading': 'Chargement des données de vue d\'ensemble...',
  'overview.noCampaignData': 'Aucune donnée de campagne',
  'overview.loadCampaignMessage': 'Chargez les scripts de campagne pour voir les statistiques de vue d\'ensemble',
  'overview.scripts': 'Scripts',
  'overview.variables': 'Variables',
  'overview.characters': 'Personnages',
  'overview.missions': 'Missions',
  'overview.totalCommands': 'commandes totales',
  'overview.semaphores': 'sémaphores',
  'overview.numeric': 'numérique',
  'overview.missionsReferenced': 'missions référencées',
  'overview.languageDistribution': 'Distribution des langues',
  'overview.complexityAnalysis': 'Analyse de complexité',
  'overview.averageCommandsPerScript': 'Commandes moyennes par script',
  'overview.mostComplexScript': 'Script le plus complexe',
  'overview.scriptConnections': 'Connexions de scripts',
  'overview.campaignEntities': 'Entités de campagne',
  'overview.labels': 'Étiquettes',
  'overview.avgPerScript': 'moyenne par script',
  'overview.commands': 'commandes',
  'overview.maxCommandsPerScript': 'Maximum de commandes par script',
  
  // Language Coverage Card
  'overview.languageCoverage': 'Couverture linguistique',
  'overview.coverage': 'Couverture',
  'overview.criticalGaps': 'lacunes critiques',
  'overview.criticalScriptsMissing': 'Scripts critiques manquants',
  
  // Complexity Analysis Card
  'overview.complexityAnalysisTitle': 'Analyse de Complexité',
  'overview.mostComplexScripts': 'Scripts les Plus Complexes',
  'overview.orphanScripts': 'Scripts Orphelins',
  'overview.circularDependencies': 'Dépendances Circulaires',
  'overview.mostReferencedScripts': 'Scripts les Plus Référencés',
  'overview.score': 'Score',
  'overview.others': 'autres',
  'overview.cycles': 'cycles',
  
  
  // Quality Issues Card
  'overview.codeQuality': 'Qualité du Code',
  'overview.otherIssues': 'autres problèmes',
  'overview.severity.critical': 'critique',
  'overview.severity.high': 'élevé',
  'overview.severity.medium': 'moyen',
  'overview.severity.low': 'bas',
  
  // Maintenance Metrics Card
  'overview.maintenanceMetrics': 'Métriques de Maintenance',
  'overview.modularity': 'Modularité',
  'overview.coupling': 'Couplage',
  'overview.cohesion': 'Cohésion',
  'overview.technicalDebt': 'Dette Technique',
  'overview.scriptSizeDistribution': 'Distribution des Tailles de Scripts',
  'overview.largest': 'Plus grand',
  'overview.smallest': 'Plus petit',
  'overview.lines': 'lignes',
  'overview.size.tiny': 'Minuscule',
  'overview.size.small': 'Petit',
  'overview.size.medium': 'Moyen',
  'overview.size.large': 'Grand',
  'overview.size.huge': 'Énorme',
  
  // Refactoring Recommendations Card
  'overview.refactoringRecommendations': 'Recommandations de Refactoring',
  'overview.effort': 'effort',
  'overview.impact': 'Impact :',
  'overview.maintainability': 'Maintenabilité',
  'overview.performance': 'Performance',
  'overview.readability': 'Lisibilité',
  'overview.noRefactoringSuggestions': 'Aucune suggestion de refactoring disponible',
  'overview.priority.high': 'élevée',
  'overview.priority.medium': 'moyenne',
  'overview.priority.low': 'faible',

  // Quality Analysis Service messages
  'overview.quality.oversizedScript': 'Script très volumineux: {size} commandes (seuil: {threshold})',
  'overview.quality.oversizedScriptSuggestion': 'Considérez diviser en scripts plus petits',
  'overview.quality.tooManyVariables': 'Script avec beaucoup de variables: {count} (seuil: {threshold})',
  'overview.quality.tooManyVariablesSuggestion': 'Groupez les variables liées ou utilisez des structures de données',
  'overview.quality.orphanScript': 'Script jamais appelé avec {size} commandes',
  'overview.quality.orphanScriptSuggestion.large': 'Grand script inutilisé - vérifiez s\'il est nécessaire',
  'overview.quality.orphanScriptSuggestion.small': 'Vérifiez si le script est encore nécessaire',
  'overview.quality.circularDependency': 'Dépendance circulaire: {cycle}',
  'overview.quality.circularDependencySuggestion': 'Refactorisez pour éliminer le cycle de dépendances',
  'overview.quality.monoStateSemaphore': "Sémaphore '{name}' utilisé seulement comme SET ou RESET",
  'overview.quality.monoStateSemaphoreSuggestion': 'Considérez utiliser une variable booléenne',

  // Refactoring Service messages
  'overview.refactoring.oversizedScript': 'Script avec {commandCount} commandes (limite recommandée: {limit})',
  'overview.refactoring.splitActions': ['Diviser en sous-scripts logiques', 'Extraire des fonctions réutilisables', 'Séparer la logique d\'initialisation'],
  'overview.refactoring.smallRelatedScripts': 'Scripts liés avec moins de {threshold} commandes chacun',
  'overview.refactoring.mergeActions': ['Fusionner {scripts} en un seul script', 'Conserver la séparation logique avec des étiquettes'],
  'overview.refactoring.duplicatedPattern': 'Motif de {length} commandes répété {occurrences} fois',
  'overview.refactoring.extractActions': ['Extraire vers un sous-script commun', 'Créer une fonction réutilisable', 'Utiliser des paramètres pour les variations'],
  'overview.refactoring.highComplexity': 'Complexité cyclomatique élevée ({complexity})',
  'overview.refactoring.simplifyActions': ['Réduire l\'imbrication des conditions', 'Extraire la logique vers des sous-scripts', 'Simplifier les chaînes IF/ELSE'],
  'overview.refactoring.deadScript': 'Script jamais appelé et n\'est pas un point d\'entrée',
  'overview.refactoring.removeActions': ['Vérifiez s\'il est vraiment inutilisé', 'Supprimez si confirmé', 'Documentez si conservé pour compatibilité'],

  // Warnings
  'overview.warnings.criticalIssues': '{count} problèmes critiques détectés',
  'overview.warnings.hugeScripts': '{count} scripts avec plus de 500 commandes',
  'overview.warnings.circularDependencies': '{count} dépendances circulaires détectées',
  'overview.warnings.lowCoverage': '{count} langues avec couverture < 50%',

  // Optimizations
  'overview.optimizations.improveModularity': 'Améliorer la modularité en divisant les grands scripts',
  'overview.optimizations.reduceCoupling': 'Réduire le couplage entre scripts',
  'overview.optimizations.improveCohesion': 'Améliorer la cohésion en regroupant les fonctionnalités liées',
  'overview.optimizations.reduceTechnicalDebt': 'Réduire la dette technique avec un refactoring ciblé',
  'overview.optimizations.refactorHugeScripts': 'Refactoriser les plus gros scripts (>500 lignes)',
  'overview.optimizations.mergeSmallScripts': 'Envisager de fusionner de très petits scripts liés',
} as const;
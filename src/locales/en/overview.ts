/**
 * Overview translations for English
 */

export const overviewTranslations = {
  'overview.title': 'Advanced Campaign Analysis',
  'overview.description': 'Detailed metrics and suggestions to improve code quality',
  'overview.exportReport': 'Export Report',
  'overview.importantWarnings': 'Important Warnings',
  'overview.suggestedOptimizations': 'Suggested Optimizations',
  'overview.loading': 'Loading overview data...',
  'overview.noCampaignData': 'No Campaign Data',
  'overview.loadCampaignMessage': 'Load campaign scripts to see overview statistics',
  'overview.scripts': 'Scripts',
  'overview.variables': 'Variables',
  'overview.characters': 'Characters',
  'overview.missions': 'Missions',
  'overview.totalCommands': 'total commands',
  'overview.semaphores': 'semaphores',
  'overview.numeric': 'numeric',
  'overview.missionsReferenced': 'missions referenced',
  'overview.languageDistribution': 'Language Distribution',
  'overview.complexityAnalysis': 'Complexity Analysis',
  'overview.averageCommandsPerScript': 'Average Commands per Script',
  'overview.mostComplexScript': 'Most Complex Script',
  'overview.scriptConnections': 'Script Connections',
  'overview.campaignEntities': 'Campaign Entities',
  'overview.labels': 'Labels',
  'overview.avgPerScript': 'avg per script',
  'overview.commands': 'commands',
  'overview.maxCommandsPerScript': 'Maximum commands per Script',
  
  // Language Coverage Card
  'overview.languageCoverage': 'Language Coverage',
  'overview.coverage': 'Coverage',
  'overview.criticalGaps': 'critical gaps',
  'overview.criticalScriptsMissing': 'Critical scripts missing',
  
  // Complexity Analysis Card
  'overview.complexityAnalysisTitle': 'Complexity Analysis',
  'overview.mostComplexScripts': 'Most Complex Scripts',
  'overview.orphanScripts': 'Orphan Scripts',
  'overview.circularDependencies': 'Circular Dependencies',
  'overview.mostReferencedScripts': 'Most Referenced Scripts',
  'overview.score': 'Score',
  'overview.others': 'others',
  'overview.cycles': 'cycles',
  
  // Quality Issues Card
  'overview.codeQuality': 'Code Quality',
  'overview.otherIssues': 'other issues',
  'overview.severity.critical': 'critical',
  'overview.severity.high': 'high',
  'overview.severity.medium': 'medium',
  'overview.severity.low': 'low',
  
  // Maintenance Metrics Card
  'overview.maintenanceMetrics': 'Maintainability Metrics',
  'overview.modularity': 'Modularity',
  'overview.coupling': 'Coupling',
  'overview.cohesion': 'Cohesion',
  'overview.technicalDebt': 'Technical Debt',
  'overview.scriptSizeDistribution': 'Script Size Distribution',
  'overview.largest': 'Largest',
  'overview.smallest': 'Smallest',
  'overview.lines': 'lines',
  'overview.size.tiny': 'Tiny',
  'overview.size.small': 'Small',
  'overview.size.medium': 'Medium',
  'overview.size.large': 'Large',
  'overview.size.huge': 'Huge',
  
  // Refactoring Recommendations Card
  'overview.refactoringRecommendations': 'Refactoring Suggestions',
  'overview.impact': 'Impact',
  'overview.maintainability': 'Maintainability',
  'overview.performance': 'Performance',
  'overview.readability': 'Readability',
  'overview.effort': 'effort',
  'overview.noRefactoringSuggestions': 'No refactoring suggestions available',
  'overview.priority.high': 'high',
  'overview.priority.medium': 'medium',
  'overview.priority.low': 'low',
  
  // Quality Analysis Service messages
  'overview.quality.oversizedScript': 'Very large script: {size} commands (threshold: {threshold})',
  'overview.quality.oversizedScriptSuggestion': 'Consider splitting into smaller scripts',
  'overview.quality.tooManyVariables': 'Script with many variables: {count} (threshold: {threshold})',
  'overview.quality.tooManyVariablesSuggestion': 'Group related variables or use data structures',
  'overview.quality.orphanScript': 'Never called script with {size} commands',
  'overview.quality.orphanScriptSuggestion.large': 'Large unused script - verify if necessary',
  'overview.quality.orphanScriptSuggestion.small': 'Verify if the script is still necessary',
  'overview.quality.circularDependency': 'Circular dependency: {cycle}',
  'overview.quality.circularDependencySuggestion': 'Refactor to eliminate dependency cycle',
  'overview.quality.monoStateSemaphore': "Semaphore '{name}' used only as SET or RESET",
  'overview.quality.monoStateSemaphoreSuggestion': 'Consider using a boolean variable',
  
  // Refactoring Service messages
  'overview.refactoring.oversizedScript': 'Script with {commandCount} commands (recommended limit: {limit})',
  'overview.refactoring.splitActions': ['Split into logical sub-scripts', 'Extract reusable functions', 'Separate initialization logic'],
  'overview.refactoring.smallRelatedScripts': 'Related scripts with less than {threshold} commands each',
  'overview.refactoring.mergeActions': ['Merge {scripts} into a single script', 'Keep logical separation with labels'],
  'overview.refactoring.duplicatedPattern': 'Pattern of {length} commands repeated {occurrences} times',
  'overview.refactoring.extractActions': ['Extract into common sub-script', 'Create reusable function', 'Use parameters for variations'],
  'overview.refactoring.highComplexity': 'High cyclomatic complexity ({complexity})',
  'overview.refactoring.simplifyActions': ['Reduce condition nesting', 'Extract logic into sub-scripts', 'Simplify IF/ELSE chains'],
  'overview.refactoring.deadScript': 'Never called script and not an entry point',
  'overview.refactoring.removeActions': ['Verify if truly unused', 'Remove if confirmed', 'Document if kept for compatibility'],
  
  // Warnings
  'overview.warnings.criticalIssues': '{count} critical issues detected',
  'overview.warnings.hugeScripts': '{count} scripts with more than 500 commands',
  'overview.warnings.circularDependencies': '{count} circular dependencies detected',
  'overview.warnings.lowCoverage': '{count} languages with coverage < 50%',
  
  // Optimizations
  'overview.optimizations.improveModularity': 'Improve modularity by splitting large scripts',
  'overview.optimizations.reduceCoupling': 'Reduce coupling between scripts',
  'overview.optimizations.improveCohesion': 'Improve cohesion by grouping related functionality',
  'overview.optimizations.reduceTechnicalDebt': 'Reduce technical debt with targeted refactoring',
  'overview.optimizations.refactorHugeScripts': 'Refactor the largest scripts (>500 lines)',
  'overview.optimizations.mergeSmallScripts': 'Consider merging very small related scripts',
} as const;
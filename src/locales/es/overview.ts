/**
 * Overview translations for Spanish
 */

export const overviewTranslations = {
  'overview.title': 'Análisis avanzado de campaña',
  'overview.description': 'Métricas detalladas y sugerencias para mejorar la calidad del código',
  'overview.exportReport': 'Exportar informe',
  'overview.importantWarnings': 'Advertencias importantes',
  'overview.suggestedOptimizations': 'Optimizaciones sugeridas',
  'overview.loading': 'Cargando datos de vista general...',
  'overview.noCampaignData': 'Sin datos de campaña',
  'overview.loadCampaignMessage': 'Carga los scripts de campaña para ver las estadísticas de vista general',
  'overview.scripts': 'Scripts',
  'overview.variables': 'Variables',
  'overview.characters': 'Personajes',
  'overview.missions': 'Misiones',
  'overview.totalCommands': 'comandos totales',
  'overview.semaphores': 'semáforos',
  'overview.numeric': 'numérico',
  'overview.missionsReferenced': 'misiones referenciadas',
  'overview.languageDistribution': 'Distribución de idiomas',
  'overview.complexityAnalysis': 'Análisis de complejidad',
  'overview.averageCommandsPerScript': 'Comandos promedio por script',
  'overview.mostComplexScript': 'Script más complejo',
  'overview.scriptConnections': 'Conexiones de scripts',
  'overview.campaignEntities': 'Entidades de campaña',
  'overview.labels': 'Etiquetas',
  'overview.avgPerScript': 'promedio por script',
  'overview.commands': 'comandos',
  'overview.maxCommandsPerScript': 'Máximo comandos por script',
  
  // Language Coverage Card
  'overview.languageCoverage': 'Cobertura de idiomas',
  'overview.coverage': 'Cobertura',
  'overview.criticalGaps': 'brechas críticas',
  'overview.criticalScriptsMissing': 'Scripts críticos faltantes',
  
  // Complexity Analysis Card
  'overview.complexityAnalysisTitle': 'Análisis de Complejidad',
  'overview.mostComplexScripts': 'Scripts Más Complejos',
  'overview.orphanScripts': 'Scripts Huérfanos',
  'overview.circularDependencies': 'Dependencias Circulares',
  'overview.mostReferencedScripts': 'Scripts Más Referenciados',
  'overview.score': 'Puntuación',
  'overview.others': 'otros',
  'overview.cycles': 'ciclos',
  
  
  // Quality Issues Card
  'overview.codeQuality': 'Calidad del Código',
  'overview.otherIssues': 'otros problemas',
  'overview.severity.critical': 'crítico',
  'overview.severity.high': 'alto',
  'overview.severity.medium': 'medio',
  'overview.severity.low': 'bajo',
  
  // Maintenance Metrics Card
  'overview.maintenanceMetrics': 'Métricas de Mantenimiento',
  'overview.modularity': 'Modularidad',
  'overview.coupling': 'Acoplamiento',
  'overview.cohesion': 'Cohesión',
  'overview.technicalDebt': 'Deuda Técnica',
  'overview.scriptSizeDistribution': 'Distribución de Tamaños de Scripts',
  'overview.largest': 'Más grande',
  'overview.smallest': 'Más pequeño',
  'overview.lines': 'líneas',
  'overview.size.tiny': 'Diminuto',
  'overview.size.small': 'Pequeño',
  'overview.size.medium': 'Mediano',
  'overview.size.large': 'Grande',
  'overview.size.huge': 'Enorme',
  
  // Refactoring Recommendations Card
  'overview.refactoringRecommendations': 'Recomendaciones de Refactoring',
  'overview.effort': 'esfuerzo',
  'overview.impact': 'Impacto:',
  'overview.maintainability': 'Mantenibilidad',
  'overview.performance': 'Rendimiento',
  'overview.readability': 'Legibilidad',
  'overview.noRefactoringSuggestions': 'No hay sugerencias de refactoring disponibles',
  'overview.priority.high': 'alta',
  'overview.priority.medium': 'media',
  'overview.priority.low': 'baja',

  // Quality Analysis Service messages
  'overview.quality.oversizedScript': 'Script muy grande: {size} comandos (umbral: {threshold})',
  'overview.quality.oversizedScriptSuggestion': 'Considera dividir en scripts más pequeños',
  'overview.quality.tooManyVariables': 'Script con muchas variables: {count} (umbral: {threshold})',
  'overview.quality.tooManyVariablesSuggestion': 'Agrupa variables relacionadas o usa estructuras de datos',
  'overview.quality.orphanScript': 'Script nunca llamado con {size} comandos',
  'overview.quality.orphanScriptSuggestion.large': 'Script grande no utilizado - verifica si es necesario',
  'overview.quality.orphanScriptSuggestion.small': 'Verifica si el script sigue siendo necesario',
  'overview.quality.circularDependency': 'Dependencia circular: {cycle}',
  'overview.quality.circularDependencySuggestion': 'Refactoriza para eliminar el ciclo de dependencias',
  'overview.quality.monoStateSemaphore': "Semáforo '{name}' usado solo como SET o RESET",
  'overview.quality.monoStateSemaphoreSuggestion': 'Considera usar una variable booleana',

  // Refactoring Service messages
  'overview.refactoring.oversizedScript': 'Script con {commandCount} comandos (límite recomendado: {limit})',
  'overview.refactoring.splitActions': ['Dividir en sub-scripts lógicos', 'Extraer funciones reutilizables', 'Separar lógica de inicialización'],
  'overview.refactoring.smallRelatedScripts': 'Scripts relacionados con menos de {threshold} comandos cada uno',
  'overview.refactoring.mergeActions': ['Fusionar {scripts} en un solo script', 'Mantener separación lógica con etiquetas'],
  'overview.refactoring.duplicatedPattern': 'Patrón de {length} comandos repetido {occurrences} veces',
  'overview.refactoring.extractActions': ['Extraer a sub-script común', 'Crear función reutilizable', 'Usar parámetros para variaciones'],
  'overview.refactoring.highComplexity': 'Complejidad ciclomática alta ({complexity})',
  'overview.refactoring.simplifyActions': ['Reducir anidación de condiciones', 'Extraer lógica a sub-scripts', 'Simplificar cadenas de IF/ELSE'],
  'overview.refactoring.deadScript': 'Script nunca llamado y no es punto de entrada',
  'overview.refactoring.removeActions': ['Verificar si realmente no se usa', 'Eliminar si se confirma', 'Documentar si se mantiene para compatibilidad'],

  // Warnings
  'overview.warnings.criticalIssues': '{count} problemas críticos detectados',
  'overview.warnings.hugeScripts': '{count} scripts con más de 500 comandos',
  'overview.warnings.circularDependencies': '{count} dependencias circulares detectadas',
  'overview.warnings.lowCoverage': '{count} idiomas con cobertura < 50%',

  // Optimizations
  'overview.optimizations.improveModularity': 'Mejorar la modularidad dividiendo scripts grandes',
  'overview.optimizations.reduceCoupling': 'Reducir el acoplamiento entre scripts',
  'overview.optimizations.improveCohesion': 'Mejorar la cohesión agrupando funcionalidad relacionada',
  'overview.optimizations.reduceTechnicalDebt': 'Reducir la deuda técnica con refactoring dirigido',
  'overview.optimizations.refactorHugeScripts': 'Refactorizar los scripts más grandes (>500 líneas)',
  'overview.optimizations.mergeSmallScripts': 'Considerar fusionar scripts muy pequeños relacionados',
} as const;
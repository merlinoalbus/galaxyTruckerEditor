/**
 * Overview translations for Russian
 */

export const overviewTranslations = {
  'overview.title': 'Углубленный анализ кампании',
  'overview.description': 'Детальные метрики и рекомендации по улучшению качества кода',
  'overview.exportReport': 'Экспортировать отчет',
  'overview.importantWarnings': 'Важные предупреждения',
  'overview.suggestedOptimizations': 'Рекомендуемые оптимизации',
  'overview.loading': 'Загрузка данных обзора...',
  'overview.noCampaignData': 'Нет данных кампании',
  'overview.loadCampaignMessage': 'Загрузите кампанию для просмотра статистики',
  'overview.scripts': 'Скрипты',
  'overview.variables': 'Переменные',
  'overview.characters': 'Персонажи',
  'overview.missions': 'Миссии',
  'overview.totalCommands': 'Всего команд',
  'overview.semaphores': 'Семафоры',
  'overview.numeric': 'Числовые',
  'overview.missionsReferenced': 'Миссии использованные',
  'overview.languageDistribution': 'Распределение по языкам',
  'overview.complexityAnalysis': 'Анализ сложности',
  'overview.averageCommandsPerScript': 'Среднее команд на скрипт',
  'overview.mostComplexScript': 'Самый сложный скрипт',
  'overview.scriptConnections': 'Связи скриптов',
  'overview.campaignEntities': 'Сущности кампании',
  'overview.labels': 'Метки',
  'overview.avgPerScript': 'Среднее на скрипт',
  'overview.commands': 'команд',
  'overview.maxCommandsPerScript': 'Максимум команд на скрипт',
  
  // Language Coverage Card
  'overview.languageCoverage': 'Языковое покрытие',
  'overview.coverage': 'Покрытие',
  'overview.criticalGaps': 'критические пробелы',
  'overview.criticalScriptsMissing': 'Критические скрипты отсутствуют',
  
  // Complexity Analysis Card
  'overview.complexityAnalysisTitle': 'Анализ Сложности',
  'overview.mostComplexScripts': 'Самые Сложные Скрипты',
  'overview.orphanScripts': 'Изолированные Скрипты',
  'overview.circularDependencies': 'Циклические Зависимости',
  'overview.mostReferencedScripts': 'Наиболее Ссылаемые Скрипты',
  'overview.score': 'Оценка',
  'overview.others': 'другие',
  'overview.cycles': 'циклы',
  
  // Quality Issues Card
  'overview.codeQuality': 'Качество Кода',
  'overview.otherIssues': 'другие проблемы',
  'overview.severity.critical': 'критические',
  'overview.severity.high': 'высокие',
  'overview.severity.medium': 'средние',
  'overview.severity.low': 'низкие',
  
  // Maintenance Metrics Card
  'overview.maintenanceMetrics': 'Метрики Сопровождения',
  'overview.modularity': 'Модульность',
  'overview.coupling': 'Связанность',
  'overview.cohesion': 'Связность',
  'overview.technicalDebt': 'Технический Долг',
  'overview.scriptSizeDistribution': 'Распределение Размеров Скриптов',
  'overview.largest': 'Самый большой',
  'overview.smallest': 'Самый маленький',
  'overview.lines': 'строк',
  'overview.size.tiny': 'Крошечный',
  'overview.size.small': 'Маленький',
  'overview.size.medium': 'Средний',
  'overview.size.large': 'Большой',
  'overview.size.huge': 'Огромный',

  // Refactoring Recommendations Card
  'overview.refactoringRecommendations': 'Рекомендации по Рефакторингу',
  'overview.impact': 'Влияние',
  'overview.maintainability': 'Поддерживаемость',
  'overview.performance': 'Производительность',
  'overview.readability': 'Читаемость',
  'overview.effort': 'усилия',
  'overview.noRefactoringSuggestions': 'Нет доступных предложений по рефакторингу',
  'overview.priority.high': 'высокий',
  'overview.priority.medium': 'средний',
  'overview.priority.low': 'низкий',

  // Quality Analysis Service messages
  'overview.quality.oversizedScript': 'Очень большой скрипт: {size} команд (порог: {threshold})',
  'overview.quality.oversizedScriptSuggestion': 'Рассмотрите разделение на меньшие скрипты',
  'overview.quality.tooManyVariables': 'Скрипт с множеством переменных: {count} (порог: {threshold})',
  'overview.quality.tooManyVariablesSuggestion': 'Группируйте связанные переменные или используйте структуры данных',
  'overview.quality.orphanScript': 'Никогда не вызываемый скрипт с {size} командами',
  'overview.quality.orphanScriptSuggestion.large': 'Большой неиспользуемый скрипт - проверьте, нужен ли он',
  'overview.quality.orphanScriptSuggestion.small': 'Проверьте, нужен ли скрипт еще',
  'overview.quality.circularDependency': 'Циклическая зависимость: {cycle}',
  'overview.quality.circularDependencySuggestion': 'Рефакторите для устранения цикла зависимостей',
  'overview.quality.monoStateSemaphore': "Семафор '{name}' используется только как SET или RESET",
  'overview.quality.monoStateSemaphoreSuggestion': 'Рассмотрите использование булевой переменной',

  // Refactoring Service messages
  'overview.refactoring.oversizedScript': 'Скрипт с {commandCount} командами (рекомендуемый лимит: {limit})',
  'overview.refactoring.splitActions': ['Разделить на логические под-скрипты', 'Извлечь переиспользуемые функции', 'Отделить логику инициализации'],
  'overview.refactoring.smallRelatedScripts': 'Связанные скрипты с менее чем {threshold} командами каждый',
  'overview.refactoring.mergeActions': ['Объединить {scripts} в один скрипт', 'Сохранить логическое разделение с метками'],
  'overview.refactoring.duplicatedPattern': 'Шаблон из {length} команд повторяется {occurrences} раз',
  'overview.refactoring.extractActions': ['Извлечь в общий под-скрипт', 'Создать переиспользуемую функцию', 'Использовать параметры для вариаций'],
  'overview.refactoring.highComplexity': 'Высокая цикломатическая сложность ({complexity})',
  'overview.refactoring.simplifyActions': ['Уменьшить вложенность условий', 'Извлечь логику в под-скрипты', 'Упростить цепочки IF/ELSE'],
  'overview.refactoring.deadScript': 'Никогда не вызываемый скрипт и не является точкой входа',
  'overview.refactoring.removeActions': ['Проверьте, действительно ли не используется', 'Удалите, если подтверждено', 'Документируйте, если сохранено для совместимости'],
  
  // Warnings
  'overview.warnings.criticalIssues': '{count} критических проблем обнаружено',
  'overview.warnings.hugeScripts': '{count} скриптов с более чем 500 командами',
  'overview.warnings.circularDependencies': '{count} циклических зависимостей обнаружено',
  'overview.warnings.lowCoverage': '{count} языков с покрытием < 50%',
  
  // Optimizations
  'overview.optimizations.improveModularity': 'Улучшите модульность разделением больших скриптов',
  'overview.optimizations.reduceCoupling': 'Уменьшите связанность между скриптами',
  'overview.optimizations.improveCohesion': 'Улучшите связность группировкой связанной функциональности',
  'overview.optimizations.reduceTechnicalDebt': 'Сократите технический долг целевым рефакторингом',
  'overview.optimizations.refactorHugeScripts': 'Рефакторинг самых больших скриптов (>500 строк)',
  'overview.optimizations.mergeSmallScripts': 'Рассмотрите объединение очень маленьких связанных скриптов',
} as const;
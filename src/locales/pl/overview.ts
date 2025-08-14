/**
 * Overview translations for Polish
 */

export const overviewTranslations = {
  'overview.title': 'Zaawansowana analiza kampanii',
  'overview.description': 'Szczegółowe metryki i sugestie poprawy jakości kodu',
  'overview.exportReport': 'Eksportuj raport',
  'overview.importantWarnings': 'Ważne ostrzeżenia',
  'overview.suggestedOptimizations': 'Sugerowane optymalizacje',
  'overview.loading': 'Ładowanie danych przeglądu...',
  'overview.noCampaignData': 'Brak danych kampanii',
  'overview.loadCampaignMessage': 'Załaduj skrypty kampanii, aby zobaczyć statystyki przeglądu',
  'overview.scripts': 'Skrypty',
  'overview.variables': 'Zmienne',
  'overview.characters': 'Postacie',
  'overview.missions': 'Misje',
  'overview.totalCommands': 'łącznie poleceń',
  'overview.semaphores': 'semafory',
  'overview.numeric': 'numeryczne',
  'overview.missionsReferenced': 'misje odniesione',
  'overview.languageDistribution': 'Rozkład języków',
  'overview.complexityAnalysis': 'Analiza złożoności',
  'overview.averageCommandsPerScript': 'Średnie polecenia na skrypt',
  'overview.mostComplexScript': 'Najbardziej złożony skrypt',
  'overview.scriptConnections': 'Połączenia skryptów',
  'overview.campaignEntities': 'Jednostki kampanii',
  'overview.labels': 'Etykiety',
  'overview.avgPerScript': 'średnio na skrypt',
  'overview.commands': 'polecenia',
  'overview.maxCommandsPerScript': 'Maksymalne polecenia na skrypt',
  
  // Language Coverage Card
  'overview.languageCoverage': 'Pokrycie językowe',
  'overview.coverage': 'Pokrycie',
  'overview.criticalGaps': 'luki krytyczne',
  'overview.criticalScriptsMissing': 'Brak krytycznych skryptów',
  
  // Complexity Analysis Card
  'overview.complexityAnalysisTitle': 'Analiza Złożoności',
  'overview.mostComplexScripts': 'Najbardziej Złożone Skrypty',
  'overview.orphanScripts': 'Skrypty Osierocone',
  'overview.circularDependencies': 'Zależności Cykliczne',
  'overview.mostReferencedScripts': 'Najczęściej Referowane Skrypty',
  'overview.score': 'Wynik',
  'overview.others': 'inne',
  'overview.cycles': 'cykle',
  
  // Quality Issues Card
  'overview.codeQuality': 'Jakość Kodu',
  'overview.otherIssues': 'inne problemy',
  'overview.severity.critical': 'krytyczne',
  'overview.severity.high': 'wysokie',
  'overview.severity.medium': 'średnie',
  'overview.severity.low': 'niskie',
  
  // Maintenance Metrics Card
  'overview.maintenanceMetrics': 'Metryki Konserwacji',
  'overview.modularity': 'Modularność',
  'overview.coupling': 'Sprzężenie',
  'overview.cohesion': 'Kohezja',
  'overview.technicalDebt': 'Dług Techniczny',
  'overview.scriptSizeDistribution': 'Rozkład Rozmiarów Skryptów',
  'overview.largest': 'Największy',
  'overview.smallest': 'Najmniejszy',
  'overview.lines': 'linie',
  'overview.size.tiny': 'Maleńki',
  'overview.size.small': 'Mały',
  'overview.size.medium': 'Średni',
  'overview.size.large': 'Duży',
  'overview.size.huge': 'Ogromny',

  // Refactoring Recommendations Card
  'overview.refactoringRecommendations': 'Rekomendacje Refaktoringu',
  'overview.impact': 'Wpływ',
  'overview.maintainability': 'Łatwość Utrzymania',
  'overview.performance': 'Wydajność',
  'overview.readability': 'Czytelność',
  'overview.effort': 'wysiłek',
  'overview.noRefactoringSuggestions': 'Brak dostępnych sugestii refaktoringu',
  'overview.priority.high': 'wysoki',
  'overview.priority.medium': 'średni',
  'overview.priority.low': 'niski',

  // Quality Analysis Service messages
  'overview.quality.oversizedScript': 'Bardzo duży skrypt: {size} poleceń (próg: {threshold})',
  'overview.quality.oversizedScriptSuggestion': 'Rozważ podział na mniejsze skrypty',
  'overview.quality.tooManyVariables': 'Skrypt z wieloma zmiennymi: {count} (próg: {threshold})',
  'overview.quality.tooManyVariablesSuggestion': 'Pogrupuj powiązane zmienne lub użyj struktur danych',
  'overview.quality.orphanScript': 'Nigdy niewywoływany skrypt z {size} poleceniami',
  'overview.quality.orphanScriptSuggestion.large': 'Duży nieużywany skrypt - sprawdź czy jest potrzebny',
  'overview.quality.orphanScriptSuggestion.small': 'Sprawdź czy skrypt jest nadal potrzebny',
  'overview.quality.circularDependency': 'Zależność cykliczna: {cycle}',
  'overview.quality.circularDependencySuggestion': 'Refaktoryzuj aby wyeliminować cykl zależności',
  'overview.quality.monoStateSemaphore': "Semafor '{name}' używany tylko jako SET lub RESET",
  'overview.quality.monoStateSemaphoreSuggestion': 'Rozważ użycie zmiennej boolean',

  // Refactoring Service messages
  'overview.refactoring.oversizedScript': 'Skrypt z {commandCount} poleceniami (zalecany limit: {limit})',
  'overview.refactoring.splitActions': ['Podziel na logiczne pod-skrypty', 'Wyodrębnij funkcje wielokrotnego użytku', 'Oddziel logikę inicjalizacji'],
  'overview.refactoring.smallRelatedScripts': 'Powiązane skrypty z mniej niż {threshold} poleceniami każdy',
  'overview.refactoring.mergeActions': ['Scal {scripts} w pojedynczy skrypt', 'Zachowaj logiczne oddzielenie etykietami'],
  'overview.refactoring.duplicatedPattern': 'Wzorzec {length} poleceń powtórzony {occurrences} razy',
  'overview.refactoring.extractActions': ['Wyodrębnij do wspólnego pod-skryptu', 'Utwórz funkcję wielokrotnego użytku', 'Użyj parametrów dla wariantów'],
  'overview.refactoring.highComplexity': 'Wysoka złożoność cyklomatyczna ({complexity})',
  'overview.refactoring.simplifyActions': ['Zmniejsz zagnieżdżenie warunków', 'Wyodrębnij logikę do pod-skryptów', 'Uprość łańcuchy IF/ELSE'],
  'overview.refactoring.deadScript': 'Nigdy niewywoływany skrypt i nie jest punktem wejścia',
  'overview.refactoring.removeActions': ['Sprawdź czy rzeczywiście nieużywany', 'Usuń jeśli potwierdzone', 'Udokumentuj jeśli zachowany dla kompatybilności'],

  // Warnings
  'overview.warnings.criticalIssues': '{count} problemów krytycznych wykrytych',
  'overview.warnings.hugeScripts': '{count} skryptów z więcej niż 500 poleceniami',
  'overview.warnings.circularDependencies': '{count} zależności cyklicznych wykrytych',
  'overview.warnings.lowCoverage': '{count} języków z pokryciem < 50%',

  // Optimizations
  'overview.optimizations.improveModularity': 'Popraw modularność dzieląc duże skrypty',
  'overview.optimizations.reduceCoupling': 'Zmniejsz sprzężenie między skryptami',
  'overview.optimizations.improveCohesion': 'Popraw kohezję grupując powiązane funkcjonalności',
  'overview.optimizations.reduceTechnicalDebt': 'Zmniejsz dług techniczny celowanym refaktoringiem',
  'overview.optimizations.refactorHugeScripts': 'Refaktoryzuj największe skrypty (>500 linii)',
  'overview.optimizations.mergeSmallScripts': 'Rozważ scalenie bardzo małych powiązanych skryptów',
} as const;
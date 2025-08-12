/**
 * Overview translations for Italian
 */

export const overviewTranslations = {
  'overview.title': 'Analisi Avanzata Campagna',
  'overview.description': 'Metriche dettagliate e suggerimenti per migliorare la qualità del codice',
  'overview.exportReport': 'Esporta Report',
  'overview.importantWarnings': 'Avvisi Importanti',
  'overview.suggestedOptimizations': 'Ottimizzazioni Suggerite',
  'overview.loading': 'Caricamento dati panoramica...',
  'overview.noCampaignData': 'Nessun Dato Campagna',
  'overview.loadCampaignMessage': 'Carica gli script della campagna per vedere le statistiche',
  'overview.scripts': 'Script',
  'overview.variables': 'Variabili',
  'overview.characters': 'Personaggi',
  'overview.missions': 'Missioni',
  'overview.totalCommands': 'comandi totali',
  'overview.semaphores': 'semafori',
  'overview.numeric': 'numeriche',
  'overview.missionsReferenced': 'missioni referenziate',
  'overview.languageDistribution': 'Distribuzione Lingue',
  'overview.complexityAnalysis': 'Analisi Complessità',
  'overview.averageCommandsPerScript': 'Comandi Medi per Script',
  'overview.mostComplexScript': 'Script più Complesso',
  'overview.scriptConnections': 'Connessioni Script',
  'overview.campaignEntities': 'Entità Campagna',
  'overview.labels': 'Etichette',
  'overview.avgPerScript': 'media per script',
  'overview.commands': 'comandi',
  'overview.maxCommandsPerScript': 'Massimo comandi per Script',
  
  // Language Coverage Card
  'overview.languageCoverage': 'Copertura Linguistica',
  'overview.coverage': 'Copertura',
  'overview.criticalGaps': 'gap critici',
  'overview.criticalScriptsMissing': 'Script critici mancanti',
  
  // Complexity Analysis Card
  'overview.complexityAnalysisTitle': 'Analisi Complessità',
  'overview.mostComplexScripts': 'Script Più Complessi',
  'overview.orphanScripts': 'Script Orfani',
  'overview.circularDependencies': 'Dipendenze Circolari',
  'overview.mostReferencedScripts': 'Script Più Referenziati',
  'overview.score': 'Score',
  'overview.others': 'altri',
  'overview.cycles': 'cicli',
  
  // Quality Issues Card
  'overview.codeQuality': 'Qualità Codice',
  'overview.otherIssues': 'altri problemi',
  'overview.severity.critical': 'critico',
  'overview.severity.high': 'alto',
  'overview.severity.medium': 'medio',
  'overview.severity.low': 'basso',
  
  // Maintenance Metrics Card
  'overview.maintenanceMetrics': 'Metriche Manutenibilità',
  'overview.modularity': 'Modularità',
  'overview.coupling': 'Accoppiamento',
  'overview.cohesion': 'Coesione',
  'overview.technicalDebt': 'Debito Tecnico',
  'overview.scriptSizeDistribution': 'Distribuzione Dimensioni Script',
  'overview.largest': 'Più grande',
  'overview.smallest': 'Più piccolo',
  'overview.lines': 'linee',
  'overview.size.tiny': 'Tiny',
  'overview.size.small': 'Small',
  'overview.size.medium': 'Medium',
  'overview.size.large': 'Large',
  'overview.size.huge': 'Huge',
  
  // Refactoring Recommendations Card
  'overview.refactoringRecommendations': 'Suggerimenti Refactoring',
  'overview.impact': 'Impatto',
  'overview.maintainability': 'Manutenibilità',
  'overview.performance': 'Performance',
  'overview.readability': 'Leggibilità',
  'overview.effort': 'effort',
  'overview.noRefactoringSuggestions': 'Nessun suggerimento di refactoring disponibile',
  'overview.priority.high': 'alto',
  'overview.priority.medium': 'medio',
  'overview.priority.low': 'basso',
  
  // Quality Analysis Service messages
  'overview.quality.oversizedScript': 'Script molto grande: {size} comandi (soglia: {threshold})',
  'overview.quality.oversizedScriptSuggestion': 'Considera di dividere in script più piccoli',
  'overview.quality.tooManyVariables': 'Script con molte variabili: {count} (soglia: {threshold})',
  'overview.quality.tooManyVariablesSuggestion': 'Raggruppa variabili correlate o usa strutture dati',
  'overview.quality.orphanScript': 'Script mai chiamato con {size} comandi',
  'overview.quality.orphanScriptSuggestion.large': 'Script grande non utilizzato - verifica se necessario',
  'overview.quality.orphanScriptSuggestion.small': 'Verifica se lo script è ancora necessario',
  'overview.quality.circularDependency': 'Dipendenza circolare: {cycle}',
  'overview.quality.circularDependencySuggestion': 'Rifattorizza per eliminare il ciclo di dipendenze',
  'overview.quality.monoStateSemaphore': "Semaforo '{name}' usato solo come SET o RESET",
  'overview.quality.monoStateSemaphoreSuggestion': 'Considera di usare una variabile booleana',
  
  // Refactoring Service messages  
  'overview.refactoring.oversizedScript': 'Script con {commandCount} comandi (limite consigliato: {limit})',
  'overview.refactoring.splitActions': ['Dividi in sub-script logici', 'Estrai funzioni riutilizzabili', 'Separa logica di inizializzazione'],
  'overview.refactoring.smallRelatedScripts': 'Script correlati con meno di {threshold} comandi ciascuno',
  'overview.refactoring.mergeActions': ['Unisci {scripts} in un unico script', 'Mantieni separazione logica con etichette'],
  'overview.refactoring.duplicatedPattern': 'Pattern di {length} comandi ripetuto {occurrences} volte',
  'overview.refactoring.extractActions': ['Estrai in sub-script comune', 'Crea funzione riutilizzabile', 'Usa parametri per le variazioni'],
  'overview.refactoring.highComplexity': 'Complessità ciclomatica elevata ({complexity})',
  'overview.refactoring.simplifyActions': ['Riduci annidamento condizioni', 'Estrai logica in sub-script', 'Semplifica catene di IF/ELSE'],
  'overview.refactoring.deadScript': 'Script mai chiamato e non è un entry point',
  'overview.refactoring.removeActions': ['Verifica se realmente inutilizzato', 'Rimuovi se confermato', 'Documenta se mantenuto per compatibilità'],
  
  // Warnings
  'overview.warnings.criticalIssues': '{count} problemi critici rilevati',
  'overview.warnings.hugeScripts': '{count} script con più di 500 comandi',
  'overview.warnings.circularDependencies': '{count} dipendenze circolari rilevate',
  'overview.warnings.lowCoverage': '{count} lingue con copertura < 50%',
  
  // Optimizations
  'overview.optimizations.improveModularity': 'Migliora la modularità dividendo script grandi',
  'overview.optimizations.reduceCoupling': 'Riduci l\'accoppiamento tra script',
  'overview.optimizations.improveCohesion': 'Migliora la coesione raggruppando funzionalità correlate',
  'overview.optimizations.reduceTechnicalDebt': 'Riduci il debito tecnico con refactoring mirati',
  'overview.optimizations.refactorHugeScripts': 'Rifattorizza gli script più grandi (>500 linee)',
  'overview.optimizations.mergeSmallScripts': 'Considera di unire script molto piccoli correlati',
} as const;
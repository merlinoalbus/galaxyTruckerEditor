import { logger } from '@/utils/logger';
// Language Coverage Service - Analisi copertura traduzioni

import type { CampaignAnalysis, ParsedScript, ScriptCommand } from '@/types/CampaignEditor';
import type { LanguageCoverage } from '@/types/CampaignEditor/Overview/Overview.types';

export const languageCoverageService = {
  calculateCoverage(analysis: CampaignAnalysis): LanguageCoverage[] {
    // Analyzing language coverage
    
    // Definisci tutte le lingue supportate dall'interfaccia (inclusa IT)
    const allSupportedLanguages = ['IT', 'EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const languageCountMap = new Map<string, number>();
    const totalScripts = analysis.scripts.length;
    
    // Inizializza tutte le lingue a 0
    allSupportedLanguages.forEach(lang => {
      languageCountMap.set(lang, 0);
    });
    
    // Debug: log prima analisi
    if (totalScripts === 0) {
  logger.warn('No scripts found in analysis');
      return [];
    }
    
    // Per ogni script, conta le lingue supportate
    analysis.scripts.forEach((script, index) => {
      // Processing script languages
      
      if (script.languages && Array.isArray(script.languages)) {
        script.languages.forEach(lang => {
          if (allSupportedLanguages.includes(lang)) {
            languageCountMap.set(lang, (languageCountMap.get(lang) || 0) + 1);
          }
        });
      }
    });
    
    // Language counts calculated
    
    const coverage: LanguageCoverage[] = [];
    
    // Per ogni lingua supportata, calcola la copertura (incluse quelle al 0%)
    allSupportedLanguages.forEach(lang => {
      const scriptsWithLanguage = languageCountMap.get(lang) || 0;
      const missingScripts: string[] = [];
      const gapAnalysis = {
        critical: [] as string[],
        high: [] as string[],
        medium: [] as string[],
        low: [] as string[]
      };
      
      // Trova script che NON supportano questa lingua
      analysis.scripts.forEach(script => {
        if (!script.languages || !script.languages.includes(lang)) {
          missingScripts.push(script.name);
          
          // Categorizza per priorità
          if (this.isCriticalScript(script.name)) {
            gapAnalysis.critical.push(script.name);
          } else if (this.isHighPriorityScript(script.name)) {
            gapAnalysis.high.push(script.name);
          } else if (this.isMediumPriorityScript(script.name)) {
            gapAnalysis.medium.push(script.name);
          } else {
            gapAnalysis.low.push(script.name);
          }
        }
      });
      
      const coveragePercentage = totalScripts > 0 
        ? Math.round((scriptsWithLanguage / totalScripts) * 100)
        : 0;
      
      coverage.push({
        language: lang,
        totalScripts,
        translatedScripts: scriptsWithLanguage,
        coveragePercentage,
        missingScripts: missingScripts.slice(0, 10),
        gapAnalysis
      });
    });
    
    // Coverage calculation completed
    return coverage.sort((a, b) => b.coveragePercentage - a.coveragePercentage);
  },
  
  // Conta i comandi che hanno componente linguistica (dialoghi, testi, etc.)
  countLinguisticCommands(script: ParsedScript): number {
    if (!script.commands) return 0;
    
    const linguisticCommandTypes = [
      'SAY', 'ASK', 'ANNOUNCE', 'MENU', 'OPT', 'OPT_IF',
      'dialogue', 'question', 'announce', 'opt', 'opt_if',
      'dialog_start', 'dialog_text', 'dialog_button'
    ];
    
    return script.commands.filter((cmd: ScriptCommand) => {
      const cmdType = cmd.type?.toLowerCase();
      return linguisticCommandTypes.some(type => 
        type.toLowerCase() === cmdType || 
        cmdType?.includes('dialog') || 
        cmdType?.includes('text')
      );
    }).length;
  },
  
  detectLanguageFromName(scriptName: string): string {
    // Rileva lingua dal suffisso (_IT, _EN, etc)
    const match = scriptName.match(/_([A-Z]{2})$/);
    if (match) return match[1];
    
    // Default a IT se non ha suffisso
    return 'IT';
  },
  
  extractBaseName(scriptName: string): string {
    // Rimuovi suffisso lingua se presente
    return scriptName.replace(/_[A-Z]{2}$/, '');
  },
  
  identifyMainLanguage(scriptsByLanguage: Map<string, string[]>): string {
    let maxCount = 0;
    let mainLang = 'IT';
    
    scriptsByLanguage.forEach((scripts, lang) => {
      if (scripts.length > maxCount) {
        maxCount = scripts.length;
        mainLang = lang;
      }
    });
    
    return mainLang;
  },
  
  calculateOverallCoverage(languageCoverage: LanguageCoverage[]): number {
    if (languageCoverage.length === 0) return 0;
    
    const totalCoverage = languageCoverage.reduce(
      (sum, lang) => sum + lang.coveragePercentage, 
      0
    );
    
    return Math.round(totalCoverage / languageCoverage.length);
  },
  
  countCriticalGaps(languageCoverage: LanguageCoverage[]): number {
    return languageCoverage.reduce(
      (sum, lang) => sum + lang.gapAnalysis.critical.length,
      0
    );
  },
  
  // Metodi di classificazione priorità
  isCriticalScript(scriptName: string): boolean {
    const criticalPatterns = ['main', 'start', 'init', 'menu', 'tutorial'];
    return criticalPatterns.some(pattern => 
      scriptName.toLowerCase().includes(pattern)
    );
  },
  
  isHighPriorityScript(scriptName: string): boolean {
    const highPatterns = ['mission', 'quest', 'dialog', 'story'];
    return highPatterns.some(pattern => 
      scriptName.toLowerCase().includes(pattern)
    );
  },
  
  isMediumPriorityScript(scriptName: string): boolean {
    const mediumPatterns = ['character', 'npc', 'event', 'cutscene'];
    return mediumPatterns.some(pattern => 
      scriptName.toLowerCase().includes(pattern)
    );
  }
};
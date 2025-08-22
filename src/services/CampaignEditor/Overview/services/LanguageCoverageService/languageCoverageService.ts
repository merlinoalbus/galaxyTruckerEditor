import { logger } from '@/utils/logger';
// Language Coverage Service - Analisi copertura traduzioni

import type { CampaignAnalysis, ParsedScript, ScriptCommand } from '@/types/CampaignEditor';
import type { LanguageCoverage } from '@/types/CampaignEditor/Overview/Overview.types';

export const languageCoverageService = {
  calculateCoverage(analysis: CampaignAnalysis): LanguageCoverage[] {
    // Nuova logica: calcola la copertura multilanguage sulle chiavi text tradotte
    const allSupportedLanguages = ['IT', 'EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
  const multilanguageCountMap = new Map<string, number>(); // Quante multilanguage tradotte per lingua
  let totalMultilanguage = 0; // Totale multilanguage (chiavi text)

    // Inizializza tutte le lingue a 0
    allSupportedLanguages.forEach(lang => {
      multilanguageCountMap.set(lang, 0);
    });

    // Funzione di utilità: true se il comando è linguistico
    const isLinguisticCommand = (cmdType: string) => {
      const linguisticCommandTypes = [
        'SAY', 'ASK', 'ANNOUNCE', 'MENU', 'OPT', 'OPT_IF',
        'dialogue', 'question', 'announce', 'opt', 'opt_if',
        'dialog_start', 'dialog_text', 'dialog_button', 'TEXT'
      ];
      return linguisticCommandTypes.some(type => type.toLowerCase() === cmdType?.toLowerCase());
    };

    // Itera tutti i comandi di tutti gli script
    analysis.scripts.forEach(script => {
      if (!script.commands) return;
      script.commands.forEach(cmd => {
        if (!isLinguisticCommand(cmd.type)) return;
        // Cerca il campo text nei parametri
        const textField = cmd.parameters?.text;
        if (textField && typeof textField === 'object' && !Array.isArray(textField)) {
          // È un oggetto multilanguage: conta ogni lingua
          totalMultilanguage++;
          allSupportedLanguages.forEach(lang => {
            const value = textField[lang];
            if (String(value).trim().length > 0) {
              multilanguageCountMap.set(lang, (multilanguageCountMap.get(lang) || 0) + 1);
            }
          });
        }
      });
    });

    // Gap analysis e priorità come prima
    const coverage: LanguageCoverage[] = [];
    allSupportedLanguages.forEach(lang => {
      const translatedMultilanguage = multilanguageCountMap.get(lang) || 0;
      const missingScripts: string[] = [];
      const gapAnalysis = {
        critical: [] as string[],
        high: [] as string[],
        medium: [] as string[],
        low: [] as string[]
      };

      // Trova script che NON hanno almeno una multilanguage tradotta in questa lingua
      analysis.scripts.forEach(script => {
        const hasTranslation = script.commands?.some(cmd => {
          if (!isLinguisticCommand(cmd.type)) return false;
          const textField = cmd.parameters?.text;
          const value = textField && typeof textField === 'object' && !Array.isArray(textField) ? textField[lang] : undefined;
          return value && String(value).trim().length > 0;
        });
        if (!hasTranslation) {
          missingScripts.push(script.name);
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

      const coveragePercentage = totalMultilanguage > 0
        ? Math.round((translatedMultilanguage / totalMultilanguage) * 100)
        : 0;

      coverage.push({
        language: lang,
        totalScripts: analysis.scripts.length,
        translatedScripts: translatedMultilanguage,
        coveragePercentage,
        missingScripts: missingScripts.slice(0, 10),
        gapAnalysis,
        totalMultilanguage,
        translatedMultilanguage
      });
    });

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
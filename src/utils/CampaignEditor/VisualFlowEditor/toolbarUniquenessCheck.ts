/**
 * Utility per verificare l'univocità dei comandi e delle icone nella toolbar
 */
import { getToolCategories } from '@/types/CampaignEditor/VisualFlowEditor/ToolCategories';

interface DuplicateReport {
  commands: {
    duplicates: Array<{
      command: string;
      count: number;
      categories: string[];
    }>;
    totalCommands: number;
    uniqueCommands: number;
  };
  icons: {
    duplicates: Array<{
      icon: string;
      count: number;
      commands: string[];
      categories: string[];
    }>;
    totalIcons: number;
    uniqueIcons: number;
  };
}

/**
 * Verifica l'univocità dei comandi e delle icone nella toolbar
 * @param t Funzione di traduzione per ottenere le categorie
 * @returns Report completo dei duplicati trovati
 */
export function checkToolbarUniqueness(t: any): DuplicateReport {
  const categories = getToolCategories(t);
  
  // Mappa per tenere traccia dei comandi e delle loro occorrenze
  const commandMap: Map<string, { count: number; categories: string[] }> = new Map();
  // Mappa per tenere traccia delle icone e delle loro occorrenze
  const iconMap: Map<string, { count: number; commands: string[]; categories: string[] }> = new Map();
  
  let totalCommands = 0;
  let totalIcons = 0;
  
  // Scansiona tutte le categorie e i relativi strumenti
  for (const category of categories) {
    for (const tool of category.tools) {
      totalCommands++;
      totalIcons++;
      
      // Traccia i comandi
      const commandName = tool.name || tool.blockType;
      if (commandMap.has(commandName)) {
        const existing = commandMap.get(commandName)!;
        existing.count++;
        existing.categories.push(category.name);
      } else {
        commandMap.set(commandName, { count: 1, categories: [category.name] });
      }
      
      // Traccia le icone
      const iconName = tool.icon;
      if (iconMap.has(iconName)) {
        const existing = iconMap.get(iconName)!;
        existing.count++;
        existing.commands.push(commandName);
        if (!existing.categories.includes(category.name)) {
          existing.categories.push(category.name);
        }
      } else {
        iconMap.set(iconName, { count: 1, commands: [commandName], categories: [category.name] });
      }
    }
  }
  
  // Trova i duplicati nei comandi
  const commandDuplicates: Array<{ command: string; count: number; categories: string[] }> = [];
  for (const [command, data] of commandMap.entries()) {
    if (data.count > 1) {
      commandDuplicates.push({
        command,
        count: data.count,
        categories: data.categories
      });
    }
  }
  
  // Trova i duplicati nelle icone
  const iconDuplicates: Array<{ icon: string; count: number; commands: string[]; categories: string[] }> = [];
  for (const [icon, data] of iconMap.entries()) {
    if (data.count > 1) {
      iconDuplicates.push({
        icon,
        count: data.count,
        commands: data.commands,
        categories: data.categories
      });
    }
  }
  
  return {
    commands: {
      duplicates: commandDuplicates,
      totalCommands,
      uniqueCommands: commandMap.size
    },
    icons: {
      duplicates: iconDuplicates,
      totalIcons,
      uniqueIcons: iconMap.size
    }
  };
}

/**
 * Genera un report leggibile dell'analisi di univocità
 * @param report Il report generato da checkToolbarUniqueness
 * @returns Stringa formattata del report
 */
export function generateUniquenessReport(report: DuplicateReport): string {
  let output = '=== TOOLBAR UNIQUENESS ANALYSIS ===\n\n';
  
  // Report comandi
  output += `COMMANDS ANALYSIS:\n`;
  output += `- Total commands: ${report.commands.totalCommands}\n`;
  output += `- Unique commands: ${report.commands.uniqueCommands}\n`;
  output += `- Duplicate commands: ${report.commands.duplicates.length}\n\n`;
  
  if (report.commands.duplicates.length > 0) {
    output += `DUPLICATE COMMANDS:\n`;
    for (const dup of report.commands.duplicates) {
      output += `⚠️  "${dup.command}" appears ${dup.count} times in categories: ${dup.categories.join(', ')}\n`;
    }
    output += '\n';
  }
  
  // Report icone
  output += `ICONS ANALYSIS:\n`;
  output += `- Total icons: ${report.icons.totalIcons}\n`;
  output += `- Unique icons: ${report.icons.uniqueIcons}\n`;
  output += `- Duplicate icons: ${report.icons.duplicates.length}\n\n`;
  
  if (report.icons.duplicates.length > 0) {
    output += `DUPLICATE ICONS:\n`;
    for (const dup of report.icons.duplicates) {
      output += `🔄 Icon "${dup.icon}" is used ${dup.count} times by commands: ${dup.commands.join(', ')}\n`;
      output += `   Categories: ${dup.categories.join(', ')}\n`;
    }
    output += '\n';
  }
  
  // Riepilogo
  if (report.commands.duplicates.length === 0 && report.icons.duplicates.length === 0) {
    output += '✅ NO DUPLICATES FOUND - All commands and icons are unique!\n';
  } else {
    output += `❌ ISSUES FOUND:\n`;
    if (report.commands.duplicates.length > 0) {
      output += `- ${report.commands.duplicates.length} duplicate command(s)\n`;
    }
    if (report.icons.duplicates.length > 0) {
      output += `- ${report.icons.duplicates.length} duplicate icon(s)\n`;
    }
  }
  
  return output;
}

/**
 * Esegue la verifica e stampa il report nella console
 * @param t Funzione di traduzione per ottenere le categorie
 */
export function logUniquenessCheck(t: any): void {
  const report = checkToolbarUniqueness(t);
  const formattedReport = generateUniquenessReport(report);
  console.log(formattedReport);
}

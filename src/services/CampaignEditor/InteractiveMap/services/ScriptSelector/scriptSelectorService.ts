import { CampaignScript } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';

class ScriptSelectorService {
  filterScripts(scripts: CampaignScript[], searchTerm: string): CampaignScript[] {
    if (!searchTerm.trim()) {
      return scripts;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return scripts.filter(script => {
      const scriptName = script.nomescript || script.name || '';
      const fileName = script.nomefile || script.fileName || '';
      const commands = script.commands || [];
      
      return scriptName.toLowerCase().includes(lowerSearchTerm) ||
        fileName.toLowerCase().includes(lowerSearchTerm) ||
        commands.some(cmd => 
          cmd.content.toLowerCase().includes(lowerSearchTerm)
        );
    });
  }

  sortScripts(scripts: CampaignScript[], startScripts: string[] = []): CampaignScript[] {
    return scripts.sort((a, b) => {
      const aIsStart = this.isStartScript(a, startScripts);
      const bIsStart = this.isStartScript(b, startScripts);
      
      // Start scripts first
      if (aIsStart && !bIsStart) return -1;
      if (!aIsStart && bIsStart) return 1;
      
      // Then sort by file name and script name
      const aFileName = a.nomefile || a.fileName || '';
      const bFileName = b.nomefile || b.fileName || '';
      const aName = a.nomescript || a.name || '';
      const bName = b.nomescript || b.name || '';
      
      if (aFileName !== bFileName) {
        return aFileName.localeCompare(bFileName);
      }
      return aName.localeCompare(bName);
    });
  }

  isStartScript(script: CampaignScript, startScripts: string[] = []): boolean {
    const scriptName = script.nomescript || script.name || '';
    return startScripts.includes(scriptName);
  }

  getScriptPreview(script: CampaignScript): string {
    const commands = script.commands || [];
    
    const firstDialogue = commands.find(cmd => 
      cmd.type === 'dialogue' || cmd.type === 'question'
    );
    
    if (firstDialogue) {
      const match = firstDialogue.content.match(/"([^"]+)"/);
      return match ? match[1].substring(0, 100) : '';
    }

    const firstCommand = commands[0];
    return firstCommand ? firstCommand.content.substring(0, 50) : '';
  }
}

export const scriptSelectorService = new ScriptSelectorService();
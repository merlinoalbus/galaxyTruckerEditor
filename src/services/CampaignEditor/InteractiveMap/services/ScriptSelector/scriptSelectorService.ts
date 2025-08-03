import { CampaignScript } from '@/types/CampaignEditor/InteractiveMap/InteractiveMap.types';

class ScriptSelectorService {
  filterScripts(scripts: CampaignScript[], searchTerm: string): CampaignScript[] {
    if (!searchTerm.trim()) {
      return scripts;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return scripts.filter(script => 
      script.name.toLowerCase().includes(lowerSearchTerm) ||
      script.fileName.toLowerCase().includes(lowerSearchTerm) ||
      script.commands.some(cmd => 
        cmd.content.toLowerCase().includes(lowerSearchTerm)
      )
    );
  }

  sortScripts(scripts: CampaignScript[], startScripts: string[] = []): CampaignScript[] {
    return scripts.sort((a, b) => {
      const aIsStart = this.isStartScript(a, startScripts);
      const bIsStart = this.isStartScript(b, startScripts);
      
      // Start scripts first
      if (aIsStart && !bIsStart) return -1;
      if (!aIsStart && bIsStart) return 1;
      
      // Then sort by file name and script name
      if (a.fileName !== b.fileName) {
        return a.fileName.localeCompare(b.fileName);
      }
      return a.name.localeCompare(b.name);
    });
  }

  isStartScript(script: CampaignScript, startScripts: string[] = []): boolean {
    return startScripts.includes(script.name);
  }

  getScriptPreview(script: CampaignScript): string {
    const firstDialogue = script.commands.find(cmd => 
      cmd.type === 'dialogue' || cmd.type === 'question'
    );
    
    if (firstDialogue) {
      const match = firstDialogue.content.match(/"([^"]+)"/);
      return match ? match[1].substring(0, 100) : '';
    }

    const firstCommand = script.commands[0];
    return firstCommand ? firstCommand.content.substring(0, 50) : '';
  }
}

export const scriptSelectorService = new ScriptSelectorService();
import { getToolCategories } from '../types/CampaignEditor/VisualFlowEditor/ToolCategories';
import { translations } from '../locales';

describe('Toolbar icons uniqueness and expectations', () => {
  const t = (k: any) => translations.EN[k as keyof typeof translations.EN] || String(k);
  const categories = getToolCategories(t);

  it('no duplicate icons across tools', () => {
    const icons: string[] = [];
    for (const c of categories) {
      for (const tool of c.tools) {
        icons.push(tool.icon);
      }
    }
    const seen = new Set<string>();
    const dups: string[] = [];
    for (const ic of icons) {
      if (seen.has(ic)) dups.push(ic); else seen.add(ic);
    }
    expect(dups).toEqual([]);
  });

  it('BUILD/FLIGHT icons match expected set', () => {
    const find = (name: string) => categories.flatMap(c => c.tools).find(t => t.name === name);
    expect(find('BUILD')?.icon).toBe('🏗️');
    expect(find('FLIGHT')?.icon).toBe('🛫');
  });

  it('Mission category contains MOBS with ⚡ icon', () => {
    const mission = categories.find(c => c.id === 'mission');
    expect(mission).toBeTruthy();
    const mobs = mission!.tools.find(t => t.name === 'MODIFYOPPONENTSBUILDSPEED');
    expect(mobs).toBeTruthy();
    expect(mobs!.icon).toBe('⚡');
  });
});

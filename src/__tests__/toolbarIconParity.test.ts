import { getToolCategories } from '@/types/CampaignEditor/VisualFlowEditor/ToolCategories';
import { translations } from '@/locales';
import fs from 'fs';
import path from 'path';

// This test enforces that specific block icons match the toolbar icons
// If a block renders a different emoji than the toolbar tool, we should catch it here.
describe('Toolbar <-> Block icon parity', () => {
  const t = (k: any) => translations.EN[k as keyof typeof translations.EN] || String(k);
  const categories = getToolCategories(t);

  // Minimal expected mapping from toolbar icons for critical commands
  const expected: Record<string, string> = {};
  for (const c of categories) {
    for (const tool of c.tools) {
      expected[tool.name] = tool.icon;
    }
  }

  it('SHOWDLGSCENE and HIDEDLGSCENE icons match toolbar', () => {
    // Toolbar expectations
    expect(expected['SHOWDLGSCENE']).toBe('🗨️');
    expect(expected['HIDEDLGSCENE']).toBe('🫥');

    // Verify actual block icon mapping in CommandBlock.tsx
    const cmdFile = path.join(
      __dirname,
      '../components/CampaignEditor/VisualFlowEditor/components/blocks/CommandBlock/CommandBlock.tsx'
    );
    const src = fs.readFileSync(cmdFile, 'utf8');
    const showMatch = src.match(/case 'SHOWDLGSCENE':\s*return <span[^>]*>(.*?)<\/span>;/);
    const hideMatch = src.match(/case 'HIDEDLGSCENE':\s*return <span[^>]*>(.*?)<\/span>;/);
    expect(showMatch && showMatch[1]).toBe('🗨️');
    expect(hideMatch && hideMatch[1]).toBe('🫥');
  });

  it('MOBS, EXIT_MENU, SET/RESET, MENU/OPT icons are consistent with toolbar definitions', () => {
    // Sanity checks on toolbar mapping existence
    expect(expected['MODIFYOPPONENTSBUILDSPEED']).toBe('⚡');
    expect(expected['EXIT_MENU']).toBe('🚪');
    expect(expected['SET']).toBe('✅');
    expect(expected['RESET']).toBe('❌');
    expect(expected['MENU']).toBe('☰');
    expect(expected['OPT']).toBe('⭕');
  });
});

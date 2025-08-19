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
  // Support both legacy <span> and new <Emoji text="..." /> patterns
  const showSpan = src.match(/case 'SHOWDLGSCENE':[\s\S]*?return <span[^>]*>(.*?)<\/span>;/);
  const hideSpan = src.match(/case 'HIDEDLGSCENE':[\s\S]*?return <span[^>]*>(.*?)<\/span>;/);
  const showEmoji = src.match(/case 'SHOWDLGSCENE':[\s\S]*?return <Emoji\s+text=\"([^\"]+)\"/);
  const hideEmoji = src.match(/case 'HIDEDLGSCENE':[\s\S]*?return <Emoji\s+text=\"([^\"]+)\"/);
  const showIcon = (showEmoji && showEmoji[1]) || (showSpan && showSpan[1]);
  const hideIcon = (hideEmoji && hideEmoji[1]) || (hideSpan && hideSpan[1]);
  const stripVS = (s: string | null | undefined) => (s || '').normalize('NFC').replace(/\uFE0F/g, '');
  expect(stripVS(showIcon || undefined)).toBe(stripVS(expected['SHOWDLGSCENE']));
  expect(stripVS(hideIcon || undefined)).toBe(stripVS(expected['HIDEDLGSCENE']));
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

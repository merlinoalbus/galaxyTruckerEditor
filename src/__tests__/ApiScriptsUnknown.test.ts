/** @jest-environment node */
/**
 * Integration check for /api/scripts unknown elements.
 * This test does not fail the suite; it reports findings to console.
 */

 type ScriptsListResponse = {
  success: boolean;
  data: Array<{ nomescript: string }>;
 };

 type ScriptBlocksResponse = {
  success: boolean;
  data: {
    name: string;
    blocks?: any[];
    parseErrors?: Array<{ error: string; line?: number }>;
  } | null;
 };

 const BASE_URL = 'http://localhost:3001';

 // Minimal Node HTTP(S) JSON getter to avoid fetch/CORS issues
 const httpGetJson = (urlStr: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const url = require('url');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const http = require('http');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const https = require('https');
    const u = url.parse(urlStr);
    const lib = u.protocol === 'https:' ? https : http;
    const options = { hostname: u.hostname, port: u.port, path: u.path, method: 'GET' };
    const req = lib.request(options, (res: any) => {
      let data = '';
      res.on('data', (chunk: any) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
 };

 const findUnknowns = (blocks: any[] = [], acc: { type: string; path: string }[] = [], path: string[] = []): { type: string; path: string }[] => {
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const currentPath = [...path, `${b.type || 'UNKNOWN'}[${i}]`];
    const bt = (b.type || '').toUpperCase();
    if (bt === 'UNKNOWN_COMMAND' || bt === 'UNKNOWN_BLOCK' || bt === 'UNKNOWN') {
      acc.push({ type: bt, path: currentPath.join(' > ') });
    }
    if (Array.isArray(b.children)) findUnknowns(b.children, acc, [...currentPath, 'children']);
    if (Array.isArray(b.thenBlocks)) findUnknowns(b.thenBlocks, acc, [...currentPath, 'thenBlocks']);
    if (Array.isArray(b.elseBlocks)) findUnknowns(b.elseBlocks, acc, [...currentPath, 'elseBlocks']);
    if (Array.isArray(b.elseBranch)) findUnknowns(b.elseBranch, acc, [...currentPath, 'elseBranch']);
  }
  return acc;
 };

 describe('API /api/scripts unknowns scan (node env)', () => {
  jest.setTimeout(120000);

  it('reports UNKNOWN elements/commands across all scripts', async () => {
    // @ts-ignore - use global fetch if available
    let listJson: ScriptsListResponse;
    try {
      listJson = await httpGetJson(`${BASE_URL}/api/scripts`);
    } catch (err) {
      console.warn('Backend not reachable on http://localhost:3001. Skipping scan.');
      return;
    }
    if (!listJson.success || !Array.isArray(listJson.data)) {
      console.warn('Unexpected /api/scripts response shape; skipping scan.');
      return;
    }

    const scripts = listJson.data.map(s => s.nomescript);
    const results: Array<{ script: string; unknowns: { type: string; path: string }[]; parseErrors: number }> = [];

    // Limit concurrency to avoid overwhelming server
    for (const name of scripts) {
      try {
  const json = await httpGetJson(`${BASE_URL}/api/scripts/${encodeURIComponent(name)}?format=blocks&lang=EN`);
        if (!json.success || !json.data) continue;
        const unknowns = findUnknowns(json.data.blocks || []);
        const parseErrors = json.data.parseErrors?.length || 0;
        results.push({ script: name, unknowns, parseErrors });
      } catch (_e) {
        // ignore individual script errors
      }
    }

    const withUnknowns = results.filter(r => r.unknowns.length > 0 || r.parseErrors > 0);
    const totalUnknowns = withUnknowns.reduce((sum, r) => sum + r.unknowns.length + r.parseErrors, 0);

    // Report summary
    // eslint-disable-next-line no-console
    console.log(`API Unknowns Scan: ${withUnknowns.length}/${results.length} scripts with UNKNOWN or parseErrors; total issues: ${totalUnknowns}`);
    if (withUnknowns.length > 0) {
      // Print first 5 details
      const sample = withUnknowns.slice(0, 5).map(r => ({ script: r.script, issues: r.unknowns.slice(0, 3), parseErrors: r.parseErrors }));
      // eslint-disable-next-line no-console
      console.log('Sample issues:', JSON.stringify(sample, null, 2));
    }

    // Do not fail the test; just report
    expect(results.length).toBeGreaterThan(0);
  });
 });
